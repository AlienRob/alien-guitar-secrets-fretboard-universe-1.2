/**
 * PhotoFretboard — portrait-orientation fretboard using the real neck photo.
 *
 * Drop-in replacement for <Fretboard> on portrait screens (drills, Star Map).
 * Keeps the same public API so screens need minimal changes.
 *
 * Photo:  fretboard-portrait.png  (474×1020, transparent bg, alien-head inlays baked in)
 * Inlay:  alien-inlay.png         (alien head, overlaid at position-marker frets)
 *
 * Extension frets (13–24): rendered as a dark-wood View with SVG fret-wire lines.
 * No tile image is used — the tile contained baked-in chrome inlays that compressed
 * into crescent slivers when scaled to the small fret-cell heights of the upper register.
 *
 * startFret prop: when > 0, renders a windowed view of the neck starting at
 * that fret. The photo is offset upward so the first visible cell is centred
 * in the window, and the container height clips to (startFret … startFret+frets).
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle,
  G,
  Image as SvgImage,
  Line,
  Rect,
  Text as SvgText,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { getNoteName, getNoteValue, STRINGS } from "@/lib/musicTheory";

// ─── Public types (API-compatible with fretboard.tsx) ──────────────────────────

export interface PcInfo { note: string; degree: string; }
export type FretboardMode = "display" | "tap-one" | "tap-many" | "chord-build";
export type TapResult = "correct" | "wrong" | null;

export interface HighlightCell {
  string: number; // col index (0 = low-E)
  fret: number;
  colour: string;
  label?: string;
}

export interface BarreIndicator {
  fret: number;
  fromCol: number;
  toCol: number;
}

export interface PhotoFretboardProps {
  pcInfo: Record<number, PcInfo>;
  rootPitch: number | null;
  useSharps: boolean;
  frets?: number;

  /** When set, renders a windowed view starting at this fret number. */
  startFret?: number;

  tapped?: { col: number; fret: number } | null;
  onTap?: (col: number, fret: number) => void;
  showOpenNames?: boolean;

  mode?: FretboardMode;
  readOnly?: boolean;
  tapResult?: TapResult;

  selection?: Array<{ col: number; fret: number }>;
  onSelectionChange?: (sel: Array<{ col: number; fret: number }>) => void;
  onSelectionConfirm?: () => void;

  onChordSubmit?: (placement: Array<number | null>) => void;

  highlightCells?: HighlightCell[];
  barre?: BarreIndicator;

  // Accepted for API compatibility; ignored (photo has fixed geometry)
  nutWidth?: number;
  bodyWidth?: number;

  /**
   * Override the auto-computed display width (px). Used by LandscapeFretboard
   * to force the portrait scale to match the available landscape height.
   */
  displayWidth?: number;
}

// ─── Photo geometry (exported for landscape-fretboard.tsx) ────────────────────

// neck-game.png (2435×673, top-down view) rotated 90° CW → portrait 673×2435
// (nut at top, low-E left, high-e right — no visible strings in photo, SVG overlay)
export const PHOTO_W = 673;
export const PHOTO_H = 2435;

// String lane (% of display width).
// Top-down image has no string grooves — strings are pure SVG overlays.
// 8.5 % inset each side so the outermost-string dot shadow (r = DOT_R+3)
// never clips the SVG boundary at any supported displayWidth.
export const FB_LEFT_PCT  = 8.5;
export const FB_RIGHT_PCT = 91.5;

export const N_STRINGS    = 6;
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"] as const;
const STROKE_WTS   = [3.0, 2.4, 2.0, 1.5, 1.0, 0.7]; // low-E → high-e
const strColor     = (col: number) =>
  col < 3 ? "rgba(210,175,110,0.82)" : "rgba(215,215,220,0.78)";

