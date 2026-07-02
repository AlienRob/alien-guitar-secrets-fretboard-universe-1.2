/**
 * AGS Chrono Metronome — engine + synthesized clicks.
 *
 * Three audible click levels:
 *   "accent" — the designated accent beat (loudest, highest crack)
 *   "beat"   — every other beat start (medium, moderate crack)
 *   "sub"    — subdivision clicks within a beat (soft body only, no crack)
 *
 * Web    → Web Audio API lookahead scheduler (sample-accurate).
 * iOS    → IOSNativeMetronomeAdapter wraps AVAudioEngine via the
 *          @workspace/native-metronome Expo module (EAS build only).
 *          Falls back to the JS engine transparently in Expo Go.
 * Android→ double-buffered expo-audio + drift-corrected setTimeout.
 *          Three player pairs per sound type (one per level).
 */
import { Platform } from "react-native";

export type SoundType  = "classic" | "woodblock" | "electronic" | "cosmic";
export type ClickLevel = "accent" | "beat" | "sub";

// ─── WAV helpers ─────────────────────────────────────────────────────────────

const SR = 44100;
const MIN_SAMPLES = Math.floor(SR * 0.5);

function encodeWav(samples: Float32Array): Uint8Array {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const ws = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  ws(0, "RIFF"); v.setUint32(4, 36 + n * 2, true);
  ws(8, "WAVE"); ws(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, SR, true);  v.setUint32(28, SR * 2, true);
  v.setUint16(32, 2, true);   v.setUint16(34, 16, true);
  ws(36, "data"); v.setUint32(40, n * 2, true);
  let off = 44;
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Uint8Array(buf);
}

function uint8ToBase64(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s);
}

function limit(buf: Float32Array, threshold: number, ratio: number, makeup: number) {
  for (let i = 0; i < buf.length; i++) {
    const a = Math.abs(buf[i]);
    if (a > threshold) {
      const sg = buf[i] < 0 ? -1 : 1;
      buf[i] = sg * (threshold + (a - threshold) / ratio);
    }
    buf[i] = Math.max(-1, Math.min(1, buf[i] * makeup));
  }
}

/**
 * Click synthesis — three levels per sound type.
 *
 * "classic"   — Cubase-style: short sine ping, clean and precise.
 *               Accent ~1100 Hz (higher pitch = obvious downbeat), beat ~770 Hz.
 * "woodblock" — Logic-style: sine body + brief noise transient, woody character.
 * "electronic"— Square-wave pulse, punchy.
 * "cosmic"    — Soft multi-tone, spacey.
 *
 * Volume targets: all levels normalized to near full-scale so phone speakers
 * can drive them loud. Beat is 3 dB under accent; sub is 6 dB under.
 */
