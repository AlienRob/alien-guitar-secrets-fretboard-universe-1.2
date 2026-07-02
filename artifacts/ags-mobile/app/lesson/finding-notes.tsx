import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PhotoFretboard, type HighlightCell } from "@/components/photo-fretboard";
import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

// ─── Formula data ─────────────────────────────────────────────────────────────

// All examples use the note E (pc 4) across the fretboard.
// col 0 = low-E string, col 5 = high-E string (reverse of STRINGS array).
// Fret values verified against STRINGS open values:
//   col 0 = low-E,  open pc 4  (E)
//   col 1 = A,      open pc 9  (A) — E at fret 7
//   col 2 = D,      open pc 2  (D) — E at fret 2
//   col 3 = G,      open pc 7  (G) — E at fret 9
//   col 4 = B,      open pc 11 (B) — E at fret 5
//   col 5 = high-E, open pc 4  (E)

interface FormulaStep {
  string: number;  // col (0=low-E)
  fret: number;
  label: string;
}

interface FormulaAnim {
  steps: FormulaStep[][];  // each inner array is one "frame" (all cells lit at once per frame)
  frets: number;
  /**
   * Narration cue offsets in milliseconds — when to reveal each frame after
   * the user taps Play. Aligns with narration audio timestamps once voiceover
   * is added. Length must match steps.length (index 0 = first frame offset).
   */
  cueOffsets: number[];
}

// Each formula shows the octave relationship for the note E.
// cueOffsets: ms from Play press when each frame should appear.
// Frame 0 appears immediately (0ms). Frame 1 appears after the stated delay.
const FORMULA_ANIM: FormulaAnim[] = [
  // Formula 1 — same string, 12 frets up
  {
    frets: 12,
    cueOffsets: [0, 1400],
    steps: [
      [{ string: 0, fret: 0, label: "E" }],
      [{ string: 0, fret: 0, label: "E" }, { string: 0, fret: 12, label: "E" }],
    ],
  },
  // Formula 2 — 7 frets up, 1 string across (from low-E)
  {
    frets: 12,
    cueOffsets: [0, 1400],
    steps: [
      [{ string: 0, fret: 0, label: "E" }],
      [{ string: 0, fret: 0, label: "E" }, { string: 1, fret: 7, label: "E" }],
    ],
  },
  // Formula 3 — 8 frets up, 1 string across from 3rd (G) string
  {
    frets: 20,
    cueOffsets: [0, 1400],
    steps: [
      [{ string: 3, fret: 9, label: "E" }],
      [{ string: 3, fret: 9, label: "E" }, { string: 4, fret: 17, label: "E" }],
    ],
  },
  // Formula 4 — 2 frets up, 2 strings across (from low-E)
  {
    frets: 12,
    cueOffsets: [0, 1400],
    steps: [
      [{ string: 0, fret: 0, label: "E" }],
      [{ string: 0, fret: 0, label: "E" }, { string: 2, fret: 2, label: "E" }],
    ],
  },
  // Formula 5 — 3 frets up, 2 strings across (from D string)
  {
    frets: 12,
    cueOffsets: [0, 1400],
    steps: [
      [{ string: 2, fret: 2, label: "E" }],
      [{ string: 2, fret: 2, label: "E" }, { string: 4, fret: 5, label: "E" }],
    ],
  },
];

const ANIM_COLOUR = "#00ffd5";

// ─── FormulaFretboard ─────────────────────────────────────────────────────────
// Animation auto-starts on mount, timed by anim.cueOffsets. A "Play again"
// button lets the student replay at any time.

const AUTO_START_DELAY_MS = 400;

