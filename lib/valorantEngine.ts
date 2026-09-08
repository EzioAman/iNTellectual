import { Role, WeightConfig, CoachScores, PlayerStats, NormalizedScores } from "./types";

export const DEFAULT_WEIGHTS: WeightConfig = {
  duelist: 0.40,
  initiator: 0.35,
  controller: 0.30,
  sentinel: 0.30,
  igl: 0.25,
};

export const ROLE_BENCHMARK_STATS: Record<Role, { hs: number; acs: number; kd: number }> = {
  Duelist: { hs: 26, acs: 265, kd: 1.32 },
  Controller: { hs: 22, acs: 220, kd: 1.18 },
  Initiator: { hs: 23, acs: 235, kd: 1.22 },
  Sentinel: { hs: 22, acs: 230, kd: 1.20 },
  IGL: { hs: 20, acs: 205, kd: 1.10 },
};

export const ROLE_BENCHMARK_TARGETS: Record<Role, CoachScores> = {
  Duelist: { aim: 9, utility: 6.5, comms: 7, entry: 10, clutch: 7.5 },
  Controller: { aim: 7.5, utility: 9, comms: 8.5, entry: 6, clutch: 8.5 },
  Initiator: { aim: 8, utility: 9.5, comms: 8.5, entry: 8.5, clutch: 8 },
  Sentinel: { aim: 7.5, utility: 8.5, comms: 8, entry: 5.5, clutch: 9 },
  IGL: { aim: 7, utility: 8, comms: 10, entry: 6.5, clutch: 9.5 },
};

export function clip(val: number, min: number = 0, max: number = 10): number {
  return Math.min(Math.max(val, min), max);
}

export function rateStat(stat: string, val: number, role: Role): number {
  if (isNaN(val) || val === null || val === undefined) return 5.0;

  const targets = ROLE_BENCHMARK_TARGETS[role] || ROLE_BENCHMARK_TARGETS["Duelist"];
  const stats = ROLE_BENCHMARK_STATS[role] || ROLE_BENCHMARK_STATS["Duelist"];

  switch (stat) {
    case "aim":
      return clip((val / targets.aim) * 10);
    case "utility":
      return clip((val / targets.utility) * 10);
    case "comms":
      return clip((val / targets.comms) * 10);
    case "entry":
      return clip((val / targets.entry) * 10);
    case "clutch":
      return clip((val / targets.clutch) * 10);
    case "hs":
      return clip((val / stats.hs) * 10);
    case "acs":
      return clip((val / stats.acs) * 10);
    case "kd":
      return clip((val / stats.kd) * 10);
    default:
      return 5.0;
  }
}

export function calculatePlayerScores(
  role: Role,
  coach: CoachScores,
  stats: PlayerStats,
  weights: WeightConfig = DEFAULT_WEIGHTS
): NormalizedScores {
  const normAim = rateStat("aim", coach.aim, role);
  const normUtility = rateStat("utility", coach.utility, role);
  const normComms = rateStat("comms", coach.comms, role);
  const normEntry = rateStat("entry", coach.entry, role);
  const normClutch = rateStat("clutch", coach.clutch, role);

  const normHs = rateStat("hs", stats.hsPercent, role);
  const normAcs = rateStat("acs", stats.acs, role);
  const normKd = rateStat("kd", stats.kd, role);

  const coachScore = (normAim + normUtility + normComms + normEntry + normClutch) / 5;
  const statScore = (normHs + normAcs + normKd) / 3;

  const roleKey = role.toLowerCase() as keyof WeightConfig;
  const statWeight = weights[roleKey] ?? 0.30;
  const coachWeight = 1 - statWeight;

  const overall = (coachScore * coachWeight) + (statScore * statWeight);

  return {
    aim: Number(normAim.toFixed(2)),
    utility: Number(normUtility.toFixed(2)),
    comms: Number(normComms.toFixed(2)),
    entry: Number(normEntry.toFixed(2)),
    clutch: Number(normClutch.toFixed(2)),
    hs: Number(normHs.toFixed(2)),
    acs: Number(normAcs.toFixed(2)),
    kd: Number(normKd.toFixed(2)),
    coachScore: Number(coachScore.toFixed(2)),
    statScore: Number(statScore.toFixed(2)),
    overall: Number(overall.toFixed(2)),
  };
}

export function getTier(score: number): "S" | "A" | "B" | "C" {
  if (score >= 8.8) return "S";
  if (score >= 7.8) return "A";
  if (score >= 6.8) return "B";
  return "C";
}
