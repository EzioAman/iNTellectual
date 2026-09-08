"use client";

import React, { useState } from "react";
import { PlayerRecord } from "@/lib/types";
import { soundFx } from "@/lib/soundEngine";

interface TacticalCoachBotProps {
  players: PlayerRecord[];
  accentColor: string;
}

export const TacticalCoachBot: React.FC<TacticalCoachBotProps> = ({
  players,
  accentColor,
}) => {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>(players[0]?.player || "");
  const [query, setQuery] = useState<string>("Analyze performance gaps and give me an improvement plan");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [response, setResponse] = useState<{
    answer: string;
    drills: string[];
    focusPillars: string[];
    contextRetrieved: string;
  } | null>(null);

  const handleAsk = async (customQuery?: string) => {
    const q = customQuery || query;
    if (!q) return;

    soundFx.playClick();
    setIsLoading(true);

    try {
      const res = await fetch("/api/coach-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q, playerId: selectedPlayerId }),
      });
      const data = await res.json();
      if (data.success) {
        setResponse(data);
      }
    } catch (err) {
      console.error("Coach Bot error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#0c0f17]/90 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
            <h3 className="font-syncopate font-bold text-base text-white tracking-wider">
              VCT RAG TACTICAL COACH BOT
            </h3>
            <span
              className="px-2 py-0.5 rounded text-[10px] font-mono"
              style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
            >
              RAG ENGINE ACTIVE
            </span>
          </div>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Cross-references Google Sheets stats, coach scores, and role benchmarks to output tailored improvement plans
          </p>
        </div>

        {/* OPERATIVE SELECTOR */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-slate-400 hidden sm:inline">OPERATIVE:</label>
          <select
            value={selectedPlayerId}
            onChange={(e) => {
              soundFx.playHover();
              setSelectedPlayerId(e.target.value);
            }}
            className="bg-[#121624] border border-white/20 text-white text-xs font-mono rounded-lg px-3 py-1.5 outline-none focus:border-white/40"
          >
            {players.map((p) => (
              <option key={p.player} value={p.player}>
                {p.name} ({p.role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* PROMPT CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[10px] font-mono text-slate-500 uppercase">SUGGESTIONS:</span>
        {[
          "Analyze performance deficits & training routine",
          "How to improve crosshair placement & HS%",
          "Tactical site entry & utility timing advice",
          "Clutch composure & isolation drills",
        ].map((chip) => (
          <button
            key={chip}
            onClick={() => {
              setQuery(chip);
              handleAsk(chip);
            }}
            className="px-3 py-1 rounded-full text-[10px] font-mono bg-white/5 hover:bg-white/15 border border-white/10 text-slate-300 hover:text-white transition-all whitespace-nowrap"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* INPUT BOX */}
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAsk()}
          placeholder="Ask tactical coach bot a question regarding player performance or team strategy..."
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
        />
        <button
          onClick={() => handleAsk()}
          disabled={isLoading}
          className="px-5 py-2.5 rounded-xl font-syncopate font-bold text-xs text-black tracking-wider transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 flex-shrink-0"
          style={{ backgroundColor: accentColor }}
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <span>RUN RAG ANALYSIS</span>
          )}
        </button>
      </div>

      {/* FEEDBACK OUTPUT CARD */}
      {response && (
        <div className="p-5 rounded-xl bg-black/60 border border-white/15 space-y-4 animate-fade-in font-mono text-xs">
          {/* RETRIEVAL SOURCE BADGE */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] text-slate-400">
              RETRIEVED CONTEXT: <b className="text-white">{response.contextRetrieved}</b>
            </span>
            <div className="flex items-center gap-1.5">
              {response.focusPillars.map((fp) => (
                <span
                  key={fp}
                  className="px-2 py-0.5 rounded text-[9px] font-bold uppercase"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {fp}
                </span>
              ))}
            </div>
          </div>

          {/* MAIN ANSWER TEXT (MARKDOWN RENDERED) */}
          <div className="text-slate-200 leading-relaxed whitespace-pre-line space-y-2">
            {response.answer}
          </div>

          {/* RECOMMENDED DRILLS */}
          {response.drills && response.drills.length > 0 && (
            <div className="p-4 rounded-lg bg-white/5 border border-white/5 space-y-2">
              <span className="text-[10px] font-syncopate uppercase tracking-widest text-emerald-400 block font-bold">
                RECOMMENDED SCRIM DRILLS & PRACTICE ROUTINE
              </span>
              <ul className="space-y-1 text-slate-300">
                {response.drills.map((drill, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span>
                    <span>{drill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
