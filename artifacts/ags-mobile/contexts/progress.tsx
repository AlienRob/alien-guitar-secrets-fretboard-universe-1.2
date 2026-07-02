import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

import type { DrillType } from "@/lib/drills";
import {
  type Belt,
  beltForLevel,
  levelForXp,
  xpForNextLevel,
  xpForResult,
  xpIntoLevel,
} from "@/lib/progression";
import {
  freezesEarnedForStreak,
  xpMultiplierForStreak,
} from "@/lib/streakFlame";

/** The three drill types that count toward the daily practice trail. */
export const DAILY_TRAIL_TYPES: DrillType[] = ["intervals", "notes", "chords"];

export interface ExerciseStat {
  attempts: number;
  totalCorrect: number;
  totalQuestions: number;
  bestScore: number;
}

interface ProgressState {
  xp: number;
  totalChallenges: number;
  streak: number;
  lastPlayed: string | null; // YYYY-MM-DD
  stats: Record<string, ExerciseStat>;
  alienCoins: number;
  dailyChallengesCount: number;
  dailyQuestDate: string | null; // YYYY-MM-DD of current daily count
  /** Freeze tokens available to cover a missed day. */
  streakFreezes: number;
  /** True if a freeze was consumed today (so we don't double-grant). */
  usedFreezeDate: string | null; // YYYY-MM-DD
  /**
   * Highest streak reached to date — used to avoid re-granting freeze
   * tokens for milestones already crossed.
   */
  peakStreak: number;
  /** Which of the 3 daily trail drill types have been completed today. */
  dailyTrailDrillsDone: string[];
  /** Date (YYYY-MM-DD) the dailyTrailDrillsDone array applies to. */
  dailyTrailDate: string | null;
}

export interface DrillOutcome {
  xpEarned: number;
  xpBase: number;
  xpMultiplier: number;
  leveledUp: boolean;
  newLevel: number;
  newBelt: Belt;
  beltChanged: boolean;
  /** True if a streak freeze was consumed this drill. */
  usedFreeze: boolean;
  /** New freeze tokens added this drill (milestone grant). */
  freezesGranted: number;
  /** This drill was a new daily trail step (first time this type today). */
  trailStepNew: boolean;
  /** All 3 daily trail steps are now done — trail bag reward is available. */
  trailJustCompleted: boolean;
  /** How many of the 3 trail steps are done today (after this drill). */
  trailStepCount: number;
  /**
   * Level-up happened but daily trail not yet done — ceremony is held back.
   * The level number still advances from XP; only the celebration is gated.
   */
  pendingLevelUp: boolean;
}

interface ProgressContextValue {
  loaded: boolean;
  xp: number;
  level: number;
  belt: Belt;
  xpIntoLevel: number;
  xpPerLevel: number;
  streak: number;
  totalChallenges: number;
  accuracy: number;
  stats: Record<string, ExerciseStat>;
  coins: number;
  dailyChallengesCount: number;
  dailyQuestDone: boolean;
  streakFreezes: number;
  xpMultiplier: number;
  /** Which of the 3 daily trail types have been done today. */
  dailyTrailDrillsDone: string[];
  /** True when all 3 daily trail types are done for today. */
  dailyTrailComplete: boolean;
  recordDrill: (type: DrillType, correct: number, total: number) => Promise<DrillOutcome>;
  addCoins: (amount: number) => Promise<void>;
  spendCoins: (amount: number) => Promise<boolean>;
  reset: () => Promise<void>;
}

const STORAGE_KEY = "ags-progress-v1";

