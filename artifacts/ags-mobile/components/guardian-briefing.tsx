import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { guardianForLevel } from "@/lib/bosses";

// ── Sprite sheet constants ─────────────────────────────────────────────────
// Neutral/standing poses  — used for the full-body reveal ("serious look")
const bossesNeutral  = require("../assets/images/bosses-sprite-neutral.png");
const bossesNeutral2 = require("../assets/images/bosses-sprite-2-neutral.png");
// Expressive/action poses — used for the bust close-up ("talking look")
const bossesAction  = require("../assets/images/bosses-sprite.png");
const bossesAction2 = require("../assets/images/bosses-sprite-2.png");

const S1 = { cols: 4, cellW: 384, cellH: 512,  sheetW: 1536, sheetH: 1024 };
const S2 = { cols: 2, cellW: 768, cellH: 1024, sheetW: 1536, sheetH: 1024 };

/**
 * Returns all geometry needed to render a boss portrait at two sizes:
 *   full — entire cell scaled to screenW using the neutral/standing sprite
 *   bust — cell scaled 2× and horizontally centred, clipped to the top 46%
 *          using the expressive/action sprite for the cinematic close-up.
 */
function getPortraitConfig(index: number, screenW: number) {
  const isS2 = index >= 8;
  const sh   = isS2 ? S2 : S1;
  const li   = isS2 ? index - 8 : index;
  const fullSource = isS2 ? bossesNeutral2 : bossesNeutral;
  const bustSource = isS2 ? bossesAction2  : bossesAction;
  const col  = li % sh.cols;
  const row  = Math.floor(li / sh.cols);

  // Full-body: scale so cell fills screen width
  const fs        = screenW / sh.cellW;
  const fullCellH = sh.cellH * fs;

  // Bust: 2× zoom, centred horizontally, clip top 46%
  const BUST_ZOOM = 2.0;
  const bs        = fs * BUST_ZOOM;
  const bustCellW = sh.cellW * bs;
  const bustCellH = sh.cellH * bs;

  return {
    fullSource,
    bustSource,
    full: {
      sheetW: sh.sheetW * fs,
      sheetH: sh.sheetH * fs,
      cellH:  fullCellH,
      tx:     -(col * sh.cellW * fs),
      ty:     -(row * fullCellH),
    },
    bust: {
      sheetW: sh.sheetW * bs,
      sheetH: sh.sheetH * bs,
      clipH:  bustCellH * 0.46,
      tx:     -(col * bustCellW) - (bustCellW - screenW) / 2,
      ty:     -(row * bustCellH),
    },
  };
}

// ── Types ──────────────────────────────────────────────────────────────────
type Stage = "corridor" | "reveal" | "briefing" | "cta";

const CAPTION_AUTO_MS = 4400;

