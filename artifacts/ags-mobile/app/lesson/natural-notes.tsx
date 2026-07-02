import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

// ── String data ───────────────────────────────────────────────────────────────
// Natural notes (no sharps/flats) on each string, frets 0–12.
// Between B→C and E→F there is no sharp/flat — those are natural half-steps.

interface StringRow {
  name: string;      // e.g. "6th (Low E)"
  open: string;      // open-string note name
  color: string;
  notes: { fret: number; note: string }[];
}

const ACCENT = "#00FFD5";
const DIM    = "rgba(255,255,255,0.15)";

const STRING_ROWS: StringRow[] = [
  {
    name: "6th — Low E", open: "E", color: "#ef4444",
    notes: [
      { fret: 0, note: "E" }, { fret: 1, note: "F" }, { fret: 3, note: "G" },
      { fret: 5, note: "A" }, { fret: 7, note: "B" }, { fret: 8, note: "C" },
      { fret: 10, note: "D" }, { fret: 12, note: "E" },
    ],
  },
  {
    name: "5th — A", open: "A", color: "#f59e0b",
    notes: [
      { fret: 0, note: "A" }, { fret: 2, note: "B" }, { fret: 3, note: "C" },
      { fret: 5, note: "D" }, { fret: 7, note: "E" }, { fret: 8, note: "F" },
      { fret: 10, note: "G" }, { fret: 12, note: "A" },
    ],
  },
  {
    name: "4th — D", open: "D", color: "#a78bfa",
    notes: [
      { fret: 0, note: "D" }, { fret: 2, note: "E" }, { fret: 3, note: "F" },
      { fret: 5, note: "G" }, { fret: 7, note: "A" }, { fret: 9, note: "B" },
      { fret: 10, note: "C" }, { fret: 12, note: "D" },
    ],
  },
  {
    name: "3rd — G", open: "G", color: "#00FFD5",
    notes: [
      { fret: 0, note: "G" }, { fret: 2, note: "A" }, { fret: 4, note: "B" },
      { fret: 5, note: "C" }, { fret: 7, note: "D" }, { fret: 9, note: "E" },
      { fret: 10, note: "F" }, { fret: 12, note: "G" },
    ],
  },
  {
    name: "2nd — B", open: "B", color: "#60a5fa",
    notes: [
      { fret: 0, note: "B" }, { fret: 1, note: "C" }, { fret: 3, note: "D" },
      { fret: 5, note: "E" }, { fret: 6, note: "F" }, { fret: 8, note: "G" },
      { fret: 10, note: "A" }, { fret: 12, note: "B" },
    ],
  },
  {
    name: "1st — High E", open: "E", color: "#ef4444",
    notes: [
      { fret: 0, note: "E" }, { fret: 1, note: "F" }, { fret: 3, note: "G" },
      { fret: 5, note: "A" }, { fret: 7, note: "B" }, { fret: 8, note: "C" },
      { fret: 10, note: "D" }, { fret: 12, note: "E" },
    ],
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function NoteChip({ note, highlight }: { note: string; highlight?: boolean }) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.noteChip,
        {
          borderColor: highlight ? ACCENT : colors.border,
          backgroundColor: highlight ? ACCENT + "22" : colors.card,
        },
      ]}
    >
      <Text style={[styles.noteChipText, { color: highlight ? ACCENT : colors.mutedForeground }]}>
        {note}
      </Text>
    </View>
  );
}

function StringNotes({ row }: { row: StringRow }) {
  const colors = useColors();
  return (
    <View style={[styles.stringCard, { borderColor: colors.border, borderRadius: colors.radius }]}>
      <View style={[styles.stringHeader, { borderBottomColor: colors.border }]}>
        <View style={[styles.stringDot, { backgroundColor: row.color }]} />
        <Text style={[styles.stringName, { color: colors.foreground }]}>{row.name}</Text>
        <View style={[styles.openBadge, { borderColor: row.color + "88" }]}>
          <Text style={[styles.openText, { color: row.color }]}>Open: {row.open}</Text>
        </View>
      </View>
      <View style={styles.noteRow}>
        {row.notes.map(({ fret, note }) => (
          <View key={fret} style={styles.noteCell}>
            <Text style={[styles.fretNum, { color: DIM }]}>{fret}</Text>
            <NoteChip note={note} highlight={fret === 0 || fret === 12} />
          </View>
        ))}
      </View>
    </View>
  );
}

