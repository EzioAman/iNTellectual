export interface ValorantMap {
  id: string;
  name: string;
  category: "COMPETITIVE" | "UNRATED" | "TDM";
  imageUrl: string;
  radarUrl: string; // Official 2D Top-Down Radar Minimap
  sites: string[];
  callouts: string[];
  winRate: number;
  attackWinRate: number;
  defenseWinRate: number;
}

export const ALL_VALORANT_MAPS: ValorantMap[] = [
  {
    id: "ascent",
    name: "ASCENT",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt72e737c35582f3ef/5eb270138981e42e88a0e8d0/ascent-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png",
    sites: ["A Site", "B Site", "Mid Courtyard"],
    callouts: ["Mid Pizza", "Mid Tiles", "A Main", "A Tree", "A Heaven", "B Main", "B Market", "B Speed"],
    winRate: 68.4,
    attackWinRate: 52.0,
    defenseWinRate: 74.5,
  },
  {
    id: "bind",
    name: "BIND",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt89c74b8d73b22cf9/5eb2701222d3346d5cbe6f3a/bind-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Short", "A Bath (Showers)", "A Lamps (U-Hall)", "B Short", "B Hookah", "B Long", "A-to-B Teleporter"],
    winRate: 72.0,
    attackWinRate: 61.2,
    defenseWinRate: 66.8,
  },
  {
    id: "haven",
    name: "HAVEN",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt7e4f8d9cbb2e54d3/5eb2701322d3346d5cbe6f3e/haven-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png",
    sites: ["A Site", "B Site", "C Site"],
    callouts: ["A Long", "A Sewer", "A Heaven", "Mid Courtyard", "Mid Garage", "C Long", "C Window"],
    winRate: 64.2,
    attackWinRate: 58.0,
    defenseWinRate: 62.1,
  },
  {
    id: "split",
    name: "SPLIT",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltd188c023d08f0d6a/5eb27012ec4b7430337a6d58/split-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png",
    sites: ["A Site", "B Site", "Mid"],
    callouts: ["A Main", "A Rafters", "A Tower", "Mid Vent", "Mid Mail", "B Rafters", "B Alley", "B Garage"],
    winRate: 59.5,
    attackWinRate: 48.2,
    defenseWinRate: 69.8,
  },
  {
    id: "lotus",
    name: "LOTUS",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5c256038166c3c58/63bc7551061f5c6b9bb7c265/lotus-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png",
    sites: ["A Site", "B Site", "C Site"],
    callouts: ["A Rubble", "A Tree", "A Drop", "B Site Core", "C Mound", "C Waterfall", "Revolving Door"],
    winRate: 61.5,
    attackWinRate: 64.0,
    defenseWinRate: 54.2,
  },
  {
    id: "sunset",
    name: "SUNSET",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt6d5a1953e5e49cf9/64e83c27e26ce28be7a9b0c2/sunset-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Lobby", "A Main", "A Alley", "A Elbow", "Mid Courtyard", "Mid Tiles", "B Boba", "B Main"],
    winRate: 70.0,
    attackWinRate: 55.4,
    defenseWinRate: 72.8,
  },
  {
    id: "abyss",
    name: "ABYSS",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt8efc793ff9f81643/6667527663e6e1e6878b40aa/abyss-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Pit", "A Bridge", "A Vent", "Mid Catwalk", "Mid Library", "B Danger", "B Drop", "B Nest"],
    winRate: 66.0,
    attackWinRate: 58.5,
    defenseWinRate: 63.5,
  },
  {
    id: "icebox",
    name: "ICEBOX",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt01c775fc4c9dc891/5f8502db88e3905ee7a8846c/icebox-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Belt", "A Pipes", "A Nest", "Mid Boiler", "Mid Blue", "B Yellow", "B Garage", "B Snowman"],
    winRate: 63.0,
    attackWinRate: 51.0,
    defenseWinRate: 65.0,
  },
  {
    id: "breeze",
    name: "BREEZE",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/bltc5d045d65d755da9/607f2e1197f4803d5267e7dc/breeze-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Cave", "A Pyramids", "A Hall", "Mid Chute", "Mid Nest", "B Window", "B Elbow"],
    winRate: 58.5,
    attackWinRate: 55.0,
    defenseWinRate: 57.0,
  },
  {
    id: "fracture",
    name: "FRACTURE",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt364d9e07890b0702/613133ca0b7d727b134eb923/fracture-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Dish", "A Drop", "A Rope", "A Hall", "B Arcade", "B Bench", "B Canteen", "Ziplines"],
    winRate: 62.0,
    attackWinRate: 60.0,
    defenseWinRate: 55.0,
  },
  {
    id: "pearl",
    name: "PEARL",
    category: "COMPETITIVE",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt5be72d73be1e33d4/62b661d9a212365a6e873cfb/pearl-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png",
    sites: ["A Site", "B Site"],
    callouts: ["A Main", "A Art", "A Dugout", "Mid Plaza", "Mid Doors", "B Ramp", "B Long", "B Tower"],
    winRate: 60.0,
    attackWinRate: 54.0,
    defenseWinRate: 62.0,
  },
  {
    id: "district",
    name: "DISTRICT",
    category: "TDM",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt7ef999dae13b8656/649386c9945df84b65593c6f/district-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/690b3ed2-4dff-945b-8223-6da834e30d24/displayicon.png",
    sites: ["Mid Courtyard", "Sniper Perch"],
    callouts: ["Arcade", "High Road", "Alley", "Drop-down"],
    winRate: 65.0,
    attackWinRate: 50.0,
    defenseWinRate: 50.0,
  },
  {
    id: "kasbah",
    name: "KASBAH",
    category: "TDM",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blte9cfcb129a008272/649386c9d7494a4c522aaec1/kasbah-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/12452a9d-48c3-0b02-e7eb-0381c3520404/displayicon.png",
    sites: ["Central Bazaar", "Overlook"],
    callouts: ["Tower", "Piazza", "Courtyard Lane", "Low Bridge"],
    winRate: 67.0,
    attackWinRate: 50.0,
    defenseWinRate: 50.0,
  },
  {
    id: "drift",
    name: "DRIFT",
    category: "TDM",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt9e76313ef47470f1/65691ea92f694e1cf6f34e32/drift-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/2c09d728-42d5-30d8-43dc-96a05cc7ee9d/displayicon.png",
    sites: ["Lagoon Center", "Zipline Beach"],
    callouts: ["Boardwalk", "Zipline Track", "Waterfall Perch"],
    winRate: 70.0,
    attackWinRate: 50.0,
    defenseWinRate: 50.0,
  },
  {
    id: "piazza",
    name: "PIAZZA",
    category: "TDM",
    imageUrl: "https://images.contentstack.io/v3/assets/bltb6530b271fddd0b1/blt90494cf81c0c6607/649386c91350a84e207908c6/piazza-featured.png",
    radarUrl: "https://media.valorant-api.com/maps/de28aa9b-4cbe-1003-320e-6cb3ec309557/displayicon.png",
    sites: ["Central Bell Tower", "Canal Walk"],
    callouts: ["Belfry", "Balcony", "Bridge Passage"],
    winRate: 64.0,
    attackWinRate: 50.0,
    defenseWinRate: 50.0,
  },
];