// ── Component ──────────────────────────────────────────────────────────────
export function GuardianBriefing({
  level,
  onDone,
}: {
  level: number;
  onDone: () => void;
}) {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { width: screenW, height: screenH } = useWindowDimensions();
  const guardian = guardianForLevel(level);
  const cfg      = getPortraitConfig(guardian.portraitIndex, screenW);
  const ac       = guardian.accentColor;

  const [stage,      setStage]      = useState<Stage>("corridor");
  const [captionIdx, setCaptionIdx] = useState(0);
  const captionRef = useRef(0);
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Animated values ──────────────────────────────────────────────────────
  const globalOp   = useRef(new Animated.Value(0)).current;
  const corridorOp = useRef(new Animated.Value(0)).current;
  const line1Op    = useRef(new Animated.Value(0)).current;
  const line2Op    = useRef(new Animated.Value(0)).current;
  const line3Op    = useRef(new Animated.Value(0)).current;
  const portraitOp = useRef(new Animated.Value(0)).current;
  const nameOp     = useRef(new Animated.Value(0)).current;
  const nameY      = useRef(new Animated.Value(28)).current;
  const zoomAnim   = useRef(new Animated.Value(0)).current;   // 0 = full, 1 = bust
  const captionOp  = useRef(new Animated.Value(0)).current;
  const ctaOp      = useRef(new Animated.Value(0)).current;

  // Crossfade between full-body and bust as zoomAnim advances
  const fullOp = zoomAnim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [1, 0.15, 0] });
  const bustOp = zoomAnim.interpolate({ inputRange: [0, 0.45, 1], outputRange: [0, 0.4,  1] });

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // ── Stage: corridor ──────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(globalOp, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.timing(corridorOp, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(200),
      Animated.timing(line1Op, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(350),
      Animated.timing(line2Op, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.delay(400),
      Animated.timing(line3Op, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.parallel([
        Animated.timing(line1Op,    { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(line2Op,    { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(line3Op,    { toValue: 0, duration: 380, useNativeDriver: true }),
        Animated.timing(corridorOp, { toValue: 0, duration: 480, useNativeDriver: true }),
      ]),
    ]).start(() => setStage("reveal"));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Stage: reveal ────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "reveal") return;
    Animated.parallel([
      Animated.timing(portraitOp, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(nameOp,     { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(nameY,      { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    timerRef.current = setTimeout(() => setStage("briefing"), 2400);
    return clearTimer;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  // ── Stage: briefing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "briefing") return;
    clearTimer();
    captionRef.current = 0;
    setCaptionIdx(0);
    // Zoom to bust
    Animated.spring(zoomAnim, { toValue: 1, friction: 6, tension: 30, useNativeDriver: true }).start();
    // Fade in first caption
    Animated.timing(captionOp, { toValue: 1, duration: 550, useNativeDriver: true }).start();
    scheduleAuto();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  function scheduleAuto() {
    clearTimer();
    timerRef.current = setTimeout(advanceCaption, CAPTION_AUTO_MS);
  }

  function advanceCaption() {
    const next = captionRef.current + 1;
    if (next >= guardian.originStory.length) {
      Animated.timing(captionOp, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        setStage("cta"),
      );
    } else {
      Animated.timing(captionOp, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
        captionRef.current = next;
        setCaptionIdx(next);
        Animated.timing(captionOp, { toValue: 1, duration: 420, useNativeDriver: true }).start();
        scheduleAuto();
      });
    }
  }

  // ── Stage: cta ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (stage !== "cta") return;
    clearTimer();
    Animated.timing(ctaOp, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage]);

  useEffect(() => () => clearTimer(), []);

  function dismiss() {
    clearTimer();
    Animated.timing(globalOp, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onDone());
  }

  const portraitAreaH = screenH * 0.54;
  const bottomPad     = Math.max(insets.bottom, 20) + 16;

  return (
    <Modal transparent visible animationType="none" statusBarTranslucent onRequestClose={dismiss}>
      <Animated.View style={[styles.root, { opacity: globalOp }]}>

        {/* Deep space background */}
        <LinearGradient
          colors={["#030612", "#060c1e", "#030612"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* ── CORRIDOR STAGE ──────────────────────────────────────────── */}
        {stage === "corridor" && (
          <Animated.View
            style={[styles.corridorWrap, { opacity: corridorOp, paddingTop: insets.top + 40 }]}
          >
            <Animated.Text style={[styles.cLine1, { opacity: line1Op, color: colors.mutedForeground }]}>
              SYSTEM {guardian.system} · {guardian.planet.toUpperCase()}
            </Animated.Text>

            <Animated.Text style={[styles.cLine2, { opacity: line2Op, color: ac }]}>
              {"GUARDIAN\nBRIEFING ROOM"}
            </Animated.Text>

            <Animated.Text style={[styles.cLine3, { opacity: line3Op, color: colors.mutedForeground }]}>
              CLEARANCE LEVEL {level} CONFIRMED
            </Animated.Text>
          </Animated.View>
        )}

        {/* ── PORTRAIT + INFO (reveal → briefing → cta) ───────────────── */}
        {stage !== "corridor" && (
          <>
            {/* Tappable portrait area — tap advances captions during briefing */}
            <Pressable
              style={[styles.portraitArea, { height: portraitAreaH }]}
              onPress={stage === "briefing" ? () => { clearTimer(); advanceCaption(); } : undefined}
            >
              {/* Full-body portrait — neutral/serious pose, fades out as zoom starts */}
              <Animated.View
                style={[styles.portraitLayer, { width: screenW, height: cfg.full.cellH, opacity: Animated.multiply(portraitOp, fullOp) }]}
              >
                <Image
                  source={cfg.fullSource}
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: cfg.full.sheetW, height: cfg.full.sheetH,
                    transform: [{ translateX: cfg.full.tx }, { translateY: cfg.full.ty }],
                  }}
                />
              </Animated.View>

              {/* Bust portrait — expressive/talking pose, fades in as zoom completes */}
              <Animated.View
                style={[styles.portraitLayer, { width: screenW, height: cfg.bust.clipH, overflow: "hidden", opacity: bustOp }]}
              >
                <Image
                  source={cfg.bustSource}
                  style={{
                    position: "absolute", top: 0, left: 0,
                    width: cfg.bust.sheetW, height: cfg.bust.sheetH,
                    transform: [{ translateX: cfg.bust.tx }, { translateY: cfg.bust.ty }],
                  }}
                />
              </Animated.View>

              {/* Cinematic bottom-fade over portrait */}
              <LinearGradient
                colors={["transparent", "#030612d0", "#030612"]}
                style={[styles.portraitFade, { height: portraitAreaH * 0.45 }]}
                pointerEvents="none"
              />
            </Pressable>

            {/* Guardian name — slides up on reveal, stays through briefing/cta */}
            <Animated.View
              style={[styles.nameBlock, { opacity: nameOp, transform: [{ translateY: nameY }] }]}
            >
              <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>YOUR GUARDIAN</Text>
              <Text style={[styles.gName, { color: ac }]}>{guardian.name}</Text>
              {guardian.nameAccent
                ? <Text style={[styles.gName, { color: ac }]}>{guardian.nameAccent}</Text>
                : null}
              <Text style={[styles.planet, { color: colors.mutedForeground }]}>{guardian.planet}</Text>
            </Animated.View>

            {/* ── BRIEFING captions ── */}
            {stage === "briefing" && (
              <Animated.View style={[styles.captionBlock, { opacity: captionOp, paddingBottom: bottomPad }]}>
                <Text style={[styles.captionTxt, { color: colors.foreground }]}>
                  {guardian.originStory[captionIdx]}
                </Text>
                <View style={styles.dots}>
                  {guardian.originStory.map((_, i) => (
                    <View
                      key={i}
                      style={[styles.dot, { backgroundColor: i === captionIdx ? ac : "#ffffff28" }]}
                    />
                  ))}
                </View>
                <Text style={styles.tapHint}>TAP TO CONTINUE</Text>
              </Animated.View>
            )}

            {/* ── CTA ── */}
            {stage === "cta" && (
              <Animated.View style={[styles.ctaBlock, { opacity: ctaOp }]}>
                <ScrollView
                  style={styles.ctaScroll}
                  contentContainerStyle={{ paddingBottom: bottomPad, gap: 14 }}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <View style={[styles.focusBox, { borderColor: `${ac}30`, backgroundColor: `${ac}0e` }]}>
                    <Text style={[styles.focusHeading, { color: colors.mutedForeground }]}>
                      TRAINING FOCUS
                    </Text>
                    {guardian.trainingFocus.map((item, i) => (
                      <View key={i} style={styles.focusRow}>
                        <View style={[styles.focusDot, { backgroundColor: ac }]} />
                        <Text style={[styles.focusItem, { color: colors.foreground }]}>{item}</Text>
                      </View>
                    ))}
                  </View>
                  <Pressable
                    onPress={dismiss}
                    style={({ pressed }) => [
                      styles.ctaBtn,
                      { backgroundColor: ac, opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <Text style={styles.ctaBtnTxt}>Begin Training</Text>
                  </Pressable>
                </ScrollView>
              </Animated.View>
            )}
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#030612",
  },

  // ── Corridor
  corridorWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 32,
  },
  cLine1: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
  },
  cLine2: {
    fontSize: 40,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    letterSpacing: 2,
    lineHeight: 48,
  },
  cLine3: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 2,
  },

  // ── Portrait
  portraitArea: {
    overflow: "hidden",
  },
  portraitLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  portraitFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Name block
  nameBlock: {
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 4,
    alignItems: "center",
    gap: 2,
  },
  eyebrow: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    marginBottom: 2,
  },
  gName: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 1,
    textAlign: "center",
  },
  planet: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },

  // ── Briefing captions
  captionBlock: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 14,
  },
  captionTxt: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 24,
    textAlign: "center",
    fontStyle: "italic",
  },
  dots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tapHint: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    color: "#ffffff38",
  },

  // ── CTA
  ctaBlock: {
    flex: 1,
  },
  ctaScroll: {
    flex: 1,
    paddingHorizontal: 24,
  },
  focusBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  focusHeading: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2.5,
    marginBottom: 2,
  },
  focusRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  focusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
    flexShrink: 0,
  },
  focusItem: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 20,
    flex: 1,
  },
  ctaBtn: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaBtnTxt: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    letterSpacing: 0.5,
  },
});
