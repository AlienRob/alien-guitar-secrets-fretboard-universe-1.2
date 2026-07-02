import { useEffect, useMemo, useRef, useState } from "react";
import {
  useGetProfileSummary,
  useGetDailyQuests,
  useGetRecentActivity,
  useUpdateTrail,
} from "@workspace/api-client-react";
import { Link } from "wouter";
import { ChevronLeft, ChevronRight, Lock, Sparkles, Zap } from "lucide-react";
import SolarSystem from "@/components/galaxy/solar-system";
import MissionPanel from "@/components/galaxy/mission-panel";
import BossSpotlight from "@/components/galaxy/boss-spotlight";
import WormholeGate from "@/components/galaxy/wormhole-gate";
import PremiumGate from "@/components/premium-gate";
import LaunchSequence from "@/components/galaxy/launch-sequence";
import UnlockAnimation from "@/components/unlock-animation";
import { GUITARS, type Guitar } from "@/data/guitars";
import {
  buildSolarSystem,
  levelToSystem,
  levelToPlanet,
  maxUnlockedSystem,
  planetLevel,
  PLANETS_PER_SYSTEM,
} from "@/lib/galaxyProgression";
import { effectiveUnlockLevel } from "@/lib/access";
import { getBossBattle, MAX_BOSS_SYSTEM } from "@/data/bossBattles";
import { getBossCharacter } from "@/data/bossCharacters";
import {
  loadBossState,
  allBossesDefeatedState,
  highestAccessibleSystem,
  isBossDefeated,
  isGuitarUnlocked,
  gatingBossSystem,
} from "@/lib/bossBattles";
import {
  loadCinematicMode,
  saveCinematicMode,
  loadLastSeenLevel,
  saveLastSeenLevel,
  prefersReducedMotion,
} from "@/lib/cinematicMode";
import {
  hasFindingNotesViewed,
  hasPracticeStarted,
  hasIntervalsViewed,
  hasScaleLessonViewed,
  hasChordLessonViewed,
  getSystemTrailDef,
  type TrailState,
  type SystemTrailDef,
} from "@/lib/beginnerTrail";

interface PendingFocus {
  system: number;
  planet: number;
  guitars: Guitar[];
}

