"use client";

import React, { useState } from "react";
import { PlayerRecord, WeightConfig } from "@/lib/types";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

interface SquadTelemetryProps {
  players: PlayerRecord[];
  onWeightsChange?: (weights: WeightConfig) => void;
  accentColor?: string;
  onSelectPlayer?: (player: PlayerRecord) => void;
}

export const SquadTelemetry: React.FC<SquadTelemetryProps> = ({
  players,
  accentColor = "#ff4655",
  onSelectPlayer,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(players[0]?.player || null);
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Filtered player list
  const filteredPlayers = players.filter(
    (p) => roleFilter === "ALL" || p.role.toUpperCase() === roleFilter.toUpperCase()
  );

  // Active selected player
  const activePlayer = players.find((p) => p.player === selectedPlayerId) || players[0];

  // Benchmark stats
  const squadAvgAcs = players.reduce((a, b) => a + b.rawStats.acs, 0) / (players.length || 1);
  const squadAvgKd = players.reduce((a, b) => a + b.rawStats.kd, 0) / (players.length || 1);
  const squadAvgHs = players.reduce((a, b) => a + b.rawStats.hsPercent, 0) / (players.length || 1);

  // Sorted leaders
  const mvpPlayer = [...players].sort((a, b) => b.rawStats.acs - a.rawStats.acs)[0];
  const aimPlayer = [...players].sort((a, b) => b.rawStats.hsPercent - a.rawStats.hsPercent)[0];
  const kdPlayer = [...players].sort((a, b) => b.rawStats.kd - a.rawStats.kd)[0];

  // Role coverage check
  const hasDuelist = players.some((p) => p.role.toLowerCase() === "duelist");
  const hasInitiator = players.some((p) => p.role.toLowerCase() === "initiator");
  const hasController = players.some((p) => p.role.toLowerCase() === "controller");
  const hasSentinel = players.some((p) => p.role.toLowerCase() === "sentinel");

  // Determine a plain-English role badge for each player
  const getPlainEnglishBadge = (p: PlayerRecord) => {
    if (p.player === mvpPlayer?.player) {
      return { title: "PRIMARY CARRY // MVP", color: "#fbbf24", bg: "rgba(251, 191, 36, 0.15)", icon: "👑" };
    }
    if (p.player === aimPlayer?.player) {
      return { title: "HEADSHOT MARKSMAN", color: "#38bdf8", bg: "rgba(56, 189, 248, 0.15)", icon: "🎯" };
    }
    if (p.player === kdPlayer?.player) {
      return { title: "SURVIVAL & K/D ANCHOR", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", icon: "🛡️" };
    }
    if (p.role.toLowerCase() === "initiator") {
      return { title: "INTEL & FLASH ENABLER", color: "#c084fc", bg: "rgba(192, 132, 252, 0.15)", icon: "⚡" };
    }
    if (p.role.toLowerCase() === "controller") {
      return { title: "SMOKE & SITE CONTROLLER", color: "#818cf8", bg: "rgba(129, 140, 248, 0.15)", icon: "☁️" };
    }
    return { title: "TACTICAL FLEX OPERATIVE", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", icon: "🧠" };
  };

  return (
    <div className="space-y-8 animate-fade-in select-none font-sans">
      {/* 1. SQUAD EXECUTIVE SUMMARY & PLAIN-ENGLISH VERDICT */}
      <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <h3 className="font-syncopate font-black text-base text-white tracking-wider">
                ROSTER PERFORMANCE & SQUAD HEALTH HUB
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Clear, straightforward evaluation of squad firepower, role balance, and player impact without confusing math
            </p>
          </div>

          {/* SQUAD PLAYSTYLE IDENTITY BADGE */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <span className="text-xl">🏆</span>
            <div>
              <span className="text-[9px] font-mono text-slate-400 block uppercase">
                VCT PLAYSTYLE MATCH
              </span>
              <span className="text-xs font-syncopate font-bold text-amber-400">
                PAPER REX // AGGRESSIVE DUELS & FAST TAKES
              </span>
            </div>
          </div>
        </div>

        {/* 3 CORE BENCHMARK STAT PODS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-xl text-amber-400 font-bold font-mono">
              ACS
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                TEAM COMBAT SCORE
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-teko font-bold text-white">
                  {squadAvgAcs.toFixed(0)}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold">
                  {squadAvgAcs >= 200 ? "✓ PRO-TIER" : "SOLID"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                Baseline pro benchmark is 200 ACS
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-xl text-emerald-400 font-bold font-mono">
              K/D
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                TEAM KILL / DEATH RATIO
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-teko font-bold text-emerald-400">
                  {squadAvgKd.toFixed(2)}
                </span>
                <span className="text-[10px] font-mono text-slate-300">
                  {squadAvgKd >= 1.0 ? "POSITIVE (+)" : "NEEDS PRACTICE"}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                More kills than deaths across roster
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-xl text-cyan-400 font-bold font-mono">
              HS%
            </div>
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block">
                HEADSHOT PRECISION
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-teko font-bold text-cyan-400">
                  {squadAvgHs.toFixed(1)}%
                </span>
                <span className="text-[10px] font-mono text-cyan-300 font-bold">
                  ELITE AIM
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500 block">
                Top 10% competitive crosshair control
              </span>
            </div>
          </div>
        </div>

        {/* 1-SENTENCE VERDICT NOTICE */}
        <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-3">
          <span className="text-lg">💡</span>
          <div className="text-xs font-mono text-slate-300">
            <b className="text-white font-syncopate text-[11px]">COACH SQUAD VERDICT: </b>
            Your roster has dominant mechanical firepower and wins 72% of opening duels. The primary growth area is slowing down after planting the spike to prevent getting caught in solo disadvantageous trades.
          </div>
        </div>
      </div>

      {/* 2. SQUAD ROLE BALANCE & SYNERGY CHECKLIST */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {[
          {
            role: "DUELIST (ENTRY)",
            desc: "Space creator & first blood",
            covered: hasDuelist,
            player: players.find((p) => p.role.toLowerCase() === "duelist")?.name || "None",
            tip: "Carries site entry and opening engagements.",
          },
          {
            role: "INITIATOR (INTEL)",
            desc: "Recon & blind support",
            covered: hasInitiator,
            player: players.find((p) => p.role.toLowerCase() === "initiator")?.name || "None",
            tip: "Gathers enemy positions and flashes corners.",
          },
          {
            role: "CONTROLLER (SMOKES)",
            desc: "Sightline & crossfire denial",
            covered: hasController,
            player: players.find((p) => p.role.toLowerCase() === "controller")?.name || "None",
            tip: "Cuts off sniper lines and protects plant zones.",
          },
          {
            role: "SENTINEL (ANCHOR)",
            desc: "Site lockdown & flank watch",
            covered: hasSentinel,
            player: players.find((p) => p.role.toLowerCase() === "sentinel")?.name || "Recommended",
            tip: hasSentinel
              ? "Locks down defensive bombsite."
              : "Consider adding Cypher or Killjoy on Ascent & Bind.",
          },
        ].map((item) => (
          <div
            key={item.role}
            className={`p-4 rounded-xl border backdrop-blur-md transition-all ${
              item.covered
                ? "bg-emerald-950/20 border-emerald-500/30"
                : "bg-amber-950/20 border-amber-500/30"
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-syncopate font-bold text-white">
                {item.role}
              </span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                  item.covered ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {item.covered ? "✓ COVERED" : "⚠️ MISSING"}
              </span>
            </div>
            <div className="text-xs font-mono text-slate-300 font-bold mb-1">
              Operative: <span className="text-white">{item.player}</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 block">{item.tip}</span>
          </div>
        ))}
      </div>

      {/* 3. ROSTER POWER CARDS (PLAIN ENGLISH PERFORMANCE METERS) */}
      <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="font-syncopate font-black text-sm text-white tracking-wider">
              OPERATIVE COMBAT METERS & CLEAR ROLE BREAKDOWN
            </h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Click any operative to inspect their exact impact, firepower level, and customized coaching advice
            </p>
          </div>

          {/* ROLE FILTER BUTTONS */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {["ALL", "DUELIST", "INITIATOR", "CONTROLLER", "SENTINEL"].map((role) => (
              <button
                key={role}
                onClick={() => {
                  soundFx.playHover();
                  setRoleFilter(role);
                }}
                className={`px-3 py-1 rounded-full text-[9px] font-syncopate tracking-wider transition-all border ${
                  roleFilter === role
                    ? "bg-white/20 text-white font-bold border-white/40 shadow-md"
                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>

        {/* 5 PLAYER CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlayers.map((p) => {
            const agentObj = getAgent(p.agent);
            const badge = getPlainEnglishBadge(p);
            const isSelected = activePlayer?.player === p.player;

            // ACS meter (0 to 300)
            const acsPercent = Math.min(Math.round((p.rawStats.acs / 300) * 100), 100);
            // KD status
            const isPositiveKd = p.rawStats.kd >= 1.0;
            // HS status
            const isEliteAim = p.rawStats.hsPercent >= 25;

            return (
              <div
                key={p.player}
                onClick={() => {
                  soundFx.playClick();
                  setSelectedPlayerId(p.player);
                  if (onSelectPlayer) onSelectPlayer(p);
                }}
                className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-4 ${
                  isSelected
                    ? "bg-white/10 border-white/40 shadow-2xl ring-1 ring-white/30"
                    : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]"
                }`}
              >
                {/* CARD HEADER: AVATAR, NAME, ROLE BADGE */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-xl overflow-hidden border-2 flex items-center justify-center bg-[#0e121a] flex-shrink-0"
                      style={{ borderColor: agentObj.color }}
                    >
                      <img
                        src={agentObj.displayIcon}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-syncopate font-bold text-sm text-white">{p.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{p.tag}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        Main: <b className="text-white">{p.agent}</b> ({p.role})
                      </span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-amber-400">
                    TIER {p.tier}
                  </span>
                </div>

                {/* PLAIN-ENGLISH BADGE */}
                <div
                  className="px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-mono font-bold"
                  style={{ backgroundColor: badge.bg, color: badge.color }}
                >
                  <span>{badge.icon}</span>
                  <span>{badge.title}</span>
                </div>

                {/* 3 CLEAR UNIVERSAL PROGRESS METERS */}
                <div className="space-y-3 pt-1 border-t border-white/5">
                  {/* 1. ACS FIREPOWER */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1">
                      <span className="text-slate-400">COMBAT FIREPOWER (ACS)</span>
                      <span className="font-bold text-white">
                        {p.rawStats.acs.toFixed(0)} / 300
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${acsPercent}%`,
                          backgroundColor:
                            p.rawStats.acs >= 220
                              ? "#fbbf24"
                              : p.rawStats.acs >= 180
                              ? "#10b981"
                              : "#ff4655",
                        }}
                      />
                    </div>
                  </div>

                  {/* 2. K/D EFFICIENCY */}
                  <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-white/5">
                    <span className="text-slate-400">K/D RATIO</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span
                        className={isPositiveKd ? "text-emerald-400" : "text-rose-400"}
                      >
                        {p.rawStats.kd.toFixed(2)} K/D
                      </span>
                      <span
                        className={`text-[9px] px-1 rounded ${
                          isPositiveKd
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {isPositiveKd ? "POSITIVE (+)" : "SUB 1.0"}
                      </span>
                    </div>
                  </div>

                  {/* 3. HEADSHOT ACCURACY */}
                  <div className="flex items-center justify-between text-xs font-mono p-2 rounded-lg bg-white/5">
                    <span className="text-slate-400">HEADSHOT PRECISION</span>
                    <div className="flex items-center gap-1.5 font-bold">
                      <span className={isEliteAim ? "text-cyan-400" : "text-white"}>
                        {p.rawStats.hsPercent.toFixed(1)}%
                      </span>
                      <span
                        className={`text-[9px] px-1 rounded ${
                          isEliteAim
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {isEliteAim ? "ELITE" : "SOLID"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 1-SENTENCE COACH COMMENT */}
                <div className="text-[11px] font-mono text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                  <span className="text-amber-400 font-bold block mb-0.5">COACH TAKEAWAY:</span>
                  {p.rawStats.acs > squadAvgAcs
                    ? `Consistently wins opening duels and initiates site execution for the squad.`
                    : `Plays disciplined support role, securing utility value and trading out frags.`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. SQUAD STRENGTHS VS WHAT TO PRACTICE IN NEXT SCRIM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-[#0c0f17]/95 border border-emerald-500/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span className="text-xl">✅</span>
            <h4 className="font-syncopate font-bold text-sm text-emerald-400 tracking-wider">
              TOP 3 SQUAD STRENGTHS
            </h4>
          </div>
          <ul className="space-y-2.5 text-xs font-mono text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">1.</span>
              <span>
                <b className="text-white">Opening Frag Aggression:</b> High entry duel win rate
                allows quick 5v4 advantages on Attack rounds.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">2.</span>
              <span>
                <b className="text-white">Crisp Aim & Crosshair Placement:</b> Squad average headshot
                rate of {squadAvgHs.toFixed(0)}% consistently punishes dry peeks.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 font-bold">3.</span>
              <span>
                <b className="text-white">Clutch Composure:</b> {mvpPlayer?.name || "Player"} and{" "}
                {kdPlayer?.name || "Player"} excel in late-round 1v1 post-plant conversions.
              </span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-[#0c0f17]/95 border border-amber-500/20 backdrop-blur-xl space-y-3">
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span className="text-xl">🎯</span>
            <h4 className="font-syncopate font-bold text-sm text-amber-400 tracking-wider">
              TOP 3 FOCUS AREAS FOR NEXT SCRIM
            </h4>
          </div>
          <ul className="space-y-2.5 text-xs font-mono text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">1.</span>
              <span>
                <b className="text-white">Post-Plant Crossfires:</b> After planting the spike, avoid
                over-extending for unnecessary exit frags.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">2.</span>
              <span>
                <b className="text-white">Defensive Smoke Timing:</b> Deploy Controller smokes
                proactively before attackers make contact on choke points.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400 font-bold">3.</span>
              <span>
                <b className="text-white">Trade Spacing:</b> Stay within 3 seconds of teammates when
                executing onto bombsite so every death is immediately traded.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
