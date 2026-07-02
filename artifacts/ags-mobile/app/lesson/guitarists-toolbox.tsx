import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import LessonLayout from "@/components/lesson-layout";
import { useBeginnerTrail } from "@/hooks/useBeginnerTrail";
import { useColors } from "@/hooks/useColors";
import { CATEGORY_META, TECHNIQUES, type Category } from "@/lib/toolboxData";

const ORANGE = "#ff6b35";
const CATEGORIES: Category[] = ["expressive", "rhythmic", "melodic", "advanced", "tone", "articulation"];

// ── Sub-components ─────────────────────────────────────────────────────────

function H2({ text, color = ORANGE }: { text: string; color?: string }) {
  return <Text style={[styles.h2, { color }]}>{text}</Text>;
}

function Body({ children }: { children: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{children}</Text>;
}

function Callout({ children, color = ORANGE }: { children: string; color?: string }) {
  return (
    <View style={[styles.callout, { borderLeftColor: color, backgroundColor: color + "15" }]}>
      <Text style={[styles.calloutText, { color }]}>{children}</Text>
    </View>
  );
}

function WhyItem({ n, label, text }: { n: string; label: string; text: string }) {
  const colors = useColors();
  return (
    <View style={styles.whyRow}>
      <View style={[styles.whyNum, { backgroundColor: ORANGE + "22", borderColor: ORANGE + "44" }]}>
        <Text style={[styles.whyNumText, { color: ORANGE }]}>{n}</Text>
      </View>
      <View style={styles.whyBody}>
        <Text style={[styles.whyLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.whyText, { color: colors.mutedForeground }]}>{text}</Text>
      </View>
    </View>
  );
}

function CategorySection({ category }: { category: Category }) {
  const router = useRouter();
  const colors = useColors();
  const meta = CATEGORY_META[category];
  const techniques = TECHNIQUES.filter((t) => t.category === category);

  return (
    <View style={styles.catSection}>
      <View style={[styles.catHeader, { borderLeftColor: meta.color, backgroundColor: meta.color + "0D" }]}>
        <Text style={[styles.catLabel, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
        <Text style={[styles.catBlurb, { color: colors.mutedForeground }]}>{meta.blurb}</Text>
      </View>
      {techniques.map((t, i) => (
        <Pressable
          key={t.slug}
          onPress={() => router.push(`/lesson/technique/${t.slug}` as any)}
          style={({ pressed }) => [
            styles.techRow,
            {
              borderColor: meta.color + "33",
              backgroundColor: pressed ? meta.color + "12" : meta.color + "06",
              borderBottomWidth: i < techniques.length - 1 ? 1 : 0,
            },
          ]}
        >
          <View style={[styles.techNum, { backgroundColor: meta.color + "22" }]}>
            <Text style={[styles.techNumText, { color: meta.color }]}>{t.num}</Text>
          </View>
          <Text style={[styles.techName, { color: colors.foreground }]}>{t.name}</Text>
          <Text style={[styles.techArrow, { color: meta.color }]}>›</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function GuitaristsToolboxLesson() {
  const { markLessonViewed } = useBeginnerTrail();
  useEffect(() => { markLessonViewed(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <LessonLayout
      kicker="Lesson 10.2 · Techniques"
      title="The Guitarist's Toolbox"
      practiceHref="/drill/scales"
      practiceLabel="Drill this now — Scale Practice"
      intro={[
        "The guitar has long been revered as one of the most expressive instruments ever invented. Learning how versatile the guitar is in expressing sound can be daunting for the budding guitarist, because there are seemingly infinite ways you can apply yourself to the instrument to squeeze a sound out of it.",
        "From Jimi Hendrix to Eddie Van Halen and then later with Steve Vai, the guitar has gone from being predominantly an accompanying instrument to being the lead instrument in so many genres, only really matched by the vocalist in a band.",
        "Guitaristic techniques are the tools that bring your playing to life, transforming notes and scales into expressive, memorable music. They allow you to shape your tone, rhythm, and phrasing, giving your improvisation character and emotion.",
      ]}
    >
      {/* ── WHY THEY MATTER ───────────────────────── */}
      <View style={styles.section}>
        <H2 text="WHY THEY MATTER" />
        <View style={styles.whyList}>
          <WhyItem n="1" label="Expressiveness" text="Techniques like bends, vibrato, and slides add emotional depth and allow you to communicate feelings through your music." />
          <WhyItem n="2" label="Creativity" text="Advanced techniques like tapping, string skipping, and sweep picking open up new melodic and rhythmic possibilities, expanding your musical vocabulary." />
          <WhyItem n="3" label="Dynamics" text="Methods like palm muting, ghost notes, and volume swells create contrast and dimension, making your playing more engaging." />
          <WhyItem n="4" label="Individuality" text="Incorporating a mix of techniques helps you develop a unique style, setting your improvisation apart." />
          <WhyItem n="5" label="Versatility" text="Mastering a variety of techniques ensures you can adapt to different genres and musical situations, from bluesy bends to shred-worthy legato runs." />
        </View>
      </View>

      {/* ── HOW TO PRACTISE ───────────────────────── */}
      <View style={styles.section}>
        <H2 text="HOW TO USE THIS TOOLBOX" />
        <Body>
          {"Do not try to master all thirty techniques at once. Tap any technique below to open its full lesson. Choose one, set a timer for 10 to 20 minutes, and apply it to a small musical idea. The technique should change the expression of the idea, not hide the fact that the idea is weak."}
        </Body>
        <Callout color={ORANGE}>
          {"A practical routine: isolate the movement → play it slowly → check tone and timing → place it into a phrase → improvise freely for two minutes with that technique as your main focus.\n\nThis turns technique into musical instinct rather than disconnected exercise work."}
        </Callout>
      </View>

      {/* ── TECHNIQUE CATEGORIES ──────────────────── */}
      <View style={styles.section}>
        <H2 text="THE 30 TECHNIQUES" />
        <Body>{"Tap any technique to open its full lesson — description, musical example, and a specific practice challenge unique to that technique."}</Body>
        {CATEGORIES.map((cat) => (
          <CategorySection key={cat} category={cat} />
        ))}
      </View>

      {/* ── COMBINING TECHNIQUES ──────────────────── */}
      <View style={styles.section}>
        <H2 text="COMBINING TECHNIQUES" />
        <Body>
          {"The toolbox becomes powerful when techniques are combined with taste. A phrase might begin with a slide, target a chord tone with an arpeggio, use syncopation to create groove, then finish with vibrato. None of those devices need to be difficult on their own. The artistry comes from sequencing them in a way that feels like a complete musical sentence."}
        </Body>
        <Callout color={ORANGE}>
          {"Technique should always serve the song, the groove and the emotional message. The best players do not use every technique in every solo. They choose the tool that makes the phrase speak.\n\nLove & Light,\nRob Lobasso"}
        </Callout>
      </View>
    </LessonLayout>
  );
}

const styles = StyleSheet.create({
  section:  { gap: 12 },
  h2:       { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  body:     { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21, color: "rgba(255,255,255,0.55)" },
  callout:  { borderLeftWidth: 3, borderRadius: 8, padding: 14 },
  calloutText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },

  whyList:  { gap: 10 },
  whyRow:   { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  whyNum:   { width: 28, height: 28, borderRadius: 14, borderWidth: 1, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  whyNumText: { fontSize: 12, fontFamily: "SpaceGrotesk_700Bold" },
  whyBody:  { flex: 1, gap: 2 },
  whyLabel: { fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  whyText:  { fontSize: 12.5, fontFamily: "Inter_400Regular", lineHeight: 19 },

  catSection: { gap: 0, borderRadius: 10, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)" },
  catHeader:  { borderLeftWidth: 3, padding: 12, gap: 3 },
  catLabel:   { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  catBlurb:   { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },

  techRow:    { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 11, paddingHorizontal: 12, borderTopWidth: 1 },
  techNum:    { width: 26, height: 26, borderRadius: 7, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  techNumText: { fontSize: 11, fontFamily: "SpaceGrotesk_700Bold" },
  techName:   { fontSize: 13.5, fontFamily: "Inter_500Medium", flex: 1 },
  techArrow:  { fontSize: 18, fontFamily: "Inter_400Regular", marginRight: 2 },
});
