"use client";

import React, { useState, useEffect, useRef } from "react";
import { VCT_ROUND_REPLAYS, MatchRoundReplay, ReplayEvent } from "@/lib/replayData";
import { ALL_VALORANT_MAPS } from "@/lib/mapData";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

interface RoundReplayViewerProps {
  accentColor: string;
  onCaptureAsStrategy?: (round: MatchRoundReplay, currentTime: number) => void;
}

export const RoundReplayViewer: React.FC<RoundReplayViewerProps> = ({
  accentColor,
  onCaptureAsStrategy,
}) => {
  const [selectedReplayId, setSelectedReplayId] = useState<string>(VCT_ROUND_REPLAYS[0]?.id || "");
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [captureFeedback, setCaptureFeedback] = useState<string | null>(null);

  const activeReplay = VCT_ROUND_REPLAYS.find((r) => r.id === selectedReplayId) || VCT_ROUND_REPLAYS[0];
  const activeMap = ALL_VALORANT_MAPS.find((m) => m.id === activeReplay.mapId) || ALL_VALORANT_MAPS[0];

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= activeReplay.roundDurationSeconds) {
            setIsPlaying(false);
            return activeReplay.roundDurationSeconds;
          }
          return prev + 1;
        });
      }, 1000 / playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, playbackSpeed, activeReplay.roundDurationSeconds]);

  const togglePlay = () => {
    soundFx.playClick();
    if (currentTime >= activeReplay.roundDurationSeconds) {
      setCurrentTime(0);
    }
    setIsPlaying((prev) => !prev);
  };

  const handleReset = () => {
    soundFx.playClick();
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Interpolate agent position at current time
  const getAgentPosition = (agentState: any) => {
    const path = agentState.path;
    if (currentTime <= path[0].time) {
      return { x: path[0].x, y: path[0].y };
    }
    if (currentTime >= path[path.length - 1].time) {
      const last = path[path.length - 1];
      return { x: last.x, y: last.y };
    }

    // Find bounding keyframes
    for (let i = 0; i < path.length - 1; i++) {
      if (currentTime >= path[i].time && currentTime <= path[i + 1].time) {
        const t0 = path[i].time;
        const t1 = path[i + 1].time;
        const ratio = (currentTime - t0) / (t1 - t0 || 1);
        const x = path[i].x + (path[i + 1].x - path[i].x) * ratio;
        const y = path[i].y + (path[i + 1].y - path[i].y) * ratio;
        return { x, y };
      }
    }
    return { x: agentState.startX, y: agentState.startY };
  };

  // Check if agent is alive at current time
  const isAgentAlive = (agentName: string) => {
    const killEvent = activeReplay.events.find(
      (e) => e.type === "KILL" && e.target?.toLowerCase().includes(agentName.toLowerCase())
    );
    if (!killEvent) return true;
    return currentTime < killEvent.timestamp;
  };

  // Filter active events up to current time
  const pastEvents = activeReplay.events.filter((e) => e.timestamp <= currentTime);
  const recentEvents = pastEvents.slice(-5).reverse();

  // Active smokes up to current time
  const activeSmokes = activeReplay.events.filter(
    (e) => e.type === "SMOKE" && currentTime >= e.timestamp && currentTime <= e.timestamp + 25
  );

  // Active spike plant status
  const spikePlantEvent = activeReplay.events.find((e) => e.type === "PLANT" && currentTime >= e.timestamp);

  const handleCaptureMoment = () => {
    soundFx.playCommit();
    if (onCaptureAsStrategy) {
      onCaptureAsStrategy(activeReplay, currentTime);
    }
    setCaptureFeedback(`✓ Captured round state at ${formatTime(currentTime)} as Strategy!`);
    setTimeout(() => setCaptureFeedback(null), 3500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans select-none">
      {/* 1. REPLAY CONTROLLER HEADER */}
      <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <h3 className="font-syncopate font-black text-sm text-white tracking-wider">
                2D TACTICAL REPLAY & ROUND SIMULATOR
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Watch top-down 2D match replays with animated agent vectors, timed smokes, and convert any moment into an editable strategy
            </p>
          </div>

          {/* MATCH SELECTOR PILLS */}
          <div className="flex items-center gap-2">
            {VCT_ROUND_REPLAYS.map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  soundFx.playHover();
                  setSelectedReplayId(r.id);
                  setCurrentTime(0);
                  setIsPlaying(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-syncopate tracking-wider transition-all border ${
                  selectedReplayId === r.id
                    ? "bg-white/20 text-white font-bold border-white/40 shadow-md"
                    : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                }`}
              >
                {r.title}
              </button>
            ))}
          </div>
        </div>

        {/* TIMELINE CONTROLS BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="w-9 h-9 rounded-full flex items-center justify-center text-black font-black transition-transform hover:scale-105 active:scale-95 shadow-md flex-shrink-0"
              style={{ backgroundColor: accentColor }}
              title={isPlaying ? "Pause Simulation" : "Play Simulation"}
            >
              {isPlaying ? (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 fill-current translate-x-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-mono text-slate-300"
              title="Reset timeline to 00:00"
            >
              RESET
            </button>

            {/* SPEED MULTIPLIER */}
            <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5 text-[10px] font-mono">
              {[0.5, 1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaybackSpeed(s)}
                  className={`px-2 py-0.5 rounded ${
                    playbackSpeed === s ? "bg-white/20 text-white font-bold" : "text-slate-400"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-mono text-white font-bold">
              <span className="text-amber-400 font-teko text-2xl">{formatTime(currentTime)}</span>
              <span className="text-slate-500">/ {formatTime(activeReplay.roundDurationSeconds)}</span>
            </div>
          </div>

          {/* TIMELINE SCRUBBER */}
          <div className="flex-1 max-w-md flex items-center gap-2">
            <input
              type="range"
              min="0"
              max={activeReplay.roundDurationSeconds}
              value={currentTime}
              onChange={(e) => {
                setCurrentTime(parseInt(e.target.value));
              }}
              className="w-full accent-[#ff4655] bg-white/10 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* CAPTURE MOMENT ACTION */}
          <div className="flex items-center gap-2">
            {captureFeedback && (
              <span className="text-[10px] font-mono text-emerald-400 font-bold animate-pulse">
                {captureFeedback}
              </span>
            )}
            <button
              onClick={handleCaptureMoment}
              className="px-3.5 py-2 rounded-xl text-xs font-syncopate font-bold text-white bg-cyan-950/60 border border-cyan-500/40 hover:bg-cyan-900 transition-all transform hover:scale-105 shadow-xl"
            >
              CAPTURE AS STRATEGY ➔
            </button>
          </div>
        </div>
      </div>

      {/* 2. REPLAY RADAR & LIVE KILLFEED */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: 2D TOP-DOWN SIMULATION RADAR (8 COLS) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div>
              <span className="text-[9px] font-syncopate uppercase tracking-widest text-slate-400 block">
                2D SIMULATION CANVAS // {activeMap.name}
              </span>
              <h4 className="text-xs font-syncopate font-bold text-white">
                {activeReplay.tournament}
              </h4>
            </div>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              WINNER: {activeReplay.winningTeam}
            </span>
          </div>

          <div className="relative w-full h-[460px] rounded-xl overflow-hidden border border-white/20 bg-[#03060a] shadow-inner">
            <img
              src={activeMap.radarUrl}
              alt={activeMap.name}
              className="w-full h-full object-contain p-2 filter brightness-110 contrast-125 pointer-events-none"
            />

            {/* Active Smokes */}
            {activeSmokes.map((s, idx) => (
              <div
                key={`smoke-${idx}`}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none animate-pulse"
                style={{
                  left: `${s.x}%`,
                  top: `${s.y}%`,
                  width: "56px",
                  height: "56px",
                  backgroundColor: `${s.color || "#9333ea"}45`,
                  border: `2px solid ${s.color || "#9333ea"}`,
                  boxShadow: `0 0 16px ${s.color || "#9333ea"}70`,
                }}
              />
            ))}

            {/* Spike Planted Indicator */}
            {spikePlantEvent && (
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none animate-bounce"
                style={{ left: `${spikePlantEvent.x}%`, top: `${spikePlantEvent.y}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-xs">
                  💣
                </div>
                <span className="text-[7px] font-mono font-bold text-rose-400 bg-black/90 px-1 rounded mt-0.5">
                  SPIKE
                </span>
              </div>
            )}

            {/* ATTACKER AGENTS */}
            {activeReplay.attackers.map((agentState) => {
              const pos = getAgentPosition(agentState);
              const alive = isAgentAlive(agentState.name);
              const aObj = getAgent(agentState.agent);

              return (
                <div
                  key={`atk-${agentState.name}`}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none z-30 ${
                    alive ? "" : "opacity-25 grayscale"
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div
                    className="w-7 h-7 rounded-full border-2 border-rose-500 overflow-hidden shadow-2xl flex items-center justify-center bg-black"
                    style={{ boxShadow: alive ? "0 0 12px rgba(255, 70, 85, 0.8)" : "none" }}
                  >
                    <img src={aObj.displayIcon} alt={agentState.agent} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[7px] font-mono font-bold text-white bg-black/90 px-1 rounded border border-rose-500/50 mt-0.5 block text-center whitespace-nowrap">
                    {alive ? agentState.name : "DEAD"}
                  </span>
                </div>
              );
            })}

            {/* DEFENDER AGENTS */}
            {activeReplay.defenders.map((agentState) => {
              const pos = getAgentPosition(agentState);
              const alive = isAgentAlive(agentState.name);
              const aObj = getAgent(agentState.agent);

              return (
                <div
                  key={`def-${agentState.name}`}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 pointer-events-none z-30 ${
                    alive ? "" : "opacity-25 grayscale"
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                >
                  <div
                    className="w-7 h-7 rounded-full border-2 border-cyan-400 overflow-hidden shadow-2xl flex items-center justify-center bg-black"
                    style={{ boxShadow: alive ? "0 0 12px rgba(56, 189, 248, 0.8)" : "none" }}
                  >
                    <img src={aObj.displayIcon} alt={agentState.agent} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[7px] font-mono font-bold text-white bg-black/90 px-1 rounded border border-cyan-500/50 mt-0.5 block text-center whitespace-nowrap">
                    {alive ? agentState.name : "DEAD"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: LIVE KILLFEED & ROUND EVENT TIMELINE (4 COLS) */}
        <div className="lg:col-span-4 rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="border-b border-white/10 pb-2">
            <h4 className="font-syncopate font-bold text-xs text-white tracking-wider">
              LIVE ROUND LOG & KILLFEED
            </h4>
            <span className="text-[10px] font-mono text-slate-400">
              Events registered up to {formatTime(currentTime)}
            </span>
          </div>

          {/* RECENT KILLFEED NOTIFICATIONS */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-amber-400 uppercase font-bold block">
              RECENT KILLFEED:
            </span>
            {recentEvents.length === 0 ? (
              <span className="text-[11px] font-mono text-slate-500 block py-4 text-center">
                Round starting... No engagements yet.
              </span>
            ) : (
              recentEvents.map((evt, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs font-mono space-y-1 animate-fade-in"
                >
                  <div className="flex items-center justify-between text-[9px]">
                    <span className="text-slate-400">{formatTime(evt.timestamp)}</span>
                    <span
                      className="px-1.5 py-0.5 rounded font-bold"
                      style={{
                        backgroundColor: evt.type === "KILL" ? "rgba(244, 63, 94, 0.2)" : "rgba(56, 189, 248, 0.2)",
                        color: evt.type === "KILL" ? "#f43f5e" : "#38bdf8",
                      }}
                    >
                      {evt.type}
                    </span>
                  </div>
                  <p className="text-slate-200 text-[11px] font-bold">
                    {evt.text}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* LIVING OPERATIVES ROSTER TALLY */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-center">
              <span className="text-[10px] text-rose-300 block">ATTACKERS ALIVE</span>
              <span className="text-2xl font-teko font-bold text-white">
                {activeReplay.attackers.filter((a) => isAgentAlive(a.name)).length} / 5
              </span>
            </div>
            <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-center">
              <span className="text-[10px] text-cyan-300 block">DEFENDERS ALIVE</span>
              <span className="text-2xl font-teko font-bold text-white">
                {activeReplay.defenders.filter((d) => isAgentAlive(d.name)).length} / 5
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
