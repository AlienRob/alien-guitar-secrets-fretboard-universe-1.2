/**
 * Lightweight tone generator for the Fretboard explorer so tapped notes (and
 * whole scales/chords) actually sound. No samples are bundled: we synthesize a
 * short plucked-string tone per pitch.
 *
 * - Native (iOS/Android, Expo Go): render a mono 16-bit WAV in JS, write it to
 *   memory as a base64 data: URI, and play it with expo-av.
 * - Web (preview): use the Web Audio API with a PeriodicWave whose harmonic
 *   amplitudes match the native synthesis exactly.
 *
 * `value` here is the musicTheory pitch value (see getNoteValue); MIDI = value + 24
 * (string value 40 = high E4 = MIDI 64).
 */
import { Platform } from "react-native";

const SAMPLE_RATE = 22050;
const VALUE_TO_MIDI = 24;
const TONE_SECONDS = 1.4;

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function valueToFreq(value: number): number {
  return midiToFreq(value + VALUE_TO_MIDI);
}

// ---------------------------------------------------------------------------
// Shared synthesis (used to build WAVs on native)
// Harmonics: fundamental + 2nd (×0.45) + 3rd (×0.22) + 4th (×0.12)
// Envelope:  5 ms linear attack, then exponential decay (τ ≈ 1/4.2 s)
// ---------------------------------------------------------------------------
function renderTone(freq: number, durationSec: number): Float32Array {
  const n = Math.floor(SAMPLE_RATE * durationSec);
  const out = new Float32Array(n);
  const decay = 4.2;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.005);
    const env = attack * Math.exp(-decay * t);
    let s = Math.sin(2 * Math.PI * freq * t);
    s += 0.45 * Math.sin(2 * Math.PI * 2 * freq * t);
    s += 0.22 * Math.sin(2 * Math.PI * 3 * freq * t);
    s += 0.12 * Math.sin(2 * Math.PI * 4 * freq * t);
    out[i] = (s / 1.79) * env * 1.6;
  }
  return out;
}

function encodeWav(samples: Float32Array): Uint8Array {
  const n = samples.length;
  const buffer = new ArrayBuffer(44 + n * 2);
  const view = new DataView(buffer);
  const writeStr = (off: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + n * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(off, v < 0 ? v * 0x8000 : v * 0x7fff, true);
    off += 2;
  }
  return new Uint8Array(buffer);
}

// ---------------------------------------------------------------------------
// Web Audio backend
//
// Uses a PeriodicWave with the same harmonic amplitudes as renderTone() so
// the web preview sounds identical to the native WAV path.
// The wave is shared across all notes (frequency is set per-oscillator).
// ---------------------------------------------------------------------------
let webCtx: AudioContext | null = null;

function getWebCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (webCtx == null) webCtx = new Ctor();
  return webCtx;
}

// PeriodicWave: sine components matching renderTone() harmonics (imag = sin coeffs).
// real = cosine terms (all zero for a pure-sine stack).
// disableNormalization keeps our relative levels intact.
let _wave: PeriodicWave | null = null;
let _waveCtx: AudioContext | null = null;

function getGuitarWave(ctx: AudioContext): PeriodicWave {
  if (_wave && _waveCtx === ctx) return _wave;
  const real = new Float32Array([0, 0,    0,    0,    0]);
  const imag = new Float32Array([0, 1, 0.45, 0.22, 0.12]);
  _wave = ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  _waveCtx = ctx;
  return _wave;
}

function playWeb(value: number, delaySec: number) {
  const ctx = getWebCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();
  const freq = valueToFreq(value);
  const t0 = ctx.currentTime + delaySec;

  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.setPeriodicWave(getGuitarWave(ctx));
  osc.frequency.value = freq;

  // Same envelope shape as renderTone(): ~5 ms attack, exponential decay to silence
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(0.65, t0 + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + TONE_SECONDS);

  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + TONE_SECONDS);
}

