"use client";

import React, { useState, useEffect } from "react";
import {
  PlayerRecord,
  MatchHistoryEntry,
  SquadMetrics,
  RadiantTheme,
  WeightConfig,
} from "@/lib/types";
import {
  FALLBACK_PLAYERS,
  FALLBACK_MATCH_HISTORY,
  FALLBACK_METRICS,
} from "@/lib/fallbackData";
import { calculatePlayerScores, getTier, DEFAULT_WEIGHTS } from "@/lib/valorantEngine";
import { getAgent } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";

import { CommandOverview } from "@/components/CommandOverview";
import { OperativeDossier } from "@/components/OperativeDossier";
import { ComparisonTool } from "@/components/ComparisonTool";
import { SquadTelemetry } from "@/components/SquadTelemetry";
import { StrategyBuilder } from "@/components/StrategyBuilder";
import { MatchArchives } from "@/components/MatchArchives";
import { ThemeSelector } from "@/components/ThemeSelector";
import { ThemeCustomizerModal, ThemeSettings } from "@/components/ThemeCustomizerModal";
import { VCTMusicPlayer } from "@/components/VCTMusicPlayer";
import { CoachAssessmentModal } from "@/components/CoachAssessmentModal";
import { BroadcastMode } from "@/components/BroadcastMode";
import { ReactBitsBackground } from "@/components/ReactBitsBackground";
import { SystemAtlasGuide } from "@/components/SystemAtlasGuide";
import { AdminControlPanel } from "@/components/AdminControlPanel";
import { FloatingCoachBot } from "@/components/FloatingCoachBot";
import { UserRole } from "@/lib/types";

