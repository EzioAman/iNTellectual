"use client";

import React, { useState, useEffect } from "react";
import { PlayerRecord, CoachScores } from "@/lib/types";
import { calculatePlayerScores, getTier, ROLE_BENCHMARK_TARGETS } from "@/lib/valorantEngine";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

interface CoachAssessmentModalProps {
  player: PlayerRecord;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedPlayer: PlayerRecord, allPlayers: PlayerRecord[]) => void;
  accentColor: string;
}

export const CoachAssessmentModal: React.FC<CoachAssessmentModalProps> = ({
  player,
  isOpen,
  onClose,
  onSave,
  accentColor,
}) => {
  const [scores, setScores] = useState<CoachScores>({ ...player.coachScores });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setScores({ ...player.coachScores });
    setErrorMsg(null);
  }, [player]);

  if (!isOpen) return null;

  const agent = getAgent(player.agent);
  const targets = ROLE_BENCHMARK_TARGETS[player.role] || ROLE_BENCHMARK_TARGETS["Duelist"];

  // Calculate live projection
  const projectedNorm = calculatePlayerScores(
    player.role,
    scores,
    {
      hsPercent: player.rawStats.hsPercent,
      acs: player.rawStats.acs,
      kd: player.rawStats.kd,
    }
  );

  const projectedRating = projectedNorm.overall;
  const projectedTier = getTier(projectedRating);
  const ratingDelta = Number((projectedRating - player.careerRating).toFixed(2));

  const handleSlider = (key: keyof CoachScores, val: number) => {
    soundFx.playHover();
    setScores((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      soundFx.playCommit();
      const res = await fetch("/api/coach-eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: player.player,
          scores,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Failed to commit metrics");
      }

      onSave(data.player, data.players);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed saving metrics");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-xl bg-[#0c0f17] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* TOP ACCENT STRIP */}
        <div className="h-1.5 w-full" style={{ backgroundColor: accentColor }} />

        {/* HEADER */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 p-1 flex items-center justify-center">
              <img src={agent.displayIcon} alt={agent.name} className="w-10 h-10 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-syncopate font-bold text-lg text-white">{player.name}</span>
                <span className="text-xs font-mono text-slate-400">{player.tag}</span>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono uppercase"
                  style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                >
                  {player.role}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400">
                COACH METRICS STUDIO // RATING EVALUATOR
              </p>
            </div>
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
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {/* PROJECTED RATING BAR */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">
                CURRENT RATING
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-teko text-slate-300">
                  {player.careerRating.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-400">TIER {player.tier}</span>
              </div>
            </div>

            <div className="text-center font-mono text-sm text-slate-500">➔</div>

            <div className="text-right">
              <span className="text-[10px] font-syncopate uppercase tracking-widest text-slate-400">
                PROJECTED RATING
              </span>
              <div className="flex items-baseline gap-2 mt-1 justify-end">
                <span
                  className="text-3xl font-teko font-bold"
                  style={{ color: accentColor }}
                >
                  {projectedRating.toFixed(2)}
                </span>
                <span className="text-xs font-mono text-slate-300">TIER {projectedTier}</span>
                <span
                  className={`text-xs font-mono font-bold px-1.5 py-0.5 rounded ${
                    ratingDelta > 0
                      ? "bg-emerald-500/20 text-emerald-400"
                      : ratingDelta < 0
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-white/10 text-slate-400"
                  }`}
                >
                  {ratingDelta > 0 ? `+${ratingDelta}` : ratingDelta}
                </span>
              </div>
            </div>
          </div>

          {/* 5 COACH CRITERIA SLIDERS */}
          <div className="space-y-4">
            <h4 className="text-xs font-syncopate uppercase tracking-wider text-slate-300">
              COACH METRICS (0.0 — 10.0)
            </h4>

            {[
              { key: "aim" as const, label: "MECHANICAL AIM", target: targets.aim },
              { key: "utility" as const, label: "UTILITY USAGE & VALUE", target: targets.utility },
              { key: "comms" as const, label: "COMMUNICATION & INFO", target: targets.comms },
              { key: "entry" as const, label: "ENTRY & SPACE CREATION", target: targets.entry },
              { key: "clutch" as const, label: "CLUTCH & COMPOSURE", target: targets.clutch },
            ].map(({ key, label, target }) => (
              <div key={key} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-slate-300">{label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">BENCHMARK: {target}</span>
                    <span
                      className="font-bold text-sm px-2 py-0.5 rounded bg-white/5"
                      style={{ color: accentColor }}
                    >
                      {scores[key].toFixed(1)}
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={scores[key]}
                  onChange={(e) => handleSlider(key, parseFloat(e.target.value))}
                  className="w-full accent-[#ff4655] bg-white/10 rounded-lg cursor-pointer h-2"
                />
              </div>
            ))}
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                onClose();
              }}
              className="px-4 py-2 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg text-xs font-syncopate font-bold text-black tracking-wider transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2"
              style={{
                backgroundColor: accentColor,
                boxShadow: `0 0 20px ${accentColor}80`,
              }}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>SAVING METRICS...</span>
                </>
              ) : (
                <>
                  <span>APPLY METRICS</span>
                  <span>➔</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
