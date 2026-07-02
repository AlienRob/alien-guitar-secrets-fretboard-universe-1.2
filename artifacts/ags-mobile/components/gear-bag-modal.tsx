/**
 * GearBagModal — cinematic mystery bag reveal (React Native / Expo).
 *
 * Phases:
 *   'bag'   → 4-second MP4 plays once (expo-av Video)
 *   'cards' → N cards fly in face-down; tap each to flip; tap flipped to zoom
 *   'claim' → Claim button available once all cards are flipped
 *
 * Props interface is unchanged from the previous stub — all callers need zero edits.
 */
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Video, ResizeMode } from "expo-av";
import type { AVPlaybackStatus } from "expo-av";

import { type GearBagResult, type GearItem, RARITY_COLOR } from "@/lib/gear";
import Pick3DViewer from "./pick-3d-viewer";
import { PickRender, StrapRender } from "./pick-render";

// ── Static assets ─────────────────────────────────────────────────────────────
const BAG_VIDEO  = require("@/assets/animations/bag-open.mp4");
const CARD_BACK  = require("@/assets/images/card-mystery.png");
const CARD_FRAME = require("@/assets/images/card-reward-frame.png");
const COINS_IMG  = require("@/assets/images/gear/coins.png");

// ── Rarity gradients (matching the mockup) ────────────────────────────────────
const RARITY_GRAD: Record<string, [string, string]> = {
  common:    ["#3d4a5c", "#232c38"],
  rare:      ["#1a4fc4", "#0d2a72"],
  epic:      ["#7c3aed", "#4c1d95"],
  legendary: ["#c47a0a", "#7a4700"],
  mythic:    ["#cc1f1f", "#7a0c0c"],
};

const RARITY_LABEL: Record<string, string> = {
  common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary", mythic: "Mythic",
};

const CATEGORY_LABEL: Record<string, string> = {
  guitar: "Guitar", amp: "Amp", pedal: "Pedal",
  cable: "Cable", strap: "Strap", pick: "Pick", coin: "Coins",
};

// ── Card geometry ─────────────────────────────────────────────────────────────
const CARD_W = 130;
const CARD_H = 195;

// Slot layout definitions — indexed [left, center, right]
type SlotDef = { tx: number; ty: number; scale: number; rotate: string; zIndex: number; flyDelay: number };
const ALL_SLOTS: SlotDef[] = [
  { tx: -90, ty: 20, scale: 0.76, rotate: "-13deg", zIndex: 1, flyDelay: 0   },
  { tx:   0, ty:  0, scale: 1.00, rotate:  "0deg",  zIndex: 3, flyDelay: 180 },
  { tx:  90, ty: 20, scale: 0.76, rotate:  "13deg", zIndex: 1, flyDelay: 80  },
];

// Which slots to use per item count
const SLOT_SETS: Record<number, SlotDef[]> = {
  1: [ALL_SLOTS[1]],
  2: [ALL_SLOTS[0], ALL_SLOTS[2]],
  3: [ALL_SLOTS[0], ALL_SLOTS[1], ALL_SLOTS[2]],
};

// ── Types ─────────────────────────────────────────────────────────────────────
type Phase = "bag" | "cards" | "claim";

export interface GearBagModalProps {
  visible: boolean;
  result: GearBagResult | null;
  xpEarned: number;
  ownedIds: string[];
  coinRefundPerDup: number;
  onClaim: (newItems: GearItem[], coinRefundTotal: number) => void;
  forceBagColor?: string;
}

// ── Item content (rendered inside card face + zoom overlay) ───────────────────
function ItemContent({ item, size }: { item: GearItem; size: number }) {
  if (item.category === "coin") {
    return (
      <View style={{ alignItems: "center" }}>
        <Image
          source={COINS_IMG}
          style={{ width: size * 0.72, height: size * 0.72 }}
          resizeMode="contain"
        />
        <Text style={{ color: RARITY_COLOR[item.rarity], fontSize: size * 0.3, fontWeight: "900", marginTop: 4 }}>
          +{item.coinAmount}
        </Text>
      </View>
    );
  }

  if (item.category === "pick") {
    return <PickRender item={item} size={size * 0.68} />;
  }

  if (item.image) {
    return (
      <Image source={item.image} style={{ width: size, height: size }} resizeMode="contain" />
    );
  }

  // Procedural strap (no image) — rotated 90° so it hangs portrait in the card.
  // StrapRender produces a landscape band (strapW × strapW*0.28).
  // After a −90° rotation the visual dimensions become strapW*0.28 wide × strapW tall,
  // which fills the portrait card zone nicely.
  {
    const strapW = Math.round(size * 0.9);
    const strapH = Math.round(strapW * 0.28);
    // Container matches the POST-rotation visual dimensions.
    // The inner View is the PRE-rotation size, offset so its centre aligns with the container centre.
    const offsetL = -(strapW - strapH) / 2;
    const offsetT =  (strapW - strapH) / 2;
    return (
      <View style={{ width: strapH, height: strapW, overflow: "hidden" }}>
        <View style={{
          position: "absolute",
          left: offsetL,
          top: offsetT,
          width: strapW,
          height: strapH,
          transform: [{ rotate: "-90deg" }],
        }}>
          <StrapRender item={item} width={strapW} />
        </View>
      </View>
    );
  }
}

