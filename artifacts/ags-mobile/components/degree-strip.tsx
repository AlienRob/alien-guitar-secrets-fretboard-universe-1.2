import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";
import type { SpelledDegree } from "@/lib/musicTheory";

/**
 * Renders a row of notes with their scale/chord degree shown above each one
 * (e.g. degree "b3" above the note "Eb"). Used in the practice reference card
 * and in the post-drill recap.
 */
export function DegreeStrip({ title, items }: { title?: string; items: SpelledDegree[] }) {
  const colors = useColors();
  return (
    <View style={styles.wrap}>
      {title ? <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text> : null}
      <View style={styles.row}>
        {items.map((item, i) => {
          const isRoot = item.degree === "1";
          return (
            <View key={`${item.note}-${i}`} style={styles.cell}>
              <Text
                style={[styles.degree, { color: isRoot ? colors.chordTone : colors.accent }]}
                numberOfLines={1}
              >
                {item.degree}
              </Text>
              <View
                style={[
                  styles.noteBox,
                  {
                    backgroundColor: isRoot ? "rgba(255,209,102,0.16)" : colors.card,
                    borderColor: isRoot ? colors.chordTone : colors.border,
                    borderRadius: colors.radius,
                  },
                ]}
              >
                <Text style={[styles.note, { color: colors.foreground }]} numberOfLines={1}>
                  {item.note}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10, alignSelf: "stretch" },
  title: { fontSize: 15, fontFamily: "SpaceGrotesk_600SemiBold" },
  row: { flexDirection: "row", gap: 6 },
  cell: { flex: 1, alignItems: "center", gap: 4 },
  degree: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  noteBox: { alignSelf: "stretch", paddingHorizontal: 2, paddingVertical: 9, alignItems: "center", borderWidth: 1 },
  note: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
});
