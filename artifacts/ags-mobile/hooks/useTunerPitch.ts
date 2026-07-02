/**
 * useTunerPitch — real-time pitch detection for the tuner screen.
 *
 * WEB:        getUserMedia + AudioContext RAF loop (8192-sample buffer).
 * iOS NATIVE: expo-av WAV chunk recording loop, same MPM engine (~6 fps).
 * ANDROID:    not supported — the tuner screen plays a reference tone instead.
 *             (MediaRecorder cannot output raw PCM on Android.)
 *
 * Engine: McLeod Pitch Method (NSDF + parabolic refinement), Hann windowing,
 * DC removal, RMS noise gate, rolling weighted-median smoother (9 frames),
 * octave-error correction, auto/locked string mode.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { midiToFrequency } from "@/lib/tunerPitch";
import { type StringNote, type Instrument, detectionProfiles } from "@/lib/tunerData";
import { PitchDetectorMPM } from "@/lib/tuner/PitchDetectorMPM";
import { PitchSmoother }    from "@/lib/tuner/PitchSmoother";

export interface UseTunerPitchParams {
  strings:      StringNote[];
  lockedString: number;
  lockMode:     "auto" | "locked";
  a4:           number;
  instrument:   Instrument;
}

export interface UseTunerPitchResult {
  running:      boolean;
  supported:    boolean;
  start:        () => void;
  stop:         () => void;
  detectedFreq: number | null;
  targetFreq:   number | null;
  cents:        number;
  activeString: number | null;
  vibration:    number;
  error:        string | null;
}

const NATIVE_SAMPLE_RATE = 22050;
const CHUNK_MS           = 150;
const EMA_ALPHA          = 0.4;
const FFT_SIZE           = 8192;

function checkSupported(): boolean {
  if (Platform.OS === "ios") return true;
  if (Platform.OS === "web") {
    const g = globalThis as Record<string, unknown>;
    const nav = g["navigator"] as { mediaDevices?: { getUserMedia?: unknown } } | undefined;
    return !!nav?.mediaDevices?.getUserMedia;
  }
  return false;
}

// ── WAV chunk helpers (iOS) ───────────────────────────────────────────────────

function parseWavSamples(bin: string): Float32Array | null {
  if (bin.length < 12) return null;
  if (bin.slice(0, 4) !== "RIFF" || bin.slice(8, 12) !== "WAVE") return null;
  let offset = 12;
  while (offset + 8 <= bin.length) {
    const id   = bin.slice(offset, offset + 4);
    const size = (bin.charCodeAt(offset + 4) & 0xff) |
                 ((bin.charCodeAt(offset + 5) & 0xff) << 8) |
                 ((bin.charCodeAt(offset + 6) & 0xff) << 16) |
                 ((bin.charCodeAt(offset + 7) & 0xff) << 24);
    if (id === "data") {
      const n   = Math.floor(size / 2);
      const off = offset + 8;
      if (off + size > bin.length) return null;
      const out = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const lo = bin.charCodeAt(off + i * 2) & 0xff;
        const hi = bin.charCodeAt(off + i * 2 + 1) & 0xff;
        let v = lo | (hi << 8);
        if (v > 32767) v -= 65536;
        out[i] = v / 32768;
      }
      return out;
    }
    offset += 8 + size + (size % 2 !== 0 ? 1 : 0);
  }
  return null;
}

async function recordOneChunk(): Promise<Float32Array | null> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { Audio }      = require("expo-av") as typeof import("expo-av");
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FileSystem     = require("expo-file-system") as typeof import("expo-file-system");
  const recording = new Audio.Recording();
  try {
    await recording.prepareToRecordAsync({
      isMeteringEnabled: false,
      android: { extension: ".wav", outputFormat: 0, audioEncoder: 0, sampleRate: NATIVE_SAMPLE_RATE, numberOfChannels: 1, bitRate: NATIVE_SAMPLE_RATE * 16 },
      ios:     { extension: ".wav", outputFormat: "lpcm", audioQuality: 0, sampleRate: NATIVE_SAMPLE_RATE, numberOfChannels: 1, bitRate: NATIVE_SAMPLE_RATE * 16, linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false },
      web:     {},
    } as Parameters<typeof recording.prepareToRecordAsync>[0]);
    await recording.startAsync();
    await new Promise<void>((r) => setTimeout(r, CHUNK_MS));
    await recording.stopAndUnloadAsync();
  } catch {
    try { await recording.stopAndUnloadAsync(); } catch { /* ignore */ }
    return null;
  }
  const uri = recording.getURI();
  if (!uri) return null;
  try {
    const b64 = await FileSystem.readAsStringAsync(uri, { encoding: "base64" as never });
    await FileSystem.deleteAsync(uri, { idempotent: true });
    return parseWavSamples(atob(b64));
  } catch {
    try { await (require("expo-file-system") as typeof import("expo-file-system")).deleteAsync(uri, { idempotent: true }); } catch { /* ignore */ }
    return null;
  }
}

