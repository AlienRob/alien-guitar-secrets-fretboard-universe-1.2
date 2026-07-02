import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { ScreenBg } from "@/components/screen-bg";
import { useColors } from "@/hooks/useColors";

interface ToolCardProps {
  title: string;
  subtitle: string;
  sf: string;
  mci: keyof typeof MaterialCommunityIcons.glyphMap;
  accent: string;
  onPress: () => void;
}

function ToolCard({ title, subtitle, sf, mci, accent, onPress }: ToolCardProps) {
  const colors = useColors();
  const isIOS = Platform.OS === "ios";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: pressed ? accent : colors.border,
          backgroundColor: pressed
            ? `${accent}18`
            : colors.card,
          borderRadius: colors.radius,
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      <LinearGradient
        colors={[`${accent}22`, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: colors.radius }]}
      />
      <View style={[styles.iconCircle, { backgroundColor: `${accent}22`, borderColor: `${accent}44` }]}>
        {isIOS ? (
          <SymbolView name={sf as never} tintColor={accent} size={32} />
        ) : (
          <MaterialCommunityIcons name={mci} size={32} color={accent} />
        )}
      </View>
      <View style={styles.cardText}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{subtitle}</Text>
      </View>
      <View style={[styles.arrow, { borderColor: accent }]}>
        <Text style={[styles.arrowText, { color: accent }]}>›</Text>
      </View>
    </Pressable>
  );
}

export default function PrecisionLabsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.heading, { color: colors.foreground }]}>
          Precision Labs
        </Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>
          Professional tools for every player
        </Text>

        <View style={styles.cards}>
          <ToolCard
            title="Tuner"
            subtitle="Chromatic tuner — guitar, bass, ukulele and more"
            sf="tuningfork"
            mci="guitar-electric"
            accent="#00d2d2"
            onPress={() => router.push("/tuner" as never)}
          />
          <ToolCard
            title="Metronome"
            subtitle="Tap tempo, subdivisions, custom time signatures"
            sf="metronome.fill"
            mci="metronome"
            accent="#b942ff"
            onPress={() => router.push("/metronome" as never)}
          />
        </View>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  heading: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  sub: {
    fontSize: 14,
    marginBottom: 28,
  },
  cards: {
    gap: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    borderWidth: 1,
    gap: 16,
    overflow: "hidden",
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cardText: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  cardSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  arrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 20,
    lineHeight: 22,
    marginLeft: 1,
  },
});