function renderClickSamples(type: SoundType, level: ClickLevel): Float32Array {
  // Target peak amplitudes (+40% vs previous levels, capped near full scale).
  const targetPeak = level === "accent" ? 0.97 : level === "beat" ? 0.97 : 0.87;
  let click: Float32Array;

  switch (type) {
    case "classic":
    default: {
      // Cubase-style: noise transient in first 1.5 ms, then a clean sine tone.
      // Accent is higher-pitched so the downbeat is obvious without being harsh.
      const freq  = level === "accent" ? 1100 : level === "beat" ? 770 : 550;
      const dur   = level === "sub" ? 0.030 : 0.055;
      const decK  = level === "sub" ? 230 : 160;   // slower decay = more body = louder feel
      const n     = Math.floor(SR * dur);
      const nSnap = Math.floor(SR * 0.0015);        // 1.5 ms noise burst
      click = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t   = i / SR;
        const env = Math.exp(-t * decK);
        const tone  = Math.sin(2 * Math.PI * freq * t) * env;
        const noise = i < nSnap
          ? (Math.random() * 2 - 1) * Math.exp(-i / (nSnap * 0.3)) * 0.5
          : 0;
        click[i] = tone + noise;
      }
      break;
    }

    case "woodblock": {
      // Logic-style: body sine + second harmonic + brief noise knock.
      const bodyF = level === "accent" ? 880 : level === "beat" ? 660 : 500;
      const dur   = level === "sub" ? 0.032 : 0.055;
      const decK  = level === "sub" ? 240 : 160;
      const n     = Math.floor(SR * dur);
      const nKnk  = Math.floor(SR * 0.002);    // 2 ms knock transient
      click = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t   = i / SR;
        const env = Math.exp(-t * decK);
        const body  = Math.sin(2 * Math.PI * bodyF * t);
        const harm  = 0.35 * Math.sin(2 * Math.PI * bodyF * 2 * t);
        const knock = i < nKnk
          ? (Math.random() * 2 - 1) * Math.exp(-i / (nKnk * 0.35)) * 0.45
          : 0;
        click[i] = (body + harm) * env + knock;
      }
      break;
    }

    case "electronic": {
      const freq = level === "accent" ? 960 : level === "beat" ? 680 : 480;
      const dur  = level === "sub" ? 0.020 : 0.032;
      const decK = level === "sub" ? 280 : 200;
      const n = Math.floor(SR * dur);
      click = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        const sq = Math.sin(2 * Math.PI * freq * t) >= 0 ? 1 : -1;
        click[i] = sq * Math.exp(-t * decK);
      }
      break;
    }

    case "cosmic": {
      const f    = level === "accent" ? 600 : level === "beat" ? 420 : 300;
      const dur  = level === "sub" ? 0.045 : 0.090;
      const decK = level === "sub" ? 90 : 50;
      const n    = Math.floor(SR * dur);
      click = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const t   = i / SR;
        const env = Math.exp(-t * decK);
        const s   = Math.sin(2 * Math.PI * f * t)
                  + 0.5  * Math.sin(2 * Math.PI * f * 1.5 * t)
                  + 0.25 * Math.sin(2 * Math.PI * f * 0.5 * t);
        click[i] = (s / 1.75) * env;
      }
      break;
    }
  }

  // Normalize then scale to targetPeak — guarantees loudness is consistent
  // regardless of how the synthesis math composes.
  let peak = 0;
  for (let i = 0; i < click.length; i++) peak = Math.max(peak, Math.abs(click[i]));
  if (peak > 0) {
    const scale = targetPeak / peak;
    for (let i = 0; i < click.length; i++) click[i] *= scale;
  }

  if (click.length >= MIN_SAMPLES) return click;
  const padded = new Float32Array(MIN_SAMPLES);
  padded.set(click);
  return padded;
}

// ─── Web Audio ────────────────────────────────────────────────────────────────

let _webCtx: AudioContext | null = null;
let _webDest: AudioNode | null = null;

function getWebCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (_webCtx == null) _webCtx = new Ctor();
  return _webCtx;
}

function getWebDest(ctx: AudioContext): AudioNode {
  if (_webDest) return _webDest;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 4;
  comp.ratio.value = 8; comp.attack.value = 0.001; comp.release.value = 0.05;
  const gain = ctx.createGain();
  gain.gain.value = 4.2;
  gain.connect(comp); comp.connect(ctx.destination);
  _webDest = gain;
  return gain;
}

