import React, { useState, useEffect, useRef, useCallback } from "react";
import { Volume2, Play, Music2 } from "lucide-react";
import { useSubmitChallenge } from "@workspace/api-client-react";
import { SessionResult, type ReviewItem } from "@/components/session-result";
import { playInterval as playIntervalAudio } from "@/lib/audio";
import PracticeSessionBanner from "@/components/practice-session-banner";
import NarrationPlayer from "@/components/learn/narration-player";
import narrationUrl from "@/assets/lessons/intervals-narration.mp3";

const EAR_INTERVALS = [
  { name: "Minor 2nd", semitones: 1 },
  { name: "Major 2nd", semitones: 2 },
  { name: "Minor 3rd", semitones: 3 },
  { name: "Major 3rd", semitones: 4 },
  { name: "Perfect 4th", semitones: 5 },
  { name: "Tritone", semitones: 6 },
  { name: "Perfect 5th", semitones: 7 },
  { name: "Major 6th", semitones: 9 },
  { name: "Octave", semitones: 12 },
];

type Question = {
  rootMidi: number;
  interval: (typeof EAR_INTERVALS)[number];
  options: string[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeOptions(correct: string): string[] {
  const wrong = shuffle(EAR_INTERVALS.map((i) => i.name).filter((n) => n !== correct)).slice(0, 3);
  return shuffle([correct, ...wrong]);
}

function makeQuestions(): Question[] {
  return Array.from({ length: 10 }, () => {
    const rootMidi = 57 + Math.floor(Math.random() * 13); // A3..A4
    const interval = EAR_INTERVALS[Math.floor(Math.random() * EAR_INTERVALS.length)];
    return { rootMidi, interval, options: makeOptions(interval.name) };
  });
}

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// `embedded` is set when this drill is rendered inside the Intervals module,
// which already shows the shared narration player above its tabs — so we skip
// our own player to avoid a duplicate. On the standalone /practice/ear-training
// route (kept for Daily Practice deep links) the player is shown.
export function EarTrainingDrill({ embedded = false }: { embedded?: boolean }) {
  const submit = useSubmitChallenge();
  const [questions, setQuestions] = useState<Question[]>(() => makeQuestions());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [hasPlayed, setHasPlayed] = useState(false);

  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentQ = questions[currentIndex];

  const playInterval = useCallback((q: Question, harmonic = false) => {
    playIntervalAudio(q.rootMidi, q.interval.semitones, harmonic);
    setHasPlayed(true);
  }, []);

  // Timer
  useEffect(() => {
    if (result) return;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [startTime, result]);

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
    },
    [],
  );

  const handleAnswer = (option: string) => {
    if (selected || result || submit.isPending || !currentQ) return;
    setSelected(option);

    const isCorrect = option === currentQ.interval.name;
    const newCorrect = isCorrect ? correct + 1 : correct;
    if (isCorrect) setCorrect(newCorrect);

    setReview((r) => [...r, {
      prompt: "Interval played",
      yourAnswer: option,
      correctAnswer: currentQ.interval.name,
      correct: isCorrect,
    }]);

    advanceTimer.current = setTimeout(() => {
      setSelected(null);
      setHasPlayed(false);
      if (currentIndex === 9) {
        const durationSeconds = Math.round((Date.now() - startTime) / 1000);
        submit.mutate(
          { data: { exerciseType: "ear_training", totalQuestions: 10, correctAnswers: newCorrect, durationSeconds } },
          { onSuccess: (res) => setResult(res) },
        );
      } else {
        setCurrentIndex((i) => i + 1);
      }
    }, 1100);
  };

  if (result) {
    return (
      <SessionResult
        result={result}
        review={review}
        discipline="ear"
        onReplay={() => {
          setQuestions(makeQuestions());
          setCurrentIndex(0);
          setCorrect(0);
          setResult(null);
          setReview([]);
          setSelected(null);
          setHasPlayed(false);
          setStartTime(Date.now());
          setElapsed(0);
        }}
      />
    );
  }

  const progress = Math.round((currentIndex / 10) * 100);

  return (
    <div className="space-y-5 max-w-3xl mx-auto">
      <PracticeSessionBanner discipline="ear" />
      {!embedded && (
        <NarrationPlayer src={narrationUrl} label="Hear this module narrated" />
      )}
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Ear training</p>
          <h1 className="text-xl font-sans font-bold text-white">Which interval do you hear?</h1>
        </div>
        <div className="flex items-center gap-5 shrink-0">
          <div className="flex items-center gap-1.5 text-white">
            <Volume2 className="w-4 h-4 text-[#00BFFF]" />
            <span className="text-2xl font-bold font-mono tabular-nums">{formatTime(elapsed)}</span>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">
              {currentIndex + 1}
              <span className="text-muted-foreground text-base">/10</span>
            </div>
            <div className="text-xs text-muted-foreground">{correct} correct</div>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full bg-primary transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
      </div>

      {/* Playback panel */}
      <div className="rounded-lg border border-primary/20 bg-[#0a1029] p-8 flex flex-col items-center gap-5">
        <button
          onClick={() => currentQ && playInterval(currentQ)}
          className="w-24 h-24 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center text-primary hover:bg-primary/25 hover:scale-105 transition-all alien-glow"
          aria-label="Play interval"
        >
          <Play className="w-10 h-10 ml-1" fill="currentColor" />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => currentQ && playInterval(currentQ)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
          >
            <Play className="w-3.5 h-3.5" /> Replay
          </button>
          <button
            onClick={() => currentQ && playInterval(currentQ, true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded border border-white/10 text-muted-foreground hover:text-white hover:border-white/20 transition-colors"
          >
            <Music2 className="w-3.5 h-3.5" /> Together
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {hasPlayed ? "Listen, then pick the interval below" : "Press play to hear the two notes"}
        </p>
      </div>

      {/* Answer options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {currentQ?.options.map((opt) => {
          const isAnswer = opt === currentQ.interval.name;
          const isPicked = selected === opt;
          let cls =
            "px-4 py-4 rounded-lg border text-sm font-semibold transition-all ";
          if (!selected) {
            cls += hasPlayed
              ? "border-white/10 bg-card/40 text-white hover:border-primary/50 hover:bg-primary/10 cursor-pointer"
              : "border-white/5 bg-card/20 text-muted-foreground opacity-50 cursor-not-allowed";
          } else if (isAnswer) {
            cls += "border-[#00FF66] bg-[#00FF66]/15 text-[#00FF66]";
          } else if (isPicked) {
            cls += "border-[#FF3B30] bg-[#FF3B30]/15 text-[#FF3B30]";
          } else {
            cls += "border-white/5 bg-card/20 text-muted-foreground opacity-40";
          }
          return (
            <button key={opt} className={cls} disabled={!hasPlayed || !!selected} onClick={() => handleAnswer(opt)}>
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Default export keeps the standalone /practice/ear-training route working with
// wouter (which passes its own route props), while the drill above can be
// embedded inside the Intervals module via the named export.
export default function EarTraining() {
  return <EarTrainingDrill />;
}