// ── Target picking + octave correction ───────────────────────────────────────

type StringTarget = { idx: number; label: string; frequency: number };

function pickBestTarget(freq: number, targets: StringTarget[]): StringTarget {
  let best = targets[0], bestScore = Infinity;
  for (const t of targets) {
    // ÷2 and ×2 cover octave errors; ÷3 covers 3rd-harmonic lock-on (D3→440Hz, G3→588Hz)
    const octaveCands  = [freq, freq / 2, freq * 2].map((f) => Math.abs(1200 * Math.log2(f / t.frequency)));
    const thirdHarmony = Math.abs(1200 * Math.log2(freq / 3 / t.frequency)) + 100; // 100¢ penalty
    const score = Math.min(...octaveCands, thirdHarmony);
    if (score < bestScore) { bestScore = score; best = t; }
  }
  return best;
}

function rejectOctaveError(freq: number, targetFreq: number): number {
  const candidates = [freq, freq / 2, freq * 2, freq / 3, freq * 3].filter((f) => f > 20 && f < 2000);
  return candidates.reduce((best, f) =>
    Math.abs(1200 * Math.log2(f / targetFreq)) < Math.abs(1200 * Math.log2(best / targetFreq)) ? f : best,
    candidates[0],
  );
}

// ── In-tune chime (web) ───────────────────────────────────────────────────────

