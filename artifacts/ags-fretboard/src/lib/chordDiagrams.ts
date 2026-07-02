import guitar from "@tombatossals/chords-db/lib/guitar.json";
import { STRINGS, parseNote, rootPrefersFlats, NOTES_FLAT, NOTES_SHARP } from "./musicTheory";

// Open-string pitch classes ordered low-E to high-E (STRINGS is high-to-low, so
// we reverse to match the chord database's string order).
const OPEN_PC = STRINGS.slice()
  .reverse()
  .map((s) => s.open % 12);

// A single playable shape from the chord database. `frets` is ordered low-E to
// high-E: -1 = muted, 0 = open, otherwise the fret position within the diagram
// window. When baseFret > 1 the fret values are relative to baseFret, so the
// real fret is `baseFret + fret - 1`.
export interface ChordPosition {
  frets: number[];
  fingers: number[];
  baseFret: number;
  barres: number[];
}

interface DbChord {
  key: string;
  suffix: string;
  positions: ChordPosition[];
}

const DB = (guitar as unknown as { chords: Record<string, DbChord[]> }).chords;

// Our spelled roots -> chord-db key names. The database stores sharp keys as
// "Csharp"/"Fsharp" and only carries one enharmonic per pitch, so flats map to
// their equivalent (e.g. Db -> Csharp). The shape/pitches are identical.
const ROOT_TO_DB_KEY: Record<string, string> = {
  C: "C",
  "C#": "Csharp",
  Db: "Csharp",
  D: "D",
  "D#": "Eb",
  Eb: "Eb",
  E: "E",
  F: "F",
  "F#": "Fsharp",
  Gb: "Fsharp",
  G: "G",
  "G#": "Ab",
  Ab: "Ab",
  A: "A",
  "A#": "Bb",
  Bb: "Bb",
  B: "B",
};

// Our CHORDS keys -> chord-db suffixes. "5" (power chord) has no database entry,
// so it is intentionally absent and yields no diagram.
const CHORD_TO_SUFFIX: Record<string, string> = {
  Major: "major",
  Minor: "minor",
  dim: "dim",
  aug: "aug",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
  "6": "6",
  m6: "m6",
  "7": "7",
  maj7: "maj7",
  m7: "m7",
  m7b5: "m7b5",
  dim7: "dim7",
  "9": "9",
  "11": "11",
  "13": "13",
};

// Look up the most common playable shape for a chord, or null when the database
// has no entry (e.g. power chords or an unusual root/quality combination).
export function getChordDiagram(root: string, chordKey: string): ChordPosition | null {
  const dbKey = ROOT_TO_DB_KEY[root];
  const suffix = CHORD_TO_SUFFIX[chordKey];
  if (!dbKey || !suffix) return null;
  const entry = DB[dbKey]?.find((c) => c.suffix === suffix);
  return entry?.positions[0] ?? null;
}

// Per-string flag indicating whether a sounding string plays the chord root.
// Covers open strings (fret 0) and barred strings; muted strings are false.
// Ordered low-E to high-E, matching `position.frets`.
export function chordRootFlags(position: ChordPosition, root: string): boolean[] {
  const rootPc = parseNote(root).pitch;
  return position.frets.map((v, i) => {
    if (v < 0) return false; // muted
    const actualFret = v === 0 ? 0 : position.baseFret === 1 ? v : position.baseFret + v - 1;
    return (OPEN_PC[i] + actualFret) % 12 === rootPc;
  });
}

// The role each note plays in the chord, keyed by its semitone distance above
// the root: R = root, 3 = third, 5 = fifth, b7/7 = seventh. This turns a box of
// anonymous dots into "which note is doing what". The 2nd, 4th and 6th are named
// as plain steps for simple chords, but as compound extensions (9, 11, 13) when
// the chord also has a 7th — that is what makes a note a true upper extension.
const FIXED_DEGREE: Record<number, string> = {
  0: "R", 3: "\u266D3", 4: "3", 6: "\u266D5", 7: "5", 8: "\u266F5", 10: "\u266D7", 11: "7",
};
const SIMPLE_STEP: Record<number, string> = { 1: "\u266D2", 2: "2", 5: "4", 9: "6" };
const EXTENSION_STEP: Record<number, string> = { 1: "\u266D9", 2: "9", 5: "11", 9: "13" };

// The semitone intervals (relative to root) present among the sounding strings.
function soundingIntervals(position: ChordPosition, rootPc: number): number[] {
  return position.frets.flatMap((v, i) => {
    if (v < 0) return [];
    const actualFret = v === 0 ? 0 : position.baseFret === 1 ? v : position.baseFret + v - 1;
    return [(((OPEN_PC[i] + actualFret) % 12) - rootPc + 12) % 12];
  });
}

// Per-string scale-degree label (R, 3, 5, b7 ...) relative to the chord root, or
// null for muted strings. Ordered low-E to high-E, matching `position.frets`.
export function chordDegrees(position: ChordPosition, root: string): (string | null)[] {
  const rootPc = parseNote(root).pitch;
  const intervals = soundingIntervals(position, rootPc);
  const hasSeventh = intervals.includes(10) || intervals.includes(11);
  const stepLabels = hasSeventh ? EXTENSION_STEP : SIMPLE_STEP;
  return position.frets.map((v, i) => {
    if (v < 0) return null; // muted
    const actualFret = v === 0 ? 0 : position.baseFret === 1 ? v : position.baseFret + v - 1;
    const interval = (((OPEN_PC[i] + actualFret) % 12) - rootPc + 12) % 12;
    return FIXED_DEGREE[interval] ?? stepLabels[interval] ?? "?";
  });
}

// Per-string note name (C, E, G, F#/Bb ...) relative to the chord root's key, or
// null for muted strings. Ordered low-E to high-E, matching `position.frets`.
// Spelled with flats or sharps to match how the root key is conventionally read.
export function chordNotes(position: ChordPosition, root: string): (string | null)[] {
  const names = rootPrefersFlats(root) ? NOTES_FLAT : NOTES_SHARP;
  return position.frets.map((v, i) => {
    if (v < 0) return null; // muted
    const actualFret = v === 0 ? 0 : position.baseFret === 1 ? v : position.baseFret + v - 1;
    return names[(OPEN_PC[i] + actualFret) % 12];
  });
}
