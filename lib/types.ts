export type Role = "Duelist" | "Initiator" | "Controller" | "Sentinel" | "IGL";

export type UserRole = "GUEST" | "USER" | "COACH" | "ADMIN" | "SUPER_ADMIN";

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  displayName: string;
  role: UserRole;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLogin?: string;
  failedAttempts: number;
  lockedUntil?: string | null;
}

export interface SessionRecord {
  token: string;
  userId: string;
  username: string;
  role: UserRole;
  expiresAt: string;
  createdAt: string;
}

export interface AgentProfile {
  id: string;
  name: string;
  role: Role;
  portrait: string;
  displayIcon: string;
  quoteEn: string;
  quoteJp: string;
  kanji: string;
  subJp: string;
  color: string;
  accent: string;
  bgKanji: string;
}

export interface PlayerStats {
  kd: number;
  acs: number;
  hsPercent: number;
}

export interface CoachScores {
  aim: number;
  utility: number;
  comms: number;
  entry: number;
  clutch: number;
}

export interface NormalizedScores {
  aim: number;
  utility: number;
  comms: number;
  entry: number;
  clutch: number;
  hs: number;
  acs: number;
  kd: number;
  coachScore: number;
  statScore: number;
  overall: number;
}

export interface PlayerRecord {
  player: string;
  riotId: string;
  name: string;
  tag: string;
  role: Role;
  agent: string;
  date?: string;
  rawStats: PlayerStats;
  coachScores: CoachScores;
  normalized: NormalizedScores;
  tier: "S" | "A" | "B" | "C";
  careerRating: number;
  formRating: number;
  consistencyRating: number;
  impactRating: number;
  rank: number;
  lastEvaluated?: string;
}

export interface CoachAccount {
  id: string;
  name: string;
  email: string;
  title: string;
  specialization: "Head Coach" | "Strategic Analyst" | "Aim & Mechanics" | "Assistant Coach";
  assignedPlayers: string[];
  createdAt: string;
  lastLogin?: string;
}

export interface TeamProfile {
  teamName: string;
  teamTag: string;
  region: string;
  owner: string;
  headCoach: string;
  foundedYear: string;
  motto: string;
}

export interface MatchHistoryEntry {
  date: string;
  player: string;
  role: Role;
  agent: string;
  aim: number;
  utility: number;
  comms: number;
  entry: number;
  clutch: number;
  hs: number;
  acs: number;
  kd: number;
  overall: number;
}

export interface SquadMetrics {
  activePlayers: number;
  avgAcs: number;
  avgKd: number;
  avgHs: number;
  mvpPlayer: string;
  mvpScore: number;
  topRole: Role;
  actStartDate: string;
}

export interface WeightConfig {
  duelist: number;
  initiator: number;
  controller: number;
  sentinel: number;
  igl: number;
}

export interface MapStrategy {
  id: string;
  name: string;
  imageUrl: string;
  winRate: number;
  attackWinRate: number;
  defenseWinRate: number;
  metaComp: Array<{
    role: Role;
    agent: string;
    assignedPlayer?: string;
  }>;
  keyCallouts: string[];
  tacticalNotes: string;
}

export interface DatabaseSchema {
  players: PlayerRecord[];
  history: MatchHistoryEntry[];
  tactics: MapStrategy[];
  metrics: SquadMetrics;
  coaches?: CoachAccount[];
  teamProfile?: TeamProfile;
  users?: UserAccount[];
  sessions?: SessionRecord[];
  lastSync?: string;
}

export type RadiantTheme = "crimson" | "cyan" | "gold" | "void" | "emerald";
