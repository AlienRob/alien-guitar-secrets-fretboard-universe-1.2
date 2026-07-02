// Client-side Boss Battle progress.
//
// Like the Daily Practice routine and earned gear, boss victories are a soft,
// client-side localStorage layer that rides on top of the server's XP/level
// engine. The server still owns XP, level and belt; this module only records
// which bosses a player has defeated so the galaxy can gate the next solar
// system behind the wormhole and award trophy guitars.

import {
  BOSS_BATTLES,
  MAX_BOSS_SYSTEM,
  TROPHY_GUITAR_SYSTEM,
  getBossBattle,
  isTrophyGuitar,
} from "@/data/bossBattles";
import { isUnlocked, type Guitar } from "@/data/guitars";

const STORAGE_KEY = "ags.boss.v1";

export interface BossRecord {
  defeated: boolean;
  bestPct: number;
  attempts: number;
}

export interface BossState {
  systems: Record<number, BossRecord>;
}

function emptyRecord(): BossRecord {
  return { defeated: false, bestPct: 0, attempts: 0 };
}

export function loadBossState(): BossState {
  if (typeof window === "undefined") return { systems: {} };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { systems: {} };
    const parsed = JSON.parse(raw) as Partial<BossState>;
    if (!parsed || typeof parsed !== "object" || !parsed.systems) {
      return { systems: {} };
    }
    return { systems: parsed.systems };
  } catch {
    return { systems: {} };
  }
}

function saveBossState(state: BossState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / unavailable — boss progress is best-effort only.
  }
}

export function getBossRecord(state: BossState, system: number): BossRecord {
  return state.systems[system] ?? emptyRecord();
}

export function isBossDefeated(state: BossState, system: number): boolean {
  return getBossRecord(state, system).defeated;
}

// The boss planet becomes available once the player has LEVELLED up to (or past)
// the boss level. XP unlocks the boss; defeating it is what opens the wormhole.
export function isBossUnlocked(level: number, system: number): boolean {
  const boss = getBossBattle(system);
  if (!boss) return false;
  return level >= boss.bossLevel;
}

// The highest solar system the player may ACCESS. System 1 is always open; each
// further system opens only once the previous system's boss is defeated. This is
// the hybrid gate: levelling lets you reach the boss, but the wormhole (next
// system) stays locked until you beat it.
export function highestAccessibleSystem(state: BossState): number {
  let system = 1;
  while (system <= MAX_BOSS_SYSTEM && isBossDefeated(state, system)) {
    system++;
  }
  return system;
}

export function isSystemBossGated(state: BossState, system: number): boolean {
  // Systems guarded by a boss the player hasn't earned their way into yet.
  return system > highestAccessibleSystem(state);
}

// The boss whose victory unlocks access to `system` (i.e. the previous system's
// boss). Returns undefined for system 1 (always open).
export function gatingBossSystem(system: number): number | undefined {
  return system >= 2 ? system - 1 : undefined;
}

export interface BossAttemptOutcome {
  defeated: boolean; // did this attempt pass?
  firstWin: boolean; // first time this boss has ever been defeated
  bestPct: number; // best score so far (after this attempt)
  attempts: number; // total attempts (after this attempt)
}

// Record a boss attempt. Returns whether it was a win, and whether it was the
// FIRST win (used to fire the trophy reveal + wormhole exactly once).
export function recordBossAttempt(
  system: number,
  scorePct: number,
): BossAttemptOutcome {
  const boss = getBossBattle(system);
  const passPct = boss?.passPct ?? 80;
  const won = scorePct >= passPct;

  const state = loadBossState();
  const prev = getBossRecord(state, system);
  const firstWin = won && !prev.defeated;

  const next: BossRecord = {
    defeated: prev.defeated || won,
    bestPct: Math.max(prev.bestPct, Math.round(scorePct)),
    attempts: prev.attempts + 1,
  };
  state.systems[system] = next;
  saveBossState(state);

  return {
    defeated: won,
    firstWin,
    bestPct: next.bestPct,
    attempts: next.attempts,
  };
}

// Is a guitar a boss trophy that the player has earned by defeating its boss?
// Non-trophy guitars return false here (they unlock by level as usual).
export function isTrophyUnlocked(state: BossState, guitarId: string): boolean {
  const system = TROPHY_GUITAR_SYSTEM[guitarId];
  if (system === undefined) return false;
  return isBossDefeated(state, system);
}

// The single source of truth for "is this guitar collected?". Trophy guitars are
// gated on defeating their boss (not on level); every other guitar unlocks by
// level as usual. Use this everywhere a guitar's unlocked state is shown so the
// vault and galaxy agree.
export function isGuitarUnlocked(
  guitar: Guitar,
  level: number,
  state: BossState,
): boolean {
  if (isTrophyGuitar(guitar.id)) {
    return isTrophyUnlocked(state, guitar.id);
  }
  return isUnlocked(guitar, level);
}

// A state with every boss defeated — used for full-access testers/owners so the
// galaxy and vault behave as if all wormholes are open.
export function allBossesDefeatedState(): BossState {
  return {
    systems: Object.fromEntries(
      BOSS_BATTLES.map((b) => [
        b.system,
        { defeated: true, bestPct: 100, attempts: 0 } as BossRecord,
      ]),
    ),
  };
}
