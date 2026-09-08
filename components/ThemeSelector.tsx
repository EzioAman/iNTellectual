"use client";

import React from "react";
import { RadiantTheme } from "@/lib/types";
import { soundFx } from "@/lib/soundEngine";
import { THEME_PALETTES } from "./ThemeCustomizerModal";

interface ThemeSelectorProps {
  currentTheme: RadiantTheme;
  onSelectTheme: (theme: RadiantTheme) => void;
  onOpenCustomizer?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  onOpenCustomizer,
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-[#0c0f17]/90 border border-white/10 px-2.5 py-1.5 rounded-full backdrop-blur-md select-none">
      <div className="flex items-center gap-1">
        {THEME_PALETTES.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              soundFx.playHover();
              onSelectTheme(t.id);
            }}
            title={t.label}
            className={`w-4 h-4 rounded-full transition-transform ${
              currentTheme === t.id ? "scale-125 ring-2 ring-white/60 shadow-lg" : "opacity-60 hover:opacity-100 hover:scale-110"
            }`}
            style={{ backgroundColor: t.color, boxShadow: currentTheme === t.id ? `0 0 8px ${t.color}` : "none" }}
          />
        ))}
      </div>

      {onOpenCustomizer && (
        <>
          <span className="text-white/20 text-xs">|</span>
          <button
            onClick={() => {
              soundFx.playClick();
              onOpenCustomizer();
            }}
            title="Open Theme & Visual Customizer Studio"
            className="text-[10px] font-mono text-slate-400 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/5 transition-colors flex items-center gap-1"
          >
            <span>CUSTOMIZE</span>
            <span>⚙</span>
          </button>
        </>
      )}
    </div>
  );
};
