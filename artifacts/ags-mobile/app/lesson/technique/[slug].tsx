import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { useColors } from "@/hooks/useColors";
import { CATEGORY_META, TECHNIQUES } from "@/lib/toolboxData";

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionLabel({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={[styles.sectionLabelDot, { backgroundColor: color }]} />
      <Text style={[styles.sectionLabelText, { color }]}>{text.toUpperCase()}</Text>
    </View>
  );
}

function BodyParagraph({ text }: { text: string }) {
  const colors = useColors();
  return <Text style={[styles.body, { color: colors.mutedForeground }]}>{text}</Text>;
}

function ContentCard({
  color,
  label,
  children,
}: {
  color: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.card, { borderColor: color + "33", backgroundColor: color + "08" }]}>
      <Text style={[styles.cardLabel, { color }]}>{label}</Text>
      {children}
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────

export default function TechniqueLessonScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const technique = TECHNIQUES.find((t) => t.slug === slug);

  if (!technique) {
    return (
      <ScreenBg>
        <View style={[styles.notFound, { paddingTop: insets.top + 16 }]}>
          <Text style={{ color: colors.foreground, fontSize: 16 }}>Technique not found.</Text>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={{ color: "#ff6b35" }}>Go back</Text>
          </Pressable>
        </View>
      </ScreenBg>
    );
  }

  const meta = CATEGORY_META[technique.category];
  const paragraphs = technique.description.split("\n\n");

  return (
    <ScreenBg>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Back ──────────────────────────────────── */}
        <Pressable onPress={() => router.back()} style={styles.backRow}>
          <Text style={[styles.backChev, { color: meta.color }]}>‹</Text>
          <Text style={[styles.backText, { color: meta.color }]}>The Guitarist's Toolbox</Text>
        </Pressable>

        {/* ── Header ────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerMeta}>
            <View style={[styles.catBadge, { backgroundColor: meta.color + "22", borderColor: meta.color + "44" }]}>
              <Text style={[styles.catBadgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
            <Text style={[styles.numText, { color: meta.color + "99" }]}>#{technique.num} of 30</Text>
          </View>
          <Text style={[styles.title, { color: colors.foreground }]}>{technique.name}</Text>
        </View>

        {/* ── Description ───────────────────────────── */}
        <View style={styles.section}>
          <SectionLabel text="What it is" color={meta.color} />
          <View style={styles.bodyBlock}>
            {paragraphs.map((p, i) => (
              <BodyParagraph key={i} text={p} />
            ))}
          </View>
        </View>

        {/* ── Musical Example ───────────────────────── */}
        <View style={styles.section}>
          <SectionLabel text="Musical Example" color={meta.color} />
          <ContentCard color={meta.color} label="TRY THIS">
            <Text style={[styles.exampleText, { color: colors.mutedForeground }]}>{technique.example}</Text>
          </ContentCard>
        </View>

        {/* ── Practice Challenge ────────────────────── */}
        <View style={styles.section}>
          <SectionLabel text="Your Challenge" color={meta.color} />
          <ContentCard color={meta.color} label="PRACTICE SESSION">
            <Text style={[styles.challengeText, { color: colors.foreground }]}>{technique.challenge}</Text>
          </ContentCard>
        </View>

        {/* ── Key Insight ───────────────────────────── */}
        <View style={styles.section}>
          <View style={[styles.insightBlock, { borderLeftColor: meta.color, backgroundColor: meta.color + "12" }]}>
            <Text style={[styles.insightLabel, { color: meta.color }]}>KEY INSIGHT</Text>
            <Text style={[styles.insightText, { color: colors.foreground }]}>{technique.insight}</Text>
          </View>
        </View>

        {/* ── Nav: prev / next ──────────────────────── */}
        <NavRow current={technique.num} color={meta.color} />
      </ScrollView>
    </ScreenBg>
  );
}

function NavRow({ current, color }: { current: number; color: string }) {
  const router = useRouter();
  const colors = useColors();
  const prev = TECHNIQUES.find((t) => t.num === current - 1);
  const next = TECHNIQUES.find((t) => t.num === current + 1);

  return (
    <View style={styles.navRow}>
      {prev ? (
        <Pressable
          onPress={() => router.replace(`/lesson/technique/${prev.slug}` as any)}
          style={({ pressed }) => [styles.navBtn, { borderColor: color + "33", opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.navArrow, { color }]}>‹</Text>
          <View>
            <Text style={[styles.navDir, { color: color + "99" }]}>Previous</Text>
            <Text style={[styles.navName, { color: colors.foreground }]}>{prev.name}</Text>
          </View>
        </Pressable>
      ) : <View style={styles.navPlaceholder} />}

      {next ? (
        <Pressable
          onPress={() => router.replace(`/lesson/technique/${next.slug}` as any)}
          style={({ pressed }) => [styles.navBtn, styles.navBtnRight, { borderColor: color + "33", opacity: pressed ? 0.7 : 1 }]}
        >
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.navDir, { color: color + "99" }]}>Next</Text>
            <Text style={[styles.navName, { color: colors.foreground }]}>{next.name}</Text>
          </View>
          <Text style={[styles.navArrow, { color }]}>›</Text>
        </Pressable>
      ) : <View style={styles.navPlaceholder} />}
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:   { flex: 1 },
  content:  { paddingHorizontal: 20, gap: 28 },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  backBtn:  { padding: 12 },

  backRow:  { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 4 },
  backChev: { fontSize: 22, lineHeight: 24, marginTop: -2 },
  backText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  header:   { gap: 8 },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 10 },
  catBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  catBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  numText:  { fontSize: 12, fontFamily: "Inter_400Regular" },
  title:    { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 34 },

  section:  { gap: 10 },
  sectionLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  sectionLabelDot: { width: 5, height: 5, borderRadius: 3 },
  sectionLabelText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },

  bodyBlock:  { gap: 12 },
  body:       { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },

  card:       { borderWidth: 1, borderRadius: 10, padding: 14, gap: 8 },
  cardLabel:  { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  exampleText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },
  challengeText: { fontSize: 13.5, fontFamily: "Inter_400Regular", lineHeight: 21 },

  insightBlock: { borderLeftWidth: 3, borderRadius: 8, padding: 14, gap: 6 },
  insightLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1.5 },
  insightText:  { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", lineHeight: 22 },

  navRow:    { flexDirection: "row", gap: 10, marginTop: 4 },
  navBtn:    { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  navBtnRight: { justifyContent: "flex-end" },
  navPlaceholder: { flex: 1 },
  navArrow:  { fontSize: 22, lineHeight: 24 },
  navDir:    { fontSize: 10, fontFamily: "Inter_400Regular" },
  navName:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
