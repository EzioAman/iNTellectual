"use client";

import React, { useState, useEffect, useRef } from "react";
import { PlayerRecord } from "@/lib/types";
import { soundFx } from "@/lib/soundEngine";

interface FloatingCoachBotProps {
  activePlayer?: PlayerRecord | null;
  allPlayers: PlayerRecord[];
  accentColor: string;
}

interface ChatMessage {
  id: string;
  sender: "USER" | "BOT";
  text: string;
  timestamp: string;
}

export const FloatingCoachBot: React.FC<FloatingCoachBotProps> = ({
  activePlayer,
  allPlayers,
  accentColor,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOperative, setSelectedOperative] = useState<PlayerRecord | null>(
    activePlayer || allPlayers[0] || null
  );
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "BOT",
      text: "Tactical RAG Coach initialized. I continuously index squad telemetry, coach evaluations, and match archives. Select any player to analyze their performance bottlenecks and scrim drills.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Synchronize with external activePlayer prop when it changes
  useEffect(() => {
    if (activePlayer) {
      setSelectedOperative(activePlayer);
    }
  }, [activePlayer]);

  // Auto scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    soundFx.playClick();
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "USER",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/coach-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          playerContext: selectedOperative ? selectedOperative.name : undefined,
        }),
      });

      const data = await res.json();
      const botResponse =
        data.reply ||
        data.response ||
        "Analysis complete. Review tactical performance data in the dossier.";

      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          sender: "BOT",
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      soundFx.playCommit();
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "BOT",
          text: "Telemetry link interrupted. Please try asking your tactical question again.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    `Analyze ${selectedOperative?.name || "squad"} aim & mechanics`,
    `Identify performance bottlenecks for ${selectedOperative?.name || "player"}`,
    `Recommend scrim training drills`,
    `Compare ${selectedOperative?.name || "player"} to Tier S benchmark`,
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans">
      {/* EXPANDED CHAT WINDOW */}
      {isOpen && (
        <div className="relative mb-3 w-[92vw] sm:w-96 rounded-2xl bg-[#090c14]/95 border border-white/20 shadow-2xl backdrop-blur-2xl flex flex-col h-[520px] max-h-[80vh] overflow-hidden animate-fade-in">
          {/* HEADER */}
          <div className="p-3.5 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
              <div>
                <h4 className="font-syncopate font-bold text-xs text-white tracking-wider">
                  TACTICAL AI COACH // RAG
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                  <span>ACTIVE TARGET:</span>
                  <select
                    value={selectedOperative?.player || ""}
                    onChange={(e) => {
                      const found = allPlayers.find((p) => p.player === e.target.value);
                      if (found) setSelectedOperative(found);
                    }}
                    className="bg-black/50 border border-white/10 rounded px-1.5 py-0.5 text-cyan-300 font-bold outline-none cursor-pointer"
                  >
                    {allPlayers.map((p) => (
                      <option key={p.player} value={p.player} className="bg-[#090c14]">
                        {p.name} ({p.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFx.playClick();
                setIsOpen(false);
              }}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white flex items-center justify-center text-xs transition-colors"
              title="Minimize Coach Chat"
            >
              ✕
            </button>
          </div>

          {/* ACTIVE OPERATIVE TELEMETRY CHIP */}
          {selectedOperative && (
            <div className="px-3.5 py-2 bg-black/40 border-b border-white/5 flex items-center justify-between text-[10px] font-mono">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white">{selectedOperative.name}</span>
                <span className="text-slate-400">• {selectedOperative.agent}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold">ACS: {selectedOperative.rawStats.acs.toFixed(0)}</span>
                <span className="text-emerald-400 font-bold">K/D: {selectedOperative.rawStats.kd.toFixed(2)}</span>
                <span className="px-1.5 py-0.2 rounded bg-white/10 font-bold text-cyan-300">
                  TIER {selectedOperative.tier}
                </span>
              </div>
            </div>
          )}

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 font-mono text-xs scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "USER" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                    msg.sender === "USER"
                      ? "bg-cyan-500/20 text-cyan-200 border border-cyan-500/30 rounded-tr-none"
                      : "bg-white/5 text-slate-200 border border-white/10 rounded-tl-none"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400 p-2 bg-white/5 rounded-xl border border-white/5">
                <div className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                <span>RAG Engine synthesizing telemetry & coach comments...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="px-3 py-2 border-t border-white/5 bg-black/20 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                disabled={isLoading}
                className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 whitespace-nowrap transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 border-t border-white/10 bg-white/5 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder={`Ask tactical coach about ${selectedOperative?.name || "squad"}...`}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-white/20 outline-none focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="px-3.5 py-2 rounded-xl text-xs font-syncopate font-black text-black tracking-wider shadow-md transition-all disabled:opacity-40"
              style={{ backgroundColor: accentColor }}
            >
              ➔
            </button>
          </form>
        </div>
      )}

      {/* FLOATING BOT TRIGGER PILL / ORB */}
      <button
        onClick={() => {
          soundFx.playClick();
          setIsOpen((prev) => !prev);
        }}
        className="group relative flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#090c14]/90 border border-white/20 hover:border-white/40 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:scale-105 active:scale-95"
        style={{
          boxShadow: isOpen ? `0 0 24px ${accentColor}60` : `0 0 16px rgba(0,0,0,0.8)`,
          borderColor: isOpen ? accentColor : undefined,
        }}
      >
        <div className="relative flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
          <span className="absolute w-2 h-2 rounded-full" style={{ backgroundColor: accentColor }} />
        </div>

        <div className="flex items-center gap-1.5 font-syncopate font-bold text-xs text-white">
          <span>💬</span>
          <span>TACTICAL AI COACH</span>
          <span
            className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold"
            style={{
              backgroundColor: `${accentColor}20`,
              color: accentColor,
            }}
          >
            RAG
          </span>
        </div>

        {selectedOperative && !isOpen && (
          <span className="hidden sm:inline text-[10px] font-mono text-slate-400 pl-1 border-l border-white/10">
            {selectedOperative.name}
          </span>
        )}
      </button>
    </div>
  );
};
