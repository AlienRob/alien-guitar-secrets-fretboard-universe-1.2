import { AppIcon } from "@/components/app-icon";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";
import { playSequence } from "@/lib/audio";
import { INTERVALS } from "@/lib/musicTheory";

// Every interval is demonstrated from the same root so the ear can compare
// them directly. C4 is MIDI 60; the audio lib uses pitch values (MIDI - 24).
const ROOT_VALUE = 60 - 24;
const MELODIC_STAGGER_MS = 520;

interface Row {
  name: keyof typeof INTERVALS;
  quality: string;
  character: string;
  hook: string;
}

const ROWS: Row[] = [
  { name: "Minor 2nd", quality: "Minor", character: "Tense, unsettling", hook: "Jaws theme" },
  { name: "Major 2nd", quality: "Major", character: "Bright, stepping", hook: "Happy Birthday (first two notes)" },
  { name: "Minor 3rd", quality: "Minor", character: "Sad, soulful", hook: "Smoke on the Water" },
  { name: "Major 3rd", quality: "Major", character: "Happy, warm", hook: "When the Saints Go Marching In" },
  { name: "Perfect 4th", quality: "Perfect", character: "Strong, stable", hook: "Here Comes the Bride" },
  { name: "Tritone", quality: "Aug / dim", character: "Restless, edgy", hook: "The Simpsons theme" },
  { name: "Perfect 5th", quality: "Perfect", character: "Open, powerful (the power chord)", hook: "Twinkle Twinkle Little Star" },
  { name: "Minor 6th", quality: "Minor", character: "Bittersweet, longing", hook: "The Entertainer" },
  { name: "Major 6th", quality: "Major", character: "Sweet, lifting", hook: "My Bonnie Lies Over the Ocean" },
  { name: "Minor 7th", quality: "Minor", character: "Bluesy, tense", hook: "Star Trek (original theme)" },
  { name: "Major 7th", quality: "Major", character: "Dreamy, yearning", hook: "Take On Me (chorus leap)" },
  { name: "Octave", quality: "Perfect", character: "The same note, higher — full and resolved", hook: "Somewhere Over the Rainbow" },
];

const QUALITY_COLOR: Record<string, string> = {
  Perfect: "#00FFD5",
  Major: "#FFD700",
  Minor: "#00BFFF",
  "Aug / dim": "#FF6B9D",
};

export default function IntervalsLesson() {
  const colors = useColors();
  const { markLessonViewed, markIntervalsViewed } = useBeginnerTrail();
  const [playing, setPlaying] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    markLessonViewed();
    markIntervalsViewed();
    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const play = (name: keyof typeof INTERVALS, harmonic: boolean) => {
    const key = `${name}-${harmonic ? "h" : "m"}`;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPlaying(key);
    const notes = [ROOT_VALUE, ROOT_VALUE + INTERVALS[name]];
    playSequence(notes, harmonic ? 0 : MELODIC_STAGGER_MS);
    timerRef.current = setTimeout(() => {
      if (mountedRef.current) setPlaying((p) => (p === key ? null : p));
    }, harmonic ? 900 : 1500);
  };

  return (
    <LessonLayout
      kicker="Training · Intervals"
      title="Demystifying Musical Intervals"
      practiceHref="/drill/intervals"
      practiceLabel="Drill this now — Interval Training"
      intro={[
        "An interval is simply the distance between two notes — and intervals are the building blocks of every chord, scale and melody you'll ever play. Master them and the whole fretboard begins to make sense.",
        "We measure that distance in semitones — one fret on the guitar equals one semitone (a half step). Twelve semitones make an octave, where the note repeats higher up.",
        "Each interval also has a name and a quality — perfect, major or minor. Perfect intervals (the unison, 4th, 5th and octave) sound stable and open. Major intervals are always one semitone wider than their minor counterparts. Tap the buttons below to train your ear to recognise each one.",
      ]}
    >
      <View style={{ gap: 10 }}>
        <Text style={[styles.h2, { color: colors.mutedForeground }]}>INTERVAL REFERENCE TABLE</Text>
        <Text style={[styles.note, { color: colors.mutedForeground }]}>
          Every example plays from the same starting note. "Hear it" plays the two notes one after another (melodic);
          "Together" plays them at the same time (harmonic).
        </Text>

        <View style={[styles.table, { borderColor: colors.border, borderRadius: colors.radius }]}>
          {ROWS.map((row, i) => {
            const melodicActive = playing === `${row.name}-m`;
            const harmonicActive = playing === `${row.name}-h`;
            return (
              <View
                key={row.name}
                style={[styles.row, i < ROWS.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
              >
                <View style={styles.rowHead}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.intName, { color: colors.foreground }]}>{row.name}</Text>
                    <Text style={[styles.quality, { color: QUALITY_COLOR[row.quality] ?? colors.mutedForeground }]}>
                      {row.quality.toUpperCase()} · {INTERVALS[row.name]} semitones
                    </Text>
                  </View>
                </View>
                <Text style={[styles.character, { color: colors.mutedForeground }]}>
                  <Text style={{ color: colors.foreground }}>{row.character}.</Text> {row.hook}
                </Text>
                <View style={styles.btnRow}>
                  <Pressable
                    onPress={() => play(row.name, false)}
                    style={({ pressed }) => [
                      styles.btn,
                      {
                        borderColor: melodicActive ? colors.accent : colors.border,
                        backgroundColor: melodicActive ? "rgba(0,255,213,0.16)" : colors.card,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <AppIcon name="play" size={13} color={melodicActive ? colors.accent : colors.foreground} />
                    <Text style={[styles.btnText, { color: melodicActive ? colors.accent : colors.foreground }]}>Hear it</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => play(row.name, true)}
                    style={({ pressed }) => [
                      styles.btn,
                      {
                        borderColor: harmonicActive ? colors.accent : colors.border,
                        backgroundColor: harmonicActive ? "rgba(0,255,213,0.16)" : colors.card,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <AppIcon name="music" size={13} color={harmonicActive ? colors.accent : colors.foreground} />
                    <Text style={[styles.btnText, { color: harmonicActive ? colors.accent : colors.foreground }]}>Together</Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  h2: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  note: { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 19 },
  table: { borderWidth: 1, overflow: "hidden" },
  row: { padding: 14, gap: 10 },
  rowHead: { flexDirection: "row", alignItems: "center" },
  intName: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
  quality: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5, marginTop: 2 },
  character: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, fontStyle: "italic" },
  btnRow: { flexDirection: "row", gap: 10 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
