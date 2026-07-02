/**
 * Galaxy screen — orbital solar-system boss hub.
 * 10 boss planets orbit a central star on an ellipse. Drag to spin, tap to
 * focus, tap focused planet / "Enter System" to open the boss intro.
 */
import { AppIcon } from "@/components/app-icon";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useRef, useCallback, useEffect } from "react";
import {
  Image,
  Platform,
  Pressable,
  PanResponder,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Ellipse as SvgEllipse } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ScreenBg } from "@/components/screen-bg";
import { useBosses } from "@/contexts/bosses";
import { useProgress } from "@/contexts/progress";
import { useColors } from "@/hooks/useColors";
import { BOSSES } from "@/lib/bosses";
import { beltForLevel } from "@/lib/progression";

// Sprite sheets — same sheets used by guardian-briefing
const bossesAction   = require("../assets/images/bosses-sprite.png");
const bossesAction2  = require("../assets/images/bosses-sprite-2.png");
const bossesNeutral  = require("../assets/images/bosses-sprite-neutral.png");
const bossesNeutral2 = require("../assets/images/bosses-sprite-2-neutral.png");
const SPRITE_S1 = { cols: 4, cellW: 384, cellH: 512,  sheetW: 1536, sheetH: 1024 };
const SPRITE_S2 = { cols: 2, cellW: 768, cellH: 1024, sheetW: 1536, sheetH: 1024 };

// Per-boss display options for the galaxy character image.
// targetW/targetH control the clipping frame; yOffset shifts the image DOWN.
// fullBody=true uses the neutral/standing sprite instead of the action/bust sprite.
const GALAXY_PORTRAIT: Record<string, { targetW?: number; targetH?: number; yOffset?: number; fullBody?: boolean }> = {
  ingvar: { targetW: 100, targetH: 190, yOffset: 30, fullBody: true },
  sandy:  { targetW: 110, targetH: 200, yOffset: 25, fullBody: true },
};
const GALAXY_PORTRAIT_DEFAULT_W = 100;
const GALAXY_PORTRAIT_DEFAULT_H = 150;

/**
 * Renders a boss character from the sprite sheet into a clipped frame.
 * Scales the sprite so the cell fills targetW, then clips to targetH from the top —
 * which naturally shows the head and upper body at the right proportions.
 */
function GalaxyPortrait({
  portraitIndex,
  targetW,
  targetH,
  fullBody = false,
}: {
  portraitIndex: number;
  targetW: number;
  targetH: number;
  fullBody?: boolean;
}) {
  const isS2 = portraitIndex >= 8;
  const sh   = isS2 ? SPRITE_S2 : SPRITE_S1;
  const li   = isS2 ? portraitIndex - 8 : portraitIndex;
  const source = fullBody
    ? (isS2 ? bossesNeutral2 : bossesNeutral)
    : (isS2 ? bossesAction2  : bossesAction);
  const col = li % sh.cols;
  const row = Math.floor(li / sh.cols);

  const scale        = targetW / sh.cellW;
  const scaledSheetW = sh.sheetW * scale;
  const scaledSheetH = sh.sheetH * scale;
  const scaledCellH  = sh.cellH  * scale;

  // Clip to exactly one sprite cell so the next row's character never bleeds
  // through when targetH > scaledCellH (sprite cells are 4:3, so scaledCellH
  // ≈ 133px for a 100px-wide frame — less than the 150–200px targetH values).
  const clipH = Math.min(targetH, scaledCellH);

  return (
    // Outer view keeps the original layout footprint (bustTopY calculations
    // assume the full targetH height); inner view clips to one cell only.
    <View style={{ width: targetW, height: targetH }}>
      <View style={{ width: targetW, height: clipH, overflow: "hidden" }}>
        <Image
          source={source}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: scaledSheetW,
            height: scaledSheetH,
            transform: [
              { translateX: -(col * targetW) },
              { translateY: -(row * scaledCellH) },
            ],
          }}
        />
      </View>
    </View>
  );
}

