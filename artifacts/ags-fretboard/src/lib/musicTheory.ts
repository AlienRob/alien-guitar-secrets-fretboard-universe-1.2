/**
 * Core music-theory helpers shared with the mobile app's logic
 * (artifacts/ags-mobile/lib/musicTheory.ts). The two files are hand-synced
 * copies — Expo/Metro cannot import from a Vite workspace artifact.
 *
 * SYNC OBLIGATION: when you change SCALES, CHORDS, INTERVALS,
 * CHORD_LETTER_STEPS, SCALE_LETTER_STEPS, or any of the spelling/interval
 * helpers (spellScale, spellChord, spellInterval, parseNote, rootPrefersFlats…),
 * apply the same change to artifacts/ags-mobile/lib/musicTheory.ts — and
 * vice-versa. Web-only additions (notesToStaffKeys, the CAGED/3-NPS shape
 * builders below) do NOT need to be ported to mobile. Mobile-only additions
 * (STRINGS.label) do not need to be ported here.
 */

export const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
export const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const STRINGS = [
  { name: "E4", open: 40 }, // E4
  { name: "B3", open: 35 }, // B3
  { name: "G3", open: 31 }, // G3
  { name: "D3", open: 26 }, // D3
  { name: "A2", open: 21 }, // A2
  { name: "E2", open: 16 }, // E2
];

export function getNoteValue(stringIndex: number, fret: number): number {
  return STRINGS[stringIndex].open + fret;
}

export function getNoteName(value: number, useSharps = false): string {
  const noteIndex = value % 12;
  return useSharps ? NOTES_SHARP[noteIndex] : NOTES_FLAT[noteIndex];
}

