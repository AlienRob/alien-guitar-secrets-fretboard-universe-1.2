/**
 * useTunerPitch — web-only pitch detection hook.
 * getUserMedia → AudioContext → AnalyserNode → RAF loop.
 * Ported from the AGS mobile app's hooks/useTunerPitch.ts (web branch only).
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  midiToFrequency,
  getCentsOff,
  detectEnergyString,
  detectStringCandidates,
  type TunerString,
} from "@/lib/tunerPitch";
import { type StringNote } from "@/lib/tunerData";

export interface UseTunerPitchParams {
  strings:      StringNote[];
  lockedString: number;
  lockMode:     "auto" | "locked";
  a4:           number;
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

const FFT_SIZE           = 4096;
const EMA_ALPHA          = 0.20;
const CONFIDENCE_THRESH  = 0.48;

function checkSupported(): boolean {
  return !!(navigator?.mediaDevices?.getUserMedia);
}

function playWebChime(ctx: AudioContext): void {
  try {
    const pairs: [number, number][] = [[1046.5, 0.16], [1568.0, 0.10]];
    pairs.forEach(([freq, vol]) => {
      const osc = ctx.createOscillator();
      const amp = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      amp.gain.setValueAtTime(0, ctx.currentTime);
      amp.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.012);
      amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
      osc.connect(amp);
      amp.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.75);
    });
  } catch { /* ignore */ }
}

