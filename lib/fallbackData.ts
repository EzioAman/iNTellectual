import { PlayerRecord, MatchHistoryEntry, SquadMetrics } from "./types";
import { calculatePlayerScores, getTier } from "./valorantEngine";

export const FALLBACK_ROSTER_RAW = [
  {
    player: "Ez1o#9611",
    role: "Duelist" as const,
    agent: "Jett",
    aim: 8.5,
    utility: 7.0,
    comms: 7.5,
    entry: 9.5,
    clutch: 7.0,
    hs: 28.5,
    acs: 278.4,
    kd: 1.45,
  },
  {
    player: "ViperKing#AP",
    role: "Controller" as const,
    agent: "Omen",
    aim: 7.8,
    utility: 9.2,
    comms: 8.8,
    entry: 6.2,
    clutch: 8.4,
    hs: 24.2,
    acs: 235.0,
    kd: 1.25,
  },
  {
    player: "HunterX#EU",
    role: "Initiator" as const,
    agent: "Sova",
    aim: 8.2,
    utility: 9.0,
    comms: 8.5,
    entry: 8.0,
    clutch: 7.8,
    hs: 25.1,
    acs: 244.5,
    kd: 1.28,
  },
  {
    player: "Lockdown#007",
    role: "Sentinel" as const,
    agent: "Cypher",
    aim: 7.5,
    utility: 8.8,
    comms: 8.0,
    entry: 5.5,
    clutch: 9.2,
    hs: 23.8,
    acs: 228.0,
    kd: 1.22,
  },
  {
    player: "Warlord#IGL",
    role: "IGL" as const,
    agent: "Breach",
    aim: 7.2,
    utility: 8.5,
    comms: 9.8,
    entry: 7.0,
    clutch: 8.9,
    hs: 21.5,
    acs: 212.0,
    kd: 1.15,
  },
];

export const FALLBACK_PLAYERS: PlayerRecord[] = FALLBACK_ROSTER_RAW.map((r, i) => {
  const norm = calculatePlayerScores(
    r.role,
    { aim: r.aim, utility: r.utility, comms: r.comms, entry: r.entry, clutch: r.clutch },
    { hsPercent: r.hs, acs: r.acs, kd: r.kd }
  );
  const parts = r.player.split("#");
  const career = norm.overall;
  const form = Number((career + (Math.random() * 0.4 - 0.2)).toFixed(2));
  const consistency = Number((8.5 + (Math.random() * 1.2)).toFixed(2));
  const impact = Number(((career * 0.6) + (form * 0.25) + (consistency * 0.15)).toFixed(2));

  return {
    player: r.player,
    riotId: r.player,
    name: parts[0],
    tag: parts[1] ? `#${parts[1]}` : "",
    role: r.role,
    agent: r.agent,
    rawStats: { kd: r.kd, acs: r.acs, hsPercent: r.hs },
    coachScores: { aim: r.aim, utility: r.utility, comms: r.comms, entry: r.entry, clutch: r.clutch },
    normalized: norm,
    tier: getTier(career),
    careerRating: career,
    formRating: form,
    consistencyRating: consistency,
    impactRating: impact,
    rank: i + 1,
  };
}).sort((a, b) => b.careerRating - a.careerRating).map((p, i) => ({ ...p, rank: i + 1 }));

export const FALLBACK_MATCH_HISTORY: MatchHistoryEntry[] = [
  { date: "2026-03-24", player: "Ez1o#9611", role: "Duelist", agent: "Jett", aim: 8.5, utility: 7, comms: 7.5, entry: 9.5, clutch: 7, hs: 29.1, acs: 290.0, kd: 1.55, overall: 9.15 },
  { date: "2026-03-22", player: "Ez1o#9611", role: "Duelist", agent: "Reyna", aim: 8.2, utility: 6.8, comms: 7, entry: 9.0, clutch: 7, hs: 28.0, acs: 265.0, kd: 1.38, overall: 8.82 },
  { date: "2026-03-20", player: "Ez1o#9611", role: "Duelist", agent: "Jett", aim: 8.6, utility: 7.2, comms: 8, entry: 9.8, clutch: 7.5, hs: 28.5, acs: 280.2, kd: 1.42, overall: 9.05 },
  { date: "2026-03-24", player: "ViperKing#AP", role: "Controller", agent: "Omen", aim: 7.8, utility: 9.2, comms: 8.8, entry: 6.2, clutch: 8.4, hs: 24.2, acs: 235.0, kd: 1.25, overall: 8.65 },
  { date: "2026-03-22", player: "ViperKing#AP", role: "Controller", agent: "Clove", aim: 7.5, utility: 9.0, comms: 8.5, entry: 6.5, clutch: 8.0, hs: 23.5, acs: 228.0, kd: 1.20, overall: 8.40 },
  { date: "2026-03-24", player: "HunterX#EU", role: "Initiator", agent: "Sova", aim: 8.2, utility: 9.0, comms: 8.5, entry: 8.0, clutch: 7.8, hs: 25.1, acs: 244.5, kd: 1.28, overall: 8.78 },
  { date: "2026-03-24", player: "Lockdown#007", role: "Sentinel", agent: "Cypher", aim: 7.5, utility: 8.8, comms: 8.0, entry: 5.5, clutch: 9.2, hs: 23.8, acs: 228.0, kd: 1.22, overall: 8.52 },
  { date: "2026-03-24", player: "Warlord#IGL", role: "IGL", agent: "Breach", aim: 7.2, utility: 8.5, comms: 9.8, entry: 6.5, clutch: 8.9, hs: 21.5, acs: 212.0, kd: 1.15, overall: 8.60 },
];

export const FALLBACK_METRICS: SquadMetrics = {
  activePlayers: FALLBACK_PLAYERS.length,
  avgAcs: Number((FALLBACK_PLAYERS.reduce((a, b) => a + b.rawStats.acs, 0) / FALLBACK_PLAYERS.length).toFixed(1)),
  avgKd: Number((FALLBACK_PLAYERS.reduce((a, b) => a + b.rawStats.kd, 0) / FALLBACK_PLAYERS.length).toFixed(2)),
  avgHs: Number((FALLBACK_PLAYERS.reduce((a, b) => a + b.rawStats.hsPercent, 0) / FALLBACK_PLAYERS.length).toFixed(1)),
  mvpPlayer: FALLBACK_PLAYERS[0]?.player || "Ez1o#9611",
  mvpScore: FALLBACK_PLAYERS[0]?.careerRating || 9.15,
  topRole: "Duelist",
  actStartDate: "2026-03-18",
};