// ---------------------------------------------------------------------------
// Native backend — expo-av + data: URI (no file system dependency)
// ---------------------------------------------------------------------------

interface LoadedPlayer {
  play: () => void;
}

const nativePending = new Map<number, Promise<LoadedPlayer | null>>();
const nativePlayers = new Map<number, LoadedPlayer>();

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}


async function buildNativePlayer(value: number): Promise<LoadedPlayer | null> {
  try {
    const { Audio } = require("expo-av") as typeof import("expo-av");

    const wav = encodeWav(renderTone(valueToFreq(value), TONE_SECONDS));
    const uri = `data:audio/wav;base64,${uint8ToBase64(wav)}`;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });

    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });

    const player: LoadedPlayer = {
      play: () => { void sound.replayAsync().catch(() => {}); },
    };

    nativePlayers.set(value, player);
    return player;
  } catch {
    return null;
  }
}

function getNativePlayer(value: number): Promise<LoadedPlayer | null> {
  const cached = nativePlayers.get(value);
  if (cached) return Promise.resolve(cached);
  const pending = nativePending.get(value);
  if (pending) return pending as Promise<LoadedPlayer | null>;
  const p = buildNativePlayer(value).finally(() => nativePending.delete(value));
  nativePending.set(value, p);
  return p;
}

function playNative(value: number, delayMs: number) {
  const start = () => {
    void getNativePlayer(value).then((player) => {
      if (!player) return;
      try { player.play(); } catch { /* ignore */ }
    });
  };
  if (delayMs > 0) setTimeout(start, delayMs);
  else start();
}

// ---------------------------------------------------------------------------
// In-tune ping — short bright chime played on the rising edge of inTune
// ---------------------------------------------------------------------------

function renderPing(): Float32Array {
  const DUR = 0.5;
  const FREQ = 1047; // C6 — bright, clear
  const n = Math.floor(SAMPLE_RATE * DUR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const env = Math.min(1, t / 0.002) * Math.exp(-8 * t);
    out[i] = 0.85 * Math.sin(2 * Math.PI * FREQ * t) * env;
  }
  return out;
}

let _pingPlayer: LoadedPlayer | null = null;
let _pingBuilding = false;

async function buildPingPlayer(): Promise<void> {
  try {
    const { Audio } = require("expo-av") as typeof import("expo-av");
    const wav = encodeWav(renderPing());
    const uri = `data:audio/wav;base64,${uint8ToBase64(wav)}`;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    _pingPlayer = { play: () => { void sound.replayAsync().catch(() => {}); } };
  } catch { /* no-op */ }
  _pingBuilding = false;
}

