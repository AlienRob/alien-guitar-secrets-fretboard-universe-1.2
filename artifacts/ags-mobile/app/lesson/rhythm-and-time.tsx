import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useColors } from "@/hooks/useColors";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";

const AMBER  = "#f59e0b";
const TEAL   = "#00FFD5";
const PURPLE = "#a78bfa";
const PINK   = "#FF6B9D";
const GREEN  = "#A8FF3E";
const ORANGE = "#FF6B35";

// ── Shared sub-components ─────────────────────────────────────────────────────

function H2({ text, color = AMBER }: { text: string; color?: string }) {
  return <Text style={[styles.h2, { color }]}>{text}</Text>;
}

function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

function Callout({ children, color = AMBER }: { children: string; color?: string }) {
  return (
    <View style={[styles.callout, { borderLeftColor: color, backgroundColor: color + "15" }]}>
      <Text style={[styles.calloutText, { color }]}>{children}</Text>
    </View>
  );
}

function NoteValueCard({
  name, beats, counting, symbol, color,
}: { name: string; beats: string; counting: string; symbol: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.noteCard, { borderColor: color + "55", backgroundColor: color + "0D" }]}>
      <View style={styles.noteCardLeft}>
        <Text style={[styles.noteSymbol, { color }]}>{symbol}</Text>
      </View>
      <View style={styles.noteCardRight}>
        <Text style={[styles.noteName, { color }]}>{name}</Text>
        <Text style={[styles.noteBeats, { color: colors.foreground }]}>{beats}</Text>
        <Text style={[styles.noteCounting, { color: colors.mutedForeground }]}>{counting}</Text>
      </View>
    </View>
  );
}

