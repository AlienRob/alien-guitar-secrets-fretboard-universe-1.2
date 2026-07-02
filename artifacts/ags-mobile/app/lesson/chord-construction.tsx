import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";
import { chordFormula, INVERSION_NAMES, rotateNotes, spellChord } from "@/lib/musicTheory";

function FormulaChips({ labels }: { labels: string[] }) {
  const colors = useColors();
  return (
    <View style={styles.chipRow}>
      {labels.map((l, i) => (
        <View key={i} style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Text style={styles.chipText}>{l}</Text>
        </View>
      ))}
    </View>
  );
}

interface TriadRow {
  name: string;
  key: string;
  intervals: number[];
  formula: string[];
  recipe: string;
  notes: string[];
  example: string;
  color: string;
}

// The four triad qualities, each shown with its interval-number formula and a
// worked example built from C. Notes are derived so spellings stay correct.
const TRIADS: TriadRow[] = (
  [
    { name: "Major", key: "Major", intervals: [0, 4, 7], formula: ["1", "3", "5"], recipe: "Root, major 3rd, perfect 5th", color: "#FFD700" },
    { name: "Minor", key: "Minor", intervals: [0, 3, 7], formula: ["1", "\u266D3", "5"], recipe: "Root, minor 3rd, perfect 5th", color: "#00BFFF" },
    { name: "Diminished", key: "dim", intervals: [0, 3, 6], formula: ["1", "\u266D3", "\u266D5"], recipe: "Root, minor 3rd, diminished 5th", color: "#FF6B9D" },
    { name: "Augmented", key: "aug", intervals: [0, 4, 8], formula: ["1", "3", "\u266F5"], recipe: "Root, major 3rd, augmented 5th", color: "#00FFD5" },
  ] as Omit<TriadRow, "notes" | "example">[]
).map((t) => {
  const notes = spellChord("C", t.key, t.intervals);
  return { ...t, notes, example: notes.join(" - ") };
});

const C_MAJOR = spellChord("C", "Major", [0, 4, 7]);
const INVERSIONS = INVERSION_NAMES.map((label, i) => ({
  label,
  notes: rotateNotes(C_MAJOR, i),
  bass: i === 0 ? "the root (1)" : i === 1 ? "the 3rd" : "the 5th",
}));

const SEVENTHS = [
  { name: "Cmaj7", key: "maj7", intervals: [0, 4, 7, 11] },
  { name: "C7", key: "7", intervals: [0, 4, 7, 10] },
  { name: "C9", key: "9", intervals: [0, 4, 7, 10, 14] },
];

const ROLES = [
  { n: "1", title: "Root", body: "The base note that names the chord (C in a C chord)." },
  { n: "3", title: "Third", body: "Decides major or minor — the chord's mood lives here." },
  { n: "5", title: "Fifth", body: "Adds stability and weight under the chord." },
];

export default function ChordConstructionLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Training · Chords"
      title="Chord Construction & Inversions"
      practiceHref="/drill/chords"
      practiceLabel="Drill this now — Chord Decoder"
      intro={[
        "Chords are built by stacking intervals on top of a root note. Once you can read a chord as a simple interval-number formula — 1 for the root, 3 for the third, 5 for the fifth, and so on — every chord becomes a recipe you can build anywhere on the neck, in any key.",
        "We start with the triad: a three-note chord made of a root, a third and a fifth. Then we'll rearrange those notes into inversions for smoother, more interesting voicings.",
      ]}
    >
      <View style={{ gap: 12 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>THE THREE ROLES IN A TRIAD</Text>
        {ROLES.map((c) => (
          <View key={c.n} style={[styles.roleCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={styles.roleNum}>{c.n}</Text>
            <Text style={[styles.roleTitle, { color: colors.foreground }]}>{c.title}</Text>
            <Text style={[styles.roleBody, { color: colors.mutedForeground }]}>{c.body}</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>THE FOUR TRIAD TYPES</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Each triad changes the quality of the third and/or the fifth. The formula tells you exactly which notes to stack.
        </Text>
        <View style={[styles.table, { borderColor: colors.border, borderRadius: colors.radius }]}>
          {TRIADS.map((t, i) => (
            <View
              key={t.name}
              style={[styles.triadRow, i < TRIADS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            >
              <View style={styles.triadTop}>
                <Text style={[styles.triadName, { color: t.color }]}>{t.name}</Text>
                <Text style={[styles.triadExample, { color: colors.foreground }]}>{t.example}</Text>
              </View>
              <FormulaChips labels={t.formula} />
              <Text style={[styles.note, { color: colors.mutedForeground }]}>{t.recipe}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>BUILDING A TRIAD ON THE FRETBOARD</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>Starting from any root, count frets to find each note:</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          <Text style={{ color: colors.foreground }}>The third</Text> — up 4 frets for a major third, or 3 frets for a minor third.
        </Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          <Text style={{ color: colors.foreground }}>The fifth</Text> — up 7 frets for a perfect fifth, 6 frets for a diminished fifth, or 8 frets for an augmented fifth.
        </Text>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>BEYOND TRIADS: SEVENTHS & EXTENSIONS</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Keep stacking thirds and the formula keeps growing. Add a 7th to a triad to make a seventh chord, then 9ths,
          11ths and 13ths for richer colours:
        </Text>
        <View style={[styles.table, { borderColor: colors.border, borderRadius: colors.radius }]}>
          {SEVENTHS.map((c, i) => (
            <View
              key={c.name}
              style={[styles.triadRow, i < SEVENTHS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
            >
              <View style={styles.triadTop}>
                <Text style={[styles.triadName, { color: colors.accent }]}>{c.name}</Text>
                <Text style={[styles.triadExample, { color: colors.foreground }]}>
                  {spellChord("C", c.key, c.intervals).join(" - ")}
                </Text>
              </View>
              <FormulaChips labels={chordFormula(c.intervals)} />
            </View>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>INVERSIONS</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          An inversion plays the same notes in a different order, so a note other than the root sits at the bottom. Same
          chord, new voicing — great for smooth transitions between chords.
        </Text>
        {INVERSIONS.map((inv) => (
          <View key={inv.label} style={[styles.invCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <Text style={[styles.invLabel, { color: colors.accent }]}>{inv.label}</Text>
            <Text style={styles.invNotes}>{inv.notes.join(" - ")}</Text>
            <Text style={[styles.note, { color: colors.mutedForeground }]}>Lowest note is {inv.bass}.</Text>
          </View>
        ))}
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          All three are still a C major chord (C - E - G) — only the bass note has changed.
        </Text>
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  note: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 19 },
  body: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  roleCard: { borderWidth: 1, padding: 14 },
  roleNum: { fontSize: 24, fontFamily: "SpaceGrotesk_700Bold", color: "#FFD700" },
  roleTitle: { fontSize: 15.5, fontFamily: "SpaceGrotesk_600SemiBold", marginTop: 4 },
  roleBody: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: 3 },
  table: { borderWidth: 1, overflow: "hidden" },
  triadRow: { padding: 14, gap: 9 },
  triadTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  triadName: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  triadExample: { fontSize: 14, fontFamily: "SpaceGrotesk_500Medium" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  chipText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FFD700" },
  invCard: { borderWidth: 1, padding: 14 },
  invLabel: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  invNotes: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold", color: "#FFD700", marginTop: 6 },
});