// ─── constants ────────────────────────────────────────────────────────────────
const N = BOSSES.length;           // 10
const TWO_PI = Math.PI * 2;
const STEP = TWO_PI / N;
const ORBIT_H = 270;               // height of the orbital stage (px)
const BASE_R = 22;                 // planet radius at full scale

// Starfield, generated once at module load (pure math, safe)
const STARS = Array.from({ length: 80 }, (_, i) => ({
  px: (i * 137.508) % 100,
  py: (i * 91.317) % 100,
  r: 0.7 + ((i * 17) % 10) * 0.13,
  o: 0.25 + ((i * 23) % 10) * 0.055,
}));

/** Lighten/darken a #rrggbb hex colour by `amount` (positive = lighter). */
function hexShift(hex: string, amount: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amount));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (n & 0xff) + amount));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

// ─── component ────────────────────────────────────────────────────────────────
export default function GalaxyScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();
  const { level } = useProgress();
  const { isBeaten } = useBosses();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 8;

  // ── orbit angle state ────────────────────────────────────────────────────
  // angle = 0 means planet[0] is at front-bottom; increases = counter-clockwise
  const [orbitAngle, setOrbitAngle] = React.useState(() => {
    // start focused on first unlocked unbeaten boss
    const i = BOSSES.findIndex((b) => level >= b.unlockLevel && !isBeaten(b.id));
    const idx = i >= 0 ? i : Math.max(0, BOSSES.filter((b) => isBeaten(b.id)).length - 1);
    return -idx * STEP;
  });
  const [focusIdx, setFocusIdx] = React.useState(() => {
    const i = BOSSES.findIndex((b) => level >= b.unlockLevel && !isBeaten(b.id));
    return i >= 0 ? i : Math.max(0, BOSSES.filter((b) => isBeaten(b.id)).length - 1);
  });

  const rawAngle = useRef(orbitAngle);
  const rafRef = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);

  // ── spring-snap to a planet index ────────────────────────────────────────
  const snapTo = useCallback((idx: number) => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    const target = -idx * STEP;
    setFocusIdx(idx);

    // Normalise current angle so spring travels < half a circle
    let current = rawAngle.current;
    while (current - target > Math.PI) current -= TWO_PI;
    while (target - current > Math.PI) current += TWO_PI;
    rawAngle.current = current;

    let vel = 0;
    const stiffness = 0.18;
    const damping = 0.72;

    function tick() {
      const force = (target - rawAngle.current) * stiffness;
      vel = (vel + force) * damping;
      rawAngle.current += vel;
      setOrbitAngle(rawAngle.current);
      if (Math.abs(vel) > 0.0005 || Math.abs(rawAngle.current - target) > 0.001) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rawAngle.current = target;
        setOrbitAngle(target);
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => () => { if (rafRef.current != null) cancelAnimationFrame(rafRef.current); }, []);

  // ── pan responder ─────────────────────────────────────────────────────────
  const dragStart = useRef(0);
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5,
      onPanResponderGrant: () => {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        dragStart.current = rawAngle.current;
      },
      onPanResponderMove: (_, g) => {
        const next = dragStart.current + g.dx * 0.012;
        rawAngle.current = next;
        setOrbitAngle(next);
      },
      onPanResponderRelease: (_, g) => {
        const swept = g.dx * 0.012;
        const raw = dragStart.current + swept;
        const normalised = ((-raw % TWO_PI) + TWO_PI) % TWO_PI;
        const nearest = Math.round(normalised / STEP) % N;
        snapTo(nearest);
      },
    })
  ).current;

  // ── orbital geometry ──────────────────────────────────────────────────────
  const CX = SW / 2;
  const CY = ORBIT_H * 0.50;
  const RX = SW * 0.39;
  const RY = ORBIT_H * 0.33;

  // ── planet data ───────────────────────────────────────────────────────────
  // Parametric orbit: at a=0, planet is at front-bottom (cos=1 → maximum y)
  //   x = CX - sin(a)*RX,  y = CY + cos(a)*RY
  // depth / scale driven by cos(a): 1=front, -1=back
  const planets = BOSSES.map((boss, i) => {
    const a = orbitAngle + i * STEP;
    const depth = Math.cos(a);          // 1=front, -1=back
    const x = CX - Math.sin(a) * RX;
    const y = CY + depth * RY;
    const scale = 0.55 + (depth + 1) * 0.45;    // 0.55 … 1.45
    const opacity = 0.32 + (depth + 1) * 0.34;  // 0.32 … 1.0
    const isFocused = i === focusIdx;
    const unlocked = level >= boss.unlockLevel;
    const beaten = isBeaten(boss.id);
    return { boss, i, x, y, scale, opacity, depth, isFocused, unlocked, beaten };
  });

  // Sort back-to-front (lower depth = further back)
  const sorted = [...planets].sort((a, b) => a.depth - b.depth);

  const focusBoss = BOSSES[focusIdx];

  // ── front planet geometry (for portrait positioning) ─────────────────────
  const frontPlanetY = CY + RY;             // bottom of the ellipse
  const frontDiam = BASE_R * 2 * 1.45;
  const portraitCfg = GALAXY_PORTRAIT[focusBoss.id] ?? {};
  const bustW    = portraitCfg.targetW  ?? GALAXY_PORTRAIT_DEFAULT_W;
  const bustH    = portraitCfg.targetH  ?? GALAXY_PORTRAIT_DEFAULT_H;
  const fullBody = portraitCfg.fullBody ?? false;
  const bustTopY = frontPlanetY - frontDiam / 2 - bustH + 16 + (portraitCfg.yOffset ?? 0);
  const focusUnlocked = level >= focusBoss.unlockLevel;
  const focusBeaten = isBeaten(focusBoss.id);
  const nBeaten = BOSSES.filter((b) => isBeaten(b.id)).length;

  return (
    <ScreenBg>
      {/* Ambient nebula glow — tinted to focused boss */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={[`${focusBoss.accentColor}1e`, "transparent"]}
          style={{ position: "absolute", top: 0, left: 0, right: 0, height: ORBIT_H + 100 }}
        />
      </View>

      <View style={{ flex: 1, paddingTop: topPad }}>

        {/* ── Header ── */}
        <View style={[styles.header, { paddingHorizontal: 20 }]}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <AppIcon name="arrow-left" size={22} color={colors.mutedForeground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: colors.accent }]}>BOSS BATTLES</Text>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>The Galaxy</Text>
          </View>
          <View style={[styles.beatChip, { borderColor: colors.border }]}>
            <Text style={[styles.beatCount, { color: colors.foreground }]}>{nBeaten}/10</Text>
            <Text style={[styles.beatLabel, { color: colors.mutedForeground }]}>beaten</Text>
          </View>
        </View>

        {/* ── Orbital stage ── */}
        <View
          style={{ height: ORBIT_H, overflow: "hidden" }}
          {...panResponder.panHandlers}
        >
          {/* Starfield */}
          {STARS.map((s, idx) => (
            <View
              key={idx}
              style={{
                position: "absolute",
                left: SW * (s.px / 100) - s.r,
                top: ORBIT_H * (s.py / 100) - s.r,
                width: s.r * 2,
                height: s.r * 2,
                borderRadius: s.r,
                backgroundColor: "#fff",
                opacity: s.o,
              }}
            />
          ))}

          {/* SVG orbit ring — behind planets */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <Svg width={SW} height={ORBIT_H}>
              <SvgEllipse
                cx={CX} cy={CY} rx={RX + 4} ry={RY + 3}
                fill="none"
                stroke="rgba(106,0,255,0.08)"
                strokeWidth={10}
              />
              <SvgEllipse
                cx={CX} cy={CY} rx={RX} ry={RY}
                fill="none"
                stroke="rgba(106,0,255,0.32)"
                strokeWidth={1}
              />
            </Svg>
          </View>

          {/* Central star — bloom layers */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: CX - 46, top: CY - 46,
              width: 92, height: 92, borderRadius: 46,
              backgroundColor: "rgba(106,0,255,0.11)",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(0,191,255,0.18)", alignItems: "center", justifyContent: "center" }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(0,191,255,0.32)", alignItems: "center", justifyContent: "center" }}>
                <View style={{ width: 17, height: 17, borderRadius: 9, backgroundColor: "rgba(180,240,255,0.88)", alignItems: "center", justifyContent: "center" }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" }} />
                </View>
              </View>
            </View>
          </View>

          {/* Planets — back-to-front */}
          {sorted.map(({ boss, i, x, y, scale, opacity, isFocused, unlocked, beaten }) => {
            const diam = BASE_R * 2;
            const scaledDiam = diam * scale;
            const lightC = hexShift(boss.accentColor, 55);
            const darkC = hexShift(boss.accentColor, -55);
            const labelW = 110;

            return (
              <React.Fragment key={boss.id}>
                {/* Glow halo — separate from Pressable so it's not clipped */}
                <View
                  pointerEvents="none"
                  style={{
                    position: "absolute",
                    left: x - scaledDiam * 0.85,
                    top: y - scaledDiam * 0.85,
                    width: scaledDiam * 1.7,
                    height: scaledDiam * 1.7,
                    borderRadius: scaledDiam * 0.85,
                    backgroundColor: boss.accentColor,
                    opacity: isFocused ? 0.16 : 0.05,
                  }}
                />

                {/* Focus ring */}
                {isFocused && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: x - (scaledDiam + 10) / 2,
                      top: y - (scaledDiam + 10) / 2,
                      width: scaledDiam + 10,
                      height: scaledDiam + 10,
                      borderRadius: (scaledDiam + 10) / 2,
                      borderWidth: 1.5,
                      borderColor: `${boss.accentColor}99`,
                    }}
                  />
                )}

                {/* Planet sphere — tappable */}
                <Pressable
                  onPress={() => {
                    if (!isFocused) { snapTo(i); return; }
                    if (unlocked) router.push(`/boss/${boss.id}`);
                  }}
                  style={{
                    position: "absolute",
                    left: x - scaledDiam / 2,
                    top: y - scaledDiam / 2,
                    width: scaledDiam,
                    height: scaledDiam,
                    borderRadius: scaledDiam / 2,
                    overflow: "hidden",
                    opacity,
                  }}
                >
                  <LinearGradient
                    colors={[lightC, boss.accentColor, darkC]}
                    start={{ x: 0.25, y: 0.08 }}
                    end={{ x: 0.85, y: 1.0 }}
                    style={{ width: scaledDiam, height: scaledDiam, alignItems: "center", justifyContent: "center" }}
                  >
                    {!unlocked && (
                      <Text style={{ fontSize: Math.max(8, scaledDiam * 0.28), color: "rgba(255,255,255,0.45)" }}>🔒</Text>
                    )}
                    {beaten && (
                      <Text style={{ fontSize: Math.max(8, scaledDiam * 0.28), color: "rgba(255,255,255,0.9)" }}>✓</Text>
                    )}
                  </LinearGradient>
                </Pressable>

                {/* Planet label — sibling of Pressable so it's never clipped */}
                {isFocused && (
                  <Text
                    numberOfLines={1}
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: x - labelW / 2,
                      top: y + scaledDiam / 2 + 5,
                      width: labelW,
                      fontSize: 9,
                      fontFamily: "Inter_600SemiBold",
                      color: boss.accentColor,
                      letterSpacing: 0.5,
                      textAlign: "center",
                    }}
                  >
                    {boss.planet.toUpperCase()}
                  </Text>
                )}
              </React.Fragment>
            );
          })}

          {/* Boss portrait above front planet — rendered AFTER planets so it sits on top */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: CX - bustW / 2,
              top: bustTopY,
              width: bustW,
              height: bustH,
              zIndex: 20,
              elevation: 20,
            }}
          >
            <GalaxyPortrait
              portraitIndex={focusBoss.portraitIndex}
              targetW={bustW}
              targetH={bustH}
              fullBody={fullBody}
            />
          </View>
        </View>

        {/* ── Info panel ── */}
        <View style={[styles.infoPanel, { borderColor: `${focusBoss.accentColor}44`, marginHorizontal: 20 }]}>
          <Text style={[styles.infoBossName, { color: focusBoss.accentColor }]}>
            {focusBoss.name}
          </Text>
          {focusBoss.nameAccent && (
            <Text style={[styles.infoBossAccent, { color: colors.foreground }]}>
              {focusBoss.nameAccent}
            </Text>
          )}

          <View style={styles.infoRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <AppIcon name="globe" size={11} color={colors.mutedForeground} />
              <Text style={[styles.infoPlanet, { color: colors.mutedForeground }]}>
                {focusBoss.planet}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 3 }}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <AppIcon
                  key={idx}
                  name="star"
                  size={11}
                  color={idx < focusBoss.difficulty ? "#f3c14b" : "rgba(255,255,255,0.18)"}
                />
              ))}
            </View>
          </View>

          {(() => {
            const belt = beltForLevel(focusBoss.unlockLevel);
            return (
              <View style={[styles.beltChip, { borderColor: `${belt.color}55` }]}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: belt.color }} />
                <Text style={[styles.beltText, { color: belt.color }]}>
                  {belt.name.toUpperCase()} BELT GUARDIAN
                </Text>
              </View>
            );
          })()}

          {focusUnlocked ? (
            <Pressable
              onPress={() => router.push(`/boss/${focusBoss.id}`)}
              style={({ pressed }) => [
                styles.enterBtn,
                {
                  backgroundColor: focusBeaten ? "rgba(255,255,255,0.07)" : focusBoss.accentColor,
                  borderWidth: focusBeaten ? 1 : 0,
                  borderColor: focusBeaten ? `${focusBoss.accentColor}88` : "transparent",
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <AppIcon name="zap" size={15} color={focusBeaten ? focusBoss.accentColor : "#050816"} />
              <Text style={[styles.enterText, { color: focusBeaten ? focusBoss.accentColor : "#050816" }]}>
                {focusBeaten ? "CHALLENGE AGAIN" : "ENTER SYSTEM"}
              </Text>
            </Pressable>
          ) : (
            <View style={[styles.lockedBtn, { borderColor: colors.border }]}>
              <AppIcon name="lock" size={13} color={colors.mutedForeground} />
              <Text style={[styles.lockedText, { color: colors.mutedForeground }]}>
                UNLOCKS AT LEVEL {focusBoss.unlockLevel}
              </Text>
            </View>
          )}
        </View>

      </View>
    </ScreenBg>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    marginBottom: 10,
  },
  kicker: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 2 },
  pageTitle: { fontSize: 28, fontFamily: "SpaceGrotesk_700Bold" },
  beatChip: {
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  beatCount: { fontSize: 18, fontFamily: "SpaceGrotesk_700Bold" },
  beatLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },

  infoPanel: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 16,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  infoBossName: {
    fontSize: 20,
    fontFamily: "SpaceGrotesk_700Bold",
    lineHeight: 24,
    marginBottom: 2,
  },
  infoBossAccent: {
    fontSize: 16,
    fontFamily: "SpaceGrotesk_600SemiBold",
    lineHeight: 20,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  infoPlanet: { fontSize: 12, fontFamily: "Inter_400Regular" },
  beltChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginBottom: 14,
  },
  beltText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  enterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
  },
  enterText: { fontSize: 14, fontFamily: "SpaceGrotesk_700Bold" },
  lockedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  lockedText: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
});