export default function Home() {
  const [activeTab, setActiveTab] = useState<
    "COMMAND" | "DOSSIER" | "VERSUS" | "TELEMETRY" | "STRATEGY" | "ARCHIVES" | "GUIDE"
  >("COMMAND");

  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    theme: "crimson",
    glowIntensity: 1.0,
    visualMode: "VIBRANT",
    particleDensity: "MEDIUM",
  });
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  // Authentication & Role Access Control (Super Admin: M@rfit, Admin: co@ch)
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>("GUEST");

  const [players, setPlayers] = useState<PlayerRecord[]>(FALLBACK_PLAYERS);
  const [history, setHistory] = useState<MatchHistoryEntry[]>(FALLBACK_MATCH_HISTORY);
  const [metrics, setMetrics] = useState<SquadMetrics>(FALLBACK_METRICS);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRecord>(FALLBACK_PLAYERS[0]);

  // Hovered agent for dynamic atmospheric background
  const [hoveredAgentName, setHoveredAgentName] = useState<string | null>(null);

  // Coach Studio & Broadcast State
  const [evaluatingPlayer, setEvaluatingPlayer] = useState<PlayerRecord | null>(null);
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);

  const [weights, setWeights] = useState<WeightConfig>(DEFAULT_WEIGHTS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [toast, setToast] = useState<{
    type: "success" | "error" | "info";
    message: string;
  } | null>(null);

  // Active agent for background presentation
  const activeAgent = getAgent(hoveredAgentName || selectedPlayer?.agent || "Jett");

  // Fetch from autonomous local database on mount
  useEffect(() => {
    async function loadData() {
      try {
        const rosterRes = await fetch("/api/roster");
        if (rosterRes.ok) {
          const rosterData = await rosterRes.json();
          if (rosterData.players && rosterData.players.length > 0) {
            setPlayers(rosterData.players);
            setSelectedPlayer(rosterData.players[0]);
            setHistory(rosterData.history || FALLBACK_MATCH_HISTORY);
            setMetrics(rosterData.metrics || FALLBACK_METRICS);
          }
        }
      } catch (err) {
        console.warn("Autonomous DB fetch fallback:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Update HTML data-theme
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeSettings.theme);
  }, [themeSettings.theme]);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.key === "b" || e.key === "B") {
        setIsBroadcastOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Recalculate player scores when weights change
  const handleWeightsChange = (newWeights: WeightConfig) => {
    soundFx.playHover();
    setWeights(newWeights);

    const recomputed = players.map((p) => {
      const norm = calculatePlayerScores(
        p.role,
        p.coachScores,
        {
          hsPercent: p.rawStats.hsPercent,
          acs: p.rawStats.acs,
          kd: p.rawStats.kd,
        },
        newWeights
      );
      const overall = norm.overall;
      return {
        ...p,
        normalized: norm,
        careerRating: overall,
        tier: getTier(overall),
      };
    });

    recomputed.sort((a, b) => b.careerRating - a.careerRating);
    recomputed.forEach((p, idx) => {
      p.rank = idx + 1;
    });

    setPlayers(recomputed);
    if (selectedPlayer) {
      const updatedSel = recomputed.find((p) => p.player === selectedPlayer.player);
      if (updatedSel) setSelectedPlayer(updatedSel);
    }
  };

  // Coach metrics committed callback
  const handleCoachEvalSaved = (updatedPlayer: PlayerRecord, allPlayers: PlayerRecord[]) => {
    setPlayers(allPlayers);
    setSelectedPlayer(updatedPlayer);
    setEvaluatingPlayer(null);
    setToast({
      type: "success",
      message: `Coach assessment saved for ${updatedPlayer.name} (Tier ${updatedPlayer.tier})`,
    });
    setTimeout(() => setToast(null), 4000);
  };

  // Autonomous Database Refresh
  const handleRefreshData = async () => {
    soundFx.playClick();
    setIsSyncing(true);
    try {
      const res = await fetch("/api/roster");
      if (res.ok) {
        const data = await res.json();
        if (data.players) {
          setPlayers(data.players);
          if (selectedPlayer) {
            const match = data.players.find((p: PlayerRecord) => p.player === selectedPlayer.player);
            if (match) setSelectedPlayer(match);
          }
          setHistory(data.history || history);
          setMetrics(data.metrics || metrics);
          soundFx.playCommit();
          setToast({
            type: "success",
            message: "Squad database synchronized successfully.",
          });
        }
      }
    } catch (err) {
      setToast({
        type: "error",
        message: "Failed syncing with local database.",
      });
    } finally {
      setIsSyncing(false);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const getAccentColor = (): string => {
    switch (themeSettings.theme) {
      case "cyan":
        return "#5bf8ff";
      case "gold":
        return "#fbbf24";
      case "void":
        return "#a855f7";
      case "emerald":
        return "#10b981";
      case "crimson":
      default:
        return "#ff4655";
    }
  };

  const accentColor = getAccentColor();

  return (
    <div className="min-h-screen bg-[#040508] text-[#ece8e1] flex flex-col relative overflow-x-hidden selection:bg-[#ff4655] selection:text-white font-sans">
      {/* REACT.BITS DYNAMIC AURORA & CYBER GRID BACKGROUND */}
      <ReactBitsBackground
        activeAgent={activeAgent}
        accentColor={accentColor}
        glowIntensity={themeSettings.glowIntensity}
        particleDensity={themeSettings.particleDensity}
      />

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce transition-all">
          <div
            className={`px-5 py-3 rounded-lg border backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs font-mono max-w-md ${
              toast.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-300"
                : toast.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-300"
                : "bg-cyan-950/90 border-cyan-500/50 text-cyan-300"
            }`}
          >
            <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-white/40 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* THEME CUSTOMIZER MODAL */}
      {isThemeModalOpen && (
        <ThemeCustomizerModal
          isOpen={isThemeModalOpen}
          onClose={() => setIsThemeModalOpen(false)}
          settings={themeSettings}
          onUpdateSettings={setThemeSettings}
          accentColor={accentColor}
        />
      )}

      {/* COACH ASSESSMENT MODAL */}
      {evaluatingPlayer && (
        <CoachAssessmentModal
          player={evaluatingPlayer}
          isOpen={true}
          onClose={() => setEvaluatingPlayer(null)}
          onSave={handleCoachEvalSaved}
          accentColor={accentColor}
        />
      )}

      {/* BROADCAST PRESENTATION OVERLAY */}
      {isBroadcastOpen && (
        <BroadcastMode
          players={players}
          initialPlayer={selectedPlayer}
          isOpen={isBroadcastOpen}
          onClose={() => setIsBroadcastOpen(false)}
          accentColor={accentColor}
        />
      )}

      {/* ADMIN & ROLE CONTROL PANEL MODAL (SUPER ADMIN: M@rfit, ADMIN: co@ch) */}
      {isAdminModalOpen && (
        <AdminControlPanel
          isOpen={isAdminModalOpen}
          onClose={() => setIsAdminModalOpen(false)}
          accentColor={accentColor}
          currentRole={userRole}
          onRoleChanged={(role) => setUserRole(role)}
          players={players}
          onPlayersUpdated={(updated) => {
            setPlayers(updated);
            if (updated.length > 0 && !updated.find((p) => p.player === selectedPlayer?.player)) {
              setSelectedPlayer(updated[0]);
            }
          }}
        />
      )}

      {/* TOP TACTICAL NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-[#06070a]/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* BRAND / LOGO WITH MORFIT ATTRIBUTION */}
            <div className="flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center font-syncopate font-black text-xl text-black shadow-lg cursor-pointer transform hover:scale-105 transition-transform"
                style={{ backgroundColor: accentColor, boxShadow: `0 0 20px ${accentColor}80` }}
                onClick={() => {
                  soundFx.playClick();
                  setActiveTab("COMMAND");
                }}
              >
                IT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-syncopate font-black text-xl tracking-wider text-white">
                    INTELLECTUAL
                  </span>
                  <span
                    className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border font-bold tracking-wider"
                    style={{
                      borderColor: `${accentColor}50`,
                      color: accentColor,
                      backgroundColor: `${accentColor}15`,
                    }}
                  >
                    BY MORFIT
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TACTICAL SUITE // MADE BY AUTHOR - MORFIT</span>
                  <span className="text-white/20">|</span>
                  <span>{players.length} OPERATIVES</span>
                </div>
              </div>
            </div>

            {/* CONTROLS (ADMIN ACCESS, SYSTEM ATLAS, BROADCAST, NON-COPYRIGHTED VCT RADIO, THEME & SYNC) */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* ADMIN & ROLE ACCESS TRIGGER */}
              <button
                onClick={() => {
                  soundFx.playHover();
                  setIsAdminModalOpen(true);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-syncopate tracking-wider transition-all shadow-md ${
                  userRole === "SUPER_ADMIN"
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-amber-500/20 font-bold"
                    : userRole === "ADMIN"
                    ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold shadow-cyan-500/20"
                    : userRole === "USER"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold shadow-emerald-500/20"
                    : "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-white/30"
                }`}
                title="Account & Role-Based Access Control"
              >
                {userRole === "SUPER_ADMIN" ? (
                  <>
                    <span className="text-amber-400">👑</span>
                    <span className="hidden sm:inline">SUPER ADMIN</span>
                  </>
                ) : userRole === "ADMIN" ? (
                  <>
                    <span className="text-cyan-400">🛡️</span>
                    <span className="hidden sm:inline">COACH ADMIN</span>
                  </>
                ) : userRole === "USER" ? (
                  <>
                    <span className="text-emerald-400">👤</span>
                    <span className="hidden sm:inline">MEMBER</span>
                  </>
                ) : (
                  <>
                    <span>🔑</span>
                    <span className="hidden sm:inline">SIGN IN</span>
                  </>
                )}
              </button>

              {/* SYSTEM ATLAS & ARCHITECTURE GUIDE QUICK LINK (RESTRICTED TO SUPER ADMIN) */}
              <button
                onClick={() => {
                  soundFx.playHover();
                  setActiveTab("GUIDE");
                }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-syncopate tracking-wider transition-all ${
                  activeTab === "GUIDE"
                    ? "bg-amber-500/20 text-amber-300 border-amber-400 font-bold shadow-lg"
                    : userRole === "SUPER_ADMIN"
                    ? "bg-white/5 border-white/10 text-slate-300 hover:text-white hover:border-amber-400/50"
                    : "bg-white/5 border-white/10 text-slate-400 hover:text-slate-300"
                }`}
                title={userRole === "SUPER_ADMIN" ? "System Atlas (Super Admin)" : "System Atlas (Requires Super Admin Login)"}
              >
                <span>{userRole === "SUPER_ADMIN" ? "📖" : "🔒"}</span>
                <span>{userRole === "SUPER_ADMIN" ? "SYSTEM ATLAS" : "ATLAS [LOCKED]"}</span>
              </button>

              {/* BROADCAST MODE TRIGGER */}
              <button
                onClick={() => {
                  soundFx.playHover();
                  setIsBroadcastOpen(true);
                }}
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:border-white/30 text-xs font-syncopate tracking-wider text-slate-300 hover:text-white transition-all group"
                title="Open Esports Broadcast Stage Presentation (Shortcut: 'B')"
              >
                <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                <span>BROADCAST [B]</span>
              </button>

              {/* NON-COPYRIGHTED VALORANT MUSIC PLAYER (LOOPING, 15% DEF VOLUME) */}
              <VCTMusicPlayer accentColor={accentColor} isCompact={true} />

              {/* THEME SELECTOR & CUSTOMIZER TRIGGER */}
              <ThemeSelector
                currentTheme={themeSettings.theme}
                onSelectTheme={(t) => setThemeSettings({ ...themeSettings, theme: t })}
                onOpenCustomizer={() => setIsThemeModalOpen(true)}
              />

              {/* SYNC / REFRESH BUTTON */}
              <button
                onClick={handleRefreshData}
                disabled={isSyncing}
                className="group relative px-3 sm:px-4 py-2 rounded-lg font-syncopate text-xs tracking-wider transition-all overflow-hidden border border-white/20 hover:border-white/40 active:scale-95 disabled:opacity-50"
                style={{
                  background: isSyncing
                    ? "rgba(255,255,255,0.05)"
                    : `linear-gradient(135deg, ${accentColor}20, rgba(255,255,255,0.05))`,
                }}
                title="Synchronize with Squad Database"
              >
                <div className="flex items-center gap-2">
                  <svg
                    className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-cyan-400" : "text-white group-hover:rotate-180 transition-transform duration-500"}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  <span className="text-white font-bold hidden sm:inline">
                    {isSyncing ? "SYNCING..." : "SYNC"}
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* NAVIGATION TABS (7 TABS) */}
          <nav className="flex space-x-1 sm:space-x-2 border-t border-white/5 py-2 overflow-x-auto scrollbar-none">
            {[
              { id: "COMMAND", label: "01 // SQUAD OVERVIEW", icon: "⬡" },
              { id: "DOSSIER", label: "02 // OPERATIVE DOSSIER", icon: "◈" },
              { id: "VERSUS", label: "03 // HEAD-TO-HEAD", icon: "⚔" },
              { id: "TELEMETRY", label: "04 // ROSTER PERFORMANCE", icon: "∿" },
              { id: "STRATEGY", label: "05 // STRATEGY BUILDER", icon: "🗺" },
              { id: "ARCHIVES", label: "06 // MATCH ARCHIVES", icon: "▥" },
              {
                id: "GUIDE",
                label: userRole === "SUPER_ADMIN" ? "07 // SYSTEM ATLAS" : "07 // SYSTEM ATLAS 🔒",
                icon: userRole === "SUPER_ADMIN" ? "📖" : "🔒",
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    soundFx.playHover();
                    setActiveTab(tab.id as any);
                  }}
                  onMouseEnter={() => soundFx.playHover()}
                  className={`relative px-4 py-2.5 rounded-lg text-xs font-syncopate tracking-wider transition-all whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? "text-white font-black bg-white/10 shadow-lg"
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span style={{ color: isActive ? accentColor : "inherit" }}>
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{
                        backgroundColor: accentColor,
                        boxShadow: `0 0 10px ${accentColor}`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* MAIN VIEWPORT */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
            <div
              className="w-16 h-16 border-4 border-t-transparent rounded-full animate-spin"
              style={{ borderColor: `${accentColor} transparent ${accentColor} ${accentColor}` }}
            />
            <p className="font-syncopate text-xs tracking-widest text-slate-400 uppercase animate-pulse">
              LOADING TACTICAL COMMAND CORE...
            </p>
          </div>
        ) : (
          <div>
            {activeTab === "COMMAND" && (
              <CommandOverview
                players={players}
                metrics={metrics}
                accentColor={accentColor}
                onSelectPlayer={(p) => {
                  setSelectedPlayer(p);
                  setActiveTab("DOSSIER");
                }}
                onEvaluatePlayer={(p) => {
                  setEvaluatingPlayer(p);
                }}
                onHoverAgent={setHoveredAgentName}
              />
            )}

            {activeTab === "DOSSIER" && (
              <OperativeDossier
                players={players}
                history={history}
                selectedPlayer={selectedPlayer}
                onSelectPlayer={setSelectedPlayer}
                onEvaluatePlayer={(p) => {
                  setEvaluatingPlayer(p);
                }}
                onHoverAgent={setHoveredAgentName}
                accentColor={accentColor}
              />
            )}

            {activeTab === "VERSUS" && <ComparisonTool players={players} />}

            {activeTab === "TELEMETRY" && (
              <SquadTelemetry
                players={players}
                accentColor={accentColor}
                onSelectPlayer={(p) => {
                  setSelectedPlayer(p);
                  setActiveTab("DOSSIER");
                }}
              />
            )}

            {activeTab === "STRATEGY" && (
              <StrategyBuilder players={players} accentColor={accentColor} />
            )}

            {activeTab === "ARCHIVES" && <MatchArchives history={history} />}

            {activeTab === "GUIDE" && (
              userRole === "SUPER_ADMIN" ? (
                <SystemAtlasGuide
                  accentColor={accentColor}
                  onNavigateTab={(tab) => {
                    soundFx.playClick();
                    setActiveTab(tab as any);
                  }}
                />
              ) : (
                <div className="max-w-2xl mx-auto py-16 text-center space-y-5 rounded-3xl bg-[#090c14]/90 border border-amber-500/30 p-8 backdrop-blur-2xl shadow-2xl animate-fade-in font-mono">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-3xl mx-auto text-amber-400 animate-pulse">
                    🔒
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-syncopate font-black text-white tracking-wider">
                      SUPER ADMIN ACCESS REQUIRED
                    </h2>
                    <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                      The System Atlas, codebase file blueprints, and telemetric data flow schemas are restricted to the Platform Architect (Super Admin).
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setIsAdminModalOpen(true);
                      }}
                      className="px-6 py-3 rounded-xl font-syncopate font-black text-xs text-black tracking-wider transition-all shadow-xl hover:scale-105"
                      style={{ backgroundColor: accentColor }}
                    >
                      AUTHENTICATE AS SUPER ADMIN ➔
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>

      {/* TACTICAL TELEMETRIC FOOTER WITH CLEAN ATTRIBUTION */}
      <footer className="relative z-10 border-t border-white/10 bg-[#06070a]/90 backdrop-blur-md py-6 text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            <span className="text-slate-300 font-syncopate tracking-wider font-bold">
              INTELLECTUAL // MADE BY AUTHOR - MORFIT
            </span>
            <span className="text-white/20">/</span>
            <span className="text-slate-400">v4.5.0-PRO</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsAdminModalOpen(true);
              }}
              className="text-amber-400 hover:text-amber-300 transition-colors hover:underline flex items-center gap-1 font-syncopate font-bold"
            >
              <span>🔑 ACCESS PORTAL</span>
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => setIsBroadcastOpen(true)}
              className="text-slate-400 hover:text-white transition-colors hover:underline flex items-center gap-1"
            >
              <span>BROADCAST STAGE</span>
              <span className="text-[10px]">[B]</span>
            </button>
            <span className="text-white/20">|</span>
            <button
              onClick={() => setIsThemeModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors hover:underline flex items-center gap-1"
            >
              <span>THEME STUDIO</span>
              <span className="text-[10px]">⚙</span>
            </button>
          </div>
        </div>
      </footer>

      {/* BOTTOM-RIGHT FLOATING CONTEXT-AWARE TACTICAL RAG BOT */}
      <FloatingCoachBot
        activePlayer={selectedPlayer}
        allPlayers={players}
        accentColor={accentColor}
      />
    </div>
  );
}
