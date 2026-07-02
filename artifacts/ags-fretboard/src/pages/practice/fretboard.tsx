import React, { useState, useEffect, useRef, useMemo } from "react";
import { Clock } from "lucide-react";
import { useSubmitChallenge } from "@workspace/api-client-react";
import Fretboard, { NoteHighlight } from "@/components/fretboard";
import { SessionResult, type ReviewItem } from "@/components/session-result";
import {
  getNoteValue,
  INTERVALS,
  randomPracticeRoot,
  spellInterval,
  parseNote,
} from "@/lib/musicTheory";
import PracticeSessionBanner from "@/components/practice-session-banner";
import NarrationPlayer from "@/components/learn/narration-player";
import narrationUrl from "@/assets/lessons/fretboard-narration.mp3";

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// Unison and octave are trivially the same pitch class as the root — skip them.
const PLAYABLE_INTERVALS = (Object.keys(INTERVALS) as (keyof typeof INTERVALS)[]).filter(
  (n) => INTERVALS[n] > 0 && INTERVALS[n] < 12,
);

interface Question {
  rootNote: string;
  intervalName: string;
  targetNote: string;
  targetPitch: number;  // 0–11
  rootPitch: number;    // 0–11
}

function makeQuestion(): Question {
  const rootNote = randomPracticeRoot();
  const intervalName = PLAYABLE_INTERVALS[Math.floor(Math.random() * PLAYABLE_INTERVALS.length)];
  const targetNote = spellInterval(rootNote, intervalName);
  const rootPitch   = parseNote(rootNote).pitch   % 12;
  const targetPitch = parseNote(targetNote).pitch % 12;
  return { rootNote, intervalName: intervalName as string, targetNote, targetPitch, rootPitch };
}

function makeQuestions(): Question[] {
  return Array.from({ length: 10 }, makeQuestion);
}

// All fret positions (0–12, 6 strings) where a given pitch class appears.
function buildRootHighlights(rootPitch: number): NoteHighlight[] {
  const out: NoteHighlight[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = 0; f <= 12; f++) {
      if (getNoteValue(s, f) % 12 === rootPitch) {
        out.push({ string: s, fret: f, type: "root" });
      }
    }
  }
  return out;
}

