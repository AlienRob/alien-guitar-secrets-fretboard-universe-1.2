import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Check, Clock, ArrowLeft } from "lucide-react";
import {
  loadRound,
  addSeconds,
  disciplineById,
  disciplineSeconds,
  isDisciplineComplete,
  DISCIPLINE_GOAL_SECONDS,
  formatClock,
  type RoundState,
} from "@/lib/dailyPractice";

// Rendered at the top of every scored practice page. When the player is inside
// an active Daily Practice routine that includes this discipline, it accrues
// real practised time (only while the tab is visible) toward the 7-minute goal
// and shows live progress. Outside a routine it renders nothing.
export default function PracticeSessionBanner({ discipline }: { discipline: string }) {
  const [round, setRound] = useState<RoundState | null>(() => loadRound());
  const [seconds, setSeconds] = useState<number>(() => {
    const r = loadRound();
    return r ? disciplineSeconds(r, discipline) : 0;
  });

  const active =
    !!round &&
    round.disciplines.includes(discipline) &&
    !isDisciplineComplete(round, discipline);

  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    if (!round || !round.disciplines.includes(discipline)) return;
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (!activeRef.current) return;
      const updated = addSeconds(discipline, 1);
      if (updated) {
        setRound(updated);
        setSeconds(disciplineSeconds(updated, discipline));
      }
    };
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
    // Only (re)start the interval when the discipline identity changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discipline]);

  if (!round || !round.disciplines.includes(discipline)) return null;

  const meta = disciplineById(discipline);
  const complete = seconds >= DISCIPLINE_GOAL_SECONDS;
  const pct = Math.min(100, Math.round((seconds / DISCIPLINE_GOAL_SECONDS) * 100));

  return (
    <div
      className={`mb-4 w-full rounded-lg border p-3 ${
        complete
          ? "border-[#00FF66]/40 bg-[#00FF66]/5"
          : "border-primary/40 bg-card/50 alien-glow"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
          <Clock className="h-4 w-4 shrink-0" />
          <span>Daily Practice · {meta?.label ?? discipline}</span>
        </div>
        <Link href="/practice">
          <span className="flex cursor-pointer items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3.5 w-3.5" /> Routine
          </span>
        </Link>
      </div>

      {complete ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#00FF66]">
            <Check className="h-4 w-4" strokeWidth={3} /> Discipline complete — 7 min done!
          </span>
          <Link href="/practice">
            <span className="cursor-pointer rounded-md border border-[#00FF66]/50 bg-[#00FF66]/10 px-3 py-1.5 text-xs font-semibold text-[#00FF66] hover:bg-[#00FF66]/20">
              Back to routine
            </span>
          </Link>
        </div>
      ) : (
        <div className="mt-2">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Keep practising to clear this discipline</span>
            <span className="font-mono text-foreground">
              {formatClock(seconds)} / {formatClock(DISCIPLINE_GOAL_SECONDS)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-white/6">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
