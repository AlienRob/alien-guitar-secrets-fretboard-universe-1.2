/**
 * Boss battle screen — 10 mixed theory questions, pass threshold 7/10.
 * Phases: intro → battle → wormhole (win only) → result.
 */
import { AppIcon } from "@/components/app-icon";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOSS_BUSTS, BOSS_FULLS } from "@/assets/images/characters";
import { BossGuitarIntro } from "@/components/boss-guitar-intro";
import { OptionButton } from "@/components/option-button";
import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { useBosses } from "@/contexts/bosses";
import { useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import {
  BOSS_PASS_THRESHOLD,
  getBoss,
  makeBossQuestionsTagged,
  type TaggedBossQuestion,
} from "@/lib/bosses";
import { COINS_BOSS_WIN } from "@/lib/coins";

const COIN_SINGLE_IMG = require("@/assets/images/gear/coin-single.png");

// ---------------------------------------------------------------------------
// Category metadata — maps bossCategory to drill route + display label
// ---------------------------------------------------------------------------
const CATEGORY_DRILLS: Record<
  "intervals" | "notes" | "scales" | "chords",
  { label: string; route: string }
> = {
  intervals: { label: "Interval Drills", route: "/drill/intervals" },
  notes:     { label: "Fretboard Notes", route: "/drill/notes" },
  scales:    { label: "Scale Spelling",  route: "/drill/scales" },
  chords:    { label: "Chord Tones",     route: "/drill/chords" },
};

// ---------------------------------------------------------------------------
// Wormhole victory flash (plays for ~1.8 s then auto-dismisses)
// ---------------------------------------------------------------------------
function WormholeFlash({
  bossColor,
  onDone,
}: {
  bossColor: string;
  onDone: () => void;
}) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const textAnim = useRef(new Animated.Value(0)).current;
  const fadeOut = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]),
      );

    Animated.parallel([
      pulse(ring1, 0),
      pulse(ring2, 280),
      pulse(ring3, 560),
      Animated.timing(textAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();

    const t = setTimeout(() => {
      Animated.timing(fadeOut, { toValue: 0, duration: 350, useNativeDriver: true }).start(
        () => onDone(),
      );
    }, 1800);
    return () => clearTimeout(t);
  }, []);

  const ringStyle = (anim: Animated.Value, size: number) => ({
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    borderWidth: 2,
    borderColor: bossColor,
    opacity: anim,
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.6] }) }],
  });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          backgroundColor: "#050816",
          alignItems: "center",
          justifyContent: "center",
          opacity: fadeOut,
          zIndex: 999,
        },
      ]}
    >
      {/* Expanding rings */}
      <Animated.View style={ringStyle(ring1, 200)} />
      <Animated.View style={ringStyle(ring2, 300)} />
      <Animated.View style={ringStyle(ring3, 400)} />

      {/* Glow dot in centre */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: bossColor,
          opacity: 0.85,
          shadowColor: bossColor,
          shadowRadius: 30,
          shadowOpacity: 1,
        }}
      />

      <Animated.Text
        style={{
          position: "absolute",
          bottom: "25%",
          color: "#fff",
          fontSize: 18,
          fontFamily: "SpaceGrotesk_700Bold",
          letterSpacing: 3,
          opacity: textAnim,
          textTransform: "uppercase",
        }}
      >
        Wormhole Opened
      </Animated.Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Pre-battle intro screen