// Fret wire Y positions as % of DISPLAY_H.
// Frets 0–12: X peaks measured from landscape image ÷ 2435 × 100.
//   (nut right-edge peak at x=102, fret-wire peaks [3]–[14] for frets 1–12)
// Frets 13–24: uniform repeat — pos(n) = fret12% + (pos(n−12) − nut%)
//   so frets 13–24 occupy the same visual height as frets 1–12.
//   This makes every fret cell the same size on screen, which is easier
//   to play on than a physically-accurate compressed upper register.
export const FRET_WIRE_Y: Record<number, number> = {
   0:  4.19, // nut
   1: 10.68,   2: 18.85,   3: 26.94,   4: 35.15,   5: 43.20,
   6: 51.29,   7: 58.89,   8: 66.24,   9: 73.26,  10: 80.29,
  11: 86.82,  12: 93.51,
  13: 100.00, 14: 108.17, 15: 116.26, 16: 124.47, 17: 132.52,
  18: 140.61, 19: 148.21, 20: 155.56, 21: 162.58, 22: 169.61,
  23: 176.14, 24: 182.83,
};

// Frets with position-marker inlays
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];

// Fret numbers shown in left gutter
const FRET_LABEL_AT = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24];

// Colour constants
const ROOT_DOT     = "#ff3b3b";
const SCALE_DOT    = "#3b8aff";
const FLASH_OK     = "#00e66680";
const FLASH_BAD    = "#ff3b3080";
const DOT_R        = 13;
const OPEN_DOT_R   = 10;  // open-string dots are smaller — narrow headstock strip
export const BOTTOM_LBL_H = 36; // height of string-name circle strip at bottom

// Assets (resolved via Metro bundler)
const FRETBOARD_IMG = require("@/assets/images/fretboard-portrait.png");
const ALIEN_IMG     = require("@/assets/images/alien-inlay.png");

// col 0 = low-E (leftmost). STRINGS is high-E-first so STRINGS[5] = low-E.
function colToStrIdx(col: number) { return STRINGS.length - 1 - col; }

// ─── Component ─────────────────────────────────────────────────────────────────