// ── Single reward card ────────────────────────────────────────────────────────
interface CardProps {
  item: GearItem;
  slot: SlotDef;
  flyTrigger: boolean;
  onFlipped: () => void;
  onZoom: () => void;
}

function RewardCard({ item, slot, flyTrigger, onFlipped, onZoom }: CardProps) {
  const isFlippedRef  = useRef(false);
  const isAnimatingRef = useRef(false);
  const flyAnim  = useRef(new Animated.Value(0)).current;
  const flipAnim = useRef(new Animated.Value(0)).current;

  // Fly in when trigger fires
  useEffect(() => {
    if (!flyTrigger) return;
    Animated.timing(flyAnim, {
      toValue: 1,
      duration: 1100,
      delay: slot.flyDelay,
      useNativeDriver: true,
    }).start();
  }, [flyTrigger]);

  // Fly interpolations
  const flyTy    = flyAnim.interpolate({ inputRange: [0, 1],       outputRange: [180, 0]       });
  const flyScale = flyAnim.interpolate({ inputRange: [0, 0.1, 1],  outputRange: [0.2, 0.35, 1] });
  const flyOp    = flyAnim.interpolate({ inputRange: [0, 0.1, 1],  outputRange: [0, 0.85, 1]   });

  // Flip interpolations
  const flipSx   = flipAnim.interpolate({ inputRange: [0, 0.44, 0.56, 1], outputRange: [1, 0, 0, 1] });
  const backOp   = flipAnim.interpolate({ inputRange: [0, 0.44, 0.5,  1], outputRange: [1, 1, 0, 0] });
  const frontOp  = flipAnim.interpolate({ inputRange: [0, 0.44, 0.5,  1], outputRange: [0, 0, 1, 1] });

  function handlePress() {
    if (isAnimatingRef.current) return;
    if (!isFlippedRef.current) {
      isFlippedRef.current  = true;
      isAnimatingRef.current = true;
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 380,
        useNativeDriver: true,
      }).start(() => {
        isAnimatingRef.current = false;
        onFlipped();
      });
    } else {
      onZoom();
    }
  }

  const grad = (RARITY_GRAD[item.rarity] ?? RARITY_GRAD.common) as [string, string];

  return (
    // Static slot wrapper: positions card in its slot (translateX, rotate, scale)
    <View style={{
      position: "absolute",
      zIndex: slot.zIndex,
      transform: [{ translateX: slot.tx }, { rotate: slot.rotate }, { scale: slot.scale }],
    }}>
      {/* Fly-in layer */}
      <Animated.View style={{ opacity: flyOp, transform: [{ translateY: flyTy }, { scale: flyScale }] }}>
        {/* Flip layer (scaleX only — native driver safe) */}
        <Animated.View style={{ transform: [{ scaleX: flipSx }] }}>
          <Pressable onPress={handlePress} style={s.card}>
            {/* Rarity gradient background (always present) */}
            <LinearGradient
              colors={grad}
              style={StyleSheet.absoluteFill}
              start={{ x: 0.1, y: 0 }}
              end={{ x: 0.9, y: 1 }}
            />

            {/* Back face: mystery design */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: backOp }]}>
              <Image source={CARD_BACK} style={s.cardFill} resizeMode="stretch" />
            </Animated.View>

            {/* Front face: item content + gold frame */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: frontOp }]}>
              {/* Content sits behind the frame */}
              <View style={s.frontContent}>
                <View style={s.cardImageZone}>
                  {/* Spotlight — lifts dark items off the card background */}
                  <View style={s.spotOuter} pointerEvents="none" />
                  <View style={s.spotInner} pointerEvents="none" />
                  <ItemContent item={item} size={CARD_W * 0.7} />
                </View>
                <View style={s.cardBanner}>
                  <Text style={[s.cardRarityTxt, { color: RARITY_COLOR[item.rarity] }]}>
                    {RARITY_LABEL[item.rarity]}
                  </Text>
                  <Text style={s.cardNameTxt} numberOfLines={2}>{item.name}</Text>
                </View>
              </View>
              {/* Gold frame on top (transparent interior lets content show through) */}
              <Image source={CARD_FRAME} style={s.cardFill} resizeMode="stretch" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Zoom overlay (absolute inside modal, avoids nested-modal bugs) ─────────────
