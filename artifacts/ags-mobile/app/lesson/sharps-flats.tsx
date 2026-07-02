import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const ACCENT  = "#00FFD5";
const SHARP_C = "#FFD700";
const FLAT_C  = "#a78bfa";

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.h2, { color: colors.mutedForeground }]}>{text}</Text>;
}

function BodyText({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

interface ChromaticRowProps {
  notes: { label: string; natural: boolean }[];
}

function ChromaticRow({ notes }: ChromaticRowProps) {
  const colors = useColors();
  return (
    <View style={styles.chromaRow}>
      {notes.map((n, i) => (
        <View
          key={i}
          style={[
            styles.chromaCell,
            {
              backgroundColor: n.natural ? ACCENT + "18" : colors.card,
              borderColor: n.natural ? ACCENT + "66" : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.chromaNote,
              { color: n.natural ? ACCENT : colors.mutedForeground, fontSize: n.natural ? 13 : 11 },
            ]}
          >
            {n.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

// Full chromatic scale starting on E (the open 6th string), two octaves shown
// as one row for visual clarity.
const CHROMATIC_FROM_E: { label: string; natural: boolean }[] = [
  { label: "E", natural: true  },
  { label: "F", natural: true  },
  { label: "F#/Gb", natural: false },
  { label: "G", natural: true  },
  { label: "G#/Ab", natural: false },
  { label: "A", natural: true  },
  { label: "A#/Bb", natural: false },
  { label: "B", natural: true  },
  { label: "C", natural: true  },
  { label: "C#/Db", natural: false },
  { label: "D", natural: true  },
  { label: "D#/Eb", natural: false },
  { label: "E", natural: true  },
];

interface PairCardProps {
  natural: string;
  sharp: string;
  flat: string;
  fretRule: string;
}

function PairCard({ natural, sharp, flat, fretRule }: PairCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.pairCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.pairRow}>
        <View style={[styles.pairChip, { borderColor: ACCENT + "55", backgroundColor: ACCENT + "12" }]}>
          <Text style={[styles.pairNote, { color: ACCENT }]}>{natural}</Text>
        </View>
        <Text style={[styles.pairArrow, { color: colors.mutedForeground }]}>+1 fret</Text>
        <View style={{ gap: 4 }}>
          <View style={[styles.pairChip, { borderColor: SHARP_C + "55", backgroundColor: SHARP_C + "12" }]}>
            <Text style={[styles.pairNote, { color: SHARP_C }]}>{sharp}</Text>
          </View>
          <View style={[styles.pairChip, { borderColor: FLAT_C + "55", backgroundColor: FLAT_C + "12" }]}>
            <Text style={[styles.pairNote, { color: FLAT_C }]}>{flat}</Text>
          </View>
        </View>
        <Text style={[styles.pairEquals, { color: colors.mutedForeground }]}>= same fret</Text>
      </View>
      <Text style={[styles.pairRule, { color: colors.mutedForeground }]}>{fretRule}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SharpsFlatLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Training · Fretboard"
      title="Sharps & Flats"
      practiceHref="/drill/find-notes"
      practiceLabel="Drill this now — Find All Notes"
      intro={[
        "The seven natural notes — A B C D E F G — only cover seven of the twelve pitches in Western music. The other five are the sharps and flats. These are the black keys on a piano and the in-between frets on the guitar. Once you understand how they work, the entire chromatic scale is yours.",
        "A sharp (#) raises a note by one fret. A flat (b) lowers a note by one fret. That's the whole rule.",
      ]}
    >
      {/* ── What is a sharp ── */}
      <View style={styles.section}>
        <SectionHeading text="WHAT IS A SHARP?" />
        <BodyText>
          A sharp (#) means move up one fret from the named note. If you are on A, the note one fret higher is A# (A sharp). Every natural note except E and B has a sharp — because E→F and B→C are already just one fret apart with no note between them.
        </BodyText>
        <View style={[styles.defBox, { borderColor: SHARP_C + "44", backgroundColor: SHARP_C + "08" }]}>
          <Text style={[styles.defSymbol, { color: SHARP_C }]}>#</Text>
          <Text style={[styles.defText, { color: colors.mutedForeground }]}>
            Up one fret from the natural note.{"\n"}G at fret 3 → G# at fret 4.
          </Text>
        </View>
      </View>

      {/* ── What is a flat ── */}
      <View style={styles.section}>
        <SectionHeading text="WHAT IS A FLAT?" />
        <BodyText>
          A flat (b) means move down one fret from the named note. If you are on B, the note one fret lower is Bb (B flat). Every natural note except C and F has a flat — for the same reason: C and F sit right next to B and E with no gap.
        </BodyText>
        <View style={[styles.defBox, { borderColor: FLAT_C + "44", backgroundColor: FLAT_C + "08" }]}>
          <Text style={[styles.defSymbol, { color: FLAT_C }]}>b</Text>
          <Text style={[styles.defText, { color: colors.mutedForeground }]}>
            Down one fret from the natural note.{"\n"}A at fret 5 → Ab at fret 4.
          </Text>
        </View>
      </View>

      {/* ── Chromatic layout ── */}
      <View style={styles.section}>
        <SectionHeading text="THE FULL CHROMATIC LAYOUT" />
        <BodyText>
          Starting from the open 6th string (E), here are all twelve pitches in order — one per fret up to the 12th. Natural notes are highlighted; the in-between notes are sharps/flats.
        </BodyText>
        <View style={[styles.chromaWrap, { borderColor: colors.border }]}>
          <ChromaticRow notes={CHROMATIC_FROM_E} />
          <View style={styles.fretNums}>
            {Array.from({ length: 13 }, (_, i) => (
              <Text key={i} style={[styles.fretLabel, { color: colors.mutedForeground }]}>{i}</Text>
            ))}
          </View>
        </View>
        <Text style={[styles.caption, { color: colors.mutedForeground }]}>
          Fret 0 = open string. At fret 12 the note repeats one octave higher.
        </Text>
      </View>

      {/* ── The five sharp/flat pairs ── */}
      <View style={styles.section}>
        <SectionHeading text="THE FIVE SHARP / FLAT PAIRS" />
        <BodyText>
          Each of the five in-between notes has two names — one sharp and one flat. Both names refer to exactly the same fret. Which name you use depends on the key you are in (covered in the Enharmonics lesson).
        </BodyText>
        <View style={{ gap: 10 }}>
          <PairCard natural="C" sharp="C#" flat="Db" fretRule="One fret above C — fret 1 on the 5th string" />
          <PairCard natural="D" sharp="D#" flat="Eb" fretRule="One fret above D — fret 1 on the 4th string" />
          <PairCard natural="F" sharp="F#" flat="Gb" fretRule="One fret above F — fret 2 on the 6th string" />
          <PairCard natural="G" sharp="G#" flat="Ab" fretRule="One fret above G — fret 4 on the 6th string" />
          <PairCard natural="A" sharp="A#" flat="Bb" fretRule="One fret above A — fret 1 on the 4th string (open)" />
        </View>
      </View>

      {/* ── E and B have no sharp ── */}
      <View style={styles.section}>
        <SectionHeading text="E AND B: THE EXCEPTIONS" />
        <BodyText>
          E and B have no sharp of their own. Moving one fret above E lands you on F — a natural note. Moving one fret above B lands you on C — also a natural note. This is the same B→C and E→F rule from the natural notes lesson.
        </BodyText>
        <View style={[styles.exceptionBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {[
            { from: "E", to: "F",  label: "E# = F  (same fret)" },
            { from: "B", to: "C",  label: "B# = C  (same fret)" },
            { from: "F", to: "E",  label: "Fb = E  (same fret)" },
            { from: "C", to: "B",  label: "Cb = B  (same fret)" },
          ].map(({ from, to, label }) => (
            <View key={label} style={styles.exceptionRow}>
              <Text style={[styles.exceptionFrom, { color: ACCENT }]}>{from}</Text>
              <Text style={[styles.exceptionArrow, { color: colors.mutedForeground }]}>→</Text>
              <Text style={[styles.exceptionTo, { color: colors.mutedForeground }]}>{to}</Text>
              <Text style={[styles.exceptionLabel, { color: colors.mutedForeground }]}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Recap ── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Sharp (#) = one fret up. Flat (b) = one fret down.",
          "Five notes have two names: C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb.",
          "E and B have no sharp. C and F have no flat.",
          "Every fret is one semitone — that's what # and b measure.",
          "Which name you use depends on the key — the note itself is identical.",
        ].map((r, i) => (
          <View key={i} style={styles.recapRow}>
            <Text style={[styles.recapNum, { color: ACCENT }]}>{i + 1}.</Text>
            <Text style={[styles.recapText, { color: colors.mutedForeground }]}>{r}</Text>
          </View>
        ))}
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  h2:   { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  caption: { fontSize: 11.5, fontFamily: "Inter_400Regular", lineHeight: 17, fontStyle: "italic" },

  defBox: { flexDirection: "row", alignItems: "flex-start", gap: 14, borderWidth: 1, borderRadius: 10, padding: 14 },
  defSymbol: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 32 },
  defText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  chromaWrap: { borderWidth: 1, borderRadius: 10, overflow: "hidden", padding: 10, gap: 6 },
  chromaRow: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chromaCell: {
    borderWidth: 1, borderRadius: 6,
    paddingHorizontal: 5, paddingVertical: 5,
    minWidth: 38, alignItems: "center", justifyContent: "center",
  },
  chromaNote: { fontFamily: "SpaceGrotesk_600SemiBold", textAlign: "center" },
  fretNums: { flexDirection: "row", gap: 4 },
  fretLabel: { fontSize: 9, fontFamily: "Inter_400Regular", minWidth: 38, textAlign: "center" },

  pairCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  pairRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  pairChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  pairNote: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  pairArrow: { fontSize: 12, fontFamily: "Inter_400Regular" },
  pairEquals: { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  pairRule: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  exceptionBox: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  exceptionRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  exceptionFrom: { width: 20, fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  exceptionArrow: { fontSize: 13 },
  exceptionTo: { width: 20, fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  exceptionLabel: { flex: 1, fontSize: 12.5, fontFamily: "Inter_400Regular" },

  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
