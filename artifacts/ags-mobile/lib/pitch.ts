/**
 * Pitch detection + note analysis for the "Note Check" ear trainer.
 *
 * The microphone capture is platform-specific (see hooks/useMicPitch.ts), but
 * the maths here is pure and shared:
 *
 * - `detectPitchAutocorrelation` turns a window of raw audio samples (web) into
 *   a fundamental frequency in Hz using the well-known ACF2+ autocorrelation
 *   method (RMS gate -> trim -> autocorrelate -> parabolic interpolation).
 * - `analyzeFreq` turns a frequency into the nearest note (name, octave, and how
 *   many cents sharp/flat it is).
 * - `samePitchClass` answers "is this the right note?" ignoring octave, which is
 *   what a beginner needs ("play an A" — any A counts).
 *
 * MIDI mapping mirrors lib/audio.ts: musicTheory pitch value + 24 = MIDI number.
 */
import { NOTES_FLAT, NOTES_SHARP } from "./musicTheory";

const A4_HZ = 440;
const VALUE_TO_MIDI = 24; // keep in sync with lib/audio.ts

/** Lowest/highest frequencies we trust (a hair below low E2, above high E note runs). */
const MIN_HZ = 70; // ~ below E2 (82 Hz) with margin
const MAX_HZ = 1400; // well above the 24th fret on the high E string

export function freqToMidiFloat(hz: number): number {
  return 69 + 12 * Math.log2(hz / A4_HZ);
}

export function midiToFreq(midi: number): number {
  return A4_HZ * Math.pow(2, (midi - 69) / 12);
}

/** musicTheory pitch value -> MIDI number. */
export function valueToMidi(value: number): number {
  return value + VALUE_TO_MIDI;
}

/** Pitch class (0-11) of a MIDI number / value. */
export function midiPitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export interface PitchReading {
  /** Detected frequency in Hz. */
  hz: number;
  /** Nearest MIDI number. */
  midi: number;
  /** musicTheory pitch value (midi - 24). */
  value: number;
  /** Pitch class 0-11 (C=0). */
  pitchClass: number;
  /** Note name without octave, e.g. "A" or "Bb". */
  name: string;
  /** Octave number (scientific pitch notation, A4 = 440). */
  octave: number;
  /** Deviation from the nearest note, -50..+50 cents (negative = flat). */
  cents: number;
}

/**
 * Turn a frequency into the nearest note. `useSharps` controls the spelling of
 * the pitch-class name (C# vs Db); pass the key's preference when you have one.
 * Returns null for nonsense / out-of-range input.
 */
export function analyzeFreq(hz: number, useSharps = true): PitchReading | null {
  if (!hz || !isFinite(hz) || hz < MIN_HZ || hz > MAX_HZ) return null;
  const midiFloat = freqToMidiFloat(hz);
  const midi = Math.round(midiFloat);
  const cents = Math.round((midiFloat - midi) * 100);
  const pitchClass = midiPitchClass(midi);
  const name = (useSharps ? NOTES_SHARP : NOTES_FLAT)[pitchClass];
  const octave = Math.floor(midi / 12) - 1;
  return { hz, midi, value: midi - VALUE_TO_MIDI, pitchClass, name, octave, cents };
}

/** True if the reading is the same note name as the target (ignoring octave). */
export function samePitchClass(midi: number, targetPitchClass: number): boolean {
  return midiPitchClass(midi) === ((targetPitchClass % 12) + 12) % 12;
}

/**
 * Estimate a fundamental frequency from a window of mono float samples
 * (-1..1) using normalized autocorrelation (ACF2+). Returns null when the
 * signal is too quiet or no clear pitch is found.
 */
export function detectPitchAutocorrelation(
  buf: Float32Array,
  sampleRate: number,
): number | null {
  const SIZE = buf.length;
  if (SIZE === 0) return null;

  // Volume gate: ignore silence / room noise.
  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return null;

  // Trim near-silent head/tail so the autocorrelation locks onto the note body.
  let r1 = 0;
  let r2 = SIZE - 1;
  const thres = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buf[i]) < thres) r1 = i;
    else break;
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buf[SIZE - i]) < thres) r2 = SIZE - i;
    else break;
  }

  const b = buf.slice(r1, r2);
  const n = b.length;
  if (n < 2) return null;

  const c = new Array<number>(n).fill(0);
  for (let lag = 0; lag < n; lag++) {
    for (let i = 0; i < n - lag; i++) c[lag] += b[i] * b[i + lag];
  }

  // Walk past the initial downward slope, then take the highest peak.
  let d = 0;
  while (d < n - 1 && c[d] > c[d + 1]) d++;
  let maxval = -1;
  let maxpos = -1;
  for (let i = d; i < n; i++) {
    if (c[i] > maxval) {
      maxval = c[i];
      maxpos = i;
    }
  }
  if (maxpos <= 0) return null;

  // Parabolic interpolation around the peak for sub-sample accuracy.
  let T0 = maxpos;
  const x1 = c[T0 - 1] ?? 0;
  const x2 = c[T0] ?? 0;
  const x3 = c[T0 + 1] ?? 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const bb = (x3 - x1) / 2;
  if (a) T0 = T0 - bb / (2 * a);
  if (!T0 || !isFinite(T0)) return null;

  const hz = sampleRate / T0;
  if (hz < MIN_HZ || hz > MAX_HZ) return null;
  return hz;
}
