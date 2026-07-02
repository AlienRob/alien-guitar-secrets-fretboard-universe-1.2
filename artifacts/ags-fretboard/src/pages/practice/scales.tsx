import React, { useState, useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { useSubmitChallenge } from "@workspace/api-client-react";
import Fretboard, { NoteHighlight } from "@/components/fretboard";
import { SessionResult, type ReviewItem } from "@/components/session-result";
import PracticeSessionBanner from "@/components/practice-session-banner";
import NarrationPlayer from "@/components/learn/narration-player";
import narrationUrl from "@/assets/lessons/scales-narration.mp3";
import {
  CAGED_SCALES,
  NPS_SCALES,
  CAGED_POSITION_COUNT,
  buildScaleShape,
  degreeName,
  randomPracticeRoot,
  rootPrefersFlats,
  type ScaleSystem,
  type ScaleShape,
} from "@/lib/musicTheory";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface Question {
  shape: ScaleShape;
  targetInterval: number;
  targetLabel: string;
}

const QUESTION_COUNT = 10;

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeQuestion(system: ScaleSystem): Question {
  const scales = system === "caged" ? CAGED_SCALES : NPS_SCALES;
  const scaleName = pick(scales);
  const root = randomPracticeRoot();
  // CAGED rotates through its five box positions; 3-NPS always uses the
  // root-position pattern (index 0) so the lowest note of the shape is the root,
  // giving the student a clear anchor to start from.
  const index = system === "caged" ? Math.floor(Math.random() * CAGED_POSITION_COUNT) : 0;
  const shape = buildScaleShape(system, root, scaleName, index);

  // Ask the player to tap a non-root degree that actually appears in this shape;
  // the root is shown in red as an orientation anchor.
  const nonRootIntervals = Array.from(new Set(shape.notes.map((n) => n.interval))).filter((i) => i !== 0);
  const targetInterval = nonRootIntervals.length ? pick(nonRootIntervals) : 0;

  return { shape, targetInterval, targetLabel: degreeName(targetInterval) };
}

function makeQuestions(system: ScaleSystem): Question[] {
  return Array.from({ length: QUESTION_COUNT }, () => makeQuestion(system));
}

const SYSTEMS: { id: ScaleSystem; title: string; tagline: string; desc: string }[] = [
  {
    id: "caged",
    title: "CAGED Positions",
    tagline: "Five box shapes",
    desc: "Compact 4-5 fret boxes that tile the neck — the five positions of the CAGED system.",
  },
  {
    id: "3nps",
    title: "3 Notes Per String",
    tagline: "Root-position stretch shape",
    desc: "Three notes on every string, starting from the root as the lowest note — even, fast patterns for lead playing.",
  },
];

export default function ScalesPractice() {
  const submit = useSubmitChallenge();

  const [system, setSystem] = useState<ScaleSystem | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const [lastTap, setLastTap] = useState<{ string: number; fret: number; correct: boolean } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  useEffect(() => {
    if (result || !system) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, result, system]);

  const begin = (sys: ScaleSystem) => {
    setSystem(sys);
    setQuestions(makeQuestions(sys));
    setCurrentIndex(0);
    setCorrect(0);
    setResult(null);
    setReview([]);
    setFeedback(null);
    setLastTap(null);
    setStartTime(Date.now());
    setElapsed(0);
  };

  const replay = () => {
    if (system) begin(system);
  };

  // System selection screen.
  if (!system) {
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <div className="text-primary font-mono text-sm tracking-widest uppercase">Shape Lab</div>
          <h1 className="text-3xl font-sans font-bold text-white">Choose a scale system</h1>
          <p className="text-muted-foreground">See the real fretboard shape, then prove you know it.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {SYSTEMS.map((s) => (
            <button
              key={s.id}
              onClick={() => begin(s.id)}
              className="text-left p-6 bg-card/50 border border-primary/30 rounded-xl hover:bg-primary/15 hover:border-primary transition-all alien-glow group"
            >
              <div className="text-xs font-mono uppercase tracking-widest text-secondary mb-1">{s.tagline}</div>
              <div className="text-2xl font-sans font-bold text-white group-hover:text-primary transition-colors">{s.title}</div>
              <p className="text-sm text-muted-foreground mt-3">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (result) {
    return <SessionResult result={result} onReplay={replay} review={review} discipline="scales" />;
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const { shape } = currentQ;
  const useFlats = rootPrefersFlats(shape.root);

  // Fit the rendered window to the shape.
  const startFret = Math.max(0, shape.minFret - 1);
  const frets = Math.max(4, shape.maxFret - startFret + 1);

  const highlights: NoteHighlight[] = shape.notes.map((n) => {
    if (lastTap && lastTap.string === n.string && lastTap.fret === n.fret) {
      return { string: n.string, fret: n.fret, type: lastTap.correct ? "correct" : "incorrect" };
    }
    return { string: n.string, fret: n.fret, type: n.isRoot ? "root" : "scale" };
  });

  const handleNoteClick = (str: number, fret: number) => {
    if (feedback || result) return;
    // Only taps that land on a note of the shown shape count as an answer.
    const note = shape.notes.find((n) => n.string === str && n.fret === fret);
    if (!note) return;

    const isCorrect = note.interval === currentQ.targetInterval;
    const newCorrect = isCorrect ? correct + 1 : correct;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setLastTap({ string: str, fret, correct: isCorrect });
    if (isCorrect) setCorrect(newCorrect);

    const reviewItem: ReviewItem = {
      prompt: `${shape.root} ${shape.scaleName} · tap the ${currentQ.targetLabel}`,
      yourAnswer: degreeName(note.interval),
      correctAnswer: currentQ.targetLabel,
      correct: isCorrect,
    };
    const newReview = [...review, reviewItem];
    setReview(newReview);

    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      setLastTap(null);
      if (currentIndex === QUESTION_COUNT - 1) {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        submit.mutate(
          { data: { exerciseType: "scales", totalQuestions: QUESTION_COUNT, correctAnswers: newCorrect, durationSeconds } },
          { onSuccess: (res) => setResult(res) },
        );
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 750);
  };

  const progress = Math.round((currentIndex / QUESTION_COUNT) * 100);
  const systemLabel = system === "caged" ? "CAGED" : "3-NPS";

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PracticeSessionBanner discipline="scales" />
      <NarrationPlayer src={narrationUrl} label="Hear this module narrated" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{systemLabel} · {shape.label}</p>
          <h1 className="text-xl font-sans font-bold text-white">
            Tap a{" "}
            <span className="text-[#00FFD5]">{currentQ.targetLabel}</span>
            {" "}in this shape
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            <span className="text-[#FFD700]">{shape.root}</span> {shape.scaleName}
            <span className="mx-2 text-white/20">·</span>
            root in <span className="text-[#FF2D55]">red</span>
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-1.5 text-white">
            <Clock className="w-4 h-4 text-[#00BFFF]" />
            <span className="text-2xl font-bold font-mono tabular-nums">{formatTime(elapsed)}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">{currentIndex + 1}<span className="text-muted-foreground text-base">/{QUESTION_COUNT}</span></div>
            <div className="text-xs text-muted-foreground">{correct} correct</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Feedback banner */}
      <div className={`h-7 flex items-center justify-center rounded text-sm font-medium transition-all duration-200 ${
        feedback === "correct"
          ? "bg-[#00FF66]/15 text-[#00FF66]"
          : feedback === "incorrect"
          ? "bg-[#FF3B30]/15 text-[#FF3B30]"
          : "bg-transparent text-transparent"
      }`}>
        {feedback === "correct" ? "Correct" : feedback === "incorrect" ? `That wasn't the ${currentQ.targetLabel}` : "."}
      </div>

      {/* Fretboard */}
      <div className="rounded-lg border border-white/8 bg-card/30 p-3 sm:p-5 overflow-hidden">
        <Fretboard
          frets={frets}
          startFret={startFret}
          highlightNotes={highlights}
          onNoteClick={handleNoteClick}
          showNoteNames={false}
          useSharps={!useFlats}
          showStringLabels
          showFretNumbers
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Tap the highlighted dot that is a <strong className="text-white">{currentQ.targetLabel}</strong> of {shape.root} {shape.scaleName}
      </p>

      {submit.isPending && <div className="text-center text-accent animate-pulse">TRANSMITTING RESULTS...</div>}
    </div>
  );
}
