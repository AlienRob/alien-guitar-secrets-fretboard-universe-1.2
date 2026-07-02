import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, {
  Defs,
  Line as SvgLine,
  LinearGradient as SvgLinearGradient,
  Path as SvgPath,
  Pattern,
  Polygon,
  Stop,
} from "react-native-svg";
import { SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useRouter } from "expo-router";

// Module-scope require so the native view is registered exactly once (avoids
// "Tried to register two views with the same name RNCWebView" on HMR).
type NativeWebViewProps = {
  ref?: React.Ref<{ injectJavaScript: (js: string) => void }>;
  source: { html: string; baseUrl?: string };
  onMessage: (e: { nativeEvent: { data: string } }) => void;
  onLoad?: () => void;
  javaScriptEnabled?: boolean;
  allowsInlineMediaPlayback?: boolean;
  mediaPlaybackRequiresUserAction?: boolean;
  originWhitelist?: string[];
  onPermissionRequest?: (e: { nativeEvent: { grant: (r: string[]) => void; resources: string[] } }) => void;
  style?: object;
};
// eslint-disable-next-line @typescript-eslint/no-var-requires
const NativeWebView: React.ComponentType<NativeWebViewProps> | null =
  Platform.OS !== "web"
    ? (require("react-native-webview") as { WebView: React.ComponentType<NativeWebViewProps> }).WebView
    : null;

import { tunings, type Instrument } from "@/lib/tunerData";
import { useTunerPitch } from "@/hooks/useTunerPitch";
import { useNativeTuner } from "@/hooks/useNativeTuner";
import { TUNER_WEBVIEW_HTML } from "@/lib/tuner/webviewHtml";
import { UpgradeModal } from "@/components/upgrade-modal";
import { playInTunePing } from "@/lib/audio";

// ── String geometry ───────────────────────────────────────────────────────────
const TL = 21, TR = 79, BL = 15, BR = 85;
function strX(i: number, n: number, top: boolean): number {
  const L = top ? TL : BL, R = top ? TR : BR;
  return L + (R - L) * (n > 1 ? i / (n - 1) : 0.5);
}
function strW(i: number, n: number): number {
  return parseFloat((1.15 - 0.87 * (n > 1 ? i / (n - 1) : 0)).toFixed(2));
}
function woundCount(n: number): number { return n >= 6 ? 3 : n >= 4 ? 2 : 1; }

