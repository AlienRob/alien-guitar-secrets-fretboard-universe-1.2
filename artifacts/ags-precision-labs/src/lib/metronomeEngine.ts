/**
 * Precision Labs Metronome Engine — Web-only (Web Audio API).
 * Ported from the AGS mobile app's lib/metronome.ts, native paths removed.
 */

export type SoundType  = "classic" | "woodblock" | "electronic" | "cosmic";
export type ClickLevel = "accent"  | "beat"       | "sub";

// ─── Web Audio context ────────────────────────────────────────────────────────

let _webCtx:  AudioContext | null = null;
let _webDest: AudioNode    | null = null;

function getWebCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!_webCtx) _webCtx = new Ctor();
  return _webCtx;
}

function getWebDest(ctx: AudioContext): AudioNode {
  if (_webDest) return _webDest;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -18; comp.knee.value = 4;
  comp.ratio.value = 8; comp.attack.value = 0.001; comp.release.value = 0.05;
  const gain = ctx.createGain();
  gain.gain.value = 3.0;
  gain.connect(comp); comp.connect(ctx.destination);
  _webDest = gain;
  return gain;
}

export function ensureAudioCtx(): AudioContext | null {
  const ctx = getWebCtx();
  if (ctx?.state === "suspended") void ctx.resume();
  return ctx;
}

// ─── Click synthesis ──────────────────────────────────────────────────────────

function playWebClick(ctx: AudioContext, atTime: number, type: SoundType, level: ClickLevel) {
  const vol  = level === "accent" ? 1.0 : level === "beat" ? 0.72 : 0.44;
  const dest = getWebDest(ctx);

  switch (type) {
    case "classic":
    default: {
      if (level === "sub") {
        const n   = Math.floor(ctx.sampleRate * 0.014);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < n; i++) {
          const t = i / ctx.sampleRate;
          d[i] = Math.sin(2 * Math.PI * 160 * t) * Math.exp(-t * 120) * vol;
        }
        const src = ctx.createBufferSource(); src.buffer = buf;
        const g   = ctx.createGain(); g.gain.value = 1.8 * vol;
        src.connect(g).connect(dest); src.start(atTime);
      } else {
        const bodyF  = level === "accent" ? 350 : 230;
        const crackF = level === "accent" ? 2800 : 2000;
        const crackW = level === "accent" ? 0.52 : 0.28;
        const noiseW = level === "accent" ? 0.30 : 0.10;
        const n = Math.floor(ctx.sampleRate * 0.022);
        const buf = ctx.createBuffer(1, n, ctx.sampleRate);
        const d   = buf.getChannelData(0);
        for (let i = 0; i < n; i++) {
          const t     = i / ctx.sampleRate;
          const body  = Math.sin(2 * Math.PI * bodyF  * t) * Math.exp(-t * 90);
          const crack = Math.sin(2 * Math.PI * crackF * t) * Math.exp(-t * 1100);
          const noise = (Math.random() * 2 - 1) * Math.exp(-t * 4000);
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
      const n  = level === "sub" ? Math.floor(ctx.sampleRate * 0.014) : Math.floor(ctx.sampleRate * 0.024);
      const buf = ctx.createBuffer(1, n, ctx.sampleRate);
      const d   = buf.getChannelData(0);
      let lp = 0;
      for (let i = 0; i < n; i++) {
        const t   = i / ctx.sampleRate;
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
      const dur = level === "sub" ? 0.040 : 0.080;
      const mg  = ctx.createGain();
      mg.gain.setValueAtTime(vol, atTime);
      mg.gain.exponentialRampToValueAtTime(0.001, atTime + dur);
      mg.connect(dest);
      for (const mult of [1, 1.5, 0.5]) {
        const osc = ctx.createOscillator();
        osc.frequency.value = f * mult;
        osc.connect(mg);
        osc.start(atTime); osc.stop(atTime + dur + 0.005);
      }
      break;
    }
  }
}

// ─── Engine ───────────────────────────────────────────────────────────────────

const LOOKAHEAD_SEC = 0.1;
const SCHED_MS      = 25;

export class MetronomeEngine {
  bpm             = 120;
  beatsPerMeasure = 4;
  subdivision     = 1;
  accentBeat      = 0;
  accentSilent    = false;
  soundType: SoundType = "classic";
  mutedBeats: number[] = [];

  onTick?: (beatIndex: number, subIndex: number, level: ClickLevel) => void;

  private _running      = false;
  private _clickIdx     = 0;
  private _schedInterval: ReturnType<typeof setInterval> | null = null;
  private _nextTimeSec  = 0;

  get isRunning()        { return this._running; }
  get clickIntervalSec() { return 60 / (this.bpm * this.subdivision); }
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
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    this._nextTimeSec = ctx.currentTime + 0.05;
    this._schedule();
    this._schedInterval = setInterval(() => this._schedule(), SCHED_MS);
  }

  stop() {
    this._running = false;
    if (this._schedInterval) { clearInterval(this._schedInterval); this._schedInterval = null; }
  }

  private _schedule() {
    const ctx = getWebCtx();
    if (!ctx || !this._running) return;
    while (this._nextTimeSec < ctx.currentTime + LOOKAHEAD_SEC) {
      const idx      = this._clickIdx;
      const level    = this._clickLevel(idx);
      const subIdx   = idx % this.subdivision;
      const beatIdx  = Math.floor(idx / this.subdivision);
      const isMuted  = this.mutedBeats.includes(beatIdx);
      const sndLevel = level === "accent" && this.accentSilent ? "beat" : level;
      if (!isMuted) playWebClick(ctx, this._nextTimeSec, this.soundType, sndLevel);
      const fireIn = (this._nextTimeSec - ctx.currentTime) * 1000;
      const bi = beatIdx, si = subIdx, lv = level;
      setTimeout(() => { if (this._running) this.onTick?.(bi, si, lv); }, Math.max(0, fireIn));
      this._nextTimeSec += this.clickIntervalSec;
      this._clickIdx = (idx + 1) % this.totalClicks;
    }
  }
}

/** No-op on web — sounds are synthesised inline, no pre-warming needed. */
export function prewarmSounds(_type: SoundType): void {}
