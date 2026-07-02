// Daily Practice routine state.
//
// A routine is a single "session" made of THREE disciplines chosen at random by
// the game from the five scored disciplines. Each discipline must be practised
// for a minimum amount of time (a real timed block). Once all three reach their
// time goal, the level-up Challenge unlocks and the player can claim a prize.
// After that they may start a fresh round with three new random disciplines.
//
// All of this lives client-side in localStorage — there is no server state for
// the routine itself (the underlying drills still submit challenges/earn XP via
// the normal API).

import {
  pickRewardPool,
  strapRewardPool,
  pedalRewardPool,
  ampRewardPool,
  type GearItem,
  type GearCategory,
} from "@/data/gear";
import { loadEarnedGear, addEarnedGear } from "@/lib/playerCustomization";

export interface Discipline {
  id: string;
  label: string;
  desc: string;
  href: string;
}

// The five SCORED disciplines that can appear in a routine. The Fretboard
// Explorer is intentionally excluded — it earns no score, so it can't be a
// graded discipline (it stays available as a reference tool only).
export const DISCIPLINES: Discipline[] = [
  { id: "notes", label: "Note Finding", desc: "Tap the correct note on the fretboard", href: "/practice/fretboard" },
  { id: "intervals", label: "Intervals", desc: "Identify the distance between two notes", href: "/practice/intervals" },
  { id: "scales", label: "Scale Recognition", desc: "Recognise scale patterns by ear and shape", href: "/practice/scales" },
  { id: "chords", label: "Chord Decoder", desc: "Identify chord structures and voicings", href: "/practice/chords" },
  { id: "ear", label: "Ear Training", desc: "Hear an interval and name it", href: "/practice/ear-training" },
];

export const DISCIPLINES_PER_ROUND = 3;
// Minimum practice time per discipline, in seconds (7 minutes).
export const DISCIPLINE_GOAL_SECONDS = 7 * 60;
// Total minimum practice to unlock the challenge (21 minutes).
export const ROUND_GOAL_SECONDS = DISCIPLINES_PER_ROUND * DISCIPLINE_GOAL_SECONDS;

const STORAGE_KEY = "ags.dailyPractice.v1";

export type PickTier = "ok" | "great";

export interface RoundState {
  // Local calendar day this round belongs to (YYYY-MM-DD).
  date: string;
  // The three discipline ids chosen at random for this round.
  disciplines: string[];
  // Seconds practised per discipline id.
  seconds: Record<string, number>;
  // Whether the player has acknowledged/started the unlocked challenge.
  challengeStarted: boolean;
  // How many full rounds have been completed today (challenge reached).
  roundsCompletedToday: number;
  // Best pick tier already awarded per discipline this round, so a discipline
  // grants at most one pick per tier (a later "great" drill can still upgrade an
  // earlier "ok" award). Older saved rounds may not have this field.
  picksAwarded?: Record<string, PickTier>;
}

export function disciplineById(id: string): Discipline | undefined {
  return DISCIPLINES.find((d) => d.id === id);
}

export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadRound(): RoundState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoundState;
    // A round only applies to the day it was created on.
    if (parsed.date !== todayKey()) {
      // Preserve today's completed-round count across the reset would require a
      // separate key; for simplicity a brand-new day starts fresh at zero.
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function saveRound(state: RoundState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — routine simply won't persist
  }
}

// Pick `n` distinct disciplines at random.
function pickRandomDisciplines(n: number): string[] {
  const pool = DISCIPLINES.map((d) => d.id);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}

// Start a brand-new round of three random disciplines. Carries forward today's
// completed-round count when starting another round on the same day.
export function startRound(): RoundState {
  const prev = loadRound();
  const disciplines = pickRandomDisciplines(DISCIPLINES_PER_ROUND);
  const seconds: Record<string, number> = {};
  for (const id of disciplines) seconds[id] = 0;
  const state: RoundState = {
    date: todayKey(),
    disciplines,
    seconds,
    challengeStarted: false,
    roundsCompletedToday: prev?.roundsCompletedToday ?? 0,
    picksAwarded: {},
  };
  saveRound(state);
  return state;
}

