import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { XpBar } from "@/components/xp-bar";
import { useBosses } from "@/contexts/bosses";
import { useProgress } from "@/contexts/progress";
import { useGear } from "@/contexts/gear";
import { useAvatar } from "@/contexts/avatar";
import { useColors } from "@/hooks/useColors";
import { BOSSES } from "@/lib/bosses";
import { GearRender } from "@/components/pick-render";
import { GEAR_CATALOG, type GearCategory, type GearItem } from "@/lib/gear";

const COIN_SINGLE_IMG = require("@/assets/images/gear/coin-single.png");

const RARITY_COLOR: Record<string, string> = {
  common:    "#9ca3af",
  rare:      "#60a5fa",
  epic:      "#a78bfa",
  legendary: "#f59e0b",
  mythic:    "#00ffd5",
};

const CATEGORY_LABELS: Record<GearCategory, string> = {
  guitar: "Guitars",
  amp:    "Amps",
  pedal:  "Pedals",
  cable:  "Cables",
  pick:   "Picks",
  strap:  "Straps",
  coin:   "Coins",
};

const CATEGORY_ICONS: Record<GearCategory, string> = {
  guitar: "🎸",
  amp:    "🔊",
  pedal:  "🎛",
  cable:  "🔌",
  pick:   "🎵",
  strap:  "🎤",
  coin:   "🪙",
};

const CATEGORY_ORDER: GearCategory[] = ["guitar", "amp", "pedal", "cable", "pick", "strap"];

const CATEGORY_COLOR: Record<GearCategory, string> = {
  guitar: "#60a5fa",
  amp:    "#22c55e",
  pedal:  "#a78bfa",
  cable:  "#f59e0b",
  pick:   "#ec4899",
  strap:  "#f97316",
  coin:   "#fbbf24",
};

