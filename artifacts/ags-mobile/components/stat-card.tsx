import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppIcon, type AppIconName } from "@/components/app-icon";
import { useColors } from "@/hooks/useColors";

interface Props {
  icon: AppIconName;
  label: string;
  value: string;
  tint?: string;
}

export function StatCard({ icon, label, value, tint }: Props) {
  const colors = useColors();
  const accent = tint ?? colors.accent;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius },
      ]}
    >
      <AppIcon name={icon} size={18} color={accent} />
      <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    alignItems: "center",
    gap: 6,
  },
  value: { fontSize: 22, fontFamily: "SpaceGrotesk_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.5 },
});