// ---------------------------------------------------------------------------
function BattleIntro({
  boss,
  onBegin,
  topPad,
}: {
  boss: NonNullable<ReturnType<typeof getBoss>>;
  onBegin: () => void;
  topPad: number;
}) {
  const colors = useColors();
  const { level, belt, xpIntoLevel, xpPerLevel } = useProgress();
  const { isBeaten } = useBosses();
  const alreadyBeaten = isBeaten(boss.id);
  const bustSrc =
    (BOSS_BUSTS as Record<string, number>)[boss.id] ??
    (BOSS_FULLS as Record<string, number>)[boss.id];

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <ScreenBg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[`${boss.accentColor}22`, "transparent"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 300 }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingTop: topPad,
          paddingHorizontal: 20,
          paddingBottom: 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
          <Text style={[styles.introKicker, { color: boss.accentColor }]}>
            BOSS BATTLE · {alreadyBeaten ? "REMATCH" : "TRIAL"}
          </Text>

          {bustSrc ? (
            <View style={styles.portraitWrap}>
              <Image source={bustSrc} style={styles.portrait} contentFit="contain" />
              <LinearGradient
                colors={["transparent", "#050816"]}
                style={styles.portraitFade}
                pointerEvents="none"
              />
            </View>
          ) : (
            <View
              style={[
                styles.portraitPlaceholder,
                { borderColor: `${boss.accentColor}44` },
              ]}
            >
              <AppIcon name="alert-circle" size={48} color={boss.accentColor} />
            </View>
          )}

          <Text style={[styles.introName, { color: boss.accentColor }]}>
            {boss.name}
            {boss.nameAccent ? ` ${boss.nameAccent}` : ""}
          </Text>
          <Text style={[styles.introPlanet, { color: colors.mutedForeground }]}>
            {boss.planet}
          </Text>

          {boss.quote ? (
            <View
              style={[
                styles.quoteBox,
                {
                  borderColor: `${boss.accentColor}33`,
                  backgroundColor: `${boss.accentColor}0a`,
                },
              ]}
            >
              <Text style={[styles.quoteText, { color: colors.foreground }]}>
                "{boss.quote}"
              </Text>
            </View>
          ) : null}

          {/* Player stats */}
          <View style={[styles.statsBox, { borderColor: colors.border }]}>
            <Text style={[styles.statsLabel, { color: colors.mutedForeground }]}>
              YOUR STATS
            </Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: colors.foreground }]}>{level}</Text>
                <Text style={[styles.statName, { color: colors.mutedForeground }]}>Level</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#00BFFF" }]}>{belt.name}</Text>
                <Text style={[styles.statName, { color: colors.mutedForeground }]}>Belt</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: "#f59e0b" }]}>+{COINS_BOSS_WIN}</Text>
                <Text style={[styles.statName, { color: colors.mutedForeground }]}>Coins</Text>
              </View>
            </View>
            <XpBar value={xpIntoLevel} max={xpPerLevel} />
          </View>

          {/* Battle rules */}
          <View style={styles.rulesRow}>
            <View style={[styles.ruleChip, { borderColor: colors.border }]}>
              <AppIcon name="info" size={13} color={colors.mutedForeground} />
              <Text style={[styles.ruleText, { color: colors.mutedForeground }]}>
                10 questions
              </Text>
            </View>
            <View style={[styles.ruleChip, { borderColor: colors.border }]}>
              <AppIcon name="target" size={13} color={colors.mutedForeground} />
              <Text style={[styles.ruleText, { color: colors.mutedForeground }]}>7/10 to win</Text>
            </View>
            <View style={[styles.ruleChip, { borderColor: `${boss.accentColor}55` }]}>
              <Image source={COIN_SINGLE_IMG} style={{ width: 14, height: 14 }} contentFit="contain" />
              <Text style={[styles.ruleText, { color: "#f59e0b" }]}>{COINS_BOSS_WIN} coins</Text>
            </View>
          </View>

          <Pressable
            onPress={onBegin}
            style={({ pressed }) => [
              styles.beginBtn,
              { backgroundColor: boss.accentColor, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <AppIcon name="zap" size={18} color="#050816" />
            <Text style={styles.beginBtnText}>
              {alreadyBeaten ? "Challenge Again" : "Begin the Trial"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </ScreenBg>
  );
}

// ---------------------------------------------------------------------------
// Result card (victory or defeat)
// ---------------------------------------------------------------------------
function BattleResult({
  boss,
  correct,
  total,
  won,
  xpEarned,
  coinsEarned,
  missedCategories,
  onRetry,
  onDone,
  topPad,
}: {
  boss: NonNullable<ReturnType<typeof getBoss>>;
  correct: number;
  total: number;
  won: boolean;
  xpEarned: number;
  coinsEarned: number;
  /** Categories the player missed at least one question in, ordered by miss count desc */
  missedCategories: Array<"intervals" | "notes" | "scales" | "chords">;
  onRetry: () => void;
  onDone: () => void;
  topPad: number;
}) {
  const colors = useColors();
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 7, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const bustSrc =
    (BOSS_BUSTS as Record<string, number>)[boss.id] ??
    (BOSS_FULLS as Record<string, number>)[boss.id];
  const scorePct = Math.round((correct / total) * 100);

  return (
    <ScreenBg>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={
            won
              ? ["rgba(0,255,213,0.10)", "transparent"]
              : ["rgba(239,68,68,0.10)", "transparent"]
          }
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: 260 }}
        />
      </View>

      <View style={{ flex: 1, paddingTop: topPad, paddingHorizontal: 20 }}>
        <Animated.View
          style={{ flex: 1, transform: [{ scale: scaleAnim }], opacity: opacityAnim }}
        >
          <ScrollView
            contentContainerStyle={{ alignItems: "center", paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Boss portrait */}
            {bustSrc ? (
              <View style={styles.resultPortraitWrap}>
                <Image
                  source={bustSrc}
                  style={[styles.resultPortrait, won ? styles.resultPortraitDefeated : {}]}
                  contentFit="contain"
                />
                {won && (
                  <View style={styles.defeatedStamp}>
                    <Text style={styles.defeatedText}>DEFEATED</Text>
                  </View>
                )}
              </View>
            ) : (
              <View
                style={[
                  styles.resultIcon,
                  {
                    backgroundColor: won
                      ? `${boss.accentColor}25`
                      : "rgba(255,80,80,0.15)",
                    borderColor: won ? boss.accentColor : "#ef4444",
                  },
                ]}
              >
                <AppIcon
                  name={won ? "award" : "x-circle"}
                  size={44}
                  color={won ? boss.accentColor : "#ef4444"}
                />
              </View>
            )}

            <Text
              style={[
                styles.resultHeading,
                { color: won ? boss.accentColor : "#ef4444" },
              ]}
            >
              {won ? "BOSS BEATEN!" : "NOT THIS TIME"}
            </Text>
            <Text style={[styles.resultBossName, { color: colors.foreground }]}>
              {boss.name}
              {boss.nameAccent ? ` ${boss.nameAccent}` : ""}
            </Text>
            <Text style={[styles.resultScore, { color: colors.mutedForeground }]}>
              {correct} / {total} correct · {scorePct}%
            </Text>

            {won ? (
              <>
                <View style={styles.rewardRow}>
                  <View
                    style={[
                      styles.xpBadge,
                      {
                        backgroundColor: `${boss.accentColor}20`,
                        borderColor: boss.accentColor,
                      },
                    ]}
                  >
                    <AppIcon name="zap" size={14} color={boss.accentColor} />
                    <Text style={[styles.xpText, { color: boss.accentColor }]}>
                      +{xpEarned} XP
                    </Text>
                  </View>
                </View>

                {/* Prominent coin bonus */}
                <View style={styles.coinBonusBox}>
                  <Image source={COIN_SINGLE_IMG} style={{ width: 32, height: 32 }} contentFit="contain" />
                  <View>
                    <Text style={styles.coinBonusLabel}>Alien Coins Earned</Text>
                    <Text style={styles.coinBonusAmount}>+{coinsEarned}</Text>
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={[styles.retryHint, { color: colors.mutedForeground }]}>
                  You need {BOSS_PASS_THRESHOLD}/{total} to win. Keep practising!
                </Text>

                {/* Targeted per-category feedback with drill links */}
                {missedCategories.length > 0 && (
                  <View
                    style={[
                      styles.feedbackBox,
                      {
                        borderColor: `${boss.accentColor}33`,
                        backgroundColor: `${boss.accentColor}0a`,
                      },
                    ]}
                  >
                    <Text style={[styles.feedbackTitle, { color: boss.accentColor }]}>
                      Areas to focus on
                    </Text>
                    {missedCategories.map((cat) => {
                      const meta = CATEGORY_DRILLS[cat];
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => router.push(meta.route as never)}
                          style={({ pressed }) => [
                            styles.feedbackLink,
                            {
                              borderColor: `${boss.accentColor}25`,
                              backgroundColor: pressed
                                ? `${boss.accentColor}18`
                                : `${boss.accentColor}0d`,
                            },
                          ]}
                        >
                          <AppIcon name="zap" size={14} color={boss.accentColor} />
                          <Text style={[styles.feedbackLinkText, { color: colors.foreground }]}>
                            {meta.label}
                          </Text>
                          <AppIcon name="chevron-right" size={14} color={colors.mutedForeground} />
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </Animated.View>

        {/* Action buttons */}
        <View style={styles.resultBtns}>
          <Pressable
            onPress={onRetry}
            style={({ pressed }) => [
              styles.retryBtn,
              { borderColor: boss.accentColor, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <AppIcon name="refresh-cw" size={16} color={boss.accentColor} />
            <Text style={[styles.retryBtnText, { color: boss.accentColor }]}>Try Again</Text>
          </Pressable>
          <Pressable
            onPress={onDone}
            style={({ pressed }) => [
              styles.doneBtn,
              { backgroundColor: boss.accentColor, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.doneBtnText}>Back to Galaxy</Text>
          </Pressable>
        </View>
      </View>
    </ScreenBg>
  );
}

// ---------------------------------------------------------------------------
// Main battle runner
// ---------------------------------------------------------------------------
export default function BossBattleScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { recordDrill, addCoins } = useProgress();
  const { beatBoss } = useBosses();

  const boss = getBoss(id ?? "");

  type Phase = "solo" | "intro" | "battle" | "wormhole" | "result";
  const [phase, setPhase] = useState<Phase>("solo");
  const [questions] = useState<TaggedBossQuestion[]>(() => makeBossQuestionsTagged());
  const [index, setIndex] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [coinsEarned, setCoinsEarned] = useState(0);
  // Track how many times each category was missed.
  const missedByCategoryRef = useRef<Record<string, number>>({});

  const lockRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const correctRef = useRef(0);
  const wonRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const current = questions[index];

  // Sorted list of categories the player missed (most-missed first).
  const missedCategories = Object.entries(missedByCategoryRef.current)
    .sort(([, a], [, b]) => b - a)
    .map(([cat]) => cat) as Array<"intervals" | "notes" | "scales" | "chords">;

  const finish = async (finalCorrect: number) => {
    const didWin = finalCorrect >= BOSS_PASS_THRESHOLD;
    wonRef.current = didWin;
    const outcome = await recordDrill("boss", finalCorrect, questions.length);
    if (didWin && boss) {
      await beatBoss(boss.id);
      await addCoins(COINS_BOSS_WIN);
    }
    if (mountedRef.current) {
      setXpEarned(outcome.xpEarned);
      setCoinsEarned(didWin ? COINS_BOSS_WIN : 0);
      // Win: briefly show wormhole flash before result. Fail: go straight to result.
      setPhase(didWin ? "wormhole" : "result");
    }
  };

  const handleAnswer = (option: string) => {
    if (lockRef.current || !current) return;
    lockRef.current = true;
    setPicked(option);

    const isRight = option === current.answer;
    const nextCorrect = isRight ? correctRef.current + 1 : correctRef.current;
    if (isRight) {
      correctRef.current = nextCorrect;
      setCorrect(nextCorrect);
    } else {
      // Track the missed category for fail-screen targeting.
      const cat = current.bossCategory;
      missedByCategoryRef.current[cat] = (missedByCategoryRef.current[cat] ?? 0) + 1;
    }
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(
        isRight
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Error,
      );
    }

    timerRef.current = setTimeout(() => {
      if (!mountedRef.current) return;
      lockRef.current = false;
      setPicked(null);
      if (index === questions.length - 1) {
        void finish(nextCorrect);
      } else {
        setIndex((i) => i + 1);
      }
    }, 750);
  };

  const restart = () => {
    router.replace(`/boss/${id}` as never);
  };

  const handleDone = () => {
    router.navigate("/galaxy" as never);
  };

  if (!boss) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.foreground }}>Boss not found.</Text>
        </View>
      </ScreenBg>
    );
  }

  // ── Guitar solo cinematic ─────────────────────────────────────────────────
  if (phase === "solo") {
    return (
      <BossGuitarIntro
        boss={boss}
        onDone={() => setPhase("intro")}
      />
    );
  }

  // ── Intro ──────────────────────────────────────────────────────────────────
  if (phase === "intro") {
    return (
      <BattleIntro
        boss={boss}
        onBegin={() => setPhase("battle")}
        topPad={topPad}
      />
    );
  }

  // ── Wormhole flash (win only) ──────────────────────────────────────────────
  if (phase === "wormhole") {
    return (
      <ScreenBg>
        <WormholeFlash
          bossColor={boss.accentColor}
          onDone={() => setPhase("result")}
        />
      </ScreenBg>
    );
  }

  // ── Result ─────────────────────────────────────────────────────────────────
  if (phase === "result") {
    return (
      <BattleResult
        boss={boss}
        correct={correctRef.current}
        total={questions.length}
        won={wonRef.current}
        xpEarned={xpEarned}
        coinsEarned={coinsEarned}
        missedCategories={missedCategories}
        onRetry={restart}
        onDone={handleDone}
        topPad={topPad}
      />
    );
  }

  // ── Question ───────────────────────────────────────────────────────────────
  const progress = (index / questions.length) * 100;
  const bossHp = Math.max(0, Math.round(100 - (correctRef.current / questions.length) * 100));
  const hpColor = bossHp > 50 ? "#ef4444" : bossHp > 25 ? "#f59e0b" : "#22c55e";

  return (
    <ScreenBg>
      <View style={{ flex: 1, paddingTop: topPad, paddingHorizontal: 20 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.bossLabel, { color: boss.accentColor }]}>
              {boss.name.toUpperCase()}
            </Text>
            <Text style={[styles.questionCount, { color: colors.mutedForeground }]}>
              Question {index + 1} of {questions.length}
            </Text>
          </View>
          <View
            style={[
              styles.skullBadge,
              {
                backgroundColor: `${boss.accentColor}20`,
                borderColor: boss.accentColor,
              },
            ]}
          >
            <Text style={styles.skullEmoji}>💀</Text>
          </View>
        </View>

        {/* Player progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.border, marginBottom: 8 }]}>
          <View
            style={[styles.progressFill, { width: `${progress}%` as `${number}%`, backgroundColor: colors.accent }]}
          />
        </View>

        {/* Boss HP bar */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 4 }}>
            <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: colors.mutedForeground, letterSpacing: 1 }}>
              BOSS HP
            </Text>
            <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: hpColor }}>
              {bossHp}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${bossHp}%` as `${number}%`, backgroundColor: hpColor },
              ]}
            />
          </View>
        </View>

        {/* Question */}
        <View style={{ flex: 1, justifyContent: "center" }}>
          <Text style={[styles.questionText, { color: colors.foreground }]}>
            {current?.prompt}
          </Text>

          <View style={styles.optionsGrid}>
            {current?.options.map((opt) => (
              <OptionButton
                key={opt}
                label={opt}
                state={
                  picked === null
                    ? "idle"
                    : picked === opt
                    ? opt === current.answer
                      ? "correct"
                      : "wrong"
                    : opt === current.answer && picked !== null
                    ? "correct"
                    : "idle"
                }
                disabled={picked !== null}
                onPress={() => handleAnswer(opt)}
              />
            ))}
          </View>
        </View>
      </View>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  // ── Intro ──
  introKicker: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 16,
  },
  portraitWrap: { alignItems: "center", marginBottom: 8, height: 200 },
  portrait: { width: 160, height: 200 },
  portraitFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 60 },
  portraitPlaceholder: {
    alignSelf: "center",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  introName: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    marginBottom: 4,
  },
  introPlanet: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 16,
  },
  quoteBox: { borderWidth: 1, borderRadius: 12, padding: 16, marginBottom: 16 },
  quoteText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 21,
  },
  statsBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  statsLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 12 },
  statsRow: { flexDirection: "row", marginBottom: 14 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold" },
  statName: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  rulesRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  ruleChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  ruleText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  coinEmoji: { fontSize: 12 },
  beginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 8,
  },
  beginBtnText: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: "#050816" },

  // ── Battle ──
  header: { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 12 },
  bossLabel: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  questionCount: { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  skullBadge: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  skullEmoji: { fontSize: 20 },
  progressTrack: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  questionText: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 30,
    marginBottom: 28,
    textAlign: "center",
  },
  optionsGrid: { gap: 12 },

  // ── Result ──
  resultPortraitWrap: { alignItems: "center", marginBottom: 12, position: "relative" },
  resultPortrait: { width: 120, height: 140 },
  resultPortraitDefeated: { opacity: 0.45 },
  defeatedStamp: {
    position: "absolute",
    bottom: 10,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  defeatedText: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#ef4444",
    letterSpacing: 4,
    opacity: 0.9,
  },
  resultIcon: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  resultHeading: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 1,
    marginBottom: 6,
    textAlign: "center",
  },
  resultBossName: {
    fontSize: 18,
    fontFamily: "SpaceGrotesk_600SemiBold",
    marginBottom: 4,
    textAlign: "center",
  },
  resultScore: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginBottom: 16,
    textAlign: "center",
  },
  rewardRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
    justifyContent: "center",
    marginBottom: 12,
  },
  xpBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  xpText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  coinBonusBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "rgba(245,158,11,0.45)",
    backgroundColor: "rgba(245,158,11,0.10)",
    marginBottom: 16,
    minWidth: 220,
    justifyContent: "center",
  },
  coinBonusEmoji: { fontSize: 32 },
  coinBonusLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(245,158,11,0.7)",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  coinBonusAmount: { fontSize: 36, fontFamily: "SpaceGrotesk_700Bold", color: "#f59e0b" },
  retryHint: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
    lineHeight: 19,
  },
  feedbackBox: { borderWidth: 1, borderRadius: 14, padding: 16, width: "100%", marginBottom: 8 },
  feedbackTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 10,
  },
  feedbackLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  feedbackLinkText: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  resultBtns: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  retryBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  doneBtn: { alignItems: "center", paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#050816" },
});
