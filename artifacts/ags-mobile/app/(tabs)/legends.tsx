import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useProgress } from "@/contexts/progress";
import { FEATURED_GUITARS, RARITY_META, type FeaturedGuitar } from "@/lib/guitars";

const GOLD = "#ffcf5a";

export default function LegendsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { xp, level } = useProgress();

  const [selected, setSelected] = useState(0);
  const guitar = FEATURED_GUITARS[selected];
  const rarity = RARITY_META[guitar.rarity];
  const owned = level >= guitar.unlockLevel;

  const topPad = Platform.OS === "web" ? 24 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 28;

  // Fade the guitar in whenever the selection changes.
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 420, useNativeDriver: true }).start();
  }, [selected, fade]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0a1030", colors.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 18, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>HALL OF LEGENDS</Text>
          <View style={[styles.honourChip, { borderColor: "rgba(255,207,90,0.5)" }]}>
            <MaterialCommunityIcons name="shield-star" size={14} color={GOLD} />
            <Text style={styles.honourText}>{xp.toLocaleString()}</Text>
          </View>
        </View>
        <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
          The legendary instruments of the AGS cosmos.
        </Text>

        {/* Guitar selector (shown once more than one legend is in the hall) */}
        {FEATURED_GUITARS.length > 1 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectorRow}
          >
            {FEATURED_GUITARS.map((g, i) => (
              <GuitarChip
                key={g.id}
                guitar={g}
                active={i === selected}
                onPress={() => setSelected(i)}
              />
            ))}
          </ScrollView>
        ) : null}

        {/* Stage */}
        <ImageBackground
          source={require("@/assets/images/hall-backdrop.png")}
          style={styles.stage}
          imageStyle={styles.stageImage}
          resizeMode="cover"
        >
          <Animated.Image
            source={guitar.photo}
            style={[styles.figure, { opacity: fade }]}
            resizeMode="contain"
          />
          <LinearGradient
            colors={["transparent", "rgba(5,8,22,0.1)", "rgba(5,8,22,0.92)"]}
            style={styles.stageScrim}
            pointerEvents="none"
          />
          <Animated.View style={[styles.stageCaption, { opacity: fade }]} pointerEvents="none">
            <Text style={[styles.guitarName, { color: rarity.color }]}>{guitar.name}</Text>
            <Text style={styles.rarityTag}>
              {rarity.label} · Unlocks at level {guitar.unlockLevel}
            </Text>
          </Animated.View>
        </ImageBackground>

        {/* View in 3D */}
        {guitar.model3d != null ? (
          <Pressable
            onPress={() => router.push({ pathname: "/guitar-3d", params: { id: guitar.id } })}
            style={({ pressed }) => [
              styles.view3dBtn,
              { borderColor: GOLD, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="rotate-3d-variant" size={18} color={GOLD} />
            <Text style={[styles.view3dText, { color: GOLD }]}>View in 3D</Text>
          </Pressable>
        ) : null}

        {/* Detail card */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.rarityChip,
                { borderColor: rarity.color, backgroundColor: `${rarity.color}1f` },
              ]}
            >
              <Text style={[styles.rarityChipText, { color: rarity.color }]}>
                {rarity.label.toUpperCase()}
              </Text>
            </View>
            <View
              style={[
                styles.ownChip,
                { borderColor: owned ? "#36d07a" : colors.border },
              ]}
            >
              <MaterialCommunityIcons
                name={owned ? "lock-open-variant" : "lock"}
                size={13}
                color={owned ? "#36d07a" : colors.mutedForeground}
              />
              <Text style={[styles.ownText, { color: owned ? "#36d07a" : colors.mutedForeground }]}>
                {owned ? "Unlocked" : `Level ${guitar.unlockLevel}`}
              </Text>
            </View>
          </View>
          <Detail label="INSPIRATION" value={guitar.inspiration} />
          <Detail label="SIGNATURE TECHNIQUE" value={guitar.signatureTechnique} />
          <Detail label="THEORY FOCUS" value={guitar.theory} />
        </View>
      </ScrollView>
    </View>
  );
}

function GuitarChip({
  guitar,
  active,
  onPress,
}: {
  guitar: FeaturedGuitar;
  active: boolean;
  onPress: () => void;
}) {
  const rarity = RARITY_META[guitar.rarity];
  return (
    <Pressable onPress={onPress} style={styles.chipWrap}>
      <View
        style={[
          styles.chip,
          {
            borderColor: active ? rarity.color : "rgba(255,255,255,0.12)",
            backgroundColor: active ? `${rarity.color}26` : "rgba(255,255,255,0.04)",
          },
        ]}
      >
        <MaterialCommunityIcons
          name="guitar-electric"
          size={22}
          color={active ? rarity.color : "rgba(255,255,255,0.55)"}
        />
      </View>
    </Pressable>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: {
    fontSize: 24,
    fontFamily: "SpaceGrotesk_700Bold",
    color: GOLD,
    letterSpacing: 1.5,
    textShadowColor: "rgba(255,207,90,0.45)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
    flexShrink: 1,
  },
  honourChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,207,90,0.08)",
  },
  honourText: { color: GOLD, fontSize: 13, fontFamily: "SpaceGrotesk_700Bold" },
  tagline: { fontSize: 12.5, fontFamily: "Inter_500Medium", marginTop: 6, marginBottom: 14 },

  selectorRow: { gap: 14, paddingVertical: 2, paddingRight: 8 },
  chipWrap: { alignItems: "center" },
  chip: {
    width: 50,
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },

  stage: {
    height: 392,
    borderRadius: 18,
    overflow: "hidden",
    marginTop: 4,
    borderWidth: 1,
    borderColor: "rgba(255,207,90,0.25)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  stageImage: { borderRadius: 18 },
  figure: { position: "absolute", top: 20, alignSelf: "center", width: 220, height: 300 },
  stageScrim: { position: "absolute", left: 0, right: 0, bottom: 0, height: 150 },
  stageCaption: { paddingBottom: 16, paddingHorizontal: 18, alignItems: "center" },
  guitarName: {
    fontSize: 22,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  rarityTag: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginTop: 4,
  },

  view3dBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  view3dText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 0.5 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 14 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  rarityChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  rarityChipText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  ownChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  ownText: { fontSize: 11.5, fontFamily: "Inter_600SemiBold" },
  detailRow: { marginTop: 14 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: GOLD, letterSpacing: 1.2 },
  detailValue: { fontSize: 14.5, fontFamily: "Inter_400Regular", marginTop: 4, lineHeight: 20 },
});
