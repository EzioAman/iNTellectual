"use client";

import React, { useState } from "react";
import { MapStrategy, PlayerRecord } from "@/lib/types";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

interface TacticsBoardProps {
  tactics: MapStrategy[];
  players: PlayerRecord[];
  accentColor: string;
}

export const TacticsBoard: React.FC<TacticsBoardProps> = ({
  tactics,
  players,
  accentColor,
}) => {
  const [activeMapId, setActiveMapId] = useState<string>(tactics[0]?.id || "ascent");

  const currentMap = tactics.find((m) => m.id === activeMapId) || tactics[0];

  if (!currentMap) {
    return (
      <div className="p-8 text-center font-mono text-slate-500">
        NO MAP TACTICAL TELEMETRY DETECTED.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* MAP SELECTOR TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tactics.map((map) => {
          const isSelected = map.id === activeMapId;
          return (
            <button
              key={map.id}
              onClick={() => {
                soundFx.playClick();
                setActiveMapId(map.id);
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-syncopate tracking-wider transition-all border whitespace-nowrap flex items-center gap-2 ${
                isSelected
                  ? "bg-white/10 text-white font-bold border-white/30 shadow-lg"
                  : "bg-[#0c0f17]/60 text-slate-400 border-white/5 hover:border-white/15 hover:text-white"
              }`}
              style={{
                borderColor: isSelected ? accentColor : undefined,
                boxShadow: isSelected ? `0 0 15px ${accentColor}40` : undefined,
              }}
            >
              <span>{map.name}</span>
              <span
                className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: isSelected ? `${accentColor}20` : "rgba(255,255,255,0.05)",
                  color: isSelected ? accentColor : "#94a3b8",
                }}
              >
                {map.winRate}% WR
              </span>
            </button>
          );
        })}
      </div>

      {/* MAP SHOWCASE & METRICS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: MAP HERO BANNER */}
        <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-[#0e121a] flex flex-col justify-end min-h-[280px] p-6 group">
          <img
            src={currentMap.imageUrl}
            alt={currentMap.name}
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#06070a]/60 to-transparent" />

          <div className="relative z-10 space-y-2">
            <span
              className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border"
              style={{
                borderColor: `${accentColor}40`,
                color: accentColor,
                backgroundColor: `${accentColor}10`,
              }}
            >
              VCT COMPETITIVE POOL
            </span>
            <h2 className="text-4xl font-syncopate font-black text-white tracking-wider">
              {currentMap.name}
            </h2>

            {/* WIN RATE STRIP */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/10">
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">SQUAD WIN RATE</span>
                <span className="text-xl font-teko text-white">{currentMap.winRate}%</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">ATTACK CONV.</span>
                <span className="text-xl font-teko text-emerald-400">{currentMap.attackWinRate}%</span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-slate-400 block">DEFENSE HOLD</span>
                <span className="text-xl font-teko text-cyan-400">{currentMap.defenseWinRate}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: STRATEGIC CALLOUTS & NOTES */}
        <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-[#0c0f17]/90 backdrop-blur-md p-6 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-syncopate uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                <span>TACTICAL DIRECTIVE & SCRIM STRATEGY</span>
              </h3>
              <span className="text-[10px] font-mono text-slate-500">
                ACTIVE MAP DEPLOYMENT
              </span>
            </div>
            <p className="text-sm font-mono text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
              {currentMap.tacticalNotes}
            </p>
          </div>

          <div>
            <h4 className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400 mb-2">
              KEY WIN CONDITION CALLOUTS
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {currentMap.keyCallouts.map((callout, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs font-mono text-slate-300 flex items-start gap-2 hover:border-white/20 transition-colors"
                >
                  <span className="font-bold" style={{ color: accentColor }}>
                    0{idx + 1}
                  </span>
                  <span>{callout}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* RECOMMENDED META COMPOSITION */}
      <div className="rounded-2xl border border-white/10 bg-[#0c0f17]/90 backdrop-blur-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-syncopate font-bold text-white tracking-wider flex items-center gap-2">
              <span>META SQUAD COMPOSITION //</span>
              <span style={{ color: accentColor }}>{currentMap.name}</span>
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Optimal agent synergy, utility coverage, and recommended squad assignments.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">5-OPERATIVE ROSTER</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-2">
          {currentMap.metaComp.map((slot, idx) => {
            const agent = getAgent(slot.agent);
            const assignedOperative = players.find(
              (p) => p.player === slot.assignedPlayer
            );

            return (
              <div
                key={idx}
                className="relative p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/20 transition-all flex flex-col justify-between group overflow-hidden"
              >
                <div
                  className="absolute top-0 right-0 w-20 h-20 bg-no-repeat bg-right-top opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity"
                  style={{
                    backgroundImage: `url(${agent.displayIcon})`,
                    backgroundSize: "contain",
                  }}
                />

                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between">
                    <span
                      className="text-[9px] font-mono uppercase px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${agent.color}20`,
                        color: agent.color,
                      }}
                    >
                      {slot.role}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">SLOT 0{idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={agent.displayIcon}
                      alt={agent.name}
                      className="w-12 h-12 object-contain p-1 rounded-lg bg-black/40 border border-white/10"
                    />
                    <div>
                      <h4 className="font-syncopate font-bold text-sm text-white">{agent.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400">{agent.quoteEn.substring(0, 20)}...</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
                  <span className="text-[9px] font-mono uppercase text-slate-500 block">
                    ASSIGNED OPERATIVE
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-xs text-slate-200">
                      {assignedOperative ? assignedOperative.name : "Unassigned"}
                    </span>
                    {assignedOperative && (
                      <span
                        className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: `${accentColor}20`,
                          color: accentColor,
                        }}
                      >
                        TIER {assignedOperative.tier}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
