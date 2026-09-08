"use client";

import React, { useState, useEffect } from "react";
import { UserRole, PlayerRecord, CoachAccount, TeamProfile } from "@/lib/types";
import { soundFx } from "@/lib/soundEngine";
import { AGENTS } from "@/lib/agentData";

interface AdminControlPanelProps {
  isOpen: boolean;
  onClose: () => void;
  accentColor: string;
  currentRole: UserRole;
  onRoleChanged: (role: UserRole) => void;
  players: PlayerRecord[];
  onPlayersUpdated: (players: PlayerRecord[]) => void;
}

export const AdminControlPanel: React.FC<AdminControlPanelProps> = ({
  isOpen,
  onClose,
  accentColor,
  currentRole,
  onRoleChanged,
  players,
  onPlayersUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<"LOGIN" | "REGISTER" | "PLAYERS" | "COACHES" | "TEAM">("LOGIN");

  // Authentication state
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active authenticated user details
  const [authUser, setAuthUser] = useState<{
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: UserRole;
  } | null>(null);
  const [authToken, setAuthToken] = useState<string>("");

  // Registration state with live cybersecurity password validation
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDisplayName, setRegDisplayName] = useState("");
  const [regPasswordStrength, setRegPasswordStrength] = useState({
    hasLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
    hasSpecial: false,
    score: 0,
  });

  // Add player form
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerTag, setNewPlayerTag] = useState("0001");
  const [newPlayerRole, setNewPlayerRole] = useState<any>("Duelist");
  const [newPlayerAgent, setNewPlayerAgent] = useState("Jett");
  const [newPlayerKd, setNewPlayerKd] = useState("1.15");
  const [newPlayerAcs, setNewPlayerAcs] = useState("215");
  const [newPlayerHs, setNewPlayerHs] = useState("26.5");

  // Add coach form
  const [coaches, setCoaches] = useState<CoachAccount[]>([]);
  const [teamProfile, setTeamProfile] = useState<TeamProfile | null>(null);
  const [newCoachName, setNewCoachName] = useState("");
  const [newCoachEmail, setNewCoachEmail] = useState("");
  const [newCoachTitle, setNewCoachTitle] = useState("Strategic Analyst");
  const [newCoachSpec, setNewCoachSpec] = useState<any>("Strategic Analyst");

  // Edit coach login data state
  const [editingCoach, setEditingCoach] = useState<CoachAccount | null>(null);
  const [editCoachName, setEditCoachName] = useState("");
  const [editCoachEmail, setEditCoachEmail] = useState("");
  const [editCoachTitle, setEditCoachTitle] = useState("");
  const [editCoachSpec, setEditCoachSpec] = useState<any>("Strategic Analyst");

  // Team profile form
  const [teamName, setTeamName] = useState("");
  const [teamTag, setTeamTag] = useState("");
  const [teamRegion, setTeamRegion] = useState("");
  const [teamMotto, setTeamMotto] = useState("");

  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Evaluate password strength in real time
  useEffect(() => {
    const checks = {
      hasLength: regPassword.length >= 8,
      hasUpper: /[A-Z]/.test(regPassword),
      hasLower: /[a-z]/.test(regPassword),
      hasNumber: /[0-9]/.test(regPassword),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(regPassword),
    };

    let score = 0;
    if (checks.hasLength) score++;
    if (checks.hasUpper && checks.hasLower) score++;
    if (checks.hasNumber) score++;
    if (checks.hasSpecial) score++;

    setRegPasswordStrength({ ...checks, score });
  }, [regPassword]);

  // Load existing session token and team data on mount
  useEffect(() => {
    const storedToken = typeof window !== "undefined" ? localStorage.getItem("intellectual_auth_token") : null;
    if (storedToken) {
      setAuthToken(storedToken);
      fetch("/api/auth", {
        headers: { Authorization: `Bearer ${storedToken}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.authenticated && data.user) {
            setAuthUser(data.user);
            onRoleChanged(data.role);
          } else {
            localStorage.removeItem("intellectual_auth_token");
          }
        })
        .catch(() => {});
    }

    async function loadAdminData() {
      try {
        const res = await fetch("/api/admin");
        if (res.ok) {
          const data = await res.json();
          if (data.coaches) setCoaches(data.coaches);
          if (data.teamProfile) {
            setTeamProfile(data.teamProfile);
            setTeamName(data.teamProfile.teamName || "INTELLECTUAL ESPORTS");
            setTeamTag(data.teamProfile.teamTag || "IT");
            setTeamRegion(data.teamProfile.region || "PACIFIC / VCT");
            setTeamMotto(data.teamProfile.motto || "Tactical Superiority & Precision Mechanics");
          }
        }
      } catch (err) {
        console.warn("Failed fetching admin data:", err);
      }
    }

    if (isOpen) {
      loadAdminData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Secure User Login via /api/auth
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setAuthError(null);
    setAuthSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "LOGIN",
          identifier: loginIdentifier.trim(),
          password: loginPassword,
        }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        soundFx.playCommit();
        localStorage.setItem("intellectual_auth_token", data.token);
        setAuthToken(data.token);
        setAuthUser(data.user);
        onRoleChanged(data.role);
        setAuthSuccess(`✓ Authenticated as ${data.user.displayName || data.user.username} (${data.role})`);
        setLoginPassword("");

        // Route to appropriate tab based on role
        setTimeout(() => {
          if (data.role === "SUPER_ADMIN") {
            setActiveTab("PLAYERS");
          } else if (data.role === "ADMIN") {
            setActiveTab("PLAYERS");
          } else {
            setActiveTab("LOGIN");
          }
        }, 1000);
      } else {
        setAuthError(data.error || "Authentication failed. Check your credentials.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Network error during authentication.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle User Registration adhering to cybersecurity guidelines
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    setAuthError(null);
    setAuthSuccess(null);

    if (regPasswordStrength.score < 3) {
      setAuthError("Please ensure your password meets the cybersecurity strength criteria.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "REGISTER",
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword,
          displayName: regDisplayName.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.token) {
        soundFx.playCommit();
        localStorage.setItem("intellectual_auth_token", data.token);
        setAuthToken(data.token);
        setAuthUser(data.user);
        onRoleChanged(data.role);
        setAuthSuccess(`✓ Account created! Authenticated as ${data.user.username}.`);
        setRegUsername("");
        setRegEmail("");
        setRegPassword("");
        setRegDisplayName("");
      } else {
        setAuthError(data.error || "Registration failed. Check your inputs.");
      }
    } catch (err: any) {
      setAuthError(err.message || "Network error during registration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Secure Logout
  const handleLogout = async () => {
    soundFx.playClick();
    if (authToken) {
      fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "LOGOUT", token: authToken }),
      }).catch(() => {});
    }
    localStorage.removeItem("intellectual_auth_token");
    setAuthToken("");
    setAuthUser(null);
    onRoleChanged("GUEST");
    setAuthSuccess("Logged out securely.");
    setAuthError(null);
    setActiveTab("LOGIN");
  };

  // Add Operative to Squad
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlayerName.trim()) return;

    soundFx.playCommit();
    const riotId = `${newPlayerName.trim()}#${newPlayerTag.trim() || "0001"}`;

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "ADD_PLAYER",
          token: authToken,
          player: riotId,
          role: newPlayerRole,
          agent: newPlayerAgent,
          kd: newPlayerKd,
          acs: newPlayerAcs,
          hsPercent: newPlayerHs,
          aim: 8.5,
          utility: 8.0,
          comms: 8.0,
          entry: 8.5,
          clutch: 8.0,
        }),
      });

      const data = await res.json();
      if (data.success && data.player) {
        onPlayersUpdated([...players, data.player]);
        setActionFeedback(`✓ Player ${riotId} added to roster!`);
        setNewPlayerName("");
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        setActionFeedback(`Error: ${data.error || "Failed adding player"}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Remove Operative from Squad
  const handleRemovePlayer = async (playerId: string) => {
    if (!confirm(`Are you sure you want to remove ${playerId} from the roster?`)) return;

    soundFx.playClick();

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "REMOVE_PLAYER",
          token: authToken,
          playerId,
        }),
      });

      const data = await res.json();
      if (data.success && data.players) {
        onPlayersUpdated(data.players);
        setActionFeedback(`✓ Player ${playerId} removed from squad.`);
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        setActionFeedback(`Error: ${data.error || "Failed removing player"}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Add Coach Account
  const handleAddCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoachName.trim()) return;

    soundFx.playCommit();

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "ADD_COACH",
          token: authToken,
          name: newCoachName.trim(),
          email: newCoachEmail.trim() || `${newCoachName.toLowerCase().replace(/\s+/g, "")}@intellectual.gg`,
          title: newCoachTitle,
          specialization: newCoachSpec,
          assignedPlayers: [],
        }),
      });

      const data = await res.json();
      if (data.success && data.coach) {
        setCoaches((prev) => [...prev, data.coach]);
        setActionFeedback(`✓ Coach ${newCoachName} added!`);
        setNewCoachName("");
        setNewCoachEmail("");
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        setActionFeedback(`Error: ${data.error || "Failed adding coach"}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Remove Coach Account
  const handleRemoveCoach = async (coachId: string) => {
    if (!confirm("Are you sure you want to remove this coach?")) return;
    soundFx.playClick();

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "REMOVE_COACH",
          token: authToken,
          coachId,
        }),
      });

      const data = await res.json();
      if (data.success && data.coaches) {
        setCoaches(data.coaches);
        setActionFeedback("✓ Coach removed.");
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        setActionFeedback(`Error: ${data.error || "Failed removing coach"}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Configure Coach Login Data (Admin & Super Admin)
  const handleUpdateCoach = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoach) return;
    soundFx.playCommit();

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "UPDATE_COACH",
          token: authToken,
          coachId: editingCoach.id,
          updates: {
            name: editCoachName.trim(),
            email: editCoachEmail.trim(),
            title: editCoachTitle.trim(),
            specialization: editCoachSpec,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.coach) {
        setCoaches((prev) => prev.map((c) => (c.id === editingCoach.id ? data.coach : c)));
        setActionFeedback(`✓ Coach credentials updated for ${editCoachName}!`);
        setEditingCoach(null);
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        setActionFeedback(`Error: ${data.error || "Failed updating coach data"}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  // Update Team Profile (Super Admin)
  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playCommit();

    try {
      const res = await fetch("/api/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          action: "UPDATE_TEAM",
          token: authToken,
          teamProfile: {
            teamName,
            teamTag,
            region: teamRegion,
            owner: "Morfit",
            headCoach: teamProfile?.headCoach || "Morfit",
            foundedYear: "2026",
            motto: teamMotto,
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.teamProfile) {
        setTeamProfile(data.teamProfile);
        setActionFeedback("✓ Team Profile & Branding successfully updated!");
        setTimeout(() => setActionFeedback(null), 3000);
      } else {
        setActionFeedback(`Error: ${data.error || "Failed updating team"}`);
      }
    } catch (err: any) {
      setActionFeedback(`Error: ${err.message}`);
    }
  };

  const isAuth = currentRole === "ADMIN" || currentRole === "SUPER_ADMIN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in font-sans">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#090c14] border border-white/20 p-6 md:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
              <h3 className="font-syncopate font-black text-sm md:text-base text-white tracking-wider">
                SECURITY ACCESS & IDENTITY PORTAL
              </h3>
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">
              Role-Based Access Control • Cryptographic Authentication • Team Management
            </p>
          </div>
          <button
            onClick={() => {
              soundFx.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 text-white/60 hover:text-white flex items-center justify-center transition-colors"
          >
            ✕
          </button>
        </div>

        {/* ACTIVE STATUS BANNER */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">ACTIVE SESSION:</span>
            <span
              className="font-bold px-2 py-0.5 rounded text-[11px]"
              style={{
                backgroundColor:
                  currentRole === "SUPER_ADMIN"
                    ? "rgba(251, 191, 36, 0.2)"
                    : currentRole === "ADMIN"
                    ? "rgba(91, 248, 255, 0.2)"
                    : currentRole === "USER"
                    ? "rgba(16, 185, 129, 0.2)"
                    : "rgba(255, 255, 255, 0.1)",
                color:
                  currentRole === "SUPER_ADMIN"
                    ? "#fbbf24"
                    : currentRole === "ADMIN"
                    ? "#5bf8ff"
                    : currentRole === "USER"
                    ? "#10b981"
                    : "#94a3b8",
              }}
            >
              {currentRole === "SUPER_ADMIN"
                ? "👑 SUPER ADMIN"
                : currentRole === "ADMIN"
                ? "🛡️ COACH ADMIN"
                : currentRole === "USER"
                ? "👤 REGISTERED USER"
                : "👥 GUEST"}
            </span>
            {authUser && (
              <span className="text-slate-300">
                ({authUser.displayName || authUser.username})
              </span>
            )}
          </div>

          {currentRole !== "GUEST" && (
            <button
              onClick={handleLogout}
              className="px-3 py-1 rounded-lg bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-[11px] font-syncopate transition-colors"
            >
              LOGOUT ➔
            </button>
          )}
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
          {[
            { id: "LOGIN", label: "SIGN IN", icon: "🔑" },
            { id: "REGISTER", label: "CREATE ACCOUNT", icon: "➕" },
            { id: "PLAYERS", label: "ROSTER OPERATIONS", icon: "👥", badge: isAuth ? undefined : "LOCKED" },
            { id: "COACHES", label: "COACHES & CREDENTIALS", icon: "🛡️", badge: isAuth ? undefined : "LOCKED" },
            { id: "TEAM", label: "TEAM IDENTITY", icon: "⚙", badge: currentRole === "SUPER_ADMIN" ? undefined : "SUPER" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundFx.playHover();
                  setActiveTab(tab.id as any);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-syncopate tracking-wider transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "bg-white/15 text-white font-black shadow-lg"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
                style={{
                  borderColor: isActive ? accentColor : "transparent",
                  borderWidth: isActive ? "1px" : "0px",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-400 font-mono">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* FEEDBACK BANNERS */}
        {authError && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-mono animate-fade-in flex items-center justify-between">
            <span>⚠ {authError}</span>
            <button onClick={() => setAuthError(null)} className="text-white/40 hover:text-white">✕</button>
          </div>
        )}
        {authSuccess && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 text-xs font-mono animate-fade-in flex items-center justify-between">
            <span>✓ {authSuccess}</span>
            <button onClick={() => setAuthSuccess(null)} className="text-white/40 hover:text-white">✕</button>
          </div>
        )}
        {actionFeedback && (
          <div className="p-3 rounded-xl bg-cyan-950/60 border border-cyan-500/50 text-cyan-300 text-xs font-mono animate-fade-in flex items-center justify-between">
            <span>{actionFeedback}</span>
            <button onClick={() => setActionFeedback(null)} className="text-white/40 hover:text-white">✕</button>
          </div>
        )}

        {/* 1. SIGN IN TAB */}
        {activeTab === "LOGIN" && (
          <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto py-2">
            <div className="space-y-1 text-center">
              <h4 className="font-syncopate font-bold text-sm text-white">AUTHENTICATE IDENTITY</h4>
              <p className="text-xs font-mono text-slate-400">
                Sign in with your username or registered email address.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  USERNAME OR EMAIL
                </label>
                <input
                  type="text"
                  required
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. morfit, coach, or username@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-white/40 text-white placeholder-white/20 outline-none transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest">
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300"
                  >
                    {showPassword ? "HIDE" : "SHOW"}
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter your secure password"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-white/40 text-white placeholder-white/20 outline-none transition-colors"
                />
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-slate-400 space-y-1">
                <div className="text-slate-300 font-bold">Default Administrative Logins:</div>
                <div>• Super Admin Account: <code className="text-amber-300">morfit</code></div>
                <div>• Coach Admin Account: <code className="text-cyan-300">coach</code></div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl font-syncopate font-black text-xs text-black tracking-wider transition-all shadow-lg active:scale-98 disabled:opacity-50"
                style={{ backgroundColor: accentColor }}
              >
                {isSubmitting ? "VERIFYING CRYPTOGRAPHIC HASH..." : "SIGN IN ➔"}
              </button>
            </div>
          </form>
        )}

        {/* 2. REGISTER TAB (CYBERSECURITY GUIDELINES) */}
        {activeTab === "REGISTER" && (
          <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto py-2">
            <div className="space-y-1 text-center">
              <h4 className="font-syncopate font-bold text-sm text-white">REGISTER SQUAD ACCOUNT</h4>
              <p className="text-xs font-mono text-slate-400">
                Create a new user account adhering to cybersecurity standards.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  USERNAME
                </label>
                <input
                  type="text"
                  required
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  placeholder="e.g. TacticianReyna"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  EMAIL ADDRESS
                </label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="tactician@squad.gg"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  DISPLAY / CALLSIGN NAME
                </label>
                <input
                  type="text"
                  value={regDisplayName}
                  onChange={(e) => setRegDisplayName(e.target.value)}
                  placeholder="e.g. Captain Phoenix"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 uppercase tracking-widest mb-1">
                  PASSWORD
                </label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Must satisfy security requirements"
                  className="w-full px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 outline-none"
                />

                {/* REAL-TIME PASSWORD STRENGTH METER */}
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-400">Password Strength:</span>
                    <span
                      className={`font-bold ${
                        regPasswordStrength.score >= 4
                          ? "text-emerald-400"
                          : regPasswordStrength.score >= 3
                          ? "text-cyan-400"
                          : regPasswordStrength.score >= 2
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {regPasswordStrength.score >= 4
                        ? "STRONG (EXCELLENT)"
                        : regPasswordStrength.score >= 3
                        ? "GOOD"
                        : regPasswordStrength.score >= 2
                        ? "FAIR"
                        : "WEAK"}
                    </span>
                  </div>

                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        regPasswordStrength.score >= 4
                          ? "bg-emerald-500 w-full"
                          : regPasswordStrength.score >= 3
                          ? "bg-cyan-500 w-3/4"
                          : regPasswordStrength.score >= 2
                          ? "bg-amber-500 w-1/2"
                          : "bg-rose-500 w-1/4"
                      }`}
                    />
                  </div>

                  {/* SECURITY REQUIREMENTS CHECKLIST */}
                  <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                    <div className={regPasswordStrength.hasLength ? "text-emerald-400 font-bold" : ""}>
                      {regPasswordStrength.hasLength ? "✓" : "○"} 8+ Characters
                    </div>
                    <div className={regPasswordStrength.hasUpper ? "text-emerald-400 font-bold" : ""}>
                      {regPasswordStrength.hasUpper ? "✓" : "○"} Uppercase (A-Z)
                    </div>
                    <div className={regPasswordStrength.hasLower ? "text-emerald-400 font-bold" : ""}>
                      {regPasswordStrength.hasLower ? "✓" : "○"} Lowercase (a-z)
                    </div>
                    <div className={regPasswordStrength.hasNumber ? "text-emerald-400 font-bold" : ""}>
                      {regPasswordStrength.hasNumber ? "✓" : "○"} Number (0-9)
                    </div>
                    <div className={regPasswordStrength.hasSpecial ? "text-emerald-400 font-bold" : ""}>
                      {regPasswordStrength.hasSpecial ? "✓" : "○"} Special Character (!@#$)
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || regPasswordStrength.score < 3}
                className="w-full py-3 rounded-xl font-syncopate font-black text-xs text-black tracking-wider transition-all shadow-lg disabled:opacity-40"
                style={{ backgroundColor: accentColor }}
              >
                {isSubmitting ? "HASHING & REGISTERING..." : "CREATE SQUAD ACCOUNT ➔"}
              </button>
            </div>
          </form>
        )}

        {/* 3. ROSTER OPERATIONS TAB */}
        {activeTab === "PLAYERS" && (
          <div className="space-y-5">
            {!isAuth ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                <span className="text-2xl">🔒</span>
                <h4 className="font-syncopate font-bold text-xs text-white">ADMIN AUTHENTICATION REQUIRED</h4>
                <p className="text-xs font-mono text-slate-400">
                  Please sign in with an Admin or Super Admin account to add or remove squad operatives.
                </p>
                <button
                  onClick={() => setActiveTab("LOGIN")}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-xs font-mono text-cyan-300 border border-cyan-500/40"
                >
                  GO TO SIGN IN ➔
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ADD OPERATIVE FORM */}
                <form onSubmit={handleAddPlayer} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs font-mono">
                  <h4 className="font-syncopate font-bold text-xs text-white border-b border-white/10 pb-2">
                    REGISTER NEW SQUAD OPERATIVE
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">RIOT ID (NAME)</label>
                      <input
                        type="text"
                        required
                        value={newPlayerName}
                        onChange={(e) => setNewPlayerName(e.target.value)}
                        placeholder="e.g. Asuna"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">TAGLINE</label>
                      <input
                        type="text"
                        value={newPlayerTag}
                        onChange={(e) => setNewPlayerTag(e.target.value)}
                        placeholder="0001"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">TACTICAL ROLE</label>
                      <select
                        value={newPlayerRole}
                        onChange={(e) => setNewPlayerRole(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      >
                        <option value="Duelist" className="bg-[#090c14]">Duelist</option>
                        <option value="Initiator" className="bg-[#090c14]">Initiator</option>
                        <option value="Controller" className="bg-[#090c14]">Controller</option>
                        <option value="Sentinel" className="bg-[#090c14]">Sentinel</option>
                        <option value="IGL" className="bg-[#090c14]">IGL</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">MAIN AGENT</label>
                      <select
                        value={newPlayerAgent}
                        onChange={(e) => setNewPlayerAgent(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      >
                        {AGENTS.map((a) => (
                          <option key={a.id} value={a.name} className="bg-[#090c14]">
                            {a.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">AVERAGE COMBAT SCORE (ACS)</label>
                      <input
                        type="number"
                        value={newPlayerAcs}
                        onChange={(e) => setNewPlayerAcs(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">K/D RATIO</label>
                      <input
                        type="number"
                        step="0.01"
                        value={newPlayerKd}
                        onChange={(e) => setNewPlayerKd(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-syncopate font-bold text-xs text-black tracking-wider transition-all shadow-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    REGISTER OPERATIVE TO ROSTER ➔
                  </button>
                </form>

                {/* CURRENT SQUAD ROSTER WITH DELETE BUTTONS */}
                <div className="space-y-2">
                  <h4 className="font-syncopate font-bold text-xs text-white">
                    CURRENT ACTIVE ROSTER ({players.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {players.map((p) => (
                      <div
                        key={p.player}
                        className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{p.name}</span>
                          <span className="text-slate-400">{p.tag}</span>
                          <span className="text-slate-500">| {p.agent} ({p.role})</span>
                          <span className="text-amber-400 font-bold">ACS: {p.rawStats.acs.toFixed(0)}</span>
                          <span className="text-emerald-400 font-bold">K/D: {p.rawStats.kd.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => handleRemovePlayer(p.player)}
                          className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px]"
                        >
                          REMOVE
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. COACHES & CREDENTIALS TAB */}
        {activeTab === "COACHES" && (
          <div className="space-y-5">
            {!isAuth ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                <span className="text-2xl">🔒</span>
                <h4 className="font-syncopate font-bold text-xs text-white">ADMIN AUTHENTICATION REQUIRED</h4>
                <p className="text-xs font-mono text-slate-400">
                  Please sign in with an Admin or Super Admin account.
                </p>
                <button
                  onClick={() => setActiveTab("LOGIN")}
                  className="px-4 py-2 rounded-xl bg-cyan-500/20 text-xs font-mono text-cyan-300 border border-cyan-500/40"
                >
                  GO TO SIGN IN ➔
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* ADD COACH FORM */}
                <form onSubmit={handleAddCoach} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 text-xs font-mono">
                  <h4 className="font-syncopate font-bold text-xs text-white border-b border-white/10 pb-2">
                    ADD NEW COACH / ANALYST
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">COACH FULL NAME</label>
                      <input
                        type="text"
                        required
                        value={newCoachName}
                        onChange={(e) => setNewCoachName(e.target.value)}
                        placeholder="e.g. Emil"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">LOGIN / EMAIL ADDRESS</label>
                      <input
                        type="email"
                        value={newCoachEmail}
                        onChange={(e) => setNewCoachEmail(e.target.value)}
                        placeholder="emil@intellectual.gg"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">TITLE</label>
                      <input
                        type="text"
                        value={newCoachTitle}
                        onChange={(e) => setNewCoachTitle(e.target.value)}
                        placeholder="e.g. Strategic Analyst"
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-400 block mb-1">SPECIALIZATION</label>
                      <select
                        value={newCoachSpec}
                        onChange={(e) => setNewCoachSpec(e.target.value as any)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white"
                      >
                        <option value="Head Coach" className="bg-[#090c14]">Head Coach</option>
                        <option value="Strategic Analyst" className="bg-[#090c14]">Strategic Analyst</option>
                        <option value="Aim & Mechanics" className="bg-[#090c14]">Aim & Mechanics</option>
                        <option value="Assistant Coach" className="bg-[#090c14]">Assistant Coach</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl font-syncopate font-bold text-xs text-black tracking-wider transition-all shadow-md"
                    style={{ backgroundColor: accentColor }}
                  >
                    ADD COACH ACCOUNT ➔
                  </button>
                </form>

                {/* CURRENT COACHES LIST */}
                <div className="space-y-2">
                  <h4 className="font-syncopate font-bold text-xs text-white">
                    CONFIGURED COACH ACCOUNTS ({coaches.length})
                  </h4>

                  {/* EDIT COACH LOGIN FORM (IF EDITING) */}
                  {editingCoach && (
                    <form
                      onSubmit={handleUpdateCoach}
                      className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/40 space-y-3 mb-3 text-xs font-mono animate-fade-in"
                    >
                      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                        <span className="font-syncopate font-bold text-xs text-cyan-300">
                          CONFIGURE LOGIN CREDENTIALS: {editingCoach.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingCoach(null)}
                          className="text-white/40 hover:text-white text-xs"
                        >
                          ✕ CANCEL
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[9px] text-cyan-200 block mb-1">COACH NAME</label>
                          <input
                            type="text"
                            required
                            value={editCoachName}
                            onChange={(e) => setEditCoachName(e.target.value)}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-cyan-200 block mb-1">LOGIN EMAIL / ID</label>
                          <input
                            type="email"
                            required
                            value={editCoachEmail}
                            onChange={(e) => setEditCoachEmail(e.target.value)}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-cyan-200 block mb-1">COACHING TITLE</label>
                          <input
                            type="text"
                            value={editCoachTitle}
                            onChange={(e) => setEditCoachTitle(e.target.value)}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-2 text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-cyan-200 block mb-1">SPECIALIZATION</label>
                          <select
                            value={editCoachSpec}
                            onChange={(e) => setEditCoachSpec(e.target.value as any)}
                            className="w-full bg-black/40 border border-cyan-500/30 rounded-lg p-2 text-white"
                          >
                            <option value="Head Coach" className="bg-[#090c14]">Head Coach</option>
                            <option value="Strategic Analyst" className="bg-[#090c14]">Strategic Analyst</option>
                            <option value="Aim & Mechanics" className="bg-[#090c14]">Aim & Mechanics</option>
                            <option value="Assistant Coach" className="bg-[#090c14]">Assistant Coach</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="submit"
                          className="flex-1 py-2 rounded-lg font-syncopate font-bold text-xs text-black tracking-wider transition-all bg-cyan-400 hover:bg-cyan-300"
                        >
                          SAVE COACH LOGIN CREDENTIALS ✓
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCoach(null)}
                          className="px-4 py-2 rounded-lg font-mono text-xs text-slate-300 hover:text-white bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {coaches.map((coach) => (
                      <div
                        key={coach.id}
                        className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-xs font-mono"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{coach.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                              {coach.specialization}
                            </span>
                          </div>
                          <span className="text-slate-400 text-[10px] block mt-0.5">
                            <strong className="text-slate-300">Login:</strong> {coach.email} • {coach.title} • Last Login: {coach.lastLogin || "2026-09-09"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              soundFx.playClick();
                              setEditingCoach(coach);
                              setEditCoachName(coach.name);
                              setEditCoachEmail(coach.email);
                              setEditCoachTitle(coach.title);
                              setEditCoachSpec(coach.specialization);
                            }}
                            className="px-2.5 py-1 rounded bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-syncopate"
                          >
                            CONFIG LOGIN
                          </button>
                          <button
                            onClick={() => handleRemoveCoach(coach.id)}
                            className="px-2.5 py-1 rounded bg-rose-950/50 hover:bg-rose-900 border border-rose-500/30 text-rose-300 text-[10px]"
                          >
                            REMOVE
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. TEAM PROFILE CUSTOMIZER (SUPER ADMIN ONLY) */}
        {activeTab === "TEAM" && (
          <div className="space-y-5">
            {currentRole !== "SUPER_ADMIN" ? (
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center space-y-3">
                <span className="text-2xl">👑</span>
                <h4 className="font-syncopate font-bold text-xs text-white">SUPER ADMIN ACCESS REQUIRED</h4>
                <p className="text-xs font-mono text-slate-400">
                  Only the platform owner can modify core team identity and branding.
                </p>
                <button
                  onClick={() => setActiveTab("LOGIN")}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 text-xs font-mono text-amber-300 border border-amber-500/40"
                >
                  SIGN IN AS SUPER ADMIN ➔
                </button>
              </div>
            ) : (
              <form onSubmit={handleUpdateTeam} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-4 text-xs font-mono">
                <div className="border-b border-white/10 pb-2">
                  <h4 className="font-syncopate font-bold text-xs text-white">
                    CUSTOMIZE TEAM IDENTITY & BRANDING
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Configure your squad name, tag, region, and motto.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">TEAM NAME</label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">TEAM SHORT TAG</label>
                    <input
                      type="text"
                      required
                      value={teamTag}
                      onChange={(e) => setTeamTag(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">COMPETITIVE REGION</label>
                    <input
                      type="text"
                      value={teamRegion}
                      onChange={(e) => setTeamRegion(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">PLATFORM ARCHITECT</label>
                    <input
                      type="text"
                      disabled
                      value="Morfit"
                      className="w-full bg-white/10 border border-white/10 rounded-lg p-2.5 text-amber-400 font-bold opacity-80"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">TEAM MOTTO</label>
                  <input
                    type="text"
                    value={teamMotto}
                    onChange={(e) => setTeamMotto(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-white"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl font-syncopate font-black text-xs text-black tracking-wider transition-all shadow-xl"
                  style={{ backgroundColor: accentColor }}
                >
                  SAVE TEAM BRANDING & IDENTITY ➔
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
