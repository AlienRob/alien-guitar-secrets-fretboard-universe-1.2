import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import MiniNeck from "@/components/mini-neck";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const TEAL   = "#00FFD5";
const AMBER  = "#f59e0b";
const PINK   = "#FF6B9D";
const GREEN  = "#A8FF3E";
const PURPLE = "#a78bfa";
const GRAY   = "#6b7280";

// A harmonic minor: A B C D E F G# — pitch classes [9,11,0,2,4,5,8]
const HM_PITCHES = [9, 11, 0, 2, 4, 5, 8];
const NECK_START = 4;
const NECK_END   = 10;

// ── Shared sub-components ─────────────────────────────────────────────────────

function H2({ text, color = TEAL }: { text: string; color?: string }) {
  return <Text style={[styles.h2, { color }]}>{text}</Text>;
}

function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

function Callout({ children, color = TEAL }: { children: string; color?: string }) {
  return (
    <View style={[styles.callout, { borderLeftColor: color, backgroundColor: color + "15" }]}>
      <Text style={[styles.calloutText, { color }]}>{children}</Text>
    </View>
  );
}

function ModeCard({
  num, name, formula, chord, sound, color, rootPitch,
}: {
  num: string; name: string; formula: string; chord: string;
  sound: string; color: string; rootPitch: number;
}) {
  const colors = useColors();
  return (
    <View style={[styles.modeCard, { borderColor: color + "55", backgroundColor: color + "0D" }]}>
      <View style={styles.modeHeader}>
        <Text style={[styles.modeNum, { color }]}>{num}</Text>
        <Text style={[styles.modeName, { color }]}>{name}</Text>
      </View>
      <Text style={[styles.modeFormula, { color: colors.foreground }]}>{formula}</Text>
      <View style={styles.neckWrap}>
        <MiniNeck
          rootPitch={rootPitch}
          scalePitches={HM_PITCHES}
          startFret={NECK_START}
          endFret={NECK_END}
          color={color}
        />
      </View>
      <Text style={[styles.modeChord, { color }]}>{chord}</Text>
      <Text style={[styles.modeSound, { color: colors.mutedForeground }]}>{sound}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ModesHarmonicMinorLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();
  useEffect(() => { markLessonViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LessonLayout
      kicker="Scales · Modes"
      title="Modes of the Harmonic Minor"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "The harmonic minor scale is the natural minor with one change — the 7th degree is raised by a semitone. That small shift creates a powerful leading tone, dramatic tension, and a distinctive sound used in classical music, flamenco, and metal.",
        "Like the major scale, the harmonic minor generates seven modes — each with its own harmonic function and character.",
      ]}
    >
      {/* ── WHAT IS HARMONIC MINOR ───────────────────── */}
      <View style={styles.section}>
        <H2 text="WHAT IS THE HARMONIC MINOR SCALE?" />
        <Body>
          {"In natural minor (Aeolian), the chord built on the 5th degree is a minor chord — a weak dominant. When you raise the 7th degree by a semitone, that chord becomes major, creating a much stronger pull back to the home chord (i). This is the purpose of the harmonic minor scale: powerful harmonic resolution."}
        </Body>
        <Callout color={TEAL}>
          {"Natural Minor (Aeolian):\nA – B – C – D – E – F – G – A\n1 – 2 – ♭3 – 4 – 5 – ♭6 – ♭7 – 8\n\nHarmonic Minor:\nA – B – C – D – E – F – G♯ – A\n1 – 2 – ♭3 – 4 – 5 – ♭6 – ♯7 – 8\n\nOnly the 7th changes — but the sound shifts dramatically."}
        </Callout>
        <Body>
          {"The raised 7th also creates an augmented 2nd (a step-and-a-half gap) between the ♭6 and ♯7 — F to G♯ in A minor. That interval is the most recognisable sound of classical cadenzas, flamenco, and Middle Eastern music. Bach, Beethoven, and Mozart used this scale extensively."}
        </Body>
      </View>

      {/* ── THE SEVEN MODES ──────────────────────────── */}
      <View style={styles.section}>
        <H2 text="THE SEVEN MODES (IN A HARMONIC MINOR)" />
        <Body>
          {"Just like the major scale, you get seven modes by starting on each degree of A harmonic minor. Each mode has its own character and harmonic function. Fret diagrams show frets 4–10 in A."}
        </Body>
        <ModeCard
          num="1" name="A Harmonic Minor" color={TEAL} rootPitch={9}
          formula="1 – 2 – ♭3 – 4 – 5 – ♭6 – ♯7 – 8"
          chord="Chord: A min  /  A min(maj7)"
          sound="Dark and dramatic. The parent scale — classical tension with that distinctive raised 7th."
        />
        <ModeCard
          num="2" name="B Locrian ♯6" color={PINK} rootPitch={11}
          formula="1 – ♭2 – ♭3 – 4 – ♭5 – ♯6 – ♭7 – 8"
          chord="Chord: B dim  /  B min7♭5"
          sound="Unstable. The ♯6 lifts it slightly from pure Locrian darkness but it remains dissonant."
        />
        <ModeCard
          num="3" name="C Ionian ♯5" color={AMBER} rootPitch={0}
          formula="1 – 2 – 3 – 4 – ♯5 – 6 – 7 – 8"
          chord="Chord: C aug  /  C maj7♯5"
          sound="Bright but unsettled. The augmented 5th creates an eerie, floating quality."
        />
        <ModeCard
          num="4" name="D Dorian ♯4" color={TEAL} rootPitch={2}
          formula="1 – 2 – ♭3 – ♯4 – 5 – 6 – ♭7 – 8"
          chord="Chord: D min  /  D dim(♯11)"
          sound="Dorian with a sharp 4th — adds a Lydian brightness to an otherwise minor scale."
        />
        <ModeCard
          num="5" name="E Phrygian Dominant" color={GREEN} rootPitch={4}
          formula="1 – ♭2 – ♯3 – 4 – 5 – ♭6 – ♭7 – 8"
          chord="Chord: E maj  /  E dom7"
          sound="The most used mode of the harmonic minor. Spanish, flamenco, metal. The ♭2 + major 3rd is unmistakable."
        />
        <ModeCard
          num="6" name="F Lydian ♯2" color={PURPLE} rootPitch={5}
          formula="1 – ♯2 – 3 – ♯4 – 5 – 6 – 7 – 8"
          chord="Chord: F maj  /  F min(maj7)"
          sound="Lydian with a raised 2nd — exotic and dreamy. Two augmented intervals in one scale."
        />
        <ModeCard
          num="7" name="G♯ Super Locrian" color={GRAY} rootPitch={8}
          formula="1 – ♭2 – ♭3 – ♭4 – ♭5 – ♭6 – ♭♭7 – 8"
          chord="Chord: G♯ dim  /  G♯ dim7"
          sound="Also called the Altered Dominant. Maximum tension — nearly every degree is flattened."
        />
      </View>

      {/* ── TRIAD CHORD TABLE ────────────────────────── */}
      <View style={styles.section}>
        <H2 text="TRIADS FROM EACH MODE" />
        <Body>
          {"Take the 1st, 3rd, and 5th of each mode for the basic triad. Note that C Ionian ♯5 produces an augmented chord — something that does not appear at all in the major scale modes."}
        </Body>
        <View style={[styles.table, { borderColor: TEAL + "33" }]}>
          <View style={[styles.tableHeaderRow, { backgroundColor: TEAL + "22" }]}>
            <Text style={[styles.col, { color: TEAL, flex: 2 }]}>Mode</Text>
            <Text style={[styles.col, { color: TEAL }]}>Triad</Text>
            <Text style={[styles.col, { color: TEAL }]}>Notes</Text>
            <Text style={[styles.col, { color: TEAL }]}>Degrees</Text>
          </View>
          {[
            { mode: "A Harmonic Minor",  triad: "A min",  notes: "A C E",    deg: "1 ♭3 5",  color: TEAL  },
            { mode: "B Locrian ♯6",      triad: "B dim",  notes: "B D F",    deg: "1 ♭3 ♭5", color: PINK  },
            { mode: "C Ionian ♯5",       triad: "C aug",  notes: "C E G♯",   deg: "1 3 ♯5",  color: AMBER },
            { mode: "D Dorian ♯4",       triad: "D min",  notes: "D F A",    deg: "1 ♭3 5",  color: TEAL  },
            { mode: "E Phrygian Dom",    triad: "E maj",  notes: "E G♯ B",   deg: "1 ♯3 5",  color: GREEN },
            { mode: "F Lydian ♯2",       triad: "F maj",  notes: "F A C",    deg: "1 3 5",   color: GREEN },
            { mode: "G♯ Super Locrian",  triad: "G♯ dim", notes: "G♯ B D",   deg: "1 ♭3 ♭5", color: PINK  },
          ].map((r, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? { backgroundColor: TEAL + "08" } : {}]}>
              <Text style={[styles.col, { color: colors.mutedForeground, flex: 2 }]}>{r.mode}</Text>
              <Text style={[styles.col, { color: r.color }]}>{r.triad}</Text>
              <Text style={[styles.col, { color: colors.foreground }]}>{r.notes}</Text>
              <Text style={[styles.col, { color: colors.mutedForeground, fontSize: 10 }]}>{r.deg}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── EXTENDED CHORD TABLE ─────────────────────── */}
      <View style={styles.section}>
        <H2 text="EXTENDED CHORDS (7THS)" />
        <Body>
          {"Add the 7th degree to each triad and the harmonic colours become even richer — these are the voicings that make harmonic minor modes genuinely useful in real playing."}
        </Body>
        <View style={[styles.table, { borderColor: AMBER + "33" }]}>
          <View style={[styles.tableHeaderRow, { backgroundColor: AMBER + "22" }]}>
            <Text style={[styles.col, { color: AMBER, flex: 2 }]}>Mode</Text>
            <Text style={[styles.col, { color: AMBER, flex: 2 }]}>Extended Chord</Text>
            <Text style={[styles.col, { color: AMBER, flex: 2 }]}>Notes</Text>
          </View>
          {[
            { mode: "A Harmonic Minor", ext: "A min(maj7)",     notes: "A C E G♯",   color: TEAL  },
            { mode: "B Locrian ♯6",     ext: "B min7♭5/♯13",   notes: "B D F A G♯", color: PINK  },
            { mode: "C Ionian ♯5",      ext: "C maj7/♯5",      notes: "C E G♯",     color: AMBER },
            { mode: "D Dorian ♯4",      ext: "D dim/♯11",      notes: "D F G♯ A",   color: TEAL  },
            { mode: "E Phrygian Dom",   ext: "E dom7",          notes: "E G♯ B D",   color: GREEN },
            { mode: "F Lydian ♯2",      ext: "F min(maj7)",     notes: "F G♯ C E",   color: GREEN },
            { mode: "G♯ Super Locrian", ext: "G♯ dim7",         notes: "G♯ B D F",   color: PINK  },
          ].map((r, i) => (
            <View key={i} style={[styles.tableRow, i % 2 === 0 ? { backgroundColor: AMBER + "08" } : {}]}>
              <Text style={[styles.col, { color: colors.mutedForeground, flex: 2 }]}>{r.mode}</Text>
              <Text style={[styles.col, { color: r.color, flex: 2 }]}>{r.ext}</Text>
              <Text style={[styles.col, { color: colors.foreground, flex: 2 }]}>{r.notes}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── PHRYGIAN DOMINANT SPOTLIGHT ──────────────── */}
      <View style={styles.section}>
        <H2 text="SPOTLIGHT: PHRYGIAN DOMINANT" color={GREEN} />
        <Body>
          {"Mode 5 — E Phrygian Dominant — is the standout mode of the harmonic minor. It sits on the 5th degree and produces a major chord, giving you the strong dominant-to-tonic resolution the scale was designed for."}
        </Body>
        <Body>
          {"The combination of ♭2 and major 3rd (1 – ♭2 – ♯3 – 4 – 5 – ♭6 – ♭7) is the sound of Spanish flamenco, classical cadenzas, and heavy metal riffing all at once."}
        </Body>
        <Callout color={GREEN}>
          {"In A minor: the V chord is E major. Play E Phrygian Dominant over it and resolve to A minor. That tension-then-release is the heart of classical harmony — and one of the most powerful sounds on the guitar."}
        </Callout>
      </View>

      {/* ── HOW TO PRACTICE ──────────────────────────── */}
      <View style={styles.section}>
        <H2 text="HOW TO PRACTICE THESE" />
        <Body>
          {"Learn the shapes the same way you approached the major scale modes: start in A minor (no confusing alterations to juggle), then move to other keys. Always practice against a backing track — you need to hear how each mode functions over its chord."}
        </Body>
        <Callout color={TEAL}>
          {"Start with Mode 1 (A Harmonic Minor) and Mode 5 (Phrygian Dominant). Get those two under your fingers and into your ear first. Then explore the others one at a time."}
        </Callout>
      </View>

      {/* ── RECAP ────────────────────────────────────── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Harmonic minor = natural minor with the 7th degree raised by a semitone.",
          "The raised 7th creates a leading tone — a major V chord in a minor key for stronger resolution.",
          "The augmented 2nd interval (♭6 to ♯7) is the defining sound of classical and flamenco.",
          "Seven modes — the most important is Mode 5, Phrygian Dominant (Spanish, flamenco, metal).",
          "Augmented chords appear here (C Ionian ♯5) — they don't exist in major scale modes.",
          "Practice with backing tracks. Always hear the mode in context of its chord.",
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
  section:  { gap: 12 },
  h2:       { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body:     { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  callout:  { borderLeftWidth: 3, borderRadius: 8, padding: 14 },
  calloutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  modeCard:    { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  modeHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  modeNum:     { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", width: 20 },
  modeName:    { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  modeFormula: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modeChord:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modeSound:   { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  neckWrap:    { marginTop: 4, marginBottom: 2 },
  table:    { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  tableHeaderRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8 },
  tableRow:       { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 8 },
  col:      { flex: 1, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  recap:    { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText:{ flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
