/**
 * useNativeTuner — hidden-WebView pitch detection for iOS and Android.
 *
 * The WebView runs getUserMedia + Web Audio API + MPM pitch detection
 * (see lib/tuner/webviewHtml.ts). Results are sent back via postMessage.
 *
 * Returns the same interface as useTunerPitch plus:
 *   webViewRef    — attach to the <WebView> ref prop
 *   handleMessage — attach to the <WebView> onMessage prop
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { detectionProfiles } from "@/lib/tunerData";
import type { UseTunerPitchParams, UseTunerPitchResult } from "./useTunerPitch";

const EMA_ALPHA = 0.4;

// Minimal type that matches what we actually use from the WebView instance
type WebViewHandle = { injectJavaScript: (js: string) => void };

export interface UseNativeTunerResult extends UseTunerPitchResult {
  webViewRef:    React.RefObject<WebViewHandle | null>;
  handleMessage: (event: { nativeEvent: { data: string } }) => void;
  onLoad:        () => void;
}

export function useNativeTuner({
  strings, lockedString, lockMode, a4, instrument,
}: UseTunerPitchParams): UseNativeTunerResult {
  const [running,      setRunning]      = useState(false);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [targetFreq,   setTargetFreq]   = useState<number | null>(null);
  const [cents,        setCents]        = useState(0);
  const [activeString, setActiveString] = useState<number | null>(null);
  const [vibration,    setVibration]    = useState(0);
  const [error,        setError]        = useState<string | null>(null);

  const webViewRef      = useRef<WebViewHandle | null>(null);
  const runningRef      = useRef(false);
  const loadedRef       = useRef(false);
  const pendingConfig   = useRef<object | null>(null);
  const smoothCentsRef  = useRef(0);
  const holdTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep live copies so injectJS closures always read fresh values
  const stringsRef      = useRef(strings);
  const lockedStringRef = useRef(lockedString);
  const lockModeRef     = useRef(lockMode);
  const a4Ref           = useRef(a4);
  const instrumentRef   = useRef(instrument);
  useEffect(() => { stringsRef.current = strings; },           [strings]);
  useEffect(() => { lockedStringRef.current = lockedString; }, [lockedString]);
  useEffect(() => { lockModeRef.current = lockMode; },         [lockMode]);
  useEffect(() => { a4Ref.current = a4; },                     [a4]);
  useEffect(() => { instrumentRef.current = instrument; },     [instrument]);

  const clearDetection = useCallback(() => {
    setDetectedFreq(null);
    setTargetFreq(null);
    setActiveString(null);
    setCents(0);
    setVibration(0);
    smoothCentsRef.current = 0;
  }, []);

  const inject = useCallback((code: string) => {
    webViewRef.current?.injectJavaScript(code + "; true;");
  }, []);

  const buildConfig = useCallback(() => ({
    strings:      stringsRef.current,
    lockMode:     lockModeRef.current,
    lockedString: lockedStringRef.current,
    a4:           a4Ref.current,
    profile:      detectionProfiles[instrumentRef.current],
  }), []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setError(null);
    smoothCentsRef.current = 0;
    const cfg = buildConfig();
    if (loadedRef.current) {
      inject(`window.startTuner(${JSON.stringify(cfg)})`);
    } else {
      // WebView not loaded yet — queue it; onLoad will fire it
      pendingConfig.current = cfg;
    }
  }, [inject, buildConfig]);

  const stop = useCallback(() => {
    runningRef.current = false;
    setRunning(false);
    clearDetection();
    inject(`window.stopTuner()`);
  }, [inject, clearDetection]);

  const onLoad = useCallback(() => {
    loadedRef.current = true;
    if (pendingConfig.current !== null) {
      inject(`window.startTuner(${JSON.stringify(pendingConfig.current)})`);
      pendingConfig.current = null;
    }
  }, [inject]);

  // Push config updates into the WebView while running
  useEffect(() => {
    if (!runningRef.current) return;
    inject(`window.updateConfig(${JSON.stringify({ strings, lockMode, lockedString, a4, profile: detectionProfiles[instrument] })})`);
  }, [strings, lockMode, lockedString, a4, instrument, inject]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    let msg: Record<string, unknown>;
    try { msg = JSON.parse(event.nativeEvent.data) as Record<string, unknown>; } catch { return; }

    if (msg.type === "ready") {
      // Audio connected — nothing extra to do
    } else if (msg.type === "pitch") {
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
      const raw = msg.cents as number;
      const centsTarget = Math.abs(raw) <= 1.5 ? 0 : raw;
      smoothCentsRef.current += (centsTarget - smoothCentsRef.current) * EMA_ALPHA;
      setCents(smoothCentsRef.current);
      setDetectedFreq(msg.detectedFreq as number);
      setTargetFreq(msg.targetFreq as number);
      setActiveString(msg.activeString as number);
      setVibration(msg.vibration as number);
    } else if (msg.type === "settling") {
      if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
      if (msg.visualIdx != null) setActiveString(msg.visualIdx as number);
      setVibration(Math.min(1, (msg.rms as number) * 10));
    } else if (msg.type === "silence") {
      setVibration((v) => Math.max(0, v - 0.04));
      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          clearDetection();
          holdTimerRef.current = null;
        }, 100);
      }
    } else if (msg.type === "error") {
      runningRef.current = false;
      setRunning(false);
      setError(msg.message as string);
      clearDetection();
    }
  }, [clearDetection]);

  useEffect(() => () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
  }, []);

  return {
    running, supported: true, start, stop,
    detectedFreq, targetFreq, cents, activeString, vibration, error,
    webViewRef, handleMessage, onLoad,
  };
}
