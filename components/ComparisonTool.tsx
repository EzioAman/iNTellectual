"use client";

import React, { useState } from "react";
import { PlayerRecord } from "@/lib/types";
import { getAgent } from "@/lib/agentData";

interface ComparisonToolProps {
  players: PlayerRecord[];
}

export const ComparisonTool: React.FC<ComparisonToolProps> = ({ players }) => {
  const [playerAId, setPlayerAId] = useState<string>(players[0]?.player || "");
  const [playerBId, setPlayerBId] = useState<string>(players[1]?.player || players[0]?.player || "");

  const playerA = players.find((p) => p.player === playerAId) || players[0];
  const playerB = players.find((p) => p.player === playerBId) || players[1] || players[0];

  const agentA = getAgent(playerA?.agent);
  const agentB = getAgent(playerB?.agent);

  // Radar points for both players
  const radarAxes = [
    { label: "AIM", key: "aim" },
    { label: "UTILITY", key: "utility" },
    { label: "COMMS", key: "comms" },
    { label: "ENTRY", key: "entry" },
    { label: "CLUTCH", key: "clutch" },
    { label: "HS%", key: "hs" },
    { label: "ACS", key: "acs" },
    { label: "K/D", key: "kd" },
  ] as const;

  const center = 150;
  const radius = 100;
  const totalAxes = radarAxes.length;

  const pointsA = radarAxes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
    const val = playerA ? playerA.normalized[axis.key] : 5;
    const r = (val / 10) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(" ");

  const pointsB = radarAxes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
    const val = playerB ? playerB.normalized[axis.key] : 5;
    const r = (val / 10) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(" ");

  if (!playerA || !playerB) {
    return <div className="text-white p-6">Need at least 2 operatives to compare.</div>;
  }

  const deltaOverall = playerA.careerRating - playerB.careerRating;
  const deltaAcs = playerA.rawStats.acs - playerB.rawStats.acs;
  const deltaKd = playerA.rawStats.kd - playerB.rawStats.kd;
  const deltaHs = playerA.rawStats.hsPercent - playerB.rawStats.hsPercent;

  return (
    <div className="space-y-6">
      {/* HEADER & SELECTORS */}
      <div className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md">
        <div className="text-center mb-6">
          <span className="text-[10px] font-syncopate uppercase tracking-widest text-[#ff4655]">
            TACTICAL SIMULATION
          </span>
          <h2 className="font-teko text-4xl font-bold uppercase tracking-wider text-white">
            ⚔️ Head-to-Head Operative Comparison
          </h2>
          <p className="text-xs text-slate-400">Evaluate Combat Matchups & Team Roster Chemistry</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Operative A Selector */}
          <div className="p-4 rounded-lg bg-black/40 border border-[#ff4655]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agentA.displayIcon}
                alt={agentA.name}
                className="w-12 h-12 rounded-md object-cover border border-[#ff4655]"
              />
              <div>
                <span className="text-[10px] font-syncopate text-[#ff4655] font-bold">OPERATIVE ALPHA</span>
                <div className="font-bold text-white text-base">{playerA.name}</div>
                <div className="text-xs text-slate-400">{playerA.role} • {agentA.name}</div>
              </div>
            </div>

            <select
              value={playerAId}
              onChange={(e) => setPlayerAId(e.target.value)}
              className="bg-[#121624] border border-white/20 text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none"
            >
              {players.map((p) => (
                <option key={p.player} value={p.player}>
                  {p.player}
                </option>
              ))}
            </select>
          </div>

          {/* Operative B Selector */}
          <div className="p-4 rounded-lg bg-black/40 border border-[#5bf8ff]/40 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={agentB.displayIcon}
                alt={agentB.name}
                className="w-12 h-12 rounded-md object-cover border border-[#5bf8ff]"
              />
              <div>
                <span className="text-[10px] font-syncopate text-[#5bf8ff] font-bold">OPERATIVE BETA</span>
                <div className="font-bold text-white text-base">{playerB.name}</div>
                <div className="text-xs text-slate-400">{playerB.role} • {agentB.name}</div>
              </div>
            </div>

            <select
              value={playerBId}
              onChange={(e) => setPlayerBId(e.target.value)}
              className="bg-[#121624] border border-white/20 text-white text-xs font-bold rounded-lg px-3 py-1.5 outline-none"
            >
              {players.map((p) => (
                <option key={p.player} value={p.player}>
                  {p.player}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* DUAL RADAR & COMPARISON METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OVERLAID DUAL RADAR (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-teko text-2xl font-bold uppercase tracking-wider text-white">Dual Combat Polygon</h3>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#ff4655] font-bold">
                  <span className="w-3 h-1 bg-[#ff4655] rounded-full inline-block" /> {playerA.name}
                </span>
                <span className="flex items-center gap-1 text-[#5bf8ff] font-bold">
                  <span className="w-3 h-1 bg-[#5bf8ff] rounded-full inline-block" /> {playerB.name}
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-400">Direct Competency Overlay on identical role scales</p>
          </div>

          <div className="flex justify-center items-center py-4">
            <svg width="300" height="300" className="overflow-visible">
              {[0.25, 0.5, 0.75, 1.0].map((level) => {
                const r = radius * level;
                const gridPoints = radarAxes.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                  return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                }).join(" ");
                return <polygon key={level} points={gridPoints} fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />;
              })}

              {radarAxes.map((axis, i) => {
                const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                const labelX = center + (radius + 20) * Math.cos(angle);
                const labelY = center + (radius + 15) * Math.sin(angle);
                return (
                  <g key={axis.label}>
                    <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
                    <text x={labelX} y={labelY} fill="#94a3b8" fontSize="9" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
                      {axis.label}
                    </text>
                  </g>
                );
              })}

              {/* Player A Polygon (Red) */}
              <polygon points={pointsA} fill="rgba(255, 70, 85, 0.25)" stroke="#ff4655" strokeWidth="2.5" />
              {/* Player B Polygon (Cyan) */}
              <polygon points={pointsB} fill="rgba(91, 248, 255, 0.25)" stroke="#5bf8ff" strokeWidth="2.5" />
            </svg>
          </div>

          <div className="text-center text-[10px] text-slate-500 font-syncopate tracking-wider">
            RADIANITE COMPARISON ALGORITHM // BENCHMARKED
          </div>
        </div>

        {/* COMPARISON METRIC DELTAS (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md">
          <h3 className="font-teko text-2xl font-bold uppercase tracking-wider text-white mb-4">
            Combat Metric Deltas
          </h3>

          <div className="space-y-3">
            {[
              {
                label: "Overall Career Rating",
                valA: playerA.careerRating.toFixed(2),
                valB: playerB.careerRating.toFixed(2),
                delta: deltaOverall,
                suffix: "",
              },
              {
                label: "Average Combat Score (ACS)",
                valA: playerA.rawStats.acs.toFixed(0),
                valB: playerB.rawStats.acs.toFixed(0),
                delta: deltaAcs,
                suffix: "",
              },
              {
                label: "Elimination Ratio (K/D)",
                valA: playerA.rawStats.kd.toFixed(2),
                valB: playerB.rawStats.kd.toFixed(2),
                delta: deltaKd,
                suffix: "",
              },
              {
                label: "Headshot Accuracy (HS%)",
                valA: `${playerA.rawStats.hsPercent.toFixed(1)}%`,
                valB: `${playerB.rawStats.hsPercent.toFixed(1)}%`,
                delta: deltaHs,
                suffix: "%",
              },
              {
                label: "Recent Form Trend",
                valA: playerA.formRating.toFixed(2),
                valB: playerB.formRating.toFixed(2),
                delta: playerA.formRating - playerB.formRating,
                suffix: "",
              },
              {
                label: "Competitive Impact Value",
                valA: playerA.impactRating.toFixed(2),
                valB: playerB.impactRating.toFixed(2),
                delta: playerA.impactRating - playerB.impactRating,
                suffix: "",
              },
            ].map((stat) => {
              const aWins = stat.delta > 0;
              const bWins = stat.delta < 0;

              return (
                <div
                  key={stat.label}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-white/[0.02] border border-white/5"
                >
                  <div className="w-1/3 text-left">
                    <span className={`font-teko text-2xl font-bold ${aWins ? "text-[#ff4655]" : "text-slate-300"}`}>
                      {stat.valA}
                    </span>
                    {aWins && <span className="text-[10px] text-emerald-400 ml-2 font-mono">+{stat.delta.toFixed(1)}</span>}
                  </div>

                  <div className="w-1/3 text-center text-xs font-bold text-slate-400 tracking-wider uppercase">
                    {stat.label}
                  </div>

                  <div className="w-1/3 text-right">
                    {bWins && <span className="text-[10px] text-emerald-400 mr-2 font-mono">+{Math.abs(stat.delta).toFixed(1)}</span>}
                    <span className={`font-teko text-2xl font-bold ${bWins ? "text-[#5bf8ff]" : "text-slate-300"}`}>
                      {stat.valB}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
