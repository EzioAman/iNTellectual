import fs from "fs";
import path from "path";
import { DatabaseSchema, PlayerRecord, CoachScores, Role, CoachAccount, TeamProfile } from "./types";
import { calculatePlayerScores, getTier } from "./valorantEngine";

const DB_FILE = path.join(process.cwd(), "data", "squad_db.json");

export const DEFAULT_TEAM_PROFILE: TeamProfile = {
  teamName: "INTELLECTUAL ESPORTS",
  teamTag: "IT",
  region: "PACIFIC / VCT",
  owner: "Morfit",
  headCoach: "Morfit",
  foundedYear: "2026",
  motto: "Tactical Superiority & Precision Mechanics",
};

export const DEFAULT_COACHES: CoachAccount[] = [
  {
    id: "coach-1",
    name: "Morfit",
    email: "morfit@intellectual.gg",
    title: "Head Strategic Coach & Architect",
    specialization: "Head Coach",
    assignedPlayers: ["JohnWick#0100", "Morfit#5534", "Horus九#ENEAD"],
    createdAt: "2026-01-15",
    lastLogin: "2026-09-09",
  },
  {
    id: "coach-2",
    name: "Chet",
    email: "chet@intellectual.gg",
    title: "VOD Review & Counter-Strategist",
    specialization: "Strategic Analyst",
    assignedPlayers: ["kay why esss#1111", "Yash#7777"],
    createdAt: "2026-02-01",
    lastLogin: "2026-09-08",
  },
  {
    id: "coach-3",
    name: "Potter",
    email: "potter@intellectual.gg",
    title: "Utility Timing & Mid-Round Specialist",
    specialization: "Aim & Mechanics",
    assignedPlayers: ["Akash#4321", "Phantom#0001"],
    createdAt: "2026-03-10",
    lastLogin: "2026-09-07",
  },
];

export function getDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      throw new Error("DB file does not exist");
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.coaches) parsed.coaches = DEFAULT_COACHES;
    if (!parsed.teamProfile) parsed.teamProfile = DEFAULT_TEAM_PROFILE;
    return parsed;
  } catch (err) {
    console.error("Failed to read squad_db.json:", err);
    throw err;
  }
}

export function saveDatabase(data: DatabaseSchema): void {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed writing squad_db.json:", err);
    throw err;
  }
}

export function updateCoachEvaluation(
  playerId: string,
  scores: CoachScores
): { player: PlayerRecord; allPlayers: PlayerRecord[] } {
  const db = getDatabase();
  const playerIndex = db.players.findIndex(
    (p) => p.player.toLowerCase() === playerId.toLowerCase()
  );

  if (playerIndex === -1) {
    throw new Error(`Player ${playerId} not found in squad database`);
  }

  const p = db.players[playerIndex];

  // Update coach scores
  p.coachScores = {
    aim: Number(scores.aim.toFixed(1)),
    utility: Number(scores.utility.toFixed(1)),
    comms: Number(scores.comms.toFixed(1)),
    entry: Number(scores.entry.toFixed(1)),
    clutch: Number(scores.clutch.toFixed(1)),
  };

  // Recalculate normalized and career rating
  const norm = calculatePlayerScores(
    p.role,
    p.coachScores,
    {
      hsPercent: p.rawStats.hsPercent,
      acs: p.rawStats.acs,
      kd: p.rawStats.kd,
    }
  );

  p.normalized = norm;
  p.careerRating = norm.overall;
  p.tier = getTier(norm.overall);
  p.lastEvaluated = new Date().toISOString().split("T")[0];

  // Re-sort all players and recalculate ranks
  db.players.sort((a, b) => b.careerRating - a.careerRating);
  db.players.forEach((item, idx) => {
    item.rank = idx + 1;
  });

  // Update metrics
  if (db.players.length > 0) {
    db.metrics.mvpPlayer = db.players[0].player;
    db.metrics.mvpScore = db.players[0].careerRating;
    db.metrics.avgAcs = Number(
      (db.players.reduce((acc, cur) => acc + cur.rawStats.acs, 0) / db.players.length).toFixed(1)
    );
    db.metrics.avgKd = Number(
      (db.players.reduce((acc, cur) => acc + cur.rawStats.kd, 0) / db.players.length).toFixed(2)
    );
    db.metrics.avgHs = Number(
      (db.players.reduce((acc, cur) => acc + cur.rawStats.hsPercent, 0) / db.players.length).toFixed(1)
    );
  }

  saveDatabase(db);
  return { player: p, allPlayers: db.players };
}