/** Play a short in-tune chime. Call on the rising edge of the inTune flag only. */
export function playInTunePing() {
  if (Platform.OS === "web") {
    const ctx = getWebCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    const t0   = ctx.currentTime;
    osc.frequency.value = 1047;
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.35, t0 + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.5);
  } else {
    if (_pingPlayer) {
      try { _pingPlayer.play(); } catch { /* ignore */ }
    } else if (!_pingBuilding) {
      _pingBuilding = true;
      void buildPingPlayer().then(() => {
        try { _pingPlayer?.play(); } catch { /* ignore */ }
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Drill-complete trill — two voices a major sixth apart, rapidly trilling
// between two scale tones and ending on a held note. Mirrors the web app's
// playChallengeCompleteTrill(). Played once when the drill result screen
// appears for normal (non-level-up) completions.
// ---------------------------------------------------------------------------

// "Excellent lick" — fast E-minor-pentatonic ascending shred run, each note
// bending up to pitch, soft-clip distortion for electric crunch, vibrato
// sweeping in on the held top note. Sounds like a triumphant 80s guitar moment.
function renderExcellentLick(): Float32Array {
  const VIBRATO_RATE  = 5.8;  // Hz
  const VIBRATO_DEPTH = 0.013; // ± ~27 cents
  const DRIVE         = 2.8;  // tanh soft-clip drive

  // E-minor pentatonic: E4 → G4 → A4 → C5 → D5 → E5 (held)
  const notes: { freq: number; dur: number; bendSt: number }[] = [
    { freq: 329.63, dur: 0.085, bendSt: 2.0 },
    { freq: 392.00, dur: 0.085, bendSt: 1.8 },
    { freq: 440.00, dur: 0.085, bendSt: 1.5 },
    { freq: 523.25, dur: 0.085, bendSt: 1.5 },
    { freq: 587.33, dur: 0.085, bendSt: 1.5 },
    { freq: 659.25, dur: 0.72,  bendSt: 0.3 }, // top note: held + vibrato
  ];

  const totalDur = notes.reduce((s, n) => s + n.dur, 0) + 0.15;
  const N = Math.floor(SAMPLE_RATE * totalDur);
  const out = new Float32Array(N);
  const tanhDrive = Math.tanh(DRIVE);

  let globalPos = 0;
  for (const note of notes) {
    const noteSamples = Math.floor(note.dur * SAMPLE_RATE);
    let phase = 0;

    for (let i = 0; i < noteSamples && globalPos + i < N; i++) {
      const t    = i / SAMPLE_RATE;
      const frac = t / note.dur;

      // Bend: arrive at target pitch over 50 ms
      const bendFrac = Math.min(1, t / 0.05);
      const freqBent = note.freq * Math.pow(2, (-note.bendSt * (1 - bendFrac)) / 12);

      // Vibrato ramps in after 55% through the note
      const vib    = Math.max(0, (frac - 0.55) / 0.45);
      const instHz = freqBent * (1 + VIBRATO_DEPTH * vib * Math.sin(2 * Math.PI * VIBRATO_RATE * t));

      // Phase accumulation for smooth freq transitions
      phase += (2 * Math.PI * instHz) / SAMPLE_RATE;

      // Envelope: fast attack, smooth release in last 20%
      const attack  = Math.min(1, t / 0.006);
      const release = frac > 0.80 ? Math.max(0, 1 - (frac - 0.80) / 0.20) : 1;

      // Multi-harmonic signal (electric guitar body)
      let s = Math.sin(phase);
      s += 0.55 * Math.sin(2 * phase);
      s += 0.30 * Math.sin(3 * phase);
      s += 0.18 * Math.sin(4 * phase);
      s += 0.10 * Math.sin(5 * phase);
      s /= 2.13;

      // Soft-clip (tube-amp crunch)
      s = Math.tanh(s * DRIVE) / tanhDrive;

      out[globalPos + i] += s * attack * release * 0.85;
    }

    globalPos += noteSamples;
  }

  // Normalise if anything clips
  let peak = 0;
  for (let i = 0; i < N; i++) if (Math.abs(out[i]) > peak) peak = Math.abs(out[i]);
  if (peak > 0.90) {
    const scale = 0.90 / peak;
    for (let i = 0; i < N; i++) out[i] *= scale;
  }
  return out;
}

// On web: render the same Float32Array and feed it straight into an
// AudioBufferSourceNode — identical sound to the native WAV path.
function playTrillWeb() {
  const ctx = getWebCtx();
  if (!ctx) return;
  if (ctx.state === "suspended") void ctx.resume();

  const samples = renderExcellentLick();
  const buf = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
  buf.getChannelData(0).set(samples);

  const src  = ctx.createBufferSource();
  const gain = ctx.createGain();
  src.buffer      = buf;
  gain.gain.value = 0.85;
  src.connect(gain).connect(ctx.destination);
  src.start(ctx.currentTime);
}

let _trillPlayer: LoadedPlayer | null = null;
let _trillBuilding = false;

async function buildTrillPlayer(): Promise<void> {
  try {
    const { Audio } = require("expo-av") as typeof import("expo-av");
    const wav = encodeWav(renderExcellentLick());
    const uri = `data:audio/wav;base64,${uint8ToBase64(wav)}`;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    _trillPlayer = { play: () => { void sound.replayAsync().catch(() => {}); } };
  } catch { /* no-op */ }
  _trillBuilding = false;
}

// ---------------------------------------------------------------------------
// Boss guitar intro solo system
// Each of the 10 bosses has a unique signature lick rendered from scratch.
// ---------------------------------------------------------------------------

type LickNote = {
  freq:         number;
  dur:          number;
  bendSt?:      number;   // semitones below target; arrives at freq in 60 ms
  vibrato?:     number;   // depth fraction (0 = none, 0.022 = wide)
  vibratoRate?: number;   // Hz, default 5.8
  gap?:         number;   // silence after this note, seconds
};

type BossLickDef = { notes: LickNote[]; drive: number; extraH?: boolean };

// Frequency table
const LF = {
  A2: 110.00, C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81,
  A3: 220.00, B3: 246.94, C4: 261.63, D4: 293.66, Eb4: 311.13,
  E4: 329.63, F4: 349.23, Fs4: 369.99, G4: 392.00, Gs4: 415.30,
  A4: 440.00, Bb4: 466.16, B4: 493.88, C5: 523.25, Cs5: 554.37,
  D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, Fs5: 739.99,
  G5: 783.99, Gs5: 830.61, A5: 880.00, B5: 987.77, E6: 1318.51,
};

const BOSS_LICK_DEFS: Record<string, BossLickDef> = {
  nena: {
    // Machine-precise pentatonic run — even 16ths, no bends, zero slop
    drive: 2.2,
    notes: [
      { freq: LF.E4, dur: 0.065 }, { freq: LF.G4, dur: 0.065 },
      { freq: LF.A4, dur: 0.065 }, { freq: LF.B4, dur: 0.065 },
      { freq: LF.D5, dur: 0.065 }, { freq: LF.E5, dur: 0.065 },
      { freq: LF.G5, dur: 0.065 }, { freq: LF.E5, dur: 0.065 },
      { freq: LF.D5, dur: 0.065 }, { freq: LF.B4, dur: 0.065 },
      { freq: LF.G4, dur: 0.065 }, { freq: LF.E4, dur: 0.36, vibrato: 0.006 },
    ],
  },
  sandy: {
    // Classical E-major arpeggio sweep — clean, articulate, up then back down
    drive: 1.5,
    notes: [
      { freq: LF.E4,  dur: 0.09 }, { freq: LF.Gs4, dur: 0.09 },
      { freq: LF.B4,  dur: 0.09 }, { freq: LF.E5,  dur: 0.09 },
      { freq: LF.Gs5, dur: 0.09 }, { freq: LF.E5,  dur: 0.09 },
      { freq: LF.B4,  dur: 0.09 }, { freq: LF.Gs4, dur: 0.09 },
      { freq: LF.E4,  dur: 0.50, vibrato: 0.008 },
    ],
  },
  hemi: {
    // A blues — slow and emotional, every note bends up, wide singing vibrato
    drive: 2.4,
    notes: [
      { freq: LF.A3, dur: 0.16 },
      { freq: LF.C4, dur: 0.18, bendSt: 1.5 },
      { freq: LF.D4, dur: 0.20 },
      { freq: LF.E4, dur: 0.24, bendSt: 2.0, vibrato: 0.012 },
      { freq: LF.D4, dur: 0.18 },
      { freq: LF.A3, dur: 0.65, vibrato: 0.022, vibratoRate: 5.0 },
    ],
  },
  lcs: {
    // Texas shuffle groove — triplet feel, lower register, double-stop grit
    drive: 2.5,
    notes: [
      { freq: LF.A2,  dur: 0.10, gap: 0.02 }, { freq: LF.A2,  dur: 0.06 },
      { freq: LF.C3,  dur: 0.10, bendSt: 0.8 },
      { freq: LF.D3,  dur: 0.10 },
      { freq: LF.Eb3, dur: 0.08, bendSt: 1.5 },
      { freq: LF.E3,  dur: 0.14, vibrato: 0.010 },
      { freq: LF.A2,  dur: 0.08, gap: 0.04 },
      { freq: LF.D3,  dur: 0.10 },
      { freq: LF.E3,  dur: 0.10, bendSt: 1.0 },
      { freq: LF.D3,  dur: 0.48, vibrato: 0.015 },
    ],
  },
  arygmor: {
    // Hot-rodded bluesy fire — fast SRV-style run with screaming bends
    drive: 3.2,
    notes: [
      { freq: LF.E4,  dur: 0.07 }, { freq: LF.G4, dur: 0.07 },
      { freq: LF.A4,  dur: 0.07 }, { freq: LF.C5, dur: 0.07 },
      { freq: LF.D5,  dur: 0.07 },
      { freq: LF.E5,  dur: 0.09, bendSt: 1.5 },
      { freq: LF.D5,  dur: 0.08 },
      { freq: LF.C5,  dur: 0.07 }, { freq: LF.A4, dur: 0.07 },
      { freq: LF.G4,  dur: 0.07, bendSt: 1.0 },
      { freq: LF.A4,  dur: 0.07 }, { freq: LF.E4, dur: 0.07 },
      { freq: LF.G4,  dur: 0.42, bendSt: 1.8, vibrato: 0.018, vibratoRate: 6.5 },
    ],
  },
  ingvar: {
    // Neo-classical shred: Edim7 triplet arpeggio → Em7 sweep, all at full speed
    drive: 2.1,
    notes: [
      // Edim7 ascending (minor-3rd stack): E G Bb Db E G
      { freq: LF.E4,  dur: 0.048 }, { freq: LF.G4,  dur: 0.048 },
      { freq: LF.Bb4, dur: 0.048 },
      { freq: LF.Cs5, dur: 0.048 }, { freq: LF.E5,  dur: 0.048 },
      { freq: LF.G5,  dur: 0.048 },
      // Em7 sweep ascending: E G B D G
      { freq: LF.E4,  dur: 0.042 }, { freq: LF.G4,  dur: 0.042 },
      { freq: LF.B4,  dur: 0.042 }, { freq: LF.D5,  dur: 0.042 },
      { freq: LF.G5,  dur: 0.042 },
      // Sweep descend: D B G E
      { freq: LF.D5,  dur: 0.042 }, { freq: LF.B4,  dur: 0.042 },
      { freq: LF.G4,  dur: 0.042 }, { freq: LF.E4,  dur: 0.042 },
      // Resolve at top
      { freq: LF.G5,  dur: 0.40, vibrato: 0.007 },
    ],
  },
  hansy: {
    // Lyrical 9-note melodic arc — rises to peak, flows back, singing vibrato
    drive: 1.8,
    notes: [
      { freq: LF.B4, dur: 0.14 },
      { freq: LF.D5, dur: 0.13 },
      { freq: LF.E5, dur: 0.15 },
      { freq: LF.G5, dur: 0.22, vibrato: 0.012 },
      { freq: LF.E5, dur: 0.14 },
      { freq: LF.D5, dur: 0.13 },
      { freq: LF.B4, dur: 0.14 },
      { freq: LF.A4, dur: 0.14 },
      { freq: LF.G4, dur: 0.58, vibrato: 0.020, vibratoRate: 5.0 },
    ],
  },
  shreddy: {
    // Chromatic blaze from E4 to A5, then whammy tumble back down
    drive: 3.5,
    notes: [
      { freq: LF.E4,  dur: 0.038 }, { freq: LF.F4,  dur: 0.038 },
      { freq: LF.Fs4, dur: 0.038 }, { freq: LF.G4,  dur: 0.038 },
      { freq: LF.Gs4, dur: 0.038 }, { freq: LF.A4,  dur: 0.038 },
      { freq: LF.Bb4, dur: 0.038 }, { freq: LF.B4,  dur: 0.038 },
      { freq: LF.C5,  dur: 0.038 }, { freq: LF.Cs5, dur: 0.038 },
      { freq: LF.D5,  dur: 0.038 }, { freq: LF.Eb5, dur: 0.038 },
      { freq: LF.E5,  dur: 0.038 }, { freq: LF.F5,  dur: 0.038 },
      { freq: LF.Fs5, dur: 0.038 }, { freq: LF.G5,  dur: 0.038 },
      { freq: LF.Gs5, dur: 0.038 }, { freq: LF.A5,  dur: 0.060 },
      // whammy tumble
      { freq: LF.G5,  dur: 0.048 }, { freq: LF.E5,  dur: 0.048 },
      { freq: LF.C5,  dur: 0.048 }, { freq: LF.A4,  dur: 0.40 },
    ],
  },
  mo: {
    // Smooth descending legato — flowing, gravity-driven, effortless
    drive: 2.2,
    notes: [
      { freq: LF.G5, dur: 0.11 }, { freq: LF.E5, dur: 0.11 },
      { freq: LF.D5, dur: 0.11 }, { freq: LF.B4, dur: 0.11 },
      { freq: LF.G4, dur: 0.11 }, { freq: LF.E4, dur: 0.11 },
      { freq: LF.D4, dur: 0.11 }, { freq: LF.B3, dur: 0.11 },
      { freq: LF.A3, dur: 0.52, vibrato: 0.013 },
    ],
  },
  vairon: {
    // Two-handed tapping — wide octave/7th leaps, ethereal harmonic shimmer
    drive: 1.6,
    extraH: true,
    notes: [
      { freq: LF.E5, dur: 0.065 }, { freq: LF.B5, dur: 0.065 },
      { freq: LF.E5, dur: 0.065 }, { freq: LF.A5, dur: 0.065 },
      { freq: LF.E5, dur: 0.065 }, { freq: LF.G5, dur: 0.065 },
      { freq: LF.E5, dur: 0.065 }, { freq: LF.B5, dur: 0.065 },
      { freq: LF.E6, dur: 0.065 }, { freq: LF.B5, dur: 0.065 },
      { freq: LF.A5, dur: 0.065 }, { freq: LF.G5, dur: 0.48, vibrato: 0.009 },
    ],
  },
};

function renderLick(def: BossLickDef): Float32Array {
  const { notes, drive, extraH = false } = def;
  const tanhDrive = Math.tanh(drive);

  let totalDur = 0.18;
  for (const n of notes) totalDur += n.dur + (n.gap ?? 0);
  const N = Math.floor(SAMPLE_RATE * totalDur);
  const out = new Float32Array(N);
  let globalPos = 0;

  for (const note of notes) {
    const noteSamples = Math.floor(note.dur * SAMPLE_RATE);
    let phase = 0;
    const vibDepth = note.vibrato ?? 0;
    const vibRate  = note.vibratoRate ?? 5.8;
    const bendSt   = note.bendSt ?? 0;

    for (let i = 0; i < noteSamples && globalPos + i < N; i++) {
      const t    = i / SAMPLE_RATE;
      const frac = t / note.dur;

      // Bend: start below target, arrive in 60 ms
      const bf   = Math.min(1, t / 0.06);
      const freq = note.freq * Math.pow(2, (-bendSt * (1 - bf)) / 12);

      // Vibrato ramps in after 60% of the note
      const va  = vibDepth > 0 ? Math.max(0, (frac - 0.60) / 0.40) : 0;
      const hz  = freq * (1 + vibDepth * va * Math.sin(2 * Math.PI * vibRate * t));

      phase += (2 * Math.PI * hz) / SAMPLE_RATE;

      const atk = Math.min(1, t / 0.005);
      const rs  = 0.82;
      const rel = frac > rs ? Math.max(0, 1 - (frac - rs) / (1 - rs)) : 1;

      let s = Math.sin(phase);
      s += 0.55 * Math.sin(2 * phase);
      s += 0.30 * Math.sin(3 * phase);
      s += 0.18 * Math.sin(4 * phase);
      s += 0.10 * Math.sin(5 * phase);
      if (extraH) {
        s += 0.06 * Math.sin(6 * phase);
        s += 0.03 * Math.sin(7 * phase);
      }
      s /= extraH ? 2.22 : 2.13;

      if (drive > 1.2) s = Math.tanh(s * drive) / tanhDrive;

      out[globalPos + i] += s * atk * rel * 0.85;
    }
    globalPos += noteSamples + Math.floor((note.gap ?? 0) * SAMPLE_RATE);
  }

  let peak = 0;
  for (let i = 0; i < N; i++) if (Math.abs(out[i]) > peak) peak = Math.abs(out[i]);
  if (peak > 0.90) {
    const sc = 0.90 / peak;
    for (let i = 0; i < N; i++) out[i] *= sc;
  }
  return out;
}

/** Duration in seconds of the guitar lick for a given boss. */
export function getBossLickDuration(bossId: string): number {
  const def = BOSS_LICK_DEFS[bossId];
  if (!def) return 1.8;
  return def.notes.reduce((s, n) => s + n.dur + (n.gap ?? 0), 0) + 0.18;
}

// Native caching — one Sound per boss, built on first play
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const _bossLickSounds = new Map<string, { replayAsync: () => Promise<any> }>();
const _bossLickBuilding = new Set<string>();

async function buildBossLickSound(bossId: string): Promise<void> {
  const def = BOSS_LICK_DEFS[bossId];
  if (!def) return;
  try {
    const { Audio } = require("expo-av") as typeof import("expo-av");
    const wav = encodeWav(renderLick(def));
    const uri = `data:audio/wav;base64,${uint8ToBase64(wav)}`;
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    });
    const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
    _bossLickSounds.set(bossId, sound);
  } catch { /* ignore */ }
  _bossLickBuilding.delete(bossId);
}

/** Play the boss's signature guitar lick. */
export function playBossLick(bossId: string): void {
  if (Platform.OS === "web") {
    const ctx = getWebCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const def = BOSS_LICK_DEFS[bossId];
    if (!def) return;
    const samples = renderLick(def);
    const buf  = ctx.createBuffer(1, samples.length, SAMPLE_RATE);
    buf.getChannelData(0).set(samples);
    const src  = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = 0.88;
    src.buffer = buf;
    src.connect(gain).connect(ctx.destination);
    src.start(ctx.currentTime);
  } else {
    const sound = _bossLickSounds.get(bossId);
    if (sound) {
      void sound.replayAsync().catch(() => {});
    } else if (!_bossLickBuilding.has(bossId)) {
      _bossLickBuilding.add(bossId);
      void buildBossLickSound(bossId).then(() => {
        void _bossLickSounds.get(bossId)?.replayAsync().catch(() => {});
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Play a single note (by musicTheory pitch value). */
export function playNote(value: number) {
  if (Platform.OS === "web") playWeb(value, 0);
  else playNative(value, 0);
}

/**
 * Play several notes with a stagger between each, lowest first.
 * Use a small stagger to strum a chord, a larger one to walk up a scale.
 */
export function playSequence(values: number[], staggerMs: number) {
  values.forEach((value, i) => {
    const delayMs = i * staggerMs;
    if (Platform.OS === "web") playWeb(value, delayMs / 1000);
    else playNative(value, delayMs);
  });
}

/**
 * A short triumphant flourish for the level-up celebration.
 */
export function playLevelUpFanfare() {
  playSequence([36, 40, 43, 48, 52, 55, 60], 68);
}

/**
 * The "drill complete" trill: two voices a major sixth apart, rapidly
 * trilling and ending on a held note. Play once when the result screen
 * appears for normal completions (level-up celebrations use playLevelUpFanfare
 * instead).
 */
export function playDrillCompleteTrill() {
  if (Platform.OS === "web") {
    playTrillWeb();
  } else {
    if (_trillPlayer) {
      try { _trillPlayer.play(); } catch { /* ignore */ }
    } else if (!_trillBuilding) {
      _trillBuilding = true;
      void buildTrillPlayer().then(() => {
        try { _trillPlayer?.play(); } catch { /* ignore */ }
      });
    }
  }
}
