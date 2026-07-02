/**
 * Boss intro screen — shows the boss's full profile before the player accepts
 * the challenge. Reached from the Galaxy screen.
 */
import { AppIcon } from "@/components/app-icon";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Animated, Image, Modal, PanResponder, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BOSS_FULLS, BOSS_GUITARS, BOSS_GUITAR_CLOSEUPS } from "@/assets/images/characters";
import { ScreenBg } from "@/components/screen-bg";
import { useBosses } from "@/contexts/bosses";
import { useColors } from "@/hooks/useColors";
import { getBoss, BOSS_PASS_THRESHOLD } from "@/lib/bosses";
import { beltForLevel } from "@/lib/progression";

function AttributeBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colors = useColors();
  const segs = 14;
  const filled = Math.round((value / 10) * segs);
  return (
    <View style={styles.attrRow}>
      <Text style={[styles.attrLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 2, flex: 1 }}>
        {Array.from({ length: segs }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.attrSeg,
              {
                backgroundColor: i < filled ? color : "rgba(255,255,255,0.1)",
                shadowColor: i < filled ? color : "transparent",
                shadowOpacity: i < filled ? 0.7 : 0,
                shadowRadius: 3,
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.attrVal, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function StarRow({ count, filled, color }: { count: number; filled: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <AppIcon key={i} name="star" size={16} color={i < filled ? "#f3c14b" : "rgba(255,255,255,0.15)"} />
      ))}
    </View>
  );
}

function SectionCard({ label, accentColor, children }: { label: string; accentColor: string; children: React.ReactNode }) {
  return (
    <View style={[styles.card, { borderColor: `${accentColor}33` }]}>
      <Text style={[styles.cardLabel, { color: accentColor }]}>{label}</Text>
      {children}
    </View>
  );
}

function ImageLightbox({ source, label, onClose }: { source: number; label: string; onClose: () => void }) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const txAnim    = React.useRef(new Animated.Value(0)).current;
  const tyAnim    = React.useRef(new Animated.Value(0)).current;

  const committed  = React.useRef({ scale: 1, tx: 0, ty: 0 });
  const liveScale  = React.useRef(1);
  const pinchRef   = React.useRef({ active: false, initDist: 0, initScale: 1 });
  const lastTap    = React.useRef(0);

  function resetZoom() {
    committed.current = { scale: 1, tx: 0, ty: 0 };
    liveScale.current = 1;
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 8 }),
      Animated.spring(txAnim,    { toValue: 0, useNativeDriver: true, friction: 8 }),
      Animated.spring(tyAnim,    { toValue: 0, useNativeDriver: true, friction: 8 }),
    ]).start();
  }

  const pr = React.useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onShouldBlockNativeResponder: () => true,

    onPanResponderGrant: (e) => {
      const ts = e.nativeEvent.touches;
      if (ts.length >= 2) {
        pinchRef.current = {
          active:    true,
          initDist:  Math.hypot(ts[0].pageX - ts[1].pageX, ts[0].pageY - ts[1].pageY),
          initScale: committed.current.scale,
        };
      }
    },

    onPanResponderMove: (e, g) => {
      const ts = e.nativeEvent.touches;
      if (ts.length >= 2) {
        // Auto-init pinch the first time two fingers are seen (grant fires with 1 finger)
        if (!pinchRef.current.active) {
          pinchRef.current = {
            active:    true,
            initDist:  Math.hypot(ts[0].pageX - ts[1].pageX, ts[0].pageY - ts[1].pageY),
            initScale: committed.current.scale,
          };
        }
        const d = Math.hypot(ts[0].pageX - ts[1].pageX, ts[0].pageY - ts[1].pageY);
        const s = Math.max(1, Math.min(5, pinchRef.current.initScale * (d / pinchRef.current.initDist)));
        liveScale.current = s;
        scaleAnim.setValue(s);
      } else if (ts.length === 1 && !pinchRef.current.active && committed.current.scale > 1.05) {
        txAnim.setValue(committed.current.tx + g.dx);
        tyAnim.setValue(committed.current.ty + g.dy);
      }
    },

    onPanResponderRelease: (e, g) => {
      if (pinchRef.current.active) {
        committed.current.scale = liveScale.current;
        pinchRef.current.active = false;
        if (committed.current.scale < 1.2) resetZoom();
      } else if (committed.current.scale > 1.05) {
        committed.current.tx += g.dx;
        committed.current.ty += g.dy;
        txAnim.setValue(committed.current.tx);
        tyAnim.setValue(committed.current.ty);
      } else {
        // double-tap to reset (when already at 1×)
        const now = Date.now();
        if (now - lastTap.current < 280) resetZoom();
        lastTap.current = now;
      }
    },

    onPanResponderTerminationRequest: () => false,
  })).current;

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.lbBackdrop} {...pr.panHandlers}>
        {/* Close — always reachable */}
        <Pressable style={styles.lbClose} onPress={onClose} hitSlop={20}>
          <AppIcon name="x" size={22} color="#ece8ff" />
        </Pressable>

        {/* Label */}
        <Text style={styles.lbLabel}>{label}</Text>

        {/* Zoomable image */}
        <Animated.View
          style={[
            styles.lbImageWrapper,
            { transform: [{ translateX: txAnim }, { translateY: tyAnim }, { scale: scaleAnim }] },
          ]}
        >
          <Image source={source} style={styles.lbImage} resizeMode="contain" />
        </Animated.View>

        {/* Hint */}
        <Text style={styles.lbHint}>Pinch to zoom · Double-tap to reset</Text>
      </View>
    </Modal>
  );
}

