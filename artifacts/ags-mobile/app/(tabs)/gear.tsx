import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ScreenBg } from "@/components/screen-bg";
import { BagShopModal } from "@/components/bag-shop-modal";
import { GearBagModal } from "@/components/gear-bag-modal";
import { GearRender } from "@/components/pick-render";
import { useGear } from "@/contexts/gear";
import { useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import {
  type GearCategory,
  type GearItem,
  GEAR_CATALOG,
  RARITY_COLOR,
  rollBagForTier,
  gearByCategory,
} from "@/lib/gear";
import { type BagTierConfig, COINS_DUPLICATE_REFUND } from "@/lib/coins";

const COIN_SINGLE_IMG    = require("@/assets/images/gear/coin-single.png");
const HALL_IMG           = require("@/assets/images/hall-of-legends.png");

const GOLD = "#ffcf5a";

const CATEGORIES: { id: GearCategory; label: string; icon: string }[] = [
  { id: "guitar", label: "Guitars", icon: "🎸" },
  { id: "pedal",  label: "Pedals",  icon: "🎛" },
  { id: "amp",    label: "Amps",    icon: "🔊" },
  { id: "cable",  label: "Cables",  icon: "🔌" },
  { id: "pick",   label: "Picks",   icon: "♦" },
  { id: "strap",  label: "Straps",  icon: "〰" },
];

function roomDescription(ownedCount: number): { headline: string; body: string } {
  if (ownedCount <= 5)  return { headline: "An empty room", body: "A bare space. One dusty guitar stand in the corner. Your journey has just begun." };
  if (ownedCount <= 12) return { headline: "First signs of life", body: "A practice amp hums quietly. A pedalboard takes shape on the floor. Something's happening here." };
  if (ownedCount <= 22) return { headline: "A real rehearsal space", body: "Guitars line the wall. Pedals glow. Posters of the Guardians watch over you. This is becoming something." };
  if (ownedCount <= 35) return { headline: "A serious rig", body: "Any musician would be proud of this. The gear tells a story of consistent practice and hard-earned rewards." };
  return { headline: "A legendary studio", body: "The kind of room that only exists in dreams — and at the end of a long road of dedication. Zashtar would approve." };
}

function GearCard({ item, owned, onPress }: { item: GearItem; owned: boolean; onPress?: () => void }) {
  const colors = useColors();
  const rc = RARITY_COLOR[item.rarity];

  return (
    <Pressable
      onPress={owned ? onPress : undefined}
      style={({ pressed }) => [
        styles.gearCard,
        {
          backgroundColor: owned ? colors.card : colors.background,
          borderColor: owned ? rc + "55" : colors.border,
          opacity: owned ? (pressed ? 0.75 : 1) : 0.45,
        },
      ]}
    >
      <View style={[styles.rarityBar, { backgroundColor: rc }]} />
      <View style={styles.gearImageBox}>
        {owned ? (
          item.image
            ? <Image source={item.image} style={styles.gearImage} resizeMode="contain" />
            : <GearRender item={item} size={54} />
        ) : (
          <Text style={styles.gearLock}>🔒</Text>
        )}
      </View>
      <Text style={[styles.gearName, { color: owned ? colors.foreground : colors.mutedForeground }]} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={[styles.gearRarity, { color: rc }]}>{item.rarity}</Text>
      {owned && (
        <Text style={[styles.gearDesc, { color: colors.mutedForeground }]} numberOfLines={3}>
          {item.description}
        </Text>
      )}
    </Pressable>
  );
}


export default function GearScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { ownedIds, addItems } = useGear();
  const { coins, spendCoins, addCoins } = useProgress();
  const [activeCategory, setActiveCategory] = useState<GearCategory>("guitar" as GearCategory);
  const [showShop, setShowShop] = useState(false);
  const [showBag, setShowBag] = useState(false);
  const [bagItems, setBagItems] = useState<GearItem[]>([]);
  const [activeTier, setActiveTier] = useState<BagTierConfig | null>(null);
  const [selectedItem, setSelectedItem] = useState<GearItem | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 24;

  const ownedSet = new Set(ownedIds);
  const ownedCount = ownedIds.length;
  const totalCount = GEAR_CATALOG.length;
  const room = roomDescription(ownedCount);
  const categoryItems = gearByCategory(activeCategory);

  const handleSelectTier = useCallback(async (tier: BagTierConfig) => {
    const ok = await spendCoins(tier.cost);
    if (!ok) return;
    setShowShop(false);
    const items = rollBagForTier(tier, ownedIds);
    setBagItems(items);
    setActiveTier(tier);
    setTimeout(() => setShowBag(true), 200);
  }, [spendCoins, ownedIds]);

  const handleClaim = useCallback(async (newItems: GearItem[], coinRefundTotal: number) => {
    setShowBag(false);
    // Coin prizes credit the wallet; gear items go into the collection.
    const coinItems  = newItems.filter((i) => i.category === "coin");
    const gearItems  = newItems.filter((i) => i.category !== "coin");
    const bonusCoins = coinItems.reduce((s, i) => s + (i.coinAmount ?? 0), 0);
    if (gearItems.length > 0) {
      await addItems(gearItems);
    }
    if (coinRefundTotal + bonusCoins > 0) {
      await addCoins(coinRefundTotal + bonusCoins);
    }
    setActiveTier(null);
    setBagItems([]);
  }, [addItems, addCoins]);

  return (
    <ScreenBg>
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: 20 }}>
          <View style={styles.headerRow}>
            <View>
              <Text style={[styles.kicker, { color: colors.accent }]}>YOUR COLLECTION</Text>
              <Text style={[styles.title, { color: colors.foreground }]}>Hall of Legends</Text>
            </View>
            <Pressable
              onLongPress={() => addCoins(200)}
              style={[styles.coinBadge, { borderColor: "rgba(245,158,11,0.4)", backgroundColor: "rgba(245,158,11,0.10)" }]}
            >
              <Image source={COIN_SINGLE_IMG} style={{ width: 16, height: 16 }} resizeMode="contain" />
              <Text style={[styles.coinBadgeText, { color: "#f59e0b" }]}>{coins}</Text>
            </Pressable>
          </View>
        </View>

        {/* Open a Bag card */}
        <Pressable
          onPress={() => setShowShop(true)}
          style={({ pressed }) => [
            styles.openBagCard,
            {
              marginHorizontal: 20,
              borderColor: "#a855f7" + "55",
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(168,85,247,0.18)", "rgba(96,165,250,0.08)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
          <Image source={require("@/assets/images/card-mystery.png")} style={{ width: 44, height: 44 }} resizeMode="contain" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.openBagTitle, { color: "#c084fc" }]}>Open a Bag</Text>
            <Text style={[styles.openBagSubtitle, { color: colors.mutedForeground }]}>
              Spend Alien Coins to reveal new gear
            </Text>
          </View>
          <View style={[styles.coinCountBadge, { borderColor: "rgba(245,158,11,0.4)", backgroundColor: "rgba(245,158,11,0.10)" }]}>
            <Image source={COIN_SINGLE_IMG} style={{ width: 16, height: 16 }} resizeMode="contain" />
            <Text style={[styles.coinBadgeText, { color: "#f59e0b" }]}>{coins}</Text>
          </View>
        </Pressable>

        {/* Hall of Legends scene banner */}
        <View style={[styles.hallBanner, { marginHorizontal: 20, borderColor: colors.border }]}>
          <Image source={HALL_IMG} style={styles.hallImage} resizeMode="cover" />
          {/* Dark gradient so text is always legible */}
          <LinearGradient
            colors={["transparent", "rgba(5,8,22,0.88)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.35 }}
            end={{ x: 0, y: 1 }}
            pointerEvents="none"
          />
          <View style={styles.hallOverlay}>
            <Text style={[styles.roomHeadline, { color: GOLD }]}>{room.headline}</Text>
            <Text style={[styles.roomBody, { color: "rgba(200,218,240,0.85)" }]}>{room.body}</Text>
            <Text style={[styles.roomCount, { color: colors.accent }]}>
              {ownedCount} / {totalCount} items collected
            </Text>
          </View>
        </View>

        {/* Category pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {CATEGORIES.map((cat) => {
            const active = cat.id === activeCategory;
            const catItems = gearByCategory(cat.id);
            const catOwned = catItems.filter((i) => ownedSet.has(i.id)).length;
            return (
              <Pressable
                key={cat.id}
                onPress={() => setActiveCategory(cat.id)}
                style={[
                  styles.catPill,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={styles.catPillIcon}>{cat.icon}</Text>
                <Text style={[styles.catPillLabel, { color: active ? colors.primaryForeground : colors.foreground }]}>
                  {cat.label}
                </Text>
                <Text style={[styles.catPillCount, { color: active ? colors.primaryForeground + "aa" : colors.mutedForeground }]}>
                  {catOwned}/{catItems.length}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Items grid */}
        <View style={styles.grid}>
          {categoryItems.map((item) => (
            <GearCard
              key={item.id}
              item={item}
              owned={ownedSet.has(item.id)}
              onPress={() => setSelectedItem(item)}
            />
          ))}
        </View>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          Earn Alien Coins from drills and boss battles, then open bags for gear
        </Text>
      </ScrollView>

      {/* Full-screen image lightbox */}
      <Modal
        visible={selectedItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <Pressable style={styles.lightboxBg} onPress={() => setSelectedItem(null)}>
          {selectedItem && (
            <View style={styles.lightboxInner}>
              {/* Rarity glow bar at top */}
              <View style={[styles.lightboxGlowBar, { backgroundColor: RARITY_COLOR[selectedItem.rarity] }]} />
              {/* Image fills most of the screen */}
              <Image
                source={selectedItem.image}
                style={styles.lightboxImage}
                resizeMode="contain"
              />
              {/* Name + rarity + desc below */}
              <View style={styles.lightboxMeta}>
                <Text style={styles.lightboxName}>{selectedItem.name}</Text>
                <Text style={[styles.lightboxRarity, { color: RARITY_COLOR[selectedItem.rarity] }]}>
                  {selectedItem.rarity.toUpperCase()}
                </Text>
                <Text style={styles.lightboxDesc}>{selectedItem.description}</Text>
                <Text style={styles.lightboxDismiss}>TAP ANYWHERE TO CLOSE</Text>
              </View>
            </View>
          )}
        </Pressable>
      </Modal>

      <BagShopModal
        visible={showShop}
        coins={coins}
        onSelect={handleSelectTier}
        onClose={() => setShowShop(false)}
      />

      <GearBagModal
        visible={showBag}
        result={bagItems.length > 0 ? { xpBonus: 0, items: bagItems } : null}
        xpEarned={0}
        ownedIds={ownedIds}
        coinRefundPerDup={COINS_DUPLICATE_REFUND}
        onClaim={handleClaim}
        forceBagColor={activeTier?.bagColor}
      />
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  kicker: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  title: { fontSize: 30, fontFamily: "SpaceGrotesk_700Bold", marginTop: 4 },
  coinBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 8 },
  coinBadgeEmoji: { fontSize: 14 },
  coinBadgeText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  coinCountBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },

  openBagCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    overflow: "hidden",
  },
  openBagEmoji: { fontSize: 32 },
  openBagTitle: { fontSize: 17, fontFamily: "SpaceGrotesk_700Bold" },
  openBagSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  hallBanner: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
    height: 180,
  },
  hallImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  hallOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  roomHeadline: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold", marginBottom: 3 },
  roomBody: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 6 },
  roomCount: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  categoryScroll: { paddingHorizontal: 20, gap: 8, paddingBottom: 4 },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  catPillIcon: { fontSize: 15 },
  catPillLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  catPillCount: { fontSize: 11, fontFamily: "Inter_500Medium" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  gearCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    overflow: "hidden",
    position: "relative",
  },
  rarityBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  gearImageBox: { height: 80, alignItems: "center", justifyContent: "center", marginTop: 4, marginBottom: 6 },
  gearImage: { width: "100%", height: 80 },
  gearLock: { fontSize: 32 },
  gearName: { fontSize: 13, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 3 },
  gearRarity: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, textTransform: "capitalize", marginBottom: 6 },
  gearDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },

  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 24,
    marginHorizontal: 40,
    lineHeight: 17,
  },

  lightboxBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  lightboxInner: {
    width: "100%",
    flex: 1,
    alignItems: "center",
  },
  lightboxGlowBar: {
    width: "100%",
    height: 4,
  },
  lightboxImage: {
    width: Dimensions.get("window").width,
    height: Math.round(Dimensions.get("window").height * 0.62),
  },
  lightboxMeta: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 8,
  },
  lightboxName: {
    color: "#fff",
    fontFamily: "SpaceGrotesk_700Bold",
    fontSize: 24,
    textAlign: "center",
    marginBottom: 5,
  },
  lightboxRarity: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 14,
  },
  lightboxDesc: {
    color: "#4a5e7a",
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 24,
  },
  lightboxDismiss: {
    color: "#1c2747",
    fontFamily: "Inter_600SemiBold",
    fontSize: 10,
    letterSpacing: 2,
  },
});
