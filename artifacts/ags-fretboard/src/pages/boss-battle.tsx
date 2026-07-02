import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute, useLocation, Link } from "wouter";
import { Clock, Lock, Skull, Swords, Trophy, ChevronLeft, Zap, Coins, Heart } from "lucide-react";
import type { ChallengeResult } from "@workspace/api-client-react";
import { useSubmitChallenge, useGetProfileSummary } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { getBossBattle, MAX_BOSS_SYSTEM } from "@/data/bossBattles";
import { getBossCharacter, getBossCharacterImages } from "@/data/bossCharacters";
import {
  loadBossState,
  allBossesDefeatedState,
  isSystemBossGated,
  gatingBossSystem,
  getBossRecord,
  recordBossAttempt,
  type BossAttemptOutcome,
} from "@/lib/bossBattles";
import { makeBossQuestions, type BossQuestion } from "@/lib/bossQuestions";
import { GUITARS, RARITY_META } from "@/data/guitars";
import GuitarThumb from "@/components/guitar-thumb";
import { loadHandedness, addAlienCoins } from "@/lib/playerCustomization";
import { COINS_BOSS_WIN } from "@/lib/webCoins";
import BossWormhole from "@/components/galaxy/boss-wormhole";
import { useFullAccess } from "@/lib/access";
import { playChallengeCompleteTrill } from "@/lib/audio";

