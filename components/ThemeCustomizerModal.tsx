"use client";

import React from "react";
import { RadiantTheme } from "@/lib/types";
import { soundFx } from "@/lib/soundEngine";

export interface ThemeSettings {
  theme: RadiantTheme;
  glowIntensity: number;
  visualMode: "VIBRANT" | "MATTE";
  particleDensity: "HIGH" | "MEDIUM" | "OFF";
}

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: ThemeSettings;
  onUpdateSettings: (newSettings: ThemeSettings) => void;
  accentColor: string;
}

export const THEME_PALETTES: Array<{ id: RadiantTheme; label: string; color: string; desc: string }> = [
  { id: "crimson", label: "CHAMPIONS CRIMSON", color: "#ff4655", desc: "VCT Official Crimson Red" },
  { id: "cyan", label: "CYBER CYAN", color: "#5bf8ff", desc: "Electric Cryo Plasma" },
  { id: "gold", label: "SOVEREIGN GOLD", color: "#fbbf24", desc: "Ascendant Sovereign Royale" },
  { id: "void", label: "SINGULARITY VOID", color: "#a855f7", desc: "Singularity Cosmic Purple" },
  { id: "emerald", label: "GAIA EMERALD", color: "#10b981", desc: "Gaia Vengeance Emerald" },
];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  accentColor,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* TOP ACCENT STRIP */}
        <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h3 className="font-syncopate font-bold text-base text-white tracking-wider">
              THEME & VISUAL STUDIO
            </h3>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Customize esports color palettes, glow auras, and background density
            </p>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          {/* 1. RADIANT COLOR PALETTES */}
          <div className="space-y-3">
            <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400 block">
              RADIANT PALETTE
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_PALETTES.map((t) => {
                const isSelected = settings.theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      soundFx.playClick();
                      onUpdateSettings({ ...settings, theme: t.id });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                      isSelected
                        ? "bg-white/10 border-white/40 shadow-lg"
                        : "bg-white/5 border-white/5 hover:border-white/20"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full shadow-md flex-shrink-0"
                      style={{ backgroundColor: t.color, boxShadow: `0 0 10px ${t.color}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-syncopate font-bold text-white truncate">
                        {t.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">{t.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. VISUAL MODE */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400 block">
              VISUAL RENDERING MODE
            </span>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "VIBRANT" as const, title: "VIBRANT GLOW", desc: "Cyber neon glows & high dynamic range" },
                { id: "MATTE" as const, title: "MATTE MINIMAL", desc: "Sleek, low-glow dark aesthetic" },
              ].map((mode) => {
                const isSelected = settings.visualMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    onClick={() => {
                      soundFx.playClick();
                      onUpdateSettings({ ...settings, visualMode: mode.id });
                    }}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "bg-white/10 border-white/40 shadow-md"
                        : "bg-white/5 border-white/5 hover:border-white/15 text-slate-400"
                    }`}
                  >
                    <div className="text-xs font-syncopate font-bold text-white">{mode.title}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{mode.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. GLOW INTENSITY SLIDER */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-300">AURORA & GLOW INTENSITY</span>
              <span className="font-bold" style={{ color: accentColor }}>
                {settings.glowIntensity.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.4"
              max="2.0"
              step="0.1"
              value={settings.glowIntensity}
              onChange={(e) =>
                onUpdateSettings({ ...settings, glowIntensity: parseFloat(e.target.value) })
              }
              className="w-full accent-[#ff4655] bg-white/10 rounded-lg cursor-pointer h-2"
            />
          </div>

          {/* 4. PARTICLE DENSITY */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400 block">
              RADIANITE PARTICLE DENSITY
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(["HIGH", "MEDIUM", "OFF"] as const).map((density) => (
                <button
                  key={density}
                  onClick={() => {
                    soundFx.playClick();
                    onUpdateSettings({ ...settings, particleDensity: density });
                  }}
                  className={`py-2 rounded-lg text-xs font-mono tracking-wider transition-all border ${
                    settings.particleDensity === density
                      ? "bg-white/10 text-white font-bold border-white/30"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {density}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="px-6 py-2 rounded-lg text-xs font-syncopate font-bold text-black tracking-wider transition-all"
            style={{ backgroundColor: accentColor }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  );
};
