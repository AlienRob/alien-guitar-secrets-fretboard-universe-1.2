// Shared Web Audio engine for note + interval playback.
//
// Primary tone source is a small set of real acoustic-guitar note samples
// (~150KB total). For any requested pitch we pick the nearest sampled note and
// pitch-shift it slightly via playbackRate, which sounds far more realistic
// than pure synthesis while staying tiny to download. If the samples fail to
// load we fall back to Karplus-Strong plucked-string synthesis.
//
// A single AudioContext is reused for the lifetime of the app. We always
// resume it (and await the resume) before scheduling sound, otherwise the
// first notes get scheduled against a frozen clock and never sound.

import E2 from "../assets/guitar/E2.mp3";
import A2 from "../assets/guitar/A2.mp3";
import D3 from "../assets/guitar/D3.mp3";
import G3 from "../assets/guitar/G3.mp3";
import B3 from "../assets/guitar/B3.mp3";
import E4 from "../assets/guitar/E4.mp3";
import A4 from "../assets/guitar/A4.mp3";
import C5 from "../assets/guitar/C5.mp3";
import E5 from "../assets/guitar/E5.mp3";

// The fretboard note values (see musicTheory.ts) are offset from standard
// MIDI: app value 40 == E4 == MIDI 64, so realMidi = appValue + 24.
export const APP_MIDI_OFFSET = 24;

// MIDI number -> sample URL for each recorded note.
const SAMPLE_SOURCES: { midi: number; url: string }[] = [
  { midi: 40, url: E2 },
  { midi: 45, url: A2 },
  { midi: 50, url: D3 },
  { midi: 55, url: G3 },
  { midi: 59, url: B3 },
  { midi: 64, url: E4 },
  { midi: 69, url: A4 },
  { midi: 72, url: C5 },
  { midi: 76, url: E5 },
];

let ctx: AudioContext | null = null;
const sampleBuffers = new Map<number, AudioBuffer>();
let loadPromise: Promise<void> | null = null;
let samplesReady = false;

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

async function ensureRunning(c: AudioContext): Promise<void> {
  if (c.state === "suspended") {
    try {
      await c.resume();
    } catch {
      // ignore — some browsers reject if not triggered by a gesture
    }
  }
}

let unlockInstalled = false;

// Mobile browsers (especially Android Chrome / Samsung Internet) start the
// AudioContext suspended and only allow resuming it from inside a real user
// gesture. Install one-time global listeners so the very first tap/keypress
// anywhere unlocks audio for the rest of the session, even before the user
// reaches a screen that plays a note.
export function installAudioUnlock(): void {
  if (unlockInstalled || typeof window === "undefined") return;
  unlockInstalled = true;
  const unlock = () => {
    const c = getCtx();
    void c.resume().catch(() => {});
    // A one-sample silent buffer is needed on some mobile builds to fully open
    // the output path so later notes actually sound.
    try {
      const b = c.createBuffer(1, 1, c.sampleRate);
      const s = c.createBufferSource();
      s.buffer = b;
      s.connect(c.destination);
      s.start(0);
    } catch {
      // ignore
    }
    if (c.state === "running") {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("touchend", unlock);
      window.removeEventListener("keydown", unlock);
    }
  };
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("touchend", unlock);
  window.addEventListener("keydown", unlock);
}

function loadSamples(c: AudioContext): Promise<void> {
  if (!loadPromise) {
    loadPromise = (async () => {
      await Promise.all(
        SAMPLE_SOURCES.map(async ({ midi, url }) => {
          try {
            const res = await fetch(url);
            if (!res.ok) return;
            const arr = await res.arrayBuffer();
            const buf = await c.decodeAudioData(arr);
            sampleBuffers.set(midi, buf);
          } catch {
            // a missing sample just means we fall back / use a neighbour
          }
        }),
      );
      samplesReady = sampleBuffers.size > 0;
    })();
  }
  return loadPromise;
}

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function nearestSample(midi: number): { buffer: AudioBuffer; baseMidi: number } | null {
  let best: number | null = null;
  let bestDist = Infinity;
  for (const m of sampleBuffers.keys()) {
    const d = Math.abs(m - midi);
    if (d < bestDist) {
      bestDist = d;
      best = m;
    }
  }
  if (best === null) return null;
  return { buffer: sampleBuffers.get(best)!, baseMidi: best };
}

// Global output level for note playback (notes, intervals and the completion
// trill all run through this). The guitar samples are recorded quietly, so this
// brings them up to a comfortable level that sits evenly with the narration and
// other sounds — without being so hot it clips or forces players to turn their
// device volume down. Raised from 1/3 (which left intervals too quiet to hear)
// while staying below the original full level that was overpowering on phones.
const OUTPUT_GAIN = 0.6;

