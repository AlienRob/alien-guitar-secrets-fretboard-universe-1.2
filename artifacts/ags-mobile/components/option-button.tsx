import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";

import { useColors } from "@/hooks/useColors";

type State = "idle" | "correct" | "wrong" | "missed";

interface Props {
  label: string;
  state: State;
  disabled: boolean;
  onPress: () => void;
}

export function OptionButton({ label, state, disabled, onPress }: Props) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  let bg = colors.card;
  let border = colors.border;
  let text = colors.foreground;
  if (state === "correct" || state === "missed") {
    bg = "rgba(0,255,102,0.16)";
    border = colors.correct;
    text = colors.correct;
  } else if (state === "wrong") {
    bg = "rgba(255,59,48,0.16)";
    border = colors.incorrect;
    text = colors.incorrect;
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          borderRadius: colors.radius,
          opacity: pressed && !disabled ? 0.85 : 1,
        },
      ]}
    >
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  label: { fontSize: 18, fontFamily: "SpaceGrotesk_600SemiBold" },
});