function formatNote(label: string): string {
  return label.replace(/#/g, "♯").replace(/b$/, "♭");
}

function freqToNoteName(freq: number, useFlats: boolean, a4: number): string {
  const sharps = ["C","C♯","D","D♯","E","F","F♯","G","G♯","A","A♯","B"];
  const flats  = ["C","D♭","D","E♭","E","F","G♭","G","A♭","A","B♭","B"];
  const names  = useFlats ? flats : sharps;
  const midi   = Math.round(12 * Math.log2(freq / a4) + 69);
  return names[((midi % 12) + 12) % 12];
}

const INST_LABELS: Record<Instrument, string> = {
  electric: "Electric Guitar",
  acoustic: "Acoustic Guitar",
  bass:     "Bass",
  uke:      "Ukulele",
};

const A4_MIN = 430;
const A4_MAX = 450;
const A4_VALS = Array.from({ length: A4_MAX - A4_MIN + 1 }, (_, i) => A4_MIN + i);

// ── Inline SVGs ───────────────────────────────────────────────────────────────
const SVG_GALACTIC_CORE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300"><defs><radialGradient id="core" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".14" stop-color="#f7da73"/><stop offset=".42" stop-color="#7d35ff"/><stop offset=".72" stop-color="#230650"/><stop offset="1" stop-color="transparent"/></radialGradient></defs><circle cx="150" cy="150" r="120" fill="url(#core)"/><circle cx="150" cy="150" r="92" fill="none" stroke="#f7da73" stroke-width="2" opacity=".65"/><circle cx="150" cy="150" r="52" fill="none" stroke="#b98cff" stroke-width="3" opacity=".8"/><path d="M36 150c55-36 173-36 228 0M58 202c56-62 128-96 184-104M62 96c78 20 132 68 176 126" fill="none" stroke="#ffffff" stroke-width="2" opacity=".38"/></svg>`;

const SVG_HAMBURGER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="#fff8e6" stroke-width="7" stroke-linecap="round"><path d="M25 32h50M25 50h50M25 68h50"/></g></svg>`;

const SVG_SETTINGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="none" stroke="#fff8e6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M50 18l6 9 11-1 3 10 10 5-4 10 4 10-10 5-3 10-11-1-6 9-6-9-11 1-3-10-10-5 4-10-4-10 10-5 3-10 11 1z"/><circle cx="50" cy="50" r="13"/></g></svg>`;

const SVG_GUITAR_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><g fill="none" stroke="#fff8e6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M71 20l29 29-9 9-8-8-31 31c-3 19-20 25-32 13s-6-29 13-32l31-31-8-8z"/><circle cx="34" cy="80" r="9"/><path d="M43 71l14 14M66 35l19 19"/></g></svg>`;


// ── Screen ────────────────────────────────────────────────────────────────────
// ─── Arc cents meter ──────────────────────────────────────────────────────────
// Replaces the flat pip bar with 25 radial tick marks arranged on a circular arc.
// The center tick (pos=0) is at the apex of the arc — perfectly aligned with the
// note name displayed directly below.
function ArcMeter({
  litFlat, litSharp, inTune, isClose, isOut, detectedFreq, screenW,
}: {
  litFlat: number; litSharp: number;
  inTune: boolean; isClose: boolean; isOut: boolean;
  detectedFreq: number | null; screenW: number;
}) {
  const H  = 88;
  const cx = screenW / 2;
  const cy = H + 62;   // arc center sits below the SVG — creates the upward curve
  const R  = 120;      // arc radius
  const SPAN_DEG = 100;
  const STEP = SPAN_DEG / 24; // degrees per tick (~4.17°)

  const ticks = useMemo(() => Array.from({ length: 25 }, (_, idx) => {
    const pos     = idx - 12;
    const angleDeg = 270 + pos * STEP;
    const angleRad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);

    const absPos   = Math.abs(pos);
    const isCenter = pos === 0;
    const tickLen  = isCenter ? 24 : absPos <= 2 ? 16 : absPos <= 5 ? 14 : 12;
    const sw       = isCenter ? (inTune ? 5 : 2.5) : absPos <= 2 ? 1.2 : 1;

    const x1 = cx + (R - tickLen) * cosA;
    const y1 = cy + (R - tickLen) * sinA;
    const x2 = cx + R * cosA;
    const y2 = cy + R * sinA;

    let color: string;
    if (isCenter) {
      color = inTune            ? "#1db954"
            : isClose           ? "#f4c64b"
            : isOut             ? "#ff4040"
            : detectedFreq != null ? "#f4c64b"
            :                    "#444";
    } else {
      const lit = (pos < 0 && absPos <= litFlat) || (pos > 0 && pos <= litSharp);
      color = lit ? (isClose ? "#f4c64b" : "#ff4040") : "#5a5654";
    }

    return { key: idx, x1, y1, x2, y2, color, sw };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [litFlat, litSharp, inTune, isClose, isOut, detectedFreq, cx]);

  return (
    <Svg width={screenW} height={H} style={{ alignSelf: "center" }}>
      {ticks.map((t) => (
        <SvgLine
          key={t.key}
          x1={t.x1} y1={t.y1}
          x2={t.x2} y2={t.y2}
          stroke={t.color}
          strokeWidth={t.sw}
          strokeLinecap="round"
        />
      ))}
    </Svg>
  );
}

export default function TunerScreen() {
  const router            = useRouter();
  const { width, height } = useWindowDimensions();
  const insets            = useSafeAreaInsets();

  const [instrument,      setInstrument]      = useState<Instrument>("electric");
  const [stringCount,     setStringCount]     = useState("6");
  const [tuningIndex,     setTuningIndex]     = useState(0);
  const [a4,              setA4]              = useState(440);
  const [lockMode,        setLockMode]        = useState<"auto"|"locked">("auto");
  const [lockedString,    setLockedString]    = useState(0);
  const [showTuning,      setShowTuning]      = useState(false);
  const [showSettings,    setShowSettings]    = useState(false);
  const [showInstrument,  setShowInstrument]  = useState(false);
  const [showStrings,     setShowStrings]     = useState(false);
  const [micPerm, setMicPerm] = useState<"unknown"|"granted"|"denied"|"prompt">("unknown");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isPremium = true;


  const checkMicPerm = useCallback(async () => {
    if (Platform.OS === "web") {
      try {
        const nav = (globalThis as Record<string, unknown>)["navigator"] as
          { permissions?: { query: (q: { name: string }) => Promise<{ state: string }> } } | undefined;
        const result = await nav?.permissions?.query({ name: "microphone" });
        setMicPerm((result?.state ?? "unknown") as "granted"|"denied"|"prompt"|"unknown");
      } catch { setMicPerm("unknown"); }
    } else {
      try {
        const { Audio } = require("expo-av") as typeof import("expo-av");
        const { status } = await Audio.getPermissionsAsync();
        setMicPerm(status === "granted" ? "granted" : status === "denied" ? "denied" : "prompt");
      } catch { setMicPerm("unknown"); }
    }
  }, []);

  const requestMicPerm = useCallback(async () => {
    if (Platform.OS === "web") {
      try {
        const nav = (globalThis as Record<string, unknown>)["navigator"] as
          { mediaDevices: { getUserMedia: (c: unknown) => Promise<{ getTracks: () => { stop: () => void }[] }> } };
        const stream = await nav.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
        setMicPerm("granted");
      } catch { setMicPerm("denied"); }
    } else {
      try {
        const { Audio } = require("expo-av") as typeof import("expo-av");
        const { status } = await Audio.requestPermissionsAsync();
        if (status === "granted") { setMicPerm("granted"); }
        else { Linking.openSettings(); }
      } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => { if (showSettings) checkMicPerm(); }, [showSettings, checkMicPerm]);

  const counts = Object.keys(tunings[instrument]);

  const tuning = React.useMemo(() => {
    const presets = tunings[instrument][stringCount] ?? tunings[instrument][counts[0]];
    return presets[tuningIndex] ?? presets[0];
  }, [instrument, stringCount, tuningIndex, counts]);

  useEffect(() => {
    const first = Object.keys(tunings[instrument])[0];
    setStringCount(first);
    setTuningIndex(0);
    setLockedString(0);
  }, [instrument]);

  useEffect(() => {
    setTuningIndex(0);
    setLockedString(0);
  }, [stringCount]);

  const tunerParams = {
    a4,
    instrument,
    lockMode,
    lockedString,
    strings: tuning.strings.map((s, i) => ({ idx: i, label: s.label, midi: s.midi })),
  };

  // Web uses direct Web Audio API; iOS and Android use a hidden WebView with getUserMedia
  const webTuner    = useTunerPitch(tunerParams);
  const nativeTuner = useNativeTuner(tunerParams);
  const activeTuner = Platform.OS === "web" ? webTuner : nativeTuner;

  const { running, start, stop, cents, detectedFreq, activeString, vibration, error } = activeTuner;

  // ── Onset → freeze gate ───────────────────────────────────────────────────
  //
  // ONSET (150 ms): ignore the pick attack — display shows nothing.
  //   The hooks (EMA α=0.4) already smooth the pitch; no second EMA here.
  //
  // TRACKING: display shows the hook's cents directly. Needle is responsive
  //   because the hook converges in 3-4 frames (~300 ms) not 7+ frames.
  //
  // FREEZE: once cents ≤ 3 ¢ the display locks. Nothing moves it until
  //   the note drops out (detectedFreq → null from the hook's own 100 ms
  //   hold), at which point everything resets for the next pick.
  //
  const ONSET_MS  = 150;
  const NEW_NOTE_THRESHOLD = 150; // ¢ — jump bigger than this while frozen = new string

  const onsetTimeRef   = useRef<number | null>(null);
  const prevRawFreqRef = useRef<number | null>(null);
  const frozenRef      = useRef(false);
  const frozenFreqRef  = useRef<number | null>(null); // freq we locked on at freeze

  const [gatedFreq,  setGatedFreq]  = useState<number | null>(null);
  const [gatedCents, setGatedCents] = useState(0);

  useEffect(() => {
    if (detectedFreq == null) {
      onsetTimeRef.current   = null;
      prevRawFreqRef.current = null;
      frozenRef.current      = false;
      frozenFreqRef.current  = null;
      setGatedFreq(null);
      setGatedCents(0);
      return;
    }

    const now = Date.now();

    // While frozen, watch for a new note — don't wait for the hook to clear first
    if (frozenRef.current && frozenFreqRef.current != null) {
      const drift = Math.abs(1200 * Math.log2(detectedFreq / frozenFreqRef.current));
      if (drift > NEW_NOTE_THRESHOLD) {
        // New string played — unfreeze and start a fresh onset immediately
        frozenRef.current      = false;
        frozenFreqRef.current  = null;
        onsetTimeRef.current   = now;
        prevRawFreqRef.current = detectedFreq;
        setGatedFreq(null);
        setGatedCents(0);
      }
      return; // still frozen (or just entered onset — handled next frame)
    }

    if (prevRawFreqRef.current == null) onsetTimeRef.current = now;
    prevRawFreqRef.current = detectedFreq;

    // Still inside the onset window — show nothing
    if (onsetTimeRef.current == null || now - onsetTimeRef.current < ONSET_MS) return;

    // Pass hook's already-smoothed cents straight to the display
    setGatedFreq(detectedFreq);
    setGatedCents(cents);

    // Freeze the moment we hit in-tune
    if (Math.abs(cents) <= 3) {
      frozenRef.current     = true;
      frozenFreqRef.current = detectedFreq;
      setGatedCents(0);
    }
  }, [detectedFreq, cents]);


  const effectiveRunning      = running;
  const effectiveCents        = gatedCents;
  const effectiveDetectedFreq = gatedFreq;
  const effectiveActiveString = activeString;
  const effectiveError        = error;

  const inTune  = effectiveDetectedFreq != null && Math.abs(effectiveCents) <= 3;
  const isClose = effectiveDetectedFreq != null && !inTune && Math.abs(effectiveCents) <= 8;
  const isOut   = effectiveDetectedFreq != null && !inTune && !isClose;

  const useFlats  = tuning.strings.some((s) => s.label.includes("b"));
  const activeNote = effectiveDetectedFreq != null
      ? freqToNoteName(effectiveDetectedFreq, useFlats, a4)
      : "—";

  const litFlat  = (effectiveDetectedFreq != null && effectiveCents < 0)
    ? Math.min(12, Math.round(-effectiveCents * 12 / 50)) : 0;
  const litSharp = (effectiveDetectedFreq != null && effectiveCents > 0)
    ? Math.min(12, Math.round(effectiveCents * 12 / 50)) : 0;

  const n = tuning.strings.length;
  const fretboardW = width - 32;
  const px = (pct: number) => (fretboardW * pct) / 100;
  // Fretboard image natural height (580×794 PNG, rendered at container width)
  const fretImgH = (width - 32) * (794 / 580);

  // ── In-tune ping — fire once on the rising edge of inTune ────────────────
  const prevInTuneRef = useRef(false);
  useEffect(() => {
    if (inTune && !prevInTuneRef.current) playInTunePing();
    prevInTuneRef.current = inTune;
  }, [inTune]);

  // ── Sine wave animation on the active string ───────────────────────────────
  // Phase advances at 1.2 rad/frame (≈33ms) = ~36 rad/s = ~5.7 full visual
  // cycles per second, which reads as a convincingly fast vibrating string.
  // The timer stops (and phase resets) once the note is in-tune so the string
  // appears to settle — matching the freeze behaviour of the gate.
  const [wavePhase, setWavePhase] = useState(0);
  const waveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (waveTimerRef.current) clearInterval(waveTimerRef.current);
    if (running && effectiveActiveString != null && !inTune) {
      waveTimerRef.current = setInterval(() => setWavePhase(p => p + 1.2), 33);
    } else {
      setWavePhase(0);
    }
    return () => { if (waveTimerRef.current) clearInterval(waveTimerRef.current); };
  }, [running, effectiveActiveString, inTune]);

  // Traveling wave — sampled polyline so it looks smooth and alive.
  // 8 half-cycles are visible at once; the phase advances make the wave appear
  // to run along the string rather than standing still.
  const wavePath = useMemo(() => {
    if (effectiveActiveString == null || !running) return null;
    const i      = effectiveActiveString;
    const x1     = strX(i, n, true);
    const x2     = strX(i, n, false);
    const amp    = inTune ? 0 : 1.6;
    const LOBES  = 8;   // half-cycles visible on the string
    const STEPS  = 32;  // sample points — enough for a smooth curve
    const pts: string[] = [];
    for (let s = 0; s <= STEPS; s++) {
      const t   = s / STEPS;
      const y   = t * 100;
      // Linear interpolation from x1→x2 plus sinusoidal lateral displacement
      const xc  = x1 + (x2 - x1) * t;
      const disp = amp * Math.sin(LOBES * Math.PI * t - wavePhase);
      pts.push(`${(xc + disp).toFixed(2)} ${y.toFixed(2)}`);
    }
    const d = `M ${pts[0]} ` + pts.slice(1).map(p => `L ${p}`).join(" ");
    const color = inTune ? "#fff8e8" : "#e8c84a";
    return { d, color };
  }, [effectiveActiveString, running, n, inTune, wavePhase]);

  // Orbital pulse animation (React Native Animated — no reanimated worklets needed)
  const pulseScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScale, { toValue: 1.08, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseScale, { toValue: 1.00, duration: 1500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseScale]);
  const pulseStyle = { transform: [{ scale: pulseScale }] };

  const orbBorderColor = inTune ? "#22c55e"
    : isClose ? "#facc15"
    : isOut   ? "#ef4444"
    : "rgba(140,60,220,0.6)";

  const handleMicPress = useCallback(() => {
    if (Platform.OS !== "web") {
      try {
        const Haptics = require("expo-haptics") as typeof import("expo-haptics");
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch { /* ignore */ }
    }
    if (running) stop(); else start();
  }, [running, start, stop]);

  // Tuning state text
  const tuneStateText = effectiveRunning ? (inTune ? "IN TUNE" : "LISTENING") : "TAP TO TUNE";
  const tuneStateColor = effectiveRunning
    ? (inTune ? "#22c55e" : "rgba(255,255,255,0.55)")
    : "rgba(255,255,255,0.55)";

  // Flat/sharp arrow colours
  const ts = effectiveDetectedFreq == null ? "idle"
    : inTune   ? "tune"
    : isClose  ? (effectiveCents < 0 ? "close-flat" : "close-sharp")
    :              effectiveCents < 0 ? "out-flat"   : "out-sharp";

  function flatColor() {
    if (ts === "tune") return "#22c55e";
    if (ts === "close-flat") return "#facc15";
    if (ts === "out-flat")   return "#ef4444";
    return "rgba(244,198,75,0.28)";
  }
  function sharpColor() {
    if (ts === "tune") return "#22c55e";
    if (ts === "close-sharp") return "#facc15";
    if (ts === "out-sharp")   return "#ef4444";
    return "rgba(255,64,64,0.28)";
  }

  return (
    <View style={styles.root}>

      {/* ── Space background ─────────────────────────────────────── */}
      <Image
        source={require("../assets/images/tuner/space_background.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

      {/* ── Logo header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 36) + 8 }]}>
        {/* Back button */}
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Text style={styles.backArrow}>{"‹"}</Text>
        </Pressable>
        {/* Centred logo + labels */}
        <View style={styles.headerCenter}>
          <Image
            source={require("../assets/images/tuner/AGS_logo_nobg.png")}
            style={styles.topBarImg}
            resizeMode="contain"
          />
          <Text style={styles.precisionLabel}>PRECISION LABS</Text>
          <Text style={styles.sectionLabel}>AGS CHROMATIC TUNER</Text>
        </View>
        {/* Balancing spacer so the logo stays centred */}
        <View style={styles.backBtn} />
      </View>

      {/* ── Instrument + string count bar ─────────────────────────── */}
      <View style={styles.instRow}>
        {/* Guitar icon */}
        <View style={styles.instIcon}>
          <SvgXml xml={SVG_GUITAR_ICON} width={26} height={26} />
        </View>
        {/* Instrument picker */}
        <Pressable
          style={styles.instPicker}
          onPress={() => { if (!isPremium) { setShowUpgrade(true); return; } setShowInstrument(true); }}
        >
          <Text style={styles.instText}>{INST_LABELS[instrument].toUpperCase()}</Text>
          <Text style={styles.chevron}>{isPremium ? "  ⌄" : "  🔒"}</Text>
        </Pressable>
        {/* String count picker */}
        <Pressable
          style={styles.strPicker}
          onPress={() => { if (!isPremium) { setShowUpgrade(true); return; } setShowStrings(true); }}
        >
          <Text style={styles.instText}>{stringCount} STRING</Text>
          <Text style={styles.chevron}>{isPremium ? "  ⌄" : "  🔒"}</Text>
        </Pressable>
      </View>

      {/* ── Readout bar ───────────────────────────────────────────── */}
      <View style={styles.readout}>
        <Pressable
          style={styles.iconBtn}
          onPress={() => { setShowTuning(true); setShowSettings(false); }}
        >
          <SvgXml xml={SVG_HAMBURGER} width={28} height={28} />
        </Pressable>

        <View style={styles.readoutCentre}>
          <Text style={styles.tuningLabel}>{tuning.label}</Text>
          <Text style={styles.tuningNotes}>
            {tuning.strings.map(s => formatNote(s.label)).join(" · ")}
          </Text>
        </View>

        <Pressable
          style={styles.iconBtn}
          onPress={() => { setShowSettings(true); setShowTuning(false); }}
        >
          <SvgXml xml={SVG_SETTINGS} width={28} height={28} />
        </Pressable>
      </View>

      {/* ── Cents meter — arc tick bar ──────────────────────────── */}
      <ArcMeter
        litFlat={litFlat}
        litSharp={litSharp}
        inTune={inTune}
        isClose={isClose}
        isOut={isOut}
        detectedFreq={effectiveDetectedFreq}
        screenW={width}
      />

      {/* ── Note row — sits right above fretboard ────────────────── */}
      <View style={styles.noteRow}>
        <Text style={[styles.accidental, { color: flatColor(), textAlign: "left" }]}>◄ ♭</Text>
        <View style={styles.noteCentre}>
          <Text style={[styles.tuneArrow, { opacity: inTune ? 1 : 0 }]}>▲</Text>
          <Text style={[
            styles.noteText,
            inTune  && styles.noteInTune,
            isClose && styles.noteClose,
            isOut   && styles.noteOut,
          ]}>
            {activeNote}
          </Text>
        </View>
        <Text style={[styles.accidental, { color: sharpColor(), textAlign: "right" }]}>♯ ►</Text>
      </View>

      {/* ── Fretboard wrap — holds fretboard image + interactive overlays ── */}
      <View style={styles.fretboardWrap}>

        {/* Decorative fretboard — overflow hidden to clip image/glow, no touches */}
        <View style={[styles.fretboard, { height: fretImgH }]}>
          <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
            {/* Fretboard PNG */}
            <Image
              source={require("../assets/images/tuner/fretboard_with_nut.png")}
              style={{ position: "absolute", top: 0, left: 0, width: fretboardW, height: fretImgH }}
              resizeMode="stretch"
            />

            {/* Cosmic glow overlay */}
            <Image
              source={require("../assets/images/tuner/fretboard_cosmic_glow_overlay.png")}
              style={[StyleSheet.absoluteFill, { opacity: 0.32 }]}
              resizeMode="cover"
            />

            {/* Tapered strings SVG */}
            <Svg
              style={StyleSheet.absoluteFill}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <Defs>
                <Pattern id="wnd" x="0" y="0" width="100" height="0.64" patternUnits="userSpaceOnUse">
                  <Polygon points="0,0 100,0 100,0.08 0,0.08" fill="#e8e8e0" />
                  <Polygon points="0,0.08 100,0.08 100,0.42 0,0.42" fill="#a8a8a0" />
                  <Polygon points="0,0.42 100,0.42 100,0.64 0,0.64" fill="#141210" />
                </Pattern>
                <Pattern id="wnd-a" x="0" y="0" width="100" height="0.64" patternUnits="userSpaceOnUse">
                  <Polygon points="0,0 100,0 100,0.08 0,0.08" fill="#fce878" />
                  <Polygon points="0,0.08 100,0.08 100,0.42 0,0.42" fill="#e8b430" />
                  <Polygon points="0,0.42 100,0.42 100,0.64 0,0.64" fill="#2a1800" />
                </Pattern>
                <SvgLinearGradient id="plain" x1="0" x2="1" y1="0" y2="0">
                  <Stop offset="0%"   stopColor="#6a6a68" />
                  <Stop offset="28%"  stopColor="#deded8" />
                  <Stop offset="62%"  stopColor="#c8c8c2" />
                  <Stop offset="100%" stopColor="#626260" />
                </SvgLinearGradient>
                <SvgLinearGradient id="plain-a" x1="0" x2="1" y1="0" y2="0">
                  <Stop offset="0%"   stopColor="#b07820" />
                  <Stop offset="28%"  stopColor="#fcd96a" />
                  <Stop offset="62%"  stopColor="#f4c64b" />
                  <Stop offset="100%" stopColor="#a06810" />
                </SvgLinearGradient>
              </Defs>
              {tuning.strings.map((s, i) => {
                const active = i === effectiveActiveString;
                const x1 = strX(i, n, true);
                const x2 = strX(i, n, false);
                const w  = strW(i, n);
                const wound = i < woundCount(n);
                const fill = wound
                  ? (active ? "url(#wnd-a)" : "url(#wnd)")
                  : (active ? "url(#plain-a)" : "url(#plain)");
                return (
                  <Polygon
                    key={i}
                    points={`${x1 - w / 2},0 ${x1 + w / 2},0 ${x2 + w},100 ${x2 - w},100`}
                    fill={fill}
                    stroke={wound ? (active ? "#3a2000" : "#0e0d0c") : "none"}
                    strokeWidth={wound ? 0.3 : 0}
                    opacity={active ? 1 : 0.9}
                  />
                );
              })}
              {/* Animated sine-wave overlay on the active string */}
              {wavePath && (
                <SvgPath
                  d={wavePath.d}
                  stroke={wavePath.color}
                  strokeWidth={0.4}
                  fill="none"
                  strokeLinecap="round"
                  opacity={0.9}
                />
              )}
            </Svg>
          </View>
        </View>

        {/* String note buttons — centered on the fretboard, outside overflow:hidden */}
        {tuning.strings.map((s, i) => {
          const active = i === effectiveActiveString;
          const locked = i === lockedString && lockMode === "locked";
          const xPct   = strX(i, n, false);
          const xPx    = px(xPct) - 18;
          return (
            <Pressable
              key={i}
              style={[styles.stringBtn, { left: xPx, bottom: insets.bottom + 145 }, active && styles.stringBtnActive, locked && styles.stringBtnLocked]}
              onPress={() => {
                setLockedString(i);
                setLockMode("locked");
              }}
            >
              <Text style={styles.stringBtnLabel}>{formatNote(s.label)}</Text>
            </Pressable>
          );
        })}

        {/* ── Orbital + TAP TO TUNE — outside fretboard overflow:hidden so touches work ── */}
        <View style={[styles.orbOverlay, { bottom: insets.bottom + 10 }]}>
          {effectiveError != null && (
            <Text style={styles.errorText}>Mic unavailable — check permissions</Text>
          )}
          <Pressable style={styles.orbPressable} onPress={handleMicPress}>
            <View style={styles.orbContainer}>
              {/* Plain View clips SvgXml to circle — no SVG inside Animated.View */}
              <View style={styles.orbClip}>
                <SvgXml xml={SVG_GALACTIC_CORE} style={StyleSheet.absoluteFill} />
                <Image
                  source={require("../assets/images/alien-inlay.png")}
                  style={styles.orbImage}
                  resizeMode="contain"
                />
              </View>
              {/* Animated.View is border-only — no SVG children (would crash native) */}
              <Animated.View
                style={[styles.orbRing, { borderColor: orbBorderColor }, pulseStyle]}
                pointerEvents="none"
              />
            </View>
            <View style={styles.tapLabelPill}>
              <Text style={styles.tapLabel}>
                {tuneStateText}
              </Text>
            </View>
          </Pressable>
        </View>

      </View>

      {/* ── Tuning picker modal ───────────────────────────────────── */}
      <Modal visible={showTuning} transparent animationType="fade" onRequestClose={() => setShowTuning(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowTuning(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>SELECT TUNING</Text>
            <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
              {(tunings[instrument][stringCount] ?? []).map((t, i) => (
                <Pressable
                  key={t.label}
                  style={[styles.sheetRow, i === tuningIndex && styles.sheetRowActive]}
                  onPress={() => { if (!isPremium && i > 0) { setShowTuning(false); setShowUpgrade(true); return; } setTuningIndex(i); setShowTuning(false); }}
                >
                  <Text style={[styles.sheetLabel, !isPremium && i > 0 && { opacity: 0.4 }]}>{t.label}</Text>
                  <Text style={[styles.sheetNotes, !isPremium && i > 0 && { opacity: 0.4 }]}>
                    {t.strings.map(s => formatNote(s.label)).join(" · ")}
                  </Text>
                  {!isPremium && i > 0 && <Text style={{ color: "rgba(91,184,255,0.7)", fontSize: 12, marginLeft: "auto" }}>PRO 🔒</Text>}
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.sheetClose} onPress={() => setShowTuning(false)}>
              <Text style={styles.sheetCloseText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Settings modal ───────────────────────────────────────── */}
      <Modal visible={showSettings} transparent animationType="fade" onRequestClose={() => setShowSettings(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowSettings(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>SETTINGS</Text>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>A4 REFERENCE</Text>
              {isPremium ? (
                <View style={styles.a4Stepper}>
                  <Pressable
                    style={styles.a4StepBtn}
                    onPress={() => setA4(v => Math.max(A4_MIN, v - 1))}
                  >
                    <Text style={styles.a4StepBtnText}>−</Text>
                  </Pressable>
                  <View style={styles.a4Window}>
                    <Text style={styles.a4WindowText}>{a4} Hz</Text>
                  </View>
                  <Pressable
                    style={styles.a4StepBtn}
                    onPress={() => setA4(v => Math.min(A4_MAX, v + 1))}
                  >
                    <Text style={styles.a4StepBtnText}>+</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => { setShowSettings(false); setShowUpgrade(true); }}
                  style={[styles.lockBtn, { flexDirection: "row", gap: 6 }]}
                >
                  <Text style={styles.lockBtnText}>440 Hz</Text>
                  <Text style={{ color: "rgba(91,184,255,0.8)", fontSize: 12 }}>🔒</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.settingsRow}>
              <Text style={styles.settingsLabel}>LOCK MODE</Text>
              <Pressable
                style={[styles.lockBtn, lockMode === "locked" && styles.lockBtnActive]}
                onPress={() => setLockMode(m => m === "auto" ? "locked" : "auto")}
              >
                <Text style={[styles.lockBtnText, lockMode === "locked" && styles.lockBtnTextActive]}>
                  {lockMode === "locked" ? "LOCKED" : "AUTO"}
                </Text>
              </Pressable>
            </View>
            <View style={styles.settingsRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.settingsLabel}>MICROPHONE</Text>
                {micPerm === "denied" && (
                  <Text style={styles.settingsHint}>Blocked — tap to open device settings</Text>
                )}
              </View>
              <Pressable
                style={[
                  styles.lockBtn,
                  micPerm === "granted" && styles.lockBtnActive,
                  micPerm === "denied"  && styles.lockBtnDenied,
                ]}
                onPress={requestMicPerm}
              >
                <Text style={[
                  styles.lockBtnText,
                  micPerm === "granted" && styles.lockBtnTextActive,
                  micPerm === "denied"  && styles.lockBtnTextDenied,
                ]}>
                  {micPerm === "granted" ? "ALLOWED" : micPerm === "denied" ? "SETTINGS" : "ALLOW"}
                </Text>
              </Pressable>
            </View>
            <Pressable style={styles.sheetClose} onPress={() => setShowSettings(false)}>
              <Text style={styles.sheetCloseText}>DONE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Instrument picker modal ───────────────────────────────── */}
      <Modal visible={showInstrument} transparent animationType="fade" onRequestClose={() => setShowInstrument(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowInstrument(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>INSTRUMENT</Text>
            {(["electric","acoustic","bass","uke"] as Instrument[]).map((inst) => (
              <Pressable
                key={inst}
                style={[styles.sheetRow, instrument === inst && styles.sheetRowActive]}
                onPress={() => { setInstrument(inst); setShowInstrument(false); }}
              >
                <Text style={styles.sheetLabel}>{INST_LABELS[inst]}</Text>
              </Pressable>
            ))}
            <Pressable style={styles.sheetClose} onPress={() => setShowInstrument(false)}>
              <Text style={styles.sheetCloseText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── String count picker modal ─────────────────────────────── */}
      <Modal visible={showStrings} transparent animationType="fade" onRequestClose={() => setShowStrings(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowStrings(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>STRING COUNT</Text>
            {counts.map((c) => (
              <Pressable
                key={c}
                style={[styles.sheetRow, stringCount === c && styles.sheetRowActive]}
                onPress={() => { setStringCount(c); setShowStrings(false); }}
              >
                <Text style={styles.sheetLabel}>{c} String</Text>
              </Pressable>
            ))}
            <Pressable style={styles.sheetClose} onPress={() => setShowStrings(false)}>
              <Text style={styles.sheetCloseText}>CLOSE</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>


      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />

      {/* Hidden WebView for native mic capture (iOS + Android) */}
      {NativeWebView && (
        <View style={{ position: "absolute", width: 1, height: 1, opacity: 0, top: 0, left: 0 }} pointerEvents="none">
          <NativeWebView
            ref={nativeTuner.webViewRef as React.Ref<{ injectJavaScript: (js: string) => void }>}
            source={{ html: TUNER_WEBVIEW_HTML, baseUrl: "https://localhost" }}
            onMessage={nativeTuner.handleMessage}
            onLoad={nativeTuner.onLoad}
            javaScriptEnabled
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={["*"]}
            onPermissionRequest={(e) => { e.nativeEvent.grant(e.nativeEvent.resources); }}
            style={{ width: 1, height: 1 }}
          />
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#020006" },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingBottom: 2,
    paddingHorizontal: 8,
    zIndex: 1,
  },
  backBtn: {
    width: 44,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  backArrow: {
    fontSize: 36,
    lineHeight: 44,
    color: "#5bb8ff",
    fontWeight: "300",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  topBarImg: {
    width: "100%",
    height: 44,
  },
  precisionLabel: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(91,184,255,0.85)",
    fontWeight: "700",
    textAlign: "center",
  },
  sectionLabel: {
    marginTop: 1,
    fontSize: 9,
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.38)",
    fontWeight: "600",
    textAlign: "center",
  },

  // Instrument bar
  instRow: {
    alignSelf: "stretch",
    height: 36,
    marginHorizontal: 16,
    marginBottom: 2,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    backgroundColor: "rgba(8,2,24,0.72)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(91,184,255,0.45)",
    zIndex: 1,
  },
  instIcon: {
    position: "absolute",
    left: 14,
    top: 7,
    zIndex: 2,
  },
  instPicker: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 50,
    height: "100%",
    zIndex: 3,
  },
  strPicker: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    zIndex: 3,
  },
  instText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
    letterSpacing: 0.5,
  },
  chevron: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
    fontWeight: "600",
  },

  // Readout bar
  readout: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginHorizontal: 8,
    marginBottom: 2,
    backgroundColor: "rgba(3,0,10,0.58)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(91,184,255,0.25)",
    overflow: "hidden",
    zIndex: 1,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(91,184,255,0.42)",
    backgroundColor: "rgba(3,0,10,0.58)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    elevation: 3,
  },
  readoutCentre: {
    flex: 1,
    minWidth: 0,
    alignItems: "center",
  },
  tuningLabel: {
    color: "rgba(255,255,255,0.88)",
    fontWeight: "700",
    fontSize: 14,
  },
  tuningNotes: {
    color: "rgba(91,184,255,0.78)",
    fontWeight: "600",
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 1,
  },

  // Note row — now a sibling of fretboard, sits right above it
  noteRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingTop: 0,
    marginBottom: 2,
    zIndex: 1,
  },
  accidental: {
    width: "20%",
    fontSize: 18,
    fontWeight: "900",
    lineHeight: 56,
    paddingHorizontal: 10,
  },
  noteCentre: {
    alignItems: "center",
  },
  tuneArrow: {
    color: "#1db954",
    fontSize: 22,
    lineHeight: 24,
  },
  noteText: {
    color: "#5bb8ff",
    fontSize: 52,
    fontWeight: "900",
    lineHeight: 56,
    letterSpacing: -2,
    textAlign: "center",
    textShadowColor: "rgba(91,184,255,0.65)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  noteInTune: {
    color: "#b8e8c8",
    textShadowColor: "rgba(160,230,190,0.9)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  noteClose: {
    color: "#facc15",
    textShadowColor: "rgba(250,204,21,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  noteOut: {
    color: "#ef4444",
    textShadowColor: "rgba(239,68,68,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  // Fretboard wrap — flex container holding fretboard + interactive overlays
  fretboardWrap: {
    flex: 1,
    marginHorizontal: 16,
    position: "relative",
  },
  // Fretboard — decorative only (image + glow + strings SVG), clipped
  fretboard: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 4,
    overflow: "hidden",
  },
  stringBtn: {
    position: "absolute",
    bottom: 160,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(6,3,0,0.88)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  stringBtnActive: {
    backgroundColor: "rgba(28,14,0,0.92)",
    borderColor: "rgba(228,180,48,0.7)",
    shadowColor: "#e4b430",
    shadowOpacity: 0.85,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  stringBtnLocked: {
    borderColor: "rgba(91,184,255,0.8)",
    shadowColor: "#5bb8ff",
    shadowOpacity: 0.7,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  stringBtnLabel: { color: "#fff", fontSize: 13, fontWeight: "700" },

  // Orbital overlay — anchored to the bottom of the fretboard wrap, below string buttons
  orbOverlay: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5,
  },
  errorText: { color: "#ff8080", fontSize: 11, marginBottom: 4, textAlign: "center" },
  orbPressable: { alignItems: "center" },
  orbContainer: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  orbClip: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 44,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  orbRing: {
    position: "absolute",
    top: 0, left: 0,
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 2,
  },
  orbImage: { width: 58, height: 58 },
  tapLabelPill: {
    backgroundColor: "#1db954",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginTop: 6,
  },
  tapLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
  },

  // Modals
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    width: "92%",
    backgroundColor: "#120028",
    borderWidth: 1,
    borderColor: "rgba(91,184,255,0.35)",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    maxHeight: "82%",
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.45)",
    textAlign: "center",
  },
  sheetList: { maxHeight: 320 },
  sheetRow: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 8,
  },
  sheetRowActive: {
    borderColor: "rgba(91,184,255,0.6)",
    backgroundColor: "rgba(91,184,255,0.15)",
  },
  sheetLabel: { fontSize: 22, fontWeight: "700", color: "#fff" },
  sheetNotes: { fontSize: 14, color: "rgba(91,184,255,0.8)", fontWeight: "600", marginTop: 2 },
  sheetClose: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(91,184,255,0.3)",
    backgroundColor: "rgba(91,184,255,0.1)",
    alignItems: "center",
    marginTop: 4,
  },
  sheetCloseText: { color: "#d150ff", fontSize: 16, fontWeight: "800", letterSpacing: 1.5 },

  // Settings specifics
  settingsRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 4 },
  a4Stepper: { flexDirection: "row", alignItems: "center", gap: 5 },
  a4StepBtn: {
    width: 28, height: 28, borderRadius: 6,
    borderWidth: 1, borderColor: "rgba(91,184,255,0.45)",
    alignItems: "center", justifyContent: "center",
  },
  a4StepBtnText: { color: "#5bb8ff", fontSize: 18, fontWeight: "300", lineHeight: 22 },
  a4Window: {
    borderWidth: 1, borderColor: "rgba(91,184,255,0.6)",
    borderRadius: 6, backgroundColor: "rgba(91,184,255,0.08)",
    paddingHorizontal: 10, paddingVertical: 4,
    minWidth: 68, alignItems: "center",
  },
  a4WindowText: { color: "#5bb8ff", fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  lockBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(91,184,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  lockBtnActive: {
    borderColor: "rgba(91,184,255,0.8)",
    backgroundColor: "rgba(91,184,255,0.2)",
  },
  lockBtnText: { color: "rgba(255,255,255,0.5)", fontWeight: "700", fontSize: 14 },
  lockBtnTextActive: { color: "#d150ff" },
  lockBtnDenied: { borderColor: "rgba(255,80,80,0.7)", backgroundColor: "rgba(255,80,80,0.12)" },
  lockBtnTextDenied: { color: "#ff8080" },
  settingsLabel: { fontSize: 16, fontWeight: "700", color: "rgba(255,255,255,0.6)" },
  settingsHint: { fontSize: 11, color: "#ff8080", marginTop: 2 },
});
