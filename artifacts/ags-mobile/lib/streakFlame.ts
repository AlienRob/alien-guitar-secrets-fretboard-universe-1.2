export interface FlameTier {
  days: number;
  name: string;
  label: string;
  color: string;
  bgColor: string;
  /** XP multiplier at this tier (e.g. 1.5 = 50% bonus). */
  xpMultiplier: number;
  /** A freeze token is granted when this milestone is first reached. */
  grantsFreeze: boolean;
}

export const FLAME_TIERS: FlameTier[] = [
  { days:  1, name: "Bronze",   label: "BRONZE FLAME",   color: "#f97316", bgColor: "rgba(249,115,22,0.15)",   xpMultiplier: 1.0, grantsFreeze: false },
  { days:  2, name: "Silver",   label: "SILVER FLAME",   color: "#94a3b8", bgColor: "rgba(148,163,184,0.15)", xpMultiplier: 1.1, grantsFreeze: false },
  { days:  3, name: "Gold",     label: "GOLD FLAME",     color: "#fbbf24", bgColor: "rgba(251,191,36,0.15)",  xpMultiplier: 1.2, grantsFreeze: true  },
  { days:  5, name: "Emerald",  label: "EMERALD FLAME",  color: "#4ade80", bgColor: "rgba(74,222,128,0.15)", xpMultiplier: 1.3, grantsFreeze: false },
  { days:  8, name: "Purple",   label: "PURPLE FLAME",   color: "#a855f7", bgColor: "rgba(168,85,247,0.15)", xpMultiplier: 1.5, grantsFreeze: true  },
  { days: 13, name: "Cosmic",   label: "COSMIC FLAME",   color: "#38bdf8", bgColor: "rgba(56,189,248,0.15)", xpMultiplier: 1.7, grantsFreeze: false },
  { days: 21, name: "Galactic", label: "GALACTIC FLAME", color: "#e879f9", bgColor: "rgba(232,121,249,0.15)",xpMultiplier: 2.0, grantsFreeze: true  },
  { days: 34, name: "Alien",    label: "ALIEN FLAME",    color: "#00ffd5", bgColor: "rgba(0,255,213,0.15)",  xpMultiplier: 2.5, grantsFreeze: false },
];

/** Current flame tier for a given streak (null if streak < 1). */
export function getCurrentFlame(streak: number): FlameTier | null {
  if (streak < 1) return null;
  let current: FlameTier | null = null;
  for (const tier of FLAME_TIERS) {
    if (streak >= tier.days) current = tier;
  }
  return current;
}

/** Next flame tier the player hasn't reached yet (null if maxed). */
export function getNextFlame(streak: number): FlameTier | null {
  for (const tier of FLAME_TIERS) {
    if (streak < tier.days) return tier;
  }
  return null;
}

/** XP multiplier for the current streak (1.0 if no flame yet). */
export function xpMultiplierForStreak(streak: number): number {
  return getCurrentFlame(streak)?.xpMultiplier ?? 1.0;
}

/**
 * How many freeze tokens should be in the bank for a given streak.
 * One token is granted each time a grantsFreeze milestone is crossed.
 * This is used at milestone-crossing time in recordDrill — not to derive
 * the live count (that's stored in state).
 */
export function freezesEarnedForStreak(streak: number): number {
  return FLAME_TIERS.filter((t) => t.grantsFreeze && streak >= t.days).length;
}
