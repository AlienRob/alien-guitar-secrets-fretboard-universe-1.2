import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type AppIconName, AppIcon } from "@/components/app-icon";
import { PracticeCard } from "@/components/practice-card";
import { ScreenBg } from "@/components/screen-bg";
import { useProgress, DAILY_TRAIL_TYPES } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";
import { DRILLS } from "@/lib/drills";

const TRAIL_LABELS: Record<string, string> = {
  intervals: "Interval Tap",
  notes:     "Finding Notes",
  chords:    "Chord Builder",
};

function DailyTrailWidget() {
  const colors = useColors();
  const { dailyTrailDrillsDone, dailyTrailComplete } = useProgress();

  return (
    <View style={[styles.trailCard, { borderColor: dailyTrailComplete ? colors.accent : colors.border, backgroundColor: dailyTrailComplete ? "rgba(0,255,213,0.06)" : colors.card, borderRadius: colors.radius }]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <Text style={[styles.trailLabel, { color: dailyTrailComplete ? colors.accent : colors.foreground }]}>
          TODAY&apos;S TRAIL
        </Text>
        {dailyTrailComplete ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <AppIcon name="check-circle" size={14} color={colors.accent} />
            <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: colors.accent }}>DONE</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: "#a855f7" }}>
            Complete all 3 → Rare+ Bag
          </Text>
        )}
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        {DAILY_TRAIL_TYPES.map((type) => {
          const done = dailyTrailDrillsDone.includes(type);
          return (
            <View
              key={type}
              style={[styles.trailStep, {
                flex: 1,
                borderColor: done ? colors.accent : colors.border,
                backgroundColor: done ? "rgba(0,255,213,0.12)" : "transparent",
              }]}
            >
              {done ? (
                <AppIcon name="check-circle" size={16} color={colors.accent} />
              ) : (
                <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: colors.mutedForeground }} />
              )}
              <Text style={{ fontSize: 10, fontFamily: "Inter_500Medium", color: done ? colors.accent : colors.mutedForeground, textAlign: "center", marginTop: 4 }}>
                {TRAIL_LABELS[type]}
              </Text>
            </View>
          );
        })}
      </View>
      {dailyTrailComplete && (
        <Text style={{ fontSize: 11, fontFamily: "Inter_400Regular", color: colors.accent, textAlign: "center", marginTop: 8 }}>
          Your bag drop was awarded after your last drill
        </Text>
      )}
    </View>
  );
}

