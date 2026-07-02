import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { DegreeStrip } from "@/components/degree-strip";
import { useColors } from "@/hooks/useColors";
import { chordSymbol, spellChordWithDegrees, spellScaleWithDegrees } from "@/lib/musicTheory";

type Mode = "scales" | "chords";

const ROOTS = ["C", "G", "D", "A", "E", "F"];
const SCALE_NAMES = ["Major", "Natural Minor", "Major Pentatonic", "Minor Pentatonic", "Dorian", "Mixolydian"];
const CHORD_NAMES = ["Major", "Minor", "7", "maj7", "m7", "sus4"];

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.chipText,
          { color: active ? colors.primaryForeground : colors.mutedForeground },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ReferenceCard() {
  const colors = useColors();
  const [mode, setMode] = useState<Mode>("scales");
  const [root, setRoot] = useState("C");
  const [scaleName, setScaleName] = useState(SCALE_NAMES[0]);
  const [chordName, setChordName] = useState(CHORD_NAMES[0]);

  const items =
    mode === "scales"
      ? spellScaleWithDegrees(root, scaleName)
      : spellChordWithDegrees(root, chordName);
  const title =
    mode === "scales" ? `${root} ${scaleName}` : `${root}${chordSymbol(chordName)}`;
  const names = mode === "scales" ? SCALE_NAMES : CHORD_NAMES;
  const selected = mode === "scales" ? scaleName : chordName;
  const setSelected = mode === "scales" ? setScaleName : setChordName;

  return (
    <View
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
    >
      <Text style={[styles.heading, { color: colors.foreground }]}>Degree reference</Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        See the degree number above every note before you drill.
      </Text>

      <View style={styles.modeRow}>
        <Chip label="Scales" active={mode === "scales"} onPress={() => setMode("scales")} />
        <Chip label="Chords" active={mode === "chords"} onPress={() => setMode("chords")} />
      </View>

      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>KEY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {ROOTS.map((r) => (
          <Chip key={r} label={r} active={root === r} onPress={() => setRoot(r)} />
        ))}
      </ScrollView>

      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>
        {mode === "scales" ? "SCALE" : "CHORD"}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {names.map((n) => (
          <Chip key={n} label={n} active={selected === n} onPress={() => setSelected(n)} />
        ))}
      </ScrollView>

      <View style={styles.stripWrap}>
        <DegreeStrip title={title} items={items} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, padding: 16, marginBottom: 22 },
  heading: { fontSize: 17, fontFamily: "SpaceGrotesk_600SemiBold" },
  sub: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 4, marginBottom: 14, lineHeight: 18 },
  modeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  rowLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 8 },
  scrollRow: { gap: 8, paddingBottom: 14 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1 },
  chipText: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  stripWrap: { marginTop: 4 },
});
