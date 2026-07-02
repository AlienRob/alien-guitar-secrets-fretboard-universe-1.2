export type Instrument = "guitar" | "bass" | "uke";
export type StringNote = { label: string; midi: number; asset?: string; };
export type TuningPreset = { label: string; strings: StringNote[]; };

const stringAssets = [
  "string_low_E_heavy_wound.svg",
  "string_A_wound.svg",
  "string_D_wound.svg",
  "string_G_plain.svg",
  "string_B_plain.svg",
  "string_high_E_plain.svg",
];

const withAssets = (strings: Omit<StringNote, "asset">[]): StringNote[] =>
  strings.map((s, i) => ({ ...s, asset: stringAssets[Math.min(i, stringAssets.length - 1)] }));

const shift = (strings: StringNote[], semitones: number): StringNote[] =>
  strings.map((s) => ({ ...s, midi: s.midi + semitones }));

// ── 6-string base ──────────────────────────────────────────────
const guitar6 = withAssets([
  { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 },
  { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 },
]);

// ── Bass ───────────────────────────────────────────────────────
const bass4 = withAssets([
  { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 },
]);

const uke4 = withAssets([
  { label: "G", midi: 67 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }, { label: "A", midi: 69 },
]);

export const tunings: Record<Instrument, Record<string, TuningPreset[]>> = {
  guitar: {
    "6": [
      // ── Standard & Down ──────────────────────────────────────
      { label: "Standard Tuning",    strings: guitar6 },
      { label: "Eb Standard",        strings: withAssets([{ label: "Eb", midi: 39 }, { label: "Ab", midi: 44 }, { label: "Db", midi: 49 }, { label: "Gb", midi: 54 }, { label: "Bb", midi: 58 }, { label: "Eb", midi: 63 }]) },
      { label: "D Standard",         strings: withAssets([{ label: "D",  midi: 38 }, { label: "G",  midi: 43 }, { label: "C",  midi: 48 }, { label: "F",  midi: 53 }, { label: "A",  midi: 57 }, { label: "D",  midi: 62 }]) },

      // ── Drop Tunings ─────────────────────────────────────────
      { label: "Drop D",             strings: withAssets([{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
      { label: "Double Drop D",      strings: withAssets([{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "D", midi: 62 }]) },
      { label: "Drop C#",            strings: withAssets([{ label: "C#", midi: 37 }, { label: "G#", midi: 44 }, { label: "C#", midi: 49 }, { label: "F#", midi: 54 }, { label: "A#", midi: 58 }, { label: "D#", midi: 63 }]) },
      { label: "Drop C",             strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "F", midi: 53 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "Drop B",             strings: withAssets([{ label: "B", midi: 35 }, { label: "F#", midi: 42 }, { label: "B", midi: 47 }, { label: "E", midi: 52 }, { label: "G#", midi: 56 }, { label: "C#", midi: 61 }]) },
      { label: "Drop A",             strings: withAssets([{ label: "A", midi: 33 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "F#", midi: 54 }, { label: "B", midi: 59 }]) },

      // ── Open Tunings ─────────────────────────────────────────
      { label: "Open D",             strings: withAssets([{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "F#", midi: 54 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "Open E",             strings: withAssets([{ label: "E", midi: 40 }, { label: "B", midi: 47 }, { label: "E", midi: 52 }, { label: "G#", midi: 56 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
      { label: "Open G",             strings: withAssets([{ label: "D", midi: 38 }, { label: "G", midi: 43 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "D", midi: 62 }]) },
      { label: "Open A",             strings: withAssets([{ label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "C#", midi: 49 }, { label: "E", midi: 52 }, { label: "A", midi: 57 }, { label: "E", midi: 64 }]) },
      { label: "Open C",             strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }]) },
      { label: "Open C Minor",       strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "Eb", midi: 63 }]) },
      { label: "Open D Minor",       strings: withAssets([{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "F", midi: 53 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "Open E Minor",       strings: withAssets([{ label: "E", midi: 40 }, { label: "B", midi: 47 }, { label: "E", midi: 52 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },

      // ── Modal & Acoustic ─────────────────────────────────────
      { label: "DADGAD",             strings: withAssets([{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "DADF#AD",            strings: withAssets([{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "F#", midi: 54 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "CGDGCD",             strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "D", midi: 62 }]) },
      { label: "CACGCE",             strings: withAssets([{ label: "C", midi: 36 }, { label: "A", midi: 45 }, { label: "C", midi: 48 }, { label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }]) },
      { label: "CGDGAD",             strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },

      // ── System Tunings ───────────────────────────────────────
      { label: "New Standard",       strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "D", midi: 50 }, { label: "A", midi: 57 }, { label: "E", midi: 64 }, { label: "G", midi: 67 }]) },
      { label: "All Fourths",        strings: withAssets([{ label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "F", midi: 65 }]) },
      { label: "Major Thirds",       strings: withAssets([{ label: "E", midi: 40 }, { label: "G#", midi: 44 }, { label: "C", midi: 48 }, { label: "E", midi: 52 }, { label: "G#", midi: 56 }, { label: "C", midi: 60 }]) },
      { label: "All Fifths",         strings: withAssets([{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "D", midi: 50 }, { label: "A", midi: 57 }, { label: "E", midi: 64 }, { label: "B", midi: 71 }]) },
      { label: "Nashville",          strings: withAssets([{ label: "E", midi: 52 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }, { label: "G", midi: 67 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
    ],
    "7": [
      { label: "Standard Tuning",       strings: withAssets([{ label: "B", midi: 35 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
      { label: "Drop A",                strings: withAssets([{ label: "A", midi: 33 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
      { label: "Drop G#",               strings: withAssets([{ label: "G#", midi: 32 }, { label: "D#", midi: 39 }, { label: "G#", midi: 44 }, { label: "C#", midi: 49 }, { label: "F#", midi: 54 }, { label: "A#", midi: 58 }, { label: "D#", midi: 63 }]) },
      { label: "Drop G",                strings: withAssets([{ label: "G", midi: 31 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "F", midi: 53 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "A Standard",            strings: withAssets([{ label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "F", midi: 53 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
      { label: "Half-step Down",        strings: withAssets([{ label: "A#", midi: 34 }, { label: "D#", midi: 39 }, { label: "G#", midi: 44 }, { label: "C#", midi: 49 }, { label: "F#", midi: 54 }, { label: "A#", midi: 58 }, { label: "D#", midi: 63 }]) },
    ],
    "8": [
      { label: "Standard Tuning",       strings: withAssets([{ label: "F#", midi: 30 }, { label: "B", midi: 35 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
      { label: "Drop E",                strings: withAssets([{ label: "E", midi: 28 }, { label: "B", midi: 35 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }]) },
      { label: "Drop D#",               strings: withAssets([{ label: "D#", midi: 27 }, { label: "A#", midi: 34 }, { label: "D#", midi: 39 }, { label: "G#", midi: 44 }, { label: "C#", midi: 49 }, { label: "F#", midi: 54 }, { label: "A#", midi: 58 }, { label: "D#", midi: 63 }]) },
      { label: "F Standard",            strings: withAssets([{ label: "F", midi: 29 }, { label: "Bb", midi: 34 }, { label: "Eb", midi: 39 }, { label: "Ab", midi: 44 }, { label: "Db", midi: 49 }, { label: "Gb", midi: 54 }, { label: "Bb", midi: 58 }, { label: "Eb", midi: 63 }]) },
      { label: "E Standard",            strings: withAssets([{ label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "F", midi: 53 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }]) },
    ],
    "12": [
      { label: "Standard Tuning", strings: guitar6 },
      { label: "Eb Standard",     strings: shift(guitar6, -1) },
      { label: "D Standard",      strings: shift(guitar6, -2) },
    ],
  },
  bass: {
    "4": [
      { label: "Standard Tuning", strings: bass4 },
      { label: "Semitone Down",   strings: shift(bass4, -1) },
      { label: "Whole Tone Down", strings: shift(bass4, -2) },
      { label: "Drop D",          strings: withAssets([{ label: "D", midi: 26 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }]) },
    ],
    "5": [
      { label: "Standard Tuning", strings: withAssets([{ label: "B", midi: 23 }, { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }]) },
      { label: "Semitone Down",   strings: shift(withAssets([{ label: "B", midi: 23 }, { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }]), -1) },
    ],
    "6": [
      { label: "Standard Tuning", strings: withAssets([{ label: "B", midi: 23 }, { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }]) },
    ],
  },
  uke: {
    "4": [
      { label: "Standard Tuning", strings: uke4 },
      { label: "Low G",           strings: withAssets([{ label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }, { label: "A", midi: 69 }]) },
      { label: "Semitone Down",   strings: shift(uke4, -1) },
    ],
    "6": [
      { label: "Standard Tuning", strings: withAssets([{ label: "G", midi: 67 }, { label: "C", midi: 60 }, { label: "C", midi: 72 }, { label: "E", midi: 64 }, { label: "A", midi: 57 }, { label: "A", midi: 69 }]) },
    ],
  },
};
