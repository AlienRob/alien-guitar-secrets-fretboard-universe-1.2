import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Target,
  Zap,
  Music,
  ListMusic,
  Headphones,
  BookOpen,
  Lock,
  Check,
  Rocket,
  Shuffle,
  Clock,
  Sparkles,
  Swords,
  type LucideIcon,
} from "lucide-react";
import { markPracticeStarted } from "@/lib/beginnerTrail";
import { useUpdateTrail } from "@workspace/api-client-react";
import {
  loadRound,
  startRound,
  markChallengeStarted,
  disciplineById,
  disciplineSeconds,
  isDisciplineComplete,
  isRoutineComplete,
  totalSeconds,
  formatClock,
  DISCIPLINE_GOAL_SECONDS,
  ROUND_GOAL_SECONDS,
  DISCIPLINES_PER_ROUND,
  type RoundState,
  loadTrail,
  isTrailComplete,
  trailDisciplineSeconds,
  isTrailDisciplineComplete,
  TRAIL_DISCIPLINES,
  TRAIL_GOAL_SECONDS,
  type TrailState,
} from "@/lib/dailyPractice";

const DISCIPLINE_ICONS: Record<string, LucideIcon> = {
  notes: Target,
  intervals: Zap,
  scales: Music,
  chords: ListMusic,
  ear: Headphones,
};