function CatCard({
  cat,
  items,
  tileSize,
  onPress,
}: {
  cat: GearCategory;
  items: GearItem[];
  tileSize: number;
  onPress: () => void;
}) {
  const color    = CATEGORY_COLOR[cat];
  const preview  = items[0];
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1100, useNativeDriver: false }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 1100, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width: tileSize, height: tileSize, opacity: pressed ? 0.75 : 1 }]}
    >
      <LinearGradient
        colors={[`${color}22`, `${color}06`]}
        style={[styles.catCard, { borderColor: `${color}44` }]}
      >
        {preview ? (
          preview.image ? (
            <Image
              source={preview.image}
              style={{ width: tileSize - 28, height: tileSize - 60 }}
              resizeMode="contain"
            />
          ) : (
            <GearRender item={preview} size={tileSize - 40} />
          )
        ) : (
          <Text style={styles.catLockIcon}>🔒</Text>
        )}
        <View style={[styles.catFooter, { backgroundColor: `${color}1a` }]}>
          <Animated.Text style={[styles.catName, { color, opacity: pulseAnim }]}>
            {CATEGORY_LABELS[cat].toUpperCase()}
          </Animated.Text>
          <View style={[styles.catBadge, { backgroundColor: `${color}2a`, borderColor: `${color}55` }]}>
            <Text style={[styles.catCount, { color }]}>{items.length}</Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors  = useColors();
  const insets  = useSafeAreaInsets();
  const { belt, level, xp, xpIntoLevel, xpPerLevel, streak, accuracy, coins } = useProgress();
  const { isBeaten } = useBosses();
  const { owns } = useGear();
  const { avatar } = useAvatar();

  const [zoomItem, setZoomItem]       = useState<GearItem | null>(null);
  const [selectedCat, setSelectedCat] = useState<GearCategory | null>(null);

  const topPad    = Platform.OS === "web" ? 16 : insets.top + 4;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 80;

  const name        = avatar.displayName?.trim() || "Player";
  const bossesBeaten = BOSSES.filter((b) => isBeaten(b.id)).length;

  const ownedByCategory = useMemo(() => {
    const map: Record<GearCategory, GearItem[]> = { guitar: [], amp: [], pedal: [], cable: [], pick: [], strap: [], coin: [] };
    for (const item of GEAR_CATALOG) {
      if (owns(item.id)) map[item.category].push(item);
    }
    return map;
  }, [owns]);

  const totalPrizes = Object.values(ownedByCategory).reduce((n, arr) => n + arr.length, 0);

  const { width: screenW } = useWindowDimensions();
  // 16px padding each side, 10px gap between 2 columns
  const tileSize = Math.floor((screenW - 32 - 10) / 2);

  const STATS = [
    { label: "Level",     value: String(level),      color: "#60a5fa", icon: "⭐" },
    { label: "Belt",      value: belt.name,           color: belt.color, icon: "🥋" },
    { label: "Total XP",  value: xp.toLocaleString(), color: "#a78bfa", icon: "✨" },
    { label: "Streak",    value: `${streak}d`,        color: "#facc15", icon: "⚡" },
    { label: "Accuracy",  value: `${accuracy}%`,      color: "#22c55e", icon: "🎯" },
    { label: "Bosses",    value: String(bossesBeaten), color: "#ef4444", icon: "👾" },
    { label: "Coins",     value: String(coins),        color: "#f59e0b", icon: "🪙" },
  ];

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad, paddingTop: topPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADER ── */}
        <Text style={styles.pageTitle}>PLAYER PROFILE</Text>
        <View style={[styles.nameBadge, { borderColor: belt.color, backgroundColor: belt.color + "18" }]}>
          <View style={[styles.beltDot, { backgroundColor: belt.color }]} />
          <Text style={[styles.nameText, { color: colors.foreground }]}>{name.toUpperCase()}</Text>
          <Text style={[styles.beltText, { color: belt.color }]}>{belt.name.toUpperCase()} BELT</Text>
        </View>

        {/* ── XP BAR ── */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={[styles.xpLevelLabel, { color: colors.mutedForeground }]}>LEVEL {level}</Text>
            <Text style={[styles.xpNumbers, { color: colors.mutedForeground }]}>{xpIntoLevel} / {xpPerLevel} XP</Text>
          </View>
          <XpBar value={xpIntoLevel} max={xpPerLevel} />
        </View>

        {/* ── STATS GRID ── */}
        <View style={styles.statsGrid}>
          {STATS.map((s) => (
            <LinearGradient
              key={s.label}
              colors={[`${s.color}22`, `${s.color}08`]}
              style={[styles.statTile, { borderColor: `${s.color}44` }]}
            >
              {s.label === "Coins" ? (
                <Image source={COIN_SINGLE_IMG} style={{ width: 24, height: 24 }} resizeMode="contain" />
              ) : (
                <Text style={styles.statIcon}>{s.icon}</Text>
              )}
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* ── PRIZE COLLECTION ── */}
        <Text style={[styles.sectionTitle, { color: "#00ffd5" }]}>PRIZE COLLECTION</Text>

        <View style={styles.catGrid}>
          {CATEGORY_ORDER.map((cat) => (
            <CatCard
              key={cat}
              cat={cat}
              items={ownedByCategory[cat]}
              tileSize={tileSize}
              onPress={() => setSelectedCat(cat)}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── CATEGORY ITEMS MODAL ── */}
      <Modal visible={!!selectedCat} transparent animationType="slide" onRequestClose={() => setSelectedCat(null)}>
        <View style={styles.sheetBg}>
          <View style={styles.sheetCard}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>
                {selectedCat ? `${CATEGORY_ICONS[selectedCat]}  ${CATEGORY_LABELS[selectedCat].toUpperCase()}` : ""}
              </Text>
              <Pressable onPress={() => setSelectedCat(null)} style={styles.sheetClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </Pressable>
            </View>
            <ScrollView contentContainerStyle={styles.sheetGrid} showsVerticalScrollIndicator={false}>
              {selectedCat && ownedByCategory[selectedCat].map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => { setSelectedCat(null); setTimeout(() => setZoomItem(item), 300); }}
                  style={({ pressed }) => [
                    styles.gearThumb,
                    {
                      width: tileSize,
                      height: tileSize,
                      borderColor: RARITY_COLOR[item.rarity],
                      backgroundColor: `${RARITY_COLOR[item.rarity]}12`,
                      opacity: pressed ? 0.75 : 1,
                    },
                  ]}
                >
                  {item.image ? (
                    <Image source={item.image} style={{ width: tileSize - 32, height: tileSize - 52 }} resizeMode="contain" />
                  ) : (
                    <GearRender item={item} size={tileSize - 36} />
                  )}
                  <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[item.rarity] }]}>
                    <Text style={styles.rarityText}>{item.rarity.toUpperCase()}</Text>
                  </View>
                  <Text style={[styles.gearName, { color: "#fff" }]} numberOfLines={2}>{item.name}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ── ZOOM MODAL ── */}
      <Modal visible={!!zoomItem} transparent animationType="fade" onRequestClose={() => setZoomItem(null)}>
        <View style={styles.modalBg}>
          <Pressable style={styles.modalClose} onPress={() => setZoomItem(null)}>
            <Text style={styles.modalCloseText}>✕</Text>
          </Pressable>
          {zoomItem && (
            <View style={styles.modalCard}>
              <ScrollView
                maximumZoomScale={4}
                minimumZoomScale={1}
                centerContent
                contentContainerStyle={styles.modalScrollContent}
              >
                {zoomItem.image ? (
                  <Image
                    source={zoomItem.image}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <GearRender item={zoomItem} size={240} />
                )}
              </ScrollView>
              <View style={styles.modalInfo}>
                <View style={[styles.rarityBadge, { backgroundColor: RARITY_COLOR[zoomItem.rarity], alignSelf: "flex-start" }]}>
                  <Text style={styles.rarityText}>{zoomItem.rarity.toUpperCase()}</Text>
                </View>
                <Text style={styles.modalName}>{zoomItem.name}</Text>
                <Text style={styles.modalDesc}>{zoomItem.description}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 22, fontFamily: "SpaceGrotesk_700Bold", color: "#ffffff",
    letterSpacing: 2, marginBottom: 12,
  },
  nameBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 14,
  },
  beltDot: { width: 10, height: 10, borderRadius: 5 },
  nameText: { flex: 1, fontSize: 16, fontFamily: "SpaceGrotesk_700Bold" },
  beltText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },

  xpSection: { marginBottom: 16 },
  xpLabelRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  xpLevelLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5 },
  xpNumbers:    { fontSize: 11, fontFamily: "Inter_500Medium" },

  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 24 },
  statTile: {
    width: "30%", flexGrow: 1, borderWidth: 1, borderRadius: 12,
    paddingVertical: 12, alignItems: "center", gap: 3,
  },
  statIcon:  { fontSize: 18 },
  statValue: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },

  sectionTitle: {
    fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", letterSpacing: 2,
    marginBottom: 14,
  },

  emptyBox: {
    borderWidth: 1, borderRadius: 14, padding: 28,
    alignItems: "center", borderStyle: "dashed",
  },
  emptyIcon:  { fontSize: 36, marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 6 },
  emptyHint:  { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },

  // Category card grid
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  catCard: {
    flex: 1, borderWidth: 1.5, borderRadius: 14, overflow: "hidden",
    alignItems: "center", justifyContent: "flex-end",
  },
  pickSwatch: {
    borderRadius: 10, borderWidth: 2, marginBottom: 4,
  },
  gearSwatch: {
    borderRadius: 8, borderWidth: 2,
  },
  modalSwatch: {
    width: 220, height: 220, borderRadius: 20, borderWidth: 3,
  },
  catLockIcon: { fontSize: 28, marginBottom: 8 },
  catFooter: {
    width: "100%", flexDirection: "row", alignItems: "center",
    paddingHorizontal: 8, paddingVertical: 7, gap: 5,
  },
  catName:  { flex: 1, fontSize: 10.8, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  catBadge: {
    borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  catCount: { fontSize: 9, fontFamily: "SpaceGrotesk_700Bold" },

  // Category items sheet
  sheetBg:   { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.7)" },
  sheetCard: { backgroundColor: "#0d1226", borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "80%", paddingBottom: 20 },
  sheetHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1e2a4a" },
  sheetTitle: { flex: 1, fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#fff", letterSpacing: 1 },
  sheetClose: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center" },
  sheetGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 10, padding: 16 },

  // Item thumb (used in sheet)
  prizeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gearThumb: {
    borderWidth: 1.5, borderRadius: 12, padding: 8,
    alignItems: "center", justifyContent: "center", gap: 6,
    overflow: "hidden",
  },
  rarityBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  rarityText:  { fontSize: 8, fontFamily: "Inter_600SemiBold", color: "#050816", letterSpacing: 0.5 },
  gearName: { fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "center" },

  // Modal
  modalBg: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center", alignItems: "center",
  },
  modalClose: {
    position: "absolute", top: 56, right: 20, zIndex: 10,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  modalCloseText: { fontSize: 18, color: "#fff" },
  modalCard: {
    width: "90%", maxHeight: "85%",
    backgroundColor: "#0d1226", borderRadius: 20, overflow: "hidden",
  },
  modalScrollContent: { alignItems: "center", justifyContent: "center", minHeight: 280 },
  modalImage: { width: 280, height: 280 },
  modalInfo: { padding: 16, gap: 6 },
  modalName: { fontSize: 20, fontFamily: "SpaceGrotesk_700Bold", color: "#fff" },
  modalDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#9ca3af", lineHeight: 19 },
});
