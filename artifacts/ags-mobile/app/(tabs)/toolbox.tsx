import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { useColors } from "@/hooks/useColors";
import { CATEGORY_META, TECHNIQUES, Category } from "@/lib/toolboxData";

const CATEGORY_ORDER: Category[] = [
  "expressive",
  "rhythmic",
  "melodic",
  "advanced",
  "tone",
  "articulation",
];

export default function ToolboxTab() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const router = useRouter();
  const [active, setActive] = useState<Category>("expressive");

  const meta = CATEGORY_META[active];
  const techniques = TECHNIQUES.filter((t) => t.category === active);
  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 100;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]}
      >
        {/* ── INTRO ─────────────────────────────────────────── */}
        <View style={[styles.intro, { paddingTop: topPad }]}>
          <Text style={styles.introEyebrow}>LESSON 10.2</Text>
          <Text style={styles.introTitle}>The Guitarist's Toolbox</Text>
          <Text style={styles.introBody}>
            Thirty techniques — from expressive bends and vibrato to sweep
            picking and artificial harmonics. Each lesson breaks down the
            concept, shows you a musical example, gives you a focused
            practice challenge, and leaves you with one key insight to carry
            into every playing session.
          </Text>
          <Text style={[styles.introBody, { marginTop: 6 }]}>
            Pick a category below to get started.
          </Text>
        </View>

        {/* ── CATEGORY TAB STRIP (sticky) ───────────────────── */}
        <View style={styles.tabStripWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabStrip}
          >
            {CATEGORY_ORDER.map((cat) => {
              const m = CATEGORY_META[cat];
              const isActive = cat === active;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setActive(cat)}
                  style={({ pressed }) => [
                    styles.tabPill,
                    {
                      backgroundColor: isActive ? m.color + "22" : "rgba(255,255,255,0.06)",
                      borderColor: isActive ? m.color : "rgba(255,255,255,0.10)",
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabLabel,
                      { color: isActive ? m.color : "rgba(255,255,255,0.45)" },
                    ]}
                  >
                    {m.label.toUpperCase()}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── CATEGORY HEADER ───────────────────────────────── */}
        <View style={[styles.catHeader, { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 6 }]}>
          <View style={[styles.catAccent, { backgroundColor: meta.color }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.catTitle, { color: meta.color }]}>
              {meta.label.toUpperCase()} TECHNIQUES
            </Text>
            <Text style={styles.catBlurb}>{meta.blurb}</Text>
          </View>
        </View>

        {/* ── TECHNIQUE CARDS ───────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, gap: 10, marginTop: 8 }}>
          {techniques.map((t) => (
            <Pressable
              key={t.slug}
              onPress={() => router.push(`/lesson/technique/${t.slug}` as never)}
              style={({ pressed }) => [
                styles.card,
                { borderColor: meta.color + "44", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <LinearGradient
                colors={[meta.color + "18", meta.color + "06"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={[styles.numBadge, { backgroundColor: meta.color + "22", borderColor: meta.color + "55" }]}>
                <Text style={[styles.numText, { color: meta.color }]}>{t.num}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={styles.cardName}>{t.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {t.description.split("\n")[0]}
                </Text>
              </View>
              <Text style={[styles.cardChevron, { color: meta.color }]}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  introEyebrow: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    color: "rgba(167,139,250,0.7)",
    marginBottom: 6,
  },
  introTitle: {
    fontSize: 28,
    fontFamily: "SpaceGrotesk_700Bold",
    color: "#fff",
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  introBody: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(220,210,255,0.75)",
    lineHeight: 22,
  },

  tabStripWrap: {
    backgroundColor: "rgba(5,8,22,0.97)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    paddingVertical: 10,
  },
  tabStrip: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1.5,
  },

  catHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  catAccent: {
    width: 3,
    borderRadius: 2,
    height: "100%",
    minHeight: 36,
    marginTop: 2,
  },
  catTitle: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginBottom: 3,
  },
  catBlurb: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(220,210,255,0.65)",
    lineHeight: 19,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    overflow: "hidden",
  },
  numBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  numText: {
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  cardBody: {
    flex: 1,
  },
  cardName: {
    fontSize: 15,
    fontFamily: "SpaceGrotesk_600SemiBold",
    color: "#fff",
    marginBottom: 3,
  },
  cardDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(220,210,255,0.65)",
    lineHeight: 17,
  },
  cardChevron: {
    fontSize: 24,
    fontFamily: "Inter_400Regular",
    flexShrink: 0,
    marginRight: -2,
  },
});
