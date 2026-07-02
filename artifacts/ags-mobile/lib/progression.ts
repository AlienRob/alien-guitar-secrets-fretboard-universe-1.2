/**
 * Local XP / level / belt progression for the first mobile version.
 * Account sync with the shared backend (api-server) is a later phase; for now
 * progress is computed locally and persisted on the device.
 */

export interface Belt {
  key: string;
  name: string;
  minLevel: number;
  color: string;
}

// Cosmic belt ladder (mirrors the web app's belt enum).
export const BELTS: Belt[] = [
  { key: "white", name: "White", minLevel: 1, color: "#e8e8f0" },
  { key: "yellow", name: "Yellow", minLevel: 3, color: "#ffe14d" },
  { key: "orange", name: "Orange", minLevel: 5, color: "#ff9f1c" },
  { key: "green", name: "Green", minLevel: 8, color: "#2ecc71" },
  { key: "blue", name: "Blue", minLevel: 12, color: "#00bfff" },
  { key: "purple", name: "Purple", minLevel: 16, color: "#9b5cff" },
  { key: "brown", name: "Brown", minLevel: 21, color: "#b5651d" },
  { key: "black", name: "Black", minLevel: 27, color: "#5a5a72" },
  { key: "alien_master", name: "Alien Master", minLevel: 35, color: "#00ffd5" },
  { key: "galactic_master", name: "Galactic Master", minLevel: 45, color: "#ff2d55" },
];

const XP_PER_LEVEL = 250;

export function levelForXp(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

export function xpIntoLevel(xp: number): number {
  return xp % XP_PER_LEVEL;
}

export function xpForNextLevel(): number {
  return XP_PER_LEVEL;
}

export function beltForLevel(level: number): Belt {
  let current = BELTS[0];
  for (const belt of BELTS) {
    if (level >= belt.minLevel) current = belt;
  }
  return current;
}

// XP awarded for a finished 10-question drill.
export function xpForResult(correct: number, total: number): number {
  const base = correct * 12;
  const perfectBonus = correct === total && total > 0 ? 40 : 0;
  return base + perfectBonus;
}
