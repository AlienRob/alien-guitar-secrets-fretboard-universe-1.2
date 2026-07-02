import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { useColors } from "@/hooks/useColors";

interface GameCardProps {
  color: string;
  kicker: string;
  title: string;
  blurb: string;
  hint: string;
  route: string;
}

function GameCard({ color, kicker, title, blurb, hint, route }: GameCardProps) {
  const router = useRouter();
  const colors = useColors();
  return (
    <Pressable
      onPress={() => router.push(route as never)}
      style={({ pressed }) => [styles.card, { borderColor: `${color}55`, opacity: pressed ? 0.85 : 1 }]}
    >
      <LinearGradient
        colors={[`${color}22`, `${color}08`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <Text style={[styles.cardKicker, { color }]}>{kicker}</Text>
      <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.cardBlurb, { color: colors.mutedForeground }]}>{blurb}</Text>
      <View style={styles.cardFooter}>
        <Text style={[styles.cardHint, { color: `${color}bb` }]}>{hint}</Text>
        <View style={[styles.playBtn, { backgroundColor: color }]}>
          <Text style={styles.playBtnTxt}>PLAY</Text>
        </View>
      </View>
    </Pressable>
  );
}

const GAMES: GameCardProps[] = [
  {
    color: "#00FFD5",
    kicker: "FRETBOARD MEMORY",
    title: "Galactic Note Hunt",
    blurb:
      "Pick a natural note (C, D, E…) and hunt down every single instance across all six strings in 45 seconds. Wrong taps cost you 3 seconds. Build a chain to multiply your score.",
    hint: "45 sec · landscape · XP earned",
    route: "/game/note-hunt",
  },
  {
    color: "#FFD700",
    kicker: "SHAPE MEMORY",
    title: "Shape Spotter",
    blurb:
      "The neck goes blank. A scale shape is named — CAGED, 3-notes-per-string, or pentatonic box. Tap every note from memory. Roots glow gold when found. Fewer misses = higher score.",
    hint: "Timed · landscape · XP earned",
    route: "/game/shape-spotter",
  },
  {
    color: "#FF6B35",
    kicker: "REACTION TRAINER",
    title: "Alien Invasion",
    blurb:
      "Notes invade a pentatonic shape one by one — each glows for just 2.2 seconds before it vanishes. Tap them before they escape. Chain taps for up to ×5 score. 60 seconds on the clock.",
    hint: "60 sec · landscape · XP earned",
    route: "/game/alien-invasion",
  },
];

export default function GamesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 24;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 18, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.kicker, { color: "#FF6B35" }]}>FRETBOARD GAMES</Text>
        <Text style={[styles.title, { color: colors.foreground }]}>Play & Learn</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          All three games rotate to landscape so the full neck is visible. Each awards XP toward your belt rank.
        </Text>

        {GAMES.map((g) => (
          <GameCard key={g.route} {...g} />
        ))}

        <Text style={[styles.tipLabel, { color: colors.mutedForeground }]}>
          Tip: landscape games work best with the phone in landscape mode — the screen locks automatically when you enter a game.
        </Text>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  kicker: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  title: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4 },
  sub: { fontSize: 14, fontFamily: "Inter_400Regular", marginTop: 6, marginBottom: 18, lineHeight: 20 },
  card: {
    borderWidth: 1, borderRadius: 16, padding: 18,
    marginBottom: 14, overflow: "hidden", gap: 6,
  },
  cardKicker: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  cardTitle: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  cardBlurb: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  cardFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 6 },
  cardHint: { fontSize: 11, fontFamily: "Inter_400Regular" },
  playBtn: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 10 },
  playBtnTxt: { fontFamily: "Inter_700Bold", fontSize: 13, color: "#050816", letterSpacing: 1 },
  tipLabel: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16, marginTop: 10, textAlign: "center" },
});