// Maps an exercise category to the lesson/drill links shown on the fail screen.
const CATEGORY_META: Record<string, { label: string; lessonTitle: string; lessonHref: string }> = {
  fretboard: { label: "Note Identification", lessonTitle: "Finding the Notes", lessonHref: "/learn/finding-notes" },
  intervals: { label: "Intervals", lessonTitle: "Intervals Lesson", lessonHref: "/learn/intervals" },
  scales: { label: "Scale Spelling", lessonTitle: "Scale Recognition", lessonHref: "/practice/scales" },
  chords: { label: "Chord Tones", lessonTitle: "Chord Decoder", lessonHref: "/learn/chord-construction" },
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type Phase = "intro" | "battle" | "result";

export default function BossBattle() {
  const [, params] = useRoute("/boss/:system");
  const [, navigate] = useLocation();
  const system = Number(params?.system ?? 0);
  const boss = getBossBattle(system);

  const { data: summary } = useGetProfileSummary();
  const fullAccess = useFullAccess();
  const submit = useSubmitChallenge();

  const [phase, setPhase] = useState<Phase>("intro");
  const [questions, setQuestions] = useState<BossQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(boss?.timeLimitSec ?? 0);
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [outcome, setOutcome] = useState<BossAttemptOutcome | null>(null);

  // Per-category miss tracking for fail-screen feedback.
  const missedByCategoryRef = useRef<Record<string, number>>({});
  // Guard: credits coins exactly once per boss victory.
  const coinsAwardedRef = useRef(false);

  // Refs used so the countdown timeout and the per-question lock read fresh
  // values without re-subscribing effects.
  const correctRef = useRef(0);
  const startRef = useRef(0);
  const lockRef = useRef(false);
  const finishedRef = useRef(false);
  const fbTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishRef = useRef<() => void>(() => {});

  useEffect(() => () => { if (fbTimer.current) clearTimeout(fbTimer.current); }, []);

  if (!boss) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <h1 className="text-2xl font-bold text-white">No boss here</h1>
        <p className="mt-2 text-muted-foreground">This solar system has no boss battle.</p>
        <Link href="/galaxy" className="mt-6 inline-block text-accent underline">
          Back to the galaxy
        </Link>
      </div>
    );
  }

  const isPremium = summary?.isPremium ?? false;
  const level = summary?.level ?? 1;

  // Boss-chain + premium gate.
  const bossState = useMemo(
    () => (fullAccess ? allBossesDefeatedState() : loadBossState()),
    [fullAccess],
  );
  const systemAccessible =
    fullAccess || (!isSystemBossGated(bossState, system) && (system === 1 || isPremium));
  const reached = systemAccessible && (fullAccess || level >= boss.bossLevel);
  const record = getBossRecord(bossState, system);

  const guardSystem = gatingBossSystem(system);
  const guardBoss = guardSystem !== undefined ? getBossBattle(guardSystem) : undefined;

  // Boss character portrait data.
  const character = getBossCharacter(system);
  const images = character ? getBossCharacterImages(character.id) : null;

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (fbTimer.current) clearTimeout(fbTimer.current);

    const total = questions.length;
    const c = correctRef.current;
    const scorePct = total > 0 ? Math.round((c / total) * 100) : 0;
    const oc = recordBossAttempt(system, scorePct);
    setOutcome(oc);

    // Award coins on a first-time or repeat victory — once per finish() call.
    if (oc.defeated && !coinsAwardedRef.current) {
      coinsAwardedRef.current = true;
      addAlienCoins(COINS_BOSS_WIN);
    }

    const durationSeconds = Math.max(1, Math.round((Date.now() - startRef.current) / 1000));
    submit.mutate(
      {
        data: {
          exerciseType: boss.submitType,
          totalQuestions: total,
          correctAnswers: c,
          durationSeconds,
          boss: oc.defeated,
        },
      },
      { onSuccess: (res) => setResult(res) },
    );
    setPhase("result");
    if (oc.defeated) void playChallengeCompleteTrill();
  };
  finishRef.current = finish;

  // Countdown during the battle.
  useEffect(() => {
    if (phase !== "battle") return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          finishRef.current();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const start = () => {
    setQuestions(makeBossQuestions(boss.exercise, boss.questionCount));
    correctRef.current = 0;
    missedByCategoryRef.current = {};
    coinsAwardedRef.current = false;
    setCorrect(0);
    setCurrentIndex(0);
    setTimeLeft(boss.timeLimitSec);
    setPicked(null);
    setFeedback(null);
    setResult(null);
    setOutcome(null);
    finishedRef.current = false;
    lockRef.current = false;
    startRef.current = Date.now();
    setPhase("battle");
  };

  const answer = (choice: string) => {
    if (lockRef.current || phase !== "battle") return;
    lockRef.current = true;

    const q = questions[currentIndex];
    const isCorrect = choice === q.answer;
    if (isCorrect) {
      correctRef.current += 1;
      setCorrect(correctRef.current);
    } else {
      // Track misses by category for targeted fail feedback.
      const cat = q.category ?? "fretboard";
      missedByCategoryRef.current[cat] = (missedByCategoryRef.current[cat] ?? 0) + 1;
    }
    setPicked(choice);
    setFeedback(isCorrect ? "correct" : "incorrect");

    fbTimer.current = setTimeout(() => {
      setFeedback(null);
      setPicked(null);
      lockRef.current = false;
      if (currentIndex >= questions.length - 1) {
        finish();
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 450);
  };

  const trophy = GUITARS.find((g) => g.id === boss.trophyGuitarId);
  const handed = loadHandedness();

  // ---- Sealed: the solar system itself isn't open yet ----
  if (!systemAccessible) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Lock className="mx-auto h-10 w-10 text-[#FFD700]" />
        <h1 className="mt-4 text-2xl font-bold text-white">The wormhole to {boss.name} is sealed</h1>
        <p className="mt-2 text-muted-foreground">
          {guardBoss
            ? `Defeat ${guardBoss.name} to open the wormhole into Solar System ${system}.`
            : `Solar System ${system} isn't open to you yet.`}
          {!isPremium && system > 1 && " Solar systems beyond the first are Premium."}
        </p>
        <Link href="/galaxy" className="mt-6 inline-block text-accent underline">
          Back to the galaxy
        </Link>
      </div>
    );
  }

  // ---- Locked: player hasn't levelled up to the boss planet yet ----
  if (!reached) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <Skull className="mx-auto h-10 w-10 text-[#FFD700]" />
        <h1 className="mt-4 text-2xl font-bold text-white">{boss.name} is out of reach</h1>
        <p className="mt-2 text-muted-foreground">
          Reach level {boss.bossLevel} to stand before the {boss.epithet} boss. You are level {level}.
        </p>
        <Link href="/galaxy" className="mt-6 inline-block text-accent underline">
          Back to the galaxy
        </Link>
      </div>
    );
  }

  // ---- Intro ----
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl space-y-6 py-6">
        <Link href="/galaxy" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-white">
          <ChevronLeft className="h-4 w-4" /> Galaxy
        </Link>

        {/* Hero card with boss portrait */}
        <div
          className="relative overflow-hidden rounded-xl border bg-[#05060f] text-center"
          style={{ borderColor: character ? `${character.accentColor}50` : "rgba(255,215,0,0.3)" }}
        >
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: character
                ? `radial-gradient(ellipse 80% 55% at 50% 100%, ${character.accentColor}22, transparent 65%)`
                : "radial-gradient(ellipse 80% 55% at 50% 100%, rgba(255,215,0,0.08), transparent 65%)",
            }}
          />

          <div className="relative z-10 px-8 pt-8 pb-2">
            <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-[0.3em] text-[#FFD700]">
              <Skull className="h-4 w-4" /> Boss Battle · System {system}
            </div>
            <h1 className="mt-3 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              {boss.name}
            </h1>
            <p className="mt-1 text-sm uppercase tracking-widest text-accent">{boss.epithet}</p>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{boss.flavor}</p>

            {record.defeated && (
              <div className="mx-auto mt-5 inline-flex items-center gap-2 rounded-full border border-[#00FF66]/40 bg-[#00FF66]/10 px-4 py-1.5 text-sm text-[#00FF66]">
                <Trophy className="h-4 w-4" /> Already defeated · best {record.bestPct}%
              </div>
            )}
          </div>

          {/* Boss portrait */}
          {images && (
            <div className="relative z-10 mx-auto w-full max-w-[240px]">
              <img
                src={images.full}
                alt={character?.name ?? boss.name}
                className="h-60 w-full object-contain object-bottom"
              />
              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
                style={{ background: "linear-gradient(to bottom, transparent, #05060f)" }}
              />
            </div>
          )}
        </div>

        {/* Battle stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-white/10 bg-card/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Questions</div>
            <div className="mt-1 text-2xl font-bold text-white">{boss.questionCount}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-card/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Time limit</div>
            <div className="mt-1 text-2xl font-bold text-white">{formatTime(boss.timeLimitSec)}</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-card/40 p-4">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">To pass</div>
            <div className="mt-1 text-2xl font-bold text-[#FFD700]">{boss.passPct}%</div>
          </div>
        </div>

        {/* Player stats + victory reward */}
        {summary && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-card/40 p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Your stats</div>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="text-2xl font-bold font-mono text-white">{summary.level}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Belt</div>
                  <div className="text-sm font-semibold capitalize text-[#00BFFF]">{summary.belt.replace("_", " ")}</div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-3 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/5 p-4">
              <Coins className="h-7 w-7 shrink-0 text-[#FFD700]" />
              <div>
                <div className="text-xs uppercase tracking-wider text-[#FFD700]/70">Victory reward</div>
                <div className="text-2xl font-bold text-[#FFD700]">+{COINS_BOSS_WIN}</div>
                <div className="text-xs text-[#FFD700]/70">Alien Coins</div>
              </div>
            </div>
          </div>
        )}

        {trophy && (
          <div
            className="flex items-center gap-4 rounded-lg border p-4"
            style={{ borderColor: `${RARITY_META[trophy.rarity].color}50` }}
          >
            <div className="h-16 w-16 shrink-0">
              <GuitarThumb guitar={trophy} handed={handed} className="h-16 w-auto" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-accent">Trophy for victory</div>
              <div className="text-lg font-bold text-white">{trophy.name}</div>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: RARITY_META[trophy.rarity].color }}>
                {RARITY_META[trophy.rarity].label}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-center">
          <Button onClick={start} className="h-12 gap-2 bg-primary px-8 text-base text-primary-foreground hover:bg-primary/80 alien-border">
            <Swords className="h-5 w-5" /> {record.defeated ? "Fight again" : "Begin the Trial"}
          </Button>
        </div>
      </div>
    );
  }

  // ---- Battle ----
  if (phase === "battle") {
    const q = questions[currentIndex];
    const progress = Math.round((currentIndex / questions.length) * 100);
    const lowTime = timeLeft <= 15;
    // Boss HP depletes as player gets correct answers (cosmetic only).
    const bossHp = Math.max(0, Math.round(100 - (correctRef.current / questions.length) * 100));

    return (
      <div
        className="relative mx-auto max-w-xl space-y-5 py-4"
        style={{
          background: "radial-gradient(ellipse 100% 80% at 50% 0%, rgba(80,0,160,0.18), transparent 70%)",
        }}
      >
        {/* Semi-transparent boss portrait in corner */}
        {images && (
          <div
            className="pointer-events-none absolute -right-4 top-0 h-56 w-40 opacity-[0.09] select-none"
            aria-hidden
          >
            <img src={images.bust} alt="" className="h-full w-full object-contain object-top" />
          </div>
        )}

        {/* Header: boss name + timer + score */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#FFD700]">
            <Skull className="h-4 w-4" /> {boss.name}
          </div>
          <div className="flex items-center gap-5">
            <div className={`flex items-center gap-1.5 ${lowTime ? "text-[#FF3B30]" : "text-white"}`}>
              <Clock className="h-4 w-4" />
              <span className="text-2xl font-bold font-mono tabular-nums">{formatTime(timeLeft)}</span>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono text-white">
                {currentIndex + 1}
                <span className="text-base text-muted-foreground">/{questions.length}</span>
              </div>
              <div className="text-xs text-muted-foreground">{correct} correct</div>
            </div>
          </div>
        </div>

        {/* Player progress bar */}
        <div className="h-1 overflow-hidden rounded-full bg-white/8">
          <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        {/* Boss HP bar — cosmetic, depletes with each correct answer */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Heart className="h-3 w-3 text-[#FF3B30]" /> Boss HP
            </span>
            <span className="font-mono text-[#FF3B30]">{bossHp}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${bossHp}%`,
                background: bossHp > 50
                  ? "linear-gradient(to right, #dc2626, #ef4444)"
                  : bossHp > 25
                    ? "linear-gradient(to right, #b45309, #f59e0b)"
                    : "linear-gradient(to right, #166534, #22c55e)",
              }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-primary/20 bg-[#05060f]/80 p-8 text-center">
          <h2 className="text-2xl font-bold text-white">{q.prompt}</h2>
          {q.detail && <p className="mt-2 text-lg text-[#00BFFF]">{q.detail}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {q.options.map((opt) => {
            const isPicked = picked === opt;
            const showRight = feedback && opt === q.answer;
            const showWrong = feedback === "incorrect" && isPicked && opt !== q.answer;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => answer(opt)}
                disabled={!!feedback}
                className={`rounded-lg border px-4 py-4 text-lg font-semibold transition-all ${
                  showRight
                    ? "border-[#00FF66] bg-[#00FF66]/15 text-[#00FF66]"
                    : showWrong
                      ? "border-[#FF3B30] bg-[#FF3B30]/15 text-[#FF3B30]"
                      : "border-white/10 bg-card/30 text-white hover:border-primary/60 hover:bg-primary/10"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ---- Result ----
  const scorePct = Math.round((correctRef.current / Math.max(questions.length, 1)) * 100);
  const won = outcome?.defeated ?? false;
  const nextSystem = system + 1;
  const hasNext = nextSystem <= MAX_BOSS_SYSTEM;

  if (won) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 py-8 text-center animate-in fade-in zoom-in duration-500">
        <BossWormhole size={200} />

        {/* DEFEATED stamp */}
        <div>
          <div className="relative inline-block">
            {images && (
              <img
                src={images.bust}
                alt={character?.name ?? boss.name}
                className="mx-auto mb-2 h-24 w-24 rounded-full object-cover object-top opacity-60"
                style={{
                  filter: "grayscale(0.6) brightness(0.7)",
                  outline: `3px solid ${character?.accentColor ?? "#FFD700"}`,
                  outlineOffset: "3px",
                }}
              />
            )}
          </div>
          <h1 className="mt-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00FFD5] via-secondary to-primary">
            {boss.name} DEFEATED
          </h1>
          <p className="mt-2 text-lg text-[#00FFD5]">
            {hasNext
              ? `The wormhole opens — Solar System ${nextSystem} is unlocked.`
              : "You have conquered the entire Fretboard Universe."}
          </p>
        </div>

        {/* Stats row */}
        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          <div className="rounded-lg border border-primary/30 bg-card/50 p-5 alien-glow">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Accuracy</div>
            <div className="text-4xl font-bold text-secondary">{scorePct}%</div>
          </div>
          <div className="rounded-lg border border-primary/30 bg-card/50 p-5 alien-glow">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">XP Earned</div>
            <div className="text-4xl font-bold text-primary">{result ? `+${result.xpEarned}` : "…"}</div>
          </div>
        </div>

        {/* Prominent coin bonus */}
        <div className="flex w-full max-w-md items-center justify-center gap-4 rounded-xl border border-[#FFD700]/40 bg-[#FFD700]/8 p-5"
          style={{ boxShadow: "0 0 30px rgba(255,215,0,0.15)" }}>
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-[#FFD700]/60 bg-[#FFD700]/15">
            <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="Alien Coins" className="h-9 w-9 object-contain" />
          </div>
          <div className="text-left">
            <div className="text-xs uppercase tracking-widest text-[#FFD700]/70">Alien Coins Earned</div>
            <div className="text-4xl font-bold text-[#FFD700]">+{COINS_BOSS_WIN}</div>
          </div>
        </div>

        {result?.leveledUp && (
          <div className="w-full max-w-md rounded-lg border border-primary bg-primary/20 p-4 alien-glow-cyan">
            <h3 className="text-xl font-bold text-accent">LEVEL UP!</h3>
            <p>You are now Level {result.newLevel}</p>
          </div>
        )}
        {result?.newBelt && (
          <div className="w-full max-w-md rounded-lg border border-secondary bg-secondary/20 p-4 alien-glow">
            <h3 className="text-xl font-bold text-secondary">NEW BELT</h3>
            <p className="capitalize">{result.newBelt.replace("_", " ")}</p>
          </div>
        )}

        {trophy && (
          <div
            className="flex w-full max-w-md items-center gap-4 rounded-lg border p-5"
            style={{
              borderColor: RARITY_META[trophy.rarity].color,
              boxShadow: `inset 0 0 26px ${RARITY_META[trophy.rarity].glow}`,
            }}
          >
            <div className="h-20 w-20 shrink-0" style={{ filter: `drop-shadow(0 0 10px ${RARITY_META[trophy.rarity].glow})` }}>
              <GuitarThumb guitar={trophy} handed={handed} className="h-full w-auto" />
            </div>
            <div className="text-left">
              <div className="text-xs font-mono uppercase tracking-widest text-accent">
                {outcome?.firstWin ? "Trophy claimed" : "Trophy"} · in your Vault
              </div>
              <div className="text-xl font-bold text-white">{trophy.name}</div>
              <div className="text-xs font-mono uppercase tracking-widest" style={{ color: RARITY_META[trophy.rarity].color }}>
                {RARITY_META[trophy.rarity].label}
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-4">
          <Button onClick={() => navigate("/galaxy")} className="bg-primary text-primary-foreground hover:bg-primary/80 alien-border">
            Return to the galaxy
          </Button>
          <Button onClick={start} variant="outline">
            Fight again
          </Button>
        </div>
      </div>
    );
  }

  // ---- Fail ----
  // Find the category with the most misses for targeted feedback.
  const missedEntries = Object.entries(missedByCategoryRef.current).sort(([, a], [, b]) => b - a);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center space-y-6 py-8 text-center animate-in fade-in duration-500">
      {images && (
        <img
          src={images.bust}
          alt={character?.name ?? boss.name}
          className="h-24 w-24 rounded-full object-cover object-top opacity-80"
          style={{ outline: `2px solid ${character?.accentColor ?? "#FFD700"}`, outlineOffset: "3px" }}
        />
      )}
      {!images && <Skull className="h-12 w-12 text-[#FFD700]" />}

      <div>
        <h1 className="text-3xl font-bold text-white">The {boss.name} holds the gate</h1>
        <p className="mt-2 text-muted-foreground">
          So close. Sharpen up and run it back — this boss is beatable.
        </p>
      </div>

      <div className="w-full max-w-md space-y-3 rounded-lg border border-white/10 bg-card/40 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">This run</span>
          <span className="font-mono text-lg font-bold text-white">{scorePct}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Your best</span>
          <span className="font-mono text-lg font-bold text-[#00BFFF]">{outcome?.bestPct ?? 0}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Required to pass</span>
          <span className="font-mono text-lg font-bold text-[#FFD700]">{boss.passPct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-secondary transition-all"
            style={{ width: `${Math.min(100, Math.round(((outcome?.bestPct ?? 0) / boss.passPct) * 100))}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          You got {correctRef.current} of {questions.length} ({questions.length - correctRef.current} to claw back).
        </p>
      </div>

      {/* Targeted lesson feedback — shows every category the player missed */}
      {missedEntries.length > 0 ? (
        <div className="w-full max-w-md space-y-2 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/5 p-5 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
            <Zap className="h-3.5 w-3.5" /> Areas to focus on
          </div>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            You dropped marks in these areas. Revisit each lesson, then run the boss again.
          </p>
          <div className="space-y-2">
            {missedEntries.map(([cat, count]) => {
              const meta = CATEGORY_META[cat];
              if (!meta) return null;
              return (
                <Link
                  key={cat}
                  href={meta.lessonHref}
                  className="flex items-center justify-between rounded-md border border-[#FFD700]/30 bg-[#FFD700]/8 px-4 py-3 text-sm font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/20"
                >
                  <span className="flex items-center gap-2">
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    {meta.label}
                  </span>
                  <span className="text-xs font-normal text-[#FFD700]/60">
                    {count} missed · Study {meta.lessonTitle}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md rounded-lg border border-accent/20 bg-accent/5 p-5 text-left">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            <Zap className="h-3.5 w-3.5" /> Keep training
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Revisit your training modules to sharpen the theory, then come back and beat this boss.
          </p>
          <Link href="/galaxy" className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline">
            Back to the galaxy map
          </Link>
        </div>
      )}

      <div className="flex gap-4">
        <Button onClick={start} className="bg-primary text-primary-foreground hover:bg-primary/80 alien-border">
          Try again
        </Button>
        <Link
          href="/galaxy"
          className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          Back to the galaxy
        </Link>
      </div>
    </div>
  );
}