// Add practised seconds to a discipline within the active round. No-op if there
// is no active round or the discipline isn't part of it. Returns the updated
// round (or null).
export function addSeconds(disciplineId: string, secs: number): RoundState | null {
  // Always track trail progress for the three core disciplines.
  _addTrailSeconds(disciplineId, secs);

  const state = loadRound();
  if (!state) return null;
  if (!state.disciplines.includes(disciplineId)) return state;
  const current = state.seconds[disciplineId] ?? 0;
  state.seconds[disciplineId] = Math.min(DISCIPLINE_GOAL_SECONDS, current + secs);
  saveRound(state);
  return state;
}

export function disciplineSeconds(state: RoundState, id: string): number {
  return Math.min(DISCIPLINE_GOAL_SECONDS, state.seconds[id] ?? 0);
}

export function isDisciplineComplete(state: RoundState, id: string): boolean {
  return disciplineSeconds(state, id) >= DISCIPLINE_GOAL_SECONDS;
}

export function totalSeconds(state: RoundState): number {
  return state.disciplines.reduce((sum, id) => sum + disciplineSeconds(state, id), 0);
}

// The routine is complete (challenge unlocked) once every discipline has met
// its time goal.
export function isRoutineComplete(state: RoundState): boolean {
  return state.disciplines.every((id) => isDisciplineComplete(state, id));
}

// Mark that the player has started/claimed the unlocked challenge. Increments
// the completed-round counter so a fresh round can begin.
export function markChallengeStarted(): RoundState | null {
  const state = loadRound();
  if (!state) return null;
  // Guard at the state level: the challenge can only be started once every
  // discipline has actually met its time goal, regardless of UI state.
  if (!isRoutineComplete(state)) return state;
  if (!state.challengeStarted) {
    state.challengeStarted = true;
    state.roundsCompletedToday += 1;
    saveRound(state);
  }
  return state;
}

