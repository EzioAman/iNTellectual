"use client";

import React, { useState } from "react";
import { VALORANT_LINEUPS, ValorantLineup } from "@/lib/lineupData";
import { ALL_VALORANT_MAPS } from "@/lib/mapData";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

interface LineupVaultProps {
  accentColor: string;
  onDeployToStrategy?: (lineup: ValorantLineup) => void;
}

export const LineupVault: React.FC<LineupVaultProps> = ({
  accentColor,
  onDeployToStrategy,
}) => {
  const [selectedAgent, setSelectedAgent] = useState<string>("ALL");
  const [selectedMap, setSelectedMap] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [activeLineupId, setActiveLineupId] = useState<string>(VALORANT_LINEUPS[0]?.id || "");
  const [deployFeedback, setDeployFeedback] = useState<string | null>(null);

  // Filtered lineups
  const filteredLineups = VALORANT_LINEUPS.filter((l) => {
    const matchesAgent = selectedAgent === "ALL" || l.agent.toLowerCase() === selectedAgent.toLowerCase();
    const matchesMap = selectedMap === "ALL" || l.mapId.toLowerCase() === selectedMap.toLowerCase();
    const matchesType = selectedType === "ALL" || l.type === selectedType;
    return matchesAgent && matchesMap && matchesType;
  });

  const activeLineup = VALORANT_LINEUPS.find((l) => l.id === activeLineupId) || filteredLineups[0] || VALORANT_LINEUPS[0];
  const activeMapData = ALL_VALORANT_MAPS.find((m) => m.id === activeLineup.mapId) || ALL_VALORANT_MAPS[0];
  const agentObj = getAgent(activeLineup.agent);

  const handleDeploy = () => {
    soundFx.playCommit();
    if (onDeployToStrategy) {
      onDeployToStrategy(activeLineup);
    }
    setDeployFeedback(`✓ Lineup deployed to Tactical Whiteboard!`);
    setTimeout(() => setDeployFeedback(null), 3000);
  };

  const agentsList = ["ALL", "Sova", "Viper", "Killjoy", "Brimstone", "Fade", "Gekko"];
  const typesList = ["ALL", "POST_PLANT", "RECON", "ONE_WAY", "ATTACK_ENTRY", "LOCKDOWN_ULT"];

  return (
    <div className="space-y-6 animate-fade-in font-sans select-none">
      {/* 1. VAULT HEADER & FILTERS */}
      <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <h3 className="font-syncopate font-black text-sm text-white tracking-wider">
                VALORANT LINEUP VAULT // VERIFIED PRO UTILITY
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Curated post-plant mollies, recon darts, one-way smokes, and lockdown setups with throw alignment coordinates
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-slate-400">
              <b>{filteredLineups.length}</b> LINEUPS FOUND
            </span>
          </div>
        </div>

        {/* FILTER SELECTORS (AGENT, MAP, TYPE) */}
        <div className="flex flex-wrap items-center gap-3">
          {/* AGENT FILTER */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">AGENT:</span>
            {agentsList.map((a) => (
              <button
                key={a}
                onClick={() => {
                  soundFx.playHover();
                  setSelectedAgent(a);
                }}
                className={`px-3 py-1 rounded-lg text-[10px] font-syncopate border transition-all ${
                  selectedAgent === a
                    ? "bg-white/20 text-white font-bold border-white/40 shadow-md"
                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {a}
              </button>
            ))}
          </div>

          {/* SITUATION TYPE FILTER */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1">
            <span className="text-[10px] font-mono text-slate-500 uppercase mr-1">TYPE:</span>
            {typesList.map((t) => (
              <button
                key={t}
                onClick={() => {
                  soundFx.playHover();
                  setSelectedType(t);
                }}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-mono border transition-all ${
                  selectedType === t
                    ? "bg-cyan-500/20 text-cyan-300 font-bold border-cyan-400 shadow-md"
                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {t.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. MAIN VAULT VIEW: LIST & INTERACTIVE RADAR VISUALIZER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: LINEUP SELECTION CARDS (5 COLS) */}
        <div className="lg:col-span-5 space-y-3 max-h-[600px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredLineups.map((lineup) => {
            const isSelected = lineup.id === activeLineup.id;
            const aObj = getAgent(lineup.agent);

            return (
              <div
                key={lineup.id}
                onClick={() => {
                  soundFx.playClick();
                  setActiveLineupId(lineup.id);
                }}
                className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? "bg-white/15 border-white/40 shadow-2xl ring-1 ring-white/30"
                    : "bg-[#0c0f17]/90 border-white/10 hover:border-white/20 hover:bg-white/[0.08]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={aObj.displayIcon} alt={lineup.agent} className="w-5 h-5 rounded" />
                    <span className="text-xs font-syncopate font-bold text-white">
                      {lineup.agent} // {lineup.site}
                    </span>
                  </div>
                  <span
                    className="text-[9px] font-mono px-2 py-0.5 rounded font-bold uppercase"
                    style={{ backgroundColor: `${lineup.color}20`, color: lineup.color }}
                  >
                    {lineup.type.replace("_", " ")}
                  </span>
                </div>

                <h4 className="text-xs font-mono font-bold text-slate-200">
                  {lineup.title}
                </h4>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-white/5">
                  <span>MAP: <b className="text-white uppercase">{lineup.mapId}</b></span>
                  <span>DIFF: <b className={lineup.difficulty === "EASY" ? "text-emerald-400" : lineup.difficulty === "MEDIUM" ? "text-amber-400" : "text-rose-400"}>{lineup.difficulty}</b></span>
                  {lineup.proPlayerCredit && (
                    <span className="text-cyan-400">PRO: {lineup.proPlayerCredit}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT: INTERACTIVE RADAR VISUALIZER & ALIGNMENT GUIDE (7 COLS) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <span className="text-[9px] font-syncopate uppercase tracking-widest text-slate-400 block">
                LINEUP TRAJECTORY MAP // {activeMapData.name}
              </span>
              <h4 className="text-sm font-syncopate font-bold text-white">
                {activeLineup.title}
              </h4>
            </div>

            <div className="flex items-center gap-2">
              {deployFeedback && (
                <span className="text-[10px] font-mono text-emerald-400 animate-pulse font-bold">
                  {deployFeedback}
                </span>
              )}
              <button
                onClick={handleDeploy}
                className="px-3 py-1.5 rounded-lg text-xs font-syncopate font-bold text-black transition-all transform hover:scale-105 shadow-xl"
                style={{ backgroundColor: accentColor }}
              >
                DEPLOY TO WHITEBOARD ➔
              </button>
            </div>
          </div>

          {/* 2D RADAR MINIMAP WITH TRAJECTORY PATH */}
          <div className="relative w-full h-[360px] rounded-xl overflow-hidden border border-white/20 bg-[#03060a] shadow-inner">
            <img
              src={activeMapData.radarUrl}
              alt={activeMapData.name}
              className="w-full h-full object-contain p-2 filter brightness-110 contrast-125"
            />

            {/* SVG Trajectory Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <marker
                  id="lineup-arrow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill={activeLineup.color} />
                </marker>
              </defs>

              {/* Trajectory Arc Line */}
              <line
                x1={`${activeLineup.standCoords.x}%`}
                y1={`${activeLineup.standCoords.y}%`}
                x2={`${activeLineup.landingCoords.x}%`}
                y2={`${activeLineup.landingCoords.y}%`}
                stroke={activeLineup.color}
                strokeWidth="2.5"
                strokeDasharray="5,5"
                markerEnd="url(#lineup-arrow)"
                style={{ filter: `drop-shadow(0 0 6px ${activeLineup.color})` }}
              />
            </svg>

            {/* Stand Pin (Where Operative Stands) */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
              style={{ left: `${activeLineup.standCoords.x}%`, top: `${activeLineup.standCoords.y}%` }}
            >
              <div
                className="w-7 h-7 rounded-full border-2 border-white overflow-hidden shadow-2xl flex items-center justify-center bg-black"
                style={{ boxShadow: `0 0 12px ${agentObj.color}` }}
              >
                <img src={agentObj.displayIcon} alt={activeLineup.agent} className="w-full h-full object-cover" />
              </div>
              <span className="text-[8px] font-mono font-bold text-white bg-black/90 px-1.5 py-0.5 rounded border border-white/20 mt-0.5 whitespace-nowrap">
                STAND HERE
              </span>
            </div>

            {/* Landing AoE Ring */}
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex items-center justify-center pointer-events-none animate-pulse"
              style={{
                left: `${activeLineup.landingCoords.x}%`,
                top: `${activeLineup.landingCoords.y}%`,
                width: "48px",
                height: "48px",
                backgroundColor: `${activeLineup.color}35`,
                border: `2px solid ${activeLineup.color}`,
                borderRadius: "50%",
                boxShadow: `0 0 16px ${activeLineup.color}80`,
              }}
            >
              <span className="text-[8px] font-mono font-bold text-white">TARGET</span>
            </div>
          </div>

          {/* STEP-BY-STEP ALIGNMENT & EXECUTION INSTRUCTIONS */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-white/10">
              <span className="text-amber-400 font-bold uppercase">EXECUTION TECHNIQUE:</span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                  {activeLineup.throwType.replace("_", " ")}
                </span>
                {activeLineup.bounceCount > 0 && (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    {activeLineup.bounceCount} BOUNCE{activeLineup.bounceCount > 1 ? "S" : ""}
                  </span>
                )}
                {activeLineup.chargeBars > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/40">
                    {activeLineup.chargeBars} BAR{activeLineup.chargeBars > 1 ? "S" : ""} CHARGE
                  </span>
                )}
              </div>
            </div>

            <div>
              <span className="text-slate-400 block mb-1">AIM & CROSSHAIR ALIGNMENT INSTRUCTIONS:</span>
              <p className="text-slate-200 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                {activeLineup.aimInstructions}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