export function addOperative(newPlayer: {
  player: string;
  role: Role;
  agent: string;
  kd: number;
  acs: number;
  hsPercent: number;
  aim: number;
  utility: number;
  comms: number;
  entry: number;
  clutch: number;
}): PlayerRecord {
  const db = getDatabase();

  const parts = newPlayer.player.split("#");
  const name = parts[0];
  const tag = parts[1] ? `#${parts[1]}` : "";

  const coachScores: CoachScores = {
    aim: newPlayer.aim,
    utility: newPlayer.utility,
    comms: newPlayer.comms,
    entry: newPlayer.entry,
    clutch: newPlayer.clutch,
  };

  const norm = calculatePlayerScores(
    newPlayer.role,
    coachScores,
    {
      hsPercent: newPlayer.hsPercent,
      acs: newPlayer.acs,
      kd: newPlayer.kd,
    }
  );

  const playerRecord: PlayerRecord = {
    player: newPlayer.player,
    riotId: newPlayer.player,
    name,
    tag,
    role: newPlayer.role,
    agent: newPlayer.agent,
    rawStats: {
      kd: newPlayer.kd,
      acs: newPlayer.acs,
      hsPercent: newPlayer.hsPercent,
    },
    coachScores,
    normalized: norm,
    tier: getTier(norm.overall),
    careerRating: norm.overall,
    formRating: norm.overall,
    consistencyRating: 8.5,
    impactRating: norm.overall,
    rank: db.players.length + 1,
    lastEvaluated: new Date().toISOString().split("T")[0],
  };

  const idx = db.players.findIndex(
    (p) => p.player.toLowerCase() === newPlayer.player.toLowerCase()
  );
  if (idx >= 0) {
    db.players[idx] = playerRecord;
  } else {
    db.players.push(playerRecord);
  }

  db.players.sort((a, b) => b.careerRating - a.careerRating);
  db.players.forEach((item, i) => {
    item.rank = i + 1;
  });

  db.metrics.activePlayers = db.players.length;
  saveDatabase(db);
  return playerRecord;
}

export function removeOperative(playerId: string): PlayerRecord[] {
  const db = getDatabase();
  const initialLength = db.players.length;
  db.players = db.players.filter((p) => p.player.toLowerCase() !== playerId.toLowerCase());

  if (db.players.length === initialLength) {
    throw new Error(`Player ${playerId} not found`);
  }

  db.players.sort((a, b) => b.careerRating - a.careerRating);
  db.players.forEach((item, i) => {
    item.rank = i + 1;
  });

  db.metrics.activePlayers = db.players.length;
  saveDatabase(db);
  return db.players;
}

// Coach Management Functions
export function getCoaches(): CoachAccount[] {
  const db = getDatabase();
  return db.coaches || DEFAULT_COACHES;
}

export function addCoach(coachData: {
  name: string;
  email: string;
  title: string;
  specialization: "Head Coach" | "Strategic Analyst" | "Aim & Mechanics" | "Assistant Coach";
  assignedPlayers?: string[];
}): CoachAccount {
  const db = getDatabase();
  if (!db.coaches) db.coaches = [...DEFAULT_COACHES];

  const newCoach: CoachAccount = {
    id: `coach-${Date.now()}`,
    name: coachData.name,
    email: coachData.email,
    title: coachData.title,
    specialization: coachData.specialization,
    assignedPlayers: coachData.assignedPlayers || [],
    createdAt: new Date().toISOString().split("T")[0],
    lastLogin: new Date().toISOString().split("T")[0],
  };

  db.coaches.push(newCoach);
  saveDatabase(db);
  return newCoach;
}

export function removeCoach(coachId: string): CoachAccount[] {
  const db = getDatabase();
  if (!db.coaches) db.coaches = [...DEFAULT_COACHES];
  db.coaches = db.coaches.filter((c) => c.id !== coachId && c.name.toLowerCase() !== coachId.toLowerCase());
  saveDatabase(db);
  return db.coaches;
}

export function updateCoach(
  coachId: string,
  updates: Partial<CoachAccount>
): CoachAccount {
  const db = getDatabase();
  if (!db.coaches) db.coaches = [...DEFAULT_COACHES];

  const idx = db.coaches.findIndex((c) => c.id === coachId || c.email === coachId);
  if (idx === -1) {
    throw new Error(`Coach ${coachId} not found`);
  }

  db.coaches[idx] = { ...db.coaches[idx], ...updates };
  saveDatabase(db);
  return db.coaches[idx];
}

// Team Customizer Functions
export function getTeamProfile(): TeamProfile {
  const db = getDatabase();
  return db.teamProfile || DEFAULT_TEAM_PROFILE;
}

export function updateTeamProfile(profile: Partial<TeamProfile>): TeamProfile {
  const db = getDatabase();
  db.teamProfile = { ...(db.teamProfile || DEFAULT_TEAM_PROFILE), ...profile };
  saveDatabase(db);
  return db.teamProfile;
}