function TimeSigCard({
  sig, name, feel, example, color,
}: { sig: string; name: string; feel: string; example: string; color: string }) {
  const colors = useColors();
  return (
    <View style={[styles.timeSigCard, { borderColor: color + "55", backgroundColor: color + "0D" }]}>
      <Text style={[styles.timeSigNum, { color }]}>{sig}</Text>
      <View style={styles.timeSigRight}>
        <Text style={[styles.timeSigName, { color }]}>{name}</Text>
        <Text style={[styles.timeSigFeel, { color: colors.foreground }]}>{feel}</Text>
        <Text style={[styles.timeSigEx, { color: colors.mutedForeground }]}>{example}</Text>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RhythmAndTimeLesson() {
  const colors = useColors();
  const { markLessonViewed } = useBeginnerTrail();
  useEffect(() => { markLessonViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LessonLayout
      kicker="Rhythm · Foundations"
      title="Rhythm & Time"
      practiceHref="/(tabs)/practice"
      practiceLabel="Go to Practice"
      intro={[
        "For some guitarists, scales and chords are the challenge. For others, it's time and rhythm that stumps them. Either way, a solid understanding of rhythm is the foundation everything else is built on.",
        "This lesson covers everything from tempo and note values through to time signatures, counting systems, and the difference between straight and swing feel.",
      ]}
    >

      {/* ── TEMPO ────────────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="TEMPO" />
        <Body>
          {"Tempo is Latin for Time. In music it indicates the pulse — the speed at which a piece moves — and is measured in beats per minute (BPM). Think of it as a ticking clock that everything else locks to."}
        </Body>
        <Body>
          {"Unlike a clock fixed at 60 ticks per minute, musical tempo is adjustable: 60 BPM is slow and spacious; 180 BPM is driving and fast. When a drummer counts in the band with four stick clicks, they're setting the tempo for everyone to lock to."}
        </Body>
        <Callout color={AMBER}>
          {"Each pulse is generally measured in quarter note values. The quarter note is the heartbeat of music — everything else is a fraction of it, or a multiple of it."}
        </Callout>
        <Body>
          {"As emotional beings we tend to naturally speed up when excited — which is exactly why practicing with a metronome is non-negotiable. Even a simple exercise of picking notes to a steady 80 BPM will show immediate improvement in your timing. The more you practice at tempo, the more you find space within the pulse — and that space is where creativity lives."}
        </Body>
      </View>

      {/* ── NOTE VALUES ──────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="NOTE VALUES" />
        <Body>
          {"A note's value is how long it is held for, measured in beats. We divide notes into smaller and smaller fractions — called subdivisions — like slicing a pizza into equal pieces. The quarter note equals one beat; everything else is built from there."}
        </Body>

        <NoteValueCard
          name="Whole Note  (Semibreve)"
          beats="4 beats"
          counting="Count: 1 – 2 – 3 – 4"
          symbol="𝅝"
          color={GREEN}
        />
        <NoteValueCard
          name="Half Note  (Minim)"
          beats="2 beats"
          counting="Count: 1 – 2  |  1 – 2"
          symbol="𝅗𝅥"
          color={TEAL}
        />
        <NoteValueCard
          name="Quarter Note  (Crotchet)"
          beats="1 beat  ← the reference"
          counting="Count: 1 | 2 | 3 | 4"
          symbol="♩"
          color={AMBER}
        />
        <NoteValueCard
          name="Eighth Note  (Quaver)"
          beats="½ beat"
          counting="Count: 1-and 2-and 3-and 4-and"
          symbol="♪"
          color={ORANGE}
        />
        <NoteValueCard
          name="Sixteenth Note  (Semiquaver)"
          beats="¼ beat"
          counting="Count: 1-e-and-a  2-e-and-a  3-e-and-a  4-e-and-a"
          symbol="𝅘𝅥𝅯"
          color={PINK}
        />

        <Callout color={TEAL}>
          {"The pizza analogy:\n\nWhole = full pizza\nHalf = 2 slices\nQuarter = 4 slices\nEighth = 8 slices\nSixteenth = 16 slices\n\nSame pizza. More cuts = shorter duration per piece."}
        </Callout>
      </View>

      {/* ── REST VALUES ──────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="REST VALUES" />
        <Body>
          {"Rests are the complete opposite of notes — blocks of silence. But they are counted in exactly the same way, using the same beat values. Rests are not empty space — they are as musical as the notes around them. Learning to feel a rest rather than fill it is one of the marks of a mature player."}
        </Body>
        <View style={[styles.restTable, { borderColor: AMBER + "33" }]}>
          <View style={[styles.restHeader, { backgroundColor: AMBER + "22" }]}>
            <Text style={[styles.restCol, { color: AMBER, flex: 2 }]}>Rest</Text>
            <Text style={[styles.restCol, { color: AMBER }]}>Duration</Text>
            <Text style={[styles.restCol, { color: AMBER }]}>Same as</Text>
          </View>
          {[
            { name: "Whole Rest",      dur: "4 beats",  same: "Whole note",      color: GREEN  },
            { name: "Half Rest",       dur: "2 beats",  same: "Half note",       color: TEAL   },
            { name: "Quarter Rest",    dur: "1 beat",   same: "Quarter note",    color: AMBER  },
            { name: "Eighth Rest",     dur: "½ beat",   same: "Eighth note",     color: ORANGE },
            { name: "Sixteenth Rest",  dur: "¼ beat",   same: "Sixteenth note",  color: PINK   },
          ].map((r, i) => (
            <View key={i} style={[styles.restRow, i % 2 === 0 ? { backgroundColor: AMBER + "08" } : {}]}>
              <Text style={[styles.restCol, { color: r.color, flex: 2 }]}>{r.name}</Text>
              <Text style={[styles.restCol, { color: colors.foreground }]}>{r.dur}</Text>
              <Text style={[styles.restCol, { color: colors.mutedForeground }]}>{r.same}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── TRIPLETS ─────────────────────────────────── */}
      <View style={styles.section}>
        <H2 text="TRIPLETS" />
        <Body>
          {"A triplet squeezes three equal notes into the space of two. The most common is the eighth note triplet: three eighth notes in the time of one quarter note beat. The number 3 is written over the group to show it's a triplet."}
        </Body>
        <Body>
          {"Triplets give music a rolling, forward-moving momentum — a slightly different feel from straight eighth notes. Examples you already know:"}
        </Body>
        <Callout color={PURPLE}>
          {"'Still Got the Blues' by Gary Moore — 6/8 time, built on triplet feel.\n\n'Since I've Been Loving You' by Led Zeppelin — 12/8 time, the heavy triplet groove throughout the whole song."}
        </Callout>
      </View>

      {/* ── HOW TO COUNT BEATS ───────────────────────── */}
      <View style={styles.section}>
        <H2 text="HOW TO COUNT BEATS" />
        <Body>
          {"Each note value has its own counting system — like a signature way of speaking the rhythm out loud. Counting aloud while you play is one of the fastest ways to lock in your timing."}
        </Body>
        <View style={[styles.countTable, { borderColor: TEAL + "33" }]}>
          <View style={[styles.countHeader, { backgroundColor: TEAL + "22" }]}>
            <Text style={[styles.countCol, { color: TEAL, flex: 2 }]}>Note</Text>
            <Text style={[styles.countCol, { color: TEAL, flex: 3 }]}>Count aloud (one bar of 4/4)</Text>
          </View>
          {[
            { note: "Whole",      count: "1 – – – – – – –",                  color: GREEN  },
            { note: "Half",       count: "1 – – | 3 – –",                    color: TEAL   },
            { note: "Quarter",    count: "1 | 2 | 3 | 4",                    color: AMBER  },
            { note: "Eighth",     count: "1-and 2-and 3-and 4-and",          color: ORANGE },
            { note: "Sixteenth",  count: "1-e-and-a 2-e-and-a 3-e-and-a 4-e-and-a", color: PINK },
            { note: "Triplet",    count: "1-trip-let 2-trip-let 3-trip-let 4-trip-let", color: PURPLE },
          ].map((r, i) => (
            <View key={i} style={[styles.countRow, i % 2 === 0 ? { backgroundColor: TEAL + "08" } : {}]}>
              <Text style={[styles.countCol, { color: r.color, flex: 2 }]}>{r.note}</Text>
              <Text style={[styles.countCol, { color: colors.mutedForeground, flex: 3, fontSize: 11 }]}>{r.count}</Text>
            </View>
          ))}
        </View>
        <Callout color={AMBER}>
          {"Practical habit: set a metronome to 60–80 BPM. Count the beat aloud while you tap your foot on beats 1, 2, 3, and 4. Add the \"and\" for eighths. Add \"e-and-a\" for sixteenths. Do this daily until it's automatic."}
        </Callout>
      </View>

      {/* ── TIME SIGNATURES ──────────────────────────── */}
      <View style={styles.section}>
        <H2 text="TIME SIGNATURES" />
        <Body>
          {"Time signatures are the framework that organises music into measurable bars (also called measures). Music notes are grouped into bars divided by bar lines. The time signature tells you two things:"}
        </Body>
        <Callout color={GREEN}>
          {"TOP NUMBER = how many beats are in each bar.\n\nBOTTOM NUMBER = what note value gets one beat.\n   4 = quarter note gets one beat\n   8 = eighth note gets one beat\n   2 = half note gets one beat"}
        </Callout>
        <Body>
          {"So 4/4 means: 4 beats per bar, each beat is a quarter note. 3/4 means: 3 beats per bar, each beat is a quarter note (the waltz feel). 6/8 means: 6 beats per bar, each beat is an eighth note (triplet-based)."}
        </Body>

        <TimeSigCard
          sig="4/4" name="Common Time" color={AMBER}
          feel="4 quarter-note beats per bar. The most common time signature in Western music."
          example="Rock, pop, blues, jazz — almost everything you know."
        />
        <TimeSigCard
          sig="3/4" name="Waltz Time" color={TEAL}
          feel="3 quarter-note beats per bar. A lilting, dance-like feel."
          example="'Manic Depression' by Jimi Hendrix. 'The House of the Rising Sun' by The Animals."
        />
        <TimeSigCard
          sig="2/4" name="March Time" color={GREEN}
          feel="2 quarter-note beats per bar. Direct and driving."
          example="Marches, polkas, faster country and bluegrass."
        />
        <TimeSigCard
          sig="6/8" name="Compound Double" color={PURPLE}
          feel="6 eighth-note beats per bar — felt as 2 strong beats, each with a triplet subdivision."
          example="'Still Got the Blues' by Gary Moore. Many Irish and folk tunes."
        />
        <TimeSigCard
          sig="12/8" name="Compound Quadruple" color={ORANGE}
          feel="12 eighth-note beats per bar — felt as 4 strong beats, each with a triplet subdivision."
          example="'Since I've Been Loving You' by Led Zeppelin. Slow blues and gospel."
        />
        <TimeSigCard
          sig="5/4" name="Quintuple" color={PINK}
          feel="5 quarter-note beats per bar. Asymmetric — feels like 3+2 or 2+3."
          example="'Take Five' by Dave Brubeck. 'The Mission' theme."
        />
        <TimeSigCard
          sig="7/8" name="Septuple" color="#888"
          feel="7 eighth-note beats per bar — complex, grouped as 2+2+3 or 3+2+2."
          example="Progressive rock and metal. Dream Theater famously mixed multiple odd signatures in 'Dance of Eternity'."
        />
      </View>

      {/* ── STRAIGHT vs SWING ────────────────────────── */}
      <View style={styles.section}>
        <H2 text="STRAIGHT vs SWING FEEL" />
        <Body>
          {"Simple time (straight feel) is where beats divide evenly by two. Straight eighth notes divide the beat exactly in half — each one lasts an identical length of time."}
        </Body>
        <Body>
          {"Swing feel changes that relationship. In swung eighth notes, the second eighth note in each pair occurs two-thirds of the way through the beat instead of the halfway point. This is the same as playing the first and third hits of an eighth-note triplet — long-short, long-short."}
        </Body>
        <Callout color={ORANGE}>
          {"Straight eighths:   equal   equal   equal   equal\nSwung eighths:      long–short  long–short  long–short  long–short\n\nStraight = mechanical and even.\nSwing = loose, rolling, human."}
        </Callout>
        <Body>
          {"Swung triplets take this further: play beat 1 of the triplet, hold through beat 2 (a tied note), then play beat 3. This gives an even longer note 1 and a short note 3 — a deeper swing feel."}
        </Body>
        <Callout color={PURPLE}>
          {"Triplet feel (strict):   1 – trip – let  1 – trip – let\nSwung triplet:          1 – [tie] – let  1 – [tie] – let\n\nThe \"trip\" beat is held over — creating that lopsided, swinging groove."}
        </Callout>
        <Body>
          {"Jazz is almost always swung. Rock and metal are almost always straight. Blues and funk live on the spectrum between the two. Learning to switch between straight and swing is a powerful tool — it changes the feel of a phrase without changing a single note."}
        </Body>
      </View>

      {/* ── GROOVE & LOCKING IN ───────────────────────── */}
      <View style={styles.section}>
        <H2 text="LOCKING IN — THE IMPORTANCE OF GROOVE" />
        <Body>
          {"Knowing note values and time signatures is the theory. Groove is what happens when that theory becomes physical and automatic. Groove is when your body feels the pulse before your brain counts it."}
        </Body>
        <Body>
          {"The path there: pick a simple pattern, set your metronome to a slow tempo, and repeat it until the click disappears into the music. When you stop hearing the metronome as a separate thing and start hearing it as part of the music — that's groove."}
        </Body>
        <Callout color={GREEN}>
          {"Practice habit: choose ONE rhythmic pattern. Set metronome to 60–70 BPM. Play only that pattern for 5 minutes without stopping. Don't increase the tempo until it feels completely effortless at the current speed."}
        </Callout>
      </View>

      {/* ── RECAP ────────────────────────────────────── */}
      <View style={[styles.recap, { borderColor: colors.border, borderRadius: colors.radius }]}>
        <Text style={[styles.h2, { color: colors.mutedForeground, marginBottom: 12 }]}>QUICK RECAP</Text>
        {[
          "Tempo = the pulse speed in BPM. Always practice with a metronome.",
          "Note values divide the beat: Whole (4), Half (2), Quarter (1), Eighth (½), Sixteenth (¼).",
          "Rests are silence — counted the same way as notes, equally musical.",
          "Triplets = 3 equal notes in the space of 2. Creates a rolling, forward-moving feel.",
          "Time signature top = beats per bar. Bottom = which note value gets one beat.",
          "4/4 is the most common. 3/4 is the waltz. 6/8 and 12/8 are compound (triplet-based).",
          "Straight feel = even division. Swing feel = long-short pairs (2/3 – 1/3 split).",
          "Groove comes from repetition at tempo — keep the click, lose the thinking.",
        ].map((r, i) => (
          <View key={i} style={styles.recapRow}>
            <Text style={[styles.recapNum, { color: AMBER }]}>{i + 1}.</Text>
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

  noteCard:    { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: "row", gap: 12, alignItems: "center" },
  noteCardLeft:{ width: 36, alignItems: "center" },
  noteCardRight:{ flex: 1, gap: 2 },
  noteSymbol:  { fontSize: 24 },
  noteName:    { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  noteBeats:   { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  noteCounting:{ fontSize: 12, fontFamily: "Inter_400Regular" },

  restTable:  { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  restHeader: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10 },
  restRow:    { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10 },
  restCol:    { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },

  countTable:  { borderWidth: 1, borderRadius: 8, overflow: "hidden" },
  countHeader: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 10 },
  countRow:    { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 10 },
  countCol:    { flex: 1, fontSize: 12, fontFamily: "Inter_600SemiBold" },

  timeSigCard:  { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  timeSigNum:   { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", width: 44, textAlign: "center" },
  timeSigRight: { flex: 1, gap: 3 },
  timeSigName:  { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  timeSigFeel:  { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  timeSigEx:    { fontSize: 11.5, fontFamily: "Inter_400Regular", lineHeight: 17, fontStyle: "italic" },

  recap:    { borderWidth: 1, padding: 18 },
  recapRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  recapNum: { fontSize: 13.5, fontFamily: "SpaceGrotesk_600SemiBold" },
  recapText:{ flex: 1, fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
