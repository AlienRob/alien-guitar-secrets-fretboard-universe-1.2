import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const TEAL   = "#00FFD5";
const BLUE   = "#3b82f6";
const PURPLE = "#a78bfa";
const AMBER  = "#f59e0b";
const PINK   = "#FF6B9D";

function H2({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.h2, { color: colors.mutedForeground }]}>{text}</Text>;
}
function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

function DegreeStrip({ degrees, notes, color }: { degrees: string[]; notes: string[]; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.stripRow}>
      {degrees.map((d, i) => (
        <View key={i} style={[styles.stripCell, {
          borderColor: d === "b5" ? PINK + "88" : color + "88",
          backgroundColor: d === "b5" ? PINK + "22" : color + "18",
        }]}>
          <Text style={[styles.stripDeg, { color: d === "b5" ? PINK : color }]}>{d}</Text>
          <Text style={[styles.stripNote, { color: colors.foreground }]}>{notes[i]}</Text>
        </View>
      ))}
    </View>
  );
}

export default function BluesScaleLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Scales · Blues"
      title="The Blues Scale"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "The blues scale is the minor pentatonic with one extra note added — the diminished 5th, also called the blue note or the flat five (b5). This one addition gives the scale its distinctive tension, grit, and expressiveness.",
        "There are two versions: the Minor Blues Scale (built from the minor pentatonic) and the Major Blues Scale (built from the major pentatonic). Both are essential. The minor blues is the backbone of rock and blues lead playing; the major blues adds sweetness and is widely used in country and soul.",
      ]}
    >
      {/* ── Minor Blues ── */}
      <View style={styles.section}>
        <View style={[styles.badge, { borderColor: BLUE + "55", backgroundColor: BLUE + "10" }]}>
          <Text style={[styles.badgeText, { color: BLUE }]}>THE MINOR BLUES SCALE</Text>
        </View>
        <Body>
          Take the minor pentatonic (1 b3 4 5 b7) and add the b5 between the 4 and the 5. That single note creates immediate tension and release — the defining sound of blues guitar.
        </Body>

        <H2 text="FORMULA" />
        <View style={[styles.formulaBox, { borderColor: BLUE + "44", backgroundColor: BLUE + "08" }]}>
          <Text style={[styles.formulaText, { color: colors.mutedForeground }]}>
            Minor Pentatonic:{"  "}
            <Text style={{ color: PURPLE }}>1  b3  4</Text>
            {"      "}
            <Text style={{ color: PURPLE }}>5  b7</Text>
          </Text>
          <Text style={[styles.formulaText, { color: colors.mutedForeground }]}>
            Blues Scale:{"        "}
            <Text style={{ color: PURPLE }}>1  b3  4</Text>
            {"  "}
            <Text style={{ color: PINK, fontFamily: "SpaceGrotesk_700Bold" }}>b5</Text>
            {"  "}
            <Text style={{ color: PURPLE }}>5  b7</Text>
          </Text>
        </View>

        <H2 text="IN A — DEGREES AND NOTES" />
        <DegreeStrip
          degrees={["1", "b3", "4", "b5", "5", "b7"]}
          notes={["A", "C", "D", "Eb", "E", "G"]}
          color={BLUE}
        />

        <View style={[styles.infoBox, { borderColor: PINK + "44", backgroundColor: PINK + "08" }]}>
          <Text style={[styles.infoLabel, { color: PINK }]}>THE BLUE NOTE (b5)</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            The b5 is not a note you rest on — it is a passing note. Its power comes from the tension it creates as you move through it. Bend into it, slide through it, or use it as a chromatic stepping stone between 4 and 5. Landing on it and staying creates dissonance; passing through it creates magic.
          </Text>
        </View>

        <View style={[styles.infoBox, { borderColor: BLUE + "44", backgroundColor: BLUE + "08" }]}>
          <Text style={[styles.infoLabel, { color: BLUE }]}>SOUND AND CHARACTER</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Gritty, raw, expressive. Used throughout blues, rock, metal, and jazz. The b5 gives it a restless, searching quality that makes it perfect for emotional lead playing. Every great rock and blues guitarist leans heavily on this scale.
          </Text>
        </View>
      </View>

      {/* ── Major Blues ── */}
      <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
      <View style={styles.section}>
        <View style={[styles.badge, { borderColor: AMBER + "55", backgroundColor: AMBER + "10" }]}>
          <Text style={[styles.badgeText, { color: AMBER }]}>THE MAJOR BLUES SCALE</Text>
        </View>
        <Body>
          The Major Blues Scale adds the b3 to the major pentatonic — creating a chromatic passing note between 2 and 3. It sounds bright and soulful, blending the sweetness of the major pentatonic with a blues flavour.
        </Body>

        <H2 text="FORMULA" />
        <View style={[styles.formulaBox, { borderColor: AMBER + "44", backgroundColor: AMBER + "08" }]}>
          <Text style={[styles.formulaText, { color: colors.mutedForeground }]}>
            Major Pentatonic:{"  "}
            <Text style={{ color: AMBER }}>1  2</Text>
            {"     "}
            <Text style={{ color: AMBER }}>3  5  6</Text>
          </Text>
          <Text style={[styles.formulaText, { color: colors.mutedForeground }]}>
            Blues Scale:{"       "}
            <Text style={{ color: AMBER }}>1  2</Text>
            {"  "}
            <Text style={{ color: PINK, fontFamily: "SpaceGrotesk_700Bold" }}>b3</Text>
            {"  "}
            <Text style={{ color: AMBER }}>3  5  6</Text>
          </Text>
        </View>

        <H2 text="IN C — DEGREES AND NOTES" />
        <DegreeStrip
          degrees={["1", "2", "b3", "3", "5", "6"]}
          notes={["C", "D", "Eb", "E", "G", "A"]}
          color={AMBER}
        />

        <View style={[styles.infoBox, { borderColor: AMBER + "44", backgroundColor: AMBER + "08" }]}>
          <Text style={[styles.infoLabel, { color: AMBER }]}>SOUND AND CHARACTER</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Bright and sweet with a hint of blues tension. Used in country, soul, gospel, and R&B. The b3 passing note gives phrases a little sting — use it to slide into the major 3rd for an instantly soulful feel.
          </Text>
        </View>
      </View>

      {/* ── How to use blue notes ── */}
      <View style={styles.section}>
        <H2 text="HOW TO USE BLUE NOTES EXPRESSIVELY" />
        <Body>
          Blue notes (the b5 in minor blues, the b3 in major blues) are chromatic passing tones. They are not target notes — they are in-between notes that create movement and tension. Here is how to make them work:
        </Body>
        <View style={{ gap: 8 }}>
          {[
            { title: "Bend into it",    desc: "Start a half step below (the 4 or the 2) and bend up to the blue note. The tension of the bend matches the tension of the note." },
            { title: "Slide through it", desc: "Slide from the 4 up to the 5, passing through the b5 on the way. The note becomes a smear rather than a fixed pitch — very bluesy." },
            { title: "Hammer-on through it", desc: "Hammer from 4 to b5 to 5 in one motion. Creates fast chromatic movement without picking every note." },
            { title: "Land on it briefly", desc: "Play the b5 but immediately resolve to the 5 or back to the 4. Brief contact = tension then release." },
          ].map(({ title, desc }) => (
            <View key={title} style={[styles.techniqueCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Text style={[styles.techniqueTitle, { color: TEAL }]}>{title}</Text>
              <Text style={[styles.techniqueDesc, { color: colors.mutedForeground }]}>{desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Mixing both ── */}
      <View style={styles.section}>
        <H2 text="MIXING MAJOR AND MINOR BLUES" />
        <Body>
          Advanced blues players constantly shift between major and minor blues within the same key — often in the same phrase. The trick is using the b3 (minor blues) against the major 3 (major blues) to create that distinctive "in-between" quality that is uniquely bluesy. This works because blues harmony is built on dominant 7th chords which contain both major and minor tensions simultaneously.
        </Body>
        <View style={[styles.infoBox, { borderColor: TEAL + "44", backgroundColor: TEAL + "08" }]}>
          <Text style={[styles.infoLabel, { color: TEAL }]}>PRO TIP</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            In A blues, combine both: play the minor pentatonic for the gritty verses and lead lines, then reach for the major blues notes (the 2 and major 3) over the IV chord for contrast. The ear hears the shift — and loves it.
          </Text>
        </View>
      </View>

      {/* ── Recap ── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Minor Blues = minor pentatonic + b5 (1 b3 4 b5 5 b7).",
          "Major Blues = major pentatonic + b3 (1 2 b3 3 5 6).",
          "The blue note is a passing tone — move through it, don't sit on it.",
          "Bend, slide, and hammer through blue notes for expression.",
          "Mix major and minor blues in the same phrase for advanced sound.",
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
  divider: { height: 1, marginVertical: 4 },
  h2:   { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  badge: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  badgeText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 1 },
  formulaBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  formulaText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 26 },
  stripRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  stripCell: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 40 },
  stripDeg: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  stripNote: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  infoBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  infoLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  infoText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  techniqueCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 4 },
  techniqueTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  techniqueDesc: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
