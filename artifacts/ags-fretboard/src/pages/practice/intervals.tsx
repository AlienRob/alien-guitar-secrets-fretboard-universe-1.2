import React, { useState, useEffect, useRef } from "react";
import { useSubmitChallenge } from "@workspace/api-client-react";
import { SessionResult, type ReviewItem } from "@/components/session-result";
import { INTERVALS, randomPracticeRoot, spellInterval } from "@/lib/musicTheory";
import PracticeSessionBanner from "@/components/practice-session-banner";
import NarrationPlayer from "@/components/learn/narration-player";
import { EarTrainingDrill } from "@/pages/practice/ear-training";
import narrationUrl from "@/assets/lessons/intervals-narration.mp3";

type Mode = "sight" | "ear";

// The original written interval drill: name the distance between two notes.
function IntervalSightDrill() {
  const submit = useSubmitChallenge();

  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const answeredRef = useRef(-1);

  const intervalNames = Object.keys(INTERVALS);

  useEffect(() => {
    startChallenge();
  }, []);

  const startChallenge = () => {
    const qs = [];
    for (let i = 0; i < 10; i++) {
      const rootNote = randomPracticeRoot();
      const intervalName = intervalNames[Math.floor(Math.random() * intervalNames.length)];
      // Spell the target by the interval's letter distance so it's theory-correct
      // (e.g. a Major 2nd above E is F#, not Gb).
      const targetNote = spellInterval(rootNote, intervalName as keyof typeof INTERVALS);

      const options = [intervalName];
      while (options.length < 4) {
        const rand = intervalNames[Math.floor(Math.random() * intervalNames.length)];
        if (!options.includes(rand)) options.push(rand);
      }
      options.sort(() => Math.random() - 0.5);

      qs.push({ rootNote, targetNote, correctAnswer: intervalName, options });
    }
    setQuestions(qs);
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setStartTime(Date.now());
    setResult(null);
    setReview([]);
    answeredRef.current = -1;
  };

  const handleAnswer = (answer: string) => {
    if (result || answeredRef.current === currentIndex) return;
    answeredRef.current = currentIndex;

    const q = questions[currentIndex];
    const isCorrect = answer === q.correctAnswer;
    if (isCorrect) setCorrectAnswers(c => c + 1);
    setReview(r => [...r, {
      prompt: `${q.rootNote} → ${q.targetNote}`,
      yourAnswer: answer,
      correctAnswer: q.correctAnswer,
      correct: isCorrect,
    }]);

    if (currentIndex === 9) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      submit.mutate(
        { data: { exerciseType: "intervals", totalQuestions: 10, correctAnswers: isCorrect ? correctAnswers + 1 : correctAnswers, durationSeconds } },
        { onSuccess: (res) => setResult(res) }
      );
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  if (result) {
    return <SessionResult result={result} onReplay={startChallenge} review={review} discipline="intervals" />;
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  return (
    <div className="flex flex-col items-center space-y-8">
      <PracticeSessionBanner discipline="intervals" />
      <div className="text-center space-y-2">
        <div className="text-primary font-mono text-sm tracking-widest uppercase">Signal Analysis</div>
        <h1 className="text-3xl font-sans font-bold text-accent">
          Distance between <span className="text-[#FFD700]">{currentQ.rootNote}</span> and <span className="text-[#00FFD5]">{currentQ.targetNote}</span>?
        </h1>
        <div className="text-muted-foreground">Mission {currentIndex + 1} / 10</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-8">
        {currentQ.options.map((opt: string) => (
          <button
            key={opt}
            onClick={() => handleAnswer(opt)}
            className="p-6 bg-card/50 border border-primary/30 rounded-lg text-xl hover:bg-primary/20 hover:border-primary transition-all alien-glow text-foreground font-sans font-medium"
          >
            {opt}
          </button>
        ))}
      </div>

      {submit.isPending && <div className="text-accent animate-pulse">TRANSMITTING RESULTS...</div>}
    </div>
  );
}

// The Intervals module now hosts two drills under one roof: naming intervals by
// sight, and identifying them by ear (the former standalone Ear Training mode).
export default function IntervalsPractice() {
  const [mode, setMode] = useState<Mode>("sight");

  const tabs: { id: Mode; label: string }[] = [
    { id: "sight", label: "Name the interval" },
    { id: "ear", label: "Ear training" },
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <NarrationPlayer src={narrationUrl} label="Hear this module narrated" />

      <div className="flex justify-center gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setMode(t.id)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              mode === t.id
                ? "border-primary bg-primary/15 text-white"
                : "border-white/10 bg-card/30 text-muted-foreground hover:border-primary/40 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {mode === "sight" ? <IntervalSightDrill /> : <EarTrainingDrill embedded />}
    </div>
  );
}