export function formatClock(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── Daily Trail ─────────────────────────────────────────────────────────────
// The Daily Trail is a fixed set of three core disciplines the player must
// touch every day, regardless of which disciplines the random round happens to
// include. Trail time accrues through the same addSeconds call; any practice
// in an intervals/notes/chords session counts toward the trail automatically.

/** The three fixed trail disciplines, always in this order. */
export const TRAIL_DISCIPLINES = ["intervals", "notes", "chords"] as const;
export type TrailDisciplineId = typeof TRAIL_DISCIPLINES[number];

/** Minimum seconds per trail discipline to complete it (3 minutes). */
export const TRAIL_GOAL_SECONDS = 3 * 60;

export interface TrailState {
  /** Local calendar day (YYYY-MM-DD). */
  date:    string;
  seconds: Partial<Record<TrailDisciplineId, number>>;
}

const TRAIL_STORAGE_KEY = "ags.dailyPractice.trail.v1";

function loadTrailRaw(): TrailState | null {
  try {
    const raw = localStorage.getItem(TRAIL_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TrailState;
    if (parsed.date !== todayKey()) return null;
    return parsed;
  } catch { return null; }
}

function saveTrail(t: TrailState): void {
  try { localStorage.setItem(TRAIL_STORAGE_KEY, JSON.stringify(t)); } catch { /* ignore */ }
}

export function loadTrail(): TrailState {
  return loadTrailRaw() ?? { date: todayKey(), seconds: {} };
}

function isTrailId(id: string): id is TrailDisciplineId {
  return (TRAIL_DISCIPLINES as readonly string[]).includes(id);
}

/** Internal: add trail seconds for a discipline (called from addSeconds). */
function _addTrailSeconds(disciplineId: string, secs: number): void {
  if (!isTrailId(disciplineId)) return;
  const trail = loadTrail();
  const cur = trail.seconds[disciplineId] ?? 0;
  trail.seconds[disciplineId] = Math.min(TRAIL_GOAL_SECONDS, cur + secs);
  saveTrail(trail);
}

export function trailDisciplineSeconds(trail: TrailState, id: TrailDisciplineId): number {
  return Math.min(TRAIL_GOAL_SECONDS, trail.seconds[id] ?? 0);
}

export function isTrailDisciplineComplete(trail: TrailState, id: TrailDisciplineId): boolean {
  return trailDisciplineSeconds(trail, id) >= TRAIL_GOAL_SECONDS;
}

export function isTrailComplete(trail: TrailState): boolean {
  return TRAIL_DISCIPLINES.every((id) => isTrailDisciplineComplete(trail, id));
}

// A drill scoring at or above this accuracy (%) counts as a "great" score and
// earns a flashy holographic-style pick; below it earns an everyday pick.
export const GREAT_SCORE_THRESHOLD = 80;

export function tierForAccuracy(accuracyPct: number): PickTier {
  return accuracyPct >= GREAT_SCORE_THRESHOLD ? "great" : "ok";
}

// The reward categories handed out by Daily Practice, in rotation order. Picks,
// straps and pedals are earned purely by practising; amps only appear once the
// player's level has unlocked one (see ampRewardPool). Rotating means every
// gear type features as a reward instead of only picks.
const REWARD_CATEGORIES: GearCategory[] = ["pick", "strap", "pedal", "amp"];

// Where in the rotation the next reward should start. Persisted globally (not
// per-round) so the spread of gear types carries across rounds and days.
const ROTATION_KEY = "ags.dailyPractice.rewardRotation.v1";

function loadRewardRotation(): number {
  try {
    const raw = localStorage.getItem(ROTATION_KEY);
    const n = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

function saveRewardRotation(n: number): void {
  try {
    localStorage.setItem(ROTATION_KEY, String(n));
  } catch {
    // storage unavailable — rotation simply won't persist
  }
}

// The next uncollected reward in a category, or null if there's nothing new to
// earn there yet (e.g. no amp is unlocked at the player's level).
function nextRewardInCategory(
  category: GearCategory,
  tier: PickTier,
  level: number,
  earned: Set<string>,
): GearItem | null {
  switch (category) {
    case "pick":
      return pickRewardPool(tier).find((g) => !earned.has(g.id)) ?? null;
    case "strap":
      return strapRewardPool().find((g) => !earned.has(g.id)) ?? null;
    case "pedal":
      return pedalRewardPool().find((g) => !earned.has(g.id)) ?? null;
    case "amp":
      return ampRewardPool(level).find((g) => !earned.has(g.id)) ?? null;
    default:
      return null;
  }
}

// Award a piece of gear for a completed Daily Practice drill, graded by
// accuracy. Rotates through picks, straps, pedals and amps so every gear type
// features as a reward. Only awards while the drill's discipline is part of the
// active round, and at most once per tier per discipline per round (a later
// "great" drill can still upgrade an earlier "ok" award). `level` is the
// player's current level, used to gate amp rewards. Returns the newly earned
// item, or null if nothing new was granted (no active round, this tier already
// awarded for the discipline, or nothing left to collect in any category).
export function awardDrillReward(
  disciplineId: string,
  accuracyPct: number,
  level: number,
): GearItem | null {
  const state = loadRound();
  if (!state) return null;
  if (!state.disciplines.includes(disciplineId)) return null;

  const tier = tierForAccuracy(accuracyPct);
  const awarded = state.picksAwarded ?? {};
  const prev = awarded[disciplineId];
  if (prev === "great" || prev === tier) return null;

  const earned = loadEarnedGear();
  const start = loadRewardRotation();

  // Walk the rotation from the current position, skipping any category with
  // nothing new to give, and award the first item we find.
  let next: GearItem | null = null;
  let grantedIndex = start;
  for (let i = 0; i < REWARD_CATEGORIES.length; i++) {
    const idx = (start + i) % REWARD_CATEGORIES.length;
    const candidate = nextRewardInCategory(REWARD_CATEGORIES[idx], tier, level, earned);
    if (candidate) {
      next = candidate;
      grantedIndex = idx;
      break;
    }
  }

  // Record the tier even when nothing is left to collect, so we don't re-check
  // it every drill.
  awarded[disciplineId] = tier;
  state.picksAwarded = awarded;
  saveRound(state);

  if (!next) return null;
  addEarnedGear(next.id);
  // Advance the rotation past the category we just granted so the next reward
  // favours a different gear type.
  saveRewardRotation(grantedIndex + 1);
  return next;
}