export default function BossIntroScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isBeaten } = useBosses();
  const [zoom, setZoom] = React.useState<{ source: number; label: string } | null>(null);

  const boss = getBoss(id ?? "");
  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;
  const bottomPad = (Platform.OS === "web" ? 84 : insets.bottom) + 24;

  if (!boss) {
    return (
      <ScreenBg>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.foreground }}>Boss not found.</Text>
        </View>
      </ScreenBg>
    );
  }

  const beaten = isBeaten(boss.id);
  const accent = boss.accentColor;

  return (
    <ScreenBg>
      {/* Ambient glow */}
      <LinearGradient
        colors={[`${accent}28`, "transparent"]}
        style={[StyleSheet.absoluteFill, { bottom: "60%" }]}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingHorizontal: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header nav */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <AppIcon name="arrow-left" size={24} color={colors.mutedForeground} />
          </Pressable>
          <Text style={[styles.systemLabel, { color: colors.mutedForeground }]}>SYSTEM {boss.system}</Text>
        </View>

        {/* Hero character card */}
        {BOSS_FULLS[boss.id] && (
          <View style={[styles.heroWrap, { borderColor: `${accent}55`, backgroundColor: "#000" }]}>
            <Image source={BOSS_FULLS[boss.id]} style={styles.heroImage} resizeMode="contain" />
            <LinearGradient
              colors={["transparent", "#050816"]}
              style={[StyleSheet.absoluteFill, { top: "55%" }]}
              pointerEvents="none"
            />
          </View>
        )}

        {/* Name + planet */}
        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: accent }]}>{boss.name}</Text>
          {boss.nameAccent && (
            <Text style={[styles.nameAccent, { color: colors.foreground }]}>{boss.nameAccent}</Text>
          )}
          {boss.titles.map((t) => (
            <Text key={t} style={[styles.title, { color: colors.mutedForeground }]}>{t}</Text>
          ))}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 }}>
            <AppIcon name="globe" size={13} color={colors.mutedForeground} />
            <Text style={[styles.planet, { color: colors.mutedForeground }]}>{boss.planet}</Text>
            {beaten && (
              <View style={[styles.beatenBadge, { borderColor: accent }]}>
                <AppIcon name="check-circle" size={12} color={accent} />
                <Text style={[styles.beatenText, { color: accent }]}>BEATEN</Text>
              </View>
            )}
          </View>
        </View>

        {/* Belt + Difficulty */}
        {(() => {
          const belt = beltForLevel(boss.unlockLevel);
          return (
            <View style={[styles.card, { borderColor: `${accent}33` }]}>
              {/* Belt row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <View style={[styles.beltPip, { backgroundColor: belt.color, shadowColor: belt.color }]} />
                <Text style={[styles.beltName, { color: belt.color }]}>{belt.name.toUpperCase()} BELT GUARDIAN</Text>
              </View>
              {/* Difficulty row */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View>
                  <Text style={[styles.cardLabel, { color: accent, marginBottom: 6 }]}>DIFFICULTY</Text>
                  <StarRow count={5} filled={boss.difficulty} color={accent} />
                </View>
                <Text style={[styles.diffTagline, { color: colors.mutedForeground }]}>{boss.difficultyTagline}</Text>
              </View>
            </View>
          );
        })()}

        {/* Quote */}
        <View style={[styles.quoteBox, { borderLeftColor: accent }]}>
          <Text style={[styles.quote, { color: colors.foreground }]}>"{boss.quote}"</Text>
        </View>

        {/* Origin Story */}
        <SectionCard label="ORIGIN STORY" accentColor={accent}>
          {boss.originStory.map((p, i) => (
            <Text key={i} style={[styles.bodyText, { color: colors.foreground, marginBottom: i < boss.originStory.length - 1 ? 10 : 0 }]}>{p}</Text>
          ))}
        </SectionCard>

        {/* Specialty */}
        <SectionCard label="SPECIALTY" accentColor={accent}>
          <Text style={[styles.bodyText, { color: colors.foreground }]}>{boss.specialty}</Text>
        </SectionCard>

        {/* Special Ability + Guardian Power */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 12 }}>
          <View style={[styles.card, { flex: 1, marginBottom: 0, borderColor: `${accent}33` }]}>
            <Text style={[styles.cardLabel, { color: accent }]}>SPECIAL ABILITY</Text>
            <Text style={[styles.powerTitle, { color: "#f3c14b" }]}>{boss.specialAbility.title}</Text>
            <Text style={[styles.smallText, { color: colors.mutedForeground }]}>{boss.specialAbility.body}</Text>
          </View>
          <View style={[styles.card, { flex: 1, marginBottom: 0, borderColor: `${accent}33` }]}>
            <Text style={[styles.cardLabel, { color: accent }]}>GUARDIAN POWER</Text>
            <Text style={[styles.powerTitle, { color: "#f3c14b" }]}>{boss.guardianPower.title}</Text>
            <Text style={[styles.smallText, { color: colors.mutedForeground }]}>{boss.guardianPower.body}</Text>
          </View>
        </View>

        {/* Attributes */}
        <SectionCard label="ATTRIBUTES" accentColor={accent}>
          {boss.attributes.map((a) => (
            <AttributeBar key={a.label} label={a.label} value={a.value} color={accent} />
          ))}
        </SectionCard>

        {/* Fun Facts */}
        <SectionCard label="FUN FACTS" accentColor={accent}>
          {boss.funFacts.map((f, i) => (
            <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: i < boss.funFacts.length - 1 ? 7 : 0 }}>
              <Text style={{ color: accent, fontSize: 13, lineHeight: 20 }}>•</Text>
              <Text style={[styles.smallText, { color: colors.foreground, flex: 1 }]}>{f}</Text>
            </View>
          ))}
        </SectionCard>

        {/* Gallery */}
        {(BOSS_GUITARS[boss.id] || BOSS_GUITAR_CLOSEUPS[boss.id]) && (
          <SectionCard label="GALLERY — PINCH TO ZOOM" accentColor={accent}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {BOSS_FULLS[boss.id] && (
                <Pressable
                  style={[styles.gallerySlot, { borderColor: `${accent}44`, backgroundColor: "#000" }]}
                  onPress={() => setZoom({ source: BOSS_FULLS[boss.id], label: "Character" })}
                >
                  <Image source={BOSS_FULLS[boss.id]} style={styles.galleryImage} resizeMode="contain" />
                  <Text style={[styles.galleryLabel, { color: colors.mutedForeground }]}>Character</Text>
                  <View style={styles.zoomHint}><AppIcon name="zoom-in" size={12} color="#f3c14b" /></View>
                </Pressable>
              )}
              {BOSS_GUITARS[boss.id] && (
                <Pressable
                  style={[styles.gallerySlot, { borderColor: `${accent}44`, backgroundColor: "#000" }]}
                  onPress={() => setZoom({ source: BOSS_GUITARS[boss.id], label: "Signature Guitar" })}
                >
                  <Image source={BOSS_GUITARS[boss.id]} style={styles.galleryImage} resizeMode="contain" />
                  <Text style={[styles.galleryLabel, { color: colors.mutedForeground }]}>Signature Guitar</Text>
                  <View style={styles.zoomHint}><AppIcon name="zoom-in" size={12} color="#f3c14b" /></View>
                </Pressable>
              )}
              {BOSS_GUITAR_CLOSEUPS[boss.id] && (
                <Pressable
                  style={[styles.gallerySlot, { borderColor: `${accent}44`, backgroundColor: "#000" }]}
                  onPress={() => setZoom({ source: BOSS_GUITAR_CLOSEUPS[boss.id], label: "Guitar Close-Up" })}
                >
                  <Image source={BOSS_GUITAR_CLOSEUPS[boss.id]} style={styles.galleryImage} resizeMode="contain" />
                  <Text style={[styles.galleryLabel, { color: colors.mutedForeground }]}>Guitar Close-Up</Text>
                  <View style={styles.zoomHint}><AppIcon name="zoom-in" size={12} color="#f3c14b" /></View>
                </Pressable>
              )}
            </View>
          </SectionCard>
        )}

        {zoom && <ImageLightbox source={zoom.source} label={zoom.label} onClose={() => setZoom(null)} />}

        {/* Battle rules */}
        <View style={[styles.card, { borderColor: colors.border, backgroundColor: "rgba(255,255,255,0.03)" }]}>
          <Text style={[styles.cardLabel, { color: colors.foreground }]}>BATTLE RULES</Text>
          <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>
            10 mixed theory questions drawn from all drill types.{"\n"}
            Score {BOSS_PASS_THRESHOLD}/10 or better to win.
          </Text>
        </View>

        {/* Challenge button */}
        <Pressable
          onPress={() => router.push(`/boss/battle/${boss.id}`)}
          style={({ pressed }) => [styles.challengeBtn, { backgroundColor: accent, opacity: pressed ? 0.85 : 1 }]}
        >
          <AppIcon name="zap" size={18} color="#050816" />
          <Text style={styles.challengeText}>{beaten ? "CHALLENGE AGAIN" : "ACCEPT CHALLENGE"}</Text>
        </Pressable>
      </ScrollView>
    </ScreenBg>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  systemLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  heroWrap: {
    alignSelf: "center",
    width: 220,
    height: 330,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroImage: { width: "100%", height: "100%" },
  nameBlock: { marginBottom: 20 },
  name: { fontSize: 36, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 40 },
  nameAccent: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold", lineHeight: 32 },
  title: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 1, textTransform: "uppercase", marginTop: 3 },
  planet: { fontSize: 14, fontFamily: "Inter_400Regular" },
  beatenBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  beatenText: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  quoteBox: { borderLeftWidth: 3, paddingLeft: 14, marginBottom: 12 },
  quote: { fontSize: 16, fontFamily: "Inter_400Regular", lineHeight: 24, fontStyle: "italic" },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  cardLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.5, marginBottom: 10 },
  beltPip: { width: 12, height: 12, borderRadius: 6, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  beltName: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 1.2 },
  diffTagline: { fontSize: 11, fontFamily: "Inter_500Medium", fontStyle: "italic", textAlign: "right", flex: 1, marginLeft: 12 },
  bodyText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  smallText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  powerTitle: { fontSize: 14, fontFamily: "SpaceGrotesk_600SemiBold", marginBottom: 6 },
  attrRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  attrLabel: { fontSize: 11, fontFamily: "Inter_500Medium", width: 72 },
  attrSeg: { flex: 1, height: 10, borderRadius: 2 },
  attrVal: { fontSize: 12, fontFamily: "SpaceGrotesk_600SemiBold", width: 18, textAlign: "right" },
  gallerySlot: {
    flex: 1,
    height: 110,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  galleryImage: { width: "100%", height: 82 },
  galleryLabel: { fontSize: 10, fontFamily: "Inter_500Medium", letterSpacing: 0.5, textAlign: "center", paddingVertical: 4 },
  zoomHint: {
    position: "absolute",
    top: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(12,7,28,0.75)",
    alignItems: "center",
    justifyContent: "center",
  },
  lbBackdrop: {
    flex: 1,
    backgroundColor: "rgba(5,3,14,0.97)",
    alignItems: "center",
    justifyContent: "center",
  },
  lbClose: {
    position: "absolute",
    top: 52,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  lbLabel: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#ece8ff",
  },
  lbImageWrapper: {
    width: "100%",
    height: "75%",
    alignItems: "center",
    justifyContent: "center",
  },
  lbImage: { width: "100%", height: "100%" },
  lbHint: {
    position: "absolute",
    bottom: 48,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.3)",
    letterSpacing: 0.5,
  },
  challengeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  challengeText: { fontSize: 16, fontFamily: "SpaceGrotesk_700Bold", color: "#050816" },
});
