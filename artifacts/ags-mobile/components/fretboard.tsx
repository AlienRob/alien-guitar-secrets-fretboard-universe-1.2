import React, { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Line,
  LinearGradient,
  Path,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { useColors } from "@/hooks/useColors";
import { getNoteName, getNoteValue, STRINGS } from "@/lib/musicTheory";

// ─── Public types ──────────────────────────────────────────────────────────────

export interface PcInfo {
  note: string;
  degree: string;
}

export type FretboardMode = "display" | "tap-one" | "tap-many" | "chord-build";
export type TapResult = "correct" | "wrong" | null;

export interface HighlightCell {
  string: number;
  fret: number;
  colour: string;
  label?: string;
}

export interface BarreIndicator {
  fret: number;
  fromCol: number;
  toCol: number;
}

export interface FretboardProps {
  // ── Core display ──
  pcInfo: Record<number, PcInfo>;
  rootPitch: number | null;
  useSharps: boolean;
  frets?: number;

  // ── Legacy display-mode tap (kept for drop-in compatibility) ──
  tapped?: { col: number; fret: number } | null;
  onTap?: (col: number, fret: number) => void;

  // ── When false, hides open-string note names (blank neck until notes are turned on) ──
  showOpenNames?: boolean;

  // ── Interaction mode ──
  mode?: FretboardMode;
  readOnly?: boolean;

  // ── tap-one ──
  tapResult?: TapResult;

  // ── tap-many ──
  selection?: Array<{ col: number; fret: number }>;
  onSelectionChange?: (sel: Array<{ col: number; fret: number }>) => void;
  onSelectionConfirm?: () => void;

  // ── chord-build ──
  // placement[col] = fret (0=open) or null (muted)
  onChordSubmit?: (placement: Array<number | null>) => void;

  // ── Lesson animator ──
  highlightCells?: HighlightCell[];

  // ── Barre indicator (shown in display mode over revealed chord answers) ──
  barre?: BarreIndicator;

  // ── Taper controls ──
  nutWidth?: number;
  bodyWidth?: number;
}

// ─── Geometry constants ────────────────────────────────────────────────────────

const LABEL_H = 24;             // space above the open row for string-name labels
const OPEN_ROW = 46;            // gap between top and nut (open-string indicators)
const NUT_H = 9;
const GUTTER = 24;
const NECK_INSET = 20;
const EDGE = 8;
const DOT_R = 13;

// Straight neck — equal nut and body widths
const DEFAULT_NUT_WIDTH = 150;
const DEFAULT_BODY_WIDTH = 150;

// Strings left-to-right: low E (col 0) … high e (col 5). STRINGS is high-E-first.
const COLS = [...STRINGS].reverse();

// Open-string note names for the bottom label row (low E → high e)
const OPEN_NOTE_NAMES = ["E", "A", "D", "G", "B", "E"];

// String visual weights: thick wound bass → thin plain treble (left → right)
const STRING_WIDTH = [3.8, 3.2, 2.6, 2.0, 1.5, 1.0];
const STRING_TONE = ["#c9a055", "#c8a96a", "#cbae80", "#d8dde6", "#e0e5ed", "#e8ecf2"];

// Note dot colours: root = red, non-root scale/chord note = blue.
const ROOT_DOT = "#ff3b3b";
const SCALE_DOT = "#3b8aff";

// Hardware colours
const WOOD_IMG = require("@/assets/images/neck-photo.png");
const WOOD_EDGE = "#0d0a05";
const FRET_METAL = "#b8bcc8";    // nickel silver
const FRET_SHADE = "#404048";    // dark silver shadow
const NUT_BONE = "#f0eada";
const INLAY = "#ffffff";         // bright white dots
const INLAY_R = 7;               // larger dot radius
const BOTTOM_LABEL_H = 40;       // space below fretboard for string-name circles

// Feedback colours
const FLASH_CORRECT = "#00e66680";
const FLASH_WRONG = "#ff3b3080";
const SELECTED_DOT = "#a855f7";

// ─── Linear fret-Y helper (equidistant frets) ─────────────────────────────────
function etFactor(fret: number, totalFrets: number): number {
  if (fret === 0) return 0;
  return fret / totalFrets;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Fretboard({
  pcInfo,
  rootPitch,
  useSharps,
  frets = 12,
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
  nutWidth = DEFAULT_NUT_WIDTH,
  bodyWidth = DEFAULT_BODY_WIDTH,
}: FretboardProps) {
  const colors = useColors();

  // ── Internal state ──────────────────────────────────────────────────────────

  // tap-one: track the last cell tapped so we can show the flash on it
  const [lastTapped, setLastTapped] = useState<{ col: number; fret: number } | null>(null);

  // tap-many: internal selection (merged with controlled `selection` prop)
  const [internalSel, setInternalSel] = useState<Array<{ col: number; fret: number }>>([]);
  const activeSel = selection ?? internalSel;

  // chord-build: per-string fret placement (null = muted)
  const [chordPlacement, setChordPlacement] = useState<Array<number | null>>(
    Array(COLS.length).fill(null),
  );

  // Reset chord placement when mode changes to chord-build
  const prevMode = useRef(mode);
  useEffect(() => {
    if (mode === "chord-build" && prevMode.current !== "chord-build") {
      setChordPlacement(Array(COLS.length).fill(null));
    }
    prevMode.current = mode;
  }, [mode]);

  // Reset internal selection when the controlled prop clears
  useEffect(() => {
    if (selection && selection.length === 0) setInternalSel([]);
  }, [selection]);

  // ── Geometry ────────────────────────────────────────────────────────────────

  const nutSpan = nutWidth;
  const bodySpan = bodyWidth;

  // The SVG needs to be wide enough to fit the nut (widest end)
  const neckLeft = GUTTER;
  const neckNutW = NECK_INSET * 2 + nutSpan;
  const neckBodyW = NECK_INSET * 2 + bodySpan;
  const svgWidth = neckLeft + neckNutW + EDGE;

  // Center X never moves (neck tapers symmetrically)
  const centerX = neckLeft + NECK_INSET + nutSpan / 2;

  // String span and per-column X at vertical fraction t (0 = nut, 1 = bottom)
  const spanAt = (t: number) => nutSpan + (bodySpan - nutSpan) * t;
  const gapAt = (t: number) => spanAt(t) / (COLS.length - 1);
  const colX = (col: number, t: number) =>
    centerX + (col - (COLS.length - 1) / 2) * gapAt(t);

  // Neck left/right edge at fraction t
  const neckLeftAt = (t: number) => centerX - spanAt(t) / 2 - NECK_INSET;
  const neckRightAt = (t: number) => centerX + spanAt(t) / 2 + NECK_INSET;

  // Vertical positions — fretboard wood starts below label row + open row
  const woodTop = LABEL_H + OPEN_ROW;
  const firstFretY = woodTop + NUT_H;
  const fretAreaH = frets * 34; // total pixel height of fretted area
  const woodBottom = firstFretY + fretAreaH + 10;
  const svgHeight = woodBottom + 10 + BOTTOM_LABEL_H;

  const fretLineY = (f: number) => firstFretY + etFactor(f, frets) * fretAreaH;
  const fretCenterY = (f: number) => {
    if (f === 0) return woodTop - OPEN_ROW / 2;
    return (fretLineY(f - 1) + fretLineY(f)) / 2;
  };
  // Vertical fraction (0–1) for a given pixel y within the fretted area
  const yToT = (y: number) => Math.max(0, Math.min(1, (y - firstFretY) / fretAreaH));

  // Hit-area half-sizes for cells
  const cellHalfH = (f: number) => {
    if (f === 0) return OPEN_ROW / 2;
    return (fretLineY(f) - fretLineY(f - 1)) / 2;
  };
  const cellHalfW = (col: number, t: number) => gapAt(t) / 2;

  // Inlays
  const singleInlays = [3, 5, 7, 9].filter((f) => f <= frets);
  const hasDouble12 = frets >= 12;

  // Trapezoid path points (clockwise, nut at top)
  const nutL = neckLeftAt(0);
  const nutR = neckRightAt(0);
  const bodyL = neckLeftAt(1);
  const bodyR = neckRightAt(1);
  const trapezoidPath = `M ${nutL} ${woodTop} L ${nutR} ${woodTop} L ${bodyR} ${woodBottom} L ${bodyL} ${woodBottom} Z`;

  // Rounded nut outline path (just a rect at the top)
  const nutPath = `M ${nutL} ${woodTop} L ${nutR} ${woodTop} L ${nutR} ${woodTop + NUT_H} L ${nutL} ${woodTop + NUT_H} Z`;

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleCellPress = useCallback(
    (col: number, fret: number) => {
      if (readOnly) return;

      if (mode === "display" || mode === "tap-one") {
        setLastTapped({ col, fret });
        onTap?.(col, fret);
        return;
      }

      if (mode === "tap-many") {
        const exists = activeSel.some((c) => c.col === col && c.fret === fret);
        const next = exists
          ? activeSel.filter((c) => !(c.col === col && c.fret === fret))
          : [...activeSel, { col, fret }];
        setInternalSel(next);
        onSelectionChange?.(next);
        return;
      }

      if (mode === "chord-build") {
        const next = [...chordPlacement];
        // Tap occupied fret → remove (mute); tap empty/different → place
        if (next[col] === fret) {
          next[col] = null;
        } else {
          next[col] = fret;
        }
        setChordPlacement(next);
        return;
      }
    },
    [readOnly, mode, activeSel, onTap, onSelectionChange, chordPlacement],
  );

  const handleChordCheck = useCallback(() => {
    onChordSubmit?.(chordPlacement);
  }, [onChordSubmit, chordPlacement]);

  // ── Cell helpers ────────────────────────────────────────────────────────────

  const isSelected = (col: number, fret: number) =>
    activeSel.some((c) => c.col === col && c.fret === fret);

  const highlightFor = (col: number, fret: number): HighlightCell | undefined =>
    highlightCells.find((h) => h.string === col && h.fret === fret);

  const isFlashed = (col: number, fret: number): TapResult => {
    if (mode !== "tap-one" || tapResult === null) return null;
    if (lastTapped?.col === col && lastTapped?.fret === fret) return tapResult;
    return null;
  };

  const chordHasFret = chordPlacement.some((f) => f !== null);

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <View style={styles.wrap}>
      {/* Fixed-size container so the native Pressable overlay sits exactly over the SVG */}
      <View style={{ width: svgWidth, height: svgHeight }}>
      <Svg width={svgWidth} height={svgHeight}>
        <Defs>
          <ClipPath id="neckClip">
            <Path d={trapezoidPath} />
          </ClipPath>
          <LinearGradient id="headGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#2A1206" />
            <Stop offset="100%" stopColor="#0E0602" />
          </LinearGradient>
        </Defs>

        {/* ── Headstock stub (dark plate behind strings, above nut) ── */}
        {/* Rounded top corners only — flat bottom flush with the nut */}
        <Path
          d={`M ${nutL + 8} 0 L ${nutR - 8} 0 Q ${nutR} 0 ${nutR} 8 L ${nutR} ${woodTop} L ${nutL} ${woodTop} L ${nutL} 8 Q ${nutL} 0 ${nutL + 8} 0 Z`}
          fill="url(#headGrad)"
        />
        <Path
          d={`M ${nutL + 8} 0 L ${nutR - 8} 0 Q ${nutR} 0 ${nutR} 8 L ${nutR} ${woodTop} L ${nutL} ${woodTop} L ${nutL} 8 Q ${nutL} 0 ${nutL + 8} 0 Z`}
          fill="none"
          stroke="#3A1A08"
          strokeWidth={1}
          opacity={0.7}
        />

        {/* No labels at top — string names appear below the neck */}

        {/* ── Fingerboard wood photo ── */}
        <G clipPath="url(#neckClip)">
          {/* Direct placement — landscape photo cropped to fill portrait neck area */}
          <SvgImage
            href={WOOD_IMG}
            x={nutL}
            y={woodTop}
            width={neckNutW}
            height={woodBottom - woodTop}
            preserveAspectRatio="xMidYMid slice"
          />
          {/* Depth darkening overlay */}
          <Path d={trapezoidPath} fill="#050816" opacity={0.40} />
        </G>

        {/* Neck board outline (trapezoid) */}
        <Path d={trapezoidPath} fill="none" stroke={WOOD_EDGE} strokeWidth={2.5} />

        {/* ── Position-marker inlays (under strings) ── */}
        {singleInlays.map((f) => (
          <Circle
            key={`inlay-${f}`}
            cx={centerX}
            cy={fretCenterY(f)}
            r={INLAY_R}
            fill={INLAY}
            opacity={0.85}
          />
        ))}
        {hasDouble12 && (
          <>
            <Circle
              cx={centerX - gapAt(yToT(fretCenterY(12))) * 1.5}
              cy={fretCenterY(12)}
              r={INLAY_R}
              fill={INLAY}
              opacity={0.85}
            />
            <Circle
              cx={centerX + gapAt(yToT(fretCenterY(12))) * 1.5}
              cy={fretCenterY(12)}
              r={INLAY_R}
              fill={INLAY}
              opacity={0.85}
            />
          </>
        )}

        {/* ── Bone nut ── */}
        <Path d={nutPath} fill={NUT_BONE} />
        {/* Nut highlight */}
        <Line
          x1={nutL + 2}
          y1={woodTop + 1}
          x2={nutR - 2}
          y2={woodTop + 1}
          stroke="#ffffff"
          strokeWidth={1.2}
          opacity={0.5}
        />

        {/* ── Fret wires (tapered positions) ── */}
        {Array.from({ length: frets }, (_, i) => {
          const f = i + 1;
          const y = fretLineY(f);
          const t = yToT(y);
          const lx = neckLeftAt(t) + 5;
          const rx = neckRightAt(t) - 5;
          return (
            <G key={`fret-${f}`}>
              {/* Shadow */}
              <Line x1={lx} y1={y + 1.5} x2={rx} y2={y + 1.5} stroke={FRET_SHADE} strokeWidth={3.5} />
              {/* Metal highlight */}
              <Line x1={lx} y1={y} x2={rx} y2={y} stroke={FRET_METAL} strokeWidth={2.8} />
              {/* Top gleam */}
              <Line x1={lx} y1={y - 0.5} x2={rx} y2={y - 0.5} stroke="#f0f4ff" strokeWidth={0.8} opacity={0.55} />
            </G>
          );
        })}

        {/* ── Strings — straight from top of open row to bottom ── */}
        {COLS.map((_, col) => {
          const x = colX(col, 0); // straight: nutWidth === bodyWidth so x is constant
          return (
            <G key={`string-${col}`}>
              {/* Shadow strand */}
              <Line
                x1={x + STRING_WIDTH[col] * 0.3}
                y1={LABEL_H}
                x2={x + STRING_WIDTH[col] * 0.3}
                y2={woodBottom - 2}
                stroke="#000000"
                strokeWidth={STRING_WIDTH[col] * 0.6}
                opacity={0.4}
              />
              {/* Main string */}
              <Line
                x1={x}
                y1={LABEL_H}
                x2={x}
                y2={woodBottom - 2}
                stroke={STRING_TONE[col]}
                strokeWidth={STRING_WIDTH[col]}
                opacity={0.92}
              />
              {/* Top highlight */}
              <Line
                x1={x - STRING_WIDTH[col] * 0.25}
                y1={LABEL_H}
                x2={x - STRING_WIDTH[col] * 0.25}
                y2={woodBottom - 2}
                stroke="#ffffff"
                strokeWidth={STRING_WIDTH[col] * 0.3}
                opacity={0.35}
              />
            </G>
          );
        })}

        {/* ── Fret numbers (left gutter) ── */}
        {Array.from({ length: frets }, (_, i) => {
          const f = i + 1;
          return (
            <SvgText
              key={`num-${f}`}
              x={GUTTER / 2 - 1}
              y={fretCenterY(f) + 4}
              fill={colors.mutedForeground}
              fontSize={11}
              textAnchor="middle"
            >
              {f}
            </SvgText>
          );
        })}

        {/* ── Barre bar (shown when chord answer is revealed) ── */}
        {barre && (() => {
          const barreY = fretCenterY(barre.fret);
          const t = yToT(barreY);
          const x1 = colX(barre.fromCol, t);
          const x2 = colX(barre.toCol, t);
          return (
            <Rect
              key="barre-bar"
              x={x1 - DOT_R}
              y={barreY - DOT_R}
              width={x2 - x1 + DOT_R * 2}
              height={DOT_R * 2}
              rx={DOT_R}
              fill="rgba(90, 55, 18, 0.90)"
            />
          );
        })()}

        {/* ── Note dots, open-string labels, hit areas ── */}
        {COLS.map((s, col) =>
          Array.from({ length: frets + 1 }, (_, fret) => {
            const cy = fretCenterY(fret);
            const t = fret === 0 ? 0 : yToT(cy);
            const x = colX(col, t);

            const val = getNoteValue(STRINGS.indexOf(s), fret);
            const pc = val % 12;
            const info = pcInfo[pc];
            const isRoot = rootPitch !== null && pc === rootPitch;
            const isTapped =
              (tapped?.col === col && tapped?.fret === fret) ||
              (lastTapped?.col === col && lastTapped?.fret === fret && mode === "tap-one");
            const isOpen = fret === 0;
            const flash = isFlashed(col, fret);
            const hl = highlightFor(col, fret);
            const inSel = isSelected(col, fret);
            const chordFret = mode === "chord-build" ? chordPlacement[col] : undefined;
            const isChordPlaced = chordFret === fret;
            const isChordMuted = mode === "chord-build" && chordFret === null;

            // In chord-build mode, only show note dots for placed fingers
            const showDot =
              hl !== undefined ||
              inSel ||
              (mode === "chord-build" && isChordPlaced) ||
              (mode !== "chord-build" && (!!info || isTapped));

            let dotFill = isRoot ? ROOT_DOT : info ? SCALE_DOT : colors.secondary;
            if (inSel) dotFill = SELECTED_DOT;
            if (hl) dotFill = hl.colour;
            if (mode === "chord-build" && isChordPlaced) {
              dotFill = isRoot ? ROOT_DOT : info ? SCALE_DOT : colors.primary;
            }

            const darkText = !!info && !isRoot && !inSel && !hl;
            const noteLabel = info ? info.note : getNoteName(val, useSharps);
            const displayLabel = hl?.label ?? (inSel ? noteLabel : noteLabel);
            const dotLabel = hl?.label ?? (info ? info.note : getNoteName(val, useSharps));

            const hW = cellHalfW(col, t);
            const hH = cellHalfH(fret);

            return (
              <G key={`cell-${col}-${fret}`}>
                {/* Flash overlay (tap-one feedback) */}
                {flash !== null && (
                  <Rect
                    x={x - hW}
                    y={cy - hH}
                    width={hW * 2}
                    height={hH * 2}
                    fill={flash === "correct" ? FLASH_CORRECT : FLASH_WRONG}
                    rx={6}
                  />
                )}

                {/* Degree label above dot */}
                {showDot && info && mode !== "chord-build" && (
                  <SvgText
                    x={x}
                    y={cy - DOT_R - 5}
                    fill={isRoot ? ROOT_DOT : SCALE_DOT}
                    fontSize={10}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    {info.degree}
                  </SvgText>
                )}

                {/* Note dot */}
                {showDot && (
                  <>
                    {/* Glow ring */}
                    <Circle cx={x} cy={cy} r={DOT_R + 3} fill={dotFill} opacity={0.18} />
                    <Circle
                      cx={x}
                      cy={cy}
                      r={DOT_R}
                      fill={dotFill}
                      stroke={isTapped ? colors.foreground : "rgba(0,0,0,0.4)"}
                      strokeWidth={isTapped ? 2.5 : 1}
                    />
                    <SvgText
                      x={x}
                      y={cy + 4}
                      fill={darkText ? "#07121f" : "#ffffff"}
                      fontSize={dotLabel.length > 2 ? 10 : dotLabel.length > 1 ? 11 : 12}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {dotLabel}
                    </SvgText>
                  </>
                )}

                {/* Open-string note name (no dot, display mode) */}
                {!showDot && isOpen && mode !== "chord-build" && showOpenNames && (
                  <SvgText
                    x={x}
                    y={cy + 4}
                    fill={colors.mutedForeground}
                    fontSize={12}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {getNoteName(val, useSharps)}
                  </SvgText>
                )}

                {/* Chord-build: muted-string X at nut row */}
                {mode === "chord-build" && isOpen && isChordMuted && (
                  <SvgText
                    x={x}
                    y={cy + 5}
                    fill={colors.mutedForeground}
                    fontSize={16}
                    fontWeight="700"
                    textAnchor="middle"
                  >
                    ×
                  </SvgText>
                )}

                {/* Hit area is handled by native Pressable overlay below */}
              </G>
            );
          }),
        )}

        {/* ── String-name circles — E A D G B E — below the fretboard ── */}
        {OPEN_NOTE_NAMES.map((name, col) => {
          const cx = colX(col, 0);
          const cy = woodBottom + 20;
          return (
            <G key={`snlabel-${col}`}>
              <Circle cx={cx} cy={cy} r={13} fill="#1a1530" stroke="#3a3060" strokeWidth={1} />
              <SvgText
                x={cx}
                y={cy + 5}
                fill="#c8a96a"
                fontSize={11}
                fontWeight="700"
                textAnchor="middle"
              >
                {name}
              </SvgText>
            </G>
          );
        })}
      </Svg>

        {/* ── Native Pressable overlay — covers every cell, works on device ── */}
        {!readOnly && (
          <View style={[StyleSheet.absoluteFill, { pointerEvents: "box-none" }]}>
            {COLS.map((s, col) =>
              Array.from({ length: frets + 1 }, (_, fret) => {
                const cy = fretCenterY(fret);
                const t = fret === 0 ? 0 : yToT(cy);
                const x = colX(col, t);
                const hW = cellHalfW(col, t);
                const hH = cellHalfH(fret);
                return (
                  <Pressable
                    key={`hit-${col}-${fret}`}
                    style={{
                      position: "absolute",
                      left: x - hW,
                      top: cy - hH,
                      width: hW * 2,
                      height: hH * 2,
                    }}
                    android_ripple={{ color: "transparent" }}
                    onPressIn={() => handleCellPress(col, fret)}
                  />
                );
              })
            )}
          </View>
        )}
      </View>

      {/* ── tap-many: Done button ── */}
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

      {/* ── chord-build: Check button ── */}
      {mode === "chord-build" && !readOnly && (
        <View style={styles.actionRow}>
          <Pressable
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: chordHasFret ? colors.primary : colors.muted,
                borderRadius: 12,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
            disabled={!chordHasFret}
            onPress={handleChordCheck}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: { alignItems: "center", paddingVertical: 4 },
  actionRow: { marginTop: 14, width: "100%", paddingHorizontal: 20 },
  actionBtn: { paddingVertical: 13, alignItems: "center" },
  actionBtnText: { fontSize: 15, fontFamily: "SpaceGrotesk_700Bold" },
});
