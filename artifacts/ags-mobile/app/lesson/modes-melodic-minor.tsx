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

// A melodic minor: A B C D E F# G# — pitch classes [9,11,0,2,4,6,8]
const MM_PITCHES = [9, 11, 0, 2, 4, 6, 8];
const NECK_START = 4;
const NECK_END   = 10;

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
  num, name, formula, chord, uses, sound, color, rootPitch,
}: {
  num: string; name: string; formula: string;
  chord: string; uses: string; sound: string; color: string; rootPitch: number;
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
          scalePitches={MM_PITCHES}
          startFret={NECK_START}
          endFret={NECK_END}
          color={color}
        />
      </View>
      <Text style={[styles.modeChord, { color }]}>{chord}</Text>
      <Text style={[styles.modeUses,  { color: colors.mutedForeground }]}>{uses}</Text>
      <Text style={[styles.modeSound, { color: colors.mutedForeground }]}>{`Sound: ${sound}`}</Text>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ModesMelodicMinorLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();
  useEffect(() => { markLessonViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LessonLayout
      kicker="Scales · Modes"
      title="Modes of the Melodic Minor"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "The melodic minor scale is a natural minor with both the 6th and 7th raised — giving it a brighter, forward-moving quality while keeping the minor ♭3. From this parent scale come seven of the most powerful and widely-used modes in jazz, fusion, and modern guitar.",
        "Players like John McLaughlin, Allan Holdsworth, Frank Gambale, Joe Satriani, and John Coltrane have used these modes to create some of the most sophisticated sounds in music history.",
      ]}
    >
      {/* ── WHAT IS MELODIC MINOR ────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHAT IS THE MELODIC MINOR SCALE?" />
        <Body>
          {"Natural minor with the 6th and 7th both raised. It sounds like a major scale with a ♭3 — or a Dorian scale with a natural 7th. The raised 7th creates a leading tone without the awkward augmented 2nd gap of harmonic minor, resulting in a smoother, more lyrical scale."}
        </Body>
        <Callout color={PURPLE}>
          {"Natural Minor:  1 – 2 – ♭3 – 4 – 5 – ♭6 – ♭7\nMelodic Minor:  1 – 2 – ♭3 – 4 – 5 –  6  –  7\n\nIn A: A – B – C – D – E – F♯ – G♯ – A\n\nOften called the Jazz Minor for its widespread use in jazz and fusion."}
        </Callout>
      </View>

      {/* ── THE SEVEN MODES ──────────────────────────── */}
      <View style={styles.section}>
        <H2 text="THE SEVEN MODES" />
        <Body>
          {"Each mode starts on a different degree of the melodic minor parent scale. Flavours range from mysterious and dark to bright and modern to explosively tense. Fret diagrams show frets 4–10 in A."}
        </Body>

        <ModeCard
          num="1" name="Melodic Minor (Jazz Minor)" color={PURPLE} rootPitch={9}
          formula="1 – 2 – ♭3 – 4 – 5 – 6 – 7"
          chord="Chord: min(maj7)  —  mMaj7"
          uses="Over minor chords with a major 7th (e.g. AmMaj7). Fusion, jazz, film scoring."
          sound="Dark yet elegant — mysterious with forward motion."
        />
        <ModeCard
          num="2" name="Dorian ♭2  (Phrygian ♮6)" color={PINK} rootPitch={11}
          formula="1 – ♭2 – ♭3 – 4 – 5 – 6 – ♭7"
          chord="Chord: m7 with sus tension"
          uses="Exotic, Spanish, or Middle Eastern moods. Over m7♭9 chords."
          sound="Dark and mysterious — but less heavy than pure Phrygian thanks to the natural 6."
        />
        <ModeCard
          num="3" name="Lydian Augmented" color={AMBER} rootPitch={0}
          formula="1 – 2 – 3 – ♯4 – ♯5 – 6 – 7"
          chord="Chord: Maj7♯5"
          uses="Over maj7♯5 or maj7 chords to add shimmering tension."
          sound="Expansive, spacey, surreal — floating in a cosmic dream."
        />
        <ModeCard
          num="4" name="Lydian Dominant  (Overtone Scale)" color={ORANGE} rootPitch={2}
          formula="1 – 2 – 3 – ♯4 – 5 – 6 – ♭7"
          chord="Chord: 7♯11  (dominant with raised 4th)"
          uses="Over dominant chords needing colour (e.g. G7♯11). Jazz and fusion."
          sound="Bright, funky, modern. Steve Vai and Scott Henderson use this extensively."
        />
        <ModeCard
          num="5" name="Mixolydian ♭6  (Hindu Scale)" color={GREEN} rootPitch={4}
          formula="1 – 2 – 3 – 4 – 5 – ♭6 – ♭7"
          chord="Chord: dom7♭13"
          uses="Over V7 chords when you want tension without going fully altered."
          sound="A mix of bright and dark — exotic with a hint of unresolved tension."
        />
        <ModeCard
          num="6" name="Aeolian ♭5  (Locrian ♮2)" color={TEAL} rootPitch={6}
          formula="1 – 2 – ♭3 – 4 – ♭5 – ♭6 – ♭7"
          chord="Chord: m7♭5  (half-diminished)"
          uses="Over half-diminished chords in minor ii–V–i progressions (e.g. Dm7♭5)."
          sound="Tense and unstable — but smoother than pure Locrian thanks to the natural 2."
        />
        <ModeCard
          num="7" name="Altered Scale  (Super Locrian)" color={PINK} rootPitch={8}
          formula="1 – ♭2 – ♭3 – ♭4 – ♭5 – ♭6 – ♭7"
          chord="Chord: dom7 with ♭9, ♯9, ♭5, ♯5"
          uses="Over V7alt chords resolving to minor or major. The king of tension."
          sound="Highly dissonant, modern, spicy. Coltrane, Holdsworth, McLaughlin used this constantly."
        />
      </View>

      {/* ── PRACTICAL APPLICATION ────────────────────── */}
      <View style={styles.section}>
        <H2 text="PRACTICAL APPLICATION" />
        <Body>
          {"These modes become most useful when you know which chord each one lives over. Three core applications to learn first:"}
        </Body>
        <Callout color={TEAL}>
          {"ii–V–i in minor  (the most common jazz/fusion move):\n\n• ii chord (m7♭5)  →  Mode 6 — Locrian ♮2\n• V7alt chord       →  Mode 7 — Altered Scale\n• i chord (mMaj7)   →  Mode 1 — Melodic Minor\n\nEach chord gets its own mode. The tensions resolve perfectly into each other."}
        </Callout>
        <Callout color={ORANGE}>
          {"Dominant colouring:\n\nWhen standard Mixolydian sounds plain over a dominant chord:\n\n• Mode 4 (Lydian Dominant) — brighter, funkier, more tension\n• Mode 5 (Mixolydian ♭6) — darker, more exotic tension\n\nBoth sit over a dom7 chord — swap them in and hear the difference."}
        </Callout>
        <Callout color={PURPLE}>
          {"Fusion & outside sounds:\n\nModes 3, 4, and 7 give you that \"outside\" modern flavour. Start with Lydian Dominant (Mode 4) over any dominant chord — it's the most immediately musical entry point into melodic minor territory."}
        </Callout>
      </View>

      {/* ── ALTERED SCALE SPOTLIGHT ──────────────────── */}
      <View style={styles.section}>
        <H2 text="SPOTLIGHT: THE ALTERED SCALE" color={PINK} />
        <Body>
          {"Mode 7 — the Altered Scale — contains every possible alteration of a dominant chord: ♭9, ♯9, ♭5, and ♯5, all in one scale. It is the go-to choice over V7alt chords when you want maximum drama before resolution."}
        </Body>
        <Body>
          {"A fast way to find it on the neck: to play G Altered, play A♭ melodic minor starting from G. The melodic minor a semitone above your altered root gives you the scale automatically."}
        </Body>
        <Callout color={PINK}>
          {"Shortcut: G Altered = A♭ Melodic Minor starting on G.\n\nOne semitone up from your root → find melodic minor from there → play it from your root."}
        </Callout>
      </View>

      {/* ── WHERE TO START ───────────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHERE TO START" />
        <Body>
          {"Don't try to learn all seven modes at once. Work through them in this order — most useful to least at first:"}
        </Body>
        <Callout color={PURPLE}>
          {"1. Mode 1 — Melodic Minor itself. Learn the shape across the neck.\n\n2. Mode 4 — Lydian Dominant. Use it over any dominant chord immediately.\n\n3. Mode 7 — Altered Scale. Use it over V7alt chords.\n\n4. Mode 6 — Locrian ♮2. Use it over the ii chord in minor.\n\n5. Modes 2, 3, and 5 — explore once the first four feel natural."}
        </Callout>
      </View>

      {/* ── RECAP ────────────────────────────────────── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Melodic minor = natural minor with both the 6th and 7th raised.",
          "Smoother than harmonic minor — no augmented 2nd gap; more lyrical sound.",
          "Seven modes — all with distinct harmonic functions used in jazz and fusion.",
          "Lydian Dominant (Mode 4) over dominant chords is the most accessible entry point.",
          "The Altered Scale (Mode 7) contains every possible dominant alteration in one scale.",
          "Shortcut: the altered scale from root X = melodic minor starting a semitone above X.",
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
  section:  { gap: 12 },
  h2:       { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body:     { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  callout:  { borderLeftWidth: 3, borderRadius: 8, padding: 14 },
  calloutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  modeCard:    { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  modeHeader:  { flexDirection: "row", alignItems: "center", gap: 8 },
  modeNum:     { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", width: 20 },
  modeName:    { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold", flex: 1 },
  modeFormula: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modeChord:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  modeUses:    { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  modeSound:   { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, fontStyle: "italic" },
  neckWrap:    { marginTop: 4, marginBottom: 2 },
  recap:    { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText:{ flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