function ensureWebCtx(): AudioContext | null {
  const ctx = getWebCtx();
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

function playWebClick(ctx: AudioContext, atTime: number, type: SoundType, level: ClickLevel) {
  const vol  = level === "accent" ? 1.0 : level === "beat" ? 0.72 : 0.44;
  const dest = getWebDest(ctx);

  switch (type) {
    case "classic":
    default: {
      if (level === "sub") {
        const n = Math.floor(ctx.sampleRate * 0.014);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) {
          const t = i / ctx.sampleRate;
          d[i] = Math.sin(2 * Math.PI * 160 * t) * Math.exp(-t * 120) * vol;
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g = ctx.createGain(); g.gain.value = 1.8 * vol;
        src.connect(g).connect(dest); src.start(atTime);
      } else {
        const bodyF  = level === "accent" ? 350 : 230;
        const crackF = level === "accent" ? 2800 : 2000;
        const crackW = level === "accent" ? 0.52 : 0.28;
        const noiseW = level === "accent" ? 0.30 : 0.10;
        const n = Math.floor(ctx.sampleRate * 0.022);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < n; i++) {
          const t = i / ctx.sampleRate;
          const body  = Math.sin(2 * Math.PI * bodyF  * t) * Math.exp(-t * 90);
          const crack = Math.sin(2 * Math.PI * crackF * t) * Math.exp(-t * 1100);
          const noise = (Math.random() * 2 - 1)             * Math.exp(-t * 4000);
          d[i] = (body * 0.68 + crack * crackW + noise * noiseW) * vol;
        }
        let pk = 0;
        for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i]));
        if (pk > 0) for (let i = 0; i < n; i++) d[i] /= pk;
        for (let i = 0; i < n; i++) {
          const a = Math.abs(d[i]);
          if (a > 0.20) { const sg = d[i] < 0 ? -1 : 1; d[i] = sg * (0.20 + (a - 0.20) / 5); }
          d[i] = Math.max(-1, Math.min(1, d[i] * 3.6 * vol));
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        src.connect(dest); src.start(atTime);
      }
      break;
    }
    case "woodblock": {
      const bodyF = level === "accent" ? 880 : level === "beat" ? 660 : 500;
      const n = level === "sub" ? Math.floor(ctx.sampleRate * 0.014) : Math.floor(ctx.sampleRate * 0.024);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d = buf.getChannelData(0);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t = i / ctx.sampleRate;
        const raw = Math.random() * 2 - 1;
        lp = 0.18 * raw + 0.82 * lp;
        const body = Math.sin(2 * Math.PI * bodyF * t) * Math.exp(-t * (level === "sub" ? 320 : 190));
        d[i] = Math.max(-1, Math.min(1, (lp * Math.exp(-t * 270) * (level === "sub" ? 0 : 1) + body * 0.75) * vol * (level === "sub" ? 1.2 : 2.4)));
      }
      const src = ctx.createBufferSource(); src.buffer = buf;
      src.connect(dest); src.start(atTime);
      break;
    }
    case "electronic": {
      const freq = level === "accent" ? 960 : level === "beat" ? 680 : 480;
      const dur  = level === "sub" ? 0.012 : 0.018;
      const osc = ctx.createOscillator();
      const g   = ctx.createGain();
      osc.type = "square"; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, atTime);
      g.gain.exponentialRampToValueAtTime(0.001, atTime + dur);
      osc.connect(g).connect(dest);
      osc.start(atTime); osc.stop(atTime + dur + 0.004);
      break;
    }
    case "cosmic": {
      const f   = level === "accent" ? 600 : level === "beat" ? 420 : 300;
      const dur = level === "sub" ? 0.038 : 0.072;
      // Master envelope — normalised so the three tones don't add beyond vol.
      const mg = ctx.createGain();
      mg.gain.setValueAtTime(vol, atTime);
      mg.gain.exponentialRampToValueAtTime(0.001, atTime + dur);
      mg.connect(dest);
      // Weighted mix matching the buffer synthesis: 1 / 0.5 / 0.25, sum = 1.75
      for (const [mult, weight] of [[1, 1/1.75], [1.5, 0.5/1.75], [0.5, 0.25/1.75]] as [number,number][]) {
        const osc = ctx.createOscillator();
        const og  = ctx.createGain();
        osc.frequency.value = f * mult;
        og.gain.value = weight;
        osc.connect(og).connect(mg);
        osc.start(atTime); osc.stop(atTime + dur + 0.005);
      }
      break;
    }
  }
}

