/**
 * useMicPitch — live microphone pitch detection.
 *
 * WEB: getUserMedia + AudioContext AnalyserNode → autocorrelation.
 * iOS NATIVE (Expo Go): records short WAV chunks via expo-av, parses the raw
 *   PCM bytes, runs the same autocorrelation engine. Updates ~5 times/second.
 * ANDROID: not yet supported (expo-av can't output WAV on Android without a
 *   native module) — reports supported:false and shows a graceful message.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

import { analyzeFreq, detectPitchAutocorrelation, type PitchReading } from "@/lib/pitch";

export type MicStatus =
  | "unsupported"
  | "idle"
  | "requesting"
  | "listening"
  | "denied"
  | "error";

export interface MicPitch {
  supported: boolean;
  status: MicStatus;
  reading: PitchReading | null;
  error: string | null;
  start: () => void;
  stop: () => void;
}

const FFT_SIZE = 2048;
const MIN_INTERVAL_MS = 60;
const NATIVE_SAMPLE_RATE = 22050;
const CHUNK_MS = 120;

function isSupported(): boolean {
  if (Platform.OS === "ios") return true;
  if (Platform.OS === "web") {
    const g = globalThis as unknown as {
      navigator?: { mediaDevices?: { getUserMedia?: unknown } };
    };
    return !!g.navigator?.mediaDevices?.getUserMedia;
  }
  return false;
}

function parseWavSamples(bin: string): Float32Array | null {
  if (bin.length < 12) return null;
  if (bin.slice(0, 4) !== "RIFF" || bin.slice(8, 12) !== "WAVE") return null;

  let offset = 12;
  while (offset + 8 <= bin.length) {
    const chunkId = bin.slice(offset, offset + 4);
    const chunkSize =
      (bin.charCodeAt(offset + 4) & 0xff) |
      ((bin.charCodeAt(offset + 5) & 0xff) << 8) |
      ((bin.charCodeAt(offset + 6) & 0xff) << 16) |
      ((bin.charCodeAt(offset + 7) & 0xff) << 24);

    if (chunkId === "data") {
      const numSamples = Math.floor(chunkSize / 2);
      const dataOffset = offset + 8;
      if (dataOffset + chunkSize > bin.length) return null;
      const samples = new Float32Array(numSamples);
      for (let i = 0; i < numSamples; i++) {
        const lo = bin.charCodeAt(dataOffset + i * 2) & 0xff;
        const hi = bin.charCodeAt(dataOffset + i * 2 + 1) & 0xff;
        let v = lo | (hi << 8);
        if (v > 32767) v -= 65536;
        samples[i] = v / 32768;
      }
      return samples;
    }

    offset += 8 + chunkSize;
    if (chunkSize % 2 !== 0) offset++;
  }
  return null;
}

async function recordOneChunk(): Promise<Float32Array | null> {
  const { Audio } = require("expo-av") as typeof import("expo-av");
  const FileSystem = require("expo-file-system") as typeof import("expo-file-system");

  const recording = new Audio.Recording();
  try {
    await recording.prepareToRecordAsync({
      isMeteringEnabled: false,
      android: {
        extension: ".wav",
        outputFormat: 0,  // AndroidOutputFormat.DEFAULT
        audioEncoder: 0,  // AndroidAudioEncoder.DEFAULT
        sampleRate: NATIVE_SAMPLE_RATE,
        numberOfChannels: 1,
        bitRate: NATIVE_SAMPLE_RATE * 16,
      },
      ios: {
        extension: ".wav",
        outputFormat: "lpcm",  // IOSOutputFormat.LINEARPCM
        audioQuality: 0,       // IOSAudioQuality.MIN
        sampleRate: NATIVE_SAMPLE_RATE,
        numberOfChannels: 1,
        bitRate: NATIVE_SAMPLE_RATE * 16,
        linearPCMBitDepth: 16,
        linearPCMIsBigEndian: false,
        linearPCMIsFloat: false,
      },
      web: {},
    } as any);

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
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: "base64" as any,
    });
    await FileSystem.deleteAsync(uri, { idempotent: true });

    const bin = atob(b64);
    return parseWavSamples(bin);
  } catch {
    try {
      const FileSystem2 = require("expo-file-system") as typeof import("expo-file-system");
      await FileSystem2.deleteAsync(uri, { idempotent: true });
    } catch { /* ignore */ }
    return null;
  }
}

