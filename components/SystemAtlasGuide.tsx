"use client";

import React, { useState } from "react";
import { soundFx } from "@/lib/soundEngine";

interface SystemAtlasGuideProps {
  accentColor: string;
  onNavigateTab: (tab: string) => void;
}

interface FileAtlasEntry {
  path: string;
  basename: string;
  category: "UI Component" | "Core State & Layout" | "Engine & Data" | "API Route" | "Persistence";
  description: string;
  exports: string[];
  invokedBy: string[];
  invokes: string[];
  tags: string[];
}

const FILE_ATLAS_DATA: FileAtlasEntry[] = [
  {
    path: "app/page.tsx",
    basename: "page.tsx",
    category: "Core State & Layout",
    description:
      "The master cockpit and root orchestrator of the entire application. Manages global states (active tab, selected operative, theme settings, audio, and player database), keyboard shortcuts (like 'B' for Broadcast Mode), and synchronizes with local API routes.",
    exports: ["default Home()"],
    invokedBy: ["Next.js App Router (Root URL '/')"],
    invokes: [
      "components/CommandOverview.tsx",
      "components/OperativeDossier.tsx",
      "components/ComparisonTool.tsx",
      "components/SquadTelemetry.tsx",
      "components/StrategyBuilder.tsx",
      "components/MatchArchives.tsx",
      "components/SystemAtlasGuide.tsx",
      "components/BroadcastMode.tsx",
      "components/VCTMusicPlayer.tsx",
      "components/CoachAssessmentModal.tsx",
      "components/ReactBitsBackground.tsx",
      "app/api/roster/route.ts",
    ],
    tags: ["root", "cockpit", "navigation", "state"],
  },
  {
    path: "components/StrategyBuilder.tsx",
    basename: "StrategyBuilder.tsx",
    category: "UI Component",
    description:
      "ValoPlant-grade tactical whiteboard and strategy builder. Displays official 2D top-down radar minimaps for all 11 maps, provides draggable Attacker/Defender agent tokens, utility dropping (resizable smokes, barrier walls, flash bursts, recon pings, spike indicators), tactical push arrows, 3 execution phases, and 1-click Pro Playbooks.",
    exports: ["StrategyBuilder (React Component)"],
    invokedBy: ["app/page.tsx (Tab: 'STRATEGY')"],
    invokes: [
      "lib/mapData.ts (Maps, minimap URLs, pro playbooks)",
      "lib/agentData.ts (Agent display icons & colors)",
      "lib/soundEngine.ts (Audio interaction cues)",
      "components/TacticalCoachBot.tsx (AI assistant)",
      "app/api/strategies/route.ts (GET & POST playbooks)",
    ],
    tags: ["strategy", "map", "whiteboard", "valoplant", "tactics", "pro presets"],
  },
  {
    path: "components/SquadTelemetry.tsx",
    basename: "SquadTelemetry.tsx",
    category: "UI Component",
    description:
      "Intuitive Roster Performance and Squad Health Hub. Replaces complex scatter plot math with plain-English performance cards, universal benchmark progress bars (ACS, K/D, Headshot %), squad role balance checklist (Duelist, Initiator, Controller, Sentinel), pro playstyle identity matching, and actionable scrim tips.",
    exports: ["SquadTelemetry (React Component)"],
    invokedBy: ["app/page.tsx (Tab: 'TELEMETRY')"],
    invokes: [
      "lib/agentData.ts (Operative portraits & colors)",
      "lib/soundEngine.ts (Audio feedback)",
      "lib/types.ts (PlayerRecord)",
    ],
    tags: ["telemetry", "performance", "squad health", "roster", "benchmarks"],
  },
  {
    path: "components/VCTMusicPlayer.tsx",
    basename: "VCTMusicPlayer.tsx",
    category: "UI Component",
    description:
      "Audio engine and persistent music player. Plays copyright-safe Valorant esports music with continuous indefinite looping (audio.loop = true), a default volume preset of 15% (0.15), and a popover volume slider with quick presets (15%, 50%, 100%) and mute toggle.",
    exports: ["VCTMusicPlayer (React Component)"],
    invokedBy: ["app/page.tsx (Global Top Header)"],
    invokes: ["lib/musicTracks.ts (VCT_PLAYLIST)", "HTMLAudioElement (Browser Audio API)"],
    tags: ["music", "audio", "volume", "loop", "radio"],
  },
  {
    path: "components/BroadcastMode.tsx",
    basename: "BroadcastMode.tsx",
    category: "UI Component",
    description:
      "Esports tournament broadcast presentation stage (accessible via keyboard shortcut 'B' or top header button). Renders a television-style broadcast HUD with live match clock, live agent portraits, and dynamic presentation camera.",
    exports: ["BroadcastMode (React Component)"],
    invokedBy: ["app/page.tsx (Shortcut 'B' or Header Button)"],
    invokes: ["lib/agentData.ts", "lib/soundEngine.ts", "lib/types.ts"],
    tags: ["broadcast", "esports", "hud", "stage", "presentation"],
  },
  {
    path: "components/TacticalCoachBot.tsx",
    basename: "TacticalCoachBot.tsx",
    category: "UI Component",
    description:
      "Integrated VCT Tactical AI Coach assistant. Utilizes Retrieval-Augmented Generation (RAG) over the live squad database (data/squad_db.json) to provide tactical advice, role assignments, and site execution feedback.",
    exports: ["TacticalCoachBot (React Component)"],
    invokedBy: ["components/StrategyBuilder.tsx"],
    invokes: ["app/api/coach-bot/route.ts", "lib/soundEngine.ts"],
    tags: ["ai", "bot", "rag", "coach", "chat"],
  },
  {
    path: "components/CommandOverview.tsx",
    basename: "CommandOverview.tsx",
    category: "UI Component",
    description:
      "Squad leaderboard and command center. Shows overall team rank, top ACS fragger, top K/D operative, win rate gauges, and quick action cards to open Coach Assessment or inspect dossiers.",
    exports: ["CommandOverview (React Component)"],
    invokedBy: ["app/page.tsx (Tab: 'COMMAND')"],
    invokes: ["lib/agentData.ts", "lib/soundEngine.ts", "lib/types.ts"],
    tags: ["overview", "leaderboard", "stats", "command"],
  },
  {
    path: "components/OperativeDossier.tsx",
    basename: "OperativeDossier.tsx",
    category: "UI Component",
    description:
      "Comprehensive single-operative dossier. Displays tactical hex radar (Aim, Utility, Comms, Entry, Clutch), recent match performance timeline, coach notes, and quick action to launch coach evaluation.",
    exports: ["OperativeDossier (React Component)"],
    invokedBy: ["app/page.tsx (Tab: 'DOSSIER')"],
    invokes: ["lib/agentData.ts", "lib/soundEngine.ts", "lib/types.ts"],
    tags: ["dossier", "profile", "hex radar", "match history"],
  },
  {
    path: "components/ComparisonTool.tsx",
    basename: "ComparisonTool.tsx",
    category: "UI Component",
    description:
      "Dual operative head-to-head comparison module. Allows coaches to pick any two players and compare their ACS, K/D, Headshot %, clutch composure, and role efficiency side-by-side.",
    exports: ["ComparisonTool (React Component)"],
    invokedBy: ["app/page.tsx (Tab: 'VERSUS')"],
    invokes: ["lib/agentData.ts", "lib/soundEngine.ts", "lib/types.ts"],
    tags: ["versus", "comparison", "head to head", "duel"],
  },
  {
    path: "components/CoachAssessmentModal.tsx",
    basename: "CoachAssessmentModal.tsx",
    category: "UI Component",
    description:
      "Interactive coach evaluation studio modal. Lets the head coach rate an operative's Aim, Comms, Utility, Entry, and Clutch on a 1-10 scale, which re-normalizes their career tier and persists directly to data/squad_db.json.",
    exports: ["CoachAssessmentModal (React Component)"],
    invokedBy: ["app/page.tsx (Triggered from Dossier or Overview)"],
    invokes: ["app/api/roster/route.ts (POST/PUT)", "lib/valorantEngine.ts", "lib/soundEngine.ts"],
    tags: ["coach assessment", "modal", "ratings", "evaluation"],
  },
  {
    path: "lib/db.ts",
    basename: "db.ts",
    category: "Persistence",
    description:
      "Autonomous file-based database engine that reads and writes directly to data/squad_db.json. Eliminates external Google Sheet rate limits, providing instant zero-latency reading, writing, and backup for squad records.",
    exports: ["readSquadDatabase()", "writeSquadDatabase()", "updatePlayerCoachScores()"],
    invokedBy: [
      "app/api/roster/route.ts",
      "app/api/coach-bot/route.ts",
      "app/api/sync-sheets/route.ts",
    ],
    invokes: ["data/squad_db.json", "Node.js fs/promises"],
    tags: ["database", "json", "autonomous", "storage", "crud"],
  },
  {
    path: "lib/mapData.ts",
    basename: "mapData.ts",
    category: "Engine & Data",
    description:
      "Map registry containing all 11 Competitive and Unrated Valorant maps with official 2D top-down radar minimap URLs from the Valorant API. Also contains the models and data for 5 Pro Playbook Presets (Fnatic, Paper Rex, Sentinels, DRX, Gen.G).",
    exports: ["ALL_VALORANT_MAPS", "PRO_PLAYBOOK_PRESETS", "ValorantMap", "ProPlaybookPreset"],
    invokedBy: ["components/StrategyBuilder.tsx", "app/api/strategies/route.ts"],
    invokes: ["Riot Games / Valorant Official API Image Assets"],
    tags: ["maps", "radar", "pro presets", "minimap"],
  },
  {
    path: "lib/agentData.ts",
    basename: "agentData.ts",
    category: "Engine & Data",
    description:
      "Agent registry with official portraits, role assignments, ability details, theme accent colors, and Japanese kanji typography for every agent in Valorant.",
    exports: ["AGENT_PROFILES", "AGENTS", "getAgent()", "AgentProfile"],
    invokedBy: [
      "app/page.tsx",
      "components/StrategyBuilder.tsx",
      "components/SquadTelemetry.tsx",
      "components/CommandOverview.tsx",
      "components/OperativeDossier.tsx",
      "components/ComparisonTool.tsx",
      "components/BroadcastMode.tsx",
    ],
    invokes: ["lib/types.ts"],
    tags: ["agents", "portraits", "icons", "roles"],
  },
  {
    path: "lib/valorantEngine.ts",
    basename: "valorantEngine.ts",
    category: "Engine & Data",
    description:
      "Mathematical core for calculating normalized player scores (0-10 scale), career tiers (Tier 1 Radiant to Tier 5 Development), and applying role-specific coaching weights.",
    exports: ["calculatePlayerScores()", "getTier()", "DEFAULT_WEIGHTS"],
    invokedBy: ["app/page.tsx", "components/CoachAssessmentModal.tsx"],
    invokes: ["lib/types.ts"],
    tags: ["engine", "tier calculation", "math", "normalization"],
  },
  {
    path: "app/api/roster/route.ts",
    basename: "route.ts (Roster)",
    category: "API Route",
    description:
      "REST API endpoint providing GET (fetches complete squad roster and match history from data/squad_db.json) and POST/PUT (updates coach evaluations and player stats).",
    exports: ["GET()", "POST()", "PUT()"],
    invokedBy: [
      "app/page.tsx (Initial data fetch and refresh)",
      "components/CoachAssessmentModal.tsx (Save coach ratings)",
    ],
    invokes: ["lib/db.ts", "data/squad_db.json"],
    tags: ["api", "roster", "crud", "rest"],
  },
  {
    path: "app/api/strategies/route.ts",
    basename: "route.ts (Strategies)",
    category: "API Route",
    description:
      "REST API endpoint for saving custom tactics, board markers, and 3-phase execution plans to data/strategies.json.",
    exports: ["GET()", "POST()"],
    invokedBy: ["components/StrategyBuilder.tsx"],
    invokes: ["data/strategies.json", "Node.js fs/promises"],
    tags: ["api", "strategies", "playbooks", "save"],
  },
  {
    path: "app/api/coach-bot/route.ts",
    basename: "route.ts (Coach Bot)",
    category: "API Route",
    description:
      "RAG backend for the Tactical AI Coach. Ingests current squad roster stats and coach comments from data/squad_db.json to generate grounded tactical advice.",
    exports: ["POST()"],
    invokedBy: ["components/TacticalCoachBot.tsx"],
    invokes: ["lib/db.ts", "data/squad_db.json"],
    tags: ["api", "rag", "bot", "llm"],
  },
];

