export interface ReplayEvent {
  timestamp: number; // Seconds into round (0 to 100)
  type: "MOVE" | "SMOKE" | "FLASH" | "KILL" | "PLANT" | "DEFUSE" | "RECON";
  actor: string; // Player or Agent name
  team: "ATTACKER" | "DEFENDER";
  target?: string; // For kills
  x?: number; // Target coordinate percentage (0-100)
  y?: number;
  text?: string;
  color?: string;
}

export interface ReplayAgentState {
  name: string;
  agent: string;
  team: "ATTACKER" | "DEFENDER";
  startX: number;
  startY: number;
  path: Array<{ time: number; x: number; y: number }>;
}

export interface MatchRoundReplay {
  id: string;
  title: string;
  tournament: string;
  mapId: string;
  roundNumber: number;
  winningTeam: "ATTACKER" | "DEFENDER";
  roundDurationSeconds: number;
  attackers: ReplayAgentState[];
  defenders: ReplayAgentState[];
  events: ReplayEvent[];
}

export const VCT_ROUND_REPLAYS: MatchRoundReplay[] = [
  {
    id: "ascent-masters-fnatic",
    title: "Round 14: Ascent A-Short Split Execution",
    tournament: "VCT Masters Grand Final (Fnatic vs Sentinels)",
    mapId: "ascent",
    roundNumber: 14,
    winningTeam: "ATTACKER",
    roundDurationSeconds: 85,
    attackers: [
      {
        name: "Derke",
        agent: "Jett",
        team: "ATTACKER",
        startX: 62,
        startY: 75,
        path: [
          { time: 0, x: 62, y: 75 },
          { time: 20, x: 60, y: 55 },
          { time: 35, x: 63, y: 36 }, // Site dash
          { time: 60, x: 63, y: 34 },
        ],
      },
      {
        name: "Boaster",
        agent: "Omen",
        team: "ATTACKER",
        startX: 52,
        startY: 72,
        path: [
          { time: 0, x: 52, y: 72 },
          { time: 25, x: 54, y: 46 }, // Tree
          { time: 50, x: 56, y: 38 },
        ],
      },
      {
        name: "Chronicle",
        agent: "Kayo",
        team: "ATTACKER",
        startX: 58,
        startY: 68,
        path: [
          { time: 0, x: 58, y: 68 },
          { time: 22, x: 58, y: 48 },
          { time: 45, x: 62, y: 40 },
        ],
      },
      {
        name: "Leo",
        agent: "Sova",
        team: "ATTACKER",
        startX: 68,
        startY: 80,
        path: [
          { time: 0, x: 68, y: 80 },
          { time: 30, x: 66, y: 55 },
          { time: 60, x: 66, y: 45 },
        ],
      },
      {
        name: "Alfajer",
        agent: "Killjoy",
        team: "ATTACKER",
        startX: 60,
        startY: 78,
        path: [
          { time: 0, x: 60, y: 78 },
          { time: 35, x: 62, y: 45 },
          { time: 42, x: 63, y: 36 }, // Planter
        ],
      },
    ],
    defenders: [
      {
        name: "TenZ",
        agent: "Omen",
        team: "DEFENDER",
        startX: 62,
        startY: 20,
        path: [
          { time: 0, x: 62, y: 20 },
          { time: 35, x: 60, y: 25 },
          { time: 50, x: 63, y: 30 },
        ],
      },
      {
        name: "zekken",
        agent: "Raze",
        team: "DEFENDER",
        startX: 66,
        startY: 32,
        path: [
          { time: 0, x: 66, y: 32 },
          { time: 28, x: 64, y: 38 },
        ],
      },
      {
        name: "johnqt",
        agent: "Cypher",
        team: "DEFENDER",
        startX: 54,
        startY: 34,
        path: [
          { time: 0, x: 54, y: 34 },
          { time: 25, x: 53, y: 38 },
        ],
      },
      {
        name: "Sacy",
        agent: "Fade",
        team: "DEFENDER",
        startX: 24,
        startY: 32,
        path: [
          { time: 0, x: 24, y: 32 },
          { time: 35, x: 40, y: 28 },
          { time: 65, x: 58, y: 22 },
        ],
      },
      {
        name: "Zellsis",
        agent: "Kayo",
        team: "DEFENDER",
        startX: 28,
        startY: 24,
        path: [
          { time: 0, x: 28, y: 24 },
          { time: 40, x: 44, y: 24 },
          { time: 70, x: 60, y: 20 },
        ],
      },
    ],
    events: [
      { timestamp: 12, type: "RECON", actor: "Leo (Sova)", team: "ATTACKER", x: 64, y: 32, text: "Sova Recon Dart lands on A-Site Generator" },
      { timestamp: 24, type: "SMOKE", actor: "Boaster (Omen)", team: "ATTACKER", x: 62, y: 22, color: "#9333ea", text: "Omen smokes A-Heaven" },
      { timestamp: 26, type: "SMOKE", actor: "Boaster (Omen)", team: "ATTACKER", x: 53, y: 36, color: "#9333ea", text: "Omen smokes A-Tree Garden Door" },
      { timestamp: 28, type: "FLASH", actor: "Chronicle (KAY/O)", team: "ATTACKER", x: 60, y: 44, color: "#facc15", text: "KAY/O Pop Flash through A-Main" },
      { timestamp: 31, type: "KILL", actor: "Derke (Jett)", team: "ATTACKER", target: "zekken (Raze)", x: 64, y: 36, text: "FIRST BLOOD: Derke eliminated zekken (Vandal Headshot)" },
      { timestamp: 36, type: "KILL", actor: "Boaster (Omen)", team: "ATTACKER", target: "johnqt (Cypher)", x: 53, y: 36, text: "Boaster eliminated johnqt at Tree Door" },
      { timestamp: 42, type: "PLANT", actor: "Alfajer (Killjoy)", team: "ATTACKER", x: 63, y: 36, text: "SPIKE PLANTED on A-Site (45s Ticking)" },
      { timestamp: 55, type: "KILL", actor: "TenZ (Omen)", team: "DEFENDER", target: "Chronicle (KAY/O)", x: 62, y: 30, text: "TenZ eliminated Chronicle from Heaven smoke" },
      { timestamp: 72, type: "KILL", actor: "Derke (Jett)", team: "ATTACKER", target: "TenZ (Omen)", x: 62, y: 25, text: "Derke traded out TenZ" },
      { timestamp: 78, type: "KILL", actor: "Leo (Sova)", team: "ATTACKER", target: "Sacy (Fade)", x: 60, y: 24, text: "Leo eliminated Sacy" },
      { timestamp: 82, type: "KILL", actor: "Alfajer (Killjoy)", team: "ATTACKER", target: "Zellsis (KAY/O)", x: 61, y: 22, text: "ROUND SECURED: Alfajer clutches defuse denial" },
    ],
  },
  {
    id: "bind-masters-prx",
    title: "Round 9: Bind B-Hookah Fast Aggro Blitz",
    tournament: "VCT Pacific Finals (Paper Rex vs Gen.G)",
    mapId: "bind",
    roundNumber: 9,
    winningTeam: "ATTACKER",
    roundDurationSeconds: 70,
    attackers: [
      {
        name: "jinggg",
        agent: "Raze",
        team: "ATTACKER",
        startX: 32,
        startY: 72,
        path: [
          { time: 0, x: 32, y: 72 },
          { time: 18, x: 28, y: 55 },
          { time: 26, x: 26, y: 40 }, // Double satchel into site
        ],
      },
      {
        name: "mindfreak",
        agent: "Brimstone",
        team: "ATTACKER",
        startX: 24,
        startY: 78,
        path: [
          { time: 0, x: 24, y: 78 },
          { time: 20, x: 22, y: 60 },
          { time: 40, x: 22, y: 48 },
        ],
      },
      {
        name: "f0rsakeN",
        agent: "Yoru",
        team: "ATTACKER",
        startX: 40,
        startY: 68,
        path: [
          { time: 0, x: 40, y: 68 },
          { time: 25, x: 30, y: 38 },
        ],
      },
      {
        name: "something",
        agent: "Jett",
        team: "ATTACKER",
        startX: 30,
        startY: 74,
        path: [
          { time: 0, x: 30, y: 74 },
          { time: 22, x: 26, y: 44 },
        ],
      },
      {
        name: "d4v41",
        agent: "Skye",
        team: "ATTACKER",
        startX: 26,
        startY: 74,
        path: [
          { time: 0, x: 26, y: 74 },
          { time: 30, x: 24, y: 48 },
        ],
      },
    ],
    defenders: [
      {
        name: "Munchkin",
        agent: "Viper",
        team: "DEFENDER",
        startX: 26,
        startY: 32,
        path: [
          { time: 0, x: 26, y: 32 },
          { time: 24, x: 26, y: 36 },
        ],
      },
      {
        name: "t3xture",
        agent: "Jett",
        team: "DEFENDER",
        startX: 20,
        startY: 28,
        path: [
          { time: 0, x: 20, y: 28 },
          { time: 22, x: 22, y: 34 },
        ],
      },
      {
        name: "Meteor",
        agent: "Killjoy",
        team: "DEFENDER",
        startX: 56,
        startY: 36,
        path: [
          { time: 0, x: 56, y: 36 },
          { time: 25, x: 44, y: 34 },
        ],
      },
      {
        name: "Lakia",
        agent: "Fade",
        team: "DEFENDER",
        startX: 64,
        startY: 38,
        path: [
          { time: 0, x: 64, y: 38 },
          { time: 30, x: 42, y: 32 },
        ],
      },
      {
        name: "Karon",
        agent: "Omen",
        team: "DEFENDER",
        startX: 50,
        startY: 28,
        path: [
          { time: 0, x: 50, y: 28 },
          { time: 28, x: 34, y: 28 },
        ],
      },
    ],
    events: [
      { timestamp: 14, type: "FLASH", actor: "d4v41 (Skye)", team: "ATTACKER", x: 28, y: 52, color: "#facc15", text: "Skye Guiding Light blinds Hookah" },
      { timestamp: 18, type: "SMOKE", actor: "mindfreak (Brimstone)", team: "ATTACKER", x: 28, y: 24, color: "#ea580c", text: "Brimstone Sky Smoke on CT Hall" },
      { timestamp: 20, type: "SMOKE", actor: "mindfreak (Brimstone)", team: "ATTACKER", x: 18, y: 32, color: "#ea580c", text: "Brimstone Sky Smoke on B-Elbow" },
      { timestamp: 24, type: "KILL", actor: "jinggg (Raze)", team: "ATTACKER", target: "Munchkin (Viper)", x: 26, y: 36, text: "FIRST BLOOD: jinggg satchel shotgun kill on Munchkin" },
      { timestamp: 26, type: "KILL", actor: "something (Jett)", team: "ATTACKER", target: "t3xture (Jett)", x: 22, y: 34, text: "something Operator entry on t3xture" },
      { timestamp: 32, type: "PLANT", actor: "d4v41 (Skye)", team: "ATTACKER", x: 26, y: 44, text: "SPIKE PLANTED on B-Site Container" },
      { timestamp: 45, type: "KILL", actor: "f0rsakeN (Yoru)", team: "ATTACKER", target: "Karon (Omen)", x: 30, y: 32, text: "f0rsakeN teleports behind rotating defenders" },
      { timestamp: 62, type: "KILL", actor: "jinggg (Raze)", team: "ATTACKER", target: "Meteor (Killjoy)", x: 28, y: 30, text: "ROUND WON: Paper Rex sweeps retake attempt" },
    ],
  },
];
