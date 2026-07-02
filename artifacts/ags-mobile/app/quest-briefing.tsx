import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GearBagModal } from "@/components/gear-bag-modal";
import { ScreenBg } from "@/components/screen-bg";
import { StreakFlameBadge } from "@/components/streak-flame-badge";
import { useGear } from "@/contexts/gear";
import { useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { BAG_TIERS, COINS_DUPLICATE_REFUND } from "@/lib/coins";
import { DRILLS } from "@/lib/drills";
import { type GearItem, rollBagForTier } from "@/lib/gear";

const DAILY_GOAL = 3;
const DAILY_BAG_TIER = BAG_TIERS.find((t) => t.id === "standard")!;

export default function QuestBriefingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { streak, dailyChallengesCount, dailyQuestDone, accuracy, streakFreezes, xpMultiplier } = useProgress();
  const { ownedIds, addItems } = useGear();

  const [bagItems, setBagItems] = useState<GearItem[]>([]);
  const [showBag, setShowBag] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 32;
  const questProgress = Math.min(dailyChallengesCount, DAILY_GOAL);
  const remaining = DAILY_GOAL - questProgress;

  const streakAtRisk = streak > 0;

  function handleStart() {
    if (dailyQuestDone) {
      const items = rollBagForTier(DAILY_BAG_TIER, ownedIds);
      setBagItems(items);
      setShowBag(true);
    } else {
      router.push(`/drill/${DRILLS[0].type}`);
    }
  }

  function handleClaim(newItems: GearItem[], coinsRefunded: number) {
    addItems(newItems);
    setShowBag(false);
    router.push("/(tabs)/gear");
  }

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>‹ Back</Text>
        </Pressable>

        {/* Header */}
        <Text style={[styles.kicker, { color: "#f59e0b" }]}>
          {dailyQuestDone ? "QUEST COMPLETE" : "TODAY'S QUEST"}
        </Text>
        <Text style={[styles.title, { color: colors.foreground }]}>
          {dailyQuestDone ? "Well done." : "Daily Briefing"}
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          {dailyQuestDone
            ? "You completed today's quest. Come back tomorrow to keep your streak alive."
            : "Three challenges stand between you and today's reward. Here's what's at stake."}
        </Text>

        {/* Streak — flame milestones */}
        <View style={[styles.stakeCard, { borderColor: streakAtRisk ? "#f59e0b44" : "#ffffff18" }]}>
          <LinearGradient
            colors={streakAtRisk ? ["rgba(245,158,11,0.12)", "rgba(245,158,11,0.03)"] : ["rgba(255,255,255,0.04)", "rgba(255,255,255,0.01)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <StreakFlameBadge streak={streak} variant="strip" />

          {/* Multiplier + freeze row */}
          <View style={styles.streakPerksRow}>
            {xpMultiplier > 1 && (
              <View style={styles.perkChip}>
                <Text style={[styles.perkChipText, { color: "#fbbf24" }]}>⚡ {xpMultiplier}× XP</Text>
              </View>
            )}
            {streakFreezes > 0 && (
              <View style={[styles.perkChip, { borderColor: "#38bdf855", backgroundColor: "rgba(56,189,248,0.10)" }]}>
                <Text style={[styles.perkChipText, { color: "#38bdf8" }]}>🧊 {streakFreezes} freeze{streakFreezes > 1 ? "s" : ""}</Text>
              </View>
            )}
          </View>

          {streakAtRisk && streakFreezes > 0 && (
            <Text style={[styles.stakeSub, { color: "#38bdf8", marginTop: 4, textAlign: "center" }]}>
              🧊 One freeze will protect your streak if you miss tomorrow.
            </Text>
          )}
          {streakAtRisk && streakFreezes === 0 && (
            <Text style={[styles.stakeSub, { color: "#f59e0b", marginTop: 4, textAlign: "center" }]}>
              ⚠ Skip today and your streak resets.
            </Text>
          )}
        </View>

        {/* Progress */}
        <View style={[styles.progressCard, { borderColor: "#ffffff18" }]}>
          <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>PROGRESS TODAY</Text>
          <View style={styles.dotRow}>
            {Array.from({ length: DAILY_GOAL }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i < questProgress ? "#22c55e" : "#ffffff18",
                    borderColor: i < questProgress ? "#22c55e" : "#ffffff30",
                  },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.progressSub, { color: colors.mutedForeground }]}>
            {dailyQuestDone
              ? "All 3 challenges completed"
              : questProgress === 0
              ? "No challenges done yet today"
              : `${questProgress} of ${DAILY_GOAL} done — ${remaining} to go`}
          </Text>
        </View>

        {/* Reward */}
        <View style={[styles.rewardCard, { borderColor: "#f5c84244" }]}>
          <LinearGradient
            colors={["rgba(245,200,66,0.14)", "rgba(245,200,66,0.04)"]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.stakeRow}>
            <Text style={styles.stakeEmoji}>🎁</Text>
            <View style={styles.stakeText}>
              <Text style={[styles.stakeTitle, { color: "#f5c842" }]}>Today's Reward</Text>
              <Text style={[styles.stakeSub, { color: colors.mutedForeground }]}>
                Mystery Gear Bag — could contain a Common, Rare, or even a Legendary piece for your rig.
              </Text>
            </View>
          </View>
        </View>

        {/* Accuracy note */}
        {accuracy > 0 && (
          <View style={[styles.accuracyCard, { borderColor: "#22c55e33" }]}>
            <LinearGradient
              colors={["rgba(34,197,94,0.10)", "rgba(34,197,94,0.03)"]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={[styles.accuracyLabel, { color: "#22c55e" }]}>YOUR ACCURACY</Text>
            <Text style={[styles.accuracyValue, { color: colors.foreground }]}>{accuracy}%</Text>
            <Text style={[styles.accuracySub, { color: colors.mutedForeground }]}>
              Higher accuracy earns more Alien Coins per challenge.
            </Text>
          </View>
        )}

        {/* What counts as a challenge */}
        <View style={[styles.infoCard, { borderColor: "#ffffff12" }]}>
          <Text style={[styles.infoTitle, { color: colors.foreground }]}>What counts as a challenge?</Text>
          <Text style={[styles.infoBody, { color: colors.mutedForeground }]}>
            Any completed drill — intervals, notes, scales, or chords. Each one gives XP, Alien Coins, and counts toward your quest. Do at least 3 to claim today's gear bag.
          </Text>
        </View>

        {/* CTA */}
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={dailyQuestDone ? ["#16a34a", "#15803d"] : ["#b45309", "#92400e"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ctaGrad}
          >
            <Text style={styles.ctaBtnText}>
              {dailyQuestDone ? "🎁  Open Your Reward" : questProgress > 0 ? "▶  Continue Quest" : "▶  Start Quest"}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Soft link to practice */}
        <Pressable onPress={() => router.push("/(tabs)/practice")} style={styles.practiceLink}>
          <Text style={[styles.practiceLinkText, { color: colors.mutedForeground }]}>
            Looking for structured practice?{" "}
            <Text style={{ color: "#00ffd5" }}>Go to Training Deck →</Text>
          </Text>
        </Pressable>

      </ScrollView>

      <GearBagModal
        visible={showBag}
        result={bagItems.length > 0 ? { xpBonus: 0, items: bagItems } : null}
        xpEarned={0}
        ownedIds={ownedIds}
        coinRefundPerDup={COINS_DUPLICATE_REFUND}
        onClaim={handleClaim}
        forceBagColor={DAILY_BAG_TIER.bagColor}
      />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  backRow: { marginBottom: 12 },
  backText: { fontSize: 16, fontFamily: "Inter_400Regular" },

  kicker: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 4 },
  title: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21, marginBottom: 20 },

  stakeCard: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    marginBottom: 12, overflow: "hidden",
  },
  stakeRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  stakeEmoji: { fontSize: 26, lineHeight: 32 },
  stakeText: { flex: 1, gap: 4 },
  stakeTitle: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  stakeSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  streakPerksRow: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  perkChip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 20, borderWidth: 1,
    borderColor: "rgba(251,191,36,0.4)", backgroundColor: "rgba(251,191,36,0.12)",
  },
  perkChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },

  progressCard: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    marginBottom: 12, gap: 10, alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  progressLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2, alignSelf: "flex-start" },
  dotRow: { flexDirection: "row", gap: 14 },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2 },
  progressSub: { fontSize: 12, fontFamily: "Inter_400Regular" },

  rewardCard: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    marginBottom: 12, overflow: "hidden",
  },

  accuracyCard: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    marginBottom: 12, overflow: "hidden", alignItems: "center", gap: 4,
  },
  accuracyLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  accuracyValue: { fontSize: 36, fontFamily: "SpaceGrotesk_700Bold" },
  accuracySub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },

  infoCard: {
    borderWidth: 1, borderRadius: 14, padding: 16,
    marginBottom: 24, backgroundColor: "rgba(255,255,255,0.03)", gap: 6,
  },
  infoTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  infoBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },

  ctaBtn: { borderRadius: 14, overflow: "hidden", marginBottom: 16 },
  ctaGrad: { paddingVertical: 16, alignItems: "center" },
  ctaBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: 0.5 },

  practiceLink: { alignItems: "center", paddingVertical: 8 },
  practiceLinkText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
});