export const SystemAtlasGuide: React.FC<SystemAtlasGuideProps> = ({
  accentColor,
  onNavigateTab,
}) => {
  const [guideSection, setGuideSection] = useState<"USER_MANUAL" | "FILE_ATLAS" | "ARCHITECTURE">("USER_MANUAL");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  // Filtered files in atlas
  const filteredFiles = FILE_ATLAS_DATA.filter((file) => {
    const matchesCategory = categoryFilter === "ALL" || file.category === categoryFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      file.path.toLowerCase().includes(query) ||
      file.description.toLowerCase().includes(query) ||
      file.tags.some((t) => t.toLowerCase().includes(query)) ||
      file.exports.some((e) => e.toLowerCase().includes(query));
    return matchesCategory && matchesQuery;
  });

  const categories = [
    "ALL",
    "UI Component",
    "Core State & Layout",
    "Engine & Data",
    "API Route",
    "Persistence",
  ];

  return (
    <div className="space-y-8 animate-fade-in font-sans select-none">
      {/* 1. GUIDE HEADER & SUB-TAB SWITCHER */}
      <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <h3 className="font-syncopate font-black text-base text-white tracking-wider">
                SYSTEM ARCHITECTURE & OPERATIONAL GUIDE
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Complete in-app manual explaining every feature, plus an interactive file-by-file codebase navigation atlas
            </p>
          </div>

          {/* GUIDE MODE TOGGLES */}
          <div className="flex items-center rounded-xl bg-white/5 border border-white/10 p-1">
            {[
              { id: "USER_MANUAL" as const, label: "01 // USER MANUAL", icon: "📖" },
              { id: "FILE_ATLAS" as const, label: "02 // FILE ATLAS & INVOCATIONS", icon: "🗺️" },
              { id: "ARCHITECTURE" as const, label: "03 // SYSTEM FLOW", icon: "⚡" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playHover();
                  setGuideSection(tab.id);
                }}
                className={`px-4 py-2 rounded-lg text-xs font-syncopate tracking-wider transition-all flex items-center gap-1.5 ${
                  guideSection === tab.id
                    ? "bg-white/20 text-white font-black shadow-lg"
                    : "text-slate-400 hover:text-white"
                }`}
                style={{
                  color: guideSection === tab.id ? "#fff" : undefined,
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. SECTION 1: IN-APP USER MANUAL ("HOW EVERYTHING WORKS") */}
      {guideSection === "USER_MANUAL" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* FEATURE CARD 1: SQUAD COMMAND & ROSTER */}
            <div className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xl">⬡</span>
                <h4 className="font-syncopate font-bold text-xs text-white">
                  01 // SQUAD OVERVIEW & RATINGS
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Aggregates total squad metrics (Win Rate, Total Matches, Squad Tier). Player ranks are calculated using a weighted combination of hard statistical data (ACS, K/D, HS%) and Coach Evaluations (Aim, Comms, Utility, Entry, Clutch).
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 text-[10px] font-mono text-slate-400">
                <b className="text-white">How to evaluate:</b> Click "EVALUATE COACH RATINGS" on any player to open the 5-pillar scoring modal. Changes save immediately to local storage.
              </div>
              <button
                onClick={() => onNavigateTab("COMMAND")}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-syncopate text-white transition-colors"
              >
                OPEN SQUAD OVERVIEW ➔
              </button>
            </div>

            {/* FEATURE CARD 2: STRATEGY BUILDER STUDIO */}
            <div className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xl">🗺️</span>
                <h4 className="font-syncopate font-bold text-xs text-white">
                  02 // VALOPLANT STRATEGY BUILDER
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Interactive tactical whiteboard. Switch between 2D top-down Radar minimaps and cinematic views across all 11 Valorant maps. Place Attacker/Defender agent tokens, drop smokes, draw barrier walls, flash vectors, and spike zones.
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 text-[10px] font-mono text-slate-400">
                <b className="text-white">Pro Tip:</b> Click any of the 5 "PRO PLAYBOOK PRESETS" (Fnatic, Paper Rex, Sentinels, DRX, Gen.G) to immediately load a real VCT championship round onto the board!
              </div>
              <button
                onClick={() => onNavigateTab("STRATEGY")}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-syncopate text-white transition-colors"
              >
                OPEN STRATEGY BUILDER ➔
              </button>
            </div>

            {/* FEATURE CARD 3: SQUAD PERFORMANCE HUB */}
            <div className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xl">∿</span>
                <h4 className="font-syncopate font-bold text-xs text-white">
                  03 // ROSTER PERFORMANCE HUB
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Plain-English squad breakdown. Instantly see who is the Primary Carry / MVP, who anchors the defense, and who creates opening space. Universal progress bars compare ACS, K/D, and HS% against pro benchmarks.
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 text-[10px] font-mono text-slate-400">
                <b className="text-white">Squad Audit:</b> Automatically checks whether your squad covers all 4 core Valorant roles (Duelist, Initiator, Controller, Sentinel) and gives 1-sentence tips.
              </div>
              <button
                onClick={() => onNavigateTab("TELEMETRY")}
                className="w-full py-2 rounded-lg bg-white/5 hover:bg-white/15 text-[10px] font-syncopate text-white transition-colors"
              >
                OPEN PERFORMANCE HUB ➔
              </button>
            </div>

            {/* FEATURE CARD 4: VCT RADIO & AUDIO */}
            <div className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xl">🎵</span>
                <h4 className="font-syncopate font-bold text-xs text-white">
                  04 // VCT RADIO & AUDIO ENGINE
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Copyright-safe esports soundtracks located in public/audio/. Music loops indefinitely by default so you never sit in silence. Default volume is preset to 15% (0.15) to prevent blasting your ears.
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 text-[10px] font-mono text-slate-400">
                <b className="text-white">Controls:</b> Click the volume icon in the top header to mute, or hover over the 15% badge to adjust the live slider or pick 15%, 50%, or 100% presets.
              </div>
            </div>

            {/* FEATURE CARD 5: BROADCAST MODE */}
            <div className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xl">📺</span>
                <h4 className="font-syncopate font-bold text-xs text-white">
                  05 // ESPORTS BROADCAST HUD
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Designed for tournament streaming, VOD reviews, and match commentary. Opens a full-screen esports broadcast stage with live player camera feeds, match countdowns, and tournament overlay.
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 text-[10px] font-mono text-slate-400">
                <b className="text-white">Keyboard Shortcut:</b> Press the 'B' key anywhere in the app to instantly toggle Broadcast Mode on or off!
              </div>
            </div>

            {/* FEATURE CARD 6: TACTICAL RAG COACH BOT */}
            <div className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 border-b border-white/10 pb-2">
                <span className="text-xl">🤖</span>
                <h4 className="font-syncopate font-bold text-xs text-white">
                  06 // TACTICAL COACH AI (RAG)
                </h4>
              </div>
              <p className="text-xs font-mono text-slate-300 leading-relaxed">
                Interactive tactical advisor positioned below the Strategy Builder. Uses RAG over data/squad_db.json so it knows your exact players, ACS fraggers, headshot percentages, and coach comments.
              </p>
              <div className="p-2.5 rounded-lg bg-white/5 text-[10px] font-mono text-slate-400">
                <b className="text-white">Example Questions:</b> "Who should entry on Bind?", "Analyze our Duelist vs Controller balance", "What is our best retake setup on Haven?"
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. SECTION 2: CODEBASE ARCHITECTURE & FILE ATLAS ("WHICH FILE DOES WHAT") */}
      {guideSection === "FILE_ATLAS" && (
        <div className="space-y-6">
          {/* SEARCH & CATEGORY FILTER BAR */}
          <div className="p-4 rounded-xl bg-[#0c0f17]/95 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files by name, function, or keyword..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* CATEGORY FILTER PILLS */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    soundFx.playHover();
                    setCategoryFilter(cat);
                  }}
                  className={`px-3 py-1 rounded-full text-[10px] font-syncopate tracking-wider border whitespace-nowrap ${
                    categoryFilter === cat
                      ? "bg-white/20 text-white font-bold border-white/40"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* FILE ATLAS CARDS */}
          <div className="space-y-4">
            <span className="text-xs font-mono text-slate-400 block">
              SHOWING {filteredFiles.length} REPOSITORY MODULES
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFiles.map((file) => (
                <div
                  key={file.path}
                  className="p-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 hover:border-white/25 transition-all space-y-3.5"
                >
                  {/* CARD HEADER */}
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2.5">
                    <div>
                      <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-bold">
                        {file.category}
                      </span>
                      <h4 className="text-sm font-mono font-bold text-white mt-1">
                        {file.path}
                      </h4>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <p className="text-xs font-mono text-slate-300 leading-relaxed">
                    {file.description}
                  </p>

                  {/* INVOCATION CHAIN */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/5 text-[11px] font-mono">
                    <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                      <span className="text-[9px] text-amber-400 font-bold uppercase block">
                        INVOKED BY (PARENTS):
                      </span>
                      <ul className="space-y-0.5 text-slate-300">
                        {file.invokedBy.map((parent, idx) => (
                          <li key={idx} className="truncate">
                            ➔ {parent}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/5 space-y-1">
                      <span className="text-[9px] text-emerald-400 font-bold uppercase block">
                        INVOKES (DEPENDENCIES):
                      </span>
                      <ul className="space-y-0.5 text-slate-300">
                        {file.invokes.slice(0, 3).map((dep, idx) => (
                          <li key={idx} className="truncate">
                            • {dep}
                          </li>
                        ))}
                        {file.invokes.length > 3 && (
                          <li className="text-slate-500">
                            +{file.invokes.length - 3} more dependencies
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* EXPORTS & TAGS */}
                  <div className="flex items-center justify-between text-[10px] font-mono pt-1 text-slate-400">
                    <span className="truncate">
                      <b>EXPORTS:</b> {file.exports.join(", ")}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {file.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-slate-400">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. SECTION 3: SYSTEM ARCHITECTURE & DATA FLOW */}
      {guideSection === "ARCHITECTURE" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-[#0c0f17]/95 border border-white/10 backdrop-blur-xl shadow-2xl space-y-4">
            <h4 className="font-syncopate font-bold text-sm text-white tracking-wider">
              END-TO-END APPLICATION ARCHITECTURE & DATA FLOW
            </h4>
            <p className="text-xs font-mono text-slate-400">
              How browser client interactions flow through Next.js 15, REST endpoints, and the autonomous JSON database
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 font-mono text-xs">
              {/* LAYER 1: CLIENT PRESENTATION */}
              <div className="p-4 rounded-xl bg-white/5 border border-cyan-500/30 space-y-2">
                <div className="flex items-center gap-2 text-cyan-400 font-bold">
                  <span>🖥️</span>
                  <span>1. CLIENT & UI COMPONENTS</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li>• <b>app/page.tsx</b>: Master State & View Orchestrator</li>
                  <li>• <b>StrategyBuilder.tsx</b>: 2D Radar Canvas & Pro Tactics</li>
                  <li>• <b>SquadTelemetry.tsx</b>: Roster Health & Role Check</li>
                  <li>• <b>VCTMusicPlayer.tsx</b>: Continuous 15% Looping Audio</li>
                  <li>• <b>BroadcastMode.tsx</b>: Tournament Presentation HUD</li>
                </ul>
              </div>

              {/* LAYER 2: REST APIS & ENGINES */}
              <div className="p-4 rounded-xl bg-white/5 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <span>⚙️</span>
                  <span>2. ENGINES & API ROUTES</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li>• <b>/api/roster</b>: Reads & Writes Squad DB</li>
                  <li>• <b>/api/strategies</b>: Playbook Storage & Retrieval</li>
                  <li>• <b>/api/coach-bot</b>: RAG Tactical AI Processing</li>
                  <li>• <b>lib/valorantEngine.ts</b>: Score Normalization</li>
                  <li>• <b>lib/mapData.ts</b>: 2D Radar Asset Management</li>
                </ul>
              </div>

              {/* LAYER 3: PERSISTENCE & DATA */}
              <div className="p-4 rounded-xl bg-white/5 border border-emerald-500/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <span>💾</span>
                  <span>3. PERSISTENT STORAGE</span>
                </div>
                <ul className="space-y-1.5 text-slate-300 text-[11px]">
                  <li>• <b>data/squad_db.json</b>: Zero-Latency Squad Store</li>
                  <li>• <b>data/strategies.json</b>: Saved Team Playbooks</li>
                  <li>• <b>lib/db.ts</b>: Autonomous Atomic JSON Engine</li>
                  <li>• <b>public/audio/</b>: Safe-to-Stream Looping Audio</li>
                  <li>• <b>Google Sheets</b>: Optional Bi-Directional Sync</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
