import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import { type DrillOutcome } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { playLevelUpFanfare } from "@/lib/audio";

const RAY_COUNT = 12;
const PARTICLE_COUNT = 18;
const AUTO_DISMISS_MS = 3800;

// A burst particle: a coloured spark that flies out from the centre.
interface Spark {
  angle: number;
  distance: number;
  size: number;
  color: string;
}

// Full-screen cinematic burst played once when a drill pushes the player up a
// level (or into a new belt). Rays sweep, a badge springs in with the new
// level, sparks fly outward, and a triumphant lick plays. Tapping anywhere — or
// the auto-timer — dismisses it back to the result screen underneath.
//
// Built on React Native's Animated API (no reanimated/worklet setup needed) so
// it runs identically on the web preview and on device. Honours the OS
// "reduce motion" setting: when that's on we skip the whole sequence and call
// onDone immediately, leaving the plain text summary on the result screen.
export function LevelUpCelebration({
  outcome,
  onDone,
}: {
  outcome: DrillOutcome;
  onDone: () => void;
}) {
  const colors = useColors();
  const { width, height } = useWindowDimensions();
  const [visible, setVisible] = useState(true);

  const backdrop = useRef(new Animated.Value(0)).current;
  const badge = useRef(new Animated.Value(0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;
  const textRise = useRef(new Animated.Value(0)).current;

  const dismissedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  const sparkColors = useMemo(
    () => [colors.accent, colors.secondary, colors.chordTone, colors.rootNote, colors.primary],
    [colors],
  );
  const sparks = useMemo<Spark[]>(() => {
    const reach = Math.min(width, height) * 0.46;
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      angle: (i / PARTICLE_COUNT) * Math.PI * 2 + (i % 2 ? 0.18 : 0),
      distance: reach * (0.6 + ((i * 37) % 40) / 100),
      size: 6 + ((i * 13) % 10),
      color: sparkColors[i % sparkColors.length],
    }));
  }, [width, height, sparkColors]);

  const finish = () => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    loopsRef.current.forEach((l) => l.stop());
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 260, useNativeDriver: true }),
      Animated.timing(badge, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start(() => {
      setVisible(false);
      onDone();
    });
  };

  useEffect(() => {
    let cancelled = false;

    const run = () => {
      if (Platform.OS !== "web") {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      playLevelUpFanfare();

      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(badge, {
          toValue: 1,
          friction: 5,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(burst, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(textRise, {
          toValue: 1,
          duration: 460,
          delay: 160,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]).start();

      const spinLoop = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration: 14000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      const pulseLoop = Animated.loop(
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      );
      loopsRef.current = [spinLoop, pulseLoop];
      spinLoop.start();
      pulseLoop.start();

      timerRef.current = setTimeout(finish, AUTO_DISMISS_MS);
    };

    // Skip the spectacle entirely if the user prefers reduced motion.
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled) return;
        if (reduce) {
          dismissedRef.current = true;
          setVisible(false);
          onDone();
        } else {
          run();
        }
      })
      .catch(() => {
        if (!cancelled) run();
      });

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      loopsRef.current.forEach((l) => l.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.9] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });
  const badgeScale = badge.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });
  const textTranslate = textRise.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  const headline = outcome.leveledUp ? "LEVEL UP!" : "NEW RANK";

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={finish}>
      <Pressable style={styles.root} onPress={finish}>
        <Animated.View
          style={[styles.backdrop, { backgroundColor: "rgba(3,6,18,0.9)", opacity: backdrop }]}
        />

        {/* Rotating light rays behind the badge */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.rayWrap,
            { width, height, opacity: backdrop, transform: [{ rotate: spinDeg }] },
          ]}
        >
          {Array.from({ length: RAY_COUNT }).map((_, i) => (
            <LinearGradient
              key={i}
              colors={[`${colors.primary}00`, `${colors.accent}55`, `${colors.primary}00`]}
              style={[
                styles.ray,
                {
                  height: Math.max(width, height) * 1.1,
                  transform: [{ rotate: `${(i / RAY_COUNT) * 180}deg` }],
                },
              ]}
            />
          ))}
        </Animated.View>

        {/* Pulsing ring */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ring,
            {
              borderColor: colors.accent,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />

        {/* Sparks flying outward */}
        {sparks.map((s, i) => {
          const tx = burst.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.cos(s.angle) * s.distance],
          });
          const ty = burst.interpolate({
            inputRange: [0, 1],
            outputRange: [0, Math.sin(s.angle) * s.distance],
          });
          const opacity = burst.interpolate({
            inputRange: [0, 0.12, 0.85, 1],
            outputRange: [0, 1, 1, 0],
          });
          const scale = burst.interpolate({
            inputRange: [0, 0.2, 1],
            outputRange: [0.4, 1.1, 0.5],
          });
          return (
            <Animated.View
              key={i}
              pointerEvents="none"
              style={[
                styles.spark,
                {
                  width: s.size,
                  height: s.size,
                  borderRadius: s.size / 2,
                  backgroundColor: s.color,
                  opacity,
                  transform: [{ translateX: tx }, { translateY: ty }, { scale }],
                },
              ]}
            />
          );
        })}

        {/* Central badge */}
        <Animated.View
          style={[styles.badgeWrap, { opacity: badge, transform: [{ scale: badgeScale }] }]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.badge, { shadowColor: colors.accent }]}
          >
            <Text style={[styles.badgeLabel, { color: colors.accentForeground }]}>LEVEL</Text>
            <Text style={[styles.badgeNumber, { color: colors.primaryForeground }]}>
              {outcome.newLevel}
            </Text>
          </LinearGradient>
        </Animated.View>

        {/* Headline + belt chip */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.textWrap,
            { opacity: textRise, transform: [{ translateY: textTranslate }] },
          ]}
        >
          <Text style={[styles.headline, { color: colors.accent }]}>{headline}</Text>
          {outcome.beltChanged ? (
            <View
              style={[
                styles.beltChip,
                { borderColor: outcome.newBelt.color, backgroundColor: `${outcome.newBelt.color}22` },
              ]}
            >
              <Text style={[styles.beltText, { color: outcome.newBelt.color }]}>
                {outcome.newBelt.name} Belt
              </Text>
            </View>
          ) : null}
        </Animated.View>

        <Animated.View style={[styles.hintWrap, { opacity: textRise }]}>
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>Tap to continue</Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center" },
  backdrop: { ...StyleSheet.absoluteFillObject },
  rayWrap: { position: "absolute", alignItems: "center", justifyContent: "center" },
  ray: { position: "absolute", width: 26 },
  ring: { position: "absolute", width: 220, height: 220, borderRadius: 110, borderWidth: 3 },
  spark: { position: "absolute" },
  badgeWrap: { alignItems: "center", justifyContent: "center" },
  badge: {
    width: 168,
    height: 168,
    borderRadius: 84,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.9,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  badgeLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", letterSpacing: 4, marginBottom: 2 },
  badgeNumber: { fontSize: 72, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 78 },
  textWrap: { position: "absolute", bottom: "26%", alignItems: "center", gap: 14 },
  headline: { fontSize: 32, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 2, textAlign: "center" },
  beltChip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 999, borderWidth: 1.5 },
  beltText: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", letterSpacing: 1 },
  hintWrap: { position: "absolute", bottom: 56 },
  hint: { fontSize: 13, fontFamily: "Inter_500Medium", letterSpacing: 1 },
});