export default function DailyPractice() {
  const { mutate: persistTrail } = useUpdateTrail();
  const [round, setRound] = useState<RoundState | null>(() => loadRound());
  const [trail, setTrail] = useState<TrailState>(() => loadTrail());

  // Re-read the round and trail whenever the player returns to this page
  // (time accrues on the individual practice pages).
  useEffect(() => {
    const refresh = () => { setRound(loadRound()); setTrail(loadTrail()); };
    refresh();
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const handleStart = () => {
    markPracticeStarted();
    persistTrail({ data: { practiceStarted: true } });
    setRound(startRound());
  };
  const handleNewRound = () => {
    markPracticeStarted();
    persistTrail({ data: { practiceStarted: true } });
    setRound(startRound());
  };
  const handleStartChallenge = () => {
    const updated = markChallengeStarted();
    if (updated) setRound(updated);
  };

  const trailDone = isTrailComplete(trail);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Daily Practice</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The game picks {DISCIPLINES_PER_ROUND} disciplines at random. Practise each for{" "}
          {DISCIPLINE_GOAL_SECONDS / 60} minutes ({ROUND_GOAL_SECONDS / 60} minutes in total) to
          unlock today's level-up Challenge. Score well in a discipline to earn a cosmic pick — a
          great score earns a shiny holographic one. Straps and pedals keep stacking up as you
          practise, while guitars unlock slowly as you level up.
        </p>
      </div>

      {/* Daily Trail — always shown, fixed 3-discipline warm-up */}
      <DailyTrail trail={trail} />

      {!round ? (
        <StartCard onStart={handleStart} />
      ) : (
        <ActiveRound
          round={round}
          trailComplete={trailDone}
          onStartChallenge={handleStartChallenge}
          onNewRound={handleNewRound}
        />
      )}

      {/* Reference tool + Games — always available */}
      <div className="space-y-2">
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Extra tools
        </h3>
        <Link href="/fretboard">
          <div className="group flex cursor-pointer items-start gap-3 rounded-lg border border-white/8 bg-card/30 p-4 transition-all hover:border-secondary/50 hover:bg-secondary/5">
            <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
            <div>
              <div className="text-sm font-semibold text-white">Scale &amp; Chord Finder</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                See scales and chords mapped across the neck. A study aid — earns no score.
              </div>
            </div>
          </div>
        </Link>
        <Link href="/practice/fretboard-games">
          <div className="group flex cursor-pointer items-start gap-3 rounded-lg border border-white/8 bg-card/30 p-4 transition-all hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5">
            <Swords className="mt-0.5 h-5 w-5 shrink-0 text-[#FFD700]" />
            <div>
              <div className="text-sm font-semibold text-white">Fretboard Games</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Shape Spotter, Galactic Note Hunt, Alien Invasion — speed drills on the neck.
              </div>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

// ── Daily Trail ────────────────────────────────────────────────────────────
const TRAIL_LABELS: Record<string, string> = {
  intervals: "Intervals",
  notes:     "Note Finding",
  chords:    "Chord Spelling",
};

function DailyTrail({ trail }: { trail: TrailState }) {
  const allDone = isTrailComplete(trail);
  return (
    <div className={`rounded-lg border p-4 ${allDone ? "border-[#00FF66]/40 bg-[#00FF66]/5" : "border-primary/20 bg-card/30"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Zap className={`h-4 w-4 ${allDone ? "text-[#00FF66]" : "text-primary"}`} />
          <span className="text-sm font-semibold text-white">Daily Trail</span>
        </div>
        {allDone ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-[#00FF66]">
            <Check className="h-3.5 w-3.5" strokeWidth={3} /> Complete
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">3 min each</span>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {TRAIL_DISCIPLINES.map((id) => {
          const secs = trailDisciplineSeconds(trail, id);
          const done = isTrailDisciplineComplete(trail, id);
          const pct  = Math.min(100, Math.round((secs / TRAIL_GOAL_SECONDS) * 100));
          const Icon = DISCIPLINE_ICONS[id] ?? Target;
          return (
            <div key={id} className={`rounded-md border p-2.5 ${done ? "border-[#00FF66]/30 bg-[#00FF66]/5" : "border-white/8 bg-white/3"}`}>
              <div className="flex items-center justify-between mb-1.5">
                <Icon className={`h-3.5 w-3.5 ${done ? "text-[#00FF66]" : "text-muted-foreground"}`} />
                {done && <Check className="h-3 w-3 text-[#00FF66]" strokeWidth={3} />}
              </div>
              <div className="text-xs font-medium text-white leading-tight mb-1.5">
                {TRAIL_LABELS[id] ?? id}
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${done ? "bg-[#00FF66]" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground font-mono">{formatClock(secs)}</div>
            </div>
          );
        })}
      </div>
      {!allDone && (
        <p className="mt-2.5 text-xs text-muted-foreground">
          Practice intervals, note finding, and chord spelling every day to keep the trail alive — this unlocks the level-up Challenge.
        </p>
      )}
    </div>
  );
}

function StartCard({ onStart }: { onStart: () => void }) {
  return (
    <div className="rounded-lg border border-primary/30 bg-card/40 p-6 text-center alien-glow">
      <Shuffle className="mx-auto h-10 w-10 text-primary" />
      <h2 className="mt-3 text-xl font-bold text-white">Ready for today's routine?</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        We'll choose {DISCIPLINES_PER_ROUND} disciplines at random and time your practice. Clear all
        three to unlock the Challenge.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mt-5 inline-flex items-center gap-2 rounded-md border border-accent/50 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
      >
        <Rocket className="h-4 w-4" /> Start today's routine
      </button>
    </div>
  );
}

function ActiveRound({
  round,
  trailComplete,
  onStartChallenge,
  onNewRound,
}: {
  round: RoundState;
  trailComplete: boolean;
  onStartChallenge: () => void;
  onNewRound: () => void;
}) {
  const total = totalSeconds(round);
  const totalPct = Math.min(100, Math.round((total / ROUND_GOAL_SECONDS) * 100));
  const cleared = round.disciplines.filter((id) => isDisciplineComplete(round, id)).length;
  const routineComplete = isRoutineComplete(round);

  return (
    <div className="space-y-5">
      {/* Overall progress */}
      <div className="rounded-lg border border-primary/30 bg-card/40 p-5 alien-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              This round
            </div>
            <div className="mt-0.5 text-lg font-bold text-white">
              {cleared} of {round.disciplines.length} disciplines cleared
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold text-white">
              {formatClock(total)}
            </div>
            <div className="text-xs text-muted-foreground">
              of {formatClock(ROUND_GOAL_SECONDS)} practised
            </div>
          </div>
        </div>
        <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-white/6">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${totalPct}%` }}
          />
        </div>
        {round.roundsCompletedToday > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#FFD700]">
            <Sparkles className="h-3.5 w-3.5" /> {round.roundsCompletedToday} round
            {round.roundsCompletedToday === 1 ? "" : "s"} completed today
          </div>
        )}
      </div>

      {/* Discipline cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {round.disciplines.map((id) => {
          const meta = disciplineById(id);
          const Icon = DISCIPLINE_ICONS[id] ?? Target;
          const secs = disciplineSeconds(round, id);
          const done = isDisciplineComplete(round, id);
          const pct = Math.min(100, Math.round((secs / DISCIPLINE_GOAL_SECONDS) * 100));
          return (
            <div
              key={id}
              className={`flex flex-col rounded-lg border p-4 ${
                done
                  ? "border-[#00FF66]/40 bg-[#00FF66]/5"
                  : "border-white/8 bg-card/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <Icon
                  className={`h-5 w-5 shrink-0 ${done ? "text-[#00FF66]" : "text-primary"}`}
                />
                {done && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-[#00FF66]">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} /> Done
                  </span>
                )}
              </div>
              <div className="mt-2 text-sm font-semibold text-white">{meta?.label ?? id}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{meta?.desc}</div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3 w-3" /> {formatClock(secs)}
                </span>
                <span className="font-mono text-muted-foreground">
                  / {formatClock(DISCIPLINE_GOAL_SECONDS)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    done ? "bg-[#00FF66]" : "bg-primary"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-3">
                {meta && (
                  <Link href={meta.href}>
                    <span
                      className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
                        done
                          ? "border border-white/10 text-muted-foreground hover:bg-white/5"
                          : "border border-primary/50 bg-primary/10 text-accent hover:bg-primary/20"
                      }`}
                    >
                      {done ? "Practise more" : secs > 0 ? "Continue" : "Practise"}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Challenge */}
      <ChallengePanel
        routineComplete={routineComplete}
        trailComplete={trailComplete}
        challengeStarted={round.challengeStarted}
        remaining={Math.max(0, ROUND_GOAL_SECONDS - total)}
        onStartChallenge={onStartChallenge}
        onNewRound={onNewRound}
      />
    </div>
  );
}

function ChallengePanel({
  routineComplete,
  trailComplete,
  challengeStarted,
  remaining,
  onStartChallenge,
  onNewRound,
}: {
  routineComplete: boolean;
  trailComplete: boolean;
  challengeStarted: boolean;
  remaining: number;
  onStartChallenge: () => void;
  onNewRound: () => void;
}) {
  if (!routineComplete) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/5 p-4">
        <Lock className="h-5 w-5 shrink-0 text-[#FFD700]" />
        <div>
          <div className="text-sm font-semibold text-[#FFD700]">Challenge locked</div>
          <div className="text-xs text-muted-foreground">
            {formatClock(remaining)} of practice left to unlock today's level-up Challenge and your
            prize.
          </div>
        </div>
      </div>
    );
  }

  if (!trailComplete) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
        <Lock className="h-5 w-5 shrink-0 text-primary" />
        <div>
          <div className="text-sm font-semibold text-white">Daily Trail incomplete</div>
          <div className="text-xs text-muted-foreground">
            Finish 3 minutes each of Intervals, Note Finding, and Chord Spelling above to unlock the
            Challenge.
          </div>
        </div>
      </div>
    );
  }

  if (!challengeStarted) {
    return (
      <div className="rounded-lg border border-accent/40 bg-accent/5 p-5 text-center alien-glow-cyan">
        <Rocket className="mx-auto h-9 w-9 text-accent" />
        <h3 className="mt-2 text-lg font-bold text-white">Challenge unlocked!</h3>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          You've put in your {ROUND_GOAL_SECONDS / 60} minutes. Take on the level-up Challenge in the
          Galaxy Map to earn XP toward your next level — guitars and amps unlock as you climb.
        </p>
        <Link href="/galaxy">
          <span
            onClick={onStartChallenge}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-accent/60 bg-accent/15 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/25"
          >
            <Rocket className="h-4 w-4" /> Start the Challenge
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[#00FF66]/40 bg-[#00FF66]/5 p-5 text-center">
      <Check className="mx-auto h-9 w-9 text-[#00FF66]" strokeWidth={2.5} />
      <h3 className="mt-2 text-lg font-bold text-white">Challenge claimed</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Nice work. Want to keep going? Start another round and we'll pick three fresh disciplines at
        random.
      </p>
      <button
        type="button"
        onClick={onNewRound}
        className="mt-4 inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-primary/20"
      >
        <Shuffle className="h-4 w-4" /> Start another round
      </button>
    </div>
  );
}
