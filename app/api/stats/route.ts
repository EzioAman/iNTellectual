import { NextResponse } from "next/server";
import Papa from "papaparse";
import { PlayerRecord, MatchHistoryEntry, SquadMetrics, Role } from "@/lib/types";
import { calculatePlayerScores, getTier } from "@/lib/valorantEngine";
import { FALLBACK_PLAYERS, FALLBACK_MATCH_HISTORY, FALLBACK_METRICS } from "@/lib/fallbackData";

const SHEET_URL = "https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/export?format=csv&gid=0";
const HISTORY_URL = "https://docs.google.com/spreadsheets/d/1p5u4T--HBuZhsoFBUoZmLnYH7Qvk8m7Ts7flv7xVCW0/gviz/tq?tqx=out:csv&sheet=Data";

function cleanId(raw: string): string {
  if (!raw) return "";
  return raw.replace(/\u00a0/g, " ").trim().replace(/\s+/g, " ").replace(" #", "#");
}

export async function GET() {
  try {
    const [sheetRes, histRes] = await Promise.allSettled([
      fetch(SHEET_URL, { next: { revalidate: 30 } }),
      fetch(HISTORY_URL, { next: { revalidate: 30 } })
    ]);

    let rawPlayers: any[] = [];
    let rawHistory: any[] = [];

    if (sheetRes.status === "fulfilled" && sheetRes.value.ok) {
      const csvText = await sheetRes.value.text();
      const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
      rawPlayers = parsed.data as any[];
    }

    if (histRes.status === "fulfilled" && histRes.value.ok) {
      const histText = await histRes.value.text();
      const parsed = Papa.parse(histText, { header: true, skipEmptyLines: true });
      rawHistory = parsed.data as any[];
    }

    if (!rawPlayers || rawPlayers.length === 0) {
      return NextResponse.json({
        players: FALLBACK_PLAYERS,
        history: FALLBACK_MATCH_HISTORY,
        metrics: FALLBACK_METRICS,
        isFallback: true
      });
    }

    // Process history
    const matchHistory: MatchHistoryEntry[] = rawHistory
      .filter((r) => r.Player && r.Player.includes("#"))
      .map((r) => {
        const pId = cleanId(r.Player);
        const role = (r.Role || "Duelist") as Role;
        const hs = parseFloat(r["HS%"]) || 20;
        const acs = parseFloat(r.ACS) || 200;
        const kd = parseFloat(r.KD) || 1.0;
        const aim = parseFloat(r.Aim) || 7;
        const utility = parseFloat(r.Utility) || 7;
        const comms = parseFloat(r.Comms) || 7;
        const entry = parseFloat(r.Entry) || 7;
        const clutch = parseFloat(r.Clutch) || 7;

        const scores = calculatePlayerScores(role, { aim, utility, comms, entry, clutch }, { hsPercent: hs, acs, kd });
        return {
          date: r.Date || "2026-03-18",
          player: pId,
          role,
          agent: r.Agent || "Jett",
          aim,
          utility,
          comms,
          entry,
          clutch,
          hs,
          acs,
          kd,
          overall: scores.overall,
        };
      });

    // Process players
    const validPlayers = rawPlayers.filter((r) => r.Player && r.Player.includes("#"));
    const players: PlayerRecord[] = validPlayers.map((r, i) => {
      const pId = cleanId(r.Player);
      const parts = pId.split("#");
      const name = parts[0];
      const tag = parts[1] ? `#${parts[1]}` : "";
      const role = (r.Role || "Duelist") as Role;
      const agent = r.Agent || "Jett";

      const hs = parseFloat(r["HS%"]) || 22;
      const acs = parseFloat(r.ACS) || 220;
      const kd = parseFloat(r.KD) || 1.1;

      const aim = parseFloat(r.Aim) || 7.5;
      const utility = parseFloat(r.Utility) || 7.5;
      const comms = parseFloat(r.Comms) || 7.5;
      const entry = parseFloat(r.Entry) || 7.5;
      const clutch = parseFloat(r.Clutch) || 7.5;

      const norm = calculatePlayerScores(
        role,
        { aim, utility, comms, entry, clutch },
        { hsPercent: hs, acs, kd }
      );

      // Player history
      const pHistory = matchHistory.filter((h) => h.player.toLowerCase() === pId.toLowerCase());
      const career = norm.overall;
      const recentMatches = pHistory.slice(-3);
      const form = recentMatches.length > 0
        ? Number((recentMatches.reduce((acc, m) => acc + m.overall, 0) / recentMatches.length).toFixed(2))
        : career;

      const stdDev = pHistory.length > 1
        ? Math.sqrt(pHistory.reduce((acc, m) => acc + Math.pow(m.overall - career, 2), 0) / pHistory.length)
        : 0.5;

      const consistency = Number(Math.max(0, 10 - (stdDev * 4)).toFixed(2));
      const impact = Number(((career * 0.6) + (form * 0.25) + (consistency * 0.15)).toFixed(2));

      return {
        player: pId,
        riotId: pId,
        name,
        tag,
        role,
        agent,
        date: r.Date,
        rawStats: { kd, acs, hsPercent: hs },
        coachScores: { aim, utility, comms, entry, clutch },
        normalized: norm,
        tier: getTier(career),
        careerRating: career,
        formRating: form,
        consistencyRating: consistency,
        impactRating: impact,
        rank: i + 1,
      };
    });

    // Sort by career rating and re-rank
    players.sort((a, b) => b.careerRating - a.careerRating);
    players.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    const metrics: SquadMetrics = {
      activePlayers: players.length,
      avgAcs: players.length > 0 ? Number((players.reduce((a, b) => a + b.rawStats.acs, 0) / players.length).toFixed(1)) : 220,
      avgKd: players.length > 0 ? Number((players.reduce((a, b) => a + b.rawStats.kd, 0) / players.length).toFixed(2)) : 1.15,
      avgHs: players.length > 0 ? Number((players.reduce((a, b) => a + b.rawStats.hsPercent, 0) / players.length).toFixed(1)) : 22.5,
      mvpPlayer: players[0]?.player || "N/A",
      mvpScore: players[0]?.careerRating || 0,
      topRole: players[0]?.role || "Duelist",
      actStartDate: "2026-03-18",
    };

    return NextResponse.json({
      players,
      history: matchHistory.length > 0 ? matchHistory : FALLBACK_MATCH_HISTORY,
      metrics,
      isFallback: false
    });
  } catch (err: any) {
    return NextResponse.json({
      players: FALLBACK_PLAYERS,
      history: FALLBACK_MATCH_HISTORY,
      metrics: FALLBACK_METRICS,
      isFallback: true,
      error: err.message
    });
  }
}