// ─── Native — double-buffered expo-av ────────────────────────────────────────
//
// expo-audio's createAudioPlayer silently drops file:// cache URIs on Android.
// expo-av's Audio.Sound.createAsync handles local cache-dir WAV files correctly
// on both iOS and Android.

interface NativePlayer {
  play: () => void;
}

// 4-player ring buffer per sound slot — gives each player 4× the click
// interval to finish replayAsync before being reused. With 2 players at
// 200 BPM + 1/16 subdivisions (75 ms interval), iOS can still collide;
// with 4 players the same slot isn't touched again for 300 ms.
const POOL_SIZE = 4;
const _pools    = new Map<string, Array<NativePlayer | null>>();
const _poolIdx  = new Map<string, number>();
const _building = new Map<string, Promise<void>>();
let _audioModeSet = false;

function ensureNativeAudioMode() {
  if (_audioModeSet) return;
  _audioModeSet = true;
  try {
    const { Audio } = require("expo-av") as typeof import("expo-av");
    void Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });
  } catch {}
}

async function buildPool(type: SoundType, level: ClickLevel): Promise<void> {
  const key = `${type}-${level}`;
  try {
    const { Audio } = require("expo-av") as typeof import("expo-av");

    // Build WAV in memory, encode as data: URI — no file system needed.
    const wav = encodeWav(renderClickSamples(type, level));
    const uri = `data:audio/wav;base64,${uint8ToBase64(wav)}`;

    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    });

    const makePlayer = async (): Promise<NativePlayer> => {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: false },
      );
      return {
        // Catch "Seeking interrupted" — these are expected when the metronome
        // stops or the sound type changes while a replayAsync is in flight.
        // Swallowing them prevents the Expo Go red-screen error overlay.
        play: () => { void sound.replayAsync().catch(() => {}); },
      };
    };

    const pool: Array<NativePlayer | null> = [];
    for (let i = 0; i < POOL_SIZE; i++) pool.push(await makePlayer());
    _pools.set(key, pool);
    _poolIdx.set(key, 0);
  } catch {
    _pools.set(key, Array(POOL_SIZE).fill(null));
  }
}

function ensurePool(type: SoundType, level: ClickLevel) {
  const key = `${type}-${level}`;
  if (_pools.has(key) || _building.has(key)) return;
  const p = buildPool(type, level).finally(() => _building.delete(key));
  _building.set(key, p);
}

function fireNativeClick(type: SoundType, level: ClickLevel) {
  ensureNativeAudioMode();
  ensurePool(type, level);
  const key  = `${type}-${level}`;
  const pool = _pools.get(key);
  if (!pool) return;
  const idx    = _poolIdx.get(key) ?? 0;
  const player = pool[idx];
  if (player) {
    try { player.play(); } catch {}
  }
  _poolIdx.set(key, (idx + 1) % POOL_SIZE);
}

// ─── Engine ───────────────────────────────────────────────────────────────────

const LOOKAHEAD_SEC = 0.1;
const SCHED_MS      = 25;

// Native polling constants.
// Poll every NATIVE_POLL_MS so a late JS-thread wakeup is caught within one
// poll period rather than a full click interval. Fire audio NATIVE_LEAD_MS
// before the wall-clock target to compensate for replayAsync startup latency
// on iOS (~10–20 ms). Net result: per-click timing error ≈ ±NATIVE_POLL_MS
// instead of ±full_interval.
const NATIVE_POLL_MS = 10;
// 25 ms head-start gives replayAsync enough runway on iOS without sounding early.
const NATIVE_LEAD_MS = 25;

export class MetronomeEngine {
  bpm             = 120;
  beatsPerMeasure = 4;
  subdivision     = 1;
  /** Which beat (0-based) gets the full accent. */
  accentBeat      = 0;
  /**
   * When true the accent beat plays at "beat" volume (no loud crack/pop).
   * The visual accent indicator and the "accent" level in onTick are
   * unaffected — only the synthesised sound is downgraded.
   */
  accentSilent    = false;
  soundType: SoundType = "classic";
  /** Beat indices (0-based) that produce no sound. onTick still fires so
   *  the visual indicator still moves through the muted beat. */
  mutedBeats: number[] = [];

