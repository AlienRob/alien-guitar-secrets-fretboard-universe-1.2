import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import MiniNeck from "@/components/mini-neck";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const PURPLE = "#a78bfa";
const TEAL   = "#00FFD5";
const AMBER  = "#f59e0b";
const PINK   = "#FF6B9D";
const GREEN  = "#A8FF3E";
const ORANGE = "#FF6B35";
const GRAY   = "#6b7280";

const C_MAJOR_PITCHES = [0, 2, 4, 5, 7, 9, 11];
const NECK_START = 7;
const NECK_END   = 12;

// ── Shared sub-components ─────────────────────────────────────────────────────

function H2({ text, color = PURPLE }: { text: string; color?: string }) {
  return <Text style={[styles.h2, { color }]}>{text}</Text>;
}

function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

function Callout({ children, color = PURPLE }: { children: string; color?: string }) {
  return (
    <View style={[styles.callout, { borderLeftColor: color, backgroundColor: color + "15" }]}>
      <Text style={[styles.calloutText, { color }]}>{children}</Text>
    </View>
  );
}

function ModeCard({
  num, name, formula, diff, color, rootPitch,
}: {
  num: string; name: string; formula: string; diff: string;
  color: string; rootPitch: number;
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
          scalePitches={C_MAJOR_PITCHES}
          startFret={NECK_START}
          endFret={NECK_END}
          color={color}
        />
      </View>
      <Text style={[styles.modeDiff, { color: colors.mutedForeground }]}>{diff}</Text>
    </View>
  );
}

