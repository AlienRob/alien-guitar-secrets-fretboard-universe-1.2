/**
 * Beginner trail — mobile (AsyncStorage) persistence helpers and step data.
 *
 * System 1: View any lesson → complete a drill → beat the System 1 boss (Nena Craus)
 * System 2: View the Intervals lesson → keep drilling → beat the System 2 boss
 *
 * Per-system TRAIL_STEPS are the single source of truth for step metadata on mobile.
 * Both the "Your Path" strip (practice.tsx) and the nav badge (_layout.tsx)
 * import from here — do not duplicate the step definitions elsewhere.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

/** The id and minimum level needed to unlock the System 1 boss. */
export const SYSTEM1_BOSS_ID = "nena";
export const SYSTEM1_BOSS_UNLOCK_LEVEL = 3;

/** The id and minimum level needed to unlock the System 2 boss (Hansy Mittons). */
export const SYSTEM2_BOSS_ID = "hansy";
export const SYSTEM2_BOSS_UNLOCK_LEVEL = 3;

export interface TrailStep {
  label: string;
  icon: string;
  /** expo-router href to navigate to when this step is active. */
  href: string;
}

export interface SystemTrailSteps {
  system: number;
  steps: readonly TrailStep[];
  /** Label for the "Your Path" card subtitle. */
  subtitle: string;
}

export const SYSTEM_TRAIL_STEPS: readonly SystemTrailSteps[] = [
  {
    system: 1,
    subtitle: "Follow these three steps to complete your first mission.",
    steps: [
      { label: "Lesson", icon: "book-open", href: "/lesson/finding-notes" },
      { label: "Drill",  icon: "crosshair", href: "/drill/intervals" },
      { label: "Boss",   icon: "zap",       href: "/galaxy" },
    ],
  },
  {
    system: 2,
    subtitle: "Keep the momentum going — three steps to clear System 2.",
    steps: [
      { label: "Lesson",   icon: "zap",       href: "/lesson/intervals" },
      { label: "Practice", icon: "crosshair", href: "/drill/intervals" },
      { label: "Boss",     icon: "swords",    href: "/galaxy" },
    ],
  },
] as const;

/** Returns the trail steps for a given system, or System 1 as the fallback. */
export function getSystemTrailSteps(system: number): SystemTrailSteps {
  return SYSTEM_TRAIL_STEPS.find((s) => s.system === system) ?? SYSTEM_TRAIL_STEPS[0];
}

/** System 1 steps kept for backward compat with existing nav badge consumers. */
export const TRAIL_STEPS = SYSTEM_TRAIL_STEPS[0].steps;

// ── System 1 lesson viewed ────────────────────────────────────────────────────

const LESSON_VIEWED_KEY = "ags-trail-lesson-v1";

/** Call this from any lesson screen once it mounts (System 1 trail). */
export async function markLessonViewed(): Promise<void> {
  try {
    await AsyncStorage.setItem(LESSON_VIEWED_KEY, "1");
  } catch {
    // non-fatal
  }
}

/** Returns true if the player has ever opened a lesson screen (System 1). */
export async function hasViewedLesson(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(LESSON_VIEWED_KEY)) === "1";
  } catch {
    return false;
  }
}

// ── System 2 lesson viewed ────────────────────────────────────────────────────

const INTERVALS_LESSON_VIEWED_KEY = "ags-trail-lesson-intervals-v1";

/** Call this from the Intervals lesson screen once it mounts (System 2 trail). */
export async function markIntervalsViewed(): Promise<void> {
  try {
    await AsyncStorage.setItem(INTERVALS_LESSON_VIEWED_KEY, "1");
  } catch {
    // non-fatal
  }
}

/** Returns true if the player has ever opened the Intervals lesson (System 2). */
export async function hasViewedIntervalsLesson(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(INTERVALS_LESSON_VIEWED_KEY)) === "1";
  } catch {
    return false;
  }
}