  /**
   * Fires on every click.
   * @param beatIndex  Which beat (0-based) is playing.
   * @param subIndex   Which subdivision within that beat (0 = beat start).
   * @param level      "accent" | "beat" | "sub"
   */
  onTick?: (beatIndex: number, subIndex: number, level: ClickLevel) => void;

  private _running     = false;
  private _clickIdx    = 0;
  private _schedInterval: ReturnType<typeof setInterval> | null = null;
  private _nextTimeSec = 0;
  private _nextTimeMs  = 0;

  get isRunning()        { return this._running; }
  get clickIntervalSec() { return 60 / (this.bpm * this.subdivision); }
  get clickIntervalMs()  { return this.clickIntervalSec * 1000; }
  get totalClicks()      { return this.beatsPerMeasure * this.subdivision; }

  private _clickLevel(idx: number): ClickLevel {
    const subIdx  = idx % this.subdivision;
    if (subIdx !== 0) return "sub";
    const beatIdx = Math.floor(idx / this.subdivision);
    return beatIdx === this.accentBeat ? "accent" : "beat";
  }

  start() {
    if (this._running) return;
    this._running  = true;
    this._clickIdx = 0;
    if (Platform.OS === "web") this._startWeb();
    else this._startNative();
  }

  stop() {
    this._running = false;
    if (this._schedInterval) { clearInterval(this._schedInterval); this._schedInterval = null; }
  }

  private _startWeb() {
    const ctx = ensureWebCtx();
    if (!ctx) { this._startNative(); return; }
    this._nextTimeSec = ctx.currentTime + 0.05;
    this._webSchedule();
    this._schedInterval = setInterval(() => this._webSchedule(), SCHED_MS);
  }

  private _webSchedule() {
    const ctx = getWebCtx();
    if (!ctx || !this._running) return;
    while (this._nextTimeSec < ctx.currentTime + LOOKAHEAD_SEC) {
      const idx      = this._clickIdx;
      const level    = this._clickLevel(idx);
      const subIdx   = idx % this.subdivision;
      const beatIdx  = Math.floor(idx / this.subdivision);
      const isMuted  = this.mutedBeats.includes(beatIdx);
      // Downgrade accent sound when silenced; visual level is unchanged.
      const sndLevel = level === "accent" && this.accentSilent ? "beat" : level;
      if (!isMuted) playWebClick(ctx, this._nextTimeSec, this.soundType, sndLevel);
      const fireIn = (this._nextTimeSec - ctx.currentTime) * 1000;
      const bi = beatIdx, si = subIdx, lv = level;
      setTimeout(() => { if (this._running) this.onTick?.(bi, si, lv); }, Math.max(0, fireIn));
      this._nextTimeSec += this.clickIntervalSec;
      this._clickIdx = (idx + 1) % this.totalClicks;
    }
  }

  private _startNative() {
    ensureNativeAudioMode();
    // Start 50 ms in the future so the first poll immediately fires the first click.
    this._nextTimeMs = Date.now() + 50;
    // Tight polling loop — wakes every NATIVE_POLL_MS and fires any overdue
    // clicks. This is the same lookahead-scheduler pattern as the web path but
    // adapted for native where audio must fire immediately (no future scheduling).
    this._schedInterval = setInterval(() => this._nativePoll(), NATIVE_POLL_MS);
  }