function playSample(
  c: AudioContext,
  midi: number,
  startOffset: number,
  duration: number,
  peak: number,
): boolean {
  peak *= OUTPUT_GAIN;
  const near = nearestSample(midi);
  if (!near) return false;

  const src = c.createBufferSource();
  src.buffer = near.buffer;
  src.playbackRate.value = Math.pow(2, (midi - near.baseMidi) / 12);

  const gain = c.createGain();
  src.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + startOffset;
  gain.gain.setValueAtTime(peak, t);
  gain.gain.setValueAtTime(peak, t + Math.max(0.05, duration - 0.18));
  gain.gain.linearRampToValueAtTime(0.0001, t + duration);

  src.start(t);
  src.stop(t + duration + 0.05);
  return true;
}

// --- Karplus-Strong fallback synthesis ---------------------------------------

function renderPluck(c: AudioContext, freq: number, duration: number): AudioBuffer {
  const sr = c.sampleRate;
  const len = Math.max(1, Math.floor(sr * duration));
  const buffer = c.createBuffer(1, len, sr);
  const data = buffer.getChannelData(0);

  const N = Math.max(2, Math.round(sr / freq));
  const decay = 0.99 + Math.min(0.0094, 12 / freq);

  let last = 0;
  for (let i = 0; i < len; i++) {
    if (i < N) {
      const white = Math.random() * 2 - 1;
      last = (white + last) * 0.5;
      data[i] = last;
    } else {
      data[i] = decay * 0.5 * (data[i - N] + data[i - N + 1]);
    }
  }
  return buffer;
}

function playPluck(
  c: AudioContext,
  freq: number,
  startOffset: number,
  duration: number,
  peak: number,
): void {
  peak *= OUTPUT_GAIN;
  const buffer = renderPluck(c, freq, duration);
  const src = c.createBufferSource();
  src.buffer = buffer;

  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = Math.min(7000, Math.max(1800, freq * 6));
  filter.Q.value = 0.7;

  const gain = c.createGain();
  src.connect(filter);
  filter.connect(gain);
  gain.connect(c.destination);

  const t = c.currentTime + startOffset;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(peak, t + 0.005);
  gain.gain.setValueAtTime(peak, t + Math.max(0.05, duration - 0.12));
  gain.gain.linearRampToValueAtTime(0.0001, t + duration);

  src.start(t);
  src.stop(t + duration + 0.02);
}

// --- Public API --------------------------------------------------------------

async function scheduleNote(
  midi: number,
  startOffset: number,
  duration: number,
  peak: number,
): Promise<void> {
  const c = getCtx();
  await ensureRunning(c);
  if (!samplesReady) await loadSamples(c);
  if (!playSample(c, midi, startOffset, duration, peak)) {
    playPluck(c, midiToFreq(midi), startOffset, duration, peak);
  }
}

export async function playMidiNote(midi: number, duration = 2.2): Promise<void> {
  await scheduleNote(midi, 0, duration, 0.9);
}

export async function playFrequency(freq: number, duration = 2.2): Promise<void> {
  const midi = Math.round(69 + 12 * Math.log2(freq / 440));
  await scheduleNote(midi, 0, duration, 0.9);
}

// Play a note identified by the app's fretboard value (open string + fret).
export async function playFretNote(appValue: number, duration = 2.2): Promise<void> {
  await playMidiNote(appValue + APP_MIDI_OFFSET, duration);
}

export async function playInterval(
  rootMidi: number,
  semitones: number,
  harmonic = false,
): Promise<void> {
  if (harmonic) {
    await Promise.all([
      scheduleNote(rootMidi, 0, 2.4, 0.7),
      scheduleNote(rootMidi + semitones, 0, 2.4, 0.7),
    ]);
  } else {
    await scheduleNote(rootMidi, 0, 1.6, 0.9);
    await scheduleNote(rootMidi + semitones, 0.7, 2.0, 0.9);
  }
}

// Brief, bright "challenge complete" flourish: two voices a major sixth apart
// rapidly trilling between two scale tones, ending on a held note. Distinct
// from (and much shorter than) the level-up shred lick. Self-guards against
// overlapping playback so replaying a mission can't stack copies, and stays
// silent if the AudioContext can't run (autoplay/gesture restrictions).
let trillPlaying = false;

export async function playChallengeCompleteTrill(): Promise<void> {
  if (trillPlaying) return;
  trillPlaying = true;
  try {
    const c = getCtx();
    await ensureRunning(c);
    if (c.state !== "running") return;
    if (!samplesReady) await loadSamples(c);

    const lowerA = 69; // A4
    const lowerB = 71; // B4
    const sixth = 9; // major sixth above the lower voice
    const step = 0.07; // gap between trill notes
    const count = 7; // odd so we land back on the A pair
    for (let i = 0; i < count; i++) {
      const last = i === count - 1;
      const lower = i % 2 === 0 ? lowerA : lowerB;
      const dur = last ? 0.55 : 0.12;
      const peak = last ? 0.55 : 0.42;
      void scheduleNote(lower, i * step, dur, peak);
      void scheduleNote(lower + sixth, i * step, dur, peak * 0.85);
    }
    if (typeof window !== "undefined") {
      window.setTimeout(
        () => {
          trillPlaying = false;
        },
        count * step * 1000 + 700,
      );
    } else {
      trillPlaying = false;
    }
  } catch {
    trillPlaying = false;
  }
}
