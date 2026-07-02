export type Instrument = "electric" | "acoustic" | "bass" | "uke";
export type StringNote = { label: string; midi: number };
export type TuningPreset = { label: string; strings: StringNote[] };

const shift = (strings: StringNote[], semitones: number): StringNote[] =>
  strings.map((s) => ({ ...s, midi: s.midi + semitones }));

const guitar6: StringNote[] = [
  { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 },
  { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 },
];
const bass4: StringNote[] = [
  { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 },
];
const uke4: StringNote[] = [
  { label: "G", midi: 67 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }, { label: "A", midi: 69 },
];

const guitarTunings: Record<string, TuningPreset[]> = {
  "6": [
    { label: "Standard Tuning",  strings: guitar6 },
    { label: "Eb Standard",      strings: [{ label: "Eb", midi: 39 }, { label: "Ab", midi: 44 }, { label: "Db", midi: 49 }, { label: "Gb", midi: 54 }, { label: "Bb", midi: 58 }, { label: "Eb", midi: 63 }] },
    { label: "D Standard",       strings: [{ label: "D",  midi: 38 }, { label: "G",  midi: 43 }, { label: "C",  midi: 48 }, { label: "F",  midi: 53 }, { label: "A",  midi: 57 }, { label: "D",  midi: 62 }] },
    { label: "Drop D",           strings: [{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
    { label: "Drop C",           strings: [{ label: "C", midi: 36 }, { label: "G", midi: 43 }, { label: "C", midi: 48 }, { label: "F", midi: 53 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }] },
    { label: "Open D",           strings: [{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "F#", midi: 54 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }] },
    { label: "Open E",           strings: [{ label: "E", midi: 40 }, { label: "B", midi: 47 }, { label: "E", midi: 52 }, { label: "G#", midi: 56 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
    { label: "Open G",           strings: [{ label: "D", midi: 38 }, { label: "G", midi: 43 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "D", midi: 62 }] },
    { label: "Open A",           strings: [{ label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "C#", midi: 49 }, { label: "E", midi: 52 }, { label: "A", midi: 57 }, { label: "E", midi: 64 }] },
    { label: "DADGAD",           strings: [{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }] },
    { label: "Double Drop D",    strings: [{ label: "D", midi: 38 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "D", midi: 62 }] },
    { label: "Nashville",        strings: [{ label: "E", midi: 52 }, { label: "A", midi: 57 }, { label: "D", midi: 62 }, { label: "G", midi: 67 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
  ],
  "7": [
    { label: "Standard Tuning",  strings: [{ label: "B", midi: 35 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
    { label: "Drop A",           strings: [{ label: "A", midi: 33 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
  ],
  "8": [
    { label: "Standard Tuning",  strings: [{ label: "F#", midi: 30 }, { label: "B", midi: 35 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
    { label: "Drop E",           strings: [{ label: "E", midi: 28 }, { label: "B", midi: 35 }, { label: "E", midi: 40 }, { label: "A", midi: 45 }, { label: "D", midi: 50 }, { label: "G", midi: 55 }, { label: "B", midi: 59 }, { label: "E", midi: 64 }] },
  ],
  "12": [
    { label: "Standard Tuning",  strings: guitar6 },
    { label: "Eb Standard",      strings: shift(guitar6, -1) },
  ],
};

export const tunings: Record<Instrument, Record<string, TuningPreset[]>> = {
  electric: guitarTunings,
  acoustic: guitarTunings,
  bass: {
    "4": [
      { label: "Standard Tuning",  strings: bass4 },
      { label: "Drop D",           strings: [{ label: "D", midi: 26 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }] },
      { label: "Semitone Down",    strings: shift(bass4, -1) },
    ],
    "5": [
      { label: "Standard Tuning",  strings: [{ label: "B", midi: 23 }, { label: "E", midi: 28 }, { label: "A", midi: 33 }, { label: "D", midi: 38 }, { label: "G", midi: 43 }] },
    ],
  },
  uke: {
    "4": [
      { label: "Standard Tuning",  strings: uke4 },
      { label: "Low G",            strings: [{ label: "G", midi: 55 }, { label: "C", midi: 60 }, { label: "E", midi: 64 }, { label: "A", midi: 69 }] },
      { label: "Semitone Down",    strings: shift(uke4, -1) },
    ],
  },
};

/**
 * Per-instrument detection profile.
 *
 * WebView chain (native/iOS):
 *   preGain     — software pre-amplifier multiplier (NSDF is normalised, so this
 *                 boosts quiet sources without shifting pitch readings)
 *   hpFreq      — highpass filter cut-off (Hz); keep below the lowest open string
 *   lpFreq      — lowpass filter cut-off (Hz); cut high-freq noise above harmonics
 *   rmsGate     — silence threshold; frames below this are discarded immediately
 *   clarityMin  — NSDF minimum clarity; aperiodic noise scores well below 0.3
 *
 * Web / iOS MPM engine (useTunerPitch):
 *   minFreq          — minimum frequency passed to PitchDetectorMPM
 *   maxFreq          — maximum frequency passed to PitchDetectorMPM
 *   noiseGate        — RMS gate inside PitchDetectorMPM
 *   clarityThreshold — MPM clarity threshold inside PitchDetectorMPM
 */
export type DetectionProfile = {
  preGain:          number;
  hpFreq:           number;
  lpFreq:           number;
  rmsGate:          number;
  clarityMin:       number;
  minFreq:          number;
  maxFreq:          number;
  noiseGate:        number;
  clarityThreshold: number;
};

export const detectionProfiles: Record<Instrument, DetectionProfile> = {
  electric: {
    preGain: 1.5, hpFreq: 65,  lpFreq: 1800, rmsGate: 0.005, clarityMin: 0.36,
    minFreq: 75,  maxFreq: 1100, noiseGate: 0.012, clarityThreshold: 0.84,
  },
  acoustic: {
    preGain: 2.5, hpFreq: 65,  lpFreq: 1800, rmsGate: 0.004, clarityMin: 0.30,
    minFreq: 75,  maxFreq: 1100, noiseGate: 0.008, clarityThreshold: 0.78,
  },
  bass: {
    preGain: 2.0, hpFreq: 30,  lpFreq: 600,  rmsGate: 0.005, clarityMin: 0.30,
    minFreq: 28,  maxFreq: 350, noiseGate: 0.010, clarityThreshold: 0.78,
  },
  uke: {
    preGain: 2.0, hpFreq: 220, lpFreq: 2000, rmsGate: 0.005, clarityMin: 0.34,
    minFreq: 220, maxFreq: 1200, noiseGate: 0.010, clarityThreshold: 0.82,
  },
};
