import { getDatabase } from "./db";
import { PlayerRecord, Role } from "./types";
import { ROLE_BENCHMARK_TARGETS, ROLE_BENCHMARK_STATS } from "./valorantEngine";

export interface RAGContext {
  player: PlayerRecord;
  roleTargets: { aim: number; utility: number; comms: number; entry: number; clutch: number };
  statBenchmarks: { hs: number; acs: number; kd: number };
  deficits: {
    aimDelta: number;
    utilityDelta: number;
    commsDelta: number;
    entryDelta: number;
    clutchDelta: number;
    hsDelta: number;
    acsDelta: number;
    kdDelta: number;
  };
}

export function retrievePlayerContext(playerNameOrId: string): RAGContext | null {
  const db = getDatabase();
  const player = db.players.find(
    (p) =>
      p.player.toLowerCase().includes(playerNameOrId.toLowerCase()) ||
      p.name.toLowerCase().includes(playerNameOrId.toLowerCase())
  );

  if (!player) return null;

  const role = player.role;
  const targets = ROLE_BENCHMARK_TARGETS[role] || ROLE_BENCHMARK_TARGETS["Duelist"];
  const benchmarks = ROLE_BENCHMARK_STATS[role] || ROLE_BENCHMARK_STATS["Duelist"];

  return {
    player,
    roleTargets: targets,
    statBenchmarks: benchmarks,
    deficits: {
      aimDelta: Number((targets.aim - player.coachScores.aim).toFixed(1)),
      utilityDelta: Number((targets.utility - player.coachScores.utility).toFixed(1)),
      commsDelta: Number((targets.comms - player.coachScores.comms).toFixed(1)),
      entryDelta: Number((targets.entry - player.coachScores.entry).toFixed(1)),
      clutchDelta: Number((targets.clutch - player.coachScores.clutch).toFixed(1)),
      hsDelta: Number((benchmarks.hs - player.rawStats.hsPercent).toFixed(1)),
      acsDelta: Number((benchmarks.acs - player.rawStats.acs).toFixed(0)),
      kdDelta: Number((benchmarks.kd - player.rawStats.kd).toFixed(2)),
    },
  };
}

export function generateCoachFeedback(query: string, playerId?: string): {
  answer: string;
  drills: string[];
  focusPillars: string[];
  contextRetrieved: string;
} {
  const db = getDatabase();
  let targetPlayer = db.players[0];

  if (playerId) {
    const found = db.players.find((p) => p.player.toLowerCase() === playerId.toLowerCase());
    if (found) targetPlayer = found;
  } else {
    // Attempt name match in query
    const matched = db.players.find(
      (p) =>
        query.toLowerCase().includes(p.name.toLowerCase()) ||
        query.toLowerCase().includes(p.player.toLowerCase())
    );
    if (matched) targetPlayer = matched;
  }

  const ctx = retrievePlayerContext(targetPlayer.player);
  if (!ctx) {
    return {
      answer: "No specific operative found matching query. Please select an operative from the squad roster.",
      drills: ["Standard 20-min Hard Bots Routine", "Recoil Control in The Range"],
      focusPillars: ["Crosshair Placement", "Economy Discipline"],
      contextRetrieved: "Global Roster Index",
    };
  }

  const { player, deficits, roleTargets, statBenchmarks } = ctx;

  // Identify top two largest deficits
  const coachDeficits = [
    { name: "AIM", val: deficits.aimDelta, target: roleTargets.aim, actual: player.coachScores.aim },
    { name: "UTILITY", val: deficits.utilityDelta, target: roleTargets.utility, actual: player.coachScores.utility },
    { name: "COMMS", val: deficits.commsDelta, target: roleTargets.comms, actual: player.coachScores.comms },
    { name: "ENTRY", val: deficits.entryDelta, target: roleTargets.entry, actual: player.coachScores.entry },
    { name: "CLUTCH", val: deficits.clutchDelta, target: roleTargets.clutch, actual: player.coachScores.clutch },
  ].sort((a, b) => b.val - a.val);

  const topGap = coachDeficits[0];
  const secondGap = coachDeficits[1];

  let answer = `### VCT RAG Tactical Assessment: ${player.name} (${player.role} - ${player.agent})\n\n`;
  answer += `**Overall Career Rating:** ${player.careerRating.toFixed(2)} / 10 (Tier ${player.tier}, Squad Rank #${player.rank})\n\n`;
  answer += `#### 🔍 Telemetry & Metric Deficit Breakdown:\n`;
  answer += `- **Primary Focus Area (${topGap.name}):** Current score is **${topGap.actual} / 10** vs the ${player.role} target of **${topGap.target}** (Deficit gap: ${topGap.val > 0 ? `-${topGap.val}` : "Meets benchmark"}).\n`;
  answer += `- **Secondary Focus Area (${secondGap.name}):** Current score is **${secondGap.actual} / 10** vs target of **${secondGap.target}**.\n`;
  answer += `- **In-Game Performance Ratios:** K/D is **${player.rawStats.kd.toFixed(2)}** (Benchmark: ${statBenchmarks.kd}), ACS is **${player.rawStats.acs.toFixed(0)}** (Benchmark: ${statBenchmarks.acs}), and HS% is **${player.rawStats.hsPercent.toFixed(1)}%** (Benchmark: ${statBenchmarks.hs}%).\n\n`;

  answer += `#### 💡 Tactical Coaching Action Plan:\n`;
  if (topGap.name === "AIM" || deficits.hsDelta > 0) {
    answer += `1. **Crosshair Discipline & First-Bullet Accuracy:** Focus on head-level micro-adjustments instead of burst spraying. Run 100 Eliminations in The Range with Sheriff/Vandal prior to scrim matches.\n`;
  }
  if (topGap.name === "UTILITY") {
    answer += `2. **Utility Timing & Agent Mastery:** Maximize ${player.agent} ability value by pairing recon/flashes with teammate timings rather than solo dumping utility early in the round.\n`;
  }
  if (topGap.name === "ENTRY") {
    answer += `3. **Aggression Pacing & Trading:** Improve site entry routing. Coordinate first contact with initiator recon darts/dogs to increase entry survival and site trade efficiency.\n`;
  }
  if (topGap.name === "COMMS") {
    answer += `4. **Clutter-Free Information Sharing:** Keep callouts concise and immediate: *Location, Health, Weapon, Direction*. Avoid talking over sound cues during post-plant retakes.\n`;
  }
  if (topGap.name === "CLUTCH") {
    answer += `5. **Composure & Post-Plant Isolation:** Break 1vX clutch situations into isolated 1v1 engagements using smoke cover and off-angles rather than re-peeking wide into crossfires.\n`;
  }

  const drills = [
    `Daily Routine: 15 min Aim Lab (Microflex & Sixshot)`,
    `${player.agent} Custom Server: Drill 5 post-plant lineups on Ascent & Haven`,
    `Scrim Review: Review first-death rounds to fix over-extended positioning`,
  ];

  const focusPillars = [topGap.name, secondGap.name, player.rawStats.hsPercent < 22 ? "HEADSHOT RATIO" : "K/D STABILITY"];

  return {
    answer,
    drills,
    focusPillars,
    contextRetrieved: `Roster Database (Player: ${player.player}, Role: ${player.role}, Agent: ${player.agent})`,
  };
}
