import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { AppIcon, type AppIconName } from "@/components/app-icon";
import { useColors } from "@/hooks/useColors";

interface Props {
  icon: AppIconName;
  title: string;
  blurb: string;
  best?: number;
  onPress: () => void;
}

export function PracticeCard({ icon, title, blurb, best, onPress }: Props) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: "rgba(106,0,255,0.18)", borderRadius: colors.radius },
        ]}
      >
        <AppIcon name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <Text style={[styles.blurb, { color: colors.mutedForeground }]}>{blurb}</Text>
      </View>
      {typeof best === "number" && best > 0 ? (
        <View style={styles.best}>
          <Text style={[styles.bestValue, { color: colors.accent }]}>{best}/10</Text>
          <Text style={[styles.bestLabel, { color: colors.mutedForeground }]}>best</Text>
        </View>
      ) : (
        <AppIcon name="chevron-right" size={22} color={colors.mutedForeground} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderWidth: 1,
  },
  iconWrap: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  body: { flex: 1, gap: 3 },
  title: { fontSize: 17, fontFamily: "SpaceGrotesk_600SemiBold" },
  blurb: { fontSize: 13, fontFamily: "Inter_400Regular" },
  best: { alignItems: "flex-end" },
  bestValue: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
  bestLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textTransform: "uppercase" },
});