const EMPTY: ProgressState = {
  xp: 0,
  totalChallenges: 0,
  streak: 0,
  lastPlayed: null,
  stats: {},
  alienCoins: 0,
  dailyChallengesCount: 0,
  dailyQuestDate: null,
  streakFreezes: 0,
  usedFreezeDate: null,
  peakStreak: 0,
  dailyTrailDrillsDone: [],
  dailyTrailDate: null,
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86_400_000);
}

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ProgressState>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) setState({ ...EMPTY, ...JSON.parse(raw) });
      } catch {
        // start fresh if storage is unreadable
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = async (next: ProgressState) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // non-fatal: keep in-memory state
    }
  };

  const recordDrill = async (
    type: DrillType,
    correct: number,
    total: number,
  ): Promise<DrillOutcome> => {
    const baseXp = xpForResult(correct, total);
    const today = todayKey();

    let next!: ProgressState;
    let outcome!: DrillOutcome;
    setState((prev) => {
      const prevLevel = levelForXp(prev.xp);
      const prevBelt = beltForLevel(prevLevel);

      // ── Streak calculation (with forgiving freeze) ────────────────────
      let streak: number;
      let usedFreeze = false;

      if (prev.lastPlayed === today) {
        // Same day — keep existing streak (min 1)
        streak = prev.streak || 1;
      } else if (prev.lastPlayed && dayDiff(prev.lastPlayed, today) === 1) {
        // Consecutive day — extend streak
        streak = prev.streak + 1;
      } else if (
        prev.lastPlayed &&
        dayDiff(prev.lastPlayed, today) === 2 &&
        prev.streakFreezes > 0 &&
        prev.usedFreezeDate !== today
      ) {
        // Missed exactly one day and have a freeze available — preserve streak
        streak = prev.streak + 1;
        usedFreeze = true;
      } else {
        // Streak broken
        streak = 1;
      }

      // ── XP multiplier from streak tier ───────────────────────────────
      const mult = xpMultiplierForStreak(streak);
      const earned = Math.round(baseXp * mult);

      // ── Freeze token grants from newly crossed milestones ─────────────
      const prevPeak = prev.peakStreak ?? 0;
      const freezesNow = freezesEarnedForStreak(streak);
      const freezesPrev = freezesEarnedForStreak(prevPeak);
      const newFreezeGrants = Math.max(0, freezesNow - freezesPrev);

      const streakFreezesAfterUse = usedFreeze
        ? (prev.streakFreezes - 1) + newFreezeGrants
        : prev.streakFreezes + newFreezeGrants;

      // ── Stat update ───────────────────────────────────────────────────
      const prevStat = prev.stats[type] ?? {
        attempts: 0,
        totalCorrect: 0,
        totalQuestions: 0,
        bestScore: 0,
      };
      const nextStat: ExerciseStat = {
        attempts: prevStat.attempts + 1,
        totalCorrect: prevStat.totalCorrect + correct,
        totalQuestions: prevStat.totalQuestions + total,
        bestScore: Math.max(prevStat.bestScore, correct),
      };

      const dailyCount = prev.dailyQuestDate === today
        ? (prev.dailyChallengesCount ?? 0) + 1
        : 1;

      // ── Daily trail tracking ──────────────────────────────────────────
      const prevTrailDone: string[] =
        prev.dailyTrailDate === today ? (prev.dailyTrailDrillsDone ?? []) : [];
      const isTrailType = (DAILY_TRAIL_TYPES as string[]).includes(type);
      const isNewTrailStep = isTrailType && !prevTrailDone.includes(type);
      const newTrailDone = isNewTrailStep
        ? [...prevTrailDone, type]
        : prevTrailDone;
      const trailWasComplete = prevTrailDone.length >= DAILY_TRAIL_TYPES.length;
      const trailNowComplete = newTrailDone.length >= DAILY_TRAIL_TYPES.length;
      const trailJustCompleted = !trailWasComplete && trailNowComplete;

      next = {
        xp: prev.xp + earned,
        totalChallenges: prev.totalChallenges + 1,
        streak,
        lastPlayed: today,
        stats: { ...prev.stats, [type]: nextStat },
        alienCoins: prev.alienCoins,
        dailyChallengesCount: dailyCount,
        dailyQuestDate: today,
        streakFreezes: Math.max(0, streakFreezesAfterUse),
        usedFreezeDate: usedFreeze ? today : (prev.usedFreezeDate ?? null),
        peakStreak: Math.max(prevPeak, streak),
        dailyTrailDrillsDone: newTrailDone,
        dailyTrailDate: today,
      };

      const newLevel = levelForXp(next.xp);
      const newBelt = beltForLevel(newLevel);
      const didLevelUp = newLevel > prevLevel;
      // Gate the level-up ceremony until the daily trail is done.
      // The level number still advances (XP bar fills); only the celebration waits.
      const pendingLevelUp = didLevelUp && !trailNowComplete;
      outcome = {
        xpEarned: earned,
        xpBase: baseXp,
        xpMultiplier: mult,
        leveledUp: didLevelUp && trailNowComplete,
        newLevel,
        newBelt,
        beltChanged: newBelt.key !== prevBelt.key,
        usedFreeze,
        freezesGranted: newFreezeGrants,
        trailStepNew: isNewTrailStep,
        trailJustCompleted,
        trailStepCount: newTrailDone.length,
        pendingLevelUp,
      };
      return next;
    });

    await persist(next);
    return outcome;
  };

  const addCoins = async (amount: number): Promise<void> => {
    let next!: ProgressState;
    setState((prev) => {
      next = { ...prev, alienCoins: prev.alienCoins + amount };
      return next;
    });
    await persist(next);
  };

  const spendCoins = async (amount: number): Promise<boolean> => {
    let success = false;
    let next!: ProgressState;
    setState((prev) => {
      if (prev.alienCoins < amount) {
        next = prev;
        return prev;
      }
      success = true;
      next = { ...prev, alienCoins: prev.alienCoins - amount };
      return next;
    });
    if (success) await persist(next);
    return success;
  };

  const reset = async () => {
    setState(EMPTY);
    await persist(EMPTY);
  };

  const level = levelForXp(state.xp);
  const totalQ = Object.values(state.stats).reduce((s, v) => s + v.totalQuestions, 0);
  const totalC = Object.values(state.stats).reduce((s, v) => s + v.totalCorrect, 0);
  const accuracy = totalQ === 0 ? 0 : Math.round((totalC / totalQ) * 100);

  const todayStr = todayKey();

  const dailyChallengesCount = state.dailyQuestDate === todayStr
    ? (state.dailyChallengesCount ?? 0)
    : 0;

  const dailyTrailDrillsDone: string[] =
    state.dailyTrailDate === todayStr ? (state.dailyTrailDrillsDone ?? []) : [];
  const dailyTrailComplete = dailyTrailDrillsDone.length >= DAILY_TRAIL_TYPES.length;

  const value: ProgressContextValue = {
    loaded,
    xp: state.xp,
    level,
    belt: beltForLevel(level),
    xpIntoLevel: xpIntoLevel(state.xp),
    xpPerLevel: xpForNextLevel(),
    streak: state.streak,
    totalChallenges: state.totalChallenges,
    accuracy,
    stats: state.stats,
    coins: state.alienCoins,
    dailyChallengesCount,
    dailyQuestDone: dailyChallengesCount >= 3,
    streakFreezes: state.streakFreezes ?? 0,
    xpMultiplier: xpMultiplierForStreak(state.streak),
    dailyTrailDrillsDone,
    dailyTrailComplete,
    recordDrill,
    addCoins,
    spendCoins,
    reset,
  };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
