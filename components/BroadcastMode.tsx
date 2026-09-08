"use client";

import React, { useState, useEffect } from "react";
import { PlayerRecord } from "@/lib/types";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";
import { VCTMusicPlayer } from "./VCTMusicPlayer";
import { ALL_VALORANT_MAPS } from "@/lib/mapData";

interface BroadcastModeProps {
  players: PlayerRecord[];
  initialPlayer: PlayerRecord;
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
}

export const BroadcastMode: React.FC<BroadcastModeProps> = ({
  players,
  initialPlayer,
  isOpen,
  onClose,
  accentColor,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeCam, setActiveCam] = useState<"CAM1" | "CAM2" | "CAM3" | "CAM4">("CAM1");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPipRadar, setShowPipRadar] = useState(true);
  const [showLowerThird, setShowLowerThird] = useState(true);

  useEffect(() => {
    const idx = players.findIndex((p) => p.player === initialPlayer.player);
    if (idx >= 0) setCurrentIndex(idx);
  }, [initialPlayer, players]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight") {
        nextPlayer();
      } else if (e.key === "ArrowLeft") {
        prevPlayer();
      } else if (e.key === "1") {
        setActiveCam("CAM1");
        soundFx.playHover();
      } else if (e.key === "2") {
        setActiveCam("CAM2");
        soundFx.playHover();
      } else if (e.key === "3") {
        setActiveCam("CAM3");
        soundFx.playHover();
      } else if (e.key === "4") {
        setActiveCam("CAM4");
        soundFx.playHover();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      } else if (e.key === "p" || e.key === "P") {
        setShowPipRadar((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex, players]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  const player = players[currentIndex] || players[0];
  const agent = getAgent(player.agent);
  const currentMap = ALL_VALORANT_MAPS[0];

  const nextPlayer = () => {
    soundFx.playHover();
    setCurrentIndex((prev) => (prev + 1) % players.length);
  };

  const prevPlayer = () => {
    soundFx.playHover();
    setCurrentIndex((prev) => (prev - 1 + players.length) % players.length);
  };

  // 8-Axis Radar Points
  const radarAxes = [
    { label: "AIM", val: player.normalized.aim },
    { label: "UTILITY", val: player.normalized.utility },
    { label: "COMMS", val: player.normalized.comms },
    { label: "ENTRY", val: player.normalized.entry },
    { label: "CLUTCH", val: player.normalized.clutch },
    { label: "HS%", val: player.normalized.hs },
    { label: "ACS", val: player.normalized.acs },
    { label: "K/D", val: player.normalized.kd },
  ];
  const center = 150;
  const radius = 100;
  const radarPoints = radarAxes
    .map((axis, i) => {
      const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
      const normalizedScore = Math.min(Math.max(axis.val, 0), 10);
      const r = (normalizedScore / 10) * radius;
      return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
    })
    .join(" ");

  return (
    <div className="fixed inset-0 z-50 bg-[#030407] text-[#ece8e1] flex flex-col font-sans overflow-hidden select-none animate-fade-in">
      {/* ARENA BACKGROUND GRADIENT & LIGHTING */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30 transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 20%, ${agent.color}50, transparent 70%), radial-gradient(circle at 80% 80%, ${accentColor}30, transparent 50%)`,
        }}
      />

      {/* TOP BROADCAST STATUS HEADER BAR */}
      <div className="relative z-20 flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/60 backdrop-blur-md text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-rose-600 text-white font-bold tracking-widest text-[10px] animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
            <span>LIVE BROADCAST</span>
          </div>

          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-syncopate font-black tracking-wider text-white">VCT ARENA STAGE</span>
            <span className="text-white/20">|</span>
            <span>MATCH: SCRIM SERIES FINALS</span>
            <span className="text-white/20">|</span>
            <span className="text-emerald-400">FPS: 60 STABLE</span>
          </div>
        </div>

        {/* DIRECTOR CAMERA SWITCHER */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-syncopate mr-1 hidden md:inline">CAM FEED:</span>
          {[
            { id: "CAM1", label: "[1] OPERATIVE SPOTLIGHT" },
            { id: "CAM2", label: "[2] TELEMETRY RADAR" },
            { id: "CAM3", label: "[3] COMBAT MATRIX" },
            { id: "CAM4", label: "[4] SQUAD STANDINGS" },
          ].map((cam) => (
            <button
              key={cam.id}
              onClick={() => {
                soundFx.playHover();
                setActiveCam(cam.id as any);
              }}
              className={`px-3 py-1 rounded-lg text-[10px] font-syncopate tracking-wider transition-all border ${
                activeCam === cam.id
                  ? "bg-white/20 text-white font-bold border-white/40 shadow-lg"
                  : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
              }`}
            >
              {cam.label}
            </button>
          ))}
        </div>

        {/* CONTROLS (MUSIC, PIP, FULLSCREEN, EXIT) */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPipRadar((prev) => !prev)}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-syncopate border transition-all ${
              showPipRadar ? "bg-cyan-500/20 text-cyan-300 border-cyan-400" : "bg-white/5 text-slate-400 border-white/10"
            }`}
            title="Toggle Picture-in-Picture Radar Minimap (Shortcut: P)"
          >
            PIP RADAR [P]
          </button>

          <VCTMusicPlayer accentColor={accentColor} isCompact={true} />

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white text-xs"
            title="Toggle Fullscreen (Shortcut: F)"
          >
            ⛶
          </button>

          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-500/30 text-xs font-syncopate font-bold"
            title="Exit Broadcast Mode (Esc)"
          >
            EXIT [ESC]
          </button>
        </div>
      </div>

      {/* MAIN CAMERA VIEWPORT */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6 overflow-hidden">
        {/* BACKGROUND SCROLLING KANJI & CALLSIGN */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5 font-syncopate text-[22vw] font-black text-white whitespace-nowrap overflow-hidden"
          style={{ letterSpacing: "12px" }}
        >
          {agent.name.toUpperCase()}
        </div>

        {/* CAM 1: OPERATIVE HERO SPOTLIGHT */}
        {activeCam === "CAM1" && (
          <div className="w-full h-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
            {/* LEFT STATS HUD */}
            <div className="lg:col-span-4 space-y-4 text-left">
              <div className="space-y-1">
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  OPERATIVE DOSSIER // {player.role.toUpperCase()}
                </span>
                <h1 className="text-4xl md:text-5xl font-syncopate font-black text-white tracking-wider">
                  {player.name}
                </h1>
                <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
                  <span className="text-cyan-400 font-bold">{player.tag}</span>
                  <span>•</span>
                  <span>{player.agent}</span>
                  <span>•</span>
                  <span
                    className="px-2 py-0.5 rounded font-bold"
                    style={{
                      backgroundColor: `${agent.color}25`,
                      color: agent.color,
                    }}
                  >
                    TIER {player.tier}
                  </span>
                </div>
              </div>

              {/* THREE CORE METRICS */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] font-mono text-slate-400 block">COMBAT SCORE</span>
                  <span className="text-2xl font-syncopate font-black text-amber-400">
                    {player.rawStats.acs.toFixed(0)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] font-mono text-slate-400 block">K/D RATIO</span>
                  <span className="text-2xl font-syncopate font-black text-emerald-400">
                    {player.rawStats.kd.toFixed(2)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <span className="text-[9px] font-mono text-slate-400 block">HEADSHOT %</span>
                  <span className="text-2xl font-syncopate font-black text-cyan-400">
                    {player.rawStats.hsPercent.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* AGENT QUOTE & SYNERGY */}
              <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-xs text-slate-300 space-y-1">
                <span className="text-[9px] text-slate-500 uppercase block">COMBAT DIRECTIVE</span>
                <p className="italic text-slate-200">"{agent.quoteEn}"</p>
                <span className="text-[10px] text-slate-400 block pt-1">{agent.subJp}</span>
              </div>
            </div>

            {/* CENTER HERO PORTRAIT */}
            <div className="lg:col-span-5 relative flex items-center justify-center h-full max-h-[65vh]">
              <div
                className="absolute w-72 h-72 rounded-full filter blur-3xl opacity-40 animate-pulse pointer-events-none"
                style={{ backgroundColor: agent.color }}
              />
              <img
                src={agent.portrait}
                alt={agent.name}
                className="relative z-10 max-h-[62vh] object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.9)] transform hover:scale-105 transition-transform duration-500"
              />
            </div>

            {/* RIGHT MINI TELEMETRY */}
            <div className="lg:col-span-3 space-y-3 font-mono text-xs text-left">
              <span className="text-[10px] text-slate-400 uppercase font-syncopate tracking-widest block">
                SKILL BREAKDOWN
              </span>
              {[
                { name: "AIM MECHANICS", val: player.coachScores.aim },
                { name: "UTILITY IMPACT", val: player.coachScores.utility },
                { name: "COMMUNICATION", val: player.coachScores.comms },
                { name: "ENTRY EFFICIENCY", val: player.coachScores.entry },
                { name: "CLUTCH CONVERSION", val: player.coachScores.clutch },
              ].map((skill, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-slate-400">{skill.name}</span>
                    <span className="font-bold text-white">{skill.val.toFixed(1)}/10</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${skill.val * 10}%`,
                        backgroundColor: agent.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CAM 2: 8-AXIS TELEMETRY RADAR */}
        {activeCam === "CAM2" && (
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-6 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                8-AXIS TELEMETRIC COMBAT RADAR
              </span>
              <h2 className="text-3xl font-syncopate font-black text-white">
                {player.name} // {player.agent.toUpperCase()}
              </h2>
            </div>

            <div className="relative flex items-center justify-center p-8 bg-black/40 rounded-3xl border border-white/10 shadow-2xl">
              <svg width="340" height="340" className="overflow-visible">
                {/* Radial Grid Circles */}
                {[0.25, 0.5, 0.75, 1.0].map((level, i) => (
                  <circle
                    key={i}
                    cx={center}
                    cy={center}
                    r={radius * level}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                    strokeDasharray={i % 2 === 0 ? "4,4" : undefined}
                  />
                ))}

                {/* Axes Spokes */}
                {radarAxes.map((axis, i) => {
                  const angle = (Math.PI * 2 * i) / radarAxes.length - Math.PI / 2;
                  const x = center + radius * Math.cos(angle);
                  const y = center + radius * Math.sin(angle);
                  const labelX = center + (radius + 20) * Math.cos(angle);
                  const labelY = center + (radius + 18) * Math.sin(angle);

                  return (
                    <g key={i}>
                      <line x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <text
                        x={labelX}
                        y={labelY}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#94a3b8"
                        fontSize="10"
                        fontFamily="monospace"
                      >
                        {axis.label}
                      </text>
                    </g>
                  );
                })}

                {/* Radar Polygon */}
                <polygon
                  points={radarPoints}
                  fill={`${accentColor}35`}
                  stroke={accentColor}
                  strokeWidth="2.5"
                  className="transition-all duration-700"
                />
              </svg>
            </div>
          </div>
        )}

        {/* CAM 3: COMBAT MATRIX */}
        {activeCam === "CAM3" && (
          <div className="w-full max-w-4xl mx-auto space-y-6 animate-fade-in text-left">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-emerald-400 tracking-widest uppercase">
                LOADOUT & COMBAT ENGAGEMENT MATRIX
              </span>
              <h2 className="text-3xl font-syncopate font-black text-white">
                {player.name} COMBAT EFFICIENCY
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-slate-400 uppercase font-bold block text-[10px]">WEAPON PROFILE</span>
                <div className="text-xl font-syncopate font-bold text-white">VANDAL // OPERATOR</div>
                <p className="text-slate-400 leading-relaxed">
                  Excels in first-bullet accuracy and medium-to-long range rifle duels. High opening kill conversion.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-slate-400 uppercase font-bold block text-[10px]">OPENING DUEL SUCCESS</span>
                <div className="text-3xl font-syncopate font-black text-amber-400">62.8%</div>
                <p className="text-slate-400 leading-relaxed">
                  Wins 6 out of 10 opening engagements, creating 5v4 situational advantages for squad pushes.
                </p>
              </div>
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-slate-400 uppercase font-bold block text-[10px]">CLUTCH CONVERSION</span>
                <div className="text-3xl font-syncopate font-black text-cyan-400">41.2%</div>
                <p className="text-slate-400 leading-relaxed">
                  1vX conversion rate across series scrims. High composure during post-plant defuse denials.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* CAM 4: SQUAD STANDINGS */}
        {activeCam === "CAM4" && (
          <div className="w-full max-w-4xl mx-auto space-y-4 animate-fade-in text-left">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">
                COMPLETE SQUAD ROSTER STANDINGS
              </span>
              <h2 className="text-3xl font-syncopate font-black text-white">
                PERFORMANCE LEADERBOARD
              </h2>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 font-mono text-xs">
              {players.map((p, idx) => (
                <div
                  key={p.player}
                  onClick={() => setCurrentIndex(idx)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    idx === currentIndex
                      ? "bg-white/15 border-white/40 shadow-xl"
                      : "bg-white/5 border-white/10 hover:bg-white/10"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-slate-500 font-bold w-5">#{idx + 1}</span>
                    <span className="font-bold text-white text-sm">{p.name}</span>
                    <span className="text-slate-400">{p.tag}</span>
                    <span className="text-slate-500">| {p.agent} ({p.role})</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-amber-400 font-bold">ACS: {p.rawStats.acs.toFixed(0)}</span>
                    <span className="text-emerald-400 font-bold">K/D: {p.rawStats.kd.toFixed(2)}</span>
                    <span className="text-cyan-400 font-bold">HS: {p.rawStats.hsPercent.toFixed(1)}%</span>
                    <span className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                      TIER {p.tier}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PICTURE-IN-PICTURE (PIP) TACTICAL RADAR */}
        {showPipRadar && (
          <div className="absolute top-6 right-6 z-30 w-48 h-48 rounded-2xl bg-[#090c14]/90 border border-white/20 p-2 shadow-2xl backdrop-blur-xl animate-fade-in hidden sm:block">
            <div className="flex items-center justify-between pb-1 border-b border-white/10 text-[9px] font-mono text-slate-400">
              <span>PIP RADAR // {currentMap.name.toUpperCase()}</span>
              <button onClick={() => setShowPipRadar(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="relative w-full h-full flex items-center justify-center p-1">
              <img
                src={currentMap.radarUrl}
                alt={currentMap.name}
                className="w-full h-full object-contain filter brightness-125"
              />
              {/* Active Operative Ping */}
              <div
                className="absolute w-3 h-3 rounded-full animate-ping pointer-events-none"
                style={{
                  top: "40%",
                  left: "50%",
                  backgroundColor: agent.color,
                }}
              />
              <div
                className="absolute w-2 h-2 rounded-full pointer-events-none"
                style={{
                  top: "40%",
                  left: "50%",
                  backgroundColor: agent.color,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* FOOTER: LIVE BROADCAST LOWER-THIRD & TICKER */}
      <div className="relative z-20 border-t border-white/10 bg-black/80 backdrop-blur-xl">
        {/* OPERATIVE SWITCHER BUTTONS BAR */}
        <div className="flex items-center justify-between px-6 py-2 border-b border-white/5 text-xs font-mono">
          <button
            onClick={prevPlayer}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <span>← PREVIOUS OPERATIVE</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-slate-500">
              OPERATIVE {currentIndex + 1} OF {players.length}
            </span>
          </div>

          <button
            onClick={nextPlayer}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
          >
            <span>NEXT OPERATIVE →</span>
          </button>
        </div>

        {/* LIVE TICKER */}
        <div className="px-6 py-2 flex items-center justify-between text-xs font-mono text-slate-400">
          <div className="flex items-center gap-3 overflow-hidden">
            <span className="text-cyan-400 font-bold font-syncopate text-[10px]">VCT TICKER:</span>
            <span className="text-white truncate">
              {player.name} active on {player.agent} • Rating: {player.careerRating.toFixed(2)} • Top Map: Ascent (68% WR) • Scrim Target: Post-Plant Crossfires
            </span>
          </div>

          <div className="flex items-center gap-3 text-[10px] text-slate-500 whitespace-nowrap">
            <span>KEYBOARD: [1-4] CAMS • [←/→] PLAYERS • [P] PIP RADAR • [F] FULLSCREEN • [ESC] CLOSE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
