"use client";

import React from "react";
import { PlayerRecord, SquadMetrics } from "@/lib/types";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

interface CommandOverviewProps {
  players: PlayerRecord[];
  metrics: SquadMetrics;
  onSelectPlayer: (player: PlayerRecord) => void;
  onEvaluatePlayer?: (player: PlayerRecord) => void;
  onHoverAgent?: (agentName: string | null) => void;
  accentColor: string;
}

export const CommandOverview: React.FC<CommandOverviewProps> = ({
  players,
  metrics,
  onSelectPlayer,
  onEvaluatePlayer,
  onHoverAgent,
  accentColor,
}) => {
  const mvp = players[0] || null;

  // Best by role
  const roleChampions = ["Duelist", "Initiator", "Controller", "Sentinel", "IGL"].map((role) => {
    const rolePlayers = players.filter((p) => p.role === role);
    if (rolePlayers.length === 0) return null;
    return rolePlayers.reduce((best, cur) => (cur.careerRating > best.careerRating ? cur : best), rolePlayers[0]);
  }).filter(Boolean) as PlayerRecord[];

  // Role average ratings
  const roleAverages = ["Duelist", "Initiator", "Controller", "Sentinel", "IGL"].map((role) => {
    const rPlayers = players.filter((p) => p.role === role);
    const avg = rPlayers.length > 0 ? rPlayers.reduce((acc, p) => acc + p.careerRating, 0) / rPlayers.length : 0;
    return { role, avg: Number(avg.toFixed(2)) };
  });

  return (
    <div className="space-y-6">
      {/* EXECUTIVE KPI STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 border-l-4 border-l-[#ff4655] backdrop-blur-md transition-transform hover:-translate-y-1">
          <div className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">ACTIVE SQUAD</div>
          <div className="font-teko text-4xl font-bold text-white leading-tight mt-1">
            {metrics.activePlayers} PLAYERS
          </div>
          <div className="text-xs text-slate-500">Autonomous Database Ready</div>
        </div>

        <div
          onMouseEnter={() => {
            if (mvp && onHoverAgent) onHoverAgent(mvp.agent);
          }}
          className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 border-l-4 border-l-[#fbbf24] backdrop-blur-md transition-transform hover:-translate-y-1 cursor-pointer"
        >
          <div className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">ROSTER MVP</div>
          <div className="font-teko text-4xl font-bold text-[#fbbf24] leading-tight mt-1 truncate">
            {mvp ? mvp.name : "N/A"}
          </div>
          <div className="text-xs text-slate-500">
            Rating: <b className="text-white">{mvp ? mvp.careerRating.toFixed(2) : 0}</b> / 10
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 border-l-4 border-l-[#5bf8ff] backdrop-blur-md transition-transform hover:-translate-y-1">
          <div className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">SQUAD AVG ACS</div>
          <div className="font-teko text-4xl font-bold text-[#5bf8ff] leading-tight mt-1">
            {metrics.avgAcs}
          </div>
          <div className="text-xs text-slate-500">Benchmark Target: 220.0</div>
        </div>

        <div className="p-4 rounded-xl bg-[#0e121a]/80 border border-white/10 border-l-4 border-l-[#10b981] backdrop-blur-md transition-transform hover:-translate-y-1">
          <div className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">SQUAD K/D & HS%</div>
          <div className="font-teko text-4xl font-bold text-[#10b981] leading-tight mt-1">
            {metrics.avgKd} <span className="text-lg text-slate-400 font-mono">/ {metrics.avgHs}%</span>
          </div>
          <div className="text-xs text-slate-500">Aggregated Combat Ratio</div>
        </div>
      </div>

      {/* SQUAD ROSTER AND ROLE POWER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEADERBOARD TABLE (7 cols) */}
        <div
          onMouseLeave={() => {
            if (onHoverAgent) onHoverAgent(null);
          }}
          className="lg:col-span-7 rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md"
        >
          <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
            <div>
              <h2 className="font-teko text-2xl font-bold uppercase tracking-wider text-white">
                🏆 Squad Leaderboard & Operative Standings
              </h2>
              <p className="text-xs text-slate-400">Hover operative to project live battle portrait</p>
            </div>
            <span className="text-xs font-mono text-slate-500">{players.length} Operatives</span>
          </div>

          <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
            {players.map((p, idx) => {
              const agent = getAgent(p.agent);
              return (
                <div
                  key={p.player}
                  onClick={() => {
                    soundFx.playClick();
                    onSelectPlayer(p);
                  }}
                  onMouseEnter={() => {
                    soundFx.playHover();
                    if (onHoverAgent) onHoverAgent(p.agent);
                  }}
                  className="group flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/20 hover:bg-white/[0.05] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agent.displayIcon}
                        alt={p.player}
                        className="w-12 h-12 rounded-lg object-cover border border-white/10 group-hover:scale-105 transition-transform"
                      />
                      {idx === 0 && (
                        <div className="absolute -top-1 -right-1 bg-[#fbbf24] text-black text-[9px] font-black px-1 rounded-sm shadow-md">
                          MVP
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <b className="text-base text-white group-hover:text-[#5bf8ff] transition-colors">{p.name}</b>
                        <span className="text-xs text-slate-500">{p.tag}</span>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm"
                          style={{
                            backgroundColor: p.role === "Duelist" ? "#ff4655" : p.role === "Controller" ? "#3b82f6" : p.role === "Initiator" ? "#10b981" : "#f59e0b",
                            color: "#ffffff",
                          }}
                        >
                          {p.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">Agent: {agent.name.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-right">
                    <div className="hidden sm:block">
                      <div className="text-[9px] font-syncopate text-slate-500">ACS</div>
                      <div className="font-teko text-xl font-bold text-white leading-none">
                        {p.rawStats.acs.toFixed(0)}
                      </div>
                    </div>

                    <div className="hidden sm:block">
                      <div className="text-[9px] font-syncopate text-slate-500">K/D</div>
                      <div className="font-teko text-xl font-bold text-white leading-none">
                        {p.rawStats.kd.toFixed(2)}
                      </div>
                    </div>

                    <div
                      className={`font-teko text-2xl font-bold px-3 py-0.5 rounded-md border text-center min-w-[70px] ${
                        p.tier === "S"
                          ? "bg-amber-400/20 text-amber-300 border-amber-400/50 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                          : p.tier === "A"
                          ? "bg-cyan-400/20 text-cyan-300 border-cyan-400/50"
                          : "bg-purple-400/20 text-purple-300 border-purple-400/50"
                      }`}
                    >
                      {p.tier} ({p.careerRating.toFixed(2)})
                    </div>

                    {/* EVALUATE BUTTON */}
                    {onEvaluatePlayer && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          soundFx.playClick();
                          onEvaluatePlayer(p);
                        }}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-syncopate text-slate-300 hover:text-white transition-colors"
                        title="Open Coach Metrics Studio"
                      >
                        METRICS
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ROLE CHAMPIONS & SQUAD DISTRIBUTION (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* ROLE CHAMPIONS */}
          <div
            onMouseLeave={() => {
              if (onHoverAgent) onHoverAgent(null);
            }}
            className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md"
          >
            <div className="mb-4 border-b border-white/10 pb-2">
              <h2 className="font-teko text-2xl font-bold uppercase tracking-wider text-[#fbbf24]">
                👑 Role Champions
              </h2>
              <p className="text-xs text-slate-400">Top Rated Operative for each Tactical Discipline</p>
            </div>

            <div className="space-y-3">
              {roleChampions.map((champ) => {
                const agent = getAgent(champ.agent);
                return (
                  <div
                    key={champ.player}
                    onClick={() => {
                      soundFx.playClick();
                      onSelectPlayer(champ);
                    }}
                    onMouseEnter={() => {
                      soundFx.playHover();
                      if (onHoverAgent) onHoverAgent(champ.agent);
                    }}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={agent.displayIcon}
                        alt={champ.player}
                        className="w-10 h-10 rounded-md object-cover border border-white/10"
                      />
                      <div>
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm inline-block mb-0.5"
                          style={{
                            backgroundColor: champ.role === "Duelist" ? "#ff4655" : champ.role === "Controller" ? "#3b82f6" : champ.role === "Initiator" ? "#10b981" : "#f59e0b",
                            color: "#ffffff",
                          }}
                        >
                          {champ.role}
                        </span>
                        <div className="font-bold text-white text-sm">{champ.name}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <div className="font-teko text-3xl font-bold text-[#ff4655] leading-none">
                          {champ.careerRating.toFixed(2)}
                        </div>
                        <div className="text-[9px] font-syncopate text-slate-500 uppercase">SCORE</div>
                      </div>

                      {onEvaluatePlayer && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            soundFx.playClick();
                            onEvaluatePlayer(champ);
                          }}
                          className="px-2 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[9px] font-syncopate text-slate-300 hover:text-white transition-colors"
                        >
                          METRICS
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ROLE POWER BARS */}
          <div className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md">
            <div className="mb-4 border-b border-white/10 pb-2">
              <h2 className="font-teko text-2xl font-bold uppercase tracking-wider text-[#5bf8ff]">
                ⚡ Squad Role Power
              </h2>
              <p className="text-xs text-slate-400">Average Competitive Rating by Role</p>
            </div>

            <div className="space-y-3">
              {roleAverages.map((ra) => (
                <div key={ra.role} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white">{ra.role}</span>
                    <span className="font-mono text-slate-300 font-bold">{ra.avg} / 10</span>
                  </div>
                  <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(ra.avg / 10) * 100}%`,
                        backgroundColor:
                          ra.role === "Duelist" ? "#ff4655" : ra.role === "Controller" ? "#3b82f6" : ra.role === "Initiator" ? "#10b981" : "#f59e0b",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