// Tactical Whiteboard Element Types
export interface TacticalAgentToken {
  id: string;
  team: "ATTACKER" | "DEFENDER";
  agent: string;
  role: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  facingAngle?: number; // Degrees 0-360
  label?: string;
}

export interface TacticalUtilityMarker {
  id: string;
  type: "SMOKE" | "WALL" | "FLASH" | "LINEUP" | "SPIKE" | "RECON";
  label: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  endX?: number; // For walls
  endY?: number; // For walls
  radius?: number; // Smoke/Recon radius in percentage (default 8)
  color?: string;
  agent?: string;
}

export interface TacticalMovementArrow {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
  color?: string;
  style?: "SOLID" | "DASHED";
}

export interface ProPlaybookPreset {
  id: string;
  title: string;
  proTeam: string;
  mapId: string;
  side: "ATTACK" | "DEFENSE";
  buyType: "PISTOL" | "ECO" | "BONUS" | "FULL_BUY";
  description: string;
  phase1: string;
  phase2: string;
  phase3: string;
  agents: TacticalAgentToken[];
  utility: TacticalUtilityMarker[];
  arrows: TacticalMovementArrow[];
}

export const PRO_PLAYBOOK_PRESETS: ProPlaybookPreset[] = [
  {
    id: "fnatic-ascent-a-split",
    title: "A-Short Split & Tree Control",
    proTeam: "FNATIC (VCT Masters Champions)",
    mapId: "ascent",
    side: "ATTACK",
    buyType: "FULL_BUY",
    description: "Methodical mid control into simultaneous A-Main and A-Short tree pinch, smoking Heaven and Garden.",
    phase1: "Default hold: Sova recons B-Main to bait rotations while Omen and Jett secure Mid Tiles.",
    phase2: "KAY/O knife hits Tree door. Omen drops deep smokes on A-Heaven and Garden. Jett dashes onto generator.",
    phase3: "Killjoy plants default open for A-Main. Post-plant crossfire setup between Tree and A-Long.",
    agents: [
      { id: "a1", team: "ATTACKER", agent: "Jett", role: "Duelist", x: 62, y: 72, label: "Entry Dash" },
      { id: "a2", team: "ATTACKER", agent: "Omen", role: "Controller", x: 50, y: 65, label: "Smoker" },
      { id: "a3", team: "ATTACKER", agent: "Sova", role: "Initiator", x: 68, y: 78, label: "Dart Scout" },
      { id: "a4", team: "ATTACKER", agent: "Kayo", role: "Initiator", x: 56, y: 60, label: "Flash/Suppr" },
      { id: "a5", team: "ATTACKER", agent: "Killjoy", role: "Sentinel", x: 60, y: 76, label: "Planter" },
      { id: "d1", team: "DEFENDER", agent: "Cypher", role: "Sentinel", x: 65, y: 28, label: "A Anchor" },
      { id: "d2", team: "DEFENDER", agent: "Sova", role: "Initiator", x: 62, y: 18, label: "A Heaven" },
    ],
    utility: [
      { id: "u1", type: "SMOKE", label: "Heaven Smoke", x: 64, y: 22, radius: 7, color: "#9333ea" },
      { id: "u2", type: "SMOKE", label: "Garden Door Smoke", x: 52, y: 38, radius: 7, color: "#9333ea" },
      { id: "u3", type: "FLASH", label: "KAY/O Pop Flash", x: 61, y: 44, color: "#facc15" },
      { id: "u4", type: "SPIKE", label: "Default Plant", x: 63, y: 35, color: "#ef4444" },
      { id: "u5", type: "RECON", label: "Sova A-Site Ping", x: 63, y: 30, radius: 10, color: "#38bdf8" },
    ],
    arrows: [
      { id: "arr1", fromX: 68, fromY: 78, toX: 64, toY: 50, label: "A-Main Push", color: "#ff4655" },
      { id: "arr2", fromX: 50, fromY: 65, toX: 54, toY: 42, label: "Tree Pinch", color: "#38bdf8" },
      { id: "arr3", fromX: 62, fromY: 72, toX: 63, toY: 34, label: "Jett Cloudburst Dash", color: "#5bf8ff" },
    ],
  },
  {
    id: "prx-bind-b-teleport-aggro",
    title: "B-Hookah & Teleport Chaos Blitz",
    proTeam: "PAPER REX (W-Gaming Aggro)",
    mapId: "bind",
    side: "ATTACK",
    buyType: "FULL_BUY",
    description: "High-tempo B-site swarm utilizing double satchel entries, Brimstone stim beacon, and instant teleport flank cut-offs.",
    phase1: "Fast B-Long contact with Brimstone stim beacon. Raze throws Paint Shells deep into Hookah window.",
    phase2: "Brimstone drops triple smokes: Elbow, CT (Hall), and B-Back. Raze double-satchels into B-Site container.",
    phase3: "Instant spike plant on B-Site open for Long. Yoru or Reyna holds the teleport exit to eliminate rotating defenders.",
    agents: [
      { id: "a1", team: "ATTACKER", agent: "Raze", role: "Duelist", x: 30, y: 70, label: "Satchel Entry" },
      { id: "a2", team: "ATTACKER", agent: "Brimstone", role: "Controller", x: 24, y: 78, label: "Triple Smoker" },
      { id: "a3", team: "ATTACKER", agent: "Fade", role: "Initiator", x: 34, y: 74, label: "Haunt Recon" },
      { id: "a4", team: "ATTACKER", agent: "Yoru", role: "Duelist", x: 42, y: 65, label: "TP Lurker" },
      { id: "a5", team: "ATTACKER", agent: "Skye", role: "Initiator", x: 26, y: 72, label: "Flasher" },
      { id: "d1", team: "DEFENDER", agent: "Viper", role: "Controller", x: 26, y: 32, label: "B Anchor" },
      { id: "d2", team: "DEFENDER", agent: "Chamber", role: "Sentinel", x: 20, y: 28, label: "B Elbow" },
    ],
    utility: [
      { id: "u1", type: "SMOKE", label: "CT Hall Smoke", x: 28, y: 24, radius: 7, color: "#ea580c" },
      { id: "u2", type: "SMOKE", label: "B-Elbow Smoke", x: 18, y: 32, radius: 7, color: "#ea580c" },
      { id: "u3", type: "FLASH", label: "Skye Guiding Light", x: 30, y: 52, color: "#facc15" },
      { id: "u4", type: "SPIKE", label: "B-Open Plant", x: 26, y: 44, color: "#ef4444" },
    ],
    arrows: [
      { id: "arr1", fromX: 30, fromY: 70, toX: 27, toY: 42, label: "Satchel Fly", color: "#ff7700" },
      { id: "arr2", fromX: 24, fromY: 78, toX: 22, toY: 55, label: "B-Long Push", color: "#fbbf24" },
    ],
  },
  {
    id: "sentinels-haven-c-retake",
    title: "C-Site Retake & Garage Flush",
    proTeam: "SENTINELS (Masters Madrid Champions)",
    mapId: "haven",
    side: "DEFENSE",
    buyType: "FULL_BUY",
    description: "Methodical 4-man retake protocol utilizing Breach flash combos, Sova shock darts, and Garage cross-fire synchronization.",
    phase1: "Give up initial C-site tap to avoid getting isolated. Regroup 3 players at C-Link and 1 at Garage.",
    phase2: "Breach Fault Line concusses C-Long box. Omen smokes off C-Long entrance. Sova darts C-Back.",
    phase3: "Simultaneous entry from C-Link and Garage. Defuse with half-tap bait while holding C-Long crossfire.",
    agents: [
      { id: "d1", team: "DEFENDER", agent: "Breach", role: "Initiator", x: 26, y: 24, label: "Fault Line" },
      { id: "d2", team: "DEFENDER", agent: "Omen", role: "Controller", x: 32, y: 20, label: "Retake Smoker" },
      { id: "d3", team: "DEFENDER", agent: "Sova", role: "Initiator", x: 24, y: 28, label: "Shock Dart" },
      { id: "d4", team: "DEFENDER", agent: "Jett", role: "Duelist", x: 38, y: 42, label: "Garage Pinch" },
      { id: "a1", team: "ATTACKER", agent: "Killjoy", role: "Sentinel", x: 18, y: 64, label: "Post-plant hold" },
      { id: "a2", team: "ATTACKER", agent: "Reyna", role: "Duelist", x: 14, y: 55, label: "C-Long" },
    ],
    utility: [
      { id: "u1", type: "SMOKE", label: "C-Long Cutoff Smoke", x: 16, y: 52, radius: 8, color: "#9333ea" },
      { id: "u2", type: "FLASH", label: "Breach Flashpoint", x: 20, y: 40, color: "#facc15" },
      { id: "u3", type: "SPIKE", label: "C-Site Spike", x: 20, y: 44, color: "#ef4444" },
    ],
    arrows: [
      { id: "arr1", fromX: 26, fromY: 24, toX: 21, toY: 40, label: "C-Link Sweep", color: "#3b82f6" },
      { id: "arr2", fromX: 38, fromY: 42, toX: 24, toY: 44, label: "Garage Flank", color: "#10b981" },
    ],
  },
  {
    id: "drx-lotus-3-site-protocol",
    title: "Lotus 3-Site Information Pressure",
    proTeam: "DRX (Korean Tactical Mastery)",
    mapId: "lotus",
    side: "ATTACK",
    buyType: "FULL_BUY",
    description: "Triple-point map probe holding A-Rubble and C-Mound while manipulating the revolving door to force over-rotations.",
    phase1: "Viper walls C-Mound. Fade eyes A-Rubble. Omen holds B-Core sightline.",
    phase2: "Activate revolving door to bait B-site defense. Flash through door and commit to A-Drop fast wrap.",
    phase3: "Plant A-Site behind rubble. Hold A-Drop and A-Main crossfire angles.",
    agents: [
      { id: "a1", team: "ATTACKER", agent: "Viper", role: "Controller", x: 30, y: 72, label: "Wall Deployer" },
      { id: "a2", team: "ATTACKER", agent: "Fade", role: "Initiator", x: 74, y: 68, label: "A-Recon" },
      { id: "a3", team: "ATTACKER", agent: "Killjoy", role: "Sentinel", x: 50, y: 70, label: "Mid Anchor" },
      { id: "a4", team: "ATTACKER", agent: "Raze", role: "Duelist", x: 68, y: 62, label: "A-Hit Entry" },
      { id: "a5", team: "ATTACKER", agent: "Omen", role: "Controller", x: 54, y: 56, label: "Door Lurk" },
    ],
    utility: [
      { id: "u1", type: "WALL", label: "Viper Toxic Screen", x: 28, y: 55, endX: 36, endY: 35, color: "#10b981" },
      { id: "u2", type: "SMOKE", label: "A-Top Smoke", x: 70, y: 36, radius: 7, color: "#9333ea" },
      { id: "u3", type: "SPIKE", label: "A-Site Plant", x: 68, y: 44, color: "#ef4444" },
    ],
    arrows: [
      { id: "arr1", fromX: 74, fromY: 68, toX: 68, toY: 48, label: "A-Main Push", color: "#ff4655" },
      { id: "arr2", fromX: 54, fromY: 56, toX: 64, toY: 46, label: "Door Wrap", color: "#a855f7" },
    ],
  },
  {
    id: "geng-sunset-b-control",
    title: "Sunset B-Main Heavy Control & Boba Split",
    proTeam: "GEN.G (VCT Pacific Champions)",
    mapId: "sunset",
    side: "ATTACK",
    buyType: "FULL_BUY",
    description: "Dominant B-lobby control into double-flash entry, isolating B-Boba and locking down market sightlines.",
    phase1: "Gekko Dizzy clears B-Main corner. Sova recon hits B-Site back wall.",
    phase2: "Omen smokes B-Market and B-Boba. Cypher camera watches Mid flank. Neon slides into site.",
    phase3: "Plant open for B-Main. Hold post-plant line-of-sight from B-Main lobby with crossfire.",
    agents: [
      { id: "a1", team: "ATTACKER", agent: "Neon", role: "Duelist", x: 28, y: 70, label: "Slide Entry" },
      { id: "a2", team: "ATTACKER", agent: "Gekko", role: "Initiator", x: 24, y: 75, label: "Wingman Plant" },
      { id: "a3", team: "ATTACKER", agent: "Omen", role: "Controller", x: 32, y: 72, label: "Smoker" },
      { id: "a4", team: "ATTACKER", agent: "Sova", role: "Initiator", x: 22, y: 78, label: "Site Dart" },
      { id: "a5", team: "ATTACKER", agent: "Cypher", role: "Sentinel", x: 44, y: 64, label: "Mid Flank Watch" },
    ],
    utility: [
      { id: "u1", type: "SMOKE", label: "B-Market Smoke", x: 24, y: 38, radius: 7, color: "#9333ea" },
      { id: "u2", type: "SMOKE", label: "B-Boba Smoke", x: 32, y: 32, radius: 7, color: "#9333ea" },
      { id: "u3", type: "SPIKE", label: "B-Pillar Plant", x: 26, y: 48, color: "#ef4444" },
    ],
    arrows: [
      { id: "arr1", fromX: 28, fromY: 70, toX: 26, toY: 46, label: "Neon High Velocity", color: "#5bf8ff" },
      { id: "arr2", fromX: 44, fromY: 64, toX: 36, toY: 42, label: "Mid to Boba Pinch", color: "#fbbf24" },
    ],
  },
];

export interface CustomStrategy {
  id: string;
  title: string;
  mapId: string;
  side: "ATTACK" | "DEFENSE";
  buyType: "PISTOL" | "ECO" | "BONUS" | "FULL_BUY";
  author: string;
  createdAt: string;
  phase1: string;
  phase2: string;
  phase3: string;
  comp: Array<{
    agent: string;
    role: string;
    note: string;
  }>;
  utilityMarkers: Array<{
    x: number;
    y: number;
    type: "SMOKE" | "FLASH" | "LINEUP" | "SPIKE" | "WALL";
    label: string;
  }>;
  agents?: TacticalAgentToken[];
  arrows?: TacticalMovementArrow[];
}