export const SCALES = {
  "Major": [0, 2, 4, 5, 7, 9, 11],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
  "Harmonic Minor": [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor": [0, 2, 3, 5, 7, 9, 11],
  "Major Pentatonic": [0, 2, 4, 7, 9],
  "Minor Pentatonic": [0, 3, 5, 7, 10],
  "Blues": [0, 3, 5, 6, 7, 10],
  "Dorian": [0, 2, 3, 5, 7, 9, 10],
  "Phrygian": [0, 1, 3, 5, 7, 8, 10],
  "Lydian": [0, 2, 4, 6, 7, 9, 11],
  "Mixolydian": [0, 2, 4, 5, 7, 9, 10],
  "Aeolian": [0, 2, 3, 5, 7, 8, 10],
  "Locrian": [0, 1, 3, 5, 6, 8, 10],
  "Whole Tone": [0, 2, 4, 6, 8, 10],
  "Diminished": [0, 2, 3, 5, 6, 8, 9, 11],
  "Chromatic": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
};

export const CHORDS = {
  "Major": [0, 4, 7],
  "Minor": [0, 3, 7],
  "5": [0, 7],
  "sus2": [0, 2, 7],
  "sus4": [0, 5, 7],
  "add9": [0, 4, 7, 14],
  "6": [0, 4, 7, 9],
  "m6": [0, 3, 7, 9],
  "7": [0, 4, 7, 10],
  "maj7": [0, 4, 7, 11],
  "m7": [0, 3, 7, 10],
  "m7b5": [0, 3, 6, 10],
  "dim7": [0, 3, 6, 9],
  "aug": [0, 4, 8],
  "dim": [0, 3, 6],
  "9": [0, 4, 7, 10, 14],
  "11": [0, 4, 7, 10, 14, 17],
  "13": [0, 4, 7, 10, 14, 17, 21]
};

// Chord-formula labels keyed by the exact semitone distance above the root.
// Unlike degreeName (which is mod-12 and scale-flavoured), this keeps chord
// extensions distinct (9th = 14, 11th = 17, 13th = 21) and spells altered fifths
// the way chord theory does: a #5 for augmented rather than a b6. This is the
// "interval-number formula" a guitarist uses to identify a chord (1-3-5,
// 1-b3-5-b7, and so on).
const CHORD_FORMULA_BY_SEMITONE: Record<number, string> = {
  0: "1", 2: "2", 3: "\u266D3", 4: "3", 5: "4", 6: "\u266D5", 7: "5",
  8: "\u266F5", 9: "6", 10: "\u266D7", 11: "7", 14: "9", 17: "11", 21: "13",
};

// Turn a chord's semitone intervals into its interval-number formula, e.g.
// [0,4,7] -> ["1","3","5"], [0,3,7,10] -> ["1","b3","5","b7"].
export function chordFormula(intervals: number[]): string[] {
  return intervals.map((i) => CHORD_FORMULA_BY_SEMITONE[i] ?? "?");
}

// Inversion display names, indexed by how many chord tones sit below the root
// (0 = root position, 1 = 3rd in the bass, 2 = 5th in the bass).
export const INVERSION_NAMES = ["Root position", "1st inversion", "2nd inversion"];

// Rotate a chord's notes so the tone at index `by` becomes the lowest (bass)
// note. Voicing a 1st inversion rotates by 1 (3rd in the bass); a 2nd inversion
// rotates by 2 (5th in the bass).
export function rotateNotes<T>(notes: T[], by: number): T[] {
  const n = notes.length;
  if (n === 0) return [];
  const k = ((by % n) + n) % n;
  return [...notes.slice(k), ...notes.slice(0, k)];
}

const LETTER_ORDER = ["C", "D", "E", "F", "G", "A", "B"];

// Convert an ordered list of spelled note names (lowest first, as voiced) into
// VexFlow key strings like "c#/4" or "eb/5", assigning octaves so the chord
// ascends on the stave. Letter notation only cares about letter + octave: each
// note that does not climb to a higher letter than the previous one wraps up an
// octave. This correctly stacks tertian chords, extensions (the 9th/11th/13th
// sit above) and inversions (rotated tones land in the next octave).
export function notesToStaffKeys(
  notes: string[],
  startOctave = 4,
): { keys: string[]; accidentals: { index: number; type: string }[] } {
  const keys: string[] = [];
  const accidentals: { index: number; type: string }[] = [];
  let octave = startOctave;
  let prevLetterIdx = -1;
  notes.forEach((n, i) => {
    const letter = n[0].toUpperCase();
    const letterIdx = LETTER_ORDER.indexOf(letter);
    if (i > 0 && letterIdx <= prevLetterIdx) octave++;
    prevLetterIdx = letterIdx;
    const acc = n
      .slice(1)
      .replace(/\u266D/g, "b")
      .replace(/\u266F/g, "#");
    keys.push(`${letter.toLowerCase()}${acc}/${octave}`);
    if (acc) accidentals.push({ index: i, type: acc });
  });
  return { keys, accidentals };
}

export const INTERVALS = {
  "Unison": 0,
  "Minor 2nd": 1,
  "Major 2nd": 2,
  "Minor 3rd": 3,
  "Major 3rd": 4,
  "Perfect 4th": 5,
  "Tritone": 6,
  "Perfect 5th": 7,
  "Minor 6th": 8,
  "Major 6th": 9,
  "Minor 7th": 10,
  "Major 7th": 11,
  "Octave": 12
};

// --- Correct enharmonic spelling -------------------------------------------
// A scale must use each letter name appropriately (e.g. A major is
// A B C# D E F# G#, never A B Db D E Gb Ab). We spell each degree by advancing
// the letter name and then adding the accidental needed to hit the pitch.

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// The guitar-friendly keys this app teaches, in circle-of-fifths order (C, then
// the sharp keys, then the flat keys), each spelled the conventional way for its
// key signature. Deliberately excludes Db so beginners aren't faced with a
// five-flat key. Used by the fretboard explorer's key selector.
export const ROOT_OPTIONS = ["C", "G", "D", "A", "E", "B", "F#", "Ab", "Eb", "Bb", "F"];

// Practice exercises lean hard toward the guitar-friendly keys students learn
// first (the open keys and the common sharp keys), easing flat keys in gradually
// so beginners are challenged but not overwhelmed. randomPracticeRoot draws from
// a weighted pool: the five open keys appear most often, the harder sharp barre
// keys and the easiest flat (F) appear regularly, and the remaining flats
// (Bb, Eb, Ab) appear sparingly. Db is excluded entirely.
const PRACTICE_KEY_WEIGHTS: Record<string, number> = {
  C: 5, G: 5, D: 5, A: 5, E: 5, // open / first-learned keys
  B: 3, "F#": 3,                // sharp barre keys
  F: 3,                         // easiest flat key
  Bb: 2, Eb: 1, Ab: 1,         // remaining flats, eased in gently
};
const PRACTICE_KEY_POOL: string[] = Object.entries(PRACTICE_KEY_WEIGHTS).flatMap(
  ([key, weight]) => Array.from({ length: weight }, () => key),
);
export function randomPracticeRoot(): string {
  return PRACTICE_KEY_POOL[Math.floor(Math.random() * PRACTICE_KEY_POOL.length)];
}

export function parseNote(name: string): { letterIdx: number; pitch: number } {
  const letter = name[0].toUpperCase();
  let acc = 0;
  for (const ch of name.slice(1)) {
    if (ch === "#") acc++;
    else if (ch === "b") acc--;
  }
  const letterIdx = LETTERS.indexOf(letter);
  const pitch = (((LETTER_PITCH[letter] ?? 0) + acc) % 12 + 12) % 12;
  return { letterIdx, pitch };
}

function accidental(n: number): string {
  if (n === 0) return "";
  return (n > 0 ? "#" : "b").repeat(Math.abs(n));
}

// Flat-spelled root (or F) prefers flats for ambiguous/symmetric scales.
export function rootPrefersFlats(root: string): boolean {
  return root.includes("b") || root === "F";
}

// How many letter names each degree advances from the root letter.
// null => no single correct spelling (symmetric scales) -> fall back to flats/sharps.
const SCALE_LETTER_STEPS: Record<string, number[] | null> = {
  "Major": [0, 1, 2, 3, 4, 5, 6],
  "Natural Minor": [0, 1, 2, 3, 4, 5, 6],
  "Harmonic Minor": [0, 1, 2, 3, 4, 5, 6],
  "Melodic Minor": [0, 1, 2, 3, 4, 5, 6],
  "Dorian": [0, 1, 2, 3, 4, 5, 6],
  "Phrygian": [0, 1, 2, 3, 4, 5, 6],
  "Lydian": [0, 1, 2, 3, 4, 5, 6],
  "Mixolydian": [0, 1, 2, 3, 4, 5, 6],
  "Aeolian": [0, 1, 2, 3, 4, 5, 6],
  "Locrian": [0, 1, 2, 3, 4, 5, 6],
  "Major Pentatonic": [0, 1, 2, 4, 5],
  "Minor Pentatonic": [0, 2, 3, 4, 6],
  "Blues": [0, 2, 3, 4, 4, 6],
  "Whole Tone": null,
  "Diminished": null,
  "Chromatic": null,
};

// Letter step per chord tone (3rd=2, 5th=4, 7th=6, 9th=1, 11th=3, 13th=5).
const CHORD_LETTER_STEPS: Record<string, number[]> = {
  "Major": [0, 2, 4],
  "Minor": [0, 2, 4],
  "5": [0, 4],
  "sus2": [0, 1, 4],
  "sus4": [0, 3, 4],
  "add9": [0, 2, 4, 1],
  "6": [0, 2, 4, 5],
  "m6": [0, 2, 4, 5],
  "7": [0, 2, 4, 6],
  "maj7": [0, 2, 4, 6],
  "m7": [0, 2, 4, 6],
  "m7b5": [0, 2, 4, 6],
  "dim7": [0, 2, 4, 6],
  "aug": [0, 2, 4],
  "dim": [0, 2, 4],
  "9": [0, 2, 4, 6, 1],
  "11": [0, 2, 4, 6, 1, 3],
  "13": [0, 2, 4, 6, 1, 3, 5],
};

function spellWithSteps(root: string, intervals: number[], steps: number[], capDoubles: boolean): string[] {
  const { letterIdx, pitch: rootPitch } = parseNote(root);
  const useFlats = rootPrefersFlats(root);
  return intervals.map((interval, idx) => {
    const target = (rootPitch + interval) % 12;
    const letter = LETTERS[(letterIdx + steps[idx]) % 7];
    let diff = ((target - LETTER_PITCH[letter]) % 12 + 12) % 12;
    if (diff > 6) diff -= 12;
    // Avoid double accidentals (e.g. dim7's bb7) in favour of a readable enharmonic.
    if (capDoubles && Math.abs(diff) > 1) {
      return (useFlats ? NOTES_FLAT : NOTES_SHARP)[target];
    }
    return letter + accidental(diff);
  });
}

// Correctly spelled note names for a scale, e.g. spellScale("A", "Major", ...) ->
// ["A","B","C#","D","E","F#","G#"].
export function spellScale(root: string, scaleName: string, intervals: number[]): string[] {
  const steps = SCALE_LETTER_STEPS[scaleName];
  if (!steps) {
    const { pitch } = parseNote(root);
    const useFlats = rootPrefersFlats(root);
    return intervals.map((i) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[(pitch + i) % 12]);
  }
  return spellWithSteps(root, intervals, steps, false);
}

// Correctly spelled note names for a chord.
export function spellChord(root: string, chordName: string, intervals: number[]): string[] {
  const steps = CHORD_LETTER_STEPS[chordName];
  if (!steps) {
    const { pitch } = parseNote(root);
    const useFlats = rootPrefersFlats(root);
    return intervals.map((i) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[(pitch + i) % 12]);
  }
  return spellWithSteps(root, intervals, steps, true);
}

// How many letter names each interval spans from the root letter, so the target
// note is spelled correctly: a Major 2nd above E is F# (one letter up), never Gb
// (which would spell a diminished 3rd). The tritone is spelled as an augmented
// 4th (three letters up).
const INTERVAL_LETTER_STEPS: Record<string, number> = {
  "Unison": 0,
  "Minor 2nd": 1,
  "Major 2nd": 1,
  "Minor 3rd": 2,
  "Major 3rd": 2,
  "Perfect 4th": 3,
  "Tritone": 3,
  "Perfect 5th": 4,
  "Minor 6th": 5,
  "Major 6th": 5,
  "Minor 7th": 6,
  "Major 7th": 6,
  "Octave": 0,
};

// The correctly spelled note that lies `intervalName` above `root`. Keeps the
// pitch exactly (so the interval's semitone distance is unchanged) but names it
// by advancing the right number of letters. Falls back to a clean single-
// accidental enharmonic if the strict spelling would need a double accidental.
export function spellInterval(root: string, intervalName: keyof typeof INTERVALS): string {
  const semis = INTERVALS[intervalName];
  const step = INTERVAL_LETTER_STEPS[intervalName] ?? 0;
  const { letterIdx, pitch: rootPitch } = parseNote(root);
  const target = (rootPitch + semis) % 12;
  const letter = LETTERS[(letterIdx + step) % 7];
  let diff = ((target - LETTER_PITCH[letter]) % 12 + 12) % 12;
  if (diff > 6) diff -= 12;
  if (Math.abs(diff) > 1) {
    return (rootPrefersFlats(root) ? NOTES_FLAT : NOTES_SHARP)[target];
  }
  return letter + accidental(diff);
}

// --- Scale shapes on the neck ------------------------------------------------
// Three systems for displaying a scale across the fretboard — one shape shown
// at a time, each with no duplicate same-frequency notes:
//
//  * CAGED   — five box positions derived from open chord shapes, each holding
//              2-3 notes per string across a ~4-fret window.
//  * 3-NPS   — seven three-notes-per-string patterns (one per mode/scale degree)
//              that ascend across all six strings.
//  * PENT    — five two-notes-per-string pentatonic box positions.
//
// String index convention throughout: 0 = high e (1st), 5 = low E (6th).

export type ScaleSystem = "caged" | "3nps" | "pent" | "arp" | "voicing";

export interface ShapeNote {
  /** STRINGS index: 0 = high e … 5 = low E. */
  string: number;
  fret: number;
  /** Pitch class 0-11. */
  pitch: number;
  /** Semitone interval above the root (0-11). */
  interval: number;
  isRoot: boolean;
}

export interface ScaleShape {
  system: ScaleSystem;
  root: string;
  scaleName: string;
  /** 0-based position / pattern / box index. */
  index: number;
  /** Human label, e.g. "C Shape", "Pattern 3", "Box 2". */
  label: string;
  notes: ShapeNote[];
  /**
   * String indices (0 = high e … 5 = low E) that are muted/skipped.
   * Only set for voicing shapes; undefined for scale/arpeggio shapes.
   */
  mutedStrings?: number[];
  minFret: number;
  maxFret: number;
}

export const CAGED_SCALES = ["Major", "Natural Minor", "Major Pentatonic", "Minor Pentatonic"];
export const NPS_SCALES = [
  "Major", "Natural Minor", "Dorian", "Phrygian", "Lydian",
  "Mixolydian", "Aeolian", "Locrian", "Harmonic Minor", "Melodic Minor",
];

export const CAGED_POSITION_COUNT = 5;
export const PENT_BOX_COUNT = 5;
const LOW_E = 5;

const DEGREE_NAME_BY_SEMITONE: Record<number, string> = {
  0: "Root", 1: "\u266D2", 2: "2nd", 3: "\u266D3", 4: "3rd", 5: "4th",
  6: "\u266D5", 7: "5th", 8: "\u266D6", 9: "6th", 10: "\u266D7", 11: "7th",
};

export function degreeName(interval: number): string {
  return DEGREE_NAME_BY_SEMITONE[((interval % 12) + 12) % 12] ?? "?";
}

function scaleIntervals(scaleName: string): number[] {
  return SCALES[scaleName as keyof typeof SCALES] ?? [];
}

function scalePitchClasses(rootPitch: number, intervals: number[]): Set<number> {
  return new Set(intervals.map((i) => (rootPitch + i) % 12));
}

function makeShapeNote(stringIdx: number, fret: number, rootPitch: number): ShapeNote {
  const pitch = (STRINGS[stringIdx].open + fret) % 12;
  const interval = (((pitch - rootPitch) % 12) + 12) % 12;
  return { string: stringIdx, fret, pitch, interval, isRoot: interval === 0 };
}

function shapeBounds(notes: ShapeNote[]): { minFret: number; maxFret: number } {
  const frets = notes.map((n) => n.fret);
  return { minFret: Math.min(...frets), maxFret: Math.max(...frets) };
}

export function npsPatternCount(scaleName: string): number {
  return scaleIntervals(scaleName).length;
}

// ─── CAGED major-scale shape templates ───────────────────────────────────────
// Defined for the key of C major (root pitch class 0).
// Each entry is [stringIndex, fret] — string 0 = high e, string 5 = low E.
// Verified: every (string, fret) pair produces a note in C major.
//
// To use in any key K: shift every fret by K's pitch class (0=C, 2=D, …, 11=B).
// Because all template frets are ≥ 0 and the shift is 0-11, no fret goes below
// zero, so no octave wrapping is needed. Shapes at high keys (e.g. Bb, B) will
// sit at frets 10-24, which is valid on a 24-fret guitar.

type FretPoint = [number, number]; // [stringIndex, fret]

// Shape names in CAGED order: C, A, G, E, D
const CAGED_SHAPE_NAMES = ["C Shape", "A Shape", "G Shape", "E Shape", "D Shape"];

const CAGED_TEMPLATES_MAJOR: FretPoint[][] = [
  // ── C shape (frets 0-3) ──
  // Root C at: A string fret 3, B string fret 1
  [
    [5, 0], [5, 1], [5, 3],     // low E : E  F  G
    [4, 0], [4, 2], [4, 3],     // A      : A  B  C
    [3, 0], [3, 2], [3, 3],     // D      : D  E  F
    [2, 0], [2, 2],              // G      : G  A
    [1, 1], [1, 3],              // B      : C  D
    [0, 0], [0, 1], [0, 3],     // e      : E  F  G
  ],
  // ── A shape (frets 3-8) ──
  // Root C at: A string fret 3, G string fret 5, e string fret 8
  [
    [5, 3], [5, 5], [5, 7],     // low E : G  A  B
    [4, 3], [4, 5],              // A      : C  D
    [3, 3], [3, 5], [3, 7],     // D      : F  G  A
    [2, 4], [2, 5], [2, 7],     // G      : B  C  D
    [1, 5], [1, 6], [1, 8],     // B      : E  F  G
    [0, 5], [0, 7], [0, 8],     // e      : A  B  C
  ],
  // ── G shape (frets 5-10) ──
  // Root C at: low E fret 8, G string fret 5, e string fret 8
  [
    [5, 5], [5, 7], [5, 8],     // low E : A  B  C
    [4, 5], [4, 7], [4, 8],     // A      : D  E  F
    [3, 5], [3, 7], [3, 9],     // D      : G  A  B
    [2, 5], [2, 7], [2, 9],     // G      : C  D  E
    [1, 8], [1, 10],             // B      : G  A
    [0, 7], [0, 8], [0, 10],    // e      : B  C  D
  ],
  // ── E shape (frets 7-12) ──
  // Root C at: low E fret 8, D string fret 10, e string fret 8
  [
    [5, 7], [5, 8], [5, 10],    // low E : B  C  D
    [4, 7], [4, 8], [4, 10],    // A      : E  F  G
    [3, 7], [3, 9], [3, 10],    // D      : A  B  C
    [2, 7], [2, 9], [2, 10],    // G      : D  E  F
    [1, 8], [1, 10], [1, 12],   // B      : G  A  B
    [0, 8], [0, 10], [0, 12],   // e      : C  D  E
  ],
  // ── D shape (frets 9-13) ──
  // Root C at: D string fret 10, B string fret 13
  [
    [5, 10], [5, 12], [5, 13],  // low E : D  E  F
    [4, 10], [4, 12],            // A      : G  A
    [3, 9],  [3, 10], [3, 12],  // D      : B  C  D
    [2, 9],  [2, 10], [2, 12],  // G      : E  F  G
    [1, 10], [1, 12], [1, 13],  // B      : A  B  C
    [0, 10], [0, 12], [0, 13],  // e      : D  E  F
  ],
];

// Build one CAGED position (0-4) for any root + any scale whose intervals are
// a superset of the major scale (or just use closest matching notes for other
// scales). The template is defined for C major; transposition is a flat fret
// shift by the target root's pitch class.
export function buildCagedShape(root: string, scaleName: string, index: number): ScaleShape {
  const rootPitch = parseNote(root).pitch;
  const intervals = scaleIntervals(scaleName);
  const pcs = scalePitchClasses(rootPitch, intervals);

  const template = CAGED_TEMPLATES_MAJOR[index % CAGED_TEMPLATES_MAJOR.length];
  const shift = rootPitch; // 0 for C, 7 for G, 11 for B, etc.

  const notes: ShapeNote[] = template
    .map(([s, f]): [number, number] => [s, f + shift])
    .filter(([s, f]) => pcs.has((STRINGS[s].open + f) % 12))
    .map(([s, f]) => makeShapeNote(s, f, rootPitch));

  const name = CAGED_SHAPE_NAMES[index % CAGED_SHAPE_NAMES.length];
  return { system: "caged", root, scaleName, index, label: name, notes, ...shapeBounds(notes) };
}

// ─── 3-notes-per-string patterns ─────────────────────────────────────────────
// Ascending: 3 consecutive scale notes per string (low E → high e), starting
// from the chosen scale degree. Each absolute pitch appears exactly once — no
// same-frequency duplicates.

function nextScaleAbs(abs: number, pcs: Set<number>): number {
  let n = abs + 1;
  while (!pcs.has(((n % 12) + 12) % 12)) n++;
  return n;
}

function buildNpsNotes(startAbs: number, pcs: Set<number>, rootPitch: number): ShapeNote[] {
  let cur = startAbs;
  const notes: ShapeNote[] = [];
  for (let s = LOW_E; s >= 0; s--) {
    for (let j = 0; j < 3; j++) {
      notes.push(makeShapeNote(s, cur - STRINGS[s].open, rootPitch));
      cur = nextScaleAbs(cur, pcs);
    }
  }
  return notes;
}

export function build3npsShape(root: string, scaleName: string, index: number): ScaleShape {
  const intervals = scaleIntervals(scaleName);
  const rootPitch = parseNote(root).pitch;
  const pcs = scalePitchClasses(rootPitch, intervals);

  const targetPc = (rootPitch + intervals[index % intervals.length]) % 12;
  const startFret = (((targetPc - (STRINGS[LOW_E].open % 12)) % 12) + 12) % 12;
  // startFret=0 is valid (open-string position, e.g. E major Pattern 1).
  // The negative-fret guard below handles the genuine case where open position
  // would push some notes below fret 0.

  let notes = buildNpsNotes(STRINGS[LOW_E].open + startFret, pcs, rootPitch);
  if (Math.min(...notes.map((n) => n.fret)) < 0) {
    notes = buildNpsNotes(STRINGS[LOW_E].open + startFret + 12, pcs, rootPitch);
  }
  return { system: "3nps", root, scaleName, index, label: `Pattern ${index + 1}`, notes, ...shapeBounds(notes) };
}

// ─── Pentatonic box positions ─────────────────────────────────────────────────
// Two notes per string (low E → high e), ascending — guarantees no duplicate
// pitches. Box 0 starts at the root, Box 1 starts at the 2nd pent degree, etc.
// Works for both minor and major pentatonic.

function buildPentNotes(startAbs: number, pcs: Set<number>, rootPitch: number): ShapeNote[] {
  let cur = startAbs;
  const notes: ShapeNote[] = [];
  for (let s = LOW_E; s >= 0; s--) {
    for (let j = 0; j < 2; j++) {
      notes.push(makeShapeNote(s, cur - STRINGS[s].open, rootPitch));
      cur = nextScaleAbs(cur, pcs);
    }
  }
  return notes;
}

export function buildPentBox(root: string, scaleName: string, boxIndex: number): ScaleShape {
  const intervals = scaleIntervals(scaleName);
  const rootPitch = parseNote(root).pitch;
  const pcs = scalePitchClasses(rootPitch, intervals);

  const startInterval = intervals[boxIndex % intervals.length];
  const targetPc = (rootPitch + startInterval) % 12;
  const startFret = (((targetPc - (STRINGS[LOW_E].open % 12)) % 12) + 12) % 12;
  const startAbs = STRINGS[LOW_E].open + (startFret === 0 ? 12 : startFret);

  let notes = buildPentNotes(startAbs, pcs, rootPitch);
  if (Math.min(...notes.map((n) => n.fret)) < 0) {
    notes = buildPentNotes(startAbs + 12, pcs, rootPitch);
  }
  return {
    system: "pent",
    root,
    scaleName,
    index: boxIndex,
    label: `Box ${boxIndex + 1}`,
    notes,
    ...shapeBounds(notes),
  };
}

export function buildScaleShape(
  system: ScaleSystem,
  root: string,
  scaleName: string,
  index: number,
): ScaleShape {
  if (system === "caged") return buildCagedShape(root, scaleName, index);
  if (system === "pent") return buildPentBox(root, scaleName, index);
  if (system === "arp") return buildArpeggioShape(root, scaleName, index);
  if (system === "voicing") return buildChordVoicing(root, scaleName, index);
  return build3npsShape(root, scaleName, index);
}

// ─── Arpeggio shapes ─────────────────────────────────────────────────────────
// Five CAGED positions filtered to chord tones only (e.g. R/3/5 for major).
// The fret window for each position comes from the CAGED major-scale templates
// shifted to the target root.  Within that window every chord tone on every
// string is included (up to two per string).
//
// This produces shapes that match Rob's CAGED arpeggio reference sheets:
// Shape 1 = C shape window, Shape 2 = A shape, …, Shape 5 = D shape.

export const ARP_POSITION_COUNT = 5;

/** Chord types that make sense as arpeggio patterns. */
export const ARP_CHORD_TYPES = [
  "Major", "Minor", "7", "maj7", "m7", "dim", "m7b5",
] as const;

function chordPitchClasses(rootPitch: number, chordName: string): Set<number> {
  const ivs = (CHORDS[chordName as keyof typeof CHORDS] ?? [0, 4, 7]).map(
    (i) => i % 12,
  );
  return new Set(ivs.map((i) => (rootPitch + i) % 12));
}

export function buildArpeggioShape(root: string, chordName: string, index: number): ScaleShape {
  const rootPitch = parseNote(root).pitch;
  const pcs = chordPitchClasses(rootPitch, chordName);
  const shift = rootPitch;

  const template = CAGED_TEMPLATES_MAJOR[index % CAGED_TEMPLATES_MAJOR.length];
  const templateFrets = template.map(([, f]) => f + shift);
  const winMin = Math.min(...templateFrets);
  const winMax = Math.max(...templateFrets);

  // Collect every chord tone within the window (one extra fret on top for reach).
  const notes: ShapeNote[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = winMin; f <= winMax + 1; f++) {
      if (f >= 0 && pcs.has((STRINGS[s].open + f) % 12)) {
        notes.push(makeShapeNote(s, f, rootPitch));
      }
    }
  }

  const name = CAGED_SHAPE_NAMES[index % CAGED_SHAPE_NAMES.length];
  return { system: "arp", root, scaleName: chordName, index, label: name, notes, ...shapeBounds(notes) };
}