function playWebChime(ctx: unknown): void {
  if (!ctx) return;
  try {
    const c = ctx as AudioContext;
    const pairs: [number, number][] = [[1046.5, 0.16], [1568.0, 0.10]];
    pairs.forEach(([freq, vol]) => {
      const osc = c.createOscillator();
      const amp = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, c.currentTime);
      amp.gain.linearRampToValueAtTime(vol, c.currentTime + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.7);
      osc.connect(amp);
      amp.connect(c.destination);
      osc.start(c.currentTime);
      osc.stop(c.currentTime + 0.75);
    });
  } catch { /* ignore */ }
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useTunerPitch({
  strings, lockedString, lockMode, a4, instrument,
}: UseTunerPitchParams): UseTunerPitchResult {
  const [supported]    = useState(checkSupported);
  const [running,      setRunning]      = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [targetFreq,   setTargetFreq]   = useState<number | null>(null);
  const [cents,        setCents]        = useState(0);
  const [activeString, setActiveString] = useState<number | null>(null);
  const [vibration,    setVibration]    = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  // Live refs so RAF/loop reads current values without restarting
  const lockedStringRef = useRef(lockedString);
  const lockModeRef     = useRef(lockMode);
  const a4Ref           = useRef(a4);
  const stringsRef      = useRef(strings);
  useEffect(() => { lockedStringRef.current = lockedString; }, [lockedString]);
  useEffect(() => { lockModeRef.current     = lockMode;     }, [lockMode]);
  useEffect(() => { a4Ref.current           = a4;           }, [a4]);
  useEffect(() => { stringsRef.current      = strings;      }, [strings]);

  // MPM engine — one detector per instrument profile; rebuilt when instrument changes
  const instrumentRef = useRef(instrument);
  const { minFreq: initMin, maxFreq: initMax, noiseGate: initGate, clarityThreshold: initClarity } = detectionProfiles[instrument];
  const detectorRef = useRef<PitchDetectorMPM>(new PitchDetectorMPM({
    minFrequency:     initMin,
    maxFrequency:     initMax,
    noiseGateRms:     initGate,
    clarityThreshold: initClarity,
  }));
  const smootherRef = useRef<PitchSmoother>(new PitchSmoother(9, 20));
  useEffect(() => {
    if (instrumentRef.current === instrument) return;
    instrumentRef.current = instrument;
    const p = detectionProfiles[instrument];
    detectorRef.current = new PitchDetectorMPM({
      minFrequency:     p.minFreq,
      maxFrequency:     p.maxFreq,
      noiseGateRms:     p.noiseGate,
      clarityThreshold: p.clarityThreshold,
    });
    smootherRef.current.reset();
  }, [instrument]);

  // Reset smoother when user picks a different string (avoids stale frames)
  const chimeFiredRef    = useRef(false);
  const inTuneStartRef   = useRef<number | null>(null);
  useEffect(() => {
    smootherRef.current.reset();
    chimeFiredRef.current  = false;
    inTuneStartRef.current = null;
  }, [lockedString]);

  const runningRef       = useRef(false);
  const ctxRef           = useRef<unknown>(null);
  const streamRef        = useRef<unknown>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const bufferRef        = useRef<Float32Array | null>(null);
  const rafRef           = useRef<number | null>(null);
  const smoothCentsRef   = useRef(0);
  const holdTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDetection = useCallback(() => {
    setDetectedFreq(null);
    setTargetFreq(null);
    setActiveString(null);
    setCents(0);
    setVibration(0);
    smoothCentsRef.current   = 0;
    inTuneStartRef.current   = null;
    chimeFiredRef.current    = false;
  }, []);

  const cleanup = useCallback(() => {
    const g = globalThis as Record<string, unknown>;
    const caf = g["cancelAnimationFrame"] as ((id: number) => void) | undefined;
    if (rafRef.current != null && caf) caf(rafRef.current);
    rafRef.current = null;
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    const stream = streamRef.current as { getTracks?: () => { stop: () => void }[] } | null;
    if (stream?.getTracks) { try { stream.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ } }
    streamRef.current = null;
    const ctx = ctxRef.current as { close?: () => void } | null;
    if (ctx?.close) { try { ctx.close(); } catch { /* ignore */ } }
    ctxRef.current  = null;
    analyserRef.current = null;
    bufferRef.current   = null;
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    cleanup();
    clearDetection();
    setRunning(false);
  }, [cleanup, clearDetection]);

  // ── Shared frame processor ────────────────────────────────────────────────

  const processFrame = useCallback((samples: Float32Array, sampleRate: number) => {
    const frame = detectorRef.current.detect(samples, sampleRate);

    if (!frame) {
      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          clearDetection();
          holdTimerRef.current = null;
        }, 100);
      }
      return;
    }

    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }

    const smoothed = smootherRef.current.push(frame);

    const strs    = stringsRef.current;
    const targets: StringTarget[] = strs.map((s, i) => ({
      idx: i, label: s.label, frequency: midiToFrequency(s.midi, a4Ref.current),
    }));

    const target = lockModeRef.current === "locked"
      ? targets[Math.min(lockedStringRef.current, targets.length - 1)]
      : pickBestTarget(smoothed.frequency, targets);

    const corrected = rejectOctaveError(smoothed.frequency, target.frequency);
    const rawCents  = Math.max(-50, Math.min(50, 1200 * Math.log2(corrected / target.frequency)));

    setDetectedFreq(corrected);
    setTargetFreq(target.frequency);
    setActiveString(target.idx);

    const centsTarget = Math.abs(rawCents) <= 1.5 ? 0 : rawCents;
    smoothCentsRef.current += (centsTarget - smoothCentsRef.current) * EMA_ALPHA;
    setCents(smoothCentsRef.current);

    const now = performance.now();
    const displayInTune = Math.abs(smoothCentsRef.current) <= 3;
    if (displayInTune) {
      if (inTuneStartRef.current === null) inTuneStartRef.current = now;
      if (!chimeFiredRef.current && now - inTuneStartRef.current >= 300) {
        chimeFiredRef.current = true;
        if (Platform.OS === "web") {
          playWebChime(ctxRef.current);
        } else {
          try {
            const Haptics = require("expo-haptics") as typeof import("expo-haptics");
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch { /* ignore */ }
        }
      }
    } else {
      inTuneStartRef.current = null;
      if (Math.abs(smoothCentsRef.current) > 8) chimeFiredRef.current = false;
    }
  }, [clearDetection]);

  // ── Web RAF tick ─────────────────────────────────────────────────────────

  const webTick = useCallback((sampleRate: number) => {
    const analyser = analyserRef.current;
    const buffer   = bufferRef.current;
    if (!analyser || !buffer || !runningRef.current) return;

    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);

    // Vibration from raw amplitude (before noise gate)
    let sq = 0;
    for (let i = 0; i < buffer.length; i++) sq += buffer[i] * buffer[i];
    const rms = Math.sqrt(sq / buffer.length);
    if (rms > 0.003) setVibration(Math.min(1, rms * 12));
    else             setVibration((v) => Math.max(0, v - 0.03));

    processFrame(buffer, sampleRate);

    const g = globalThis as Record<string, unknown>;
    rafRef.current = (g["requestAnimationFrame"] as (cb: () => void) => number)(() => webTick(sampleRate));
  }, [processFrame]);

  // ── Native chunk processor ────────────────────────────────────────────────

  const processNativeChunk = useCallback((samples: Float32Array) => {
    let sq = 0;
    for (let i = 0; i < samples.length; i++) sq += samples[i] * samples[i];
    const rms = Math.sqrt(sq / samples.length);
    if (rms > 0.003) setVibration(Math.min(1, rms * 12));
    else             setVibration(0);

    processFrame(samples, NATIVE_SAMPLE_RATE);
  }, [processFrame]);

  // ── Start ─────────────────────────────────────────────────────────────────

  const start = useCallback(async () => {
    if (!supported || runningRef.current) return;
    setError(null);
    runningRef.current = true;
    setRunning(true);
    smootherRef.current.reset();

    if (Platform.OS !== "web") {
      // iOS: expo-av WAV chunk loop
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Audio } = require("expo-av") as typeof import("expo-av");
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== "granted") {
          setError("Microphone access blocked. Allow it in Settings, then try again.");
          stop();
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      } catch {
        setError("Could not start the microphone.");
        stop();
        return;
      }

      let nullStreak = 0;
      while (runningRef.current) {
        const samples = await recordOneChunk();
        if (!runningRef.current) break;
        if (samples && samples.length > 200) {
          nullStreak = 0;
          processNativeChunk(samples);
        } else {
          nullStreak++;
          if (nullStreak >= 8) {
            setError("Microphone recording not supported on this device.");
            stop();
            break;
          }
        }
      }

      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { Audio } = require("expo-av") as typeof import("expo-av");
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch { /* ignore */ }
      return;
    }

    // Web: getUserMedia + AudioContext + RAF loop
    const g = globalThis as Record<string, unknown>;
    try {
      const nav = g["navigator"] as { mediaDevices: { getUserMedia: (c: unknown) => Promise<MediaStream> } };
      const stream = await nav.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const Ctx = (g["AudioContext"] ?? g["webkitAudioContext"]) as typeof AudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }

      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize              = FFT_SIZE;
      analyser.smoothingTimeConstant = 0;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current   = new Float32Array(analyser.fftSize);

      rafRef.current = (g["requestAnimationFrame"] as (cb: () => void) => number)(() => webTick(ctx.sampleRate));
    } catch (e) {
      cleanup();
      setRunning(false);
      runningRef.current = false;
      const err    = e as { name?: string; message?: string };
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setError(denied
        ? "Microphone access blocked. Allow it in browser settings."
        : (err?.message ?? "Couldn't start the microphone."),
      );
    }
  }, [supported, stop, cleanup, webTick, processNativeChunk]);

  useEffect(() => () => { runningRef.current = false; cleanup(); }, [cleanup]);

  return { running, supported, start, stop, detectedFreq, targetFreq, cents, activeString, vibration, error };
}
