/**
 * Core music-theory helpers shared with the web app's logic
 * (artifacts/ags-fretboard/src/lib/musicTheory.ts). Copied here because
 * artifacts cannot import from each other. Keep correct enharmonic spelling:
 * spell scales/chords/intervals by letter-per-degree, never a flat-only table.
 *
 * SYNC OBLIGATION: keep this file in sync with the web app copy. When you
 * change SCALES, CHORDS, INTERVALS, CHORD_LETTER_STEPS, SCALE_LETTER_STEPS,
 * or any of the spelling/interval helpers (spellScale, spellChord,
 * spellInterval, parseNote, rootPrefersFlats…), apply the same change to
 * artifacts/ags-fretboard/src/lib/musicTheory.ts — and vice-versa.
 * Web-only additions (notesToStaffKeys, the CAGED/3-NPS shape builders) do NOT
 * need to be ported here. Mobile-only additions (STRINGS.label) do not need to
 * be ported to the web.
 */

export const NOTES_FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
export const NOTES_SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export const STRINGS = [
  { name: "E4", label: "1st (high E)", open: 40 },
  { name: "B3", label: "2nd (B)", open: 35 },
  { name: "G3", label: "3rd (G)", open: 31 },
  { name: "D3", label: "4th (D)", open: 26 },
  { name: "A2", label: "5th (A)", open: 21 },
  { name: "E2", label: "6th (low E)", open: 16 },
];

export function getNoteValue(stringIndex: number, fret: number): number {
  return STRINGS[stringIndex].open + fret;
}

export function getNoteName(value: number, useSharps = false): string {
  const noteIndex = value % 12;
  return useSharps ? NOTES_SHARP[noteIndex] : NOTES_FLAT[noteIndex];
}

