// Boss Battle question bank.
//
// Bosses are fast, timed, multiple-choice gauntlets. To keep them theory-correct
// and to avoid rebuilding every bespoke practice UI, the questions are generated
// from the same musicTheory primitives the practice drills use, but normalised
// into one uniform multiple-choice shape.

import {
  INTERVALS,
  SCALES,
  CHORDS,
  NOTES_SHARP,
  NOTES_FLAT,
  STRINGS,
  getNoteValue,
  getNoteName,
  spellScale,
  spellChord,
  spellInterval,
  chordFormula,
  degreeName,
  randomPracticeRoot,
  parseNote,
} from "@/lib/musicTheory";
import type { BossExercise } from "@/data/bossBattles";

export interface BossQuestion {
  prompt: string;
  detail?: string;
  options: string[];
  answer: string;
  // Which exercise category this question belongs to — used on the fail screen
  // to surface targeted lesson/drill links for the player's weakest area.
  category: BossExercise;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build a 4-way option list: the answer plus three distinct distractors drawn
// from `pool`, shuffled.
function buildOptions(answer: string, pool: string[]): string[] {
  const distractors = shuffle(pool.filter((p) => p !== answer));
  const opts = [answer];
  for (const d of distractors) {
    if (opts.length >= 4) break;
    if (!opts.includes(d)) opts.push(d);
  }
  return shuffle(opts);
}

const STRING_LABELS = ["high E", "B", "G", "D", "A", "low E"];

// "What note is at fret F on the X string?"
function makeNoteQuestion(): BossQuestion {
  const stringIndex = Math.floor(Math.random() * STRINGS.length);
  const fret = Math.floor(Math.random() * 13); // 0..12
  const value = getNoteValue(stringIndex, fret);
  const answer = getNoteName(value, true); // consistent sharp naming, no key context
  return {
    prompt: `Name the note`,
    detail: `Fret ${fret} on the ${STRING_LABELS[stringIndex]} string`,
    options: buildOptions(answer, NOTES_SHARP),
    answer,
    category: "fretboard",
  };
}

const INTERVAL_NAMES = Object.keys(INTERVALS) as (keyof typeof INTERVALS)[];

// "What interval lies between root and target?"
function makeIntervalQuestion(): BossQuestion {
  const root = randomPracticeRoot();
  const name = pick(INTERVAL_NAMES);
  const target = spellInterval(root, name);
  return {
    prompt: `Name the interval`,
    detail: `${root} \u2192 ${target}`,
    options: buildOptions(name as string, INTERVAL_NAMES as string[]),
    answer: name as string,
    category: "intervals",
  };
}

const NOTE_POOL = Array.from(new Set([...NOTES_SHARP, ...NOTES_FLAT]));

function noteDistractorPool(answer: string): string[] {
  const answerPitch = parseNote(answer).pitch;
  // Exclude enharmonic twins (same pitch, different spelling) so options are not
  // secretly the same note.
  return NOTE_POOL.filter((n) => parseNote(n).pitch !== answerPitch);
}

const BOSS_SCALES = [
  "Major",
  "Natural Minor",
  "Major Pentatonic",
  "Minor Pentatonic",
  "Dorian",
  "Mixolydian",
  "Lydian",
  "Phrygian",
] as const;

// "What is the <degree> of the <root> <scale> scale?"
function makeScaleQuestion(): BossQuestion {
  const root = randomPracticeRoot();
  const scaleName = pick([...BOSS_SCALES]);
  const intervals = SCALES[scaleName as keyof typeof SCALES];
  const spelled = spellScale(root, scaleName, intervals);
  // Pick a non-root degree of the scale.
  const idx = 1 + Math.floor(Math.random() * (intervals.length - 1));
  const answer = spelled[idx];
  const degree = degreeName(intervals[idx]);
  return {
    prompt: `What is the ${degree} of ${root} ${scaleName}?`,
    options: buildOptions(answer, noteDistractorPool(answer)),
    answer,
    category: "scales",
  };
}

const BOSS_CHORDS = [
  "Major",
  "Minor",
  "7",
  "maj7",
  "m7",
  "sus4",
  "sus2",
  "6",
  "aug",
  "dim",
] as const;

const CHORD_LABEL: Record<string, string> = {
  Major: "major",
  Minor: "minor",
  "7": "dominant 7",
  maj7: "major 7",
  m7: "minor 7",
  sus4: "sus4",
  sus2: "sus2",
  "6": "6",
  aug: "augmented",
  dim: "diminished",
};

// "What is the <chord tone> of <root> <chord>?"
function makeChordQuestion(): BossQuestion {
  const root = randomPracticeRoot();
  const chordName = pick([...BOSS_CHORDS]);
  const intervals = CHORDS[chordName as keyof typeof CHORDS];
  const spelled = spellChord(root, chordName, intervals);
  const idx = 1 + Math.floor(Math.random() * (intervals.length - 1));
  const answer = spelled[idx];
  const tone = chordFormula([intervals[idx]])[0];
  const label = CHORD_LABEL[chordName] ?? chordName;
  return {
    prompt: `What is the ${tone} of ${root} ${label}?`,
    options: buildOptions(answer, noteDistractorPool(answer)),
    answer,
    category: "chords",
  };
}

function makeMixedQuestion(): BossQuestion {
  const makers = [
    makeNoteQuestion,
    makeIntervalQuestion,
    makeScaleQuestion,
    makeChordQuestion,
  ];
  return pick(makers)();
}

function makeOne(exercise: BossExercise): BossQuestion {
  switch (exercise) {
    case "fretboard":
      return makeNoteQuestion();
    case "intervals":
      return makeIntervalQuestion();
    case "scales":
      return makeScaleQuestion();
    case "chords":
      return makeChordQuestion();
    case "mixed":
      return makeMixedQuestion();
  }
}

export function makeBossQuestions(
  exercise: BossExercise,
  count: number,
): BossQuestion[] {
  return Array.from({ length: count }, () => makeOne(exercise));
}