function ZoomView({ item, ownedIds, onClose }: { item: GearItem; ownedIds: string[]; onClose: () => void }) {
  const isOwned = item.category !== "coin" && ownedIds.includes(item.id);
  const rc   = RARITY_COLOR[item.rarity];
  const grad = (RARITY_GRAD[item.rarity] ?? RARITY_GRAD.common) as [string, string];

  return (
    <View style={s.zoomOverlay}>
      {/* Tap backdrop to close */}
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

      {/* X button */}
      <Pressable style={s.zoomCloseBtn} onPress={onClose}>
        <Text style={s.zoomCloseTxt}>×</Text>
      </Pressable>

      {/* Big card — box-none for picks so the 3D canvas receives touch events */}
      <View
        style={[s.zoomCard, { shadowColor: rc }]}
        pointerEvents={item.category === "pick" ? "box-none" : "none"}
      >
        <LinearGradient
          colors={grad}
          style={StyleSheet.absoluteFill}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        />
        <View style={s.zoomFrontContent}>
          <View style={[s.zoomImageZone, item.category === "pick" && { paddingTop: 0 }]}>
            {item.category === "pick" ? (
              <Pick3DViewer item={item} />
            ) : (
              <>
                {/* Spotlight — lifts dark items off the card background */}
                <View style={s.zoomSpotOuter} pointerEvents="none" />
                <View style={s.zoomSpotInner} pointerEvents="none" />
                <ItemContent item={item} size={190} />
              </>
            )}
          </View>
          <View style={s.zoomBanner}>
            <Text style={[s.zoomRarityTxt, { color: rc }]}>{RARITY_LABEL[item.rarity]}</Text>
            <Text style={s.zoomNameTxt}>{item.name}</Text>
            <Text style={s.zoomCategoryTxt}>{CATEGORY_LABEL[item.category]}</Text>
          </View>
        </View>
        <Image source={CARD_FRAME} style={s.zoomFrameFill} resizeMode="stretch" />
      </View>

      {isOwned && (
        <View style={s.dupBanner}>
          <Text style={s.dupTxt}>Already in your collection</Text>
        </View>
      )}
      {!isOwned && item.description ? (
        <Text style={s.flavorTxt}>"{item.description}"</Text>
      ) : null}
    </View>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function GearBagModal({
  visible, result, xpEarned, ownedIds, coinRefundPerDup, onClaim,
}: GearBagModalProps) {
  const [phase,        setPhase]       = useState<Phase>("bag");
  const [flyTrigger,   setFlyTrigger]  = useState(false);
  const [flippedCount, setFlipped]     = useState(0);
  const [zoomedItem,   setZoomed]      = useState<GearItem | null>(null);
  // revealKey forces card components to fully remount on each modal open
  const [revealKey,    setRevealKey]   = useState(0);

  const items    = result?.items ?? [];
  const slots    = SLOT_SETS[Math.min(items.length, 3)] ?? SLOT_SETS[3];
  const cardItems = items.slice(0, 3);

  const ownedSet = new Set(ownedIds);
  const newItems = items.filter((i) => !ownedSet.has(i.id));
  const dupCount = items.filter((i) =>  ownedSet.has(i.id)).length;
  const refund   = dupCount * coinRefundPerDup;

  // Reset on open
  useEffect(() => {
    if (visible && items.length > 0) {
      setPhase("bag");
      setFlyTrigger(false);
      setFlipped(0);
      setZoomed(null);
      setRevealKey((k) => k + 1);
    }
  }, [visible]);

  function handleVideoStatus(status: AVPlaybackStatus) {
    if (!status.isLoaded) return;
    if (status.didJustFinish && phase === "bag") {
      setPhase("cards");
      setTimeout(() => setFlyTrigger(true), 60);
    }
  }

  function handleCardFlipped() {
    setFlipped((n) => {
      const next = n + 1;
      if (next >= cardItems.length) setTimeout(() => setPhase("claim"), 400);
      return next;
    });
  }

  function handleClaim() {
    onClaim(newItems, refund);
  }

  if (!visible || items.length === 0) return null;

  const totalXp = xpEarned + (result?.xpBonus ?? 0);

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={s.overlay}>

        {/* ── Bag video phase ── */}
        {phase === "bag" && (
          <View style={s.videoWrap}>
            <Video
              source={BAG_VIDEO}
              shouldPlay
              isLooping={false}
              resizeMode={ResizeMode.CONTAIN}
              onPlaybackStatusUpdate={handleVideoStatus}
              style={s.video}
            />
            <Text style={s.bagLabel}>MYSTERY GEAR BAG</Text>
          </View>
        )}

        {/* ── Cards phase ── */}
        {phase !== "bag" && (
          <View style={s.cardsWrap}>
            <Text style={s.hintTxt}>
              {flippedCount === 0
                ? "Tap a card to reveal it"
                : flippedCount < cardItems.length
                  ? `${cardItems.length - flippedCount} card${cardItems.length - flippedCount > 1 ? "s" : ""} left to reveal`
                  : "Tap any card to zoom in"}
            </Text>

            <View key={revealKey} style={s.cardsRow}>
              {cardItems.map((item, i) => (
                <RewardCard
                  key={`${revealKey}-${i}`}
                  item={item}
                  slot={slots[i]}
                  flyTrigger={flyTrigger}
                  onFlipped={handleCardFlipped}
                  onZoom={() => setZoomed(item)}
                />
              ))}
            </View>

            {totalXp > 0 && phase === "claim" && (
              <Text style={s.xpTxt}>+{totalXp} XP earned</Text>
            )}
            {refund > 0 && phase === "claim" && (
              <Text style={s.refundTxt}>+{refund} coins (duplicate refund)</Text>
            )}

            {phase === "claim" && (
              <Pressable
                style={({ pressed }) => [s.claimBtn, pressed && { opacity: 0.75 }]}
                onPress={handleClaim}
              >
                <Text style={s.claimTxt}>CLAIM REWARDS</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* ── Zoom overlay (absolute, avoids nested Modal) ── */}
        {zoomedItem && (
          <ZoomView item={zoomedItem} ownedIds={ownedIds} onClose={() => setZoomed(null)} />
        )}

      </View>
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const ZOOM_CARD_W = 240;
const ZOOM_CARD_H = 360;

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,8,22,0.97)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Bag video
  videoWrap: {
    alignItems: "center",
    gap: 16,
  },
  video: {
    width: 280,
    height: 380,
  },
  bagLabel: {
    color: "#c4a96b",
    fontSize: 13,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 3,
  },

  // ── Cards stage
  cardsWrap: {
    alignItems: "center",
    gap: 24,
    paddingHorizontal: 20,
  },
  hintTxt: {
    color: "#7c3aed",
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cardsRow: {
    width: 340,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  // ── Card
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 12,
    overflow: "hidden",
  },
  cardFill: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: CARD_W,
    height: CARD_H,
  },
  frontContent: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
    flexDirection: "column",
  },
  cardImageZone: {
    flex: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "14%",
  },
  spotOuter: {
    position: "absolute",
    width: 90,
    height: 108,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  spotInner: {
    position: "absolute",
    width: 54,
    height: 66,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  cardBanner: {
    flex: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
    gap: 1,
  },
  cardRarityTxt: {
    fontSize: 7,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  cardNameTxt: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    paddingHorizontal: 8,
    lineHeight: 13,
  },

  // ── XP / refund / claim
  xpTxt: {
    color: "#facc15",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  refundTxt: {
    color: "#a78bfa",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  claimBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 48,
  },
  claimTxt: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "SpaceGrotesk_700Bold",
    letterSpacing: 2,
  },

  // ── Zoom overlay
  zoomOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,8,22,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    zIndex: 100,
  },
  zoomCloseBtn: {
    position: "absolute",
    top: 48,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomCloseTxt: {
    color: "#fff",
    fontSize: 24,
    lineHeight: 28,
  },
  zoomCard: {
    width: ZOOM_CARD_W,
    height: ZOOM_CARD_H,
    borderRadius: 20,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 40,
    elevation: 20,
  },
  zoomFrameFill: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    width: ZOOM_CARD_W,
    height: ZOOM_CARD_H,
  },
  zoomFrontContent: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1,
  },
  zoomImageZone: {
    flex: 7,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: "14%",
  },
  zoomSpotOuter: {
    position: "absolute",
    width: 165,
    height: 196,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  zoomSpotInner: {
    position: "absolute",
    width: 100,
    height: 124,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  zoomBanner: {
    flex: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 12,
    gap: 3,
  },
  zoomRarityTxt: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
  zoomNameTxt: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "SpaceGrotesk_700Bold",
    textAlign: "center",
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  zoomCategoryTxt: {
    color: "#c4a96b",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
  },
  dupBanner: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  dupTxt: {
    color: "#9ca3af",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  flavorTxt: {
    color: "#9ca3af",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "center",
    paddingHorizontal: 32,
    lineHeight: 20,
  },
});