export function PhotoFretboard({
  pcInfo,
  rootPitch,
  useSharps,
  frets = 12,
  startFret,
  tapped,
  onTap,
  showOpenNames = true,
  mode = "display",
  readOnly = false,
  tapResult = null,
  selection,
  onSelectionChange,
  onSelectionConfirm,
  onChordSubmit,
  highlightCells = [],
  barre,
  displayWidth,
}: PhotoFretboardProps) {
  const colors = useColors();
  const { width: screenW } = useWindowDimensions();

  // ── Scale photo to screen ────────────────────────────────────────────────

  const DW = displayWidth ?? Math.min(screenW - 32, 300); // display width
  const DH = Math.round(DW * PHOTO_H / PHOTO_W);         // photo height at this scale
  const EXTRA = Math.ceil(DH * (FRET_WIRE_Y[24] - 100) / 100) + 16; // tile extension
  const FULL_H = DH + EXTRA;                             // photo + extension

  // ── Windowed view support ────────────────────────────────────────────────
  //
  // When startFret > 0:
  //   sfPx = Y pixel of the wire ONE BELOW startFret (so the first cell has
  //          a half-fret of space above it inside the window).
  //   The photo is shifted up by sfPx; the SVG Y coords are all offset by sfPx.
  //   The container height is clipped to (startFret … startFret+frets).
  //
  const SF = Math.max(0, startFret ?? 0);
  const sfPx = SF > 0
    ? Math.floor(DH * (FRET_WIRE_Y[SF - 1] ?? 0) / 100)
    : 0;

  // Visible container height: clip at (startFret + frets) wire + label strip
  const endFret = Math.min(SF + frets, 24);
  const endPct  = FRET_WIRE_Y[endFret] ?? 115.4;
  const visH = endFret <= 18
    ? Math.ceil(DH * endPct / 100) - sfPx + BOTTOM_LBL_H
    : FULL_H - sfPx + BOTTOM_LBL_H;

  // ── Geometry helpers ─────────────────────────────────────────────────────

  // X position of string column
  const strXpx = (col: number) =>
    DW * (FB_LEFT_PCT + (FB_RIGHT_PCT - FB_LEFT_PCT) * col / (N_STRINGS - 1)) / 100;

  // Y of fret wire k, relative to the top of the windowed container
  const fretYpx = (k: number) =>
    Math.floor(DH * (FRET_WIRE_Y[k] ?? 99) / 100) - sfPx;

  // Y center of fret k cell, relative to window top.
  // Fret 0 (open strings): same midpoint formula as all other frets —
  // centred in the slot between the nut wire and fret 1 wire (behind the nut).
  const dotYpx = (k: number) =>
    (
      Math.floor(DH * (FRET_WIRE_Y[k - 1] ?? 0) / 100) +
      Math.floor(DH * (FRET_WIRE_Y[k] ?? 99) / 100)
    ) / 2 - sfPx;

  // Half-sizes of each cell hit-area
  const cellHalfW = () =>
    DW * (FB_RIGHT_PCT - FB_LEFT_PCT) / 100 / (N_STRINGS - 1) / 2;
  const cellHalfH = (k: number) =>
    k === 0 ? fretYpx(0) / 2 : (fretYpx(k) - fretYpx(k - 1)) / 2;

  const strGap = DW * (FB_RIGHT_PCT - FB_LEFT_PCT) / 100 / (N_STRINGS - 1);

  // ── State ────────────────────────────────────────────────────────────────

  const [lastTapped, setLastTapped] = useState<{ col: number; fret: number } | null>(null);
  const [internalSel, setInternalSel] = useState<Array<{ col: number; fret: number }>>([]);
  const activeSel = selection ?? internalSel;

  const [chordPlacement, setChordPlacement] = useState<Array<number | null>>(
    Array(N_STRINGS).fill(null),
  );
  const prevMode = useRef(mode);
  useEffect(() => {
    if (mode === "chord-build" && prevMode.current !== "chord-build") {
      setChordPlacement(Array(N_STRINGS).fill(null));
    }
    prevMode.current = mode;
  }, [mode]);

  useEffect(() => {
    if (selection && selection.length === 0) setInternalSel([]);
  }, [selection]);

  // Clear the stale tap dot whenever the parent resets tapResult to null
  // (i.e. when advancing to the next question in tap-one drills).
  useEffect(() => {
    if (tapResult === null) setLastTapped(null);
  }, [tapResult]);

  const chordHasFret = chordPlacement.some((f) => f !== null);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCellPress = useCallback(
    (col: number, fret: number) => {
      if (readOnly) return;

      if (mode === "display" || mode === "tap-one") {
        setLastTapped({ col, fret });
        onTap?.(col, fret);
      } else if (mode === "tap-many") {
        const exists = activeSel.some((c) => c.col === col && c.fret === fret);
        const next = exists
          ? activeSel.filter((c) => !(c.col === col && c.fret === fret))
          : [...activeSel, { col, fret }];
        setInternalSel(next);
        onSelectionChange?.(next);
      } else if (mode === "chord-build") {
        const next = [...chordPlacement];
        next[col] = next[col] === fret ? null : fret;
        setChordPlacement(next);
      }
    },
    [readOnly, mode, activeSel, onTap, onSelectionChange, chordPlacement],
  );

  // ── Cell helpers ─────────────────────────────────────────────────────────

  const isSelected = (col: number, fret: number) =>
    activeSel.some((c) => c.col === col && c.fret === fret);

  const hlFor = (col: number, fret: number): HighlightCell | undefined =>
    highlightCells.find((h) => h.string === col && h.fret === fret);

  const flashFor = (col: number, fret: number): TapResult => {
    if (mode !== "tap-one" || tapResult === null) return null;
    if (lastTapped?.col === col && lastTapped?.fret === fret) return tapResult;
    return null;
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrap}>
      {/* Fixed-size clipping container */}
      <View style={{ width: DW, height: visH, overflow: "hidden" }}>

        {/* Neck photo — shifted up by sfPx to reveal the windowed region */}
        <Image
          source={FRETBOARD_IMG}
          style={{ position: "absolute", top: -sfPx, left: 0, width: DW, height: DH }}
          resizeMode="stretch"
        />

        {/* Extension frets 13–24: same neck photo at full size, nut aligned
            to the fret-12 wire so tile-fret-1 = display-fret-13, etc.
            FRET_WIRE_Y[13–24] uses a uniform repeat of the lower-octave
            spacing (not compressed guitar physics), so the baked-in wire
            lines in the full-size image land exactly on the dot positions. */}
        {endFret > 12 && (() => {
          const fret0Ypx = Math.floor(DH * (FRET_WIRE_Y[0] ?? 4.19) / 100);
          const extStart = fretYpx(12);
          const extEnd   = fretYpx(Math.min(endFret, 24));
          const extH     = Math.max(0, extEnd - extStart);
          return extH > 0 ? (
            <View
              key="ext-bg"
              style={{
                position: "absolute",
                top: extStart,
                left: 0,
                width: DW,
                height: extH,
                overflow: "hidden",
              }}
            >
              <Image
                source={FRETBOARD_IMG}
                style={{
                  position: "absolute",
                  top: -fret0Ypx,
                  left: 0,
                  width: DW,
                  height: DH,
                }}
                resizeMode="stretch"
              />
            </View>
          ) : null;
        })()}

        {/* SVG overlay: strings, inlays, dots, labels, hit-area flash */}
        <Svg
          width={DW}
          height={visH}
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* Strings — full visible height, above label strip */}
          {Array.from({ length: N_STRINGS }, (_, col) => (
            <G key={`str-${col}`}>
              <Line
                x1={strXpx(col)} y1={0}
                x2={strXpx(col)} y2={visH - BOTTOM_LBL_H}
                stroke="#000000"
                strokeWidth={STROKE_WTS[col] * 0.5}
                opacity={0.3}
              />
              <Line
                x1={strXpx(col)} y1={0}
                x2={strXpx(col)} y2={visH - BOTTOM_LBL_H}
                stroke={strColor(col)}
                strokeWidth={STROKE_WTS[col] * 0.9}
                opacity={0.9}
              />
            </G>
          ))}

          {/* Position indicator: "5fr" just right of high-e string so it stays
              visible even when displayWidth exceeds screen width */}
          {SF > 0 && (
            <SvgText
              x={strXpx(N_STRINGS - 1) + 20}
              y={16}
              fill={colors.mutedForeground}
              fontSize={11}
              fontWeight="700"
              textAnchor="start"
            >
              {SF}fr
            </SvgText>
          )}


          {/* Alien head inlays at single-dot positions */}
          {SINGLE_INLAYS.filter((k) => k >= SF && k <= SF + frets).map((k) => {
            const cy = dotYpx(k);
            const sz = 28;
            return (
              <SvgImage
                key={`inlay-${k}`}
                href={ALIEN_IMG}
                x={DW / 2 - sz / 2}
                y={cy - sz / 2}
                width={sz}
                height={sz}
                opacity={0.5}
              />
            );
          })}

          {/* Alien head inlays at double-dot positions (12th & 24th) */}
          {DOUBLE_INLAYS.filter((k) => k >= SF && k <= SF + frets).map((k) => {
            const cy  = dotYpx(k);
            const sz  = 24;
            const gap = strGap * 1.5;
            return (
              <G key={`inlay-d-${k}`}>
                <SvgImage
                  href={ALIEN_IMG}
                  x={DW / 2 - gap / 2 - sz / 2}
                  y={cy - sz / 2}
                  width={sz} height={sz} opacity={0.5}
                />
                <SvgImage
                  href={ALIEN_IMG}
                  x={DW / 2 + gap / 2 - sz / 2}
                  y={cy - sz / 2}
                  width={sz} height={sz} opacity={0.5}
                />
              </G>
            );
          })}

          {/* Fret numbers — left of low-E string so they stay visible when
              displayWidth exceeds screen width (right gutter clips off-screen) */}
          {FRET_LABEL_AT.filter((k) => k >= SF && k <= SF + frets).map((k) => (
            <SvgText
              key={`fn-${k}`}
              x={strXpx(0) - 8}
              y={dotYpx(k) + 4}
              fill={colors.mutedForeground}
              fontSize={10}
              fontWeight="600"
              textAnchor="end"
            >
              {k}
            </SvgText>
          ))}

          {/* Barre bar (shown when chord answer is revealed) */}
          {barre && (() => {
            const barreY = dotYpx(barre.fret);
            const x1 = strXpx(barre.fromCol);
            const x2 = strXpx(barre.toCol);
            return (
              <Rect
                x={x1 - DOT_R}
                y={barreY - DOT_R}
                width={x2 - x1 + DOT_R * 2}
                height={DOT_R * 2}
                rx={DOT_R}
                fill="rgba(90,55,18,0.90)"
              />
            );
          })()}

          {/* Note dots, open-string names, chord placement, flash feedback */}
          {Array.from({ length: N_STRINGS }, (_, col) =>
            Array.from({ length: frets + 1 }, (_, i) => {
              const fret = SF + i;
              const cx   = strXpx(col);
              const cy   = dotYpx(fret);
              const val  = getNoteValue(colToStrIdx(col), fret);
              const pc   = val % 12;
              const info = pcInfo[pc];
              const isRoot = rootPitch !== null && pc === rootPitch;
              const isTapped =
                (tapped?.col === col && tapped?.fret === fret) ||
                (lastTapped?.col === col && lastTapped?.fret === fret && mode === "tap-one");
              const flash  = flashFor(col, fret);
              const hl     = hlFor(col, fret);
              const inSel  = isSelected(col, fret);
              const chordFret     = mode === "chord-build" ? chordPlacement[col] : undefined;
              const isChordPlaced = chordFret === fret;
              const isChordMuted  = mode === "chord-build" && chordFret === null;

              const showDot =
                hl !== undefined ||
                inSel ||
                (mode === "chord-build" && isChordPlaced) ||
                (mode !== "chord-build" && (!!info || isTapped));

              let dotFill = isRoot ? ROOT_DOT : info ? SCALE_DOT : colors.secondary;
              if (inSel)  dotFill = isRoot ? ROOT_DOT : SCALE_DOT;
              if (hl)     dotFill = hl.colour;
              if (mode === "chord-build" && isChordPlaced) {
                dotFill = isRoot ? ROOT_DOT : info ? SCALE_DOT : colors.primary;
              }

              const darkText = !!info && !isRoot && !inSel && !hl;
              const dotLabel = hl?.label ?? (info ? info.note : getNoteName(val, useSharps));

              const hW = cellHalfW();
              const hH = cellHalfH(fret);

              return (
                <G key={`cell-${col}-${fret}`}>
                  {/* Flash feedback rectangle */}
                  {flash !== null && (
                    <Rect
                      x={cx - hW} y={cy - hH}
                      width={hW * 2} height={hH * 2}
                      fill={flash === "correct" ? FLASH_OK : FLASH_BAD}
                      rx={6}
                    />
                  )}

                  {/* Degree label above dot (scale/chord explorer via pcInfo) */}
                  {showDot && info && mode !== "chord-build" && (
                    <SvgText
                      x={cx} y={cy - DOT_R - 4}
                      fill={isRoot ? ROOT_DOT : SCALE_DOT}
                      fontSize={9} fontWeight="700" textAnchor="middle"
                    >
                      {info.degree}
                    </SvgText>
                  )}

                  {/* Note dot */}
                  {showDot && (() => {
                    const dr = DOT_R;
                    const fs = dotLabel.length > 2 ? 9 : dotLabel.length > 1 ? 11 : 13;
                    return (
                      <>
                        <Circle cx={cx} cy={cy} r={dr + 3} fill={dotFill} opacity={0.18} />
                        <Circle
                          cx={cx} cy={cy} r={dr}
                          fill={dotFill}
                          stroke={isTapped ? "#ffffff" : "rgba(0,0,0,0.4)"}
                          strokeWidth={isTapped ? 2 : 1}
                        />
                        <SvgText
                          x={cx} y={cy + fs * 0.38}
                          fill={darkText ? "#07121f" : "#ffffff"}
                          fontSize={fs}
                          fontWeight="700" textAnchor="middle"
                        >
                          {dotLabel}
                        </SvgText>
                      </>
                    );
                  })()}

                  {/* Open-string note name when notes are on (no dot) */}
                  {!showDot && fret === 0 && SF === 0 && mode !== "chord-build" && showOpenNames && (
                    <SvgText
                      x={cx} y={cy + 4}
                      fill={colors.mutedForeground}
                      fontSize={11} fontWeight="600" textAnchor="middle"
                    >
                      {getNoteName(val, useSharps)}
                    </SvgText>
                  )}

                  {/* Chord-build: muted-string × at open row */}
                  {mode === "chord-build" && fret === 0 && SF === 0 && isChordMuted && (
                    <SvgText
                      x={cx} y={cy + 5}
                      fill={colors.mutedForeground}
                      fontSize={16} fontWeight="700" textAnchor="middle"
                    >
                      ×
                    </SvgText>
                  )}
                </G>
              );
            })
          )}

          {/* String-name circles at bottom */}
          {Array.from({ length: N_STRINGS }, (_, col) => {
            const cx = strXpx(col);
            const cy = visH - BOTTOM_LBL_H / 2;
            return (
              <G key={`lbl-${col}`}>
                <Circle cx={cx} cy={cy} r={13} fill="#1a1530" stroke="#3a3060" strokeWidth={1} />
                <SvgText
                  x={cx} y={cy + 5}
                  fill="#c8a96a"
                  fontSize={11} fontWeight="700" textAnchor="middle"
                >
                  {STRING_NAMES[col]}
                </SvgText>
              </G>
            );
          })}
        </Svg>

        {/* Native Pressable overlay — one per cell */}
        {!readOnly && (
          <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
            {Array.from({ length: N_STRINGS }, (_, col) =>
              Array.from({ length: frets + 1 }, (_, i) => {
                const fret = SF + i;
                const cx = strXpx(col);
                const cy = dotYpx(fret);
                const hW = cellHalfW();
                const hH = cellHalfH(fret);
                return (
                  <Pressable
                    key={`hit-${col}-${fret}`}
                    style={{
                      position: "absolute",
                      left: cx - hW,
                      top: cy - hH,
                      width: hW * 2,
                      height: hH * 2,
                    }}
                    android_ripple={{ color: "transparent" }}
                    onPress={() => handleCellPress(col, fret)}
                  />
                );
              })
            )}
          </View>
        )}
      </View>

      {/* tap-many: Done button */}
      {mode === "tap-many" && !readOnly && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: colors.primary, borderRadius: 12, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={onSelectionConfirm}
          >
            <Text style={[styles.actionBtnText, { color: colors.primaryForeground }]}>
              Done  ({activeSel.length} selected)
            </Text>
          </Pressable>
        </View>
      )}

      {/* chord-build: Check chord button */}
      {mode === "chord-build" && !readOnly && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: chordHasFret ? colors.primary : colors.muted,
                borderRadius: 12,
                opacity: pressed && chordHasFret ? 0.8 : 1,
              },
            ]}
            disabled={!chordHasFret}
            onPress={() => chordHasFret && onChordSubmit?.(chordPlacement)}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: chordHasFret ? colors.primaryForeground : colors.mutedForeground },
              ]}
            >
              Check chord
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingHorizontal: 20 },
  actionRow: { width: "90%", paddingTop: 12, paddingHorizontal: 16 },
  actionBtn: { paddingVertical: 14, alignItems: "center" },
  actionBtnText: { fontSize: 16, fontFamily: "SpaceGrotesk_600SemiBold" },
});
