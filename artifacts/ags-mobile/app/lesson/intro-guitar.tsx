import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const ACCENT = "#00FFD5";
const GOLD   = "#FFD700";
const PURPLE = "#a78bfa";

function SectionHeading({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.h2, { color: colors.mutedForeground }]}>{text}</Text>;
}

function BodyText({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

function InfoBox({ children, color = ACCENT }: { children: string; color?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.infoBox, { borderColor: color + "44", backgroundColor: color + "08" }]}>
      <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{children}</Text>
    </View>
  );
}

// ── Guitar parts data ─────────────────────────────────────────────────────────

const PARTS = [
  {
    name: "Headstock",
    color: ACCENT,
    desc: "The top of the neck, where the tuning pegs live. Turning a peg tightens or loosens a string, raising or lowering its pitch.",
  },
  {
    name: "Nut",
    color: GOLD,
    desc: "The small slotted piece at the top of the fretboard, right where the headstock meets the neck. It holds each string in place and sets the string height.",
  },
  {
    name: "Neck & Fretboard",
    color: PURPLE,
    desc: "The long section you wrap your fretting hand around. The fretboard is the flat face of the neck where you press the strings down onto the frets.",
  },
  {
    name: "Frets",
    color: "#60a5fa",
    desc: "The thin metal strips embedded across the fretboard. Each fret represents one semitone (one half-step). The space between two frets is called a fret position.",
  },
  {
    name: "Body",
    color: "#f59e0b",
    desc: "The large resonating chamber (acoustic) or solid/semi-hollow block (electric) that the neck is attached to. It holds the bridge, pickups, and controls.",
  },
  {
    name: "Bridge",
    color: "#ef4444",
    desc: "Where the strings anchor at the body end. On acoustic guitars it also transfers string vibration into the soundboard.",
  },
];

// ── String data ───────────────────────────────────────────────────────────────

const STRINGS = [
  { num: "1st", note: "E", nickname: "High E",  color: "#ef4444", thickness: "Thinnest — highest pitch" },
  { num: "2nd", note: "B", nickname: "B",       color: "#60a5fa", thickness: "Second thinnest" },
  { num: "3rd", note: "G", nickname: "G",       color: ACCENT,    thickness: "Middle string" },
  { num: "4th", note: "D", nickname: "D",       color: "#a78bfa", thickness: "Middle string" },
  { num: "5th", note: "A", nickname: "A",       color: "#f59e0b", thickness: "Second thickest" },
  { num: "6th", note: "E", nickname: "Low E",   color: "#ef4444", thickness: "Thickest — lowest pitch" },
];

// ── Main screen ───────────────────────────────────────────────────────────────