  private _nativePoll() {
    if (!this._running) return;
    // Fire every click whose wall-clock time is within NATIVE_LEAD_MS from now.
    // NATIVE_LEAD_MS compensates for replayAsync startup latency on iOS so the
    // actual audio onset lands close to the target beat.
    while (Date.now() + NATIVE_LEAD_MS >= this._nextTimeMs) {
      const idx     = this._clickIdx;
      const level   = this._clickLevel(idx);
      const subIdx  = idx % this.subdivision;
      const beatIdx = Math.floor(idx / this.subdivision);
      const isMuted = this.mutedBeats.includes(beatIdx);
      const sndLevel = level === "accent" && this.accentSilent ? "beat" : level;
      if (!isMuted) fireNativeClick(this.soundType, sndLevel);

      // Schedule the visual/haptic callback for the EXACT target beat time,
      // decoupled from audio. Previously onTick was called inline here, which
      // triggered React state updates (setCurrentBeat / animation / haptics)
      // on the JS thread during the setInterval callback itself — congesting
      // the thread and causing the NEXT poll to fire late, creating jitter.
      // Using setTimeout(0) at the target time lets the setInterval callback
      // return first, keeping the audio poll tight and stutter-free.
      const visualDelay = Math.max(0, this._nextTimeMs - Date.now());
      const bi = beatIdx, si = subIdx, lv = level;
      setTimeout(() => { if (this._running) this.onTick?.(bi, si, lv); }, visualDelay);

      this._clickIdx   = (idx + 1) % this.totalClicks;
      this._nextTimeMs += this.clickIntervalMs;
    }
  }
}

/** Pre-warm all three click levels for a given sound type. */
export function prewarmSounds(type: SoundType) {
  if (Platform.OS === "web") return;
  ensureNativeAudioMode();
  ensurePool(type, "accent");
  ensurePool(type, "beat");
  ensurePool(type, "sub");
}

// ─── Shared engine interface ───────────────────────────────────────────────────
// Both MetronomeEngine and IOSNativeMetronomeAdapter conform to this so
// metronome.tsx can swap them without caring which is in use.

export interface IMetronomeEngine {
  bpm:             number;
  beatsPerMeasure: number;
  subdivision:     number;
  accentBeat:      number;
  accentSilent:    boolean;
  soundType:       SoundType;
  mutedBeats:      number[];
  onTick?:         (beatIndex: number, subIndex: number, level: ClickLevel) => void;
  readonly isRunning: boolean;
  start(): void;
  stop():  void;
}

// ─── iOS native adapter ────────────────────────────────────────────────────────
// Wraps @workspace/native-metronome (AVAudioEngine, EAS builds only).
// Falls back to isAvailable=false in Expo Go — the screen then uses
// MetronomeEngine (the existing JS engine) instead.
//
// Audio lives entirely in Swift. onTick is fired from native beat events
// and is used ONLY for visual updates — never to trigger audio.
//
// Limitations vs MetronomeEngine:
//   • soundType is ignored (native synthesises its own click)
//   • mutedBeats: audio still plays; onTick is suppressed for muted beats
//   • subdivision visuals: native only sends main-beat events (subIdx always 0)

type _NativeMetronomeMod = {
  isAvailable:     boolean;
  start(o: { bpm: number; beatsPerBar: number; subdivision: number; accentFirstBeat: boolean }): Promise<void>;
  stop():          Promise<void>;
  setTempo(bpm: number): Promise<void>;
  addBeatListener(cb: (beatIndex: number) => void): { remove(): void } | null;
};

const _nativeMod = ((): _NativeMetronomeMod | null => {
  if (Platform.OS !== "ios") return null;
  try {
    // expo-modules-core ships inside every Expo SDK build.
    // Use require so the type-checker never needs to resolve the package.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const emc = require("expo-modules-core") as {
      requireNativeModule: (name: string) => Record<string, (...a: unknown[]) => unknown>;
      EventEmitter: new (mod: unknown) => {
        addListener: (event: string, cb: (...a: unknown[]) => void) => { remove(): void };
      };
    };
    const raw = emc.requireNativeModule("NativeMetronome");
    if (!raw) return null;
    const emitter = new emc.EventEmitter(raw);
    return {
      isAvailable: true,
      start:  (o)   => raw.start(o)          as Promise<void>,
      stop:   ()    => raw.stop()             as Promise<void>,
      setTempo: (b) => raw.setTempo({ bpm: b }) as Promise<void>,
      addBeatListener: (cb) =>
        emitter.addListener("beat", (e: unknown) =>
          cb((e as { beatIndex: number }).beatIndex)),
    };
  } catch {
    return null;
  }
})();

