import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "expo-router";
import {
  Animated,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import {
  Circle,
  Defs,
  Ellipse,
  Line,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Text as SvgText,
} from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { ScreenBg } from "@/components/screen-bg";
import { ScrollPicker } from "@/components/scroll-picker";
import { UpgradeModal } from "@/components/upgrade-modal";
import { useColors } from "@/hooks/useColors";
import {
  MetronomeEngine,
  IOSNativeMetronomeAdapter,
  prewarmSounds,
  type IMetronomeEngine,
  type ClickLevel,
  type SoundType,
} from "@/lib/metronome";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------
const BEATS_PICKER = Array.from({ length: 12 }, (_, i) => String(i + 1));
const DENOM_VALS   = [2, 4, 8, 16];
const DENOM_PICKER = DENOM_VALS.map(String);

const SUBDIV_OPTIONS: { value: number; symbol: string; pickerLabel: string }[] = [
  { value: 0.25, symbol: "𝅝",  pickerLabel: "1/1"   },
  { value: 0.5, symbol: "½",   pickerLabel: "1/2"   },
  { value: 1,   symbol: "♩",   pickerLabel: "1/4"   },
  { value: 1.5, symbol: "♩³",  pickerLabel: "1/4t"  },
  { value: 2,   symbol: "♪♪",  pickerLabel: "1/8"   },
  { value: 3,   symbol: "♪³",  pickerLabel: "1/8t"  },
  { value: 4,   symbol: "♬",   pickerLabel: "1/16"  },
  { value: 6,   symbol: "♬³",  pickerLabel: "1/16t" },
  { value: 8,   symbol: "♬♩",  pickerLabel: "1/32"  },
  { value: 12,  symbol: "♬♩³", pickerLabel: "1/32t" },
  { value: 16,  symbol: "♬♫",  pickerLabel: "1/64"  },
];

const SOUND_CYCLE: SoundType[] = ["classic", "woodblock", "electronic", "cosmic"];
const SOUND_LABELS: Record<SoundType, string> = {
  classic:    "Click",
  woodblock:  "Wood",
  electronic: "Electro",
  cosmic:     "Cosmic",
};

const FREE_TIME_SIGS = [
  { beats: 4, denominator: 4, label: "4 / 4" },
  { beats: 3, denominator: 4, label: "3 / 4" },
  { beats: 6, denominator: 8, label: "6 / 8" },
] as const;

const LOGO = require("@/assets/images/logo-horizontal.png") as number;

// Chakra-order accent colour themes — stored in AsyncStorage
const ACCENT_THEMES = [
  { label: "Red",    accent: "#FF2244", dim: "#7a0018", muted: "#2a0010" },
  { label: "Orange", accent: "#FF7700", dim: "#7a3800", muted: "#2a1400" },
  { label: "Gold",   accent: "#FFB800", dim: "#7a5800", muted: "#2a1e00" },
  { label: "Green",  accent: "#00E060", dim: "#006830", muted: "#001e10" },
  { label: "Cyan",   accent: "#00D4FF", dim: "#006a80", muted: "#001e28" },
  { label: "Purple", accent: "#C040FF", dim: "#6a1090", muted: "#200838" },
  { label: "Pink",   accent: "#FF40A0", dim: "#80104a", muted: "#280018" },
] as const;
const ACCENT_STORAGE_KEY = "ags-metronome-accent-v1";

const DOT_ACTIVE = "#1E8CFF";
const DOT_OFF    = "#0d0d20";

function tempoName(bpm: number): string {
  if (bpm < 40)  return "Grave";
  if (bpm < 60)  return "Largo";
  if (bpm < 66)  return "Larghetto";
  if (bpm < 77)  return "Adagio";
  if (bpm < 109) return "Andante";
  if (bpm < 121) return "Moderato";
  if (bpm < 129) return "Allegretto";
  if (bpm < 157) return "Allegro";
  if (bpm < 168) return "Vivace";
  if (bpm < 200) return "Presto";
  return "Prestissimo";
}

// ---------------------------------------------------------------------------
// BeatBlock — Soundbrenner-style beat card
//
// Layout:  [top accent strip] / [subdivision segment row]
//
// Top strip: always visible, coloured red on the accent beat (shows the user
// which beat is accented even when stopped).  When the accent is muted the
// strip turns dim to signal that.
// Subdivision row: segments light up left-to-right as each click fires.
// ---------------------------------------------------------------------------
interface BeatBlockProps {
  beatIdx:      number;
  accentBeat:   number;
  accentSilent: boolean;
  isMuted:      boolean;
  currentBeat:  number;
  currentSub:   number;
  subdivisions: number;
  accentColor:  string;
  accentDim:    string;
  accentMuted:  string;
  onTap:        (i: number) => void;  // tap = toggle mute
  onLongPress:  (i: number) => void;  // long press = set accent beat
}

// ── Subdivision beamed-notation SVG ─────────────────────────────────────────
function SubdivSvg({ value }: { value: number }) {
  const C      = "#c8c8ec";
  const NY     = 23;       // notehead centre Y
  const HR     = 5;        // notehead rx
  const VR     = 3.5;      // notehead ry
  const SX_OFF = 4.5;      // stem x = notehead cx + SX_OFF
  const STEM_BOT = NY - VR + 0.5; // where stem meets notehead top

  const isTriplet = [1.5, 3, 6, 12].includes(value);
  // For triplets the "3" lives above the beams so push stems down a bit
  const ST    = isTriplet ? 9   : 3;    // stem top Y
  const BH    = isTriplet ? 1.8 : 2.0;  // beam rectangle height
  const BStep = isTriplet ? 4.0 : 5.0;  // top-to-top distance between beams (gap = BStep-BH)

  const beamCount =
    value <= 1              ? 0 :
    (value === 2  || value === 3)  ? 1 :
    (value === 4  || value === 6)  ? 2 :
    (value === 8  || value === 12) ? 3 : 4;  // 16 = 64th

  // --- element factories ---

  const mkHead = (cx: number, open = false) => (
    <Ellipse
      key={`h${cx}`}
      cx={cx} cy={NY} rx={HR} ry={VR}
      fill={open ? "none" : C}
      stroke={open ? C : "none"}
      strokeWidth={1.8}
      transform={`rotate(-22, ${cx}, ${NY})`}
    />
  );

  const mkStem = (cx: number) => (
    <Line
      key={`st${cx}`}
      x1={cx + SX_OFF} y1={STEM_BOT}
      x2={cx + SX_OFF} y2={ST}
      stroke={C} strokeWidth={1.6}
    />
  );

  const mkBeams = (sx1: number, sx2: number, n: number) =>
    Array.from({ length: n }, (_, i) => (
      <Rect key={`b${i}`}
        x={sx1} y={ST + i * BStep}
        width={sx2 - sx1} height={BH}
        fill={C}
      />
    ));

  // Bracket + "3" centred above the beams
  const mkTriplet = (sx1: number, sx2: number) => {
    const mid = (sx1 + sx2) / 2;
    const ty  = ST - 5;  // bracket Y (above top beam)
    return [
      <Line key="tla" x1={sx1}      y1={ty + 3} x2={sx1}      y2={ty}     stroke={C} strokeWidth={1} />,
      <Line key="tlb" x1={sx1}      y1={ty}     x2={mid - 5}  y2={ty}     stroke={C} strokeWidth={1} />,
      <SvgText key="t3" x={mid} y={ty + 1} fontSize={8} fontWeight="700" fill={C} textAnchor="middle">3</SvgText>,
      <Line key="tlc" x1={mid + 5}  y1={ty}     x2={sx2}      y2={ty}     stroke={C} strokeWidth={1} />,
      <Line key="tld" x1={sx2}      y1={ty}     x2={sx2}      y2={ty + 3} stroke={C} strokeWidth={1} />,
    ];
  };

  // --- whole note: open wide oval, no stem ---
  if (value === 0.25) {
    return (
      <Svg width={24} height={30} viewBox="0 0 24 30">
        <Ellipse
          cx={12} cy={23} rx={8} ry={5}
          fill="none" stroke={C} strokeWidth={1.8}
        />
      </Svg>
    );
  }

  // --- half note ---
  if (value === 0.5) {
    return (
      <Svg width={22} height={30} viewBox="0 0 22 30">
        {mkHead(7, true)}
        {mkStem(7)}
      </Svg>
    );
  }

  // --- quarter note ---
  if (value === 1) {
    return (
      <Svg width={22} height={30} viewBox="0 0 22 30">
        {mkHead(7)}
        {mkStem(7)}
      </Svg>
    );
  }

  // --- quarter triplet: 3 quarters with bracket, no beams ---
  if (value === 1.5) {
    const cxs = [5, 19, 33];
    const sxs = cxs.map(cx => cx + SX_OFF);
    return (
      <Svg width={50} height={30} viewBox="0 0 50 30">
        {cxs.map(cx => mkHead(cx))}
        {cxs.map(cx => mkStem(cx))}
        {mkTriplet(sxs[0], sxs[2])}
      </Svg>
    );
  }

  // --- non-quarter triplets: 3 beamed notes ---
  if ([3, 6, 12].includes(value)) {
    const cxs = [5, 18, 31];
    const sxs = cxs.map(cx => cx + SX_OFF);
    return (
      <Svg width={48} height={30} viewBox="0 0 48 30">
        {cxs.map(cx => mkHead(cx))}
        {cxs.map(cx => mkStem(cx))}
        {mkBeams(sxs[0], sxs[2], beamCount)}
        {mkTriplet(sxs[0], sxs[2])}
      </Svg>
    );
  }

  // --- pairs: 2 beamed notes (8th / 16th / 32nd / 64th) ---
  const cxs = [4, 24];
  const sxs = cxs.map(cx => cx + SX_OFF);
  return (
    <Svg width={40} height={30} viewBox="0 0 40 30">
      {mkHead(cxs[0])}
      {mkHead(cxs[1])}
      {mkStem(cxs[0])}
      {mkStem(cxs[1])}
      {mkBeams(sxs[0], sxs[1], beamCount)}
    </Svg>
  );
}

function BeatBlock({
  beatIdx, accentBeat, accentSilent, isMuted, currentBeat, currentSub, subdivisions,
  accentColor, accentDim, accentMuted, onTap, onLongPress,
}: BeatBlockProps) {
  const isAccentBeat = beatIdx === accentBeat;
  const isActive     = beatIdx === currentBeat;

  // Accent strip colour — dark when muted
  const stripColor = isMuted
    ? "#0d0d1e"
    : isAccentBeat
      ? (accentSilent ? accentMuted : accentColor)
      : "#141428";

  // Subdivision segment colours
  const baseColor = isAccentBeat ? accentColor : DOT_ACTIVE;
  const subColor  = `${baseColor}70`;

  // Cap visible segments at 8
  const MAX_SEGS = 8;
  const visSegs  = Math.max(1, Math.floor(Math.min(subdivisions, MAX_SEGS)));
  const activeSeg = isActive
    ? Math.floor(currentSub * visSegs / subdivisions)
    : -1;

  return (
    <Pressable
      onPress={() => onTap(beatIdx)}
      onLongPress={() => onLongPress(beatIdx)}
      style={{ flex: 1, opacity: isMuted && !isActive ? 0.38 : 1 }}
    >
      <View style={[
        styles.beatBlock,
        {
          borderColor: isActive
            ? (isMuted ? "#404060" : baseColor)
            : isAccentBeat ? accentDim : "rgba(255,255,255,0.22)",
          borderWidth: 1.5,
        },
      ]}>
        {/* Accent / mute strip */}
        <View style={[styles.accentStrip, { backgroundColor: stripColor }]}>
          {isMuted ? (
            <Text style={{ fontSize: 8, color: "#555580", fontWeight: "900",
                           lineHeight: 10 }}>×</Text>
          ) : isAccentBeat && (
            <View style={[styles.accentDot, { opacity: accentSilent ? 0.3 : 1 }]} />
          )}
        </View>

        {/* Subdivision segments — each cell has a white outline */}
        <View style={styles.segRow}>
          {Array.from({ length: visSegs }).map((_, j) => {
            const isSegLit  = activeSeg === j;
            const isBeatSeg = j === 0;
            const segBg = isSegLit
              ? (isMuted
                  ? "rgba(100,100,130,0.55)"
                  : isBeatSeg ? baseColor : subColor)
              : "transparent";
            return (
              <View key={j} style={[styles.beatBlockSeg, { backgroundColor: segBg }]} />
            );
          })}
        </View>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// HifiButton
// ---------------------------------------------------------------------------
interface HifiButtonProps {
  onPress: () => void;
  label: string;
  activeColor?: string;
  active?: boolean;
  flex?: number;
}
function HifiButton({ onPress, label, activeColor, active, flex }: HifiButtonProps) {
  const [pressed, setPressed] = useState(false);
  const raised: [string, string] = ["#42426a", "#22223c"];
  const sunken: [string, string] = ["#14141e", "#2e2e4e"];
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={{ flex }}
    >
      <View style={[
        styles.btnOuter,
        {
          shadowColor:   active ? activeColor ?? "#6060c0" : "#000",
          shadowOpacity: pressed ? 0.3 : active ? 0.7 : 0.55,
          shadowRadius:  pressed ? 2   : active ? 10   : 5,
          shadowOffset:  { width: 0, height: pressed ? 1 : 3 },
          elevation:     pressed ? 2 : 8,
          borderColor: pressed ? "#28283c"
            : active ? (activeColor ?? "#8060e0")
            : "#5a5a88",
          borderBottomColor: pressed ? "#4a4a70" : "#0a0a16",
        },
      ]}>
        <LinearGradient
          colors={pressed ? sunken : raised}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
          style={styles.btnGradient}
        >
          <View style={{
            position: "absolute", top: 0, left: 4, right: 4, height: 1,
            backgroundColor: "#ffffff", opacity: pressed ? 0.04 : 0.13, borderRadius: 1,
          }} />
          {activeColor && (
            <View style={[styles.ledStrip, {
              backgroundColor: active ? activeColor : "#0a0a18",
              shadowColor: activeColor, shadowOpacity: active ? 0.9 : 0, shadowRadius: 5,
            }]} />
          )}
          <Text style={[styles.btnLabel, { color: pressed ? "#9090b8" : "#dcdcf8" }]}>
            {label}
          </Text>
        </LinearGradient>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------
export default function MetronomeScreen() {
  const router  = useRouter();
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { width: screenW } = useWindowDimensions();

  const WS      = Math.min(screenW - 32, 185);
  const C       = WS / 2;
  const R_BEZEL = C - 2;
  const R_GRIP  = R_BEZEL - 10;
  const R_WELL  = R_GRIP - Math.round(WS * 0.11);
  const KNURLS  = 70;

  const [bpm, setBpm]                 = useState(120);
  const [running, setRunning]         = useState(false);
  const [beats, setBeats]             = useState(4);
  const [denominator, setDenominator] = useState(4);
  const [subdivClicks, setSubdiv]     = useState(1);
  const [accentBeat, setAccentBeat]   = useState(0);
  const [accentSilent, setAccentSilent] = useState(false);
  const [mutedBeats, setMutedBeats]   = useState<number[]>([]);
  const [soundType, setSoundType]     = useState<SoundType>("classic");
  const [currentBeat, setCurrentBeat] = useState(-1);
  const [currentSub, setCurrentSub]   = useState(-1);
  const [beatLevel, setBeatLevel]     = useState<ClickLevel | null>(null);
  const [sheetMode, setSheetMode]     = useState<"beats" | "subdiv" | null>(null);
  const [accentThemeIdx, setAccentThemeIdx] = useState(0);
  const [bpmInputVisible, setBpmInputVisible] = useState(false);
  const [bpmInputText,    setBpmInputText]    = useState("");
  const [showUpgrade,     setShowUpgrade]     = useState(false);
  const isPremium = true;

  // Load saved accent colour on mount
  useEffect(() => {
    AsyncStorage.getItem(ACCENT_STORAGE_KEY).then((v) => {
      const n = Number(v);
      if (!isNaN(n) && n >= 0 && n < ACCENT_THEMES.length) setAccentThemeIdx(n);
    }).catch(() => {});
  }, []);

  const accentTheme    = ACCENT_THEMES[accentThemeIdx];
  const accentColor    = accentTheme.accent;
  const accentDim      = accentTheme.dim;
  const accentMuted    = accentTheme.muted;
  const effAccent      = isPremium ? accentColor  : "#666666";
  const effAccentDim   = isPremium ? accentDim    : "#333333";
  const effAccentMuted = isPremium ? accentMuted  : "#141414";

  const beatPulse       = useRef(new Animated.Value(0)).current;
  const pulseAnim       = useRef<Animated.CompositeAnimation | null>(null);
  const bpmRef          = useRef(bpm);
  const engineRef       = useRef<IMetronomeEngine | null>(null);
  const halfWsRef       = useRef(C);
  const rWellRef        = useRef(R_WELL);
  const lastHapticAngle = useRef<number | null>(null);
  halfWsRef.current = C;
  rWellRef.current  = R_WELL;

  useEffect(() => { bpmRef.current = bpm; }, [bpm]);
  useEffect(() => { prewarmSounds("classic"); }, []);

  useEffect(() => {
    const engine: IMetronomeEngine =
      IOSNativeMetronomeAdapter.isAvailable
        ? new IOSNativeMetronomeAdapter()
        : new MetronomeEngine();
    engine.onTick = (beatIdx, subIdx, level) => {
      setCurrentBeat(beatIdx);
      setCurrentSub(subIdx);
      setBeatLevel(level);
      // Pulse intensity: accent=1.0, beat=0.75, sub=0.38
      const intensity = level === "accent" ? 1.0 : level === "beat" ? 0.75 : 0.38;
      pulseAnim.current?.stop();
      beatPulse.setValue(intensity);
      pulseAnim.current = Animated.timing(beatPulse, {
        toValue: 0, duration: level === "sub" ? 140 : 260, useNativeDriver: false,
      });
      pulseAnim.current.start();
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(
          level === "accent" ? Haptics.ImpactFeedbackStyle.Heavy :
          level === "beat"   ? Haptics.ImpactFeedbackStyle.Medium :
                               Haptics.ImpactFeedbackStyle.Light,
        );
      }
    };
    engineRef.current = engine;
    return () => { engine.stop(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { if (engineRef.current) engineRef.current.bpm          = bpm;          }, [bpm]);
  useEffect(() => { if (engineRef.current) engineRef.current.accentBeat   = accentBeat;   }, [accentBeat]);
  useEffect(() => { if (engineRef.current) engineRef.current.accentSilent = accentSilent; }, [accentSilent]);
  useEffect(() => { if (engineRef.current) engineRef.current.soundType    = soundType;    }, [soundType]);
  useEffect(() => { if (engineRef.current) engineRef.current.mutedBeats   = mutedBeats;   }, [mutedBeats]);

  useEffect(() => {
    setAccentBeat((a) => Math.min(a, beats - 1));
    setMutedBeats((prev) => prev.filter((b) => b < beats));
  }, [beats]);

  useEffect(() => {
    const e = engineRef.current;
    if (!e) return;
    const was = e.isRunning;
    if (was) e.stop();
    e.beatsPerMeasure = beats;
    e.subdivision     = subdivClicks;
    if (was) { setCurrentBeat(-1); setCurrentSub(-1); e.start(); }
  }, [beats, subdivClicks]);

  const togglePlay = useCallback(() => {
    const e = engineRef.current;
    if (!e) return;
    if (e.isRunning) {
      e.stop(); setRunning(false); setCurrentBeat(-1); setCurrentSub(-1);
      setBeatLevel(null); beatPulse.setValue(0);
    } else {
      e.bpm = bpmRef.current; e.start(); setRunning(true);
    }
  }, [beatPulse]);

  const toggleMute = useCallback((beatIdx: number) => {
    setMutedBeats((prev) =>
      prev.includes(beatIdx) ? prev.filter((b) => b !== beatIdx) : [...prev, beatIdx],
    );
  }, []);

  const tapTimesRef = useRef<number[]>([]);
  const handleTap = useCallback(() => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 3000), now];
    if (tapTimesRef.current.length >= 2) {
      const gaps = tapTimesRef.current.slice(1).map((t, i) => t - tapTimesRef.current[i]);
      const avg  = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      setBpm(Math.max(30, Math.min(240, Math.round(60000 / avg))));
    }
  }, []);

  const panStartRef = useRef<{ angle: number; bpm: number } | null>(null);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only claim touches that start on the outer knurl ring (outside R_WELL).
        // Touches inside R_WELL go to the centered start/stop Pressable instead.
        onStartShouldSetPanResponder: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          const half = halfWsRef.current;
          const dx = locationX - half;
          const dy = locationY - half;
          return Math.sqrt(dx * dx + dy * dy) > rWellRef.current;
        },
        onMoveShouldSetPanResponder:  () => true,
        onPanResponderGrant: (evt) => {
          const half = halfWsRef.current;
          const { locationX, locationY } = evt.nativeEvent;
          const angle = Math.atan2(locationX - half, half - locationY) * (180 / Math.PI);
          panStartRef.current = { angle, bpm: bpmRef.current };
          lastHapticAngle.current = angle;
        },
        onPanResponderMove: (evt) => {
          if (!panStartRef.current) return;
          const half = halfWsRef.current;
          const { locationX, locationY } = evt.nativeEvent;
          let angle = Math.atan2(locationX - half, half - locationY) * (180 / Math.PI);
          let delta = angle - panStartRef.current.angle;
          if (delta > 180)  delta -= 360;
          if (delta < -180) delta += 360;
          const newBpm = Math.round(Math.max(30, Math.min(240, panStartRef.current.bpm + delta * 0.55)));
          setBpm(newBpm);
          if (Platform.OS !== "web" && lastHapticAngle.current !== null) {
            let angleDiff = angle - lastHapticAngle.current;
            if (angleDiff > 180)  angleDiff -= 360;
            if (angleDiff < -180) angleDiff += 360;
            if (Math.abs(angleDiff) >= 3) {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              lastHapticAngle.current = angle;
            }
          }
        },
        onPanResponderRelease: () => { panStartRef.current = null; },
      }),
    [],
  );

  const glowOpacity = beatPulse.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const glowColor   = beatLevel === "accent" ? effAccent : DOT_ACTIVE;

  const TAB_H    = Platform.OS === "web" ? 84 : Platform.OS === "ios" ? 49 : 56;
  const topPad    = Platform.OS === "web" ? 67 : insets.top + 2;
  const bottomPad = TAB_H + insets.bottom + 12;

  const cycleSound = useCallback(() => {
    setSoundType((prev) => {
      const next = SOUND_CYCLE[(SOUND_CYCLE.indexOf(prev) + 1) % SOUND_CYCLE.length];
      prewarmSounds(next);
      return next;
    });
  }, []);

  const currentSubdiv = SUBDIV_OPTIONS.find((o) => o.value === subdivClicks) ?? SUBDIV_OPTIONS[0];

  // Gap between beat blocks scales with beat count
  const blockGap = beats <= 6 ? 6 : beats <= 9 ? 4 : 3;

  // -------------------------------------------------------------------------
  return (
    <ScreenBg>
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>

        {/* ── Logo ──────────────────────────────────────────────────────── */}
        <View style={styles.logoBlock}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>‹</Text>
          </Pressable>
          <View style={styles.logoCenter}>
            <Image source={LOGO} style={styles.logo} resizeMode="contain" />
            <Text style={styles.precisionLabel}>PRECISION LABS</Text>
            <Text style={styles.sectionLabel}>AGS METRONOME</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* ── Beat blocks + accent mute toggle ─────────────────────────── */}
        <View style={[styles.beatRowOuter, { gap: blockGap }]}>
          {Array.from({ length: beats }).map((_, i) => (
            <BeatBlock
              key={i}
              beatIdx={i}
              accentBeat={isPremium ? accentBeat : 0}
              accentSilent={isPremium ? accentSilent : false}
              isMuted={isPremium ? mutedBeats.includes(i) : false}
              currentBeat={currentBeat}
              currentSub={currentSub}
              subdivisions={subdivClicks}
              accentColor={effAccent}
              accentDim={effAccentDim}
              accentMuted={effAccentMuted}
              onTap={isPremium ? toggleMute : () => setShowUpgrade(true)}
              onLongPress={isPremium ? setAccentBeat : () => setShowUpgrade(true)}
            />
          ))}

          {/* Accent-mute toggle — silences the louder accent click while
              keeping the visual red strip so you can still see beat 1 */}
          <Pressable
            onPress={() => isPremium ? setAccentSilent((v) => !v) : setShowUpgrade(true)}
            style={styles.mutePressable}
          >
            {({ pressed }) => (
              <LinearGradient
                colors={pressed ? ["#14141e", "#2e2e4e"] : ["#36365a", "#1e1e38"]}
                style={[styles.muteBtn, {
                  borderColor: (isPremium && accentSilent) ? "#3e1010" : "#4e4e7a",
                  borderBottomColor: pressed ? "#4a4a70" : "#0a0a16",
                }]}
              >
                <View style={[styles.muteLed, {
                  backgroundColor: (isPremium && accentSilent) ? effAccentMuted : effAccent,
                  shadowColor: effAccent,
                  shadowOpacity: (isPremium && accentSilent) ? 0 : 0.9,
                  shadowRadius: 5,
                }]} />
                <Text style={[styles.muteLabel, { color: (isPremium && accentSilent) ? effAccentDim : "#c8c8d8" }]}>
                  {isPremium ? "A" : "🔒"}
                </Text>
              </LinearGradient>
            )}
          </Pressable>
        </View>

        {/* ── Strip buttons ─────────────────────────────────────────────── */}
        <View style={styles.strip}>

          <Pressable onPress={() => setSheetMode("beats")} style={styles.stripPressable}>
            {({ pressed }) => (
              <LinearGradient
                colors={pressed ? ["#14141e", "#2e2e4e"] : ["#36365a", "#1e1e38"]}
                style={[styles.stripBtn, {
                  borderColor: pressed ? "#28283c" : "#4e4e7a",
                  borderBottomColor: pressed ? "#4a4a70" : "#0a0a16",
                }]}
              >
                <Text style={styles.stripTag}>BEATS</Text>
                <Text style={styles.stripBtnVal}>{beats}/{denominator}</Text>
              </LinearGradient>
            )}
          </Pressable>

          <Pressable onPress={() => isPremium ? setSheetMode("subdiv") : setShowUpgrade(true)} style={styles.stripPressable}>
            {({ pressed }) => (
              <LinearGradient
                colors={pressed ? ["#14141e", "#2e2e4e"] : ["#36365a", "#1e1e38"]}
                style={[styles.stripBtn, {
                  borderColor: pressed ? "#28283c" : "#4e4e7a",
                  borderBottomColor: pressed ? "#4a4a70" : "#0a0a16",
                }]}
              >
                <Text style={styles.stripTag}>SUBDIV</Text>
                <SubdivSvg value={subdivClicks} />
              </LinearGradient>
            )}
          </Pressable>

          <Pressable onPress={cycleSound} style={styles.stripPressable}>
            {({ pressed }) => (
              <LinearGradient
                colors={pressed ? ["#14141e", "#2e2e4e"] : ["#36365a", "#1e1e38"]}
                style={[styles.stripBtn, {
                  borderColor: pressed ? "#28283c" : "#4e4e7a",
                  borderBottomColor: pressed ? "#4a4a70" : "#0a0a16",
                }]}
              >
                <Text style={styles.stripTag}>SOUND</Text>
                <Text style={[styles.stripBtnVal, { color: colors.primary, fontSize: 13 }]}>
                  {SOUND_LABELS[soundType]}
                </Text>
              </LinearGradient>
            )}
          </Pressable>

        </View>

        {/* ── BPM number (long-press to type) ───────────────────────────── */}
        <Pressable
          style={styles.midGroup}
          onLongPress={() => { setBpmInputText(String(bpm)); setBpmInputVisible(true); }}
          delayLongPress={400}
        >
          <Text style={[styles.bpmNum, { color: "#e8e8fc" }]}>{bpm}</Text>
          <View style={styles.bpmLabelRow}>
            <Text style={styles.bpmArrow}>‹</Text>
            <Text style={[styles.bpmUnit, { color: "#484870" }]}>BPM</Text>
            <Text style={styles.bpmArrow}>›</Text>
          </View>
        </Pressable>

        {/* ── BPM type-in modal ─────────────────────────────────────────── */}
        <Modal
          visible={bpmInputVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setBpmInputVisible(false)}
        >
          <Pressable style={styles.bpmModalOverlay} onPress={() => setBpmInputVisible(false)}>
            <Pressable style={styles.bpmModalCard} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.bpmModalTitle}>Set Tempo</Text>
              <TextInput
                style={styles.bpmModalInput}
                value={bpmInputText}
                onChangeText={setBpmInputText}
                keyboardType="number-pad"
                maxLength={3}
                selectTextOnFocus
                autoFocus
                placeholder="BPM"
                placeholderTextColor="#40406a"
                onSubmitEditing={() => {
                  const n = parseInt(bpmInputText, 10);
                  if (!isNaN(n)) setBpm(Math.max(30, Math.min(240, n)));
                  setBpmInputVisible(false);
                }}
              />
              <Text style={styles.bpmModalRange}>30 – 240 BPM</Text>
              <Pressable
                style={styles.bpmModalBtn}
                onPress={() => {
                  const n = parseInt(bpmInputText, 10);
                  if (!isNaN(n)) setBpm(Math.max(30, Math.min(240, n)));
                  setBpmInputVisible(false);
                }}
              >
                <Text style={styles.bpmModalBtnText}>Set</Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </Modal>

        {/* ── Tempo name ────────────────────────────────────────────────── */}
        <Text style={styles.tempoName}>{tempoName(bpm)}</Text>

        {/* ── Jog Wheel ─────────────────────────────────────────────────── */}
        <View style={styles.wheelWrap}>
          <View style={{ width: WS, height: WS }}>

            {/* Outer ring — handles pan-to-change-BPM */}
            <View {...panResponder.panHandlers} style={StyleSheet.absoluteFill}>
              <Svg width={WS} height={WS}>
                <Defs>
                  <RadialGradient id="bezel" cx="50%" cy="30%" r="70%">
                    <Stop offset="0%"   stopColor="#42426a" />
                    <Stop offset="42%"  stopColor="#2c2c52" />
                    <Stop offset="78%"  stopColor="#16163a" />
                    <Stop offset="100%" stopColor="#07070f" />
                  </RadialGradient>
                  <RadialGradient id="grip" cx="50%" cy="30%" r="66%">
                    <Stop offset="0%"   stopColor="#2e2e50" />
                    <Stop offset="55%"  stopColor="#181830" />
                    <Stop offset="100%" stopColor="#080814" />
                  </RadialGradient>
                  <RadialGradient id="gloss" cx="50%" cy="18%" r="42%">
                    <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.10" />
                    <Stop offset="100%" stopColor="#ffffff" stopOpacity="0"    />
                  </RadialGradient>
                </Defs>

                <Circle cx={C} cy={C} r={R_BEZEL} fill="url(#bezel)" />
                <Circle cx={C} cy={C} r={R_BEZEL - 1} fill="none"
                  stroke="#5a5a8a" strokeWidth={1.5} opacity={0.85} />
                <Circle cx={C} cy={C} r={R_BEZEL - 2.5} fill="none"
                  stroke="#04041a" strokeWidth={1} opacity={0.6} />

                <Circle cx={C} cy={C} r={R_GRIP} fill="url(#grip)" />

                {Array.from({ length: KNURLS }).map((_, i) => {
                  const ang = (i / KNURLS) * 2 * Math.PI;
                  const lit = (Math.cos(ang - Math.PI / 2) + 1) / 2;
                  const op  = 0.08 + 0.48 * lit;
                  const sw  = i % 4 === 0 ? 1.5 : 0.7;
                  return (
                    <Line key={i}
                      x1={C + (R_WELL + 3) * Math.sin(ang)}
                      y1={C - (R_WELL + 3) * Math.cos(ang)}
                      x2={C + (R_GRIP - 3) * Math.sin(ang)}
                      y2={C - (R_GRIP - 3) * Math.cos(ang)}
                      stroke="#a0a0d8" strokeWidth={sw} opacity={op}
                    />
                  );
                })}

                <Circle cx={C} cy={C} r={R_WELL + 4} fill="none"
                  stroke="#000000" strokeWidth={8} opacity={0.80} />
                <Circle cx={C} cy={C} r={R_WELL} fill="#0c0c18" />
                <Circle cx={C} cy={C} r={R_GRIP} fill="url(#gloss)" />
              </Svg>
            </View>

            {/* Beat-pulse glow ring (non-interactive) */}
            <Animated.View
              pointerEvents="none"
              style={[
                StyleSheet.absoluteFill,
                { alignItems: "center", justifyContent: "center", opacity: glowOpacity },
              ]}
            >
              <View style={{
                position: "absolute",
                width:  (R_WELL - 2) * 2 + 18,
                height: (R_WELL - 2) * 2 + 18,
                borderRadius: R_WELL - 2 + 9,
                borderWidth: 9, borderColor: glowColor, opacity: 0.18,
              }} />
              <View style={{
                width:  (R_WELL - 2) * 2,
                height: (R_WELL - 2) * 2,
                borderRadius: R_WELL - 2,
                borderWidth: 2.5, borderColor: glowColor,
              }} />
            </Animated.View>

            {/* Inner well — tap to start / stop */}
            <Pressable
              onPress={togglePlay}
              style={{
                position: "absolute",
                left:   C - R_WELL + 4,
                top:    C - R_WELL + 4,
                width:  (R_WELL - 4) * 2,
                height: (R_WELL - 4) * 2,
                borderRadius: R_WELL - 4,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{
                fontSize: 46,
                color: running ? "#dd2222" : "#8844ee",
                lineHeight: 46,
                includeFontPadding: false,
                marginLeft: running ? 0 : 5,
              }}>
                {running ? "■" : "▶"}
              </Text>
            </Pressable>

          </View>
        </View>

        {/* ── Tap tempo ─────────────────────────────────────────────────── */}
        <HifiButton onPress={handleTap} label="TAP" />

        {/* ── Accent colour picker ──────────────────────────────────────── */}
        <View style={styles.colourSection}>
          <Text style={styles.colourLabel}>COLOUR</Text>
          {isPremium ? (
            <View style={styles.colourRow}>
              {ACCENT_THEMES.map((t, i) => (
                <Pressable
                  key={i}
                  onPress={() => {
                    setAccentThemeIdx(i);
                    AsyncStorage.setItem(ACCENT_STORAGE_KEY, String(i)).catch(() => {});
                  }}
                  style={[
                    styles.colourDot,
                    {
                      width:       i === accentThemeIdx ? 22 : 16,
                      height:      i === accentThemeIdx ? 22 : 16,
                      borderRadius: i === accentThemeIdx ? 11 : 8,
                      backgroundColor: t.accent,
                      borderWidth: i === accentThemeIdx ? 2.5 : 1.5,
                      borderColor: i === accentThemeIdx ? "#ffffff" : t.dim,
                      shadowColor:   t.accent,
                      shadowOpacity: i === accentThemeIdx ? 0.8 : 0,
                      shadowRadius:  6,
                      elevation:     i === accentThemeIdx ? 6 : 0,
                    },
                  ]}
                />
              ))}
            </View>
          ) : (
            <Pressable onPress={() => setShowUpgrade(true)} style={styles.colourRow}>
              <View style={[styles.colourDot, {
                width: 22, height: 22, borderRadius: 11,
                backgroundColor: "#666666",
                borderWidth: 2.5, borderColor: "#ffffff",
                shadowColor: "#666666", shadowOpacity: 0.6, shadowRadius: 6, elevation: 4,
              }]} />
              <Text style={{ fontSize: 10, color: "rgba(185,66,255,0.6)", letterSpacing: 1.5, marginLeft: 6 }}>
                MORE COLOURS 🔒
              </Text>
            </Pressable>
          )}
        </View>

      </View>

      {/* ── Picker sheet ───────────────────────────────────────────────────── */}
      <Modal
        visible={sheetMode !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setSheetMode(null)}
      >
        <Pressable style={styles.backdrop} onPress={() => setSheetMode(null)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <LinearGradient colors={["#18182c", "#0c0c18"]} style={styles.sheetGrad}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>
              {sheetMode === "beats" ? "TIME SIGNATURE" : "SUBDIVISION"}
            </Text>

            <View style={styles.pickerWrap}>
              {sheetMode === "beats" ? (
                !isPremium ? (
                  <View style={{ gap: 8, width: "100%", alignItems: "stretch" }}>
                    {FREE_TIME_SIGS.map((sig) => {
                      const active = beats === sig.beats && denominator === sig.denominator;
                      return (
                        <Pressable
                          key={sig.label}
                          style={{
                            paddingVertical: 13,
                            paddingHorizontal: 24,
                            borderRadius: 10,
                            backgroundColor: active ? "rgba(185,66,255,0.18)" : "rgba(255,255,255,0.04)",
                            borderWidth: 1,
                            borderColor: active ? "rgba(185,66,255,0.55)" : "rgba(255,255,255,0.1)",
                            alignItems: "center",
                          }}
                          onPress={() => { setBeats(sig.beats); setDenominator(sig.denominator); setSheetMode(null); }}
                        >
                          <Text style={{ fontSize: 22, fontWeight: "700", color: active ? "#e0c8ff" : "#c8c8ec" }}>
                            {sig.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                    <Pressable
                      onPress={() => { setSheetMode(null); setShowUpgrade(true); }}
                      style={{ alignItems: "center", marginTop: 4 }}
                    >
                      <Text style={{ fontSize: 11, color: "rgba(185,66,255,0.65)", letterSpacing: 1.5 }}>
                        MORE TIME SIGNATURES 🔒 PRO
                      </Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.timeSigRow}>
                    <ScrollPicker
                      key={`beats-${beats}`}
                      values={BEATS_PICKER}
                      initialIndex={beats - 1}
                      onIndexChange={(i) => setBeats(i + 1)}
                      width={90}
                      visibleItems={5}
                    />
                    <Text style={styles.timeSigSlash}>/</Text>
                    <ScrollPicker
                      key={`denom-${denominator}`}
                      values={DENOM_PICKER}
                      initialIndex={DENOM_VALS.indexOf(denominator)}
                      onIndexChange={(i) => setDenominator(DENOM_VALS[i])}
                      width={90}
                      visibleItems={5}
                    />
                  </View>
                )
              ) : (
                <ScrollPicker
                  key={`subdiv-${subdivClicks}`}
                  values={SUBDIV_OPTIONS.map((o) => o.pickerLabel)}
                  initialIndex={SUBDIV_OPTIONS.findIndex((o) => o.value === subdivClicks)}
                  onIndexChange={(i) => setSubdiv(SUBDIV_OPTIONS[i].value)}
                  width={220}
                  visibleItems={5}
                  renderItem={(_, i) => {
                    const opt = SUBDIV_OPTIONS[i];
                    return (
                      <View style={{ flexDirection: "row", alignItems: "center",
                                     justifyContent: "center", gap: 12 }}>
                        <SubdivSvg value={opt.value} />
                        <Text style={{ fontSize: 15, fontWeight: "700",
                                       color: "#c8c8ec", width: 36 }}>
                          {opt.pickerLabel}
                        </Text>
                      </View>
                    );
                  }}
                />
              )}
            </View>

            <Pressable onPress={() => setSheetMode(null)}>
              {({ pressed }) => (
                <LinearGradient
                  colors={pressed ? ["#0e0e1c", "#1a1a2c"] : ["#22223a", "#0e0e1c"]}
                  style={styles.doneBtn}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </LinearGradient>
              )}
            </Pressable>
          </LinearGradient>
        </View>
      </Modal>

      <UpgradeModal visible={showUpgrade} onClose={() => setShowUpgrade(false)} />
    </ScreenBg>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },

  logoBlock: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  logoCenter: { flex: 1, alignItems: "center" },
  backBtn: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  backArrow: { color: "rgba(255,255,255,0.55)", fontSize: 30, lineHeight: 36, paddingLeft: 4 },
  logo: { width: 240, height: 40 },
  precisionLabel: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 3,
    color: "rgba(185,66,255,0.85)",
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

  // Beat block row + accent mute toggle
  beatRowOuter:  { width: "100%", flexDirection: "row", alignItems: "stretch" },

  // Each beat card — column layout: accent strip on top, sub segments below
  beatBlock: {
    height: 46,
    borderRadius: 7,
    backgroundColor: DOT_OFF,
    flexDirection: "column",
    overflow: "hidden",
  },
  accentStrip: {
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  accentDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: "#ffffff", opacity: 0.9,
  },
  segRow:       { flex: 1, flexDirection: "row" },
  beatBlockSeg: { flex: 1, borderWidth: 0.5, borderColor: "rgba(255,255,255,0.18)" },

  // Accent-mute button — same height as a beat block, fixed width
  mutePressable: { width: 34 },
  muteBtn: {
    flex: 1,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  muteLed:   { width: 6, height: 6, borderRadius: 3 },
  muteLabel: { fontSize: 10, fontWeight: "800", letterSpacing: 0 },

  midGroup:    { alignItems: "center" },
  bpmNum:      { fontSize: 52, fontWeight: "800", letterSpacing: -2, lineHeight: 56 },
  bpmLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -2 },
  bpmArrow:    { fontSize: 14, color: "#303058", fontWeight: "300" },
  bpmUnit:     { fontSize: 10, fontWeight: "600", letterSpacing: 3, color: "#484870" },

  bpmModalOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center", justifyContent: "center",
  },
  bpmModalCard: {
    width: 220, backgroundColor: "#111128",
    borderRadius: 18, borderWidth: 1, borderColor: "#252548",
    alignItems: "center", paddingVertical: 28, paddingHorizontal: 24, gap: 12,
  },
  bpmModalTitle: {
    fontSize: 11, fontWeight: "700", letterSpacing: 2.5,
    color: "#5858a0", textTransform: "uppercase",
  },
  bpmModalInput: {
    width: "100%", backgroundColor: "#0a0a1c",
    borderRadius: 10, borderWidth: 1, borderColor: "#2a2a55",
    fontSize: 44, fontWeight: "800", letterSpacing: -1,
    color: "#e8e8fc", textAlign: "center", paddingVertical: 10,
  },
  bpmModalRange: {
    fontSize: 10, fontWeight: "500", letterSpacing: 1.5,
    color: "#38385a",
  },
  bpmModalBtn: {
    marginTop: 4, width: "100%", backgroundColor: "#1e1e42",
    borderRadius: 10, borderWidth: 1, borderColor: "#303068",
    paddingVertical: 12, alignItems: "center",
  },
  bpmModalBtnText: {
    fontSize: 14, fontWeight: "700", letterSpacing: 1.5,
    color: "#a0a0e8",
  },

  tempoName: { fontSize: 10, fontWeight: "500", letterSpacing: 2, color: "#50508a" },

  strip:          { width: "100%", flexDirection: "row", gap: 8 },
  stripPressable: { flex: 1 },
  stripBtn: {
    borderRadius: 10, borderWidth: 1, height: 56,
    alignItems: "center", justifyContent: "center", gap: 3,
  },
  stripTag:    { fontSize: 7,  fontWeight: "700", letterSpacing: 2, color: "#8080b0" },
  stripBtnVal: { fontSize: 16, fontWeight: "700", color: "#c8c8ec", letterSpacing: 0.5 },

  wheelWrap: { alignItems: "center" },

  colourSection: {
    alignItems: "center", gap: 8,
  },
  colourLabel: {
    fontSize: 9, fontWeight: "700", letterSpacing: 2, color: "#50508a",
    textAlign: "center",
  },
  colourRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10,
  },
  colourDot: {},
  btnOuter:    { borderRadius: 12, borderWidth: 1, overflow: "hidden", height: 48 },
  btnGradient: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 14, gap: 5,
  },
  ledStrip: { width: 24, height: 4, borderRadius: 2 },
  btnLabel: { fontSize: 13, fontWeight: "700", letterSpacing: 1 },

  backdrop:  { flex: 1 },
  sheet:     { borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  sheetGrad: {
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1,
    borderColor: "#2a2a42",
    paddingHorizontal: 24, paddingTop: 12, paddingBottom: 8,
    alignItems: "center",
  },
  handle:     { width: 36, height: 4, borderRadius: 2, backgroundColor: "#2e2e48", marginBottom: 14 },
  sheetTitle: { fontSize: 11, fontWeight: "700", letterSpacing: 3, color: "#6060a0", marginBottom: 4 },
  pickerWrap: { marginVertical: 8 },

  timeSigRow:   { flexDirection: "row", alignItems: "center", gap: 4 },
  timeSigSlash: { fontSize: 36, fontWeight: "200", color: "#6060a0", marginHorizontal: 4 },

  doneBtn: {
    marginTop: 12, paddingVertical: 11, paddingHorizontal: 48,
    borderRadius: 12, borderWidth: 1, borderColor: "#2a2a3e", alignItems: "center",
  },
  doneBtnText: { fontSize: 14, fontWeight: "700", color: "#c0c0dc", letterSpacing: 0.5 },
});
