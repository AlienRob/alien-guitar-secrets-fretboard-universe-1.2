import React, { useState, useEffect, useRef } from "react";
import { useSubmitChallenge } from "@workspace/api-client-react";
import { SessionResult, type ReviewItem } from "@/components/session-result";
import {
  CHORDS,
  spellChord,
  chordFormula,
  rotateNotes,
  randomPracticeRoot,
  INVERSION_NAMES,
} from "@/lib/musicTheory";
import PracticeSessionBanner from "@/components/practice-session-banner";
import NarrationPlayer from "@/components/learn/narration-player";
import narrationUrl from "@/assets/lessons/chords-narration.mp3";
import StaffChord from "@/components/staff-chord";
import ChordDiagram from "@/components/chord-diagram";
import { getChordDiagram } from "@/lib/chordDiagrams";

const chordNames = Object.keys(CHORDS);
// Triads (three-note chords) are the ones we voice as inversions, matching the
// Chord Construction & Inversions lesson.
const TRIADS = ["Major", "Minor", "dim", "aug"];

type Mode = "notes" | "formula" | "inversion";

interface Question {
  mode: Mode;
  rootNote: string;
  chordName: string;
  notes: string; // spelled chord tones, in display order
  formula: string; // interval-number formula, e.g. "1 - b3 - 5"
  correctAnswer: string;
  options: string[];
  // Prompt shown in the card. For inversions this is the reordered notes.
  display: string;
  // Spelled notes, lowest first, to draw on the stave (voiced for inversions).
  staffNotes: string[];
  inversionLabel?: string;
}

function sample<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function fourOptions(correct: string, pool: string[]): string[] {
  const options = [correct];
  while (options.length < 4 && options.length < pool.length) {
    const rand = sample(pool);
    if (!options.includes(rand)) options.push(rand);
  }
  return options.sort(() => Math.random() - 0.5);
}

function buildQuestion(): Question {
  const mode = sample<Mode>(["notes", "formula", "inversion"]);
  const rootNote = randomPracticeRoot();

  if (mode === "inversion") {
    const chordName = sample(TRIADS);
    const intervals = CHORDS[chordName as keyof typeof CHORDS];
    const rootPositionNotes = spellChord(rootNote, chordName, intervals);
    const inversion = Math.floor(Math.random() * 3); // 0, 1 or 2
    const voiced = rotateNotes(rootPositionNotes, inversion);
    const correctAnswer = INVERSION_NAMES[inversion];
    return {
      mode,
      rootNote,
      chordName,
      notes: rootPositionNotes.join(" - "),
      formula: chordFormula(intervals).join(" - "),
      correctAnswer,
      options: [...INVERSION_NAMES],
      display: voiced.join(" - "),
      staffNotes: voiced,
      inversionLabel: correctAnswer,
    };
  }

  const chordName = sample(chordNames);
  const intervals = CHORDS[chordName as keyof typeof CHORDS];
  const noteArr = spellChord(rootNote, chordName, intervals);
  const notes = noteArr.join(" - ");
  const formula = chordFormula(intervals).join(" - ");
  return {
    mode,
    rootNote,
    chordName,
    notes,
    formula,
    correctAnswer: chordName,
    options: fourOptions(chordName, chordNames),
    display: mode === "formula" ? formula : notes,
    staffNotes: noteArr,
  };
}

const PROMPTS: Record<Mode, { kicker: string; instruction: string }> = {
  notes: { kicker: "Harmonic Decoding", instruction: "Name the chord from its notes" },
  formula: { kicker: "Chord Construction", instruction: "Name the chord from its interval formula" },
  inversion: { kicker: "Inversions", instruction: "Which inversion is voiced below?" },
};

export default function ChordsPractice() {
  const submit = useSubmitChallenge();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [result, setResult] = useState<any>(null);
  const [review, setReview] = useState<ReviewItem[]>([]);
  const answeredRef = useRef(-1);

  useEffect(() => {
    startChallenge();
  }, []);

  const startChallenge = () => {
    const qs: Question[] = [];
    for (let i = 0; i < 10; i++) qs.push(buildQuestion());
    setQuestions(qs);
    setCurrentIndex(0);
    setCorrectAnswers(0);
    setStartTime(Date.now());
    setResult(null);
    setReview([]);
    answeredRef.current = -1;
  };

  const reviewPrompt = (q: Question): string => {
    if (q.mode === "inversion") {
      return `${q.display}  ·  ${q.rootNote} ${q.chordName} (${q.formula})`;
    }
    if (q.mode === "formula") {
      return `${q.formula}  ·  root ${q.rootNote}  →  ${q.notes}`;
    }
    return `${q.notes}  ·  root ${q.rootNote}  (${q.formula})`;
  };

  const handleAnswer = (answer: string) => {
    if (result || answeredRef.current === currentIndex) return;
    answeredRef.current = currentIndex;

    const q = questions[currentIndex];
    const isCorrect = answer === q.correctAnswer;
    if (isCorrect) setCorrectAnswers((c) => c + 1);
    setReview((r) => [
      ...r,
      {
        prompt: reviewPrompt(q),
        yourAnswer: answer,
        correctAnswer: q.correctAnswer,
        correct: isCorrect,
      },
    ]);

    if (currentIndex === 9) {
      const durationSeconds = Math.floor((Date.now() - startTime) / 1000);
      submit.mutate(
        {
          data: {
            exerciseType: "chords",
            totalQuestions: 10,
            correctAnswers: isCorrect ? correctAnswers + 1 : correctAnswers,
            durationSeconds,
          },
        },
        { onSuccess: (res) => setResult(res) },
      );
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  if (result) {
    return <SessionResult result={result} onReplay={startChallenge} review={review} discipline="chords" />;
  }

  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const prompt = PROMPTS[currentQ.mode];
  // Inversions are shown voiced on the stave, so a root-position fingering box
  // would contradict it — only show the diagram for the notes/formula modes.
  const diagram =
    currentQ.mode === "inversion"
      ? null
      : getChordDiagram(currentQ.rootNote, currentQ.chordName);

  return (
    <div className="space-y-8 max-w-4xl mx-auto flex flex-col items-center">
      <PracticeSessionBanner discipline="chords" />
      <NarrationPlayer src={narrationUrl} label="Hear this module narrated" />
      <div className="text-center space-y-2">
        <div className="text-primary font-mono text-sm tracking-widest uppercase">{prompt.kicker}</div>
        <div className="text-muted-foreground mb-4">{prompt.instruction}</div>
        <div className="p-6 bg-card/80 border border-[#FFD700]/50 rounded-xl alien-glow flex flex-col items-center gap-4">
          <div className="text-3xl font-sans font-bold tracking-widest text-[#FFD700]">
            {currentQ.display}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <StaffChord notes={currentQ.staffNotes} />
            {diagram && (
              <ChordDiagram position={diagram} root={currentQ.rootNote} showNotes showDegrees />
            )}
          </div>
        </div>
        {currentQ.mode === "inversion" ? (
          <div className="text-muted-foreground mt-4">
            Chord: <span className="text-accent">{currentQ.rootNote} {currentQ.chordName}</span>
            <span className="mx-2 text-primary/40">·</span>
            Root position: <span className="font-mono text-foreground">{currentQ.notes}</span>
          </div>
        ) : (
          <div className="text-muted-foreground mt-4">
            Root: <span className="text-accent">{currentQ.rootNote}</span>
            {currentQ.mode === "notes" ? null : (
              <>
                <span className="mx-2 text-primary/40">·</span>
                Notes: <span className="font-mono text-foreground">{currentQ.notes}</span>
              </>
            )}
          </div>
        )}
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
