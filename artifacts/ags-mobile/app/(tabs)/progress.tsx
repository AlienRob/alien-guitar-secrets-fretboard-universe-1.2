import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppIcon, type AppIconName } from "@/components/app-icon";
import React, { useEffect, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { useGear } from "@/contexts/gear";
import { useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { DRILLS } from "@/lib/drills";
import { BELTS } from "@/lib/progression";
import { SKIP_INTRO_KEY } from "@/app/intro";
import {
  GUARDIAN_REQUIREMENTS,
  computeGuardianBelt,
  type GuardianBelt,
} from "@/lib/gear";

const BELT_META: Record<GuardianBelt, { label: string; icon: string; color: string }> = {
  none:   { label: "Not yet earned",    icon: "🔒", color: "#6b7280" },
  bronze: { label: "Bronze Guardian",   icon: "🥉", color: "#cd7f32" },
  silver: { label: "Silver Guardian",   icon: "🥈", color: "#aaa9ad" },
  gold:   { label: "Gold Guardian",     icon: "🥇", color: "#ffcf5a" },
};

const GUARDIAN_DRILL_LABELS: Record<string, string> = {
  notes: "Notes",
  intervals: "Intervals",
  scales: "Scales",
  chords: "Chords",
};

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(1, value / max);
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden", flex: 1 },
  fill:  { height: 6, borderRadius: 3 },
});

