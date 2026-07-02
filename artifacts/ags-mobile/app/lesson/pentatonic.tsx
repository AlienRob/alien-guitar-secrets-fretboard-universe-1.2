import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const TEAL   = "#00FFD5";
const GOLD   = "#FFD700";
const PURPLE = "#a78bfa";
const RED    = "#ef4444";

function H2({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.h2, { color: colors.mutedForeground }]}>{text}</Text>;
}
function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

// ── Degree strip ──────────────────────────────────────────────────────────────

function DegreeStrip({
  degrees,
  notes,
  color,
}: {
  degrees: string[];
  notes: string[];
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.stripWrap}>
      <View style={styles.stripRow}>
        {degrees.map((d, i) => (
          <View
            key={i}
            style={[styles.stripCell, { borderColor: color + "88", backgroundColor: color + "18" }]}
          >
            <Text style={[styles.stripDeg, { color }]}>{d}</Text>
            <Text style={[styles.stripNote, { color: colors.foreground }]}>{notes[i]}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Position box ──────────────────────────────────────────────────────────────

function PositionCard({
  n,
  name,
  root,
  desc,
  color,
}: {
  n: number;
  name: string;
  root: string;
  desc: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={[styles.posCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <View style={styles.posHeader}>
        <View style={[styles.posBadge, { borderColor: color + "66", backgroundColor: color + "18" }]}>
          <Text style={[styles.posNum, { color }]}>{n}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.posName, { color: colors.foreground }]}>{name}</Text>
          <Text style={[styles.posRoot, { color: colors.mutedForeground }]}>Root string: {root}</Text>
        </View>
      </View>
      <Text style={[styles.posDesc, { color: colors.mutedForeground }]}>{desc}</Text>
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function PentatonicLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Scales · Pentatonic"
      title="The Pentatonic Scale"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "Pentatonic means five notes — five notes selected from the seven of the major or minor scale, leaving out the two that create the most tension. The result is a scale that sounds good over almost anything, making it the most used scale in rock, blues, pop, country, and jazz.",
        "There are two forms: the Major Pentatonic (bright, country, melodic) and the Minor Pentatonic (gritty, bluesy, rock). They are closely related — in fact, they share the same five notes and the same five fretboard shapes. What changes is which note your ear hears as home.",
      ]}
    >
      {/* ══ MAJOR PENTATONIC ════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <View style={[styles.badge, { borderColor: GOLD + "55", backgroundColor: GOLD + "10" }]}>
          <Text style={[styles.badgeText, { color: GOLD }]}>MAJOR PENTATONIC</Text>
        </View>
        <Body>
          The Major Pentatonic takes the major scale and removes the 4th and 7th degrees — the two notes most likely to clash. What remains is five notes that work over any major or dominant chord in that key.
        </Body>
        <H2 text="FORMULA — DEGREES REMOVED FROM MAJOR" />
        <View style={[styles.removeBox, { borderColor: GOLD + "44", backgroundColor: GOLD + "08" }]}>
          <Text style={[styles.removeText, { color: colors.mutedForeground }]}>
            Major scale:{"   "}
            <Text style={{ color: GOLD }}>1</Text>{"  "}
            <Text style={{ color: GOLD }}>2</Text>{"  "}
            <Text style={{ color: GOLD }}>3</Text>{"  "}
            <Text style={{ color: RED, textDecorationLine: "line-through" }}>4</Text>{"  "}
            <Text style={{ color: GOLD }}>5</Text>{"  "}
            <Text style={{ color: GOLD }}>6</Text>{"  "}
            <Text style={{ color: RED, textDecorationLine: "line-through" }}>7</Text>
          </Text>
          <Text style={[styles.removeText, { color: colors.mutedForeground }]}>
            Major Pent:{"  "}
            <Text style={{ color: GOLD }}>1  2  3  5  6</Text>
          </Text>
        </View>
        <H2 text="IN C — DEGREES AND NOTES" />
        <DegreeStrip
          degrees={["1", "2", "3", "5", "6"]}
          notes={["C", "D", "E", "G", "A"]}
          color={GOLD}
        />
        <View style={[styles.infoBox, { borderColor: GOLD + "44", backgroundColor: GOLD + "08" }]}>
          <Text style={[styles.infoLabel, { color: GOLD }]}>SOUND AND CHARACTER</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Bright, melodic, country. Works beautifully over I, IV, and V chords in a major key. Widely used in country, pop, rock, and classical-flavoured guitar playing.
          </Text>
        </View>
      </View>

      {/* ══ MINOR PENTATONIC ════════════════════════════════════════════════════ */}
      <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
      <View style={styles.section}>
        <View style={[styles.badge, { borderColor: PURPLE + "55", backgroundColor: PURPLE + "10" }]}>
          <Text style={[styles.badgeText, { color: PURPLE }]}>MINOR PENTATONIC</Text>
        </View>
        <Body>
          The Minor Pentatonic takes the natural minor scale and removes the 2nd and 6th degrees. The result is the go-to scale for rock, blues, and metal — forgiving, gritty, and instantly recognisable.
        </Body>
        <H2 text="FORMULA — DEGREES REMOVED FROM NATURAL MINOR" />
        <View style={[styles.removeBox, { borderColor: PURPLE + "44", backgroundColor: PURPLE + "08" }]}>
          <Text style={[styles.removeText, { color: colors.mutedForeground }]}>
            Minor scale:{"  "}
            <Text style={{ color: PURPLE }}>1</Text>{"  "}
            <Text style={{ color: RED, textDecorationLine: "line-through" }}>2</Text>{"  "}
            <Text style={{ color: PURPLE }}>b3</Text>{"  "}
            <Text style={{ color: PURPLE }}>4</Text>{"  "}
            <Text style={{ color: PURPLE }}>5</Text>{"  "}
            <Text style={{ color: RED, textDecorationLine: "line-through" }}>b6</Text>{"  "}
            <Text style={{ color: PURPLE }}>b7</Text>
          </Text>
          <Text style={[styles.removeText, { color: colors.mutedForeground }]}>
            Minor Pent:{"  "}
            <Text style={{ color: PURPLE }}>1  b3  4  5  b7</Text>
          </Text>
        </View>
        <H2 text="IN A — DEGREES AND NOTES" />
        <DegreeStrip
          degrees={["1", "b3", "4", "5", "b7"]}
          notes={["A", "C", "D", "E", "G"]}
          color={PURPLE}
        />
        <View style={[styles.infoBox, { borderColor: PURPLE + "44", backgroundColor: PURPLE + "08" }]}>
          <Text style={[styles.infoLabel, { color: PURPLE }]}>SOUND AND CHARACTER</Text>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Dark, gritty, soulful. Works over minor chords, blues progressions, and dominant 7th chords. The most-used scale in rock and blues guitar — every note sounds intentional.
          </Text>
        </View>
      </View>

      {/* ══ THE RELATIVE RELATIONSHIP ═══════════════════════════════════════════ */}
      <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.08)" }]} />
      <View style={styles.section}>
        <H2 text="THE SAME FIVE NOTES" />
        <Body>
          C Major Pentatonic (C D E G A) and A Minor Pentatonic (A C D E G) are the exact same five notes in a different order. They share the same five fretboard shapes. The only difference is which note your ear and your phrasing treat as home.
        </Body>
        <View style={[styles.relBox, { borderColor: TEAL + "44", backgroundColor: TEAL + "08" }]}>
          <Text style={[styles.relTitle, { color: TEAL }]}>RELATIVE PENTATONIC PAIRS</Text>
          {[
            { maj: "C major pent", min: "A minor pent", notes: "C D E G A" },
            { maj: "G major pent", min: "E minor pent", notes: "G A B D E" },
            { maj: "D major pent", min: "B minor pent", notes: "D E F# A B" },
            { maj: "A major pent", min: "F# minor pent", notes: "A B C# E F#" },
          ].map(({ maj, min, notes }) => (
            <View key={maj} style={[styles.relRow, { borderTopColor: TEAL + "22" }]}>
              <Text style={[styles.relMaj, { color: GOLD }]}>{maj}</Text>
              <Text style={[styles.relSep, { color: colors.mutedForeground }]}>↔</Text>
              <Text style={[styles.relMin, { color: PURPLE }]}>{min}</Text>
              <Text style={[styles.relNotes, { color: colors.mutedForeground }]}>{notes}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ══ THE FIVE SHAPES ════════════════════════════════════════════════════ */}
      <View style={styles.section}>
        <H2 text="THE FIVE POSITIONS (CAGED)" />
        <Body>
          The pentatonic scale repeats in five interlocking positions across the neck — one for each CAGED chord shape. Learning all five means you can play the scale anywhere on the fretboard without shifting into an unfamiliar pattern.
        </Body>
        <View style={{ gap: 8 }}>
          {[
            { n: 1, name: "E-shape position",  root: "6th string", desc: "The most common starting point for beginners. Root on the 6th string. Spans roughly 5 frets." },
            { n: 2, name: "D-shape position",  root: "4th string", desc: "Root on the 4th string. Connects directly above position 1 on the neck." },
            { n: 3, name: "C-shape position",  root: "5th string", desc: "Root on the 5th string. Sits between positions 2 and 4. Rich in the middle register." },
            { n: 4, name: "A-shape position",  root: "5th string", desc: "Root on the 5th string, lower fret than position 3. Slightly wider stretch, great for runs." },
            { n: 5, name: "G-shape position",  root: "6th string", desc: "Closes the loop back to position 1 an octave higher. Smooth connection across the whole neck." },
          ].map((p) => (
            <PositionCard key={p.n} {...p} color={TEAL} />
          ))}
        </View>
        <Body>
          Practice strategy: learn position 1 first until it flows. Then add position 2 and practise connecting them. Gradually link all five until the whole neck is one continuous map.
        </Body>
      </View>

      {/* ══ RECAP ═════════════════════════════════════════════════════════════ */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Major Pentatonic = 1 2 3 5 6 (major scale minus 4 and 7).",
          "Minor Pentatonic = 1 b3 4 5 b7 (minor scale minus 2 and b6).",
          "They share the same 5 notes and 5 fretboard shapes — only the tonal centre differs.",
          "Five CAGED positions cover the full neck — learn them in order and connect them.",
          "Major pent = bright, melodic. Minor pent = dark, gritty. Both are forgiving over most chords.",
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

  removeBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  removeText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 24 },

  stripWrap: { gap: 4 },
  stripRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  stripCell: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center", minWidth: 40 },
  stripDeg:  { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  stripNote: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },

  infoBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  infoLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  infoText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  relBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 0 },
  relTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 10 },
  relRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, paddingTop: 8, borderTopWidth: 1, marginTop: 8 },
  relMaj: { fontSize: 12.5, fontFamily: "SpaceGrotesk_700Bold" },
  relSep: { fontSize: 14 },
  relMin: { fontSize: 12.5, fontFamily: "SpaceGrotesk_700Bold" },
  relNotes: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },

  posCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  posHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  posBadge: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  posNum: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  posName: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
  posRoot: { fontSize: 11.5, fontFamily: "Inter_400Regular", marginTop: 2 },
  posDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  recap: { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
