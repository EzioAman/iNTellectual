"use client";

import React, { useState } from "react";
import { MatchHistoryEntry } from "@/lib/types";
import { getAgent } from "@/lib/agentData";

interface MatchArchivesProps {
  history: MatchHistoryEntry[];
}

export const MatchArchives: React.FC<MatchArchivesProps> = ({ history }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  const filtered = history.filter((m) => {
    const matchesSearch =
      m.player.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.agent.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === "ALL" || m.role.toUpperCase() === selectedRole.toUpperCase();
    return matchesSearch && matchesRole;
  });

  // Group by date
  const groupedByDate: Record<string, MatchHistoryEntry[]> = {};
  filtered.forEach((m) => {
    if (!groupedByDate[m.date]) groupedByDate[m.date] = [];
    groupedByDate[m.date].push(m);
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-[#0e121a]/80 border border-white/10 p-6 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-4">
          <div>
            <h3 className="font-teko text-2xl font-bold uppercase tracking-wider text-[#ff4655]">
              📜 Tactical Match Archives
            </h3>
            <p className="text-xs text-slate-400">Competitive Ranked Session Records & Telemetry Logs</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              placeholder="Search operative or agent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none focus:border-[#ff4655]"
            />

            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="bg-black/50 border border-white/10 text-white text-xs rounded-lg px-3 py-1.5 outline-none"
            >
              <option value="ALL">ALL ROLES</option>
              <option value="DUELIST">DUELIST</option>
              <option value="CONTROLLER">CONTROLLER</option>
              <option value="INITIATOR">INITIATOR</option>
              <option value="SENTINEL">SENTINEL</option>
              <option value="IGL">IGL</option>
            </select>
          </div>
        </div>

        {Object.keys(groupedByDate).length > 0 ? (
          <div className="space-y-4">
            {Object.entries(groupedByDate).map(([date, matches]) => (
              <div key={date} className="border border-white/10 rounded-lg overflow-hidden bg-black/30">
                <div className="bg-white/[0.04] px-4 py-2.5 flex justify-between items-center border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#ff4655]" />
                    <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                      SESSION DATE: {date}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    {matches.length} Operatives Active
                  </span>
                </div>

                <div className="divide-y divide-white/5">
                  {matches.map((m, idx) => {
                    const agent = getAgent(m.agent);
                    return (
                      <div
                        key={idx}
                        className="px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={agent.displayIcon}
                            alt={agent.name}
                            className="w-9 h-9 rounded object-cover border border-white/10"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{m.player}</span>
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.2 rounded-sm text-white"
                                style={{
                                  backgroundColor:
                                    m.role === "Duelist" ? "#ff4655" : m.role === "Controller" ? "#3b82f6" : m.role === "Initiator" ? "#10b981" : "#f59e0b",
                                }}
                              >
                                {m.role}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">Agent: {m.agent}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-5 text-right">
                          <div>
                            <div className="text-[9px] font-syncopate text-slate-500">ACS</div>
                            <div className="font-teko text-xl font-bold text-white leading-none">{m.acs.toFixed(0)}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-syncopate text-slate-500">K/D</div>
                            <div className="font-teko text-xl font-bold text-white leading-none">{m.kd.toFixed(2)}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-syncopate text-slate-500">HS%</div>
                            <div className="font-teko text-xl font-bold text-white leading-none">{m.hs.toFixed(1)}%</div>
                          </div>
                          <div className="min-w-[60px]">
                            <div className="text-[9px] font-syncopate text-slate-500">SCORE</div>
                            <div className="font-teko text-2xl font-bold text-[#ff4655] leading-none">
                              {m.overall.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-500 text-sm">
            No match records found matching query.
          </div>
        )}
      </div>
    </div>
  );
};
