import React from "react";
import { Image, StyleSheet, View } from "react-native";
import Svg, { Circle, Ellipse, G, Line, Text as SvgText } from "react-native-svg";

export interface GameNeckHighlight {
  /** 0 = low E (bottom of screen), 5 = high e (top of screen) */
  string: number;
  /** 0 = open, 1–N = absolute fret number */
  fret: number;
  colour: string;
  label?: string;
}

export interface GameNeckProps {
  width: number;
  height: number;
  frets?: number;
  startFret?: number;
  highlightCells?: GameNeckHighlight[];
  /** col 0 = low E (bottom), col 5 = high e (top) */
  onTap?: (col: number, fret: number) => void;
  showOpenStrings?: boolean;
  /** Replace highlight dots with tiny alien head SVGs */
  alienMode?: boolean;
}

// ── Geometry constants ─────────────────────────────────────────────────────────

const OPEN_W    = 44;   // px left of nut for open-string strip
const V_PAD_TOP = 4;
const V_PAD_BOT = 22;
const TOP_FRAC  = 0.06; // high-e string fraction from top of image height
const BOT_FRAC  = 0.08; // low-E string fraction from bottom of image height

// Fret wire positions as a fraction of neck-game.png width.
//   Index 0  = nut right edge (empirically measured from the 2435×673 image).
//   Index 1–12 = fret wire positions (measured).
//   Index 13–24 = uniform repeat — x(n) = x(12) + (x(n−12) − x(0))
//   so frets 13–24 occupy the same visual width as frets 1–12.
//   This makes every fret cell the same tap-target size on screen.
const WIRE_FRACS = [
  // nut + frets 1–12 (measured)
  0.0419, 0.1068, 0.1885, 0.2694, 0.3515,
  0.4320, 0.5129, 0.5889, 0.6624, 0.7326,
  0.8029, 0.8682, 0.9351,
  // frets 13–24 (uniform repeat of lower octave)
  1.0000, 1.0817, 1.1626, 1.2447, 1.3252,
  1.4061, 1.4821, 1.5556, 1.6258, 1.6961,
  1.7614, 1.8283,
];

// ── Visual constants ───────────────────────────────────────────────────────────

const BG         = "#050816";
const STR_THICK  = [2.8, 2.4, 1.9, 1.5, 1.1, 0.8]; // col 0–5
const STR_TONE   = ["#c9a055","#c8a96a","#cbae80","#d8dde6","#e0e5ed","#e8ecf2"];
const DOT_R      = 11;
const INLAY_FRETS = new Set([3, 5, 7, 9, 12, 15, 17, 19, 21, 24]);
const NECK_IMG   = require("@/assets/images/neck-game.png");

// Fractions of the photo that define the lower octave (nut to fret 12)
const NUT_FRAC    = WIRE_FRACS[0];   // 0.0419
const FRET12_FRAC = WIRE_FRACS[12];  // 0.9351

// ── Component ─────────────────────────────────────────────────────────────────

