import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { Suspense, lazy } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FEATURED_GUITARS, RARITY_META } from "@/lib/guitars";

// The 3D engine (three / react-three-fiber) is heavy and only needed on this
// screen. Lazy-loading keeps it out of the startup bundle eval so the rest of
// the app (which expo-router evaluates eagerly) is unaffected.
const GuitarModel3D = lazy(() => import("@/components/guitar-model-3d"));

export default function Guitar3DScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const guitar =
    FEATURED_GUITARS.find((g) => g.id === id) ?? FEATURED_GUITARS[0];
  const rarity = guitar ? RARITY_META[guitar.rarity] : null;

  const topPad = Platform.OS === "web" ? 16 : insets.top + 8;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom + 16;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#0a1030", "#050816"]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />

      {/* Close button */}
      <Pressable
        onPress={() => router.back()}
        style={[styles.closeBtn, { top: topPad }]}
        hitSlop={12}
      >
        <Ionicons name="close" size={22} color="#fff" />
      </Pressable>

      {guitar && guitar.model3d != null ? (
        <View style={styles.viewer}>
          <Suspense
            fallback={
              <View style={[StyleSheet.absoluteFill, styles.center]}>
                <ActivityIndicator color="#7c5cff" />
              </View>
            }
          >
            <GuitarModel3D model={guitar.model3d} photoFallback={guitar.photo} />
          </Suspense>
        </View>
      ) : (
        <View style={[styles.viewer, styles.center]}>
          <Text style={styles.missing}>No 3D model available.</Text>
        </View>
      )}

      {/* Hint + name */}
      <View style={[styles.footer, { paddingBottom: bottomPad }]} pointerEvents="none">
        <View style={styles.hintRow}>
          <MaterialCommunityIcons
            name="rotate-3d-variant"
            size={15}
            color="rgba(255,255,255,0.75)"
          />
          <Text style={styles.hint}>Drag to rotate · pinch to zoom</Text>
        </View>
        {guitar ? (
          <Text style={[styles.name, { color: rarity?.color }]}>{guitar.name}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050816" },
  viewer: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },
  missing: { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium" },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  footer: { paddingHorizontal: 20, alignItems: "center", gap: 8 },
  hintRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  hint: {
    fontSize: 12.5,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
  },
  name: {
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