export default function IntroGuitarLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();

  useEffect(() => {
    markLessonViewed();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LessonLayout
      kicker="Introduction · Guitar"
      title="The Guitar & Fretboard"
      practiceHref="/drill/find-notes"
      practiceLabel="Try your first drill — Find All Notes"
      intro={[
        "Before you dive into scales, chords, and theory, it pays to spend ten minutes understanding the instrument itself. The guitar is logical and consistent — once you see the pattern, everything else clicks into place.",
        "This lesson covers the physical parts of the guitar, how the fretboard is laid out, and the six open strings you need to know before anything else.",
      ]}
    >
      {/* ── Parts of the guitar ── */}
      <View style={styles.section}>
        <SectionHeading text="PARTS OF THE GUITAR" />
        <BodyText>
          Every part of the guitar has a job. Knowing the names helps you follow lessons, watch videos, and ask the right questions at a music store.
        </BodyText>
        <View style={{ gap: 10 }}>
          {PARTS.map(({ name, color, desc }) => (
            <View key={name} style={[styles.partCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <View style={[styles.partLabel, { borderColor: color + "66", backgroundColor: color + "18" }]}>
                <Text style={[styles.partName, { color }]}>{name}</Text>
              </View>
              <Text style={[styles.partDesc, { color: colors.mutedForeground }]}>{desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── The fretboard ── */}
      <View style={styles.section}>
        <SectionHeading text="THE FRETBOARD" />
        <BodyText>
          The fretboard is a grid. One axis is the strings (six of them, running from left to right when the guitar is in playing position). The other axis is the frets (the numbered positions running from the nut down toward the body).
        </BodyText>
        <View style={[styles.gridBox, { borderColor: ACCENT + "44", backgroundColor: ACCENT + "06" }]}>
          <View style={styles.gridRow}>
            <Text style={[styles.gridLabel, { color: colors.mutedForeground }]}>Nut (fret 0)</Text>
            <View style={styles.gridFrets}>
              {[1, 2, 3, 4, 5, 12].map((f) => (
                <View key={f} style={[styles.gridFret, { borderColor: ACCENT + "44" }]}>
                  <Text style={[styles.gridFretNum, { color: ACCENT }]}>{f}</Text>
                </View>
              ))}
            </View>
          </View>
          <Text style={[styles.gridNote, { color: colors.mutedForeground }]}>
            Pressing a string at any fret changes the pitch of that string. Higher fret number = higher pitch. At fret 12 the note is exactly one octave above the open string.
          </Text>
        </View>
      </View>

      {/* ── Fret markers ── */}
      <View style={styles.section}>
        <SectionHeading text="FRET MARKERS (THE DOTS)" />
        <BodyText>
          Most guitars have inlaid dots or shapes on the fretboard at frets 3, 5, 7, 9, and 12. These are visual landmarks so you can find your position on the neck at a glance — you do not have to count every fret from the nut. Fret 12 usually has a double marker to show the octave.
        </BodyText>
        <InfoBox color={GOLD}>
          Landmarks: 3rd, 5th, 7th, 9th frets have single dots. Fret 12 has a double dot — this is where the notes repeat one octave higher.
        </InfoBox>
      </View>

      {/* ── The six strings ── */}
      <View style={styles.section}>
        <SectionHeading text="THE SIX STRINGS" />
        <BodyText>
          Strings are numbered 1 to 6 starting from the thinnest (closest to the floor when playing). Each open string (unfretted) is tuned to a specific note. Standard tuning is used throughout this app.
        </BodyText>
        <View style={[styles.stringsBox, { borderColor: colors.border, overflow: "hidden", borderRadius: colors.radius }]}>
          {STRINGS.map(({ num, note, nickname, color, thickness }) => (
            <View key={num} style={[styles.stringRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.stringNum, { backgroundColor: color + "22" }]}>
                <Text style={[styles.stringNumText, { color }]}>{num}</Text>
              </View>
              <View style={[styles.noteCircle, { borderColor: color + "88", backgroundColor: color + "18" }]}>
                <Text style={[styles.noteText, { color }]}>{note}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.nickName, { color: colors.foreground }]}>{nickname}</Text>
                <Text style={[styles.thickness, { color: colors.mutedForeground }]}>{thickness}</Text>
              </View>
            </View>
          ))}
        </View>
        <InfoBox color={PURPLE}>
          Memory hook: Every Brave Guitarist Discovers Alien Energy — starting from the 1st string (high E) to the 6th string (low E): E B G D A E.
        </InfoBox>
      </View>

      {/* ── Fretting hand ── */}
      <View style={styles.section}>
        <SectionHeading text="TWO HANDS, TWO JOBS" />
        <View style={{ gap: 10 }}>
          {[
            {
              hand: "Fretting hand",
              color: ACCENT,
              desc: "The hand on the neck (left hand for right-handed players). It presses strings down behind a fret to change the pitch. Finger numbers: 1 = index, 2 = middle, 3 = ring, 4 = pinky.",
            },
            {
              hand: "Picking hand",
              color: GOLD,
              desc: "The hand over the body (right hand for right-handed players). It strikes or plucks the strings to produce sound. Use a pick, fingers, or a combination.",
            },
          ].map(({ hand, color, desc }) => (
            <View key={hand} style={[styles.handCard, { borderColor: color + "44", backgroundColor: color + "06" }]}>
              <Text style={[styles.handTitle, { color }]}>{hand}</Text>
              <Text style={[styles.handDesc, { color: colors.mutedForeground }]}>{desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Semitones ── */}
      <View style={styles.section}>
        <SectionHeading text="THE MOST IMPORTANT FACT ABOUT THE FRETBOARD" />
        <BodyText>
          Every fret is exactly one semitone (one half-step) apart. That single rule governs everything — sharps, flats, scales, chords, and intervals all follow from it. The rest of the lessons in this app build on this one fact.
        </BodyText>
        <View style={[styles.factBox, { borderColor: GOLD + "55", backgroundColor: GOLD + "08" }]}>
          <Text style={[styles.factText, { color: GOLD }]}>
            1 fret = 1 semitone = 1 half-step
          </Text>
          <Text style={[styles.factSub, { color: colors.mutedForeground }]}>
            Move up 2 frets from any note → whole step.{"\n"}
            Move up 12 frets from any note → same note, one octave higher.
          </Text>
        </View>
      </View>

      {/* ── What's next ── */}
      <View style={[styles.nextBox, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 10 }]}>WHAT'S NEXT</Text>
        {[
          "The Fretboard — learn to find any note using five simple octave formulas.",
          "Demystifying Intervals — understand the distances between notes.",
          "Mapping Natural Notes — memorise where A B C D E F G live on every string.",
        ].map((item, i) => (
          <View key={i} style={styles.nextRow}>
            <Text style={[styles.nextNum, { color: ACCENT }]}>{i + 1}.</Text>
            <Text style={[styles.nextText, { color: colors.mutedForeground }]}>{item}</Text>
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

  infoBox: { borderWidth: 1, borderRadius: 10, padding: 14 },
  infoText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  partCard: { borderWidth: 1, borderRadius: 10, padding: 12, gap: 8 },
  partLabel: { alignSelf: "flex-start", borderWidth: 1, borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  partName: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  partDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  gridBox: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 10 },
  gridRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  gridLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 68 },
  gridFrets: { flexDirection: "row", gap: 6, flex: 1 },
  gridFret: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignItems: "center" },
  gridFretNum: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  gridNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 19 },

  stringsBox: { borderWidth: 1 },
  stringRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 1 },
  stringNum: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stringNumText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  noteCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  noteText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  nickName: { fontSize: 13.5, fontFamily: "Inter_600SemiBold" },
  thickness: { fontSize: 11.5, fontFamily: "Inter_400Regular" },

  handCard: { borderWidth: 1, borderRadius: 10, padding: 14, gap: 6 },
  handTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  handDesc: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  factBox: { borderWidth: 1, borderRadius: 10, padding: 16, gap: 8, alignItems: "center" },
  factText: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold", textAlign: "center" },
  factSub: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "center" },

  nextBox: { borderWidth: 1, padding: 18 },
  nextRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  nextNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  nextText: { flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
