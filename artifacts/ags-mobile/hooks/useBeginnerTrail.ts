/**
 * Returns the current beginner trail state and a helper to mark a lesson
 * as viewed. Integrates with the progress and bosses contexts so the trail
 * advances automatically when the player levels up or beats the current boss.
 *
 * Supports System 1 and System 2:
 *  - System 1: Finding Notes lesson → first drill → beat Nena Craus
 *  - System 2: Intervals lesson → more drilling → beat the Interval Keeper
 */

import { useEffect, useState } from "react";

import { useBosses } from "@/contexts/bosses";
import { useProgress } from "@/contexts/progress";
import {
  hasViewedLesson,
  markLessonViewed as persistLessonViewed,
  hasViewedIntervalsLesson,
  markIntervalsViewed as persistIntervalsViewed,
  getSystemTrailSteps,
  type SystemTrailSteps,
  SYSTEM1_BOSS_ID,
  SYSTEM1_BOSS_UNLOCK_LEVEL,
  SYSTEM2_BOSS_ID,
  SYSTEM2_BOSS_UNLOCK_LEVEL,
} from "@/lib/beginnerTrail";

export interface BeginnerTrailState {
  loaded: boolean;
  lessonViewed: boolean;
  drillDone: boolean;
  bossBeaten: boolean;
  /**
   * 0 = nothing done, 1 = lesson done, 2 = drill done, 3 = all done.
   * Note: step stays at 2 once a drill is done even before boss unlock level;
   * use bossReady to know when to emphasise the boss fight.
   */
  step: 0 | 1 | 2 | 3;
  /**
   * True when the player's level has reached the current system's boss unlock
   * threshold and the boss has not yet been beaten.
   */
  bossReady: boolean;
  /** Which system the trail is currently tracking (1 or 2). */
  currentSystem: number;
  /** Step metadata for the current system. */
  trailSteps: SystemTrailSteps;
  markLessonViewed: () => Promise<void>;
  markIntervalsViewed: () => Promise<void>;
}

export function useBeginnerTrail(): BeginnerTrailState {
  const { totalChallenges, level } = useProgress();
  const { isBeaten } = useBosses();
  const [lessonViewed, setLessonViewed] = useState(false);
  const [intervalsViewed, setIntervalsViewed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([hasViewedLesson(), hasViewedIntervalsLesson()]).then(
      ([lesson, intervals]) => {
        setLessonViewed(lesson);
        setIntervalsViewed(intervals);
        setLoaded(true);
      },
    );
  }, []);

  const sys1Beaten = isBeaten(SYSTEM1_BOSS_ID);
  const sys2Beaten = isBeaten(SYSTEM2_BOSS_ID);

  // Which system's trail to show: move to System 2 once System 1 is fully done.
  const currentSystem = sys1Beaten ? 2 : 1;

  const drillDone = totalChallenges > 0;

  let step: 0 | 1 | 2 | 3 = 0;
  let bossReady = false;

  if (currentSystem === 1) {
    const bossBeaten1 = sys1Beaten;
    if (bossBeaten1) step = 3;
    else if (drillDone) step = 2;
    else if (lessonViewed) step = 1;
    bossReady = level >= SYSTEM1_BOSS_UNLOCK_LEVEL && !bossBeaten1;
  } else {
    // System 2: lesson step is specific to intervals lesson
    const bossBeaten2 = sys2Beaten;
    if (bossBeaten2) step = 3;
    // Gate "drill" step on the intervals lesson being viewed
    else if (intervalsViewed && drillDone) step = 2;
    else if (intervalsViewed) step = 1;
    bossReady = level >= SYSTEM2_BOSS_UNLOCK_LEVEL && !bossBeaten2;
  }

  const trailSteps = getSystemTrailSteps(currentSystem);

  // Expose the boss-beaten state for the current system
  const bossBeaten = currentSystem === 1 ? sys1Beaten : sys2Beaten;

  const markLessonViewedFn = async () => {
    await persistLessonViewed();
    setLessonViewed(true);
  };

  const markIntervalsViewedFn = async () => {
    await persistIntervalsViewed();
    setIntervalsViewed(true);
  };

  return {
    loaded,
    lessonViewed: currentSystem === 1 ? lessonViewed : intervalsViewed,
    drillDone,
    bossBeaten,
    step,
    bossReady,
    currentSystem,
    trailSteps,
    markLessonViewed: markLessonViewedFn,
    markIntervalsViewed: markIntervalsViewedFn,
  };
}