export function useMicPitch(useSharps = true): MicPitch {
  const [supported] = useState(isSupported);
  const [status, setStatus] = useState<MicStatus>(supported ? "idle" : "unsupported");
  const [reading, setReading] = useState<PitchReading | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ctxRef      = useRef<any>(null);
  const streamRef   = useRef<any>(null);
  const analyserRef = useRef<any>(null);
  const bufRef      = useRef<Float32Array | null>(null);
  const rafRef      = useRef<number | null>(null);
  const runningRef  = useRef(false);

  const cleanup = useCallback(() => {
    const g = globalThis as any;
    if (rafRef.current != null && g.cancelAnimationFrame) {
      g.cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = null;
    if (streamRef.current) {
      try { streamRef.current.getTracks().forEach((t: any) => t.stop()); } catch { /* ignore */ }
      streamRef.current = null;
    }
    if (ctxRef.current) {
      try { ctxRef.current.close(); } catch { /* ignore */ }
      ctxRef.current = null;
    }
    analyserRef.current = null;
    bufRef.current = null;
  }, []);

  const stop = useCallback(() => {
    runningRef.current = false;
    cleanup();
    setReading(null);
    setStatus((s) => (s === "unsupported" ? s : "idle"));
  }, [cleanup]);

  const start = useCallback(async () => {
    if (!supported) return;
    setError(null);
    setStatus("requesting");

    if (Platform.OS !== "web") {
      // ── Native (iOS): expo-av WAV chunk recording loop ──
      try {
        const { Audio } = require("expo-av") as typeof import("expo-av");
        const { status: permStatus } = await Audio.requestPermissionsAsync();
        if (permStatus !== "granted") {
          setStatus("denied");
          setError("Microphone access blocked. Allow it in Settings, then try again.");
          return;
        }
        await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      } catch {
        setStatus("error");
        setError("Could not start the microphone.");
        return;
      }

      setStatus("listening");
      runningRef.current = true;

      while (runningRef.current) {
        const samples = await recordOneChunk();
        if (!runningRef.current) break;
        if (samples && samples.length > 200) {
          const hz = detectPitchAutocorrelation(samples, NATIVE_SAMPLE_RATE);
          setReading(hz ? analyzeFreq(hz, useSharps) : null);
        } else {
          setReading(null);
        }
      }

      try {
        const { Audio } = require("expo-av") as typeof import("expo-av");
        await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      } catch { /* ignore */ }

      setReading(null);
      setStatus("idle");
      return;
    }

    // ── Web: getUserMedia + Web Audio API ──
    const g = globalThis as any;
    try {
      const stream = await g.navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      streamRef.current = stream;

      const Ctx = g.AudioContext || g.webkitAudioContext;
      const ctx = new Ctx();
      ctxRef.current = ctx;
      if (ctx.state === "suspended") {
        try { await ctx.resume(); } catch { /* ignore */ }
      }

      const source   = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = FFT_SIZE;
      source.connect(analyser);
      analyserRef.current = analyser;
      bufRef.current = new Float32Array(analyser.fftSize);
      setStatus("listening");

      let last = 0;
      const loop = (ts: number) => {
        const a   = analyserRef.current;
        const buf = bufRef.current;
        const c   = ctxRef.current;
        if (!a || !buf || !c) return;
        if (ts - last >= MIN_INTERVAL_MS) {
          last = ts;
          a.getFloatTimeDomainData(buf);
          const hz = detectPitchAutocorrelation(buf, c.sampleRate);
          setReading(hz ? analyzeFreq(hz, useSharps) : null);
        }
        rafRef.current = g.requestAnimationFrame(loop);
      };
      rafRef.current = g.requestAnimationFrame(loop);
    } catch (e) {
      cleanup();
      const err = e as { name?: string; message?: string };
      const denied = err?.name === "NotAllowedError" || err?.name === "SecurityError";
      setStatus(denied ? "denied" : "error");
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser settings, then try again."
          : err?.message ?? "Couldn't start the microphone.",
      );
    }
  }, [supported, useSharps, cleanup]);

  useEffect(() => cleanup, [cleanup]);

  return { supported, status, reading, error, start, stop };
}
