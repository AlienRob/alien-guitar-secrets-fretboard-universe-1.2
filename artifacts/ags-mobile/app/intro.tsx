/**
 * Intro sequence — three phases:
 *
 *   1. STARSCAPE  — drifting parallax starfield (3 layers), AGS logo + title.
 *                   Fades in, holds ~1.5s, then crossfades into the video.
 *   2. VIDEO      — full-screen app-intro.mp4, plays to end (or user skips).
 *   3. ENTER      — same drifting starfield + pulsing "Enter..."
 *                   Tap anywhere for a deliberate soft fade into the app.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { markIntroComplete } from "@/lib/introHandoff";
import { useVideoPlayer, VideoView } from "expo-video";
import { useRouter } from "expo-router";
import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export const SKIP_INTRO_KEY = "ags-skip-intro";

// ---------------------------------------------------------------------------
// Single parallax drift layer — stars scroll downward, seamless loop
// ---------------------------------------------------------------------------
interface DriftLayerProps {
  width: number;
  height: number;
  count: number;
  duration: number; // ms per full-height scroll
  minSize: number;
  maxSize: number;
  minOpacity: number;
  maxOpacity: number;
}

function DriftLayer({
  width,
  height,
  count,
  duration,
  minSize,
  maxSize,
  minOpacity,
  maxOpacity,
}: DriftLayerProps) {
  const drift = useRef(new Animated.Value(0)).current;

  // Each star is rendered at Y and Y-height so the loop is seamless
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        size: minSize + Math.random() * (maxSize - minSize),
        opacity: minOpacity + Math.random() * (maxOpacity - minOpacity),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(drift, {
        toValue: height,
        duration,
        useNativeDriver: true,
      })
    );
    anim.start();
    return () => anim.stop();
  }, [drift, duration, height]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { transform: [{ translateY: drift }] },
      ]}
    >
      {stars.flatMap((s, i) => {
        const style = {
          position: "absolute" as const,
          width: s.size,
          height: s.size,
          borderRadius: s.size / 2,
          backgroundColor: `rgba(210,225,255,${s.opacity})`,
          left: s.x,
        };
        return [
          <View key={`${i}a`} style={{ ...style, top: s.y - height }} />,
          <View key={`${i}b`} style={{ ...style, top: s.y }} />,
        ];
      })}
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Full drifting parallax starscape (3 layers = near / mid / far)
// ---------------------------------------------------------------------------
function DriftingStarscape({ width, height }: { width: number; height: number }) {
  return (
    <View style={[StyleSheet.absoluteFill, styles.starBg]} pointerEvents="none">
      {/* Far — tiny, very slow */}
      <DriftLayer
        width={width} height={height}
        count={100} duration={35000}
        minSize={0.4} maxSize={1.0}
        minOpacity={0.15} maxOpacity={0.45}
      />
      {/* Mid — medium, moderate speed */}
      <DriftLayer
        width={width} height={height}
        count={55} duration={22000}
        minSize={0.9} maxSize={1.8}
        minOpacity={0.3} maxOpacity={0.65}
      />
      {/* Near — larger, faster */}
      <DriftLayer
        width={width} height={height}
        count={28} duration={13000}
        minSize={1.6} maxSize={2.8}
        minOpacity={0.5} maxOpacity={0.9}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
type Phase = "starscape" | "video" | "enter";

