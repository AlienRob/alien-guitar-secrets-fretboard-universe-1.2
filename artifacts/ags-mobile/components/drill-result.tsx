import { AppIcon } from "@/components/app-icon";
import { GearBagModal } from "@/components/gear-bag-modal";
import { useGear } from "@/contexts/gear";
import { type DrillOutcome, DAILY_TRAIL_TYPES, useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { type DrillType, type Recap } from "@/lib/drills";
import { coinsForDrill } from "@/lib/coins";
import { rollGameBag, rollTrailCompleteBag, type GearBagResult, type GearItem } from "@/lib/gear";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

const COIN_SINGLE_IMG = require("@/assets/images/gear/coin-single.png");

import { DegreeStrip } from "@/components/degree-strip";
import { GuardianBriefing } from "@/components/guardian-briefing";
import { LevelUpCelebration } from "@/components/level-up-celebration";
import { ScreenBg } from "@/components/screen-bg";
import { playDrillCompleteTrill } from "@/lib/audio";

export function DrillResult({
  meta,
  correct,
  total,
  outcome,
  recaps,
  onReplay,
  onDone,
  topPad,
  drillType,
  durationMinutes = 0,
  replayLabel = "Train again",
}: {
  meta: string;
  correct: number;
  total: number;
  outcome: DrillOutcome;
  recaps: Recap[];
  onReplay: () => void;
  onDone: () => void;
  topPad: number;
  drillType?: DrillType;
  durationMinutes?: number;
  replayLabel?: string;
}) {
  const colors = useColors();
  const { recordDrillForGuardian, ownedIds, addItems } = useGear();
  const { addCoins } = useProgress();

  // ── Bag rewards ──────────────────────────────────────────────────────────
  const [gameBag, setGameBag] = useState<GearBagResult | null>(null);
  const [showGameBag, setShowGameBag] = useState(false);
  const [trailBag, setTrailBag] = useState<GearBagResult | null>(null);
  const [showTrailBag, setShowTrailBag] = useState(false);
  const bagRolledRef = useRef(false);

  const pct = Math.round((correct / total) * 100);
  const great = pct >= 80;

  const hasCelebration = outcome.leveledUp || outcome.beltChanged;
  const [celebrate, setCelebrate] = useState(() => hasCelebration);
  const [showBriefing, setShowBriefing] = useState(false);

  // Coin award
  const coinsEarned = drillType ? coinsForDrill(correct, total) : 0;
  const coinAwardedRef = useRef(false);

  // Coin pop animation
  const coinScale = useRef(new Animated.Value(0)).current;
  const coinOpacity = useRef(new Animated.Value(0)).current;

  const showCoinPop = useCallback(() => {
    coinScale.setValue(0.6);
    coinOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(coinScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 7 }),
      Animated.timing(coinOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [coinScale, coinOpacity]);

  useEffect(() => {
    if (coinAwardedRef.current || !drillType) return;
    coinAwardedRef.current = true;
    void addCoins(coinsEarned);
    const t = setTimeout(showCoinPop, hasCelebration ? 4200 : 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Play the drill-complete trill once on mount — but only for normal
  // completions; level-up celebrations have their own fanfare.
  const trillFiredRef = useRef(false);
  useEffect(() => {
    if (trillFiredRef.current || !drillType || hasCelebration) return;
    trillFiredRef.current = true;
    const t = setTimeout(() => playDrillCompleteTrill(), 120);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Roll bags once on mount (after celebration if any)
  useEffect(() => {
    if (bagRolledRef.current || !drillType) return;
    bagRolledRef.current = true;
    const delay = hasCelebration ? 4500 : 1000;
    const t = setTimeout(() => {
      const gb = rollGameBag(ownedIds);
      setGameBag(gb);
      setShowGameBag(true);
      if (outcome.trailJustCompleted) {
        const tb = rollTrailCompleteBag(ownedIds);
        setTrailBag(tb);
      }
    }, delay);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCelebrationDone = () => {
    setCelebrate(false);
    if (outcome.leveledUp) {
      setShowBriefing(true);
    }
  };

  const handleDone = async () => {
    if (drillType) {
      await recordDrillForGuardian(drillType, correct, total, durationMinutes);
    }
    onDone();
  };

  const handleGameBagClaim = useCallback(async (items: GearItem[], coinRefund: number) => {
    const gearItems = items.filter((i) => i.category !== "coin");
    if (gearItems.length > 0) await addItems(gearItems);
    const coinItems = items.filter((i) => i.category === "coin");
    const coinTotal = coinItems.reduce((s, i) => s + (i.coinAmount ?? 0), 0) + coinRefund;
    if (coinTotal > 0) await addCoins(coinTotal);
    setShowGameBag(false);
    if (trailBag) {
      setTimeout(() => setShowTrailBag(true), 400);
    }
  }, [addItems, addCoins, trailBag]);

  const handleTrailBagClaim = useCallback(async (items: GearItem[], coinRefund: number) => {
    const gearItems = items.filter((i) => i.category !== "coin");
    if (gearItems.length > 0) await addItems(gearItems);
    const coinItems = items.filter((i) => i.category === "coin");
    const coinTotal = coinItems.reduce((s, i) => s + (i.coinAmount ?? 0), 0) + coinRefund;
    if (coinTotal > 0) await addCoins(coinTotal);
    setShowTrailBag(false);
  }, [addItems, addCoins]);

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: topPad, paddingHorizontal: 24, paddingBottom: 40, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.resultIcon}>
          <AppIcon name={great ? "award" : "check-circle"} size={64} color={great ? colors.chordTone : colors.accent} />
        </View>
        <Text style={[styles.resultKicker, { color: colors.accent }]}>{meta.toUpperCase()} COMPLETE</Text>
        <Text style={[styles.resultScore, { color: colors.foreground }]}>
          {correct}/{total}
        </Text>
        <Text style={[styles.resultPct, { color: colors.mutedForeground }]}>{pct}% accuracy</Text>

        <View style={[styles.xpPill, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          <AppIcon name="zap" size={18} color={colors.chordTone} />
          <Text style={[styles.xpEarned, { color: colors.foreground }]}>+{outcome.xpEarned} XP</Text>
          {outcome.xpMultiplier > 1 && (
            <View style={styles.multBadge}>
              <Text style={styles.multText}>{outcome.xpMultiplier}×</Text>
            </View>
          )}
        </View>
        {outcome.xpMultiplier > 1 && (
          <Text style={[styles.multHint, { color: colors.mutedForeground }]}>
            {outcome.xpBase} base × {outcome.xpMultiplier} streak bonus
          </Text>
        )}
        {outcome.usedFreeze && (
          <Text style={[styles.multHint, { color: "#38bdf8" }]}>
            🧊 Streak freeze used — streak protected
          </Text>
        )}
        {outcome.freezesGranted > 0 && (
          <Text style={[styles.multHint, { color: "#4ade80" }]}>
            🛡 Milestone reward: +{outcome.freezesGranted} streak freeze{outcome.freezesGranted > 1 ? "s" : ""}
          </Text>
        )}

        {/* Coin award pop */}
        {drillType ? (
          <Animated.View style={[styles.coinPill, { opacity: coinOpacity, transform: [{ scale: coinScale }] }]}>
            <Image source={COIN_SINGLE_IMG} style={{ width: 22, height: 22 }} resizeMode="contain" />
            <Text style={[styles.coinText, { color: "#f59e0b" }]}>+{coinsEarned} Alien Coins</Text>
          </Animated.View>
        ) : null}

        {outcome.leveledUp ? (
          <Text style={[styles.levelUp, { color: colors.accent }]}>
            Level up! You reached Level {outcome.newLevel}
          </Text>
        ) : null}
        {outcome.beltChanged ? (
          <Text style={[styles.levelUp, { color: outcome.newBelt.color }]}>
            New rank: {outcome.newBelt.name} Belt
          </Text>
        ) : null}

        {/* Pending level-up gate */}
        {outcome.pendingLevelUp ? (
          <View style={[styles.shopNudge, { backgroundColor: "rgba(251,191,36,0.08)", borderColor: "rgba(251,191,36,0.35)" }]}>
            <Text style={styles.shopNudgeEmoji}>⏳</Text>
            <Text style={[styles.shopNudgeText, { color: "#fbbf24" }]}>
              Level up pending — complete today&apos;s practice trail to claim it.
            </Text>
          </View>
        ) : null}

        {/* Daily trail step indicator */}
        {outcome.trailStepNew ? (
          <View style={[styles.shopNudge, { backgroundColor: "rgba(0,255,213,0.07)", borderColor: "rgba(0,255,213,0.3)" }]}>
            <Text style={styles.shopNudgeEmoji}>{outcome.trailJustCompleted ? "🎉" : "✅"}</Text>
            <Text style={[styles.shopNudgeText, { color: colors.accent }]}>
              {outcome.trailJustCompleted
                ? "Daily trail complete! Your bag reward is loading…"
                : `Trail step ${outcome.trailStepCount} of ${DAILY_TRAIL_TYPES.length} done — keep going to earn today's bag`}
            </Text>
          </View>
        ) : null}

        {recaps.length > 0 ? (
          <View style={styles.recapBlock}>
            <Text style={[styles.recapHeading, { color: colors.foreground }]}>What you practiced</Text>
            {recaps.map((r) => (
              <View key={r.title} style={styles.recapItem}>
                <DegreeStrip title={r.title} items={r.degrees} />
              </View>
            ))}
          </View>
        ) : null}

        <Pressable
          onPress={onReplay}
          style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primary, borderRadius: colors.radius, opacity: pressed ? 0.85 : 1 }]}
        >
          <AppIcon name="rotate-ccw" size={18} color={colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>{replayLabel}</Text>
        </Pressable>
        <Pressable onPress={handleDone} style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.7 : 1 }]}>
          <Text style={[styles.secondaryBtnText, { color: colors.mutedForeground }]}>Back to deck</Text>
        </Pressable>
      </ScrollView>

      {celebrate ? (
        <LevelUpCelebration outcome={outcome} onDone={handleCelebrationDone} />
      ) : null}
      {showBriefing ? (
        <GuardianBriefing
          level={outcome.newLevel}
          onDone={() => setShowBriefing(false)}
        />
      ) : null}

      {/* Game bag drop (picks, straps, cables, coins — Common/Rare) */}
      <GearBagModal
        visible={showGameBag}
        result={gameBag}
        xpEarned={0}
        ownedIds={ownedIds}
        coinRefundPerDup={25}
        onClaim={handleGameBagClaim}
      />

      {/* Trail-complete bag drop (full pool — Rare/Epic/Legendary) */}
      <GearBagModal
        visible={showTrailBag}
        result={trailBag}
        xpEarned={outcome.trailJustCompleted ? 50 : 0}
        ownedIds={ownedIds}
        coinRefundPerDup={50}
        onClaim={handleTrailBagClaim}
      />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  resultIcon: { alignItems: "center", marginBottom: 20 },
  resultKicker: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 2, textAlign: "center" },
  resultScore: { fontSize: 64, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center", marginTop: 4 },
  resultPct: { fontSize: 16, fontFamily: "Inter_500Medium", textAlign: "center" },
  xpPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, alignSelf: "center", paddingHorizontal: 18, paddingVertical: 10, borderWidth: 1, marginTop: 22 },
  xpEarned: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  multBadge: { backgroundColor: "rgba(251,191,36,0.22)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(251,191,36,0.5)" },
  multText: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold", color: "#fbbf24" },
  multHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 4 },
  coinPill: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, alignSelf: "center", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 40, backgroundColor: "rgba(245,158,11,0.12)", borderWidth: 1, borderColor: "rgba(245,158,11,0.35)", marginTop: 8 },
  coinEmoji: { fontSize: 16 },
  coinText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  levelUp: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold", textAlign: "center", marginTop: 14 },
  shopNudge: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16 },
  shopNudgeEmoji: { fontSize: 18 },
  shopNudgeText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  recapBlock: { marginTop: 28, gap: 16 },
  recapHeading: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold", textAlign: "center" },
  recapItem: { alignItems: "center" },
  primaryBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, marginTop: 36 },
  primaryBtnText: { fontSize: 17, fontFamily: "SpaceGrotesk_600SemiBold" },
  secondaryBtn: { alignItems: "center", paddingVertical: 16 },
  secondaryBtnText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