export const SCALES: Record<string, number[]> = {
  // ── Core ─────────────────────────────────────────────────────────────────
  Major:                   [0, 2, 4, 5, 7, 9, 11],
  "Natural Minor":         [0, 2, 3, 5, 7, 8, 10],
  "Harmonic Minor":        [0, 2, 3, 5, 7, 8, 11],
  "Melodic Minor":         [0, 2, 3, 5, 7, 9, 11],
  // ── Pentatonic & Blues ────────────────────────────────────────────────────
  "Major Pentatonic":      [0, 2, 4, 7, 9],
  "Minor Pentatonic":      [0, 3, 5, 7, 10],
  Blues:                   [0, 3, 5, 6, 7, 10],
  // ── Major Modes ───────────────────────────────────────────────────────────
  Dorian:                  [0, 2, 3, 5, 7, 9, 10],
  Phrygian:                [0, 1, 3, 5, 7, 8, 10],
  Lydian:                  [0, 2, 4, 6, 7, 9, 11],
  Mixolydian:              [0, 2, 4, 5, 7, 9, 10],
  Aeolian:                 [0, 2, 3, 5, 7, 8, 10],
  Locrian:                 [0, 1, 3, 5, 6, 8, 10],
  // ── Harmonic Minor Modes ──────────────────────────────────────────────────
  "HM2 Locrian #6":        [0, 1, 3, 5, 6, 9, 10],
  "HM3 Ionian #5":         [0, 2, 4, 5, 8, 9, 11],
  "HM4 Ukrainian Dorian":  [0, 2, 3, 6, 7, 9, 10],
  "HM5 Phrygian Dominant": [0, 1, 4, 5, 7, 8, 10],
  "HM6 Lydian #2":         [0, 3, 4, 6, 7, 9, 11],
  "HM7 Altered Dim":       [0, 1, 3, 4, 6, 8, 9],
  // ── Melodic Minor Modes ───────────────────────────────────────────────────
  "MM2 Dorian b2":         [0, 1, 3, 5, 7, 9, 10],
  "MM3 Lydian Aug":        [0, 2, 4, 6, 8, 9, 11],
  "MM4 Lydian b7":         [0, 2, 4, 6, 7, 9, 10],
  "MM5 Mixolydian b6":     [0, 2, 4, 5, 7, 8, 10],
  "MM6 Aeolian b5":        [0, 2, 3, 5, 6, 8, 10],
  "MM7 Super Locrian":     [0, 1, 3, 4, 6, 8, 10],
  // ── Exotic ───────────────────────────────────────────────────────────────
  Hirajoshi:               [0, 2, 3, 7, 8],
  "Japanese (In)":         [0, 1, 5, 7, 8],
  "Hungarian Minor":       [0, 2, 3, 6, 7, 8, 11],
  "Double Harmonic":       [0, 1, 4, 5, 7, 8, 11],
  "Neapolitan Major":      [0, 1, 3, 5, 7, 9, 11],
  "Neapolitan Minor":      [0, 1, 3, 5, 7, 8, 11],
  Persian:                 [0, 1, 4, 5, 6, 8, 11],
  Arabic:                  [0, 2, 4, 5, 6, 9, 10],
  "Romanian Minor":        [0, 2, 3, 6, 7, 9, 10],
  "Spanish 8-tone":        [0, 1, 3, 4, 5, 6, 8, 10],
  // ── Symmetric ─────────────────────────────────────────────────────────────
  "Whole Tone":            [0, 2, 4, 6, 8, 10],
  Diminished:              [0, 2, 3, 5, 6, 8, 9, 11],
  Enigmatic:               [0, 1, 4, 6, 8, 10, 11],
  Chromatic:               [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
};

export const CHORDS: Record<string, number[]> = {
  // ── Triads ────────────────────────────────────────────────────────────────
  Major:  [0, 4, 7],
  Minor:  [0, 3, 7],
  aug:    [0, 4, 8],
  dim:    [0, 3, 6],
  // ── 7ths ─────────────────────────────────────────────────────────────────
  "7":    [0, 4, 7, 10],
  maj7:   [0, 4, 7, 11],
  m7:     [0, 3, 7, 10],
  m7b5:   [0, 3, 6, 10],
  dim7:   [0, 3, 6, 9],
  // ── 9ths ─────────────────────────────────────────────────────────────────
  "9":    [0, 4, 7, 10, 14],
  maj9:   [0, 4, 7, 11, 14],
  m9:     [0, 3, 7, 10, 14],
  add9:   [0, 4, 7, 14],
  madd9:  [0, 3, 7, 14],
  // ── 11ths ────────────────────────────────────────────────────────────────
  "11":   [0, 4, 7, 10, 14, 17],
  maj11:  [0, 4, 7, 11, 14, 17],
  m11:    [0, 3, 7, 10, 14, 17],
  // ── 13ths ────────────────────────────────────────────────────────────────
  "13":   [0, 4, 7, 10, 14, 17, 21],
  maj13:  [0, 4, 7, 11, 14, 17, 21],
  m13:    [0, 3, 7, 10, 14, 17, 21],
  // ── Suspended ────────────────────────────────────────────────────────────
  sus2:   [0, 2, 7],
  sus4:   [0, 5, 7],
  "7sus4":[0, 5, 7, 10],
  // ── Other ────────────────────────────────────────────────────────────────
  "5":    [0, 7],
  "6":    [0, 4, 7, 9],
  m6:     [0, 3, 7, 9],
  "6/9":  [0, 4, 7, 9, 14],
};

export const INTERVALS: Record<string, number> = {
  Unison: 0,
  "Minor 2nd": 1,
  "Major 2nd": 2,
  "Minor 3rd": 3,
  "Major 3rd": 4,
  "Perfect 4th": 5,
  Tritone: 6,
  "Perfect 5th": 7,
  "Minor 6th": 8,
  "Major 6th": 9,
  "Minor 7th": 10,
  "Major 7th": 11,
  Octave: 12,
};

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"];
const LETTER_PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

// Circle of fifths order (sharps side then flats side). Db added for the full 12.
export const ROOT_OPTIONS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

// Weighted pool favouring guitar-friendly keys students learn first; Db excluded.
const PRACTICE_KEY_WEIGHTS: Record<string, number> = {
  C: 5, G: 5, D: 5, A: 5, E: 5,
  B: 3, "F#": 3,
  F: 3,
  Bb: 2, Eb: 1, Ab: 1,
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
  const pitch = ((((LETTER_PITCH[letter] ?? 0) + acc) % 12) + 12) % 12;
  return { letterIdx, pitch };
}

function accidental(n: number): string {
  if (n === 0) return "";
  return (n > 0 ? "#" : "b").repeat(Math.abs(n));
}

export function rootPrefersFlats(root: string): boolean {
  return root.includes("b") || root === "F";
}

const SCALE_LETTER_STEPS: Record<string, number[] | null> = {
  Major:                   [0, 1, 2, 3, 4, 5, 6],
  "Natural Minor":         [0, 1, 2, 3, 4, 5, 6],
  "Harmonic Minor":        [0, 1, 2, 3, 4, 5, 6],
  "Melodic Minor":         [0, 1, 2, 3, 4, 5, 6],
  Dorian:                  [0, 1, 2, 3, 4, 5, 6],
  Phrygian:                [0, 1, 2, 3, 4, 5, 6],
  Lydian:                  [0, 1, 2, 3, 4, 5, 6],
  Mixolydian:              [0, 1, 2, 3, 4, 5, 6],
  Aeolian:                 [0, 1, 2, 3, 4, 5, 6],
  Locrian:                 [0, 1, 2, 3, 4, 5, 6],
  "Major Pentatonic":      [0, 1, 2, 4, 5],
  "Minor Pentatonic":      [0, 2, 3, 4, 6],
  Blues:                   [0, 2, 3, 4, 4, 6],
  // HM modes — all heptatonic, use diatonic step mapping
  "HM2 Locrian #6":        [0, 1, 2, 3, 4, 5, 6],
  "HM3 Ionian #5":         [0, 1, 2, 3, 4, 5, 6],
  "HM4 Ukrainian Dorian":  [0, 1, 2, 3, 4, 5, 6],
  "HM5 Phrygian Dominant": [0, 1, 2, 3, 4, 5, 6],
  "HM6 Lydian #2":         [0, 1, 2, 3, 4, 5, 6],
  "HM7 Altered Dim":       [0, 1, 2, 3, 4, 5, 6],
  // MM modes — all heptatonic
  "MM2 Dorian b2":         [0, 1, 2, 3, 4, 5, 6],
  "MM3 Lydian Aug":        [0, 1, 2, 3, 4, 5, 6],
  "MM4 Lydian b7":         [0, 1, 2, 3, 4, 5, 6],
  "MM5 Mixolydian b6":     [0, 1, 2, 3, 4, 5, 6],
  "MM6 Aeolian b5":        [0, 1, 2, 3, 4, 5, 6],
  "MM7 Super Locrian":     [0, 1, 2, 3, 4, 5, 6],
  // Exotic — non-standard structure; use chromatic fallback
  Hirajoshi:               null,
  "Japanese (In)":         null,
  "Hungarian Minor":       null,
  "Double Harmonic":       null,
  "Neapolitan Major":      null,
  "Neapolitan Minor":      null,
  Persian:                 null,
  Arabic:                  null,
  "Romanian Minor":        null,
  "Spanish 8-tone":        null,
  Enigmatic:               null,
  // Symmetric
  "Whole Tone":            null,
  Diminished:              null,
  Chromatic:               null,
};

export const CHORD_LETTER_STEPS: Record<string, number[]> = {
  Major:   [0, 2, 4],
  Minor:   [0, 2, 4],
  aug:     [0, 2, 4],
  dim:     [0, 2, 4],
  "7":     [0, 2, 4, 6],
  maj7:    [0, 2, 4, 6],
  m7:      [0, 2, 4, 6],
  m7b5:    [0, 2, 4, 6],
  dim7:    [0, 2, 4, 6],
  "9":     [0, 2, 4, 6, 1],
  maj9:    [0, 2, 4, 6, 1],
  m9:      [0, 2, 4, 6, 1],
  add9:    [0, 2, 4, 1],
  madd9:   [0, 2, 4, 1],
  "11":    [0, 2, 4, 6, 1, 3],
  maj11:   [0, 2, 4, 6, 1, 3],
  m11:     [0, 2, 4, 6, 1, 3],
  "13":    [0, 2, 4, 6, 1, 3, 5],
  maj13:   [0, 2, 4, 6, 1, 3, 5],
  m13:     [0, 2, 4, 6, 1, 3, 5],
  sus2:    [0, 1, 4],
  sus4:    [0, 3, 4],
  "7sus4": [0, 3, 4, 6],
  "5":     [0, 4],
  "6":     [0, 2, 4, 5],
  m6:      [0, 2, 4, 5],
  "6/9":   [0, 2, 4, 5, 1],
};

function spellWithSteps(root: string, intervals: number[], steps: number[], capDoubles: boolean): string[] {
  const { letterIdx, pitch: rootPitch } = parseNote(root);
  const useFlats = rootPrefersFlats(root);
  return intervals.map((interval, idx) => {
    const target = (rootPitch + interval) % 12;
    const letter = LETTERS[(letterIdx + steps[idx]) % 7];
    let diff = (((target - LETTER_PITCH[letter]) % 12) + 12) % 12;
    if (diff > 6) diff -= 12;
    if (capDoubles && Math.abs(diff) > 1) {
      return (useFlats ? NOTES_FLAT : NOTES_SHARP)[target];
    }
    return letter + accidental(diff);
  });
}

export function spellScale(root: string, scaleName: string, intervals: number[]): string[] {
  const steps = SCALE_LETTER_STEPS[scaleName];
  if (!steps) {
    const { pitch } = parseNote(root);
    const useFlats = rootPrefersFlats(root);
    return intervals.map((i) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[(pitch + i) % 12]);
  }
  return spellWithSteps(root, intervals, steps, false);
}

export function spellChord(root: string, chordName: string, intervals: number[]): string[] {
  const steps = CHORD_LETTER_STEPS[chordName];
  if (!steps) {
    const { pitch } = parseNote(root);
    const useFlats = rootPrefersFlats(root);
    return intervals.map((i) => (useFlats ? NOTES_FLAT : NOTES_SHARP)[(pitch + i) % 12]);
  }
  return spellWithSteps(root, intervals, steps, true);
}

const INTERVAL_LETTER_STEPS: Record<string, number> = {
  Unison: 0,
  "Minor 2nd": 1,
  "Major 2nd": 1,
  "Minor 3rd": 2,
  "Major 3rd": 2,
  "Perfect 4th": 3,
  Tritone: 3,
  "Perfect 5th": 4,
  "Minor 6th": 5,
  "Major 6th": 5,
  "Minor 7th": 6,
  "Major 7th": 6,
  Octave: 0,
};

export interface SpelledDegree {
  note: string;
  degree: string;
}

// Semitones of each major-scale degree (1..7), used as the reference for naming
// degrees with accidentals (e.g. a 3rd that is 3 semitones above the root is b3).
const MAJOR_REF = [0, 2, 4, 5, 7, 9, 11];

function degreeLabel(letterStep: number, interval: number): string {
  const idx = ((letterStep % 7) + 7) % 7;
  const degree = idx + 1;
  let diff = interval - MAJOR_REF[idx];
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  const acc = diff > 0 ? "#".repeat(diff) : diff < 0 ? "b".repeat(-diff) : "";
  return `${acc}${degree}`;
}

export function spellScaleWithDegrees(root: string, scaleName: string): SpelledDegree[] {
  const intervals = SCALES[scaleName] ?? [];
  const notes = spellScale(root, scaleName, intervals);
  const steps = SCALE_LETTER_STEPS[scaleName];
  return notes.map((note, i) => ({
    note,
    degree: steps ? degreeLabel(steps[i], intervals[i]) : `${i + 1}`,
  }));
}

export function spellChordWithDegrees(root: string, chordName: string): SpelledDegree[] {
  const intervals = CHORDS[chordName] ?? [];
  const notes = spellChord(root, chordName, intervals);
  const steps = CHORD_LETTER_STEPS[chordName];
  return notes.map((note, i) => ({
    note,
    degree: steps ? degreeLabel(steps[i], intervals[i]) : `${i + 1}`,
  }));
}

export function chordSymbol(chordName: string): string {
  if (chordName === "Major") return "";
  if (chordName === "Minor") return "m";
  return chordName;
}

// Maps a chord tone's distance from the root (in semitones) to its
// interval-number label, e.g. 4 -> "3", 10 -> "b7". Used by the lessons.
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
// note. A 1st inversion rotates by 1 (3rd in the bass); a 2nd by 2.
export function rotateNotes<T>(notes: T[], by: number): T[] {
  const n = notes.length;
  if (n === 0) return [];
  const k = ((by % n) + n) % n;
  return [...notes.slice(k), ...notes.slice(0, k)];
}

// ─── Shape builders (ported from web musicTheory) ─────────────────────────────
// Used by the fretboard games (Shape Spotter, Alien Invasion, Note Hunt).
// STRINGS index convention: 0 = high e, 5 = low E (matches getNoteValue).
// HighlightCell.string / onTap col convention: 0 = low E, 5 = high e.
// Conversion: col = 5 - stringIndex.

export type ScaleSystem = "caged" | "3nps" | "pent";

export interface ShapeNote {
  string: number; // STRINGS index (0 = high e, 5 = low E)
  fret: number;
  pitch: number;   // pitch class 0–11
  interval: number; // semitones from root 0–11
  isRoot: boolean;
}

export interface ScaleShape {
  system: ScaleSystem;
  root: string;
  scaleName: string;
  index: number;
  label: string;
  notes: ShapeNote[];
  minFret: number;
  maxFret: number;
}

export const CAGED_SCALES = ["Major", "Natural Minor"];

// Pentatonic & Blues always use the 5-box system, never CAGED or 3NPS.
export const PENT_SCALES = ["Major Pentatonic", "Minor Pentatonic", "Blues"];

// ─── Organised section lists for the fretboard explorer picker ────────────────
export interface ScaleSection { header: string; items: string[] }
export const SCALE_SECTIONS: ScaleSection[] = [
  { header: "Core",                   items: ["Major", "Natural Minor", "Harmonic Minor", "Melodic Minor"] },
  { header: "Pentatonic & Blues",     items: ["Major Pentatonic", "Minor Pentatonic", "Blues"] },
  { header: "Major Modes",            items: ["Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"] },
  { header: "Harmonic Minor Modes",   items: ["HM2 Locrian #6", "HM3 Ionian #5", "HM4 Ukrainian Dorian", "HM5 Phrygian Dominant", "HM6 Lydian #2", "HM7 Altered Dim"] },
  { header: "Melodic Minor Modes",    items: ["MM2 Dorian b2", "MM3 Lydian Aug", "MM4 Lydian b7", "MM5 Mixolydian b6", "MM6 Aeolian b5", "MM7 Super Locrian"] },
  { header: "Exotic",                 items: ["Hirajoshi", "Japanese (In)", "Hungarian Minor", "Double Harmonic", "Neapolitan Major", "Neapolitan Minor", "Persian", "Arabic", "Romanian Minor", "Spanish 8-tone"] },
  { header: "Symmetric",              items: ["Whole Tone", "Diminished", "Enigmatic"] },
];

export interface ChordSection { header: string; items: string[] }
export const CHORD_SECTIONS: ChordSection[] = [
  { header: "Triads",     items: ["Major", "Minor", "aug", "dim"] },
  { header: "7ths",       items: ["7", "maj7", "m7", "m7b5", "dim7"] },
  { header: "9ths",       items: ["9", "maj9", "m9", "add9", "madd9"] },
  { header: "11ths",      items: ["11", "maj11", "m11"] },
  { header: "13ths",      items: ["13", "maj13", "m13"] },
  { header: "Suspended",  items: ["sus2", "sus4", "7sus4"] },
  { header: "Other",      items: ["5", "6", "m6", "6/9"] },
];
export const NPS_SCALES = [
  "Major", "Natural Minor", "Dorian", "Phrygian", "Lydian",
  "Mixolydian", "Aeolian", "Locrian", "Harmonic Minor", "Melodic Minor",
];
export const CAGED_POSITION_COUNT = 5;
export const PENT_BOX_COUNT = 5;

const LOW_E_IDX = 5; // STRINGS index for low E

function scalePcSet(rootPitch: number, intervals: number[]): Set<number> {
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

// CAGED major-scale templates for the key of C. Each entry is [stringIdx, fret].
type FP = [number, number];
const CAGED_NAMES = ["C Shape", "A Shape", "G Shape", "E Shape", "D Shape"];
const CAGED_TEMPLATES: FP[][] = [
  // C shape — [1,0] = open B string (degree 7), was missing
  [[5,0],[5,1],[5,3],[4,0],[4,2],[4,3],[3,0],[3,2],[3,3],[2,0],[2,2],[1,0],[1,1],[1,3],[0,0],[0,1],[0,3]],
  // A shape
  [[5,3],[5,5],[5,7],[4,3],[4,5],[3,3],[3,5],[3,7],[2,4],[2,5],[2,7],[1,5],[1,6],[1,8],[0,5],[0,7],[0,8]],
  // G shape
  [[5,5],[5,7],[5,8],[4,5],[4,7],[4,8],[3,5],[3,7],[3,9],[2,5],[2,7],[2,9],[1,8],[1,10],[0,7],[0,8],[0,10]],
  // E shape
  [[5,7],[5,8],[5,10],[4,7],[4,8],[4,10],[3,7],[3,9],[3,10],[2,7],[2,9],[2,10],[1,8],[1,10],[1,12],[0,8],[0,10],[0,12]],
  // D shape
  [[5,10],[5,12],[5,13],[4,10],[4,12],[3,9],[3,10],[3,12],[2,9],[2,10],[2,12],[1,10],[1,12],[1,13],[0,10],[0,12],[0,13]],
];

export function buildCagedShape(root: string, scaleName: string, index: number): ScaleShape {
  const rootPitch = parseNote(root).pitch;
  const pcs = scalePcSet(rootPitch, SCALES[scaleName] ?? []);
  const template = CAGED_TEMPLATES[index % 5];
  const notes: ShapeNote[] = template
    .map(([s, f]): FP => [s, f + rootPitch])
    .filter(([s, f]) => pcs.has((STRINGS[s].open + f) % 12))
    .map(([s, f]) => makeShapeNote(s, f, rootPitch));
  return { system: "caged", root, scaleName, index, label: CAGED_NAMES[index % 5], notes, ...shapeBounds(notes) };
}

function nextScaleAbs(abs: number, pcs: Set<number>): number {
  let n = abs + 1;
  while (!pcs.has(((n % 12) + 12) % 12)) n++;
  return n;
}

function buildNpsNotes(startAbs: number, pcs: Set<number>, rootPitch: number): ShapeNote[] {
  let cur = startAbs;
  const notes: ShapeNote[] = [];
  for (let s = LOW_E_IDX; s >= 0; s--)
    for (let j = 0; j < 3; j++) {
      notes.push(makeShapeNote(s, cur - STRINGS[s].open, rootPitch));
      cur = nextScaleAbs(cur, pcs);
    }
  return notes;
}

export function build3npsShape(root: string, scaleName: string, index: number): ScaleShape {
  const intervals = SCALES[scaleName] ?? [];
  const rootPitch = parseNote(root).pitch;
  const pcs = scalePcSet(rootPitch, intervals);
  const targetPc = (rootPitch + intervals[index % intervals.length]) % 12;
  const startFret = (((targetPc - (STRINGS[LOW_E_IDX].open % 12)) % 12) + 12) % 12;
  // startFret=0 is valid (open-string position, e.g. E major Pattern 1).
  // The negative-fret guard below handles the genuine case where open position
  // would push some notes below fret 0.
  let notes = buildNpsNotes(STRINGS[LOW_E_IDX].open + startFret, pcs, rootPitch);
  if (Math.min(...notes.map((n) => n.fret)) < 0)
    notes = buildNpsNotes(STRINGS[LOW_E_IDX].open + startFret + 12, pcs, rootPitch);
  return { system: "3nps", root, scaleName, index, label: `Pattern ${index + 1}`, notes, ...shapeBounds(notes) };
}

function buildPentNotes(startAbs: number, pcs: Set<number>, rootPitch: number): ShapeNote[] {
  let cur = startAbs;
  const notes: ShapeNote[] = [];
  for (let s = LOW_E_IDX; s >= 0; s--)
    for (let j = 0; j < 2; j++) {
      notes.push(makeShapeNote(s, cur - STRINGS[s].open, rootPitch));
      cur = nextScaleAbs(cur, pcs);
    }
  return notes;
}

export function buildPentBox(root: string, scaleName: string, boxIndex: number): ScaleShape {
  const intervals = SCALES[scaleName] ?? [];
  const rootPitch = parseNote(root).pitch;
  const pcs = scalePcSet(rootPitch, intervals);
  const startInterval = intervals[boxIndex % intervals.length];
  const targetPc = (rootPitch + startInterval) % 12;
  const startFret = (((targetPc - (STRINGS[LOW_E_IDX].open % 12)) % 12) + 12) % 12;
  const startAbs = STRINGS[LOW_E_IDX].open + (startFret === 0 ? 12 : startFret);
  let notes = buildPentNotes(startAbs, pcs, rootPitch);
  if (Math.min(...notes.map((n) => n.fret)) < 0)
    notes = buildPentNotes(startAbs + 12, pcs, rootPitch);
  return { system: "pent", root, scaleName, index: boxIndex, label: `Box ${boxIndex + 1}`, notes, ...shapeBounds(notes) };
}

/** Find all positions of a pitch class (0–11) across the neck. Returns STRINGS-index convention. */
export function findAllNeckPositions(pitchClass: number, maxFrets = 12): ShapeNote[] {
  const r: ShapeNote[] = [];
  for (let s = 0; s < 6; s++)
    for (let f = 0; f <= maxFrets; f++)
      if ((STRINGS[s].open + f) % 12 === pitchClass)
        r.push({ string: s, fret: f, pitch: pitchClass, interval: 0, isRoot: true });
  return r;
}

export function spellInterval(root: string, intervalName: string): string {
  const semis = INTERVALS[intervalName];
  const step = INTERVAL_LETTER_STEPS[intervalName] ?? 0;
  const { letterIdx, pitch: rootPitch } = parseNote(root);
  const target = (rootPitch + semis) % 12;
  const letter = LETTERS[(letterIdx + step) % 7];
  let diff = (((target - LETTER_PITCH[letter]) % 12) + 12) % 12;
  if (diff > 6) diff -= 12;
  if (Math.abs(diff) > 1) {
    return (rootPrefersFlats(root) ? NOTES_FLAT : NOTES_SHARP)[target];
  }
  return letter + accidental(diff);
}
