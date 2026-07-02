import { AppIcon } from "@/components/app-icon";
import { type Href, useRouter } from "expo-router";
import React, { type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { useColors } from "@/hooks/useColors";

interface Props {
  kicker: string;
  title: string;
  intro: string[];
  practiceHref: Href;
  practiceLabel: string;
  children: ReactNode;
}

// Shared chrome for a teaching ("Learn") screen on the phone: a back link, a
// styled header, the narrative intro paragraphs, the topic-specific study
// material (children), and a call to action that launches the matching drill.
export default function LessonLayout({
  kicker,
  title,
  intro,
  practiceHref,
  practiceLabel,
  children,
}: Props) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 24;

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backRow}>
          <AppIcon name="arrow-left" size={16} color={colors.mutedForeground} />
          <Text style={[styles.backText, { color: colors.mutedForeground }]}>Back to lessons</Text>
        </Pressable>

        <Text style={[styles.kicker, { color: colors.primary }]}>{kicker.toUpperCase()}</Text>
        <Text style={[styles.title, { color: colors.accent }]}>{title}</Text>

        <View style={styles.intro}>
          {intro.map((p, i) => (
            <Text key={i} style={[styles.introText, { color: colors.mutedForeground }]}>
              {p}
            </Text>
          ))}
        </View>

        <View style={styles.body}>{children}</View>

        <View
          style={[
            styles.cta,
            { borderColor: colors.accent, backgroundColor: "rgba(0,255,213,0.06)", borderRadius: colors.radius },
          ]}
        >
          <Text style={[styles.ctaSub, { color: colors.mutedForeground }]}>Ready to test what you've learned?</Text>
          <Pressable
            onPress={() => router.push(practiceHref)}
            style={({ pressed }) => [
              styles.ctaBtn,
              { borderColor: colors.accent, backgroundColor: "rgba(0,255,213,0.12)", opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <AppIcon name="play" size={15} color={colors.accent} />
            <Text style={[styles.ctaBtnText, { color: colors.accent }]}>{practiceLabel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  backRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 16 },
  backText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  kicker: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  title: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", marginTop: 6, lineHeight: 34 },
  intro: { marginTop: 14, gap: 12 },
  introText: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 23 },
  body: { marginTop: 26, gap: 26 },
  cta: { marginTop: 30, padding: 20, borderWidth: 1, alignItems: "center" },
  ctaSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
  },
  ctaBtnText: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold" },
});