function NoteRow({ label, notes }: { label: string; notes: string[] }) {
  const colors = useColors();
  return (
    <View style={styles.noteRow}>
      <Text style={[styles.noteRowLabel, { color: PURPLE }]}>{label}</Text>
      <View style={styles.noteRowCells}>
        {notes.map((n, i) => (
          <View key={i} style={[styles.noteCell, { borderColor: PURPLE + "44", backgroundColor: PURPLE + "10" }]}>
            <Text style={[styles.noteCellText, { color: colors.foreground }]}>{n}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function ChordTableRow({ mode, chord, numeral, color }: {
  mode: string; chord: string; numeral: string; color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.chordRow}>
      <Text style={[styles.chordCol, { color: colors.mutedForeground, flex: 2 }]}>{mode}</Text>
      <Text style={[styles.chordCol, { color }]}>{chord}</Text>
      <Text style={[styles.chordCol, { color }]}>{numeral}</Text>
    </View>
  );
}

function ProgBlock({ mode, lines, color }: { mode: string; lines: string[]; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.progBlock, { borderColor: color + "44", backgroundColor: color + "0D" }]}>
      <Text style={[styles.progMode, { color }]}>{mode}</Text>
      {lines.map((l, i) => (
        <Text key={i} style={[styles.progLine, { color: colors.mutedForeground }]}>{l}</Text>
      ))}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ModesMajorLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();
  useEffect(() => { markLessonViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LessonLayout
      kicker="Scales · Modes"
      title="Modes of the Major Scale"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "The modes of the major scale are seven different scales built from the same seven notes — only the starting note changes. That one shift transforms the mood completely.",
        "Rob's approach: understand where modes come from, learn to hear the personality of each one, then apply them through chord progressions and real musical situations.",
      ]}
    >
      {/* ── WHAT ARE MODES ───────────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHAT ARE THE MODES?" />
        <Body>
          {"All seven modes in a given key use the exact same notes as the parent major scale. Only the starting note — and therefore the interval sequence — changes. That shift changes the mood and sound of the scale entirely."}
        </Body>
        <Callout color={PURPLE}>
          {"In C Major, all seven modes use the notes C D E F G A B. Which note you treat as \"home\" is what changes everything."}
        </Callout>
      </View>

      {/* ── A BRIEF HISTORY ──────────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHERE DO THE NAMES COME FROM?" />
        <Body>
          {"The modal names come from ancient Greek tribes. Greek philosophers — Pythagoras, Plato, Aristoxenus — laid the foundation for all of Western music theory. Pythagoras studied string lengths and vibrations, developing the harmonic principles that still underpin everything we play. The word \"music\" itself comes from the Greek Muses."}
        </Body>
      </View>

      {/* ── MNEMONIC ─────────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="MODE NAMES & ORDER" />
        <Body>{"Memorise the seven modes in sequence using Rob's mnemonic:"}</Body>
        <Callout color={AMBER}>
          {"\"I Do Particularly Like Modes A Lot\"\n\n1 – Ionian\n2 – Dorian\n3 – Phrygian\n4 – Lydian\n5 – Mixolydian\n6 – Aeolian\n7 – Locrian"}
        </Callout>
      </View>

      {/* ── MAJOR SCALE ──────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="THE PARENT SCALE — IONIAN MAJOR" />
        <Body>
          {"All modes are built from the major scale. Its interval sequence is the blueprint every other mode is measured against. You know it as Do–Re–Mi–Fa–Sol–La–Ti–Do."}
        </Body>
        <Callout color={GREEN}>
          {"Formula:  W – W – H – W – W – W – H\n(W = whole step, H = half step / semitone)\n\nC major:  C – D – E – F – G – A – B – C\nDegrees:  1 – 2 – 3 – 4 – 5 – 6 – 7 – 8"}
        </Callout>
        <Body>
          {"To get any other mode: keep those same seven notes and start — and finish — on a different degree. The interval sequence shifts, and so does the sound."}
        </Body>
      </View>

      {/* ── THE SEVEN MODES ──────────────────────────── */}
      <View style={styles.section}>
        <H2 text="THE SEVEN MODES IN C MAJOR" />
        <Body>
          {"Each mode starts on its root degree of C Major. Below: its notes, formula, fret positions (frets 7–12), and how it differs from a plain major scale. Root notes are highlighted in each mode's colour."}
        </Body>
        <ModeCard
          num="1" name="Ionian (Major)" color={GREEN} rootPitch={0}
          formula="C D E F G A B  —  1  2  3  4  5  6  7"
          diff="The parent scale. The reference all other modes are compared against."
        />
        <ModeCard
          num="2" name="Dorian" color={TEAL} rootPitch={2}
          formula="D E F G A B C  —  1  2  ♭3  4  5  6  ♭7"
          diff="Minor feel. 3rd and 7th are flat. The raised 6th (vs Aeolian) gives it a brighter, jazzier quality."
        />
        <ModeCard
          num="3" name="Phrygian" color={PINK} rootPitch={4}
          formula="E F G A B C D  —  1  ♭2  ♭3  4  5  ♭6  ♭7"
          diff="Dark and Spanish. 2nd, 3rd, 6th, and 7th all flat. The ♭2 is the defining sound — instantly exotic."
        />
        <ModeCard
          num="4" name="Lydian" color={AMBER} rootPitch={5}
          formula="F G A B C D E  —  1  2  3  ♯4  5  6  7"
          diff="Bright and dreamy. Only the 4th is raised. One note from major, but that ♯4 sounds floating and spacious."
        />
        <ModeCard
          num="5" name="Mixolydian" color={ORANGE} rootPitch={7}
          formula="G A B C D E F  —  1  2  3  4  5  6  ♭7"
          diff="Major with a blues edge. Only the 7th is flat. Used constantly in rock, blues, and funk."
        />
        <ModeCard
          num="6" name="Aeolian (Natural Minor)" color={PURPLE} rootPitch={9}
          formula="A B C D E F G  —  1  2  ♭3  4  5  ♭6  ♭7"
          diff="The relative minor. 3rd, 6th, and 7th all flat. Darker and more melancholic than Dorian."
        />
        <ModeCard
          num="7" name="Locrian" color={GRAY} rootPitch={11}
          formula="B C D E F G A  —  1  ♭2  ♭3  4  ♭5  ♭6  ♭7"
          diff="Unstable and dissonant. Five degrees flat, including the 5th. Used in metal and jazz for maximum tension."
        />
      </View>

      {/* ── TABLE OF MODES ───────────────────────────── */}
      <View style={styles.section}>
        <H2 text="ALL MODES AT A GLANCE" />
        <Body>{"Every mode in C Major — same notes, different roots:"}</Body>
        <View style={[styles.noteTable, { borderColor: PURPLE + "33" }]}>
          <NoteRow label="1 – C Ionian"     notes={["C","D","E","F","G","A","B","C"]} />
          <NoteRow label="2 – D Dorian"     notes={["D","E","F","G","A","B","C","D"]} />
          <NoteRow label="3 – E Phrygian"   notes={["E","F","G","A","B","C","D","E"]} />
          <NoteRow label="4 – F Lydian"     notes={["F","G","A","B","C","D","E","F"]} />
          <NoteRow label="5 – G Mixolydian" notes={["G","A","B","C","D","E","F","G"]} />
          <NoteRow label="6 – A Aeolian"    notes={["A","B","C","D","E","F","G","A"]} />
          <NoteRow label="7 – B Locrian"    notes={["B","C","D","E","F","G","A","B"]} />
        </View>
      </View>

      {/* ── MODES ARE A FAMILY ───────────────────────── */}
      <View style={styles.section}>
        <H2 text="MODES ARE A FAMILY" />
        <Body>
          {"Because every mode in C Major uses the same seven notes, they form a family. Allan Holdsworth described seeing all the modes of a key as one big scale across the entire neck — shapes melting together. That is the end goal: not seven separate patterns, but one connected framework."}
        </Body>
        <Callout color={TEAL}>
          {"Seven family members — same DNA, different personalities."}
        </Callout>
      </View>

      {/* ── WHY PRACTICE ─────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHY PRACTICE THE MODES?" />
        <Body>
          {"Knowing the modes gives you purposeful navigation of the fretboard — both for soloing and for writing chord progressions. Without them, you're limited to pentatonic shapes and hoping for the best. With them, you can hear what a song is doing and respond with intention."}
        </Body>
        <Body>
          {"Rob recommends learning everything first in C Major — no sharps or flats to distract you. Get comfortable writing them out and playing them. Then duplicate the process in other keys."}
        </Body>
      </View>

      {/* ── CAGED vs 3NPS ────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="CAGED vs. 3 NOTES PER STRING" />
        <Body>
          {"Two ways to learn modal positions on the neck. Rob prefers the Three Note Per String (3NPS) method for modal playing, for three reasons:"}
        </Body>
        <Callout color={AMBER}>
          {"1. Uniformity — each mode gets its own clear shape, easy to isolate and recognise.\n\n2. Efficiency — the consistent 3-notes-per-string layout is faster to memorise.\n\n3. Connection — shapes link naturally into a full-neck framework."}
        </Callout>
        <Body>
          {"CAGED overlaps positions from the parent major scale, making it harder to isolate a single mode by ear. That said, learning both systems will only benefit you in the long run."}
        </Body>
      </View>

      {/* ── WHY HARD TO HEAR ─────────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHY IS IT HARD TO HEAR THE DIFFERENCES?" />
        <Body>{"Three reasons most students can't distinguish modes by ear at first:"}</Body>
        <Callout color={PINK}>
          {"1. You learn them all in one key — so C sounds like \"home\" no matter which mode you play.\n\n2. You play them like scales — going up and down without phrasing or melody.\n\n3. You haven't connected them to moods — modes need to be felt, not just fingered."}
        </Callout>
        <Body>
          {"The fix: stop playing modes as scale runs. Use backing tracks, learn chord progressions for each mode, and start making melody. That is when the sound clicks."}
        </Body>
      </View>

      {/* ── MODES IN OTHER KEYS ──────────────────────── */}
      <View style={styles.section}>
        <H2 text="MODES IN ANY KEY" />
        <Body>
          {"The same principles apply in any key. To play E Ionian, apply the major scale formula (W–W–H–W–W–W–H) starting on E. The notes change; the sound stays the same. To play E Dorian, use the notes of D Major starting on E."}
        </Body>
        <Callout color={GREEN}>
          {"E Ionian     E F♯ G♯ A B C♯ D♯ E\nE Dorian     E F♯ G  A B C♯ D  E\nE Phrygian   E F  G  A B C  D  E\nE Lydian     E F♯ G♯ A♯ B C♯ D♯ E\nE Mixolydian E F♯ G♯ A B C♯ D  E\nE Aeolian    E F♯ G  A B C  D  E\nE Locrian    E F  G  A B♭ C  D  E"}
        </Callout>
      </View>

      {/* ── SINGING PRACTICE ─────────────────────────── */}
      <View style={styles.section}>
        <H2 text="MODAL SINGING PRACTICE" />
        <Body>
          {"Singing the modes as you play is one of the highest-leverage habits you can build. The greatest guitarists hear notes before their fingers find them — that inner ear is developed by singing."}
        </Body>
        <Body>
          {"Try this: sing an E major scale until it's comfortable. Now raise the 4th degree a semitone — you're singing E Lydian. Only one note changed, but the flavour shifts completely. Flatten the 7th instead and you have E Mixolydian."}
        </Body>
      </View>

      {/* ── PITCH AXIS THEORY ────────────────────────── */}
      <View style={styles.section}>
        <H2 text="PITCH AXIS THEORY (JOE SATRIANI)" />
        <Body>
          {"Pitch Axis Theory: keep the same root note — the \"axis\" — and change which mode you're playing over it. The root stays fixed; the mode and parent key both shift. Because the drone always pulls the ear back to the same note, you hear the mood change dramatically."}
        </Body>
        <Callout color={AMBER}>
          {"Exercise: record or loop an open low E. Then play each mode below, keeping E as your root. Listen to how the same note becomes a completely different world:\n\nE Ionian     E F♯ G♯ A B C♯ D♯ E\nE Dorian     E F♯ G  A B C♯ D  E\nE Phrygian   E F  G  A B C  D  E\nE Lydian     E F♯ G♯ A♯ B C♯ D♯ E\nE Mixolydian E F♯ G♯ A B C♯ D  E\nE Aeolian    E F♯ G  A B C  D  E\nE Locrian    E F  G  A B♭ C  D  E"}
        </Callout>
        <Body>
          {"After your mind is blown, try putting down an E major chord and soloing with a major mode (Ionian, Lydian, or Mixolydian). Then switch to E minor and shift to a minor mode (Dorian, Phrygian, or Aeolian). That is Pitch Axis in action."}
        </Body>
      </View>

      {/* ── MODAL CHORDS ─────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="CHORDS FROM MODES" />
        <Body>
          {"Take the 1st, 3rd, and 5th of each modal scale to get the triad. From C Major, the seven modal chords are:"}
        </Body>
        <View style={[styles.chordTable, { borderColor: PURPLE + "44" }]}>
          <View style={[styles.chordTableHeader, { backgroundColor: PURPLE + "22" }]}>
            <Text style={[styles.chordCol, { color: PURPLE, flex: 2 }]}>Mode</Text>
            <Text style={[styles.chordCol, { color: PURPLE }]}>Type</Text>
            <Text style={[styles.chordCol, { color: PURPLE }]}>Symbol</Text>
          </View>
          <ChordTableRow mode="I – C Ionian"     chord="Major"      numeral="I"    color={GREEN} />
          <ChordTableRow mode="II – D Dorian"    chord="Minor"      numeral="ii"   color={TEAL}  />
          <ChordTableRow mode="III – E Phrygian" chord="Minor"      numeral="iii"  color={TEAL}  />
          <ChordTableRow mode="IV – F Lydian"    chord="Major"      numeral="IV"   color={GREEN} />
          <ChordTableRow mode="V – G Mixolydian" chord="Major"      numeral="V"    color={GREEN} />
          <ChordTableRow mode="VI – A Aeolian"   chord="Minor"      numeral="vi"   color={TEAL}  />
          <ChordTableRow mode="VII – B Locrian"  chord="Diminished" numeral="vii°" color={PINK}  />
        </View>
        <Body>
          {"Capital Roman numerals = major chords. Lowercase = minor. The sequence I–ii–iii–IV–V–vi–vii° is the harmonised major scale — the backbone of most Western music."}
        </Body>
      </View>

      {/* ── MODAL PROGRESSIONS ───────────────────────── */}
      <View style={styles.section}>
        <H2 text="MODAL CHORD PROGRESSIONS" />
        <Body>
          {"Learning progressions for each mode is what makes them musical, not just theoretical. These are Rob's starting-point examples — experiment freely from here."}
        </Body>
        <ProgBlock mode="Ionian"     color={GREEN}  lines={["I – IV – vi – V", "I – ii – IV – V", "I – V – vi – IV"]} />
        <ProgBlock mode="Dorian"     color={TEAL}   lines={["i – IV – i – VII", "i – VII – i – VII", "i – III – IV – i – VII"]} />
        <ProgBlock mode="Phrygian"   color={PINK}   lines={["i – II – III – i", "i – V7 – i – II – i", "i – iv – i – II – i"]} />
        <ProgBlock mode="Lydian"     color={AMBER}  lines={["I – II – I – II", "I – vi – II – V – I", "I – V – I – II – I"]} />
        <ProgBlock mode="Mixolydian" color={ORANGE} lines={["I – VII – I – VII", "I – IV – I – VII – I", "I – ii – IV – VII – I"]} />
        <ProgBlock mode="Aeolian"    color={PURPLE} lines={["i – VI – VII – i", "i – iv – v – i", "i – III – i – VII – i"]} />
        <ProgBlock mode="Locrian"    color={GRAY}   lines={["i° – V – i° – V", "i° – iii – i° – II – i°", "i° – vii – i° – vii – i°"]} />
      </View>

      {/* ── IN REVISION ──────────────────────────────── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "One interval sequence (W–W–H–W–W–W–H) produces the major scale.",
          "Seven modes come from starting that scale on each of its seven degrees — no new notes required.",
          "Each mode has a different interval sequence and a completely different mood.",
          "Modes are a family: in C Major, all seven use C D E F G A B.",
          "Practice with backing tracks and chord progressions — that's how you hear the differences.",
          "The Pitch Axis exercise (all modes over a single root note) is the fastest way to train your ear.",
        ].map((r, i) => (
          <View key={i} style={styles.recapRow}>
            <Text style={[styles.recapNum, { color: PURPLE }]}>{i + 1}.</Text>
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
  callout: { borderLeftWidth: 3, borderRadius: 8, padding: 14 },
  calloutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  modeCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  modeHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  modeNum:     { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", width: 20 },
  modeName:    { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  modeFormula: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modeDiff:    { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  neckWrap:    { marginTop: 4, marginBottom: 2 },
  noteTable:   { borderWidth: 1, borderRadius: 8, overflow: "hidden", gap: 0 },
  noteRow:     { paddingVertical: 6, paddingHorizontal: 8, gap: 4 },
  noteRowLabel:  { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  noteRowCells:  { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  noteCell:      { borderWidth: 1, borderRadius: 5, paddingHorizontal: 6, paddingVertical: 3, minWidth: 28, alignItems: "center" },
  noteCellText:  { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold" },
  chordTable:       { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  chordTableHeader: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10 },
  chordRow:         { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10 },
  chordCol:         { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },
  progBlock: { borderWidth: 1, borderRadius: 8, padding: 10, gap: 3 },
  progMode:  { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  progLine:  { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 19 },
  recap:     { borderWidth: 1, padding: 18 },
  recapRow:  { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum:  { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
