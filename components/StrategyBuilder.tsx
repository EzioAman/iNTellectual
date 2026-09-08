"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ALL_VALORANT_MAPS,
  ValorantMap,
  CustomStrategy,
  TacticalAgentToken,
  TacticalUtilityMarker,
  TacticalMovementArrow,
  PRO_PLAYBOOK_PRESETS,
  ProPlaybookPreset,
} from "@/lib/mapData";
import { PlayerRecord } from "@/lib/types";
import { getAgent, AGENTS } from "@/lib/agentData";
import { soundFx } from "@/lib/soundEngine";
import { TacticalCoachBot } from "./TacticalCoachBot";
import { LineupVault } from "./LineupVault";
import { RoundReplayViewer } from "./RoundReplayViewer";
import { ValorantLineup } from "@/lib/lineupData";
import { MatchRoundReplay } from "@/lib/replayData";

interface StrategyBuilderProps {
  players: PlayerRecord[];
  accentColor: string;
}

type CanvasTool =
  | "AGENT_ATTACKER"
  | "AGENT_DEFENDER"
  | "SMOKE"
  | "WALL"
  | "FLASH"
  | "RECON"
  | "SPIKE"
  | "ARROW"
  | "TEXT_PIN"
  | "ERASE";

type ActivePhase = "PHASE_1" | "PHASE_2" | "PHASE_3";

