"use client";

import React, { useEffect, useRef, useState } from "react";
import { PlayerRecord } from "@/lib/types";
import { getAgent } from "@/lib/agentData";

interface KineticStageProps {
  player: PlayerRecord;
}

export const KineticStage: React.FC<KineticStageProps> = ({ player }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const charRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.5);

  const agent = getAgent(player.agent);

  // Parallax physics
  useEffect(() => {
    let mouseX = 0;
    let mouseY = 0;
    let charX = 0;
    let charY = 0;
    let animFrameId: number;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) - rect.width / 2) / (rect.width / 2);
      mouseY = ((e.clientY - rect.top) - rect.height / 2) / (rect.height / 2);
    };

    const updatePhysics = () => {
      const targetX = mouseX * 24;
      const targetY = mouseY * 16;
      charX += (targetX - charX) * 0.08;
      charY += (targetY - charY) * 0.08;

      if (charRef.current) {
        charRef.current.style.transform = `translate3d(${charX}px, ${charY}px, 0)`;
      }
      animFrameId = requestAnimationFrame(updatePhysics);
    };

    window.addEventListener("mousemove", handleMouseMove);
    animFrameId = requestAnimationFrame(updatePhysics);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animFrameId);
    };
  }, []);

  // Radianite particles canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const resize = () => {
      if (!containerRef.current || !canvas) return;
      canvas.width = containerRef.current.clientWidth;
      canvas.height = containerRef.current.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      angle: number;
      spin: number;
      alpha: number;
    }> = [];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * (canvas.width || 800),
        y: Math.random() * (canvas.height || 600),
        size: Math.random() * 4 + 2,
        speedY: Math.random() * 0.7 + 0.3,
        speedX: Math.random() * 0.4 - 0.2,
        angle: Math.random() * 360,
        spin: Math.random() * 0.8 - 0.4,
        alpha: Math.random() * 0.4 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const color = agent.color || "#ff4655";

      particles.forEach((p) => {
        p.y -= p.speedY;
        p.x += p.speedX + Math.sin(p.y / 35) * 0.3;
        p.angle += p.spin;

        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.angle * Math.PI) / 180);
        ctx.fillStyle = color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowBlur = 8;
        ctx.shadowColor = color;

        ctx.beginPath();
        ctx.moveTo(0, -p.size);
        ctx.lineTo(p.size * 0.6, 0);
        ctx.lineTo(0, p.size);
        ctx.lineTo(-p.size * 0.6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animId);
    };
  }, [agent.color]);

  // Audio handling
  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[600px] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#07070a] my-4 select-none"
      style={{
        backgroundImage: `radial-gradient(circle at 60% 40%, rgba(20, 24, 35, 0.95) 0%, #06070a 100%)`,
        boxShadow: `0 25px 70px rgba(0,0,0,0.85), inset 0 0 80px rgba(6,7,10,0.95)`
      }}
    >
      {/* Corner Brackets */}
      <div
        className="absolute top-5 left-5 w-4 h-4 border-t-2 border-l-2 z-20 pointer-events-none opacity-70"
        style={{ borderColor: agent.color }}
      />
      <div
        className="absolute bottom-5 right-5 w-4 h-4 border-b-2 border-r-2 z-20 pointer-events-none opacity-70"
        style={{ borderColor: agent.color }}
      />

      {/* Kinetic Background Scrolling Typography */}
      <div
        className="absolute top-1/2 left-0 -translate-y-1/2 whitespace-nowrap font-syncopate text-[10rem] font-bold text-white/[0.025] tracking-[24px] pointer-events-none z-[1]"
        style={{ animation: "move-nihility 45s linear infinite" }}
      >
        INTELLECTUAL // ESPORTS TACTICAL SYSTEM // CREATED BY MORFIT
      </div>

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-10 pointer-events-none" />

      {/* Main 3-Column Layout */}
      <div className="relative z-20 w-full h-full grid grid-cols-[46%_40%_14%]">
        
        {/* LEFT PANEL */}
        <div className="p-7 flex flex-col justify-between z-20 bg-gradient-to-r from-[#06070a] via-[#06070a]/90 to-transparent">
          <div>
            {/* Header Quote */}
            <div
              className="pl-3 border-l-[3px] text-xs font-black uppercase tracking-[2px] text-slate-300"
              style={{ borderColor: agent.color }}
            >
              {agent.quoteEn}
              <span className="block text-[11px] text-slate-400 mt-1 tracking-[1px]">
                {agent.quoteJp}
              </span>
            </div>

            {/* Main Name & Badges */}
            <div className="mt-4">
              <span
                className="font-syncopate text-[11px] font-bold tracking-[5px] block mb-1"
                style={{ color: agent.color, textShadow: `0 0 12px ${agent.accent}` }}
              >
                {agent.subJp}
              </span>
              <div className="flex items-baseline gap-2">
                <h1
                  className="font-teko text-7xl font-bold uppercase tracking-[2px] leading-[0.88] text-white"
                  style={{ textShadow: `0 0 25px ${agent.accent}` }}
                >
                  {player.name}
                </h1>
                <span className="font-teko text-4xl text-[#ff4655] font-bold">{player.tag}</span>
              </div>

              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <div className="bg-white text-[#06070a] px-3 py-1 text-[11px] font-black tracking-[2px] rounded-sm shadow-md">
                  RANK #{player.rank} / 10
                </div>
                <div
                  className="px-3 py-1 text-[11px] font-extrabold tracking-[2px] rounded-sm border"
                  style={{
                    backgroundColor: "rgba(255, 70, 85, 0.15)",
                    borderColor: "#ff4655",
                    color: "#ff4655",
                  }}
                >
                  {player.tier}-TIER // {player.careerRating.toFixed(2)} OVR
                </div>
              </div>

              {/* Tactical Stats HUD Grid */}
              <div className="grid grid-cols-4 gap-2 mt-4 p-3 bg-[#0e121a]/80 border border-white/10 rounded-md backdrop-blur-md">
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-syncopate">ACS</div>
                  <div className="font-teko text-3xl font-bold text-white leading-none mt-1">
                    {player.rawStats.acs.toFixed(0)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-syncopate">K/D</div>
                  <div className="font-teko text-3xl font-bold text-white leading-none mt-1">
                    {player.rawStats.kd.toFixed(2)}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-syncopate">HS%</div>
                  <div className="font-teko text-3xl font-bold text-white leading-none mt-1">
                    {player.rawStats.hsPercent.toFixed(1)}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-syncopate">FORM</div>
                  <div className="font-teko text-3xl font-bold text-[#5bf8ff] leading-none mt-1">
                    {player.formRating.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Tactical Audio Player */}
              <div
                className={`p-3 mt-4 rounded-md bg-[#0a0c12]/80 border backdrop-blur-md transition-all duration-300 ${
                  isPlaying ? "border-[#ff4655] shadow-[0_0_20px_rgba(255,70,85,0.2)]" : "border-white/10"
                }`}
              >
                <audio
                  ref={audioRef}
                  src="https://www.dropbox.com/scl/fi/ersb17v6uwmcelmvapgxp/Fall-To-Hell-DOLLWAVE-Darkwave-Lyrics-visualizer.mp3?rlkey=3pfivpdswvsnwxwzqnix01wnl&st=vs1tmdms&dl=1"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[11px] font-bold text-white uppercase tracking-wider truncate max-w-[65%]">
                    Fall To Hell - DOLLWAVE // ANTHEM
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                {/* Progress bar */}
                <div
                  className="w-full h-1 bg-white/10 rounded-full mt-2 cursor-pointer relative overflow-hidden"
                  onClick={handleSeek}
                >
                  <div
                    className="h-full bg-gradient-to-r from-[#ff4655] to-white rounded-full transition-all"
                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                  />
                </div>

                {/* Controls */}
                <div className="flex justify-between items-center mt-2">
                  <button
                    onClick={togglePlay}
                    className="px-4 py-1 text-[10px] font-black uppercase tracking-[2px] rounded-full border border-white/30 text-white hover:bg-white hover:text-black transition-all"
                  >
                    {isPlaying ? "Pause" : "Play"}
                  </button>

                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-slate-500 font-mono">VOL</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setVolume(val);
                        if (audioRef.current) audioRef.current.volume = val;
                      }}
                      className="w-16 h-1 accent-[#ff4655] bg-white/10 rounded-sm cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Left Footer */}
          <div className="flex justify-between items-center border-t border-white/10 pt-3 mt-2">
            <span className="text-[10px] font-bold text-slate-500 tracking-[2px] uppercase">
              TACTICAL OVERDRIVE // FREQUENCY: STABLE
            </span>
            <div
              className="px-3 py-0.5 text-[10px] font-black uppercase tracking-[2px] border rounded-sm"
              style={{ color: agent.color, borderColor: agent.color }}
            >
              {player.role}
            </div>
          </div>
        </div>

        {/* CENTER PANEL: CHARACTER HOLO-STAGE */}
        <div className="relative flex items-center justify-center overflow-hidden">
          {/* Background art window */}
          <div className="w-[92%] h-[92%] relative rounded-md border border-white/10 overflow-hidden bg-gradient-to-br from-white/[0.03] to-black/40">
            {/* Scanline */}
            <div className="laser-scan-line absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#5bf8ff] to-transparent z-20 pointer-events-none" />

            {/* Giant watermark Kanji */}
            <span className="absolute -top-8 -left-4 text-[16rem] font-black text-white/[0.03] select-none pointer-events-none leading-none">
              {agent.bgKanji}
            </span>

            {/* HUD Status Overlay */}
            <div className="absolute right-5 top-1/4 flex flex-col items-end gap-1 text-[9px] font-mono text-white/40 z-20 pointer-events-none">
              <span>STATUS: COMBAT_READY</span>
              <span>TACTICAL: {agent.name.toUpperCase()}</span>
              <div
                className="w-8 h-[2px] animate-pulse"
                style={{ backgroundColor: agent.color }}
              />
            </div>
          </div>

          {/* Dynamic 3D Parallax Character Cutout */}
          <div
            ref={charRef}
            className="absolute w-[135%] h-[115%] bottom-0 -left-[18%] z-30 pointer-events-none transition-transform duration-300 ease-out will-change-transform"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={agent.portrait}
              alt={agent.name}
              className="w-full h-full object-contain object-bottom animate-float drop-shadow-[0_20px_40px_rgba(0,0,0,0.9)]"
              style={{ filter: `drop-shadow(0 0 50px ${agent.accent})` }}
            />
          </div>
        </div>

        {/* RIGHT PANEL: VERTICAL TACTICAL EMBLEM */}
        <div className="p-6 flex flex-col justify-between items-center border-l border-white/10 z-20 bg-gradient-to-l from-[#06070a]/80 to-transparent">
          <div className="px-3 py-1 rounded-full border border-white/20 text-[10px] font-bold tracking-[2px] text-white">
            GAME DRIFTERS
          </div>

          <div className="flex flex-col items-center gap-3">
            <span className="[writing-mode:vertical-rl] font-black text-3xl tracking-[8px] text-white drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
              {agent.kanji}
            </span>
            <span className="[writing-mode:vertical-rl] text-[11px] tracking-[4px] uppercase text-white/60">
              {agent.name}
            </span>
            <span className="text-sm animate-pulse" style={{ color: agent.color }}>
              ✦
            </span>
            <span className="[writing-mode:vertical-rl] text-[11px] tracking-[4px] uppercase text-white/60">
              {player.role}
            </span>
          </div>

          <div className="text-center">
            <div className="text-white/30 text-xs">—</div>
            <p className="[writing-mode:vertical-rl] rotate-180 text-[8px] tracking-[3px] text-white/30 mt-1">
              システム起動完了
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};