// ─── Chord voicings ──────────────────────────────────────────────────────────
// Five CAGED positions, one note per string, with strings muted when no chord
// tone falls within the window.  The result can be shown as a chord diagram
// (all notes sounded simultaneously) or an arpeggio sweep.
//
// Algorithm: same CAGED window as the arpeggio shape, but keep only the
// candidate on each string that sits closest to the window centre.  Strings
// with no candidate in [winMin, winMax+1] are added to `mutedStrings`.

export const VOICING_POSITION_COUNT = 5;

/** Chord types for the voicing practice drill. */
export const VOICING_CHORD_TYPES = [
  "Major", "Minor", "7", "maj7", "m7", "sus2", "sus4", "dim", "m7b5",
] as const;

export function buildChordVoicing(root: string, chordName: string, index: number): ScaleShape {
  const rootPitch = parseNote(root).pitch;
  const pcs = chordPitchClasses(rootPitch, chordName);
  const shift = rootPitch;

  const template = CAGED_TEMPLATES_MAJOR[index % CAGED_TEMPLATES_MAJOR.length];
  const templateFrets = template.map(([, f]) => f + shift);
  const winMin = Math.min(...templateFrets);
  const winMax = Math.max(...templateFrets);
  const center = (winMin + winMax) / 2;

  const notes: ShapeNote[] = [];
  const mutedStrings: number[] = [];

  for (let s = 0; s < 6; s++) {
    const candidates: number[] = [];
    for (let f = winMin; f <= winMax + 1; f++) {
      if (f >= 0 && pcs.has((STRINGS[s].open + f) % 12)) {
        candidates.push(f);
      }
    }
    if (candidates.length === 0) {
      mutedStrings.push(s);
    } else {
      // Keep the note closest to the window centre.
      candidates.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
      notes.push(makeShapeNote(s, candidates[0], rootPitch));
    }
  }

  // Guarantee the root appears at least once.  The "closest-to-centre" pass
  // can bypass the root when another chord tone sits nearer the centre.  Find
  // the string where the root fret lands closest to the window centre and
  // substitute it for whatever was chosen on that string.
  if (!notes.some((n) => n.isRoot)) {
    let bestStr = -1;
    let bestFret = -1;
    let bestDist = Infinity;
    for (let s = 0; s < 6; s++) {
      const openPc = STRINGS[s].open % 12;
      let f = (rootPitch - openPc + 12) % 12;
      // Advance to the nearest octave that is at or above the window.
      while (f < winMin) f += 12;
      for (const cand of [f, f + 12]) {
        const dist = Math.abs(cand - center);
        if (dist < bestDist) {
          bestDist = dist;
          bestStr = s;
          bestFret = cand;
        }
      }
    }
    if (bestStr >= 0) {
      const rootNote = makeShapeNote(bestStr, bestFret, rootPitch);
      const existingIdx = notes.findIndex((n) => n.string === bestStr);
      if (existingIdx >= 0) {
        notes[existingIdx] = rootNote;
      } else {
        notes.push(rootNote);
        const mIdx = mutedStrings.indexOf(bestStr);
        if (mIdx >= 0) mutedStrings.splice(mIdx, 1);
      }
    }
  }

  const name = CAGED_SHAPE_NAMES[index % CAGED_SHAPE_NAMES.length];
  return {
    system: "voicing",
    root,
    scaleName: chordName,
    index,
    label: name,
    notes,
    mutedStrings: mutedStrings.length ? mutedStrings : undefined,
    ...shapeBounds(notes),
  };
}