export default function Galaxy() {
  const { data: summary } = useGetProfileSummary();
  const { data: quests, isLoading: isLoadingQuests } = useGetDailyQuests();
  const { data: recent, isLoading: isLoadingRecent } = useGetRecentActivity();

  const isPremium = summary?.isPremium ?? false;
  const fullAccess = summary?.fullAccess ?? false;
  const level = summary?.level ?? 1;
  const playerSystem = levelToSystem(level);
  const playerPlanet = levelToPlanet(level);
  // For unlock/navigation gating, full-access testers are treated as if they had
  // reached every content level; their displayed level (above) is untouched.
  const gatingLevel = effectiveUnlockLevel(level, fullAccess);

  // Boss progress is the hybrid gate. Levelling up unlocks the boss planet, but
  // the NEXT solar system stays locked until that boss is defeated. Full-access
  // testers behave as if every boss is already beaten.
  const bossState = useMemo(
    () => (fullAccess ? allBossesDefeatedState() : loadBossState()),
    [fullAccess],
  );

  // Free players can only access Solar System 1; premium unlocks each further
  // system only after defeating the previous system's boss; full-access testers
  // reach every content system.
  const topSystem = fullAccess
    ? MAX_BOSS_SYSTEM
    : isPremium
      ? Math.min(highestAccessibleSystem(bossState), MAX_BOSS_SYSTEM)
      : 1;

  const [viewedSystem, setViewedSystem] = useState(playerSystem);
  const [focusIndex, setFocusIndex] = useState(playerPlanet);
  const [cinematic, setCinematic] = useState(loadCinematicMode());
  const [launch, setLaunch] = useState({ active: false, token: 0, boss: false });
  const [unlockQueue, setUnlockQueue] = useState<Guitar[]>([]);
  const [unlockIndex, setUnlockIndex] = useState(0);

  const processedLevel = useRef<number | null>(null);
  const pendingFocus = useRef<PendingFocus | null>(null);

  // Back-fill trail flags for existing users whose server row pre-dates the
  // trail_flags column (all false). If localStorage has flags set but the server
  // shows all-false, push one PATCH to sync them so the trail card stays correct
  // even after a browser-storage reset.
  const { mutate: persistTrail } = useUpdateTrail();
  const trailBackFillDone = useRef(false);

  useEffect(() => {
    if (trailBackFillDone.current || !summary) return;
    trailBackFillDone.current = true;

    const sf = summary.trailFlags;
    const serverAllFalse =
      !sf?.findingNotesViewed &&
      !sf?.intervalsViewed &&
      !sf?.practiceStarted &&
      !sf?.scaleLessonViewed &&
      !sf?.chordLessonViewed;
    if (!serverAllFalse) return;

    const localFindingNotes = hasFindingNotesViewed();
    const localIntervals = hasIntervalsViewed();
    const localPractice = hasPracticeStarted();
    const localScaleLesson = hasScaleLessonViewed();
    const localChordLesson = hasChordLessonViewed();

    if (!localFindingNotes && !localIntervals && !localPractice && !localScaleLesson && !localChordLesson) return;

    persistTrail({
      data: {
        ...(localFindingNotes ? { findingNotesViewed: true } : {}),
        ...(localIntervals ? { intervalsViewed: true } : {}),
        ...(localPractice ? { practiceStarted: true } : {}),
        ...(localScaleLesson ? { scaleLessonViewed: true } : {}),
        ...(localChordLesson ? { chordLessonViewed: true } : {}),
      },
    });
  }, [summary, persistTrail]);

  // Cinematic launches are a premium feature.
  const shouldAnimate = () => cinematic && isPremium && !prefersReducedMotion();

  const triggerSequence = (from: number, to: number) => {
    saveLastSeenLevel(to);
    const newSystem = levelToSystem(to);
    const newPlanet = levelToPlanet(to);
    const boss = newPlanet === PLANETS_PER_SYSTEM || newSystem > levelToSystem(from);
    const guitars = GUITARS.filter((g) => g.unlockLevel > from && g.unlockLevel <= to);

    if (!shouldAnimate()) {
      setViewedSystem(newSystem);
      setFocusIndex(newPlanet);
      if (guitars.length) {
        setUnlockQueue(guitars);
        setUnlockIndex(0);
      }
      return;
    }

    pendingFocus.current = { system: newSystem, planet: newPlanet, guitars };
    setLaunch((l) => ({ active: true, token: l.token + 1, boss }));
  };

  // Detect first load and subsequent level-ups, syncing the view and playing the
  // cinematic launch exactly once per gained level.
  useEffect(() => {
    if (!summary) return;
    const lvl = summary.level;

    if (processedLevel.current === null) {
      processedLevel.current = lvl;
      setViewedSystem(levelToSystem(lvl));
      setFocusIndex(levelToPlanet(lvl));
      const lastSeen = loadLastSeenLevel();
      if (lastSeen === null) {
        saveLastSeenLevel(lvl);
        return;
      }
      if (lvl > lastSeen) triggerSequence(lastSeen, lvl);
      return;
    }

    if (lvl > processedLevel.current) {
      const from = processedLevel.current;
      processedLevel.current = lvl;
      triggerSequence(from, lvl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [summary]);

  const handleMidpoint = () => {
    const pf = pendingFocus.current;
    if (pf) {
      setViewedSystem(pf.system);
      setFocusIndex(pf.planet);
    }
  };

  const handleLaunchDone = () => {
    setLaunch((l) => ({ ...l, active: false }));
    const pf = pendingFocus.current;
    pendingFocus.current = null;
    if (pf?.guitars.length) {
      setUnlockQueue(pf.guitars);
      setUnlockIndex(0);
    }
  };

  const handleManualLaunch = () => {
    const newSystem = levelToSystem(level);
    const newPlanet = levelToPlanet(level);
    const boss = newPlanet === PLANETS_PER_SYSTEM;
    if (!shouldAnimate()) {
      setViewedSystem(newSystem);
      setFocusIndex(newPlanet);
      return;
    }
    pendingFocus.current = { system: newSystem, planet: newPlanet, guitars: [] };
    setLaunch((l) => ({ active: true, token: l.token + 1, boss }));
  };

  const toggleCinematic = () => {
    const v = !cinematic;
    setCinematic(v);
    saveCinematicMode(v);
  };

  // Players can page one system past their highest unlocked one to preview the
  // next (locked) world they're working toward. Once every boss is beaten there
  // is no further world, so we stop at the final system rather than dangling a
  // bogus locked wormhole past the end of the content.
  const previewSystem = topSystem < MAX_BOSS_SYSTEM ? topSystem + 1 : MAX_BOSS_SYSTEM;

  // If the player has out-levelled the boss gate (e.g. levelled past a boss they
  // never fought), keep the view from drifting beyond the previewable range so
  // they always land on the wormhole gate that's actually blocking them.
  useEffect(() => {
    if (viewedSystem > previewSystem) {
      setViewedSystem(previewSystem);
      setFocusIndex(1);
    }
  }, [previewSystem, viewedSystem]);

  const goToSystem = (s: number) => {
    const clamped = Math.min(previewSystem, Math.max(1, s));
    setViewedSystem(clamped);
    setFocusIndex(clamped === playerSystem ? playerPlanet : 1);
  };

  // A free player viewing any system beyond System 1 hits the paywall.
  const premiumLocked = !isPremium && !fullAccess && viewedSystem > 1;
  // A premium player viewing a system whose guarding boss they haven't beaten
  // yet hits the wormhole gate instead.
  const bossLocked = !premiumLocked && viewedSystem > topSystem;
  const view = buildSolarSystem(viewedSystem, gatingLevel);
  const isPreview = premiumLocked || bossLocked;
  const focusedPlanet = view.planets[focusIndex - 1] ?? view.planets[0];
  const reduced = !cinematic || !isPremium || prefersReducedMotion();
  const canLaunch = loadLastSeenLevel() !== null && playerPlanet === focusedPlanet.index && viewedSystem === playerSystem;

  // Boss battle entry for the focused planet. The boss planet is the 10th of each
  // system; it becomes playable once the player has levelled up to it (or for
  // full-access testers). Defeating it opens the wormhole to the next system.
  const focusedBoss = focusedPlanet.isBoss ? getBossBattle(viewedSystem) : undefined;
  const bossReached = !!focusedBoss && (fullAccess || level >= focusedBoss.bossLevel);
  const focusedBossDefeated = isBossDefeated(bossState, viewedSystem);
  const focusedBossCharacter = focusedPlanet.isBoss ? getBossCharacter(viewedSystem) : undefined;
  const showBossSpotlight = !!(focusedBossCharacter && focusedBoss);

  // The boss that guards entry to the currently-viewed (boss-locked) system, and
  // whether the player can fight it yet.
  const gatingSystem = gatingBossSystem(viewedSystem);
  const gatingBoss = gatingSystem !== undefined ? getBossBattle(gatingSystem) : undefined;
  const gatingBossReached = !!gatingBoss && (fullAccess || level >= gatingBoss.bossLevel);

  // Beginner trail — shown for System 1 and System 2 non-preview players.
  // For System 2 we gate the "practice" step on the lesson being viewed first
  // (since any player in System 2 has already done plenty of practice).
  const trailDef: SystemTrailDef | undefined =
    !isPreview ? getSystemTrailDef(viewedSystem) : undefined;

  // Trail flags: prefer the server copy (from the profile summary) so they
  // survive browser-storage resets; fall back to localStorage for guests or
  // while the summary is still loading.
  const serverFlags = summary?.trailFlags;

  const trail: TrailState | undefined = (() => {
    if (isPreview || !trailDef) return undefined;
    if (viewedSystem === 1) {
      return {
        lessonViewed: serverFlags?.findingNotesViewed ?? hasFindingNotesViewed(),
        practiceStarted: serverFlags?.practiceStarted ?? hasPracticeStarted(),
        bossDefeated: isBossDefeated(bossState, 1),
      };
    }
    if (viewedSystem === 2) {
      const lessonViewed = serverFlags?.intervalsViewed ?? hasIntervalsViewed();
      return {
        lessonViewed,
        // Gate "practiceStarted" on the lesson being viewed so the lesson card
        // is always shown before the practice/boss card for System 2 players.
        practiceStarted: lessonViewed && (serverFlags?.practiceStarted ?? hasPracticeStarted()),
        bossDefeated: isBossDefeated(bossState, 2),
      };
    }
    if (viewedSystem === 3) {
      const lessonViewed = serverFlags?.scaleLessonViewed ?? hasScaleLessonViewed();
      return {
        lessonViewed,
        practiceStarted: lessonViewed && (serverFlags?.practiceStarted ?? hasPracticeStarted()),
        bossDefeated: isBossDefeated(bossState, 3),
      };
    }
    if (viewedSystem === 4) {
      const lessonViewed = serverFlags?.chordLessonViewed ?? hasChordLessonViewed();
      return {
        lessonViewed,
        practiceStarted: lessonViewed && (serverFlags?.practiceStarted ?? hasPracticeStarted()),
        bossDefeated: isBossDefeated(bossState, 4),
      };
    }
    return undefined;
  })();

  // Show the boss-ready banner when the player has reached the boss level for
  // the viewed system but hasn't beaten its boss yet, and is viewing a non-boss
  // planet. Works for any system (not just System 1).
  const viewedSystemBoss = getBossBattle(viewedSystem);
  const bossReady =
    !isPreview &&
    !focusedPlanet.isBoss &&
    !!viewedSystemBoss &&
    (fullAccess || level >= viewedSystemBoss.bossLevel) &&
    !isBossDefeated(bossState, viewedSystem);

  // For a locked preview system, surface the guitars that unlock within its
  // level range that the player hasn't earned yet, as a motivation hook. Trophy
  // guitars stay listed until their boss is beaten (isGuitarUnlocked gates them).
  const previewRewards = isPreview
    ? GUITARS.filter(
        (g) =>
          g.unlockLevel >= planetLevel(viewedSystem, 1) &&
          g.unlockLevel <= planetLevel(viewedSystem, PLANETS_PER_SYSTEM) &&
          !isGuitarUnlocked(g, level, bossState),
      ).sort((a, b) => a.unlockLevel - b.unlockLevel)
    : [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Stage header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => goToSystem(viewedSystem - 1)}
            disabled={viewedSystem <= 1}
            className="rounded-md border border-white/10 p-1.5 text-muted-foreground transition-colors hover:text-white disabled:opacity-30"
            aria-label="Previous solar system"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="text-center">
            <div
              className={`text-xs uppercase tracking-[0.3em] ${
                isPreview ? "text-[#FFD700]" : "text-accent"
              }`}
            >
              {isPreview ? "Locked Preview" : "Galaxy Map"}
            </div>
            <div className="flex items-center justify-center gap-1.5 text-lg font-bold text-white">
              Solar System {viewedSystem}
              {isPreview && <Lock className="h-4 w-4 text-[#FFD700]" />}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goToSystem(viewedSystem + 1)}
            disabled={viewedSystem >= previewSystem}
            className="rounded-md border border-white/10 p-1.5 text-muted-foreground transition-colors hover:text-white disabled:opacity-30"
            aria-label="Next solar system"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isPremium ? (
          <button
            type="button"
            onClick={toggleCinematic}
            className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              cinematic
                ? "border-accent/50 bg-accent/10 text-accent"
                : "border-white/10 text-muted-foreground hover:text-white"
            }`}
            aria-pressed={cinematic}
          >
            {cinematic ? <Sparkles className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
            Cinematic {cinematic ? "On" : "Off"}
          </button>
        ) : (
          <Link href="/pricing">
            <button
              type="button"
              className="flex items-center gap-2 rounded-md border border-[#FFD700]/40 bg-[#FFD700]/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#FFD700] transition-colors hover:bg-[#FFD700]/10"
            >
              <Lock className="h-3.5 w-3.5" />
              Cinematic · Premium
            </button>
          </Link>
        )}
      </div>

      {/* Solar system stage */}
      <div
        className={`overflow-hidden rounded-xl border bg-[#05060f] ${
          isPreview ? "border-[#FFD700]/30" : "border-primary/20"
        }`}
      >
        <SolarSystem
          planets={view.planets}
          focusIndex={focusIndex}
          onFocus={setFocusIndex}
          instant={reduced}
          preview={isPreview}
        />
      </div>

      {/* Boss spotlight — big avatar + name + enter/locked button, shown whenever
          the focused planet is a boss (reached or not). Replaces the small boss
          header inside MissionPanel so the boss button isn't duplicated. */}
      {!isPreview && showBossSpotlight && (
        <BossSpotlight
          character={focusedBossCharacter!}
          boss={focusedBoss!}
          reached={bossReached}
          defeated={focusedBossDefeated}
          href={`/boss/${viewedSystem}`}
        />
      )}

      {/* Mission panel for the focused planet, the paywall for free players, or
          the wormhole gate for a premium player who hasn't beaten the boss yet. */}
      {premiumLocked ? (
        <PremiumGate
          title={`Solar System ${viewedSystem} is Premium`}
          description="You've reached the edge of the free galaxy. Upgrade to Premium to chart a course through every solar system and its boss battles."
          features={[
            "Every solar system and boss battle",
            "Cinematic launch sequences",
            "Display Vault and Avatar Creator",
          ]}
          rewards={previewRewards}
        />
      ) : bossLocked && gatingBoss ? (
        <WormholeGate
          boss={gatingBoss}
          reached={gatingBossReached}
          rewards={previewRewards}
        />
      ) : (
        <MissionPanel
          planet={focusedPlanet}
          summary={summary}
          quests={quests}
          recent={recent}
          isLoadingQuests={isLoadingQuests}
          isLoadingRecent={isLoadingRecent}
          canLaunch={canLaunch}
          onLaunch={handleManualLaunch}
          rewards={previewRewards}
          boss={bossReached && !showBossSpotlight ? focusedBoss : undefined}
          bossDefeated={focusedBossDefeated}
          bossHref={`/boss/${viewedSystem}`}
          trail={trail}
          trailDef={trailDef}
          bossReady={bossReady}
        />
      )}

      {/* Cinematic overlays */}
      <LaunchSequence
        active={launch.active}
        token={launch.token}
        boss={launch.boss}
        onMidpoint={handleMidpoint}
        onDone={handleLaunchDone}
      />

      {unlockQueue.length > 0 && (
        <UnlockAnimation
          guitars={unlockQueue}
          index={unlockIndex}
          onNext={() => {
            if (unlockIndex + 1 >= unlockQueue.length) {
              setUnlockQueue([]);
              setUnlockIndex(0);
            } else {
              setUnlockIndex((i) => i + 1);
            }
          }}
        />
      )}
    </div>
  );
}