export class IOSNativeMetronomeAdapter implements IMetronomeEngine {
  // ── Stored params ───────────────────────────────────────────────────────────
  private _bpm             = 120;
  private _beatsPerMeasure = 4;
  private _subdivision     = 1;
  private _accentBeat      = 0;
  private _accentSilent    = false;
  private _mutedBeats:     number[] = [];
  soundType: SoundType     = "classic";     // ignored — native uses its own click
  onTick?:   (beatIndex: number, subIndex: number, level: ClickLevel) => void;

  private _running  = false;
  private _beatSub: { remove(): void } | null = null;

  // ── isAvailable ─────────────────────────────────────────────────────────────
  static get isAvailable(): boolean { return _nativeMod !== null; }

  get isRunning() { return this._running; }

  // ── Property accessors ──────────────────────────────────────────────────────
  // bpm: use setTempo() for a smooth re-render rather than a hard stop/start.
  get bpm()        { return this._bpm; }
  set bpm(v: number) {
    this._bpm = v;
    if (this._running) void _nativeMod?.setTempo(v);
  }

  // beats/subdiv: the component stops then restarts explicitly when these
  // change, so the setters only need to persist the value.
  get beatsPerMeasure()         { return this._beatsPerMeasure; }
  set beatsPerMeasure(v: number){ this._beatsPerMeasure = v; }

  get subdivision()             { return this._subdivision; }
  set subdivision(v: number)    { this._subdivision = v; }

  // accentBeat / accentSilent: changing these affects the rendered PCM bar,
  // so a restart is needed while playing.
  get accentBeat()              { return this._accentBeat; }
  set accentBeat(v: number) {
    this._accentBeat = v;
    if (this._running) this._restartAudio();
  }

  get accentSilent()            { return this._accentSilent; }
  set accentSilent(v: boolean) {
    this._accentSilent = v;
    if (this._running) this._restartAudio();
  }

  // mutedBeats: audio plays regardless; onTick is suppressed for muted beats.
  get mutedBeats()              { return this._mutedBeats; }
  set mutedBeats(v: number[])   { this._mutedBeats = v; }

  // ── Lifecycle ───────────────────────────────────────────────────────────────
  start() {
    this._cleanupSub();
    this._running = true;
    this._beatSub = _nativeMod?.addBeatListener((beatIndex) => {
      if (!this._running) return;
      if (this._mutedBeats.includes(beatIndex)) return;
      const level: ClickLevel = beatIndex === this._accentBeat && !this._accentSilent
        ? "accent" : "beat";
      this.onTick?.(beatIndex, 0, level);
    }) ?? null;
    void _nativeMod?.start({
      bpm:             this._bpm,
      beatsPerBar:     this._beatsPerMeasure,
      subdivision:     Math.max(1, Math.round(this._subdivision)),
      accentFirstBeat: this._accentBeat === 0 && !this._accentSilent,
    });
  }

  stop() {
    this._cleanupSub();
    void _nativeMod?.stop();
  }

  private _cleanupSub() {
    this._running = false;
    this._beatSub?.remove();
    this._beatSub = null;
  }

  /** Re-render the PCM bar with current params (for accent changes). */
  private _restartAudio() {
    void _nativeMod?.start({
      bpm:             this._bpm,
      beatsPerBar:     this._beatsPerMeasure,
      subdivision:     Math.max(1, Math.round(this._subdivision)),
      accentFirstBeat: this._accentBeat === 0 && !this._accentSilent,
    });
  }
}
