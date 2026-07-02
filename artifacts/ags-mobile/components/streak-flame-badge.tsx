import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { FLAME_TIERS, getCurrentFlame, getNextFlame } from "@/lib/streakFlame";

interface Props {
  streak: number;
  /** "chip" — compact inline badge for cards.
   *  "strip" — full milestone row for the briefing screen. */
  variant?: "chip" | "strip";
}

export function StreakFlameBadge({ streak, variant = "chip" }: Props) {
  const current = getCurrentFlame(streak);
  const next    = getNextFlame(streak);

  if (variant === "chip") {
    if (!current) {
      return (
        <View style={[styles.chip, { borderColor: "#ffffff22", backgroundColor: "#ffffff0a" }]}>
          <Text style={styles.chipEmoji}>🔥</Text>
          <Text style={[styles.chipLabel, { color: "#505070" }]}>NO STREAK</Text>
        </View>
      );
    }
    return (
      <View style={[styles.chip, { borderColor: `${current.color}55`, backgroundColor: current.bgColor }]}>
        <Text style={styles.chipEmoji}>🔥</Text>
        <Text style={[styles.chipLabel, { color: current.color }]}>{current.label}</Text>
      </View>
    );
  }

  // ── Strip variant ──────────────────────────────────────────────────────────
  return (
    <View style={styles.stripWrap}>
      {/* Current badge */}
      {current ? (
        <View style={[styles.bigBadge, { borderColor: `${current.color}66`, backgroundColor: current.bgColor }]}>
          <Text style={styles.bigEmoji}>🔥</Text>
          <View>
            <Text style={[styles.bigName, { color: current.color }]}>{current.label}</Text>
            <Text style={[styles.bigDays, { color: current.color }]}>{streak} day{streak !== 1 ? "s" : ""}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.bigBadge, { borderColor: "#ffffff18", backgroundColor: "#ffffff06" }]}>
          <Text style={styles.bigEmoji}>🔥</Text>
          <View>
            <Text style={[styles.bigName, { color: "#505070" }]}>NO FLAME YET</Text>
            <Text style={[styles.bigDays, { color: "#404060" }]}>Complete today's quest</Text>
          </View>
        </View>
      )}

      {/* Next milestone hint */}
      {next && (
        <Text style={styles.nextHint}>
          {next.days - streak === 1
            ? `One more day to reach `
            : `${next.days - streak} days to `}
          <Text style={{ color: next.color }}>{next.label}</Text>
        </Text>
      )}
      {!next && current && (
        <Text style={styles.nextHint}>
          <Text style={{ color: current.color }}>Maximum flame reached. You are a legend.</Text>
        </Text>
      )}

      {/* Milestone strip */}
      <View style={styles.milestoneRow}>
        {FLAME_TIERS.map((tier) => {
          const reached  = streak >= tier.days;
          const isCurrent = current?.days === tier.days;
          return (
            <View key={tier.days} style={styles.milestonePip}>
              <View style={[
                styles.pipDot,
                reached
                  ? { backgroundColor: tier.bgColor, borderColor: tier.color }
                  : { backgroundColor: "#ffffff08", borderColor: "#ffffff18" },
                isCurrent && { borderWidth: 2, shadowColor: tier.color, shadowOpacity: 0.8, shadowRadius: 6 },
              ]}>
                <Text style={[styles.pipEmoji, { opacity: reached ? 1 : 0.25 }]}>🔥</Text>
              </View>
              <Text style={[styles.pipDay, { color: reached ? tier.color : "#303050" }]}>
                {tier.days}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Chip
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1,
  },
  chipEmoji: { fontSize: 12 },
  chipLabel: { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },

  // Strip — big badge
  stripWrap: { gap: 10 },
  bigBadge: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 14, borderRadius: 14, borderWidth: 1,
  },
  bigEmoji: { fontSize: 32, lineHeight: 38 },
  bigName:  { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.5 },
  bigDays:  { fontSize: 12, fontFamily: "Inter_500Medium", marginTop: 2 },
  nextHint: {
    fontSize: 12, fontFamily: "Inter_400Regular",
    color: "#50507a", textAlign: "center",
  },

  // Milestone strip
  milestoneRow: { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 },
  milestonePip: { alignItems: "center", gap: 4 },
  pipDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center",
  },
  pipEmoji: { fontSize: 13 },
  pipDay:   { fontSize: 9, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
});