export const StrategyBuilder: React.FC<StrategyBuilderProps> = ({
  players,
  accentColor,
}) => {
  // Studio View Mode: Whiteboard vs Lineup Vault vs 2D Round Simulator
  const [studioMode, setStudioMode] = useState<"WHITEBOARD" | "LINEUPS" | "REPLAY">("WHITEBOARD");

  const [selectedMapId, setSelectedMapId] = useState<string>("ascent");
  const [mapFilter, setMapFilter] = useState<"ALL" | "COMPETITIVE" | "TDM">("ALL");
  const [viewMode, setViewMode] = useState<"RADAR" | "CINEMATIC">("RADAR");

  // Canvas Tools, Phase & Vision Cones
  const [activeTool, setActiveTool] = useState<CanvasTool>("AGENT_ATTACKER");
  const [activePhase, setActivePhase] = useState<ActivePhase>("PHASE_1");
  const [showVisionCones, setShowVisionCones] = useState<boolean>(true);
  const [selectedAgentName, setSelectedAgentName] = useState<string>("Jett");
  const [smokeColor, setSmokeColor] = useState<string>("#9333ea");
  const [arrowDraftStart, setArrowDraftStart] = useState<{ x: number; y: number } | null>(null);
  const [wallDraftStart, setWallDraftStart] = useState<{ x: number; y: number } | null>(null);

  // Placed Tactical Elements
  const [agentTokens, setAgentTokens] = useState<TacticalAgentToken[]>([]);
  const [utilityMarkers, setUtilityMarkers] = useState<TacticalUtilityMarker[]>([]);
  const [movementArrows, setMovementArrows] = useState<TacticalMovementArrow[]>([]);
  const [textPins, setTextPins] = useState<Array<{ id: string; x: number; y: number; text: string }>>([]);

  // Dragging state for tokens
  const [draggingTokenId, setDraggingTokenId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);

  // Strategy Form State
  const [stratTitle, setStratTitle] = useState<string>("");
  const [side, setSide] = useState<"ATTACK" | "DEFENSE">("ATTACK");
  const [buyType, setBuyType] = useState<"PISTOL" | "ECO" | "BONUS" | "FULL_BUY">("FULL_BUY");
  const [author, setAuthor] = useState<string>("Squad IGL");
  const [phase1Note, setPhase1Note] = useState<string>("");
  const [phase2Note, setPhase2Note] = useState<string>("");
  const [phase3Note, setPhase3Note] = useState<string>("");
  const [isPosting, setIsPosting] = useState<boolean>(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<boolean>(false);

  // Saved Strategies List
  const [savedStrategies, setSavedStrategies] = useState<CustomStrategy[]>([]);
  const [expandedStratId, setExpandedStratId] = useState<string | null>(null);

  const activeMap = ALL_VALORANT_MAPS.find((m) => m.id === selectedMapId) || ALL_VALORANT_MAPS[0];

  // Fetch saved strategies on mount
  useEffect(() => {
    async function loadStrats() {
      try {
        const res = await fetch("/api/strategies");
        if (res.ok) {
          const data = await res.json();
          if (data.strategies) {
            setSavedStrategies(data.strategies);
          }
        }
      } catch (err) {
        console.warn("Failed loading strategies:", err);
      }
    }
    loadStrats();
  }, []);

  // Filtered map list
  const filteredMaps = ALL_VALORANT_MAPS.filter(
    (m) => mapFilter === "ALL" || m.category === mapFilter
  );

  // Load a Pro Playbook Preset onto the Whiteboard
  const loadProPlaybook = (preset: ProPlaybookPreset) => {
    soundFx.playClick();
    setSelectedMapId(preset.mapId);
    setSide(preset.side);
    setBuyType(preset.buyType);
    setStratTitle(`${preset.title} [${preset.proTeam}]`);
    setPhase1Note(preset.phase1);
    setPhase2Note(preset.phase2);
    setPhase3Note(preset.phase3);
    setAgentTokens(preset.agents || []);
    setUtilityMarkers(preset.utility || []);
    setMovementArrows(preset.arrows || []);
    setTextPins([]);
    setCopyFeedback(`Loaded Pro Playbook: ${preset.proTeam}`);
    setTimeout(() => setCopyFeedback(null), 3500);
  };

  // Convert click coordinates to 0-100 percentages
  const getCanvasCoords = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return { x: 50, y: 50 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.min(Math.max(Math.round(((e.clientX - rect.left) / rect.width) * 100), 0), 100);
    const y = Math.min(Math.max(Math.round(((e.clientY - rect.top) / rect.height) * 100), 0), 100);
    return { x, y };
  };

  // Handle Canvas Click to place elements
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // If dragging finished, return
    if (draggingTokenId) return;

    const { x, y } = getCanvasCoords(e);
    soundFx.playClick();

    if (activeTool === "AGENT_ATTACKER" || activeTool === "AGENT_DEFENDER") {
      const agentObj = getAgent(selectedAgentName);
      const team = activeTool === "AGENT_ATTACKER" ? "ATTACKER" : "DEFENDER";
      const newToken: TacticalAgentToken = {
        id: `agent-${Date.now()}`,
        team,
        agent: agentObj.name,
        role: agentObj.role,
        x,
        y,
        label: `${team === "ATTACKER" ? "ATK" : "DEF"} ${agentObj.name}`,
      };
      setAgentTokens((prev) => [...prev, newToken]);
    } else if (activeTool === "SMOKE") {
      const newSmoke: TacticalUtilityMarker = {
        id: `smoke-${Date.now()}`,
        type: "SMOKE",
        label: `${selectedAgentName} Smoke`,
        x,
        y,
        radius: 7,
        color: smokeColor,
        agent: selectedAgentName,
      };
      setUtilityMarkers((prev) => [...prev, newSmoke]);
    } else if (activeTool === "FLASH") {
      const newFlash: TacticalUtilityMarker = {
        id: `flash-${Date.now()}`,
        type: "FLASH",
        label: "Flash Pop",
        x,
        y,
        color: "#facc15",
      };
      setUtilityMarkers((prev) => [...prev, newFlash]);
    } else if (activeTool === "RECON") {
      const newRecon: TacticalUtilityMarker = {
        id: `recon-${Date.now()}`,
        type: "RECON",
        label: "Sonar Ping",
        x,
        y,
        radius: 11,
        color: "#38bdf8",
      };
      setUtilityMarkers((prev) => [...prev, newRecon]);
    } else if (activeTool === "SPIKE") {
      const newSpike: TacticalUtilityMarker = {
        id: `spike-${Date.now()}`,
        type: "SPIKE",
        label: "Spike Plant Zone",
        x,
        y,
        radius: 12,
        color: "#ef4444",
      };
      setUtilityMarkers((prev) => [...prev, newSpike]);
    } else if (activeTool === "ARROW") {
      if (!arrowDraftStart) {
        setArrowDraftStart({ x, y });
        setCopyFeedback("Arrow start set. Click destination point!");
        setTimeout(() => setCopyFeedback(null), 2500);
      } else {
        const newArrow: TacticalMovementArrow = {
          id: `arrow-${Date.now()}`,
          fromX: arrowDraftStart.x,
          fromY: arrowDraftStart.y,
          toX: x,
          toY: y,
          label: "Advance Vector",
          color: side === "ATTACK" ? "#ff4655" : "#3b82f6",
        };
        setMovementArrows((prev) => [...prev, newArrow]);
        setArrowDraftStart(null);
      }
    } else if (activeTool === "WALL") {
      if (!wallDraftStart) {
        setWallDraftStart({ x, y });
        setCopyFeedback("Wall start point set. Click wall end point!");
        setTimeout(() => setCopyFeedback(null), 2500);
      } else {
        const newWall: TacticalUtilityMarker = {
          id: `wall-${Date.now()}`,
          type: "WALL",
          label: "Barrier Screen",
          x: wallDraftStart.x,
          y: wallDraftStart.y,
          endX: x,
          endY: y,
          color: "#10b981",
        };
        setUtilityMarkers((prev) => [...prev, newWall]);
        setWallDraftStart(null);
      }
    } else if (activeTool === "TEXT_PIN") {
      const text = prompt("Enter tactical callout / pin note:", "Hold Crossfire Angle");
      if (text) {
        setTextPins((prev) => [...prev, { id: `pin-${Date.now()}`, x, y, text }]);
      }
    } else if (activeTool === "ERASE") {
      // Find and remove nearest item
      setAgentTokens((prev) => prev.filter((a) => Math.hypot(a.x - x, a.y - y) > 6));
      setUtilityMarkers((prev) => prev.filter((u) => Math.hypot(u.x - x, u.y - y) > 6));
      setMovementArrows((prev) => prev.filter((arr) => Math.hypot(arr.toX - x, arr.toY - y) > 6));
      setTextPins((prev) => prev.filter((tp) => Math.hypot(tp.x - x, tp.y - y) > 6));
    }
  };

  // Canvas Mouse Move for Token Dragging
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingTokenId || !canvasRef.current) return;
    const { x, y } = getCanvasCoords(e);
    setAgentTokens((prev) =>
      prev.map((t) => (t.id === draggingTokenId ? { ...t, x, y } : t))
    );
  };

  const handleMouseUp = () => {
    if (draggingTokenId) {
      setDraggingTokenId(null);
    }
  };

  // Clear Canvas Elements
  const handleClearAll = () => {
    soundFx.playClick();
    setAgentTokens([]);
    setUtilityMarkers([]);
    setMovementArrows([]);
    setTextPins([]);
    setArrowDraftStart(null);
    setWallDraftStart(null);
  };

  // Undo Last Placed
  const handleUndo = () => {
    soundFx.playClick();
    if (textPins.length > 0) {
      setTextPins((p) => p.slice(0, -1));
    } else if (movementArrows.length > 0) {
      setMovementArrows((p) => p.slice(0, -1));
    } else if (utilityMarkers.length > 0) {
      setUtilityMarkers((p) => p.slice(0, -1));
    } else if (agentTokens.length > 0) {
      setAgentTokens((p) => p.slice(0, -1));
    }
  };

  // Copy Tactical Briefing to Clipboard
  const handleCopyBriefing = () => {
    soundFx.playClick();
    const brief = `=== VCT TACTICAL BRIEFING // ${activeMap.name} ===
TITLE: ${stratTitle || "Tactical Protocol"}
SIDE: ${side} | BUY ECONOMY: ${buyType}
AUTHOR: ${author}

[PHASE 1: DEFAULT & RECON]
${phase1Note || "Hold default map control, probe for defensive utility, bait rotations."}

[PHASE 2: EXECUTION & UTILITY DUMP]
${phase2Note || "Deploy site smokes, flash entry lines, isolate key sightlines."}

[PHASE 3: POST-PLANT & RETAKE]
${phase3Note || "Anchor spike crossfire angles, delay defuse with lineups, deny trades."}

DEPLOYED TOKENS: ${agentTokens.length} Operatives
UTILITY PLACED: ${utilityMarkers.length} Markers (${utilityMarkers.map((u) => u.type).join(", ")})
TACTICAL ARROWS: ${movementArrows.length} Push Vectors
Generated via InTellectual Tactical Studio.`;

    navigator.clipboard.writeText(brief);
    setCopyFeedback("✓ Tactical Briefing Copied to Clipboard!");
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  // Submit and Save Strategy
  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stratTitle.trim()) return;

    soundFx.playCommit();
    setIsPosting(true);

    try {
      const res = await fetch("/api/strategies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: stratTitle.trim(),
          mapId: selectedMapId,
          side,
          buyType,
          author,
          phase1: phase1Note.trim() || "Default map control and probe for defensive information.",
          phase2: phase2Note.trim() || "Execute utility and isolate key defensive sightlines.",
          phase3: phase3Note.trim() || "Site hit, spike plant, and hold post-plant crossfires.",
          comp: agentTokens.map((a) => ({
            agent: a.agent,
            role: a.role,
            note: a.label || `${a.team} operative`,
          })),
          utilityMarkers: utilityMarkers.map((u) => ({
            x: u.x,
            y: u.y,
            type: u.type,
            label: u.label,
          })),
          agents: agentTokens,
          arrows: movementArrows,
        }),
      });

      const data = await res.json();
      if (data.success && data.strategies) {
        setSavedStrategies(data.strategies);
        setPostSuccess(true);
        setTimeout(() => setPostSuccess(false), 4000);
      }
    } catch (err) {
      console.error("Failed saving strategy:", err);
    } finally {
      setIsPosting(false);
    }
  };

  // Handlers for deploying lineup and capturing 2D replay moment
  const handleDeployLineup = (lineup: ValorantLineup) => {
    soundFx.playCommit();
    setSelectedMapId(lineup.mapId);
    setStudioMode("WHITEBOARD");

    const throwerToken: TacticalAgentToken = {
      id: `token-lineup-${Date.now()}`,
      team: "ATTACKER",
      agent: lineup.agent,
      role: getAgent(lineup.agent).role,
      x: lineup.standCoords.x,
      y: lineup.standCoords.y,
      label: `${lineup.agent} [Thrower]`,
    };

    const landingUtil: TacticalUtilityMarker = {
      id: `util-lineup-${Date.now()}`,
      type: lineup.type === "RECON" ? "RECON" : lineup.type === "ONE_WAY" ? "SMOKE" : "FLASH",
      label: lineup.title,
      x: lineup.landingCoords.x,
      y: lineup.landingCoords.y,
      radius: lineup.type === "RECON" ? 11 : 7,
      color: lineup.color,
    };

    const trajectoryArrow: TacticalMovementArrow = {
      id: `arr-lineup-${Date.now()}`,
      fromX: lineup.standCoords.x,
      fromY: lineup.standCoords.y,
      toX: lineup.landingCoords.x,
      toY: lineup.landingCoords.y,
      label: `${lineup.agent} Trajectory`,
      color: lineup.color,
      style: "DASHED",
    };

    setAgentTokens((prev) => [...prev, throwerToken]);
    setUtilityMarkers((prev) => [...prev, landingUtil]);
    setMovementArrows((prev) => [...prev, trajectoryArrow]);
    setStratTitle(`Strat: ${lineup.title}`);
    setCopyFeedback(`✓ Lineup deployed to Whiteboard!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  const handleCaptureReplayMoment = (replay: MatchRoundReplay, time: number) => {
    soundFx.playCommit();
    setSelectedMapId(replay.mapId);
    setStudioMode("WHITEBOARD");

    const capturedAtk: TacticalAgentToken[] = replay.attackers.map((a, i) => {
      const p = a.path[a.path.length - 1];
      return {
        id: `cap-atk-${i}-${Date.now()}`,
        team: "ATTACKER",
        agent: a.agent,
        role: getAgent(a.agent).role,
        x: p.x,
        y: p.y,
        label: `${a.name} (${a.agent})`,
      };
    });

    const capturedDef: TacticalAgentToken[] = replay.defenders.map((d, i) => {
      const p = d.path[d.path.length - 1];
      return {
        id: `cap-def-${i}-${Date.now()}`,
        team: "DEFENDER",
        agent: d.agent,
        role: getAgent(d.agent).role,
        x: p.x,
        y: p.y,
        label: `${d.name} (${d.agent})`,
      };
    });

    setAgentTokens([...capturedAtk, ...capturedDef]);
    setStratTitle(`Replay Analysis: ${replay.title} (${time}s)`);
    setCopyFeedback(`✓ Captured round at ${time}s onto Whiteboard!`);
    setTimeout(() => setCopyFeedback(null), 3000);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans select-none">
      {/* 0. STUDIO MODE NAVIGATION PILLS (WHITEBOARD vs LINEUP VAULT vs 2D SIMULATOR) */}
      <div className="flex items-center gap-1.5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-1.5 shadow-xl overflow-x-auto scrollbar-none">
        {[
          { id: "WHITEBOARD" as const, label: "01 // TACTICAL WHITEBOARD", icon: "🗺️" },
          { id: "LINEUPS" as const, label: "02 // PRO LINEUP VAULT", icon: "🎯" },
          { id: "REPLAY" as const, label: "03 // 2D MATCH SIMULATOR", icon: "⏱️" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              soundFx.playHover();
              setStudioMode(tab.id);
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-syncopate tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
              studioMode === tab.id
                ? "bg-white/20 text-white font-black shadow-lg"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* LINEUP VAULT SUB-VIEW */}
      {studioMode === "LINEUPS" && (
        <LineupVault accentColor={accentColor} onDeployToStrategy={handleDeployLineup} />
      )}

      {/* 2D ROUND SIMULATOR SUB-VIEW */}
      {studioMode === "REPLAY" && (
        <RoundReplayViewer accentColor={accentColor} onCaptureAsStrategy={handleCaptureReplayMoment} />
      )}

      {/* TACTICAL WHITEBOARD SUB-VIEW */}
      {studioMode === "WHITEBOARD" && (
        <div className="space-y-6">
          {/* 1. MAP SELECTOR, WIN RATES & VIEW MODE TOGGLE */}
          <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                  <h3 className="font-syncopate font-black text-base text-white tracking-wider">
                    VALORANT TACTICAL WHITEBOARD // {activeMap.name}
                  </h3>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  ValoPlant-grade strategy board with 2D radar minimap, agent positioning, vision cones, and pro playbooks
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* VISION CONES TOGGLE */}
                <button
                  onClick={() => setShowVisionCones((prev) => !prev)}
                  className={`px-3 py-1 rounded-lg text-[10px] font-syncopate border transition-all ${
                    showVisionCones
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 font-bold"
                      : "bg-white/5 text-slate-400 border-white/10"
                  }`}
                  title="Toggle Field of View sightline cones for operatives"
                >
                  FOV CONES: {showVisionCones ? "ON" : "OFF"}
                </button>

                {/* VIEW MODE TOGGLE: RADAR vs CINEMATIC */}
                <div className="flex items-center rounded-lg bg-white/5 border border-white/10 p-0.5">
                  <button
                    onClick={() => {
                      soundFx.playHover();
                      setViewMode("RADAR");
                    }}
                    className={`px-3 py-1 text-[10px] font-syncopate tracking-wider rounded-md transition-all ${
                      viewMode === "RADAR"
                        ? "bg-white/20 text-white font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    2D RADAR (TOP-DOWN)
                  </button>
                  <button
                    onClick={() => {
                      soundFx.playHover();
                      setViewMode("CINEMATIC");
                    }}
                    className={`px-3 py-1 text-[10px] font-syncopate tracking-wider rounded-md transition-all ${
                      viewMode === "CINEMATIC"
                        ? "bg-white/20 text-white font-bold shadow"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    CINEMATIC
                  </button>
                </div>

                {/* MAP FILTER PILLS */}
                <div className="flex items-center gap-1">
                  {(["ALL", "COMPETITIVE", "TDM"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        soundFx.playHover();
                        setMapFilter(m);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-syncopate border ${
                        mapFilter === m
                          ? "bg-white/20 text-white font-bold border-white/40"
                          : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                      }`}
                    >
                      {m === "ALL" ? "ALL MAPS" : m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MAP CAROUSEL TILES */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {filteredMaps.map((map) => {
                const isSelected = map.id === selectedMapId;
                return (
                  <button
                    key={map.id}
                    onClick={() => {
                      soundFx.playHover();
                      setSelectedMapId(map.id);
                    }}
                    className={`px-4 py-2.5 rounded-xl text-xs font-syncopate tracking-wider transition-all border whitespace-nowrap flex items-center gap-2.5 ${
                      isSelected
                        ? "bg-white/15 text-white font-black border-white/40 shadow-xl"
                        : "bg-[#0e121a]/80 text-slate-400 border-white/5 hover:border-white/20 hover:text-white"
                    }`}
                    style={{
                      borderColor: isSelected ? accentColor : undefined,
                      boxShadow: isSelected ? `0 0 16px ${accentColor}35` : undefined,
                    }}
                  >
                    <img
                      src={map.radarUrl || map.imageUrl}
                      alt={map.name}
                      className="w-5 h-5 object-contain rounded filter brightness-125"
                    />
                    <span>{map.name}</span>
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{
                        backgroundColor: isSelected ? `${accentColor}25` : "rgba(255,255,255,0.05)",
                        color: isSelected ? accentColor : "#94a3b8",
                      }}
                    >
                      {map.winRate}% WR
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

      {/* 2. 1-CLICK PRO PLAYBOOK PRESETS BAR */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-950/30 via-[#0c0f17]/95 to-cyan-950/30 border border-white/10 p-4 backdrop-blur-xl shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-bold text-xs">⚡ PRO PLAYBOOK PRESETS:</span>
            <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
              Click any VCT Masters execution to populate the whiteboard with pro positions & utility
            </span>
          </div>
          {copyFeedback && (
            <span className="text-[10px] font-mono text-emerald-400 animate-pulse font-bold">
              {copyFeedback}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRO_PLAYBOOK_PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => loadProPlaybook(p)}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-amber-400/50 text-left transition-all group flex flex-col justify-between"
            >
              <div>
                <span className="text-[9px] font-mono font-bold text-amber-400 block uppercase truncate">
                  {p.proTeam}
                </span>
                <span className="text-xs font-syncopate font-bold text-white group-hover:text-amber-300 block truncate mt-0.5">
                  {p.title}
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px] font-mono text-slate-400 mt-2">
                <span className="uppercase text-cyan-400">{p.mapId}</span>
                <span className="text-emerald-400 font-bold">LOAD PLAY ➔</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 3. TACTICAL CANVAS & STRATEGY STUDIO */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: INTERACTIVE TACTICAL WHITEBOARD (7 COLS) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-4">
          {/* WHITEBOARD HEADER & ACTIONS */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 flex-wrap gap-2">
            <div>
              <span className="text-[9px] font-syncopate uppercase tracking-widest text-slate-400 block">
                INTERACTIVE STRATEGY CANVAS // {activeMap.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: side === "ATTACK" ? "#ff465525" : "#3b82f625",
                    color: side === "ATTACK" ? "#ff4655" : "#3b82f6",
                  }}
                >
                  {side} SIDE
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {agentTokens.length} Agents | {utilityMarkers.length} Utility | {movementArrows.length} Arrows
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleCopyBriefing}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 border border-white/10 text-[10px] font-mono text-cyan-300 hover:text-white transition-colors"
                title="Copy structured text briefing"
              >
                COPY BRIEF
              </button>
              <button
                onClick={handleUndo}
                disabled={agentTokens.length === 0 && utilityMarkers.length === 0 && movementArrows.length === 0}
                className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/15 text-[10px] font-mono text-slate-300 disabled:opacity-40 transition-colors"
                title="Undo last element"
              >
                UNDO
              </button>
              <button
                onClick={handleClearAll}
                className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-[10px] font-mono text-rose-300 transition-colors"
                title="Clear all whiteboard elements"
              >
                CLEAR ALL
              </button>
            </div>
          </div>

          {/* TOOLBOX SELECTOR PILLS */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: "AGENT_ATTACKER" as const, label: "ATK AGENT", icon: "🔴" },
                { id: "AGENT_DEFENDER" as const, label: "DEF AGENT", icon: "🔵" },
                { id: "SMOKE" as const, label: "SMOKE AOE", icon: "☁" },
                { id: "WALL" as const, label: "BARRIER WALL", icon: "🧱" },
                { id: "FLASH" as const, label: "FLASH BURST", icon: "⚡" },
                { id: "RECON" as const, label: "RECON PING", icon: "🎯" },
                { id: "SPIKE" as const, label: "SPIKE PLANT", icon: "💣" },
                { id: "ARROW" as const, label: "PUSH ARROW", icon: "➔" },
                { id: "TEXT_PIN" as const, label: "PIN NOTE", icon: "📌" },
                { id: "ERASE" as const, label: "ERASE", icon: "✕" },
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    soundFx.playHover();
                    setActiveTool(tool.id);
                    setArrowDraftStart(null);
                    setWallDraftStart(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-syncopate tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                    activeTool === tool.id
                      ? "bg-white/20 text-white font-bold border-white/40 shadow-md"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                  style={{
                    borderColor: activeTool === tool.id ? accentColor : undefined,
                  }}
                >
                  <span>{tool.icon}</span>
                  <span>{tool.label}</span>
                </button>
              ))}
            </div>

            {/* AGENT PALETTE (IF AGENT TOOL ACTIVE) */}
            {(activeTool === "AGENT_ATTACKER" || activeTool === "AGENT_DEFENDER") && (
              <div className="flex items-center gap-1.5 p-2 rounded-xl bg-white/5 border border-white/5 overflow-x-auto scrollbar-none">
                <span className="text-[9px] font-mono text-slate-400 uppercase flex-shrink-0">
                  CHOOSE AGENT:
                </span>
                {AGENTS.slice(0, 16).map((a) => (
                  <button
                    key={a.id}
                    onClick={() => {
                      soundFx.playHover();
                      setSelectedAgentName(a.name);
                    }}
                    className={`px-2 py-1 rounded-md text-[9px] font-syncopate tracking-wider transition-all whitespace-nowrap flex items-center gap-1 ${
                      selectedAgentName === a.name
                        ? "bg-white/25 text-white font-bold ring-1 ring-white/50"
                        : "text-slate-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <img src={a.displayIcon} alt={a.name} className="w-3.5 h-3.5 object-contain" />
                    <span>{a.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* SMOKE CONTROLLER PRESET PALETTE (IF SMOKE TOOL ACTIVE) */}
            {activeTool === "SMOKE" && (
              <div className="flex items-center gap-2 p-2 rounded-xl bg-white/5 border border-white/5 text-[10px] font-mono">
                <span className="text-slate-400">SMOKE TYPE:</span>
                {[
                  { name: "Omen Dark Cover", color: "#9333ea" },
                  { name: "Brimstone Sky Smoke", color: "#ea580c" },
                  { name: "Viper Poison Cloud", color: "#10b981" },
                  { name: "Astra Nebula", color: "#6366f1" },
                  { name: "Clove Ruse", color: "#ec4899" },
                ].map((s) => (
                  <button
                    key={s.name}
                    onClick={() => setSmokeColor(s.color)}
                    className={`px-2 py-1 rounded flex items-center gap-1.5 border ${
                      smokeColor === s.color
                        ? "border-white text-white font-bold bg-white/10"
                        : "border-transparent text-slate-400 hover:text-white"
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INTERACTIVE TACTICAL CANVAS (SVG & DOM OVERLAY) */}
          <div
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="relative w-full h-[460px] rounded-xl overflow-hidden border border-white/20 bg-[#03060a] cursor-crosshair select-none shadow-2xl"
          >
            {/* 1. MAP BACKGROUND (RADAR TOP-DOWN OR CINEMATIC) */}
            <img
              src={viewMode === "RADAR" ? activeMap.radarUrl : activeMap.imageUrl}
              alt={activeMap.name}
              className={`w-full h-full ${
                viewMode === "RADAR"
                  ? "object-contain p-2 filter brightness-110 contrast-125"
                  : "object-cover opacity-70"
              }`}
            />

            {/* Tactical Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px] pointer-events-none" />

            {/* 2. SVG LAYER: ARROWS, WALLS, AND CONNECTORS */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <marker
                  id="arrowhead-red"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#ff4655" />
                </marker>
                <marker
                  id="arrowhead-blue"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#38bdf8" />
                </marker>
                <marker
                  id="arrowhead-yellow"
                  markerWidth="8"
                  markerHeight="8"
                  refX="6"
                  refY="4"
                  orient="auto"
                >
                  <polygon points="0 0, 8 4, 0 8" fill="#fbbf24" />
                </marker>
              </defs>

              {/* Movement Arrows */}
              {movementArrows.map((arr) => {
                const markerId =
                  arr.color === "#ff4655"
                    ? "arrowhead-red"
                    : arr.color === "#fbbf24"
                    ? "arrowhead-yellow"
                    : "arrowhead-blue";

                return (
                  <g key={arr.id}>
                    <line
                      x1={`${arr.fromX}%`}
                      y1={`${arr.fromY}%`}
                      x2={`${arr.toX}%`}
                      y2={`${arr.toY}%`}
                      stroke={arr.color || "#ff4655"}
                      strokeWidth="3"
                      strokeDasharray={arr.style === "DASHED" ? "5,5" : undefined}
                      markerEnd={`url(#${markerId})`}
                      style={{ filter: `drop-shadow(0 0 6px ${arr.color || "#ff4655"})` }}
                    />
                    {arr.label && (
                      <text
                        x={`${(arr.fromX + arr.toX) / 2}%`}
                        y={`${(arr.fromY + arr.toY) / 2 - 2}%`}
                        textAnchor="middle"
                        className="fill-white text-[9px] font-mono font-bold"
                        style={{ filter: "drop-shadow(0 1px 2px #000)" }}
                      >
                        {arr.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Barrier Walls */}
              {utilityMarkers
                .filter((u) => u.type === "WALL" && u.endX !== undefined && u.endY !== undefined)
                .map((w) => (
                  <line
                    key={w.id}
                    x1={`${w.x}%`}
                    y1={`${w.y}%`}
                    x2={`${w.endX}%`}
                    y2={`${w.endY}%`}
                    stroke={w.color || "#10b981"}
                    strokeWidth="5"
                    strokeLinecap="round"
                    style={{
                      filter: `drop-shadow(0 0 8px ${w.color || "#10b981"})`,
                      opacity: 0.85,
                    }}
                  />
                ))}

              {/* Vision Cones (Field of View) */}
              {showVisionCones &&
                agentTokens.map((token) => {
                  const isAttacker = token.team === "ATTACKER";
                  const angleDeg = token.facingAngle !== undefined ? token.facingAngle : (isAttacker ? 270 : 90);
                  const angleRad = (angleDeg * Math.PI) / 180;
                  const spreadRad = (28 * Math.PI) / 180; // 56 deg total FOV cone
                  const length = 11; // 11% radius

                  const x1 = token.x;
                  const y1 = token.y;
                  const x2 = token.x + length * Math.cos(angleRad - spreadRad);
                  const y2 = token.y + length * Math.sin(angleRad - spreadRad);
                  const x3 = token.x + length * Math.cos(angleRad + spreadRad);
                  const y3 = token.y + length * Math.sin(angleRad + spreadRad);

                  return (
                    <polygon
                      key={`cone-${token.id}`}
                      points={`${x1}%,${y1}% ${x2}%,${y2}% ${x3}%,${y3}%`}
                      fill={isAttacker ? "rgba(255, 70, 85, 0.18)" : "rgba(56, 189, 248, 0.18)"}
                      stroke={isAttacker ? "rgba(255, 70, 85, 0.5)" : "rgba(56, 189, 248, 0.5)"}
                      strokeWidth="1"
                      strokeDasharray="3,3"
                      pointerEvents="none"
                    />
                  );
                })}
            </svg>

            {/* 3. UTILITY MARKERS LAYER (SMOKES, RECON, FLASHES, SPIKE) */}
            {utilityMarkers.map((m) => {
              if (m.type === "SMOKE") {
                const radiusPx = (m.radius || 7) * 4;
                return (
                  <div
                    key={m.id}
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none transition-all animate-pulse"
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      width: `${radiusPx * 2}px`,
                      height: `${radiusPx * 2}px`,
                      backgroundColor: `${m.color || "#9333ea"}45`,
                      border: `2px solid ${m.color || "#9333ea"}`,
                      boxShadow: `0 0 16px ${m.color || "#9333ea"}60`,
                    }}
                  >
                    <span className="text-[8px] font-mono font-bold text-white uppercase opacity-80">
                      SMOKE
                    </span>
                  </div>
                );
              }

              if (m.type === "RECON") {
                const radiusPx = (m.radius || 11) * 4;
                return (
                  <div
                    key={m.id}
                    className="absolute rounded-full transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none animate-ping"
                    style={{
                      left: `${m.x}%`,
                      top: `${m.y}%`,
                      width: `${radiusPx * 2}px`,
                      height: `${radiusPx * 2}px`,
                      backgroundColor: "rgba(56, 189, 248, 0.15)",
                      border: "1.5px dashed #38bdf8",
                    }}
                  />
                );
              }

              if (m.type === "SPIKE") {
                return (
                  <div
                    key={m.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none animate-bounce"
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  >
                    <div className="w-6 h-6 rounded-full bg-rose-600 border-2 border-white shadow-xl flex items-center justify-center text-xs">
                      💣
                    </div>
                    <span className="text-[8px] font-mono font-bold text-rose-400 bg-black/80 px-1 rounded mt-0.5">
                      SPIKE
                    </span>
                  </div>
                );
              }

              if (m.type === "FLASH") {
                return (
                  <div
                    key={m.id}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none"
                    style={{ left: `${m.x}%`, top: `${m.y}%` }}
                  >
                    <div className="w-5 h-5 rounded-full bg-amber-400 border border-white shadow-xl flex items-center justify-center text-[10px] text-black font-black">
                      ⚡
                    </div>
                    <span className="text-[7px] font-mono text-amber-300 bg-black/80 px-1 rounded">
                      FLASH
                    </span>
                  </div>
                );
              }

              return null;
            })}

            {/* 4. DRAGGABLE AGENT TOKENS LAYER */}
            {agentTokens.map((token) => {
              const agentObj = getAgent(token.agent);
              const isAttacker = token.team === "ATTACKER";
              const isDragging = draggingTokenId === token.id;

              return (
                <div
                  key={token.id}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    soundFx.playHover();
                    setDraggingTokenId(token.id);
                  }}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 z-30 cursor-grab active:cursor-grabbing group transition-transform ${
                    isDragging ? "scale-125 z-40" : "hover:scale-110"
                  }`}
                  style={{ left: `${token.x}%`, top: `${token.y}%` }}
                  title={`${token.label || token.agent} (Click & drag to reposition)`}
                >
                  <div
                    className="w-8 h-8 rounded-full border-2 overflow-hidden shadow-2xl flex items-center justify-center"
                    style={{
                      borderColor: isAttacker ? "#ff4655" : "#38bdf8",
                      boxShadow: isAttacker
                        ? "0 0 12px rgba(255, 70, 85, 0.7)"
                        : "0 0 12px rgba(56, 189, 248, 0.7)",
                      backgroundColor: "#0c0f17",
                    }}
                  >
                    <img
                      src={agentObj.displayIcon}
                      alt={token.agent}
                      className="w-full h-full object-cover pointer-events-none"
                    />
                  </div>

                  {/* Operative Name & Role Pill */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-0.5 px-1.5 py-0.2 rounded text-[7px] font-mono font-bold whitespace-nowrap bg-black/90 text-white border border-white/20 pointer-events-none">
                    <span style={{ color: isAttacker ? "#ff4655" : "#38bdf8" }}>
                      {isAttacker ? "A" : "D"}:
                    </span>{" "}
                    {token.agent}
                  </div>
                </div>
              );
            })}

            {/* 5. TEXT PINS LAYER */}
            {textPins.map((tp) => (
              <div
                key={tp.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-25 bg-black/85 border border-white/30 text-cyan-300 font-mono text-[8px] font-bold px-2 py-0.5 rounded shadow-xl flex items-center gap-1 pointer-events-none"
                style={{ left: `${tp.x}%`, top: `${tp.y}%` }}
              >
                <span>📌</span>
                <span>{tp.text}</span>
              </div>
            ))}

            {/* Draft Lines Guidance */}
            {arrowDraftStart && (
              <div
                className="absolute w-3 h-3 rounded-full bg-amber-400 border border-white animate-ping pointer-events-none"
                style={{ left: `${arrowDraftStart.x}%`, top: `${arrowDraftStart.y}%` }}
              />
            )}
            {wallDraftStart && (
              <div
                className="absolute w-3 h-3 rounded-full bg-emerald-400 border border-white animate-ping pointer-events-none"
                style={{ left: `${wallDraftStart.x}%`, top: `${wallDraftStart.y}%` }}
              />
            )}

            {/* Canvas HUD Footer */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none text-[9px] font-mono text-slate-300">
              <span className="bg-black/85 px-2 py-0.5 rounded border border-white/10">
                SITES: {activeMap.sites.join(" // ")}
              </span>
              <span className="bg-black/85 px-2 py-0.5 rounded border border-white/10">
                TOOL: {activeTool} | CLICK & DRAG AGENTS
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT: STRATEGY BUILDER & 3-PHASE EXECUTION FORM (5 COLS) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-5 backdrop-blur-xl shadow-2xl space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h4 className="font-syncopate font-bold text-sm text-white tracking-wider">
              ROUND EXECUTION ARCHITECT
            </h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Draft step-by-step round phases, assign economy, and archive to squad playbook
            </p>
          </div>

          <form onSubmit={handleSaveStrategy} className="space-y-4 text-xs font-mono">
            {postSuccess && (
              <div className="p-3 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300">
                ✓ Strategy saved successfully to squad tactical archive!
              </div>
            )}

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">STRATEGY TITLE</label>
              <input
                type="text"
                required
                value={stratTitle}
                onChange={(e) => setStratTitle(e.target.value)}
                placeholder="e.g. A-Short Split with Double Smoke & Heaven Flash"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">TACTICAL SIDE</label>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="ATTACK" className="bg-[#0c0f17]">ATTACK</option>
                  <option value="DEFENSE" className="bg-[#0c0f17]">DEFENSE</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">BUY ECONOMY</label>
                <select
                  value={buyType}
                  onChange={(e) => setBuyType(e.target.value as any)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-white/30"
                >
                  <option value="FULL_BUY" className="bg-[#0c0f17]">FULL BUY (3900+)</option>
                  <option value="PISTOL" className="bg-[#0c0f17]">PISTOL ROUND</option>
                  <option value="ECO" className="bg-[#0c0f17]">ECO / SAVE</option>
                  <option value="BONUS" className="bg-[#0c0f17]">BONUS ROUND</option>
                </select>
              </div>
            </div>

            {/* PHASE SELECTOR & NOTES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] text-slate-400 block">3-PHASE EXECUTION PLAN</label>
                <div className="flex items-center gap-1">
                  {(["PHASE_1", "PHASE_2", "PHASE_3"] as const).map((p, idx) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setActivePhase(p)}
                      className={`px-2 py-0.5 rounded text-[9px] font-syncopate transition-all ${
                        activePhase === p
                          ? "bg-white/20 text-white font-bold"
                          : "text-slate-500 hover:text-white"
                      }`}
                    >
                      P{idx + 1}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-amber-400 font-bold block">
                    PHASE 1: DEFAULT / PRE-ROUND RECON
                  </span>
                  <textarea
                    rows={2}
                    value={phase1Note}
                    onChange={(e) => setPhase1Note(e.target.value)}
                    placeholder="Hold default sightlines, probe for defensive utility, clear early corners..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/30 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-cyan-400 font-bold block">
                    PHASE 2: EXECUTION & UTILITY DUMP
                  </span>
                  <textarea
                    rows={2}
                    value={phase2Note}
                    onChange={(e) => setPhase2Note(e.target.value)}
                    placeholder="Drop smokes, pop flashes, isolate crossfires, commit onto site..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/30 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] text-emerald-400 font-bold block">
                    PHASE 3: POST-PLANT / RETAKE CROSSFIRE
                  </span>
                  <textarea
                    rows={2}
                    value={phase3Note}
                    onChange={(e) => setPhase3Note(e.target.value)}
                    placeholder="Anchor plant crossfires, delay defuse with lineups, deny trades..."
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-white/30 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* SAVE BUTTON */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isPosting || !stratTitle.trim()}
                className="w-full py-3 rounded-xl font-syncopate font-black text-xs text-black tracking-wider transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-2xl"
                style={{ backgroundColor: accentColor }}
              >
                {isPosting ? "SAVING STRATEGY..." : "COMMIT STRATEGY TO SQUAD PLAYBOOK ➔"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* 4. SAVED SQUAD PLAYBOOKS ARCHIVE */}
      <div className="rounded-2xl bg-[#0c0f17]/95 border border-white/10 p-6 backdrop-blur-xl shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="font-syncopate font-bold text-sm text-white tracking-wider">
              SQUAD STRATEGY ARCHIVE ({savedStrategies.length})
            </h4>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Saved team playbooks with 1-click loading onto the tactical whiteboard
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">PLAYBOOK VAULT</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {savedStrategies.map((strat) => {
            const isExpanded = expandedStratId === strat.id;
            const stratMap = ALL_VALORANT_MAPS.find((m) => m.id === strat.mapId) || activeMap;

            return (
              <div
                key={strat.id}
                className="p-4 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold"
                        style={{
                          backgroundColor: strat.side === "ATTACK" ? "#ff465520" : "#3b82f620",
                          color: strat.side === "ATTACK" ? "#ff4655" : "#3b82f6",
                        }}
                      >
                        {strat.side}
                      </span>
                      <span className="text-xs font-syncopate font-bold text-white">
                        {strat.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-1 block">
                      MAP: <b className="text-slate-200">{stratMap.name}</b> // BUY: {strat.buyType} // {strat.createdAt}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        soundFx.playClick();
                        setSelectedMapId(strat.mapId);
                        setSide(strat.side);
                        setBuyType(strat.buyType);
                        setStratTitle(strat.title);
                        setPhase1Note(strat.phase1);
                        setPhase2Note(strat.phase2);
                        setPhase3Note(strat.phase3);
                        if (strat.agents && strat.agents.length > 0) {
                          setAgentTokens(strat.agents);
                        }
                        if (strat.utilityMarkers && strat.utilityMarkers.length > 0) {
                          setUtilityMarkers(
                            strat.utilityMarkers.map((u, i) => ({
                              id: `strat-u-${i}`,
                              type: u.type as any,
                              label: u.label,
                              x: u.x,
                              y: u.y,
                              color: u.type === "SMOKE" ? "#9333ea" : "#ef4444",
                            }))
                          );
                        }
                        if (strat.arrows && strat.arrows.length > 0) {
                          setMovementArrows(strat.arrows);
                        }
                        setCopyFeedback(`Loaded: ${strat.title}`);
                        setTimeout(() => setCopyFeedback(null), 3000);
                      }}
                      className="text-[10px] font-mono text-cyan-300 hover:text-white px-2 py-1 rounded bg-cyan-950/40 border border-cyan-500/30"
                      title="Load this strategy onto the tactical whiteboard"
                    >
                      LOAD BOARD
                    </button>
                    <button
                      onClick={() => {
                        soundFx.playHover();
                        setExpandedStratId(isExpanded ? null : strat.id);
                      }}
                      className="text-[10px] font-mono text-slate-400 hover:text-white px-2 py-1 rounded bg-white/5"
                    >
                      {isExpanded ? "HIDE [-]" : "DETAILS [+]"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-white/10 space-y-2 text-xs font-mono text-slate-300 animate-fade-in">
                    <div>
                      <b className="text-amber-400">PHASE 1:</b> {strat.phase1}
                    </div>
                    <div>
                      <b className="text-cyan-400">PHASE 2:</b> {strat.phase2}
                    </div>
                    <div>
                      <b className="text-emerald-400">PHASE 3:</b> {strat.phase3}
                    </div>

                    {strat.utilityMarkers && strat.utilityMarkers.length > 0 && (
                      <div className="pt-2 flex items-center gap-1.5 flex-wrap text-[10px]">
                        <span className="text-slate-500">UTILITY MARKERS:</span>
                        {strat.utilityMarkers.map((um, i) => (
                          <span key={i} className="px-2 py-0.5 rounded bg-white/5 text-slate-300">
                            {um.type}: {um.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
        </div>
      )}

      {/* 5. INTEGRATED VCT RAG TACTICAL COACH BOT */}
      <TacticalCoachBot players={players} accentColor={accentColor} />
    </div>
  );
};