function YourPath() {
  const colors = useColors();
  const router = useRouter();
  const { step, loaded, trailSteps } = useBeginnerTrail();

  if (!loaded || step === 3) return null;

  const { steps, subtitle } = trailSteps;

  return (
    <View style={[styles.pathCard, { borderColor: colors.accent, backgroundColor: "rgba(0,255,213,0.06)", borderRadius: colors.radius }]}>
      <Text style={[styles.pathLabel, { color: colors.accent }]}>YOUR PATH</Text>
      <Text style={[styles.pathSub, { color: colors.mutedForeground }]}>
        {subtitle}
      </Text>

      <View style={styles.pathStrip}>
        {steps.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <React.Fragment key={s.label}>
              {i > 0 && (
                <View style={[styles.pathConnector, { backgroundColor: i <= step ? colors.accent : colors.border }]} />
              )}
              <Pressable
                onPress={() => router.push(s.href as never)}
                style={({ pressed }) => [
                  styles.pathStep,
                  {
                    borderColor: done ? colors.accent : active ? colors.accent : colors.border,
                    backgroundColor: done
                      ? "rgba(0,255,213,0.18)"
                      : active
                        ? "rgba(0,255,213,0.10)"
                        : colors.card,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {done ? (
                  <AppIcon name="check-circle" size={20} color={colors.accent} />
                ) : (
                  <AppIcon name={s.icon as AppIconName} size={20} color={active ? colors.accent : colors.mutedForeground} />
                )}
                <Text
                  style={[
                    styles.pathStepLabel,
                    { color: done || active ? colors.accent : colors.mutedForeground },
                  ]}
                >
                  {s.label}
                </Text>
                {active && (
                  <View style={[styles.goBadge, { backgroundColor: colors.accent }]}>
                    <Text style={styles.goText}>Go</Text>
                  </View>
                )}
              </Pressable>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

export default function PracticeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { stats } = useProgress();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 24;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: colors.accent }]}>TRAINING DECK</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Practice</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Ten quick missions per session. Earn XP, climb the belt ranks.
        </Text>

        {/* ── BOSS BATTLE UNLOCK CARD ── */}
        <Pressable
          onPress={() => router.push("/galaxy")}
          style={({ pressed }) => [styles.bossUnlockCard, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={["rgba(239,68,68,0.18)", "rgba(139,0,0,0.08)"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.bossUnlockTop}>
            <Text style={styles.bossUnlockKicker}>⚔  GUARDIAN TRIALS</Text>
            <Text style={styles.bossUnlockArrow}>›</Text>
          </View>
          <Text style={[styles.bossUnlockTitle, { color: colors.foreground }]}>
            4 sessions a week unlocks Boss Battles
          </Text>
          <Text style={[styles.bossUnlockBody, { color: colors.mutedForeground }]}>
            Complete 4 full practice sessions in a week (21 mins each across 3 disciplines) and you earn the right to challenge the next Guardian. Miss a week and the gate stays shut. Boss battles are how you progress through the Galaxy.
          </Text>
          <View style={styles.bossUnlockPips}>
            {[0, 1, 2, 3].map((i) => (
              <View key={i} style={[styles.bossUnlockPip, { backgroundColor: "#ef444430", borderColor: "#ef444466" }]} />
            ))}
          </View>
        </Pressable>

        <DailyTrailWidget />

        <YourPath />

        <Text style={[styles.sectionLabel, { color: colors.accent }]}>LEARN THE THEORY</Text>
        <PracticeCard
          icon="book-open"
          title="Demystifying Intervals"
          blurb="What every interval sounds like, with play-along examples"
          onPress={() => router.push("/lesson/intervals")}
        />
        <PracticeCard
          icon="compass"
          title="Finding the Notes"
          blurb="Rob's five octave formulas to find any note on the neck"
          onPress={() => router.push("/lesson/finding-notes")}
        />
        <PracticeCard
          icon="layers"
          title="Chord Construction"
          blurb="How chords are built from formulas, plus inversions"
          onPress={() => router.push("/lesson/chord-construction")}
        />

        <Text style={[styles.sectionLabel, { color: colors.accent }]}>FRETBOARD DRILLS</Text>
        <PracticeCard
          icon="crosshair"
          title="Interval Tap"
          blurb="Root is lit on the neck — tap the correct interval position"
          best={stats.intervals?.bestScore}
          onPress={() => router.push("/drill/interval-tap")}
        />
        <PracticeCard
          icon="grid"
          title="Find All Notes"
          blurb="Find every instance of a named note across the full neck"
          best={stats.notes?.bestScore}
          onPress={() => router.push("/drill/find-notes")}
        />
        <PracticeCard
          icon="sliders"
          title="Build a Chord Shape"
          blurb="Tap the frets to build the correct open-position chord voicing"
          best={stats.chords?.bestScore}
          onPress={() => router.push("/drill/chord-shape")}
        />
        <Text style={[styles.sectionLabel, { color: colors.accent }]}>CLASSIC DRILLS</Text>
        {DRILLS.map((d) => (
          <PracticeCard
            key={d.type}
            icon={d.icon as AppIconName}
            title={d.title}
            blurb={d.blurb}
            best={stats[d.type]?.bestScore}
            onPress={() => router.push(`/drill/${d.type}`)}
          />
        ))}

        <Text style={[styles.sectionLabel, { color: "#FF6B35" }]}>FRETBOARD GAMES</Text>
        <PracticeCard
          icon="crosshair"
          title="Galactic Note Hunt"
          blurb="Pick a note, find every instance on the neck before time runs out"
          onPress={() => router.push("/game/note-hunt")}
        />
        <PracticeCard
          icon="zoom-in"
          title="Shape Spotter"
          blurb="Blank neck — tap every note of a scale shape from memory"
          onPress={() => router.push("/game/shape-spotter")}
        />
        <PracticeCard
          icon="zap"
          title="Alien Invasion"
          blurb="Notes invade a pentatonic shape and vanish in 2 seconds — tap them"
          onPress={() => router.push("/game/alien-invasion")}
        />

        <Text style={[styles.sectionLabel, { color: colors.accent }]}>TRAIN YOUR EARS</Text>
        <PracticeCard
          icon="headphones"
          title="Ear Training"
          blurb="Hear two notes — name the interval between them"
          best={stats.ear?.bestScore}
          onPress={() => router.push("/ear-training")}
        />
        <PracticeCard
          icon="mic"
          title="Note Check"
          blurb="Play a note on your guitar — the app listens and tells you if it's right"
          onPress={() => router.push("/note-check")}
        />
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  title: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6, marginBottom: 16, lineHeight: 20 },
  sectionLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginTop: 18, marginBottom: 10 },
  pathCard: { borderWidth: 1, padding: 16, marginBottom: 20 },
  pathLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2, marginBottom: 4 },
  pathSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 14 },
  pathStrip: { flexDirection: "row", alignItems: "center" },
  pathConnector: { flex: 1, height: 2, marginHorizontal: 4 },
  pathStep: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 10,
    minWidth: 72,
  },
  pathStepLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  goBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginTop: 2 },
  goText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#050816" },

  bossUnlockCard: {
    borderWidth: 1, borderColor: "#ef444444", borderRadius: 14,
    padding: 16, marginBottom: 20, overflow: "hidden", gap: 6,
  },
  bossUnlockTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bossUnlockKicker: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, color: "#ef4444" },
  bossUnlockArrow: { fontSize: 18, color: "#ef4444" },
  bossUnlockTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 2 },
  bossUnlockBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  bossUnlockPips: { flexDirection: "row", gap: 8, marginTop: 4 },
  bossUnlockPip: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5 },

  trailCard: { borderWidth: 1, padding: 14, marginBottom: 20 },
  trailLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  trailStep: { alignItems: "center", paddingVertical: 10, paddingHorizontal: 4, borderWidth: 1, borderRadius: 8 },
});
