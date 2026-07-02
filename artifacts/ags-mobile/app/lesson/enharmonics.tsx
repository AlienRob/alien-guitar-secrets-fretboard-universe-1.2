import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const ACCENT  = "#00FFD5";
const SHARP_C = "#FFD700";
const FLAT_C  = "#a78bfa";

function SectionHeading({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.h2, { color: colors.mutedForeground }]}>{text}</Text>;
}

function BodyText({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

// ── Enharmonic pair card ───────────────────────────────────────────────────────

interface PairCardProps {
  sharp: string;
  flat: string;
  fretExample: string;
  sharpKey: string;
  flatKey: string;
}

function EnhPairCard({ sharp, flat, fretExample, sharpKey, flatKey }: PairCardProps) {
  const colors = useColors();
  return (
    <View style={[styles.pairCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.pairTop}>
        <View style={[styles.pairChip, { borderColor: SHARP_C + "66", backgroundColor: SHARP_C + "12" }]}>
          <Text style={[styles.pairNote, { color: SHARP_C }]}>{sharp}</Text>
        </View>
        <Text style={[styles.equals, { color: colors.mutedForeground }]}>=</Text>
        <View style={[styles.pairChip, { borderColor: FLAT_C + "66", backgroundColor: FLAT_C + "12" }]}>
          <Text style={[styles.pairNote, { color: FLAT_C }]}>{flat}</Text>
        </View>
        <Text style={[styles.fretEx, { color: colors.mutedForeground }]}>{fretExample}</Text>
      </View>
      <View style={[styles.pairKeys, { borderTopColor: colors.border }]}>
        <View style={styles.pairKeyBlock}>
          <Text style={[styles.pairKeyLabel, { color: SHARP_C }]}>Use {sharp} in:</Text>
          <Text style={[styles.pairKeyValue, { color: colors.mutedForeground }]}>{sharpKey}</Text>
        </View>
        <View style={[styles.pairDivider, { backgroundColor: colors.border }]} />
        <View style={styles.pairKeyBlock}>
          <Text style={[styles.pairKeyLabel, { color: FLAT_C }]}>Use {flat} in:</Text>
          <Text style={[styles.pairKeyValue, { color: colors.mutedForeground }]}>{flatKey}</Text>
        </View>
      </View>
    </View>
  );
}

// ── Context example ───────────────────────────────────────────────────────────

function ContextRow({ context, name, reason }: { context: string; name: string; reason: string }) {
  const colors = useColors();
  return (
    <View style={[styles.ctxRow, { borderColor: colors.border }]}>
      <Text style={[styles.ctxContext, { color: ACCENT }]}>{context}</Text>
      <Text style={[styles.ctxName, { color: colors.foreground }]}>{name}</Text>
      <Text style={[styles.ctxReason, { color: colors.mutedForeground }]}>{reason}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function EnharmonicsLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Training · Fretboard"
      title="Understanding Enharmonics"
      practiceHref="/drill/find-notes"
      practiceLabel="Drill this now — Find All Notes"
      intro={[
        "An enharmonic pair is two different note names that point to the exact same fret — the exact same pitch. F# and Gb are enharmonic equivalents: one fret, two names. Neither is more correct than the other. Which one you use depends on the musical context you are in.",
        "This is not a quirk or an inconvenience — it is a feature. Naming notes correctly for the key keeps written music clean and logical. Once you understand the logic, you'll read charts and tab far more quickly.",
      ]}
    >
      {/* ── The five pairs ── */}
      <View style={styles.section}>
        <SectionHeading text="THE FIVE ENHARMONIC PAIRS" />
        <BodyText>
          There are only five. Every sharp note has a flat equivalent and vice versa. Fret position is shown for the 6th string so you can verify each one on your guitar.
        </BodyText>
        <View style={{ gap: 10 }}>
          <EnhPairCard
            sharp="C#" flat="Db"
            fretExample="Fret 1 on the 5th string (open A)"
            sharpKey="G, D, A, E, B, F# major"
            flatKey="F, Bb, Eb, Ab major"
          />
          <EnhPairCard
            sharp="D#" flat="Eb"
            fretExample="Fret 6 on the 6th string"
            sharpKey="B, F# major"
            flatKey="F, Bb, Eb, Ab major"
          />
          <EnhPairCard
            sharp="F#" flat="Gb"
            fretExample="Fret 2 on the 6th string"
            sharpKey="G, D, A, E, B, F# major"
            flatKey="Db, Gb major"
          />
          <EnhPairCard
            sharp="G#" flat="Ab"
            fretExample="Fret 4 on the 6th string"
            sharpKey="A, E, B, F# major"
            flatKey="Eb, Ab major"
          />
          <EnhPairCard
            sharp="A#" flat="Bb"
            fretExample="Fret 6 on the 5th string"
            sharpKey="rarely used as A#"
            flatKey="F, Bb, Eb, Ab major"
          />
        </View>
      </View>

      {/* ── Why the name matters ── */}
      <View style={styles.section}>
        <SectionHeading text="WHY THE NAME MATTERS" />
        <BodyText>
          The guitar does not know or care what you call a note — a fret is a fret. But when you write, read, or communicate music, the name tells other musicians what key you are thinking in. Using the wrong enharmonic spelling is like using the right word in the wrong language — the listener can figure it out, but it creates unnecessary confusion.
        </BodyText>
        <View style={[styles.ruleBox, { borderColor: ACCENT + "44", backgroundColor: ACCENT + "08" }]}>
          <Text style={[styles.ruleHeading, { color: ACCENT }]}>The simple rule</Text>
          <Text style={[styles.ruleBody, { color: colors.mutedForeground }]}>
            Sharp keys (G, D, A, E, B, F#) use sharp names.{"\n"}
            Flat keys (F, Bb, Eb, Ab) use flat names.{"\n"}
            C major uses neither — it has no sharps or flats.
          </Text>
        </View>
      </View>

      {/* ── Real examples ── */}
      <View style={styles.section}>
        <SectionHeading text="REAL-WORLD EXAMPLES" />
        <BodyText>
          In each case below, both names describe the same fret — but only one is correct for the key.
        </BodyText>
        <View style={{ gap: 8 }}>
          <ContextRow
            context="Key of A major"
            name="C#, F#, G#"
            reason="A major is a sharp key — use sharps."
          />
          <ContextRow
            context="Key of Bb major"
            name="Bb, Eb, Ab"
            reason="Bb major is a flat key — use flats."
          />
          <ContextRow
            context="Key of E major"
            name="F#, G#, C#, D#"
            reason="E major has four sharps — every accidental is a sharp."
          />
          <ContextRow
            context="Key of F major"
            name="Bb (not A#)"
            reason="F major has one flat — Bb is its correct spelling."
          />
        </View>
      </View>

      {/* ── On the guitar ── */}
      <View style={styles.section}>
        <SectionHeading text="ON THE GUITAR — NOTHING CHANGES" />
        <BodyText>
          When you play a chord of Gb major, your fingers go to the same frets as F# major. The shape is identical. Only the name changes. This means you can always work out a correct spelling from the key without moving a single finger — just rename what is already under your hand.
        </BodyText>
        <View style={[styles.shapeBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          {[
            { left: "F# major", right: "= Gb major", note: "same chord shape, different name" },
            { left: "C# minor", right: "= Db minor", note: "same chord shape, different name" },
            { left: "A# dim",   right: "= Bb dim",   note: "same chord shape, different name" },
          ].map(({ left, right, note }) => (
            <View key={left} style={styles.shapeRow}>
              <Text style={[styles.shapeLeft,  { color: SHARP_C }]}>{left}</Text>
              <Text style={[styles.shapeRight, { color: FLAT_C  }]}>{right}</Text>
              <Text style={[styles.shapeNote,  { color: colors.mutedForeground }]}>{note}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Recap ── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Enharmonic = same fret, two different note names.",
          "The five pairs: C#/Db, D#/Eb, F#/Gb, G#/Ab, A#/Bb.",
          "Sharp keys use sharp names. Flat keys use flat names.",
          "On the guitar the fret is identical — only the label changes.",
          "Spelling notes correctly helps you communicate and read music clearly.",
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

  pairCard: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  pairTop: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, flexWrap: "wrap" },
  pairChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5 },
  pairNote: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  equals:   { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  fretEx:   { flex: 1, fontSize: 11.5, fontFamily: "Inter_400Regular", lineHeight: 17 },
  pairKeys: { flexDirection: "row", borderTopWidth: 1, padding: 10, gap: 0 },
  pairKeyBlock: { flex: 1, gap: 2 },
  pairDivider:  { width: 1, marginHorizontal: 10 },
  pairKeyLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  pairKeyValue: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17 },

  ruleBox: { borderWidth: 1, borderRadius: 10, padding: 16, gap: 8 },
  ruleHeading: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  ruleBody: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 22 },

  ctxRow: { borderWidth: 1, borderRadius: 8, padding: 12, gap: 4 },
  ctxContext: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  ctxName:    { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  ctxReason:  { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 19 },

  shapeBox: { borderWidth: 1, borderRadius: 10, overflow: "hidden" },
  shapeRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  shapeLeft:  { width: 80, fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  shapeRight: { width: 80, fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  shapeNote:  { flex: 1, fontSize: 11.5, fontFamily: "Inter_400Regular" },

  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
