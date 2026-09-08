"use client";

import React from "react";
import { PlayerRecord, MatchHistoryEntry } from "@/lib/types";
import { KineticStage } from "./KineticStage";
import { soundFx } from "@/lib/soundEngine";

interface OperativeDossierProps {
  players: PlayerRecord[];
  history: MatchHistoryEntry[];
  selectedPlayer: PlayerRecord;
  onSelectPlayer: (p: PlayerRecord) => void;
  onEvaluatePlayer?: (p: PlayerRecord) => void;
  onHoverAgent?: (agentName: string | null) => void;
  accentColor?: string;
}

export const OperativeDossier: React.FC<OperativeDossierProps> = ({
  players,
  history,
  selectedPlayer,
  onSelectPlayer,
  onEvaluatePlayer,
  onHoverAgent,
  accentColor = "#ff4655",
}) => {
  const pHistory = history.filter((h) => h.player.toLowerCase() === selectedPlayer.player.toLowerCase());
  const recentHistory = pHistory.slice(-10);

  // Radar points (8 axes)
  const radarAxes = [
    { label: "AIM", val: selectedPlayer.normalized.aim },
    { label: "UTILITY", val: selectedPlayer.normalized.utility },
    { label: "COMMS", val: selectedPlayer.normalized.comms },
    { label: "ENTRY", val: selectedPlayer.normalized.entry },
    { label: "CLUTCH", val: selectedPlayer.normalized.clutch },
    { label: "HS%", val: selectedPlayer.normalized.hs },
    { label: "ACS", val: selectedPlayer.normalized.acs },
    { label: "K/D", val: selectedPlayer.normalized.kd },
  ];

  const center = 150;
  const radius = 100;
  const totalAxes = radarAxes.length;

  const points = radarAxes.map((axis, i) => {
    const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
    const r = (axis.val / 10) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return `${x},${y}`;
  }).join(" ");

  // Spline points
  const splineWidth = 500;
  const splineHeight = 160;
  const splinePoints = recentHistory.map((m, i) => {
    const x = recentHistory.length > 1 ? (i / (recentHistory.length - 1)) * (splineWidth - 40) + 20 : splineWidth / 2;
    const y = splineHeight - (m.overall / 10) * (splineHeight - 40) - 20;
    return { x, y, score: m.overall, date: m.date, agent: m.agent };
  });

  const splinePath = splinePoints.reduce((acc, pt, i, arr) => {
    if (i === 0) return `M ${pt.x},${pt.y}`;
    const prev = arr[i - 1];
    const cp1x = prev.x + (pt.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (pt.x - prev.x) / 2;
    const cp2y = pt.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${pt.x},${pt.y}`;
  }, "");

  return (
    <div className="space-y-6">
      {/* OPERATIVE SELECTOR & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 backdrop-blur-md">
        <div>
          <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400 block">
            SELECTED OPERATIVE
          </span>
          <h2 className="font-teko text-3xl font-bold text-white uppercase tracking-wider">
            {selectedPlayer.name} <span style={{ color: accentColor }}>{selectedPlayer.tag}</span>
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedPlayer.player}
            onChange={(e) => {
              soundFx.playClick();
              const found = players.find((p) => p.player === e.target.value);
              if (found) {
                onSelectPlayer(found);
                if (onHoverAgent) onHoverAgent(found.agent);
              }
            }}
            className="bg-[#121624] border border-white/20 text-white text-xs font-bold rounded-lg px-4 py-2 outline-none focus:border-white/40"
          >
            {players.map((p) => (
              <option key={p.player} value={p.player}>
                {p.player} ({p.role} - {p.agent})
              </option>
            ))}
          </select>

          {onEvaluatePlayer && (
            <button
              onClick={() => {
                soundFx.playClick();
                onEvaluatePlayer(selectedPlayer);
              }}
              className="px-4 py-2 rounded-lg text-xs font-syncopate font-bold text-black tracking-wider transition-all transform hover:scale-105 active:scale-95 flex items-center gap-1.5 shadow-lg"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 15px ${accentColor}60`,
              }}
            >
              <span>COACH METRICS</span>
              <span>⚡</span>
            </button>
          )}
        </div>
      </div>

      {/* FULL KINETIC STAGE */}
      <KineticStage player={selectedPlayer} />

      {/* DIAGNOSTIC CARDS (4 COLS) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">
            COMBAT EFFICIENCY
          </span>
          <div className="font-teko text-3xl font-bold text-white mt-1">
            {((selectedPlayer.rawStats.acs / 265) * 10).toFixed(1)} / 10
          </div>
          <p className="text-xs text-slate-500">Benchmark Rating</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">
            CLUTCH FACTOR
          </span>
          <div className="font-teko text-3xl font-bold text-[#fbbf24] mt-1">
            {selectedPlayer.coachScores.clutch.toFixed(1)} / 10
          </div>
          <p className="text-xs text-slate-500">Coach Graded Composure</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">
            COMMS & ENTRY
          </span>
          <div className="font-teko text-3xl font-bold text-[#5bf8ff] mt-1">
            {((selectedPlayer.coachScores.comms + selectedPlayer.coachScores.entry) / 2).toFixed(1)} / 10
          </div>
          <p className="text-xs text-slate-500">Tactical Synergies</p>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 backdrop-blur-md">
          <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">
            IMPACT RATING
          </span>
          <div className="font-teko text-3xl font-bold text-[#10b981] mt-1">
            {selectedPlayer.impactRating.toFixed(2)} / 10
          </div>
          <p className="text-xs text-slate-500">Aggregated Weight</p>
        </div>
      </div>

      {/* RADAR, FORM SPLINE & BREAKDOWN (12 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* RADAR CHART (5 COLS) */}
        <div className="lg:col-span-5 rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md flex flex-col items-center">
          <div className="w-full mb-2 border-b border-white/10 pb-2">
            <h3 className="font-teko text-2xl font-bold text-white uppercase tracking-wider">
              Hexagonal Combat Radar
            </h3>
            <p className="text-xs text-slate-400">Normalized 8-axis competency distribution</p>
          </div>

          <div className="relative w-[300px] h-[300px] flex items-center justify-center">
            <svg viewBox="0 0 300 300" className="w-full h-full overflow-visible">
              {/* Concentric rings */}
              {[0.25, 0.5, 0.75, 1].map((scale, idx) => (
                <circle
                  key={idx}
                  cx={center}
                  cy={center}
                  r={radius * scale}
                  fill="none"
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray={scale === 1 ? "none" : "2,2"}
                />
              ))}

              {/* Axis rays */}
              {radarAxes.map((_, i) => {
                const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                const x = center + radius * Math.cos(angle);
                const y = center + radius * Math.sin(angle);
                return (
                  <line
                    key={i}
                    x1={center}
                    y1={center}
                    x2={x}
                    y2={y}
                    stroke="rgba(255,255,255,0.1)"
                  />
                );
              })}

              {/* Data polygon */}
              <polygon
                points={points}
                fill="rgba(255, 70, 85, 0.25)"
                stroke="#ff4655"
                strokeWidth="2"
              />

              {/* Vertex dots */}
              {radarAxes.map((axis, i) => {
                const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                const r = (axis.val / 10) * radius;
                const x = center + r * Math.cos(angle);
                const y = center + r * Math.sin(angle);
                return (
                  <circle
                    key={i}
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#ff4655"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                );
              })}

              {/* Axis labels */}
              {radarAxes.map((axis, i) => {
                const angle = (Math.PI * 2 * i) / totalAxes - Math.PI / 2;
                const labelRadius = radius + 22;
                const x = center + labelRadius * Math.cos(angle);
                const y = center + labelRadius * Math.sin(angle);
                return (
                  <text
                    key={i}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="text-[10px] font-mono fill-slate-400 font-bold"
                  >
                    {axis.label}
                  </text>
                );
              })}
            </svg>
          </div>
        </div>

        {/* SPLINE & SCORES BREAKDOWN (7 COLS) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Recent Form Trajectory */}
          <div className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 border-b border-white/10 pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-teko text-2xl font-bold text-white uppercase tracking-wider">
                  Performance Trajectory
                </h3>
                <p className="text-xs text-slate-400">Match score timeline across recent appearances</p>
              </div>
              <span className="text-xs font-mono text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded">
                Form: {selectedPlayer.formRating.toFixed(2)}
              </span>
            </div>

            {recentHistory.length > 1 ? (
              <div className="w-full overflow-hidden">
                <svg viewBox={`0 0 ${splineWidth} ${splineHeight}`} className="w-full h-36">
                  <defs>
                    <linearGradient id="splineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ff4655" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#ff4655" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal gridlines */}
                  {[2, 4, 6, 8, 10].map((val) => {
                    const y = splineHeight - (val / 10) * (splineHeight - 40) - 20;
                    return (
                      <line
                        key={val}
                        x1="20"
                        y1={y}
                        x2={splineWidth - 20}
                        y2={y}
                        stroke="rgba(255,255,255,0.05)"
                      />
                    );
                  })}

                  {/* Area fill */}
                  <path
                    d={`${splinePath} L ${splinePoints[splinePoints.length - 1].x},${splineHeight - 20} L ${splinePoints[0].x},${splineHeight - 20} Z`}
                    fill="url(#splineGrad)"
                  />

                  {/* Line */}
                  <path d={splinePath} fill="none" stroke="#ff4655" strokeWidth="2.5" />

                  {/* Points */}
                  {splinePoints.map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="4" fill="#ff4655" stroke="#ffffff" strokeWidth="1.5" />
                      <text
                        x={pt.x}
                        y={pt.y - 10}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-slate-300 font-bold"
                      >
                        {pt.score.toFixed(1)}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-slate-500 font-mono text-xs">
                Not enough historical records logged for curve rendering.
              </div>
            )}
          </div>

          {/* Detailed Metric Scores (Coach vs Stats) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coach Breakdown */}
            <div className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-4 backdrop-blur-md">
              <h4 className="font-teko text-xl font-bold text-[#5bf8ff] uppercase tracking-wider mb-2">
                Coaching Benchmarks
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Aim Rating", val: selectedPlayer.coachScores.aim },
                  { label: "Utility Rating", val: selectedPlayer.coachScores.utility },
                  { label: "Comms Rating", val: selectedPlayer.coachScores.comms },
                  { label: "Entry Rating", val: selectedPlayer.coachScores.entry },
                  { label: "Clutch Rating", val: selectedPlayer.coachScores.clutch },
                ].map((item) => (
                  <div key={item.label} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-mono font-bold text-white">{item.val.toFixed(1)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-[#ff4655] rounded-full"
                        style={{ width: `${(item.val / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mechanical Breakdown */}
            <div className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-4 backdrop-blur-md">
              <h4 className="font-teko text-xl font-bold text-[#10b981] uppercase tracking-wider mb-2">
                Mechanical Benchmarks
              </h4>
              <div className="space-y-2">
                {[
                  { label: "Headshot %", val: selectedPlayer.normalized.hs, raw: `${selectedPlayer.rawStats.hsPercent.toFixed(1)}%` },
                  { label: "Combat Score (ACS)", val: selectedPlayer.normalized.acs, raw: `${selectedPlayer.rawStats.acs.toFixed(0)}` },
                  { label: "Elimination (K/D)", val: selectedPlayer.normalized.kd, raw: `${selectedPlayer.rawStats.kd.toFixed(2)}` },
                ].map((item) => (
                  <div key={item.label} className="space-y-0.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">{item.label}</span>
                      <span className="font-mono font-bold text-emerald-400">
                        {item.raw} <span className="text-slate-500 text-[10px]">({item.val.toFixed(1)}/10)</span>
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-[#5bf8ff] rounded-full"
                        style={{ width: `${(item.val / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