function FormulaFretboard({ anim }: { anim: FormulaAnim }) {
  const colors = useColors();
  const [frameIdx, setFrameIdx] = useState(-1); // -1 = pre-start (blank neck)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const mountedRef = useRef(true);

  const startAnimation = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setFrameIdx(0);
    anim.cueOffsets.forEach((offsetMs, i) => {
      if (i === 0) return;
      const t = setTimeout(() => {
        if (mountedRef.current) setFrameIdx(i);
      }, offsetMs);
      timersRef.current.push(t);
    });
  }, [anim]);

  useEffect(() => {
    mountedRef.current = true;
    const t = setTimeout(startAnimation, AUTO_START_DELAY_MS);
    return () => {
      mountedRef.current = false;
      clearTimeout(t);
      timersRef.current.forEach(clearTimeout);
    };
  }, [startAnimation]);

  const frame = frameIdx >= 0 ? anim.steps[frameIdx] : null;
  const highlights: HighlightCell[] = frame
    ? frame.map((s) => ({ string: s.string, fret: s.fret, colour: ANIM_COLOUR, label: s.label }))
    : [];

  return (
    <View>
      <PhotoFretboard
        pcInfo={{}}
        rootPitch={null}
        useSharps={true}
        frets={anim.frets}
        mode="display"
        readOnly={true}
        highlightCells={highlights}
      />
      <Pressable
        onPress={startAnimation}
        style={({ pressed }) => [
          styles.playBtn,
          { borderColor: colors.accent, opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <Text style={[styles.playBtnText, { color: colors.accent }]}>↺ Play again</Text>
      </Pressable>
    </View>
  );
}

// ─── Static formula data ──────────────────────────────────────────────────────

interface Formula {
  n: number;
  title: string;
  rule: string;
  strings: string;
  body: string;
}

const FORMULAS: Formula[] = [
  {
    n: 1,
    title: "Octaves on the same string",
    rule: "Up or down 12 frets",
    strings: "Every string",
    body: "The first formula has just one step, and it works on every string. The same note repeats exactly twelve frets higher (or lower) on the same string — that's one octave. If you're on the open 6th-string E, the next E is at the 12th fret of that same string.",
  },
  {
    n: 2,
    title: "One string across",
    rule: "Up 7 frets, across 1 string",
    strings: "6th, 5th, 4th & 2nd strings",
    body: "To jump to the next string, move up seven frets and across one string. From the 1st-fret E on the 6th string, go to the 7th fret of the 5th string — same note, one octave up. This works from the 6th, 5th, 4th and 2nd strings (not the 3rd or 1st — that's what the next formula fixes).",
  },
  {
    n: 3,
    title: "Crossing off the 3rd string",
    rule: "Up 8 frets, across 1 string",
    strings: "3rd string only",
    body: "Here's the one anomaly. The 2nd (B) string is tuned a major third above the 3rd (G) string instead of a fourth, so every note shifts up one fret. From the 3rd string you move up eight frets and across one string. From the 9th-fret E on the 3rd string, the octave is at the 17th fret of the 2nd string.",
  },
  {
    n: 4,
    title: "Two strings across",
    rule: "Up 2 frets, across 2 strings",
    strings: "6th & 5th strings",
    body: "The fourth and fifth formulas jump two strings at once, which drops the octave neatly under your hand — perfect for seeing the root inside a chord shape. From the 6th and 5th strings, move up two frets and across two strings. The open 6th-string E becomes the E at the 2nd fret of the 4th string.",
  },
  {
    n: 5,
    title: "Two strings across the 3rd",
    rule: "Up 3 frets, across 2 strings",
    strings: "4th & 3rd strings",
    body: "The final formula crosses that 3rd-string gap again, so it needs one extra fret: up three frets and across two strings. From the 2nd-fret E on the 4th string you land on the 5th-fret E of the 2nd string. And that's it — five formulas that locate any note's octave anywhere on the neck.",
  },
];

const RECAP = [
  "Same string — up or down 12 frets.",
  "Strings 6, 5, 4 & 2 — up 7 frets, across 1 string.",
  "From the 3rd string — up 8 frets, across 1 string.",
  "Strings 6 & 5 — up 2 frets, across 2 strings.",
  "Strings 4 & 3 — up 3 frets, across 2 strings.",
];

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FindingNotesLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Training · Fretboard"
      title="Finding the Notes: The Five Formulas"
      practiceHref="/drill/find-notes"
      practiceLabel="Drill this now — Find All Notes"
      intro={[
        "Knowing where every note lives on the neck is the foundation of real fretboard freedom. Most guitarists guess — but you don't have to. Rob's system breaks the whole fretboard down into five simple octave formulas. Memorise these and you can find any note, anywhere.",
        "The idea is octaves: the same note repeats in many places across the strings. Each formula is a little shape that takes you from a note to its next octave. Two facts make them tick — every fret is one semitone, and the guitar is tuned in fourths except the 2nd (B) string, which sits a major third above the 3rd (G) string. That single quirk is why a couple of the formulas need an extra fret.",
      ]}
    >
      <View style={{ gap: 6 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>THE FIVE FORMULAS</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Each fretboard panel animates the octave formula for the note E. The highlighted dot
          moves from the source position to its octave. Work through each one on your guitar.
        </Text>
      </View>

      <View style={{ gap: 18 }}>
        {FORMULAS.map((f, i) => (
          <View key={f.n} style={[styles.card, { borderColor: colors.border, borderRadius: colors.radius }]}>
            <View style={[styles.cardHead, { borderBottomColor: colors.border }]}>
              <View style={[styles.numBadge, { borderColor: colors.accent }]}>
                <Text style={[styles.numText, { color: colors.accent }]}>{f.n}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>{f.title}</Text>
                <Text style={[styles.cardStrings, { color: colors.mutedForeground }]}>{f.strings.toUpperCase()}</Text>
              </View>
            </View>
            <View style={{ padding: 14, gap: 12 }}>
              <View style={[styles.rulePill, { borderColor: colors.border }]}>
                <Text style={[styles.ruleText, { color: "#00FFD5" }]}>{f.rule}</Text>
              </View>

              <View style={[styles.fretboardWrap, { borderColor: colors.border, borderRadius: 8 }]}>
                <Text style={[styles.fretboardLabel, { color: colors.mutedForeground }]}>
                  Live example (note: E)
                </Text>
                <FormulaFretboard anim={FORMULA_ANIM[i]} />
              </View>

              <Text style={[styles.body, { color: colors.mutedForeground }]}>{f.body}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {RECAP.map((r, i) => (
          <View key={i} style={styles.recapRow}>
            <Text style={[styles.recapNum, { color: "#00FFD5" }]}>{i + 1}.</Text>
            <Text style={[styles.recapText, { color: colors.mutedForeground }]}>{r}</Text>
          </View>
        ))}
        <Text style={[styles.recapNote, { color: colors.mutedForeground }]}>
          Spend five minutes at the start of each session finding one note's octaves all over the neck. Pick a different
          note each day, and within a few weeks the whole fretboard lights up.
        </Text>
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  note: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 19 },
  card: { borderWidth: 1, overflow: "hidden" },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1 },
  numBadge: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  numText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  cardTitle: { fontSize: 15.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  cardStrings: { fontSize: 10.5, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginTop: 2 },
  rulePill: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  ruleText: { fontSize: 12.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  fretboardWrap: {
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 8,
  },
  fretboardLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    textAlign: "center",
    paddingBottom: 4,
  },
  body: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
  recapNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 19, marginTop: 8 },
  playBtn: {
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginTop: 6,
    marginBottom: 4,
  },
  playBtnText: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold" },
});