export function GameNeck({
  width,
  height,
  frets           = 12,
  startFret       = 0,
  highlightCells  = [],
  onTap,
  showOpenStrings = false,
  alienMode       = false,
}: GameNeckProps) {

  const imgW      = width - OPEN_W;
  const imgH      = height - V_PAD_TOP - V_PAD_BOT;

  // When startFret=0 use sliceL=0 so the full nut bar is visible at the left
  // edge of the photo rather than being clipped by the mask.
  const sliceL    = startFret === 0 ? 0 : WIRE_FRACS[Math.min(startFret, WIRE_FRACS.length - 1)];
  const sliceR    = WIRE_FRACS[Math.min(startFret + frets, WIRE_FRACS.length - 1)];
  const sliceFrac = Math.max(0.001, sliceR - sliceL);
  const scaledW   = imgW / sliceFrac;
  const imgOffX   = -(sliceL * scaledW);

  // x position (in full display coords) of an absolute fret wire
  const wireX = (absN: number) =>
    OPEN_W + imgW * (
      WIRE_FRACS[Math.min(Math.max(absN, 0), WIRE_FRACS.length - 1)] - sliceL
    ) / sliceFrac;

  // x centre of the fret slot for relative slot index rel (1 = first visible slot)
  const slotCX = (rel: number) =>
    (wireX(startFret + rel - 1) + wireX(startFret + rel)) / 2;

  // String Y positions
  const neckY0 = V_PAD_TOP + imgH * TOP_FRAC;
  const neckY1 = V_PAD_TOP + imgH * (1 - BOT_FRAC);
  const strGap = (neckY1 - neckY0) / 5;
  const strY   = (col: number) => neckY1 - col * strGap;

  // ── Upper octave tile geometry ─────────────────────────────────────────────
  //
  // WIRE_FRACS[13–24] uses a uniform repeat of the lower-octave spacing, so
  // the upper octave occupies the same display width as the lower octave.
  // We tile neck-game.png a second time at the SAME scale as the main image
  // (tileScaledW = scaledW), positioning its nut at wireX(12).
  //
  const showUpperTile = startFret + frets > 12;
  const x12 = wireX(12);   // display x of fret 12 wire

  // Tile uses the same scale as the main photo
  const tileScaledW  = scaledW;
  // Left edge of the clipping view (never starts before the photo area)
  const tileClipLeft  = Math.max(OPEN_W, x12);
  const tileClipWidth = Math.max(0, (OPEN_W + imgW) - tileClipLeft);
  // Photo left offset within the clipping view:
  // we want  tileClipLeft + tileImgLeft + NUT_FRAC * tileScaledW = x12
  const tileImgLeft   = x12 - tileClipLeft - NUT_FRAC * tileScaledW;

  // Tap coordinate → (col, fret)
  function tapFromCoords(lx: number, ly: number) {
    let tapFret: number;
    if (lx < OPEN_W) {
      if (!showOpenStrings) return;
      tapFret = 0;
    } else {
      const norm = Math.max(0, Math.min(1, (lx - OPEN_W) / imgW));
      const frac = sliceL + norm * sliceFrac;
      let found  = WIRE_FRACS.length - 1;
      for (let k = 1; k < WIRE_FRACS.length; k++) {
        if (frac < WIRE_FRACS[k]) { found = k; break; }
      }
      tapFret = found;
      if (tapFret < startFret + 1 || tapFret > startFret + frets) return;
    }
    if (ly < neckY0 - strGap * 0.5 || ly > neckY1 + strGap * 0.5) return;
    const col = Math.round(Math.max(0, Math.min(5, (neckY1 - ly) / strGap)));
    onTap?.(col, tapFret);
  }

  return (
    <View style={[styles.root, { width, height }]}>

      {/* ── Layer 1a: lower-octave neck photo ─────────────────────────────────
          The photo is shown whenever startFret is in the lower octave.
          sliceL=0 for startFret=0 ensures the nut bar is fully visible at
          the left edge of the photo area (not clipped by the open-string mask). */}
      <View style={{
        position: "absolute", left: OPEN_W, top: V_PAD_TOP,
        width: imgW, height: imgH, overflow: "hidden",
        backgroundColor: BG,
        borderTopRightRadius: 5, borderBottomRightRadius: 5,
      }}>
        {startFret < 12 && (
          <Image
            source={NECK_IMG}
            style={{ position: "absolute", left: imgOffX, top: 0, width: scaledW, height: imgH }}
            resizeMode="stretch"
          />
        )}
      </View>

      {/* ── Layer 1b: upper-octave tile (same photo at half scale) ────────────
          Placed over the upper-octave region starting from wireX(12).  Clipped
          so it never overlaps the open-string strip or spills past the right
          edge.  The photo's nut aligns with fret 12 and its fret-12 aligns
          with fret 24, matching the guitar self-similarity law. */}
      {showUpperTile && tileClipWidth > 0 && (
        <View style={{
          position: "absolute",
          left: tileClipLeft,
          top: V_PAD_TOP,
          width: tileClipWidth,
          height: imgH,
          overflow: "hidden",
        }}>
          <Image
            source={NECK_IMG}
            style={{
              position: "absolute",
              left: tileImgLeft,
              top: 0,
              width: tileScaledW,
              height: imgH,
            }}
            resizeMode="stretch"
          />
        </View>
      )}

      {/* ── Layer 2: masking strips (hide image outside string area) ── */}
      <View style={{ position:"absolute", left:OPEN_W, top:V_PAD_TOP,
        width:imgW, height:Math.max(0, neckY0 - V_PAD_TOP), backgroundColor:BG }} />
      <View style={{ position:"absolute", left:OPEN_W, top:neckY1,
        width:imgW, height:Math.max(0, V_PAD_TOP + imgH - neckY1), backgroundColor:BG }} />
      <View style={{ position:"absolute", left:0, top:V_PAD_TOP,
        width:OPEN_W, height:imgH, backgroundColor:BG }} />

      {/* ── Layer 3: SVG — strings, fret labels, highlight dots ───────────────
          Upper-octave fret wires are now provided by the tiled photo; only
          strings, position labels, and highlight markers are drawn here. ── */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { pointerEvents:"none" }]}>
        <Svg width={width} height={height} style={StyleSheet.absoluteFill}>

          {/* Strings */}
          {([0,1,2,3,4,5] as const).map((col) => (
            <Line key={col}
              x1={0} y1={strY(col)} x2={width} y2={strY(col)}
              stroke={STR_TONE[col]} strokeWidth={STR_THICK[col]} />
          ))}

          {/* Fret number labels at inlay positions */}
          {Array.from({ length: frets }, (_, i) => i + 1).map((f) => {
            const abs = startFret + f;
            if (!INLAY_FRETS.has(abs)) return null;
            return (
              <SvgText key={f} x={slotCX(f)} y={neckY0 - 4}
                textAnchor="middle" fill="#8aa4c0" fontSize={11}
                fontFamily="Inter_600SemiBold">
                {abs}
              </SvgText>
            );
          })}

          {/* Open-string divider */}
          {showOpenStrings && (
            <Line x1={OPEN_W} y1={neckY0} x2={OPEN_W} y2={neckY1}
              stroke="#ffffff22" strokeWidth={1} />
          )}

          {/* Highlight dots / alien heads */}
          {highlightCells.map((h, i) => {
            const rel = h.fret - startFret;
            if (h.fret === 0 && !showOpenStrings) return null;
            if (h.fret > 0 && (rel < 1 || rel > frets)) return null;
            const cx = h.fret === 0 ? OPEN_W / 2 : slotCX(rel);
            const cy = strY(h.string);

            if (alienMode) {
              return (
                <G key={i} transform={`translate(${cx},${cy})`}>
                  {/* shadow */}
                  <Ellipse rx={14} ry={16} fill="#00000070" />
                  {/* head */}
                  <Ellipse rx={11} ry={13} fill={h.colour} />
                  {/* highlight shimmer */}
                  <Ellipse cx={-2} cy={-5} rx={4} ry={3} fill="rgba(255,255,255,0.25)" />
                  {/* left antenna stem + tip */}
                  <Line x1={-4} y1={-12} x2={-6} y2={-18} stroke={h.colour} strokeWidth={1.5} />
                  <Circle cx={-6} cy={-19} r={2.5} fill="#ffffff" />
                  {/* right antenna stem + tip */}
                  <Line x1={4} y1={-12} x2={6} y2={-18} stroke={h.colour} strokeWidth={1.5} />
                  <Circle cx={6} cy={-19} r={2.5} fill="#ffffff" />
                  {/* left eye white */}
                  <Ellipse cx={-3.5} cy={-2} rx={3.5} ry={3} fill="white" />
                  {/* right eye white */}
                  <Ellipse cx={3.5} cy={-2} rx={3.5} ry={3} fill="white" />
                  {/* left pupil */}
                  <Circle cx={-3.5} cy={-1.5} r={1.8} fill="#000" />
                  {/* right pupil */}
                  <Circle cx={3.5} cy={-1.5} r={1.8} fill="#000" />
                  {/* mouth — thin arc suggested by two short lines */}
                  <Line x1={-3} y1={5} x2={0} y2={6.5} stroke="#00000060" strokeWidth={1.2} />
                  <Line x1={0} y1={6.5} x2={3} y2={5} stroke="#00000060" strokeWidth={1.2} />
                </G>
              );
            }

            const fs = h.label
              ? (h.label.length > 2 ? 8 : h.label.length > 1 ? 10 : 12)
              : 12;
            return (
              <G key={i}>
                <Circle cx={cx} cy={cy} r={DOT_R + 3} fill="#00000060" />
                <Circle cx={cx} cy={cy} r={DOT_R}     fill={h.colour}  />
                {h.label && (
                  <SvgText x={cx} y={cy + fs * 0.38} textAnchor="middle"
                    fill="#fff" fontSize={fs} fontWeight="700">
                    {h.label}
                  </SvgText>
                )}
              </G>
            );
          })}

        </Svg>
      </View>

      {/* ── Layer 4: touch capture ─────────────────────────────────────────────
          Plain View with no SVG children, rendered LAST so Android's native
          touch dispatch hits this first before any react-native-svg views. ── */}
      {onTap && (
        <View
          style={StyleSheet.absoluteFill}
          onStartShouldSetResponder={() => true}
          onResponderGrant={(e) =>
            tapFromCoords(e.nativeEvent.locationX, e.nativeEvent.locationY)
          }
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: BG },
});
