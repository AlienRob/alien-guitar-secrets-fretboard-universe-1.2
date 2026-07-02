import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";

interface Star { top: number; left: number; size: number; opacity: number }

function makeStars(count: number): Star[] {
  return Array.from({ length: count }, () => ({
    top:     Math.random() * 100,
    left:    Math.random() * 100,
    size:    Math.random() < 0.8 ? 1.5 : 2.5,
    opacity: 0.3 + Math.random() * 0.6,
  }));
}

const DEEP_BLUE = "#020714";

/** Deep-blue starfield background shared by every screen. */
export function ScreenBg({ children }: { children: React.ReactNode }) {
  const stars = useMemo(() => makeStars(80), []);

  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {stars.map((s, i) => (
          <View
            key={i}
            style={{
              position:        "absolute",
              top:             `${s.top}%` as unknown as number,
              left:            `${s.left}%` as unknown as number,
              width:           s.size,
              height:          s.size,
              borderRadius:    s.size,
              backgroundColor: "#ffffff",
              opacity:         s.opacity,
            }}
          />
        ))}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: DEEP_BLUE },
});