export function useTunerPitch({
  strings, lockedString, lockMode, a4,
}: UseTunerPitchParams): UseTunerPitchResult {
  const [supported]    = useState(checkSupported);
  const [running,      setRunning]      = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [targetFreq,   setTargetFreq]   = useState<number | null>(null);
  const [cents,        setCents]        = useState(0);
  const [activeString, setActiveString] = useState<number | null>(null);
  const [vibration,    setVibration]    = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const lockedStringRef = useRef(lockedString);
  const lockModeRef     = useRef(lockMode);
  const a4Ref           = useRef(a4);
  const stringsRef      = useRef(strings);
  useEffect(() => { lockedStringRef.current = lockedString; }, [lockedString]);
  useEffect(() => { lockModeRef.current     = lockMode;     }, [lockMode]);
  useEffect(() => { a4Ref.current           = a4;           }, [a4]);
  useEffect(() => { stringsRef.current      = strings;      }, [strings]);

  const chimeFiredRef  = useRef(false);
  const inTuneStartRef = useRef<number | null>(null);
  useEffect(() => {
    chimeFiredRef.current  = false;
    inTuneStartRef.current = null;
  }, [lockedString]);

  const runningRef       = useRef(false);
  const ctxRef           = useRef<AudioContext | null>(null);
  const streamRef        = useRef<MediaStream | null>(null);
  const analyserRef      = useRef<AnalyserNode | null>(null);
  const bufferRef        = useRef<Float32Array | null>(null);
  const rafRef           = useRef<number | null>(null);
  const smoothCentsRef   = useRef(0);
  const lastStringIdxRef = useRef<number | null>(null);
  const historyRef       = useRef<{ stringIdx: number; cents: number; frequency: number; confidence: number; time: number }[]>([]);
  const wasLoudRef       = useRef(false);
  const attackStartRef   = useRef(0);
  const holdTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearDetection = useCallback(() => {
    setDetectedFreq(null);
    setTargetFreq(null);
    setActiveString(null);
    setCents(0);
    setVibration(0);
    smoothCentsRef.current   = 0;
    lastStringIdxRef.current = null;
    historyRef.current       = [];
    inTuneStartRef.current   = null;
    chimeFiredRef.current    = false;
  }, []);

  const cleanup = useCallback(() => {
    if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    streamRef.current?.getTracks().forEach((t) => { try { t.stop(); } catch { /* ignore */ } });
    streamRef.current = null;
    try { ctxRef.current?.close(); } catch { /* ignore */ }
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

  const webTick = useCallback((sampleRate: number) => {
    const analyser = analyserRef.current;
    const buffer   = bufferRef.current;
    if (!analyser || !buffer || !runningRef.current) return;
    analyser.getFloatTimeDomainData(buffer as Float32Array<ArrayBuffer>);
    const now = performance.now();

    let mean = 0;
    for (let i = 0; i < buffer.length; i++) mean += buffer[i];
    mean /= buffer.length;
    for (let i = 0; i < buffer.length; i++) buffer[i] -= mean;

    let sq = 0;
    for (let i = 0; i < buffer.length; i++) sq += buffer[i] * buffer[i];
    const rms    = Math.sqrt(sq / buffer.length);
    const isLoud = rms > 0.0045;

    if (isLoud) setVibration(Math.min(1, rms * 12));
    else        setVibration((v) => Math.max(0, v - 0.03));

    if (isLoud && !wasLoudRef.current) { attackStartRef.current = now; historyRef.current = []; }
    wasLoudRef.current = isLoud;

    if (!isLoud) {
      historyRef.current = [];
      lastStringIdxRef.current = null;
      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          clearDetection();
          holdTimerRef.current = null;
        }, 400);
      }
      rafRef.current = requestAnimationFrame(() => webTick(sampleRate));
      return;
    }
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }

    const strs = stringsRef.current;
    const tunerStrings: TunerString[] = strs.map((s, i) => ({
      idx: i, label: s.label, midi: s.midi, frequency: midiToFrequency(s.midi, a4Ref.current),
    }));

    const energyIdx = detectEnergyString(buffer, sampleRate, tunerStrings);
    if (energyIdx !== null) {
      const vi = lockModeRef.current === "locked" ? lockedStringRef.current : energyIdx;
      setActiveString(vi);
      setTargetFreq(midiToFrequency(strs[vi].midi, a4Ref.current));
    }

    if (now - attackStartRef.current < 90) {
      rafRef.current = requestAnimationFrame(() => webTick(sampleRate));
      return;
    }

    const candidateStrs = lockModeRef.current === "locked"
      ? tunerStrings.filter((s) => s.idx === lockedStringRef.current)
      : tunerStrings;
    const candidates = detectStringCandidates(buffer, sampleRate, candidateStrs, energyIdx, lastStringIdxRef.current);
    const best = candidates[0];

    if (!best || best.confidence < CONFIDENCE_THRESH || Math.abs(best.cents) > 70) {
      rafRef.current = requestAnimationFrame(() => webTick(sampleRate));
      return;
    }

    historyRef.current.push({ stringIdx: best.string.idx, cents: best.cents, frequency: best.frequency, confidence: best.confidence, time: now });
    historyRef.current = historyRef.current.filter((r) => now - r.time <= 360);

    const latestIdx = historyRef.current[historyRef.current.length - 1].stringIdx;
    const sameStr   = historyRef.current.filter((r) => r.stringIdx === latestIdx);
    if (sameStr.length < 4) {
      rafRef.current = requestAnimationFrame(() => webTick(sampleRate));
      return;
    }
    const centsArr = sameStr.map((r) => r.cents).sort((a, b) => a - b);
    const iqLo = centsArr[Math.floor(centsArr.length * 0.20)];
    const iqHi = centsArr[Math.floor(centsArr.length * 0.80)];
    if (iqHi - iqLo > 9) {
      rafRef.current = requestAnimationFrame(() => webTick(sampleRate));
      return;
    }

    const medianCents = centsArr[Math.floor(centsArr.length / 2)];
    const targetF     = midiToFrequency(strs[latestIdx].midi, a4Ref.current);
    const stableFreq  = targetF * Math.pow(2, medianCents / 1200);
    lastStringIdxRef.current = latestIdx;

    const displayIdx = lockModeRef.current === "locked" ? lockedStringRef.current : latestIdx;
    const displayTgt = midiToFrequency(strs[displayIdx].midi, a4Ref.current);
    const rawCents   = Math.max(-50, Math.min(50,
      displayIdx === latestIdx ? medianCents : getCentsOff(stableFreq, displayTgt),
    ));

    setDetectedFreq(stableFreq);
    setTargetFreq(displayTgt);
    setActiveString(displayIdx);

    const centsTarget = Math.abs(rawCents) <= 2 ? 0 : rawCents;
    smoothCentsRef.current += (centsTarget - smoothCentsRef.current) * EMA_ALPHA;
    setCents(smoothCentsRef.current);

    const displayInTune = Math.abs(smoothCentsRef.current) <= 3;
    if (displayInTune) {
      if (inTuneStartRef.current === null) inTuneStartRef.current = now;
      if (!chimeFiredRef.current && now - inTuneStartRef.current >= 300 && ctxRef.current) {
        chimeFiredRef.current = true;
        playWebChime(ctxRef.current);
      }
    } else {
      inTuneStartRef.current = null;
      if (Math.abs(smoothCentsRef.current) > 8) chimeFiredRef.current = false;
    }

    rafRef.current = requestAnimationFrame(() => webTick(sampleRate));
  }, [clearDetection]);

  const start = useCallback(async () => {
    if (!supported || runningRef.current) return;
    setError(null);
    runningRef.current = true;
    setRunning(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const Ctx = (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext);
      const ctx = new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") { try { await ctx.resume(); } catch { /* ignore */ } }

      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufferRef.current   = new Float32Array(analyser.fftSize);

      rafRef.current = requestAnimationFrame(() => webTick(ctx.sampleRate));
    } catch (e) {
      cleanup();
      setRunning(false);
      runningRef.current = false;
      const err    = e as { name?: string; message?: string };
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setError(denied
        ? "Microphone access blocked. Allow it in your browser settings."
        : (err?.message ?? "Could not start the microphone."),
      );
    }
  }, [supported, cleanup, webTick]);

  useEffect(() => () => { runningRef.current = false; cleanup(); }, [cleanup]);

  return { running, supported, start, stop, detectedFreq, targetFreq, cents, activeString, vibration, error };
}