export default function FretboardPractice() {
  const submit = useSubmitChallenge();
  const [questions, setQuestions]   = useState(() => makeQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect]       = useState(0);
  const [startTime, setStartTime]   = useState(() => Date.now());
  const [elapsed, setElapsed]       = useState(0);
  const [result, setResult]         = useState<any>(null);
  const [review, setReview]         = useState<ReviewItem[]>([]);
  const [feedback, setFeedback]     = useState<"correct" | "incorrect" | null>(null);
  const [lastTap, setLastTap]       = useState<{ string: number; fret: number; correct: boolean } | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const answeredRef   = useRef(-1);

  const currentQ = questions[currentIndex];

  const rootHls = useMemo(() => buildRootHighlights(currentQ.rootPitch), [currentQ.rootPitch]);

  // Overlay the last-tapped note as correct/incorrect, overriding root colour if needed.
  const highlights: NoteHighlight[] = useMemo(() => {
    if (!lastTap) return rootHls;
    const tapType = lastTap.correct ? ("correct" as const) : ("incorrect" as const);
    const tappedOnRoot = rootHls.some(
      (h) => h.string === lastTap.string && h.fret === lastTap.fret,
    );
    const base = rootHls.map((h) =>
      h.string === lastTap.string && h.fret === lastTap.fret ? { ...h, type: tapType } : h,
    );
    if (!tappedOnRoot) base.push({ string: lastTap.string, fret: lastTap.fret, type: tapType });
    return base;
  }, [rootHls, lastTap]);

  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, result]);

  const handleNoteClick = (str: number, fret: number) => {
    if (feedback || result || answeredRef.current === currentIndex) return;
    answeredRef.current = currentIndex;

    const clickedPitch = getNoteValue(str, fret) % 12;
    const isCorrect    = clickedPitch === currentQ.targetPitch;
    const newCorrect   = isCorrect ? correct + 1 : correct;

    setLastTap({ string: str, fret, correct: isCorrect });
    setFeedback(isCorrect ? "correct" : "incorrect");
    if (isCorrect) setCorrect(newCorrect);

    setReview((r) => [
      ...r,
      {
        prompt: `${currentQ.intervalName} of ${currentQ.rootNote}`,
        yourAnswer: isCorrect ? currentQ.targetNote : "Wrong note",
        correctAnswer: `Any ${currentQ.targetNote} on the neck`,
        correct: isCorrect,
      },
    ]);

    feedbackTimer.current = setTimeout(() => {
      setFeedback(null);
      setLastTap(null);
      if (currentIndex === 9) {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        submit.mutate(
          { data: { exerciseType: "fretboard", totalQuestions: 10, correctAnswers: newCorrect, durationSeconds } },
          { onSuccess: (res) => setResult(res) },
        );
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 700);
  };

  useEffect(() => () => { if (feedbackTimer.current) clearTimeout(feedbackTimer.current); }, []);

  const restart = () => {
    setQuestions(makeQuestions());
    setCurrentIndex(0);
    setCorrect(0);
    setResult(null);
    setReview([]);
    setStartTime(Date.now());
    setElapsed(0);
    setLastTap(null);
    setFeedback(null);
    answeredRef.current = -1;
  };

  if (result) {
    return <SessionResult result={result} review={review} discipline="notes" onReplay={restart} />;
  }

  const progress = Math.round((currentIndex / 10) * 100);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <PracticeSessionBanner discipline="notes" />
      <NarrationPlayer src={narrationUrl} label="Hear this module narrated" />

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Interval finding</p>
          <h1 className="text-xl font-sans font-bold text-white">
            Find the{" "}
            <span className="text-[#FFD700]">{currentQ.intervalName}</span>
            {" "}of{" "}
            <span className="text-[#00BFFF]">{currentQ.rootNote}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ={" "}
            <span className="text-[#00FFD5] font-semibold">{currentQ.targetNote}</span>
            {" "}· tap any{" "}
            <strong className="text-white">{currentQ.targetNote}</strong>
            {" "}anywhere on the neck
          </p>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-1.5 text-white">
            <Clock className="w-4 h-4 text-[#00BFFF]" />
            <span className="text-2xl font-bold font-mono tabular-nums">{formatTime(elapsed)}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">
              {currentIndex + 1}<span className="text-muted-foreground text-base">/10</span>
            </div>
            <div className="text-xs text-muted-foreground">{correct} correct</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Feedback banner */}
      <div className={`h-7 flex items-center justify-center rounded text-sm font-medium transition-all duration-200 ${
        feedback === "correct"
          ? "bg-[#00FF66]/15 text-[#00FF66]"
          : feedback === "incorrect"
            ? "bg-[#FF3B30]/15 text-[#FF3B30]"
            : "bg-transparent text-transparent"
      }`}>
        {feedback === "correct"
          ? "Correct!"
          : feedback === "incorrect"
            ? "Wrong note — try the next one"
            : "."}
      </div>

      {/* Fretboard */}
      <div className="rounded-lg border border-white/8 bg-card/30 p-3 sm:p-5 overflow-hidden">
        <Fretboard
          frets={12}
          startFret={0}
          highlightNotes={highlights}
          onNoteClick={handleNoteClick}
          showNoteNames={false}
          showStringLabels
          showFretNumbers
        />
      </div>

      <p className="text-xs text-center text-muted-foreground">
        <span className="inline-block w-2 h-2 rounded-full bg-red-400 mr-1 align-middle" />
        Red = <strong className="text-white">{currentQ.rootNote}</strong> (your anchor) ·
        {" "}tap any <strong className="text-white">{currentQ.targetNote}</strong>
      </p>
    </div>
  );
}