export default function IntroScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const navigated = useRef(false);

  const [phase, setPhase] = useState<Phase>("starscape");
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [enterTapped, setEnterTapped] = useState(false);

  const starscapeOpacity = useRef(new Animated.Value(0)).current;
  const logoOpacity      = useRef(new Animated.Value(0)).current;
  const videoOpacity     = useRef(new Animated.Value(0)).current;
  const enterOpacity     = useRef(new Animated.Value(0)).current;
  const enterPulse       = useRef(new Animated.Value(0.35)).current;
  const skipOpacity      = useRef(new Animated.Value(0)).current;
  const veilOpacity      = useRef(new Animated.Value(0)).current;

  const videoPlayer = useVideoPlayer(require("@/assets/videos/app-intro.mp4"));

  // ---------------------------------------------------------------------------
  // Navigate — fade to black then push to tabs
  // ---------------------------------------------------------------------------
  const goToApp = useCallback(async () => {
    if (navigated.current) return;
    navigated.current = true;
    if (dontShowAgain) {
      await AsyncStorage.setItem(SKIP_INTRO_KEY, "true");
    }
    Animated.sequence([
      Animated.timing(enterOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.timing(veilOpacity,  { toValue: 1, duration: 1000, useNativeDriver: true }),
    ]).start(() => {
      markIntroComplete();
      router.replace("/(tabs)");
    });
  }, [dontShowAgain, enterOpacity, veilOpacity, router]);

  // ---------------------------------------------------------------------------
  // Phase STARSCAPE: fade in → hold 1.5s → crossfade to video
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "starscape") return;

    Animated.parallel([
      Animated.timing(starscapeOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(logoOpacity,      { toValue: 1, duration: 1000, delay: 200, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      videoPlayer.loop = false;
      videoPlayer.play();

      Animated.parallel([
        Animated.timing(starscapeOpacity, { toValue: 0, duration: 1300, useNativeDriver: true }),
        Animated.timing(logoOpacity,      { toValue: 0, duration: 900,  useNativeDriver: true }),
        Animated.timing(videoOpacity,     { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(skipOpacity,      { toValue: 1, duration: 500, delay: 700, useNativeDriver: true }),
      ]).start(() => setPhase("video"));
    }, 4500);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------------------------------------------------------------------------
  // Phase VIDEO: advance to ENTER when video ends
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "video") return;
    const sub = videoPlayer.addListener("playToEnd", () => setPhase("enter"));
    return () => sub.remove();
  }, [phase, videoPlayer]);

  // ---------------------------------------------------------------------------
  // Phase ENTER: crossfade video → drifting starscape, pulse "Enter..."
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (phase !== "enter") return;

    Animated.parallel([
      Animated.timing(videoOpacity,  { toValue: 0, duration: 1000, useNativeDriver: true }),
      Animated.timing(skipOpacity,   { toValue: 0, duration: 300,  useNativeDriver: true }),
      Animated.timing(enterOpacity,  { toValue: 1, duration: 1200, delay: 300, useNativeDriver: true }),
    ]).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(enterPulse, { toValue: 1,    duration: 1000, useNativeDriver: true }),
          Animated.timing(enterPulse, { toValue: 0.28, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // ---------------------------------------------------------------------------
  // Skip — jump to Enter screen from anywhere
  // ---------------------------------------------------------------------------
  const handleSkip = useCallback(() => {
    if (phase === "starscape" || phase === "video") {
      videoPlayer.pause();
      Animated.parallel([
        Animated.timing(starscapeOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(logoOpacity,      { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(videoOpacity,     { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(skipOpacity,      { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setPhase("enter"));
    }
  }, [phase, videoPlayer, starscapeOpacity, logoOpacity, videoOpacity, skipOpacity]);

  // ---------------------------------------------------------------------------
  // Tap on Enter screen
  // ---------------------------------------------------------------------------
  const handleEnterTap = useCallback(() => {
    if (enterTapped) return;
    setEnterTapped(true);
    void goToApp();
  }, [enterTapped, goToApp]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <View style={[styles.root, StyleSheet.absoluteFillObject]}>

      {/* ── Layer 1: Opening drifting starscape ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: starscapeOpacity }]}
        pointerEvents="none"
      >
        <DriftingStarscape width={width} height={height} />
      </Animated.View>

      {/* ── Logo + title ── */}
      <Animated.View
        style={[styles.logoContainer, { opacity: logoOpacity }]}
        pointerEvents="none"
      >
        <Image
          source={require("@/assets/images/logo-horizontal.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.subtitle}>FRETBOARD UNIVERSE</Text>
        <View style={styles.subtitleLine} />
      </Animated.View>

      {/* ── Layer 2: Video ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}
        pointerEvents={phase === "video" ? "auto" : "none"}
      >
        <VideoView
          player={videoPlayer}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          nativeControls={false}
        />
      </Animated.View>

      {/* ── Layer 3: Enter drifting starscape ── */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: enterOpacity }]}
        pointerEvents={phase === "enter" && !enterTapped ? "auto" : "none"}
      >
        <DriftingStarscape width={width} height={height} />

        <Pressable style={StyleSheet.absoluteFill} onPress={handleEnterTap}>
          <View style={styles.enterContainer}>
            <Animated.Text style={[styles.enterText, { opacity: enterPulse }]}>
              Enter...
            </Animated.Text>
            <Pressable
              onPress={() => setDontShowAgain((v) => !v)}
              style={styles.toggleRow}
              hitSlop={12}
            >
              <View style={[styles.checkbox, dontShowAgain && styles.checkboxOn]}>
                {dontShowAgain && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.toggleLabel}>Don't show this again</Text>
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>

      {/* ── Skip button (starscape + video phases) ── */}
      <Animated.View
        style={[styles.topBar, { paddingTop: insets.top + 12, opacity: skipOpacity }]}
        pointerEvents={phase !== "enter" ? "auto" : "none"}
      >
        <Pressable onPress={handleSkip} style={styles.skipBtn} hitSlop={12}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </Animated.View>

      {/* ── Transition veil ── */}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: veilOpacity }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { backgroundColor: "#000" },
  starBg: { backgroundColor: "#020408" },

  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  logo: {
    width: 300,
    height: 120,
    marginBottom: 20,
  },
  subtitle: {
    color: "rgba(200,220,255,0.85)",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 7,
    textAlign: "center",
  },
  subtitleLine: {
    marginTop: 14,
    width: 70,
    height: 1.5,
    backgroundColor: "rgba(0,255,213,0.5)",
  },

  enterContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 40,
  },
  enterText: {
    color: "#c8d4ff",
    fontSize: 32,
    fontWeight: "300",
    letterSpacing: 9,
    textAlign: "center",
  },

  topBar: {
    position: "absolute",
    top: 0, right: 0, left: 0,
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
  },
  skipBtn: {
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  skipText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
  },

  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxOn:  { backgroundColor: "#00ffd5", borderColor: "#00ffd5" },
  checkmark:   { color: "#000", fontSize: 13, fontWeight: "800" },
  toggleLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "500",
  },
});