function HalfStepBox({ pair, reason }: { pair: string; reason: string }) {
  const colors = useColors();
  return (
    <View style={[styles.halfStepBox, { borderColor: "#f59e0b44", backgroundColor: "#f59e0b0a" }]}>
      <Text style={[styles.halfStepPair, { color: "#f59e0b" }]}>{pair}</Text>
      <Text style={[styles.halfStepReason, { color: colors.mutedForeground }]}>{reason}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function NaturalNotesLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Training · Fretboard"
      title="Mapping the Natural Notes"
      practiceHref="/drill/find-notes"
      practiceLabel="Drill this now — Find All Notes"
      intro={[
        "Before sharps and flats enter the picture, there are seven natural notes: A, B, C, D, E, F, and G. These repeat endlessly up and down the guitar neck. Knowing exactly where they sit on each string is the single most useful thing you can drill as a beginner.",
        "The good news: the pattern on the 6th string (low E) is identical to the 1st string (high E). Once you know two strings thoroughly, you already know two for free.",
      ]}
    >
      {/* ── The Seven Notes ── */}
      <View style={styles.section}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>THE SEVEN NATURAL NOTES</Text>
        <View style={[styles.sevenBox, { borderColor: ACCENT + "44", backgroundColor: ACCENT + "08" }]}>
          <View style={styles.sevenRow}>
            {["A", "B", "C", "D", "E", "F", "G"].map((n) => (
              <View key={n} style={[styles.sevenChip, { borderColor: ACCENT + "66" }]}>
                <Text style={[styles.sevenNote, { color: ACCENT }]}>{n}</Text>
              </View>
            ))}
          </View>
          <Text style={[styles.sevenHint, { color: colors.mutedForeground }]}>
            After G the sequence wraps back to A — it cycles forever.
          </Text>
        </View>
      </View>

      {/* ── Open Strings ── */}
      <View style={styles.section}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>OPEN STRINGS — YOUR ANCHOR POINTS</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Each open string is a named natural note. These six anchor points are your starting positions. Every other note on that string is measured from its open note.
        </Text>
        <View style={[styles.openStringsBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {[
            { str: "6th (Low E)", note: "E", color: "#ef4444" },
            { str: "5th (A)",     note: "A", color: "#f59e0b" },
            { str: "4th (D)",     note: "D", color: "#a78bfa" },
            { str: "3rd (G)",     note: "G", color: "#00FFD5" },
            { str: "2nd (B)",     note: "B", color: "#60a5fa" },
            { str: "1st (High E)",note: "E", color: "#ef4444" },
          ].map(({ str, note, color }) => (
            <View key={str} style={styles.openRow}>
              <View style={[styles.colorBar, { backgroundColor: color }]} />
              <Text style={[styles.openString, { color: colors.mutedForeground }]}>{str}</Text>
              <View style={[styles.openNoteBadge, { borderColor: color + "88", backgroundColor: color + "18" }]}>
                <Text style={[styles.openNoteText, { color }]}>{note}</Text>
              </View>
            </View>
          ))}
        </View>
        <Text style={[styles.tip, { color: colors.mutedForeground }]}>
          Memory hook: Every Brave Guitarist Discovers Alien Energy — reading from the 1st string (high E) to the 6th (low E): E B G D A E.
        </Text>
      </View>

      {/* ── String-by-string diagrams ── */}
      <View style={styles.section}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>NATURAL NOTES — FRET BY FRET</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Each card below shows where the natural notes land on that string. Frets 0 and 12 are highlighted — the open note and its octave are always the same pitch name.
        </Text>
        <View style={{ gap: 12 }}>
          {STRING_ROWS.map((row) => (
            <StringNotes key={row.name} row={row} />
          ))}
        </View>
      </View>

      {/* ── Half-step exceptions ── */}
      <View style={styles.section}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>THE TWO HALF-STEP PAIRS</Text>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Eleven of the twelve chromatic semitones have a sharp/flat between them. Two pairs are the exception — they sit just one fret apart with no note in between. These are the same gaps in Western music theory:
        </Text>
        <View style={{ gap: 10 }}>
          <HalfStepBox
            pair="E → F"
            reason="No sharp between E and F. On any string, if you're on E, the very next fret is F."
          />
          <HalfStepBox
            pair="B → C"
            reason="No sharp between B and C. On any string, if you're on B, the very next fret is C."
          />
        </View>
        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Once these two pairs are locked in, the rest of the fretboard makes sense automatically — every other natural note is two frets (one whole step) apart.
        </Text>
      </View>

      {/* ── Quick recap ── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Seven natural notes: A B C D E F G — then back to A.",
          "Open strings low to high: E A D G B E.",
          "At fret 12 every string repeats its open note, one octave up.",
          "E→F and B→C are just one fret apart — no sharp between them.",
          "6th and 1st strings are tuned to E — same pattern, two strings covered at once.",
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
  h2: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  tip: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 19, fontStyle: "italic" },

  sevenBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 10 },
  sevenRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  sevenChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  sevenNote: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  sevenHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  openStringsBox: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  openRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 9 },
  colorBar: { width: 3, height: 18, borderRadius: 2 },
  openString: { flex: 1, fontSize: 13.5, fontFamily: "Inter_500Medium" },
  openNoteBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 3 },
  openNoteText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },

  stringCard: { borderWidth: 1, overflow: "hidden" },
  stringHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1,
  },
  stringDot: { width: 8, height: 8, borderRadius: 4 },
  stringName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  openBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  openText: { fontSize: 11, fontFamily: "SpaceGrotesk_600SemiBold" },
  noteRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 10 },
  noteCell: { alignItems: "center", gap: 2 },
  fretNum: { fontSize: 9, fontFamily: "Inter_500Medium" },

  noteChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, minWidth: 28, alignItems: "center" },
  noteChipText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },

  halfStepBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  halfStepPair: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  halfStepReason: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
