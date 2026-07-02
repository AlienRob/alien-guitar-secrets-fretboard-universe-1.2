import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const TEAL   = "#00FFD5";
const GOLD   = "#FFD700";
const PURPLE = "#a78bfa";
const BLUE   = "#60a5fa";

function H2({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.h2, { color: colors.mutedForeground }]}>{text}</Text>;
}

function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

// ── Formula row ───────────────────────────────────────────────────────────────

function FormulaRow({
  steps,
  accentColor,
}: {
  steps: { label: string; accent: boolean }[];
  accentColor: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.formulaRow}>
      {steps.map((s, i) => (
        <React.Fragment key={i}>
          <View
            style={[
              styles.formulaCell,
              {
                borderColor: s.accent ? accentColor + "88" : colors.border,
                backgroundColor: s.accent ? accentColor + "18" : colors.card,
              },
            ]}
          >
            <Text style={[styles.formulaText, { color: s.accent ? accentColor : colors.mutedForeground }]}>
              {s.label}
            </Text>
          </View>
          {i < steps.length - 1 && (
            <Text style={[styles.formulaArrow, { color: colors.mutedForeground }]}>—</Text>
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

// ── Degree table ──────────────────────────────────────────────────────────────

function DegreeTable({
  degrees,
  accentColor,
}: {
  degrees: { deg: string; note: string; interval: string }[];
  accentColor: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.degreeTable, { borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.degreeHeader, { borderBottomColor: colors.border, backgroundColor: accentColor + "18" }]}>
        <Text style={[styles.degreeCol, { color: accentColor, flex: 1 }]}>DEGREE</Text>
        <Text style={[styles.degreeCol, { color: accentColor, flex: 1 }]}>NOTE (in C)</Text>
        <Text style={[styles.degreeCol, { color: accentColor, flex: 2 }]}>INTERVAL</Text>
      </View>
      {degrees.map((d) => (
        <View key={d.deg} style={[styles.degreeRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.degreeDeg, { color: accentColor, flex: 1 }]}>{d.deg}</Text>
          <Text style={[styles.degreeNote, { color: colors.foreground, flex: 1 }]}>{d.note}</Text>
          <Text style={[styles.degreeInterval, { color: colors.mutedForeground, flex: 2 }]}>{d.interval}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Data ──────────────────────────────────────────────────────────────────────

const MAJOR_STEPS = [
  { label: "W", accent: false }, { label: "W", accent: false },
  { label: "H", accent: true  }, { label: "W", accent: false },
  { label: "W", accent: false }, { label: "W", accent: false },
  { label: "H", accent: true  },
];

const MINOR_STEPS = [
  { label: "W", accent: false }, { label: "H", accent: true  },
  { label: "W", accent: false }, { label: "W", accent: false },
  { label: "H", accent: true  }, { label: "W", accent: false },
  { label: "W", accent: false },
];

const MAJOR_DEGREES = [
  { deg: "1",  note: "C", interval: "Root" },
  { deg: "2",  note: "D", interval: "Major 2nd" },
  { deg: "3",  note: "E", interval: "Major 3rd" },
  { deg: "4",  note: "F", interval: "Perfect 4th" },
  { deg: "5",  note: "G", interval: "Perfect 5th" },
  { deg: "6",  note: "A", interval: "Major 6th" },
  { deg: "7",  note: "B", interval: "Major 7th" },
];

const MINOR_DEGREES = [
  { deg: "1",   note: "A", interval: "Root" },
  { deg: "2",   note: "B", interval: "Major 2nd" },
  { deg: "b3",  note: "C", interval: "Minor 3rd" },
  { deg: "4",   note: "D", interval: "Perfect 4th" },
  { deg: "5",   note: "E", interval: "Perfect 5th" },
  { deg: "b6",  note: "F", interval: "Minor 6th" },
  { deg: "b7",  note: "G", interval: "Minor 7th" },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function MajorMinorScalesLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Scales · Foundations"
      title="The Major & Natural Minor Scales"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "Every scale, chord, and melody in Western music comes from choosing specific notes out of the twelve available pitches. A scale is a selection of those notes arranged in a defined pattern of intervals. The pattern — not any particular starting note — is what gives a scale its character.",
        "This lesson covers the two most fundamental scales: the Major scale (bright, resolved, the backbone of most Western music) and the Natural Minor scale (darker, more emotional). Once these two are under your fingers, every other scale or mode is a variation on them.",
      ]}
    >
      {/* ══ WHAT IS A SCALE ════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <H2 text="WHAT IS A SCALE?" />
        <Body>
          The chromatic scale contains all twelve pitches — every fret on one string from any starting point to its octave twelve frets away. A scale selects a subset of those twelve, spaced apart by specific intervals. The gaps between consecutive notes are either whole steps (W = two frets) or half steps (H = one fret).
        </Body>
        <View style={[styles.infoBox, { borderColor: TEAL + "44", backgroundColor: TEAL + "08" }]}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            <Text style={{ color: TEAL, fontFamily: "SpaceGrotesk_700Bold" }}>W</Text>
            {"  = Whole step = 2 frets\n"}
            <Text style={{ color: TEAL, fontFamily: "SpaceGrotesk_700Bold" }}>H</Text>
            {"  = Half step = 1 fret\n\nThe sequence of Ws and Hs is called the scale formula. The same formula applied from any root note gives you that scale in any key."}
          </Text>
        </View>
      </View>

      {/* ══ THE MAJOR SCALE ════════════════════════════════════════════════════ */}
      <View style={styles.divider} />
      <View style={styles.section}>
        <View style={[styles.scaleBadge, { borderColor: GOLD + "55", backgroundColor: GOLD + "10" }]}>
          <Text style={[styles.scaleBadgeText, { color: GOLD }]}>UNLOCKING THE MAJOR SCALE</Text>
        </View>
        <Body>
          The Major scale is the foundation of Western music. Its sound — bright, stable, resolved — is so ingrained in our ears that it feels like the natural resting point. Every major key, major chord, and countless melodies are built directly from it.
        </Body>

        <H2 text="FORMULA" />
        <FormulaRow steps={MAJOR_STEPS} accentColor={GOLD} />
        <Body>
          Starting on C, the formula produces: C D E F G A B (C). That same pattern starting on G gives: G A B C D E F# (G). The pattern is always the same — only the starting note changes.
        </Body>

        <H2 text="DEGREES IN C MAJOR" />
        <DegreeTable degrees={MAJOR_DEGREES} accentColor={GOLD} />
        <Body>
          Every note in the scale has a number called its degree. The root is 1, the next note is 2, and so on. These numbers are key — they let you talk about any scale in any key without naming specific notes.
        </Body>

        <View style={[styles.infoBox, { borderColor: GOLD + "44", backgroundColor: GOLD + "08" }]}>
          <Text style={[styles.infoLabel, { color: GOLD }]}>THE MAJOR SOUND</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            The major scale sounds resolved and complete. The defining intervals are the major 3rd (degree 3) and the major 7th (degree 7). These two degrees define the brightness and stability of the major sound.
          </Text>
        </View>
      </View>

      {/* ══ THE NATURAL MINOR SCALE ════════════════════════════════════════════ */}
      <View style={styles.divider} />
      <View style={styles.section}>
        <View style={[styles.scaleBadge, { borderColor: BLUE + "55", backgroundColor: BLUE + "10" }]}>
          <Text style={[styles.scaleBadgeText, { color: BLUE }]}>UNLOCKING THE NATURAL MINOR SCALE</Text>
        </View>
        <Body>
          The Natural Minor scale has the same seven notes as its relative major scale — just starting from a different root. What changes is the formula, and with it, the emotional character. Where the major scale feels bright and resolved, the minor scale feels darker, more expressive, and emotionally rich.
        </Body>

        <H2 text="FORMULA" />
        <FormulaRow steps={MINOR_STEPS} accentColor={BLUE} />
        <Body>
          Starting on A, the formula produces: A B C D E F G (A). Compare this to C major: A minor and C major share the exact same seven notes. A is the 6th degree of C major — this is the relative minor relationship.
        </Body>

        <H2 text="DEGREES IN A MINOR" />
        <DegreeTable degrees={MINOR_DEGREES} accentColor={BLUE} />
        <Body>
          Notice the three flatted degrees compared to the major scale: b3, b6, b7. These are what give the minor scale its darker quality. The b3 in particular — the minor third — is the defining sound of any minor key.
        </Body>

        <View style={[styles.infoBox, { borderColor: BLUE + "44", backgroundColor: BLUE + "08" }]}>
          <Text style={[styles.infoLabel, { color: BLUE }]}>THE MINOR SOUND</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            The minor scale sounds emotional, introspective, and darker than its major counterpart. The minor 3rd (b3) and minor 7th (b7) are the key degrees that define this sound. Rock, blues, and classical music all lean heavily on the minor scale.
          </Text>
        </View>
      </View>

      {/* ══ RELATIVE RELATIONSHIP ══════════════════════════════════════════════ */}
      <View style={styles.divider} />
      <View style={styles.section}>
        <H2 text="THE RELATIVE RELATIONSHIP" />
        <Body>
          Every major scale has a relative minor — a minor scale that uses the exact same notes, beginning on the 6th degree. This is one of the most important relationships in music theory.
        </Body>
        <View style={[styles.relativeBox, { borderColor: colors.border, backgroundColor: colors.card, borderRadius: colors.radius }]}>
          {[
            { major: "C major", minor: "A minor", note: "Same 7 notes — C D E F G A B" },
            { major: "G major", minor: "E minor", note: "Same 7 notes — G A B C D E F#" },
            { major: "D major", minor: "B minor", note: "Same 7 notes — D E F# G A B C#" },
            { major: "A major", minor: "F# minor", note: "Same 7 notes — A B C# D E F# G#" },
          ].map(({ major, minor, note }) => (
            <View key={major} style={[styles.relativeRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.relMajor, { color: GOLD }]}>{major}</Text>
              <Text style={[styles.relArrow, { color: colors.mutedForeground }]}>↔</Text>
              <Text style={[styles.relMinor, { color: BLUE }]}>{minor}</Text>
              <Text style={[styles.relNote, { color: colors.mutedForeground }]}>{note}</Text>
            </View>
          ))}
        </View>
        <Body>
          On the fretboard this is powerful: if you know the C major scale shape, you already know the A minor shape — they are the same notes, the same frets, just with a different tonal centre. Your ear decides which note sounds like home.
        </Body>
      </View>

      {/* ══ PARALLEL MINOR ════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <H2 text="PARALLEL MAJOR AND MINOR" />
        <Body>
          The relative relationship shares notes but starts on a different root. The parallel relationship keeps the same root but changes the formula — and therefore the notes. C major and C minor share the same root (C) but have different notes and very different sounds.
        </Body>
        <View style={[styles.infoBox, { borderColor: PURPLE + "44", backgroundColor: PURPLE + "08" }]}>
          <Text style={[styles.infoLabel, { color: PURPLE }]}>C MAJOR vs C MINOR</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            C major: C  D  E  F  G  A  B{"\n"}
            C minor: C  D  Eb F  G  Ab Bb{"\n\n"}
            The 3rd, 6th, and 7th degrees are flatted in the minor — that's where the darker sound comes from.
          </Text>
        </View>
      </View>

      {/* ══ RECAP ═════════════════════════════════════════════════════════════ */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "A scale is a selection of notes from the 12 chromatic pitches, defined by a formula of whole and half steps.",
          "Major formula: W W H W W W H — bright, stable, resolved.",
          "Natural Minor formula: W H W W H W W — darker, more emotional.",
          "Every major scale has a relative minor starting on its 6th degree — same notes, different tonal centre.",
          "Parallel major/minor share the same root but differ at the 3rd, 6th, and 7th degrees.",
        ].map((r, i) => (
          <View key={i} style={styles.recapRow}>
            <Text style={[styles.recapNum, { color: TEAL }]}>{i + 1}.</Text>
            <Text style={[styles.recapText, { color: colors.mutedForeground }]}>{r}</Text>
          </View>
        ))}
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 4 },
  h2:   { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  scaleBadge: {
    alignSelf: "flex-start", borderWidth: 1, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  scaleBadgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },

  infoBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  infoLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  infoText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 22 },

  formulaRow: {
    flexDirection: "row", flexWrap: "wrap",
    alignItems: "center", gap: 4,
  },
  formulaCell: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 6, minWidth: 32, alignItems: "center",
  },
  formulaText: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  formulaArrow: { fontSize: 12, fontFamily: "Inter_400Regular" },

  degreeTable: { borderWidth: 1, overflow: "hidden" },
  degreeHeader: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  degreeRow: { flexDirection: "row", paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  degreeCol: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  degreeDeg: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  degreeNote: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  degreeInterval: { fontSize: 12.5, fontFamily: "Inter_400Regular" },

  relativeBox: { borderWidth: 1, overflow: "hidden" },
  relativeRow: {
    flexDirection: "row", alignItems: "center",
    flexWrap: "wrap", gap: 6,
    paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1,
  },
  relMajor: { fontSize: 13.5, fontFamily: "SpaceGrotesk_700Bold", width: 80 },
  relArrow: { fontSize: 16 },
  relMinor: { fontSize: 13.5, fontFamily: "SpaceGrotesk_700Bold", width: 72 },
  relNote:  { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },

  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
