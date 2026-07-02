/**
 * Beginner trail — the three-step path that guides new players through the
 * core loop in each Solar System:
 *
 *   System 1: Finding Notes lesson → Daily Practice → boss (Guardian of Notes)
 *   System 2: Intervals lesson     → Daily Practice → boss (Interval Keeper)
 *
 * Steps 2 and 3 are tracked by the dailyPractice and bossBattles libs;
 * step 1 needs its own per-system flag here.
 */

// ── System 1 ─────────────────────────────────────────────────────────────────

const LESSON_VIEWED_KEY = "ags-trail-lesson-notes";
const PRACTICE_STARTED_KEY = "ags-trail-practice-started";

/** Called from the Finding Notes lesson page once it mounts. */
export function markFindingNotesViewed(): void {
  try {
    localStorage.setItem(LESSON_VIEWED_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

/** Returns true if the player has ever opened the Finding Notes lesson. */
export function hasFindingNotesViewed(): boolean {
  try {
    return localStorage.getItem(LESSON_VIEWED_KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Called the first time a player starts a Daily Practice round.
 * Stored durably — independent of the day-scoped round state — so the trail
 * does not regress when a new day begins and loadRound() returns null.
 */
export function markPracticeStarted(): void {
  try {
    localStorage.setItem(PRACTICE_STARTED_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

/**
 * Returns true if the player has ever started a Daily Practice round.
 * Unlike loadRound(), this never resets after midnight.
 */
export function hasPracticeStarted(): boolean {
  try {
    return localStorage.getItem(PRACTICE_STARTED_KEY) === "1";
  } catch {
    return false;
  }
}

// ── System 2 ─────────────────────────────────────────────────────────────────

const INTERVALS_LESSON_VIEWED_KEY = "ags-trail-lesson-intervals";

/** Called from the Intervals lesson page once it mounts. */
export function markIntervalsViewed(): void {
  try {
    localStorage.setItem(INTERVALS_LESSON_VIEWED_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

/** Returns true if the player has ever opened the Intervals lesson. */
export function hasIntervalsViewed(): boolean {
  try {
    return localStorage.getItem(INTERVALS_LESSON_VIEWED_KEY) === "1";
  } catch {
    return false;
  }
}

// ── System 3 ─────────────────────────────────────────────────────────────────

const SCALES_LESSON_VIEWED_KEY = "ags-trail-lesson-scales";

/** Called from the Scales lesson page once it mounts. */
export function markScaleLessonViewed(): void {
  try {
    localStorage.setItem(SCALES_LESSON_VIEWED_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

/** Returns true if the player has ever opened the Scales lesson. */
export function hasScaleLessonViewed(): boolean {
  try {
    return localStorage.getItem(SCALES_LESSON_VIEWED_KEY) === "1";
  } catch {
    return false;
  }
}

// ── System 4 ─────────────────────────────────────────────────────────────────

const CHORD_LESSON_VIEWED_KEY = "ags-trail-lesson-chords";

/** Called from the Chord Construction lesson page once it mounts. */
export function markChordLessonViewed(): void {
  try {
    localStorage.setItem(CHORD_LESSON_VIEWED_KEY, "1");
  } catch {
    // ignore storage errors
  }
}

/** Returns true if the player has ever opened the Chord Construction lesson. */
export function hasChordLessonViewed(): boolean {
  try {
    return localStorage.getItem(CHORD_LESSON_VIEWED_KEY) === "1";
  } catch {
    return false;
  }
}

// ── Shared types ─────────────────────────────────────────────────────────────

export interface TrailStepDef {
  step: 1 | 2 | 3;
  label: string;
  blurb: string;
  cta: string;
  href: string;
}

export interface TrailState {
  /** Step 1: The system's key lesson has been opened. */
  lessonViewed: boolean;
  /** Step 2: At least one Daily Practice round has been started. */
  practiceStarted: boolean;
  /** Step 3: This system's boss has been beaten. */
  bossDefeated: boolean;
}

/**
 * Current active step index.
 * 0 = nothing done yet
 * 1 = lesson viewed, practice not started
 * 2 = practice started, boss not beaten
 * 3 = all done
 */
export function trailStep(s: TrailState): 0 | 1 | 2 | 3 {
  if (s.bossDefeated) return 3;
  if (s.practiceStarted) return 2;
  if (s.lessonViewed) return 1;
  return 0;
}

// ── Per-system trail definitions ─────────────────────────────────────────────

export interface SystemTrailDef {
  system: number;
  /** Absolute player level of the system's boss planet. */
  bossLevel: number;
  steps: readonly TrailStepDef[];
}

export const SYSTEM_TRAIL_DEFS: readonly SystemTrailDef[] = [
  {
    system: 1,
    bossLevel: 10,
    steps: [
      {
        step: 1,
        label: "Step 1 of 3 — Learn the Fretboard",
        blurb: "Start with the Finding Notes lesson. Rob's five octave formulas let you find any note, anywhere on the neck.",
        cta: "Open the lesson",
        href: "/learn/finding-notes",
      },
      {
        step: 2,
        label: "Step 2 of 3 — Daily Practice",
        blurb: "Time to drill what you learned. The 21-minute Daily Practice session is how you earn XP and level up.",
        cta: "Go to Daily Practice",
        href: "/practice",
      },
      {
        step: 3,
        label: "Step 3 of 3 — Challenge the Boss",
        blurb: "You have reached the boss planet. Enter the boss battle and prove what you've learned.",
        cta: "Enter Boss Battle",
        href: "/boss/1",
      },
    ] as const,
  },
  {
    system: 2,
    bossLevel: 20,
    steps: [
      {
        step: 1,
        label: "Step 1 of 3 — Learn Intervals",
        blurb: "Open the Intervals lesson. Understanding the distances between notes is the key to hearing music, not just playing it.",
        cta: "Open the lesson",
        href: "/learn/intervals",
      },
      {
        step: 2,
        label: "Step 2 of 3 — Keep Drilling",
        blurb: "Ear training and interval drills sharpen your hearing. Keep up your Daily Practice sessions to reach the boss level.",
        cta: "Go to Daily Practice",
        href: "/practice",
      },
      {
        step: 3,
        label: "Step 3 of 3 — Challenge the Boss",
        blurb: "You have reached the boss planet. Enter the boss battle and prove your mastery of intervals.",
        cta: "Enter Boss Battle",
        href: "/boss/2",
      },
    ] as const,
  },
  {
    system: 3,
    bossLevel: 30,
    steps: [
      {
        step: 1,
        label: "Step 1 of 3 — Learn Scales",
        blurb: "Open the Scales lesson. Scales are the building blocks of melody and the backbone of every solo.",
        cta: "Open the lesson",
        href: "/learn/scales",
      },
      {
        step: 2,
        label: "Step 2 of 3 — Keep Drilling",
        blurb: "Scale drills lock the patterns into muscle memory. Keep up your Daily Practice sessions to reach the boss level.",
        cta: "Go to Daily Practice",
        href: "/practice",
      },
      {
        step: 3,
        label: "Step 3 of 3 — Challenge the Boss",
        blurb: "You have reached the boss planet. Enter the boss battle and prove your mastery of scales.",
        cta: "Enter Boss Battle",
        href: "/boss/3",
      },
    ] as const,
  },
  {
    system: 4,
    bossLevel: 40,
    steps: [
      {
        step: 1,
        label: "Step 1 of 3 — Learn Chord Construction",
        blurb: "Open the Chord Construction lesson. Every chord is a simple interval-number formula you can build anywhere on the neck.",
        cta: "Open the lesson",
        href: "/learn/chord-construction",
      },
      {
        step: 2,
        label: "Step 2 of 3 — Keep Drilling",
        blurb: "The Chord Decoder drill trains you to hear and name chords instantly. Keep up your Daily Practice to reach the boss level.",
        cta: "Go to Daily Practice",
        href: "/practice",
      },
      {
        step: 3,
        label: "Step 3 of 3 — Challenge the Boss",
        blurb: "You have reached the boss planet. Enter the boss battle and prove your mastery of chords.",
        cta: "Enter Boss Battle",
        href: "/boss/4",
      },
    ] as const,
  },
] as const;

/** Returns the trail definition for the given system, or undefined if none. */
export function getSystemTrailDef(system: number): SystemTrailDef | undefined {
  return SYSTEM_TRAIL_DEFS.find((d) => d.system === system);
}

/**
 * The three steps of the System 1 beginner trail, kept for backward compat
 * with any existing consumers.
 * @deprecated Prefer SYSTEM_TRAIL_DEFS[0].steps or getSystemTrailDef(1).
 */
export const TRAIL_STEPS: readonly TrailStepDef[] = SYSTEM_TRAIL_DEFS[0].steps;
