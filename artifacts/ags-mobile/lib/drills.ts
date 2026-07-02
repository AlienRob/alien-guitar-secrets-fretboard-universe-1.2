/**
 * Question generators for each practice mode. Each drill is 10 multiple-choice
 * questions with one correct answer and three distractors.
 */
import {
  CHORD_LETTER_STEPS,
  CHORDS,
  INTERVALS,
  NOTES_SHARP,
  SCALES,
  STRINGS,
  type SpelledDegree,
  chordSymbol,
  getNoteValue,
  randomPracticeRoot,
  spellChord,
  spellChordWithDegrees,
  spellInterval,
  spellScale,
  spellScaleWithDegrees,
} from "@/lib/musicTheory";

// "listen" is the mic-based Note Check ear trainer and "ear" is the interval
// ear-training drill. Both have their own screens (app/note-check.tsx and
// app/ear-training.tsx) and never use the generic multiple-choice runner, so
// they are intentionally absent from DRILLS and from makeQuestions below — they
// exist in the union only so their results can be recorded via
// progress.recordDrill.
export type DrillType = "intervals" | "notes" | "scales" | "chords" | "listen" | "ear" | "boss";

export interface DrillMeta {
  type: DrillType;
  title: string;
  blurb: string;
  icon: string; // Feather icon name
}

export const DRILLS: DrillMeta[] = [
  { type: "intervals", title: "Intervals", blurb: "Name the distance between two notes", icon: "git-commit" },
  { type: "notes", title: "Fretboard Notes", blurb: "Name the note at any fret", icon: "map-pin" },
  { type: "scales", title: "Scale Spelling", blurb: "Spell scales the right way", icon: "trending-up" },
  { type: "chords", title: "Chord Tones", blurb: "Find the notes inside a chord", icon: "layers" },
];

export interface Recap {
  title: string;
  degrees: SpelledDegree[];
}

export interface Question {
  prompt: string;
  highlightA?: string;
  highlightB?: string;
  options: string[];
  answer: string;
  recap?: Recap;
}

const QUESTION_COUNT = 10;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function withDistractors(answer: string, pool: string[]): string[] {
  const options = [answer];
  const candidates = shuffle(pool.filter((p) => p !== answer));
  for (const c of candidates) {
    if (options.length >= 4) break;
    if (!options.includes(c)) options.push(c);
  }
  return shuffle(options);
}

function intervalsQuestions(): Question[] {
  const names = Object.keys(INTERVALS);
  // Unison (0) and Octave (12) share the same pitch class, so with our
  // pitch-class-only display "F# -> F#" would be ambiguous. Never ask them as
  // the answer; they can still appear as distractors.
  const askable = names.filter((n) => INTERVALS[n] > 0 && INTERVALS[n] < 12);
  return Array.from({ length: QUESTION_COUNT }, () => {
    const root = randomPracticeRoot();
    const name = pick(askable);
    const target = spellInterval(root, name);
    return {
      prompt: "What is the distance?",
      highlightA: root,
      highlightB: target,
      options: withDistractors(name, names),
      answer: name,
    };
  });
}

function notesQuestions(): Question[] {
  return Array.from({ length: QUESTION_COUNT }, () => {
    const stringIndex = Math.floor(Math.random() * STRINGS.length);
    const fret = Math.floor(Math.random() * 13);
    const value = getNoteValue(stringIndex, fret);
    const answer = NOTES_SHARP[value % 12];
    return {
      prompt: `${STRINGS[stringIndex].label} string, fret ${fret}`,
      options: withDistractors(answer, NOTES_SHARP),
      answer,
    };
  });
}

const SCALE_POOL = [
  "Major",
  "Natural Minor",
  "Harmonic Minor",
  "Melodic Minor",
  "Major Pentatonic",
  "Minor Pentatonic",
  "Blues",
  "Dorian",
  "Phrygian",
  "Lydian",
  "Mixolydian",
  "Aeolian",
  "Locrian",
];

const ORDINALS = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"];

function scalesQuestions(): Question[] {
  return Array.from({ length: QUESTION_COUNT }, () => {
    const root = randomPracticeRoot();
    const scaleName = pick(SCALE_POOL);
    const notes = spellScale(root, scaleName, SCALES[scaleName]);
    const degree = 1 + Math.floor(Math.random() * (notes.length - 1));
    const answer = notes[degree];
    return {
      prompt: `${ORDINALS[degree]} note of ${root} ${scaleName}`,
      options: withDistractors(answer, NOTES_SHARP),
      answer,
      recap: { title: `${root} ${scaleName}`, degrees: spellScaleWithDegrees(root, scaleName) },
    };
  });
}

const CHORD_POOL = [
  "Major", "Minor", "7", "maj7", "m7", "sus4",
  "5", "add9", "m6", "dim7", "9", "11", "13",
];

function chordsQuestions(): Question[] {
  return Array.from({ length: QUESTION_COUNT }, () => {
    const root = randomPracticeRoot();
    const chordName = pick(CHORD_POOL);
    const intervals = CHORDS[chordName];
    const notes = spellChord(root, chordName, intervals);
    const idx = 1 + Math.floor(Math.random() * (notes.length - 1));
    // The chordal degree comes from the note's letter step (0=root, 2=3rd,
    // 4=5th, 6=7th...), not from the raw semitone count.
    const step = CHORD_LETTER_STEPS[chordName]?.[idx] ?? idx;
    const label = ORDINALS[step] ?? `${step + 1}th`;
    const answer = notes[idx];
    const symbol = chordSymbol(chordName);
    return {
      prompt: `${label} of ${root}${symbol}`,
      options: withDistractors(answer, NOTES_SHARP),
      answer,
      recap: { title: `${root}${symbol}`, degrees: spellChordWithDegrees(root, chordName) },
    };
  });
}

// ---------------------------------------------------------------------------
// Ear training (interval recognition). The app plays two notes; the student
// names the interval. This drill has its own screen (app/ear-training.tsx)
// because it needs audio playback controls instead of a text prompt, so it
// uses its own question shape rather than the multiple-choice `Question` above.
// Mirrors the web app's set of askable intervals.
// ---------------------------------------------------------------------------
const EAR_INTERVAL_NAMES = [
  "Minor 2nd",
  "Major 2nd",
  "Minor 3rd",
  "Major 3rd",
  "Perfect 4th",
  "Tritone",
  "Perfect 5th",
  "Major 6th",
  "Octave",
];

export interface EarQuestion {
  // Pitch value of the lower note (musicTheory value; MIDI = value + 24).
  rootValue: number;
  // Distance to the upper note, in semitones.
  semitones: number;
  // Correct interval name (also the answer key).
  answer: string;
  options: string[];
}

export function makeEarQuestions(): EarQuestion[] {
  return Array.from({ length: QUESTION_COUNT }, () => {
    // A comfortable mid-range root so both notes sit in an easy listening
    // octave (value 28..40 ≈ MIDI 52..64).
    const rootValue = 28 + Math.floor(Math.random() * 13);
    const name = pick(EAR_INTERVAL_NAMES);
    return {
      rootValue,
      semitones: INTERVALS[name],
      answer: name,
      options: withDistractors(name, EAR_INTERVAL_NAMES),
    };
  });
}

export function makeQuestions(type: DrillType): Question[] {
  switch (type) {
    case "intervals":
      return intervalsQuestions();
    case "notes":
      return notesQuestions();
    case "scales":
      return scalesQuestions();
    case "chords":
      return chordsQuestions();
    default:
      throw new Error(`makeQuestions: "${type}" has no question generator`);
  }
}
