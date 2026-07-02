// Boss Battle catalog.
//
// Every solar system is guarded by a boss on its 10th planet (the "Distortion
// Core"). Reaching that planet by levelling up makes the boss available; the
// NEXT solar system stays visible-but-locked until the boss is defeated. A win
// awards a trophy guitar (gated on the victory, see lib/bossBattles.ts), a huge
// XP bonus (server-side, see api-server), a belt promotion that falls out of the
// XP, and opens the wormhole to the next system.
//
// Bosses are not monsters — each is a legendary, timed AGS challenge in one
// discipline. They are tuned to be hard but never impossible: pass at 80%, with
// an encouraging "your best vs required" screen on a miss so players come back
// for another run.

import { PLANETS_PER_SYSTEM } from "@/lib/galaxyProgression";

export type BossExercise = "fretboard" | "intervals" | "scales" | "chords" | "mixed";

// The exerciseType reported to the challenge API (the OpenAPI enum has no
// "mixed", so the final gauntlet reports as chords — its hardest component).
export type BossSubmitType = "fretboard" | "intervals" | "scales" | "chords";

export interface BossBattle {
  // Solar system this boss guards (1-based).
  system: number;
  // Absolute player level of the boss planet (system * 10).
  bossLevel: number;
  // Display name, e.g. "The Guardian of Notes".
  name: string;
  // Short discipline epithet for headers, e.g. "Note Mastery".
  epithet: string;
  // One-line call to action shown on the locked next system.
  tagline: string;
  // Lore line shown on the boss intro screen.
  flavor: string;
  // Which question pool the gauntlet draws from.
  exercise: BossExercise;
  // What to report to the challenge engine for XP/quests.
  submitType: BossSubmitType;
  questionCount: number;
  timeLimitSec: number;
  // Pass threshold as a whole percent (e.g. 80).
  passPct: number;
  // Guitar awarded on the first victory.
  trophyGuitarId: string;
}

export const BOSS_PASS_PCT = 80;

// Tuned to be challenging but beatable at 80%. Names follow the product spec:
// Guardian of Notes / Interval Keeper / Scale Architect / Chord Forger, capped
// by a mixed final gauntlet.
export const BOSS_BATTLES: BossBattle[] = [
  {
    system: 1,
    bossLevel: 1 * PLANETS_PER_SYSTEM,
    name: "The Guardian of Notes",
    epithet: "Note Mastery",
    tagline: "Defeat the Guardian of Notes to open the Wormhole.",
    flavor:
      "The Guardian tests whether you truly know every note on the neck. Name them fast — the gate to the next system answers only to certainty.",
    exercise: "fretboard",
    submitType: "fretboard",
    questionCount: 20,
    timeLimitSec: 150,
    passPct: BOSS_PASS_PCT,
    trophyGuitarId: "pulsar-prime",
  },
  {
    system: 2,
    bossLevel: 2 * PLANETS_PER_SYSTEM,
    name: "The Interval Keeper",
    epithet: "Interval Mastery",
    tagline: "Defeat the Interval Keeper to open the Wormhole.",
    flavor:
      "Distances are the language of the cosmos. The Keeper will not move aside until you can measure every interval on sight.",
    exercise: "intervals",
    submitType: "intervals",
    questionCount: 20,
    timeLimitSec: 150,
    passPct: BOSS_PASS_PCT,
    trophyGuitarId: "eventide-eclipse",
  },
  {
    system: 3,
    bossLevel: 3 * PLANETS_PER_SYSTEM,
    name: "The Scale Architect",
    epithet: "Scale Mastery",
    tagline: "Defeat the Scale Architect to open the Wormhole.",
    flavor:
      "The Architect built the scales that hold the galaxy together. Spell each degree correctly or the structure stays sealed.",
    exercise: "scales",
    submitType: "scales",
    questionCount: 18,
    timeLimitSec: 150,
    passPct: BOSS_PASS_PCT,
    trophyGuitarId: "number-one-lp",
  },
  {
    system: 4,
    bossLevel: 4 * PLANETS_PER_SYSTEM,
    name: "The Chord Forger",
    epithet: "Chord Mastery",
    tagline: "Defeat the Chord Forger to open the Wormhole.",
    flavor:
      "Stack the tones true. The Forger hammers chords from raw starlight and expects you to name every part of the alloy.",
    exercise: "chords",
    submitType: "chords",
    questionCount: 18,
    timeLimitSec: 165,
    passPct: BOSS_PASS_PCT,
    trophyGuitarId: "majesty",
  },
  {
    system: 5,
    bossLevel: 5 * PLANETS_PER_SYSTEM,
    name: "The Cosmic Sovereign",
    epithet: "Total Mastery",
    tagline: "Defeat the Cosmic Sovereign to claim the Masterpiece.",
    flavor:
      "Notes, intervals, scales, chords — the Sovereign draws from all of it. Prove your mastery of the whole fretboard universe.",
    exercise: "mixed",
    submitType: "chords",
    questionCount: 25,
    timeLimitSec: 210,
    passPct: BOSS_PASS_PCT,
    trophyGuitarId: "ags-masterpiece",
  },
];

export const MAX_BOSS_SYSTEM = BOSS_BATTLES.length;

export function getBossBattle(system: number): BossBattle | undefined {
  return BOSS_BATTLES.find((b) => b.system === system);
}

// Map of trophy guitar id -> the system whose boss awards it. Used to gate those
// guitars behind a boss victory instead of a plain level.
export const TROPHY_GUITAR_SYSTEM: Record<string, number> = Object.fromEntries(
  BOSS_BATTLES.map((b) => [b.trophyGuitarId, b.system]),
);

export function isTrophyGuitar(guitarId: string): boolean {
  return guitarId in TROPHY_GUITAR_SYSTEM;
}