export default function ProgressScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { belt, level, stats } = useProgress();
  const { guardianProgress } = useGear();

  const [skipIntro, setSkipIntro] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(SKIP_INTRO_KEY).then((val) => setSkipIntro(val === "true"));
  }, []);
  const toggleIntro = async () => {
    const next = !skipIntro;
    setSkipIntro(next);
    if (next) {
      await AsyncStorage.setItem(SKIP_INTRO_KEY, "true");
    } else {
      await AsyncStorage.removeItem(SKIP_INTRO_KEY);
    }
  };

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 24;

  const guardianBelt = computeGuardianBelt(guardianProgress);
  const beltMeta = BELT_META[guardianBelt];
  const req = GUARDIAN_REQUIREMENTS;
  const gp = guardianProgress;

  const practiceMinutes = Math.round(gp.practiceMinutes);
  const isGold = guardianBelt === "gold";

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: colors.accent }]}>YOUR JOURNEY</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Progress</Text>

        {/* ── Belt ladder ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Belt ladder</Text>
        <View style={[styles.panel, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
          {BELTS.map((b, i) => {
            const reached = level >= b.minLevel;
            const current = b.key === belt.key;
            return (
              <View key={b.key} style={[styles.beltRow, i < BELTS.length - 1 && styles.beltDivider, { borderColor: colors.border }]}>
                <View style={[styles.beltDot, { backgroundColor: reached ? b.color : "transparent", borderColor: b.color }]} />
                <Text style={[styles.beltName, { color: reached ? colors.foreground : colors.mutedForeground, fontFamily: current ? "SpaceGrotesk_700Bold" : "SpaceGrotesk_500Medium" }]}>
                  {b.name}
                </Text>
                {current ? (
                  <View style={[styles.badge, { backgroundColor: "rgba(0,255,213,0.16)" }]}>
                    <Text style={[styles.badgeText, { color: colors.accent }]}>YOU</Text>
                  </View>
                ) : (
                  <Text style={[styles.beltLvl, { color: colors.mutedForeground }]}>Lv {b.minLevel}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* ── Guardian Trial ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Guardian Trial</Text>
        <View style={[styles.guardianPanel, { backgroundColor: colors.card, borderColor: isGold ? "#ffcf5a" : colors.border, borderRadius: colors.radius }]}>

          {/* Current belt status */}
          <View style={styles.guardianBeltRow}>
            <Text style={styles.beltIcon}>{beltMeta.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.guardianBeltLabel, { color: beltMeta.color }]}>{beltMeta.label}</Text>
              <Text style={[styles.guardianBeltHint, { color: colors.mutedForeground }]}>
                {isGold ? "You have earned the right to face the Guardian." : "Earn Gold to open the Wormhole."}
              </Text>
            </View>
          </View>

          {/* Requirements */}
          <View style={styles.requirementsBlock}>

            {/* Practice time */}
            <View style={styles.reqRow}>
              <Text style={[styles.reqLabel, { color: colors.mutedForeground }]}>Practice time</Text>
              <View style={styles.reqRight}>
                <ProgressBar value={practiceMinutes} max={req.practiceMinutes} color="#00ffd5" />
                <Text style={[styles.reqValue, { color: colors.foreground }]}>
                  {practiceMinutes}/{req.practiceMinutes} min
                </Text>
              </View>
            </View>

            {/* Per-drill drill count */}
            {req.drillTypes.map((type) => {
              const count = gp.drillCounts[type] ?? 0;
              const acc = gp.accuracies[type] ?? 0;
              const label = GUARDIAN_DRILL_LABELS[type] ?? type;
              return (
                <View key={type}>
                  <View style={styles.reqRow}>
                    <Text style={[styles.reqLabel, { color: colors.mutedForeground }]}>{label} drills</Text>
                    <View style={styles.reqRight}>
                      <ProgressBar value={count} max={req.drillCount} color="#6a00ff" />
                      <Text style={[styles.reqValue, { color: colors.foreground }]}>{count}/{req.drillCount}</Text>
                    </View>
                  </View>
                  <View style={[styles.reqRow, { marginTop: 2 }]}>
                    <Text style={[styles.reqLabel, { color: colors.mutedForeground }]}>{label} accuracy</Text>
                    <View style={styles.reqRight}>
                      <ProgressBar value={acc} max={req.accuracy} color="#ff9f1c" />
                      <Text style={[styles.reqValue, { color: acc >= req.accuracy ? "#2ecc71" : colors.foreground }]}>
                        {acc}%{acc >= req.accuracy ? " ✓" : ""}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Gold: Wormhole message */}
          {isGold && (
            <View style={[styles.wormhole, { borderColor: "#ffcf5a" }]}>
              <Text style={styles.wormholeEmoji}>🌌</Text>
              <Text style={styles.wormholeTitle}>The Wormhole Opens</Text>
              <Text style={[styles.wormholeQuote, { color: colors.mutedForeground }]}>
                "Alien Guitarist... your training with Ingvar is complete. The Guardian now awaits your final trial."
              </Text>
              <Text style={[styles.wormholeAttrib, { color: "#00ffd5" }]}>— Zashtar</Text>
            </View>
          )}
        </View>

        {/* ── By exercise ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>By exercise</Text>
        {DRILLS.map((d) => {
          const s = stats[d.type];
          const acc = s && s.totalQuestions > 0 ? Math.round((s.totalCorrect / s.totalQuestions) * 100) : 0;
          return (
            <View key={d.type} style={[styles.statRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}>
              <AppIcon name={d.icon as AppIconName} size={18} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.statTitle, { color: colors.foreground }]}>{d.title}</Text>
                <Text style={[styles.statMeta, { color: colors.mutedForeground }]}>
                  {s ? `${s.attempts} sessions · best ${s.bestScore}/10` : "Not started"}
                </Text>
              </View>
              <Text style={[styles.statAcc, { color: s ? colors.accent : colors.mutedForeground }]}>{acc}%</Text>
            </View>
          );
        })}

        {/* ── Settings ── */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 16 }]}>Settings</Text>
        <Pressable
          onPress={toggleIntro}
          style={[styles.settingsRow, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
        >
          <View style={{ flex: 1 }}>
            <Text style={[styles.settingsTitle, { color: colors.foreground }]}>Intro video</Text>
            <Text style={[styles.settingsHint, { color: colors.mutedForeground }]}>
              {skipIntro ? "Off — won't play on launch" : "On — plays when you open the app"}
            </Text>
          </View>
          <View style={[styles.pill, { backgroundColor: skipIntro ? colors.border : "#00ffd5" }]}>
            <Text style={[styles.pillText, { color: skipIntro ? colors.mutedForeground : "#000" }]}>
              {skipIntro ? "OFF" : "ON"}
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  title: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4, marginBottom: 24 },
  sectionTitle: { fontSize: 19, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 14, marginTop: 8 },
  panel: { borderWidth: 1, paddingHorizontal: 16, marginBottom: 12 },

  beltRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 13 },
  beltDivider: { borderBottomWidth: StyleSheet.hairlineWidth },
  beltDot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2 },
  beltName: { flex: 1, fontSize: 16 },
  beltLvl: { fontSize: 13, fontFamily: "Inter_500Medium" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1 },

  guardianPanel: { borderWidth: 1, padding: 16, marginBottom: 12 },
  guardianBeltRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  beltIcon: { fontSize: 36 },
  guardianBeltLabel: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  guardianBeltHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  requirementsBlock: { gap: 10 },
  reqRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  reqLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 110 },
  reqRight: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  reqValue: { fontSize: 12, fontFamily: "Inter_600SemiBold", minWidth: 50, textAlign: "right" },

  wormhole: {
    marginTop: 20,
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    backgroundColor: "rgba(255,207,90,0.06)",
  },
  wormholeEmoji: { fontSize: 40, marginBottom: 8 },
  wormholeTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold", color: "#ffcf5a", marginBottom: 10 },
  wormholeQuote: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19, fontStyle: "italic" },
  wormholeAttrib: { fontSize: 12, fontFamily: "Inter_600SemiBold", marginTop: 8 },

  statRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1, marginBottom: 10 },
  statTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  statMeta: { fontSize: 12.5, fontFamily: "Inter_400Regular", marginTop: 2 },
  statAcc: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },

  settingsRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderWidth: 1, marginBottom: 10 },
  settingsTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  settingsHint: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 },
  pillText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});
