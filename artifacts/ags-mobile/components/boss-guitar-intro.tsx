/**
 * Boss guitar intro cinematic.
 * Full-screen overlay that plays the boss's signature synthesized guitar lick
 * while their portrait slides in dramatically. Auto-dismisses when the lick
 * ends, or tap anywhere to skip.
 */
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { BossMobile } from "@/lib/bosses";
import { getBossLickDuration, playBossLick } from "@/lib/audio";

// Sprite sheets — same assets as guardian-briefing and galaxy
const bossesAction   = require("../assets/images/bosses-sprite.png");
const bossesAction2  = require("../assets/images/bosses-sprite-2.png");
const SPRITE_S1 = { cols: 4, cellW: 384, cellH: 512,  sheetW: 1536, sheetH: 1024 };
const SPRITE_S2 = { cols: 2, cellW: 768, cellH: 1024, sheetW: 1536, sheetH: 1024 };

function getBossPortrait(portraitIndex: number, screenW: number) {
  const isS2   = portraitIndex >= 8;
  const sh     = isS2 ? SPRITE_S2 : SPRITE_S1;
  const li     = isS2 ? portraitIndex - 8 : portraitIndex;
  const source = isS2 ? bossesAction2 : bossesAction;
  const col    = li % sh.cols;
  const row    = Math.floor(li / sh.cols);
  const scale  = screenW / sh.cellW;
  return {
    source,
    sheetW:  sh.sheetW * scale,
    sheetH:  sh.sheetH * scale,
    cellH:   sh.cellH  * scale,
    tx:     -(col * screenW),
    ty:     -(row * sh.cellH * scale),
  };
}

export function BossGuitarIntro({
  boss,
  onDone,
}: {
  boss: BossMobile;
  onDone: () => void;
}) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const insets  = useSafeAreaInsets();
  const geo     = getBossPortrait(boss.portraitIndex, screenW);
  const lickDur = getBossLickDuration(boss.id);
  const ac      = boss.accentColor;

  // Portrait is capped so the bottom info panel always has room
  const portraitH = Math.min(geo.cellH, screenH * 0.68);

  const bgOp      = useRef(new Animated.Value(0)).current;
  const portraitY = useRef(new Animated.Value(70)).current;
  const portraitOp = useRef(new Animated.Value(0)).current;
  const textOp    = useRef(new Animated.Value(0)).current;
  const glowScale = useRef(new Animated.Value(0.82)).current;
  const fadeOut   = useRef(new Animated.Value(1)).current;
  const dismissed = useRef(false);

  const dismiss = () => {
    if (dismissed.current) return;
    dismissed.current = true;
    Animated.timing(fadeOut, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onDone());
  };

  useEffect(() => {
    // Haptic punch on enter (native only)
    if (Platform.OS !== "web") {
      const Haptics = require("expo-haptics") as typeof import("expo-haptics");
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
    }

    // Play the lick 350 ms after mount so the portrait is visible first
    const lickTimer = setTimeout(() => playBossLick(boss.id), 350);

    // Entry animations
    Animated.sequence([
      Animated.timing(bgOp, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.parallel([
        Animated.spring(portraitY, {
          toValue: 0, friction: 8, tension: 55, useNativeDriver: true,
        }),
        Animated.timing(portraitOp, {
          toValue: 1, duration: 320, useNativeDriver: true,
        }),
        Animated.timing(textOp, {
          toValue: 1, duration: 450, delay: 220, useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowScale, {
              toValue: 1.14, duration: 1900, useNativeDriver: true,
            }),
            Animated.timing(glowScale, {
              toValue: 0.90, duration: 1900, useNativeDriver: true,
            }),
          ]),
        ),
      ]),
    ]).start();

    // Auto-dismiss: lick duration + 1.25 s buffer + 0.35 s entry delay
    const dismissTimer = setTimeout(dismiss, (lickDur + 1.25 + 0.35) * 1000);

    return () => {
      clearTimeout(lickTimer);
      clearTimeout(dismissTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Pressable onPress={dismiss} style={StyleSheet.absoluteFill}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { opacity: Animated.multiply(bgOp, fadeOut) },
        ]}
      >
        {/* Deep space background */}
        <View style={[StyleSheet.absoluteFill, styles.bg]} />

        {/* Radial accent glow — pulses behind the portrait */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.glow,
            {
              backgroundColor: ac,
              top: portraitH * 0.18,
              left: screenW / 2 - 140,
              transform: [{ scale: glowScale }],
            },
          ]}
        />

        {/* Boss portrait — action sprite, fills screen width */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.portraitWrap,
            {
              width: screenW,
              height: portraitH,
              opacity: portraitOp,
              transform: [{ translateY: portraitY }],
            },
          ]}
        >
          <Image
            source={geo.source}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: geo.sheetW,
              height: geo.sheetH,
              transform: [
                { translateX: geo.tx },
                { translateY: geo.ty },
              ],
            }}
          />
          {/* Gradient fade — blends portrait into info panel */}
          <LinearGradient
            colors={["transparent", "rgba(3,6,18,0.75)", "#030612"]}
            style={[
              StyleSheet.absoluteFill,
              { top: portraitH * 0.52 },
            ]}
            pointerEvents="none"
          />
        </Animated.View>

        {/* "BOSS BATTLE" kicker — top of screen */}
        <Animated.Text
          pointerEvents="none"
          style={[
            styles.kicker,
            { color: ac, top: insets.top + 18, opacity: textOp },
          ]}
        >
          BOSS BATTLE
        </Animated.Text>

        {/* Info block — boss name + specialty */}
        <Animated.View
          pointerEvents="none"
          style={[styles.infoBlock, { opacity: textOp }]}
        >
          <Text style={[styles.bossName, { color: ac }]}>
            {boss.name}
            {boss.nameAccent ? ` ${boss.nameAccent}` : ""}
          </Text>
          <Text style={[styles.bossSpecialty, { color: "rgba(255,255,255,0.50)" }]}>
            {boss.specialty}
          </Text>
        </Animated.View>

        {/* Skip hint */}
        <Animated.Text
          pointerEvents="none"
          style={[
            styles.skipHint,
            { bottom: insets.bottom + 20, opacity: textOp },
          ]}
        >
          TAP TO SKIP
        </Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bg: {
    backgroundColor: "#030612",
  },
  glow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.20,
  },
  portraitWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  kicker: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 4,
  },
  infoBlock: {
    position: "absolute",
    bottom: 70,
    left: 0,
    right: 0,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 6,
  },
  bossName: {
    fontSize: 30,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  bossSpecialty: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 17,
    marginTop: 2,
  },
  skipHint: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2.5,
    color: "rgba(255,255,255,0.22)",
  },
});
