/**
 * LandscapeFretboard — wraps <PhotoFretboard> rotated −90° CCW so that:
 *   • strings run top-to-bottom  (high e at top, low E at bottom)
 *   • frets  run left-to-right   (nut on the left, higher frets to the right)
 *
 * Touch handling
 * ──────────────
 * React Native does NOT reliably inverse-map touch events through rotation
 * transforms on native (Expo Go / bare). All touches are intercepted on the
 * outer (unrotated) container and manually converted from landscape coordinates
 * to portrait fretboard cells using the photo fretboard's ET geometry.
 *
 * We use pageX/pageY (screen-absolute) and subtract the container's own
 * screen position — this avoids the known issue where locationX/locationY
 * in onResponderGrant are relative to the child element that was touched.
 *
 * When onTap is provided the inner <PhotoFretboard> is set readOnly so it
 * renders no Pressable overlays — all touch handling belongs to us.
 */
import React, { useRef } from "react";
import { GestureResponderEvent, View } from "react-native";

import {
  PhotoFretboard,
  type PhotoFretboardProps,
  BOTTOM_LBL_H,
  FB_LEFT_PCT,
  FB_RIGHT_PCT,
  FRET_WIRE_Y,
  N_STRINGS,
  PHOTO_H,
  PHOTO_W,
} from "@/components/photo-fretboard";

// ─── Props ────────────────────────────────────────────────────────────────────

export interface LandscapeFretboardProps
  extends Omit<PhotoFretboardProps, "nutWidth" | "bodyWidth" | "readOnly" | "displayWidth"> {
  /**
   * Height of the space available on screen for the rotated fretboard (px).
   * After −90° rotation the portrait width becomes the landscape height, so
   * DW is set to this value.
   */
  availableHeight: number;
}

// ─── ET coordinate helpers ────────────────────────────────────────────────────

/** Y position of fret wire k in portrait display units. */
function fretYpx(k: number, DH: number): number {
  return DH * (FRET_WIRE_Y[k] ?? 99) / 100;
}

/**
 * Given a touch position in LANDSCAPE coordinates (lx, ly) relative to the
 * outer container's top-left, return the fretboard cell (col, fret) in
 * portrait space, or null if the touch is outside the playable area.
 *
 * Coordinate mapping after −90° CCW rotation:
 *   portrait x  =  DW − ly
 *   portrait y  =  lx
 */
function findCell(
  lx: number,
  ly: number,
  DW: number,
  DH: number,
  frets: number,
): { col: number; fret: number } | null {
  // Portrait coordinates
  const px = DW - ly;
  const py = lx;

  // Reject touches beyond the last fret wire (with small slack)
  const maxY = fretYpx(frets, DH);
  if (py < 0 || py > maxY + 8) return null;

  // String X boundaries
  const leftX  = DW * FB_LEFT_PCT  / 100;
  const rightX = DW * FB_RIGHT_PCT / 100;
  const strGap = (rightX - leftX) / (N_STRINGS - 1);

  // Reject touches too far outside the string span
  if (px < leftX - strGap * 0.6 || px > rightX + strGap * 0.6) return null;

  // String column (round to nearest)
  const colRaw = (px - leftX) / strGap;
  const col = Math.max(0, Math.min(N_STRINGS - 1, Math.round(colRaw)));

  // Fret number from portrait y using ET positions
  let fret = 0;
  if (py >= fretYpx(0, DH)) {
    fret = frets; // default: last fret if past all wires
    for (let k = 1; k <= frets; k++) {
      if (py < fretYpx(k, DH)) {
        fret = k;
        break;
      }
    }
  }

  return { col, fret };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LandscapeFretboard({
  availableHeight,
  frets = 12,
  onTap,
  ...props
}: LandscapeFretboardProps) {
  // Portrait display width = available landscape height
  const DW   = availableHeight;
  const DH   = Math.round(DW * PHOTO_H / PHOTO_W);

  // Visible portrait height (matches PhotoFretboard's internal visH for ≤18 frets)
  const lastPct = FRET_WIRE_Y[Math.min(frets, 24)] ?? 97.2;
  const visH = frets <= 18
    ? Math.ceil(DH * lastPct / 100) + BOTTOM_LBL_H
    : DH + Math.ceil(DH * (FRET_WIRE_Y[24] - 100) / 100) + 16 + BOTTOM_LBL_H;

  // Outer container dimensions (landscape): width = portrait height, height = portrait width
  const portW = DW;   // portrait width  → landscape height
  const portH = visH; // portrait height → landscape width

  // Offset to centre the rotated element inside the outer container
  const top  = (portW - portH) / 2;
  const left = (portH - portW) / 2;

  // Track the container's screen position for reliable touch coordinate mapping
  const containerRef = useRef<View>(null);
  const originRef    = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const measureOrigin = () => {
    containerRef.current?.measure((_x, _y, _w, _h, pageX, pageY) => {
      originRef.current = { x: pageX, y: pageY };
    });
  };

  const handleTouch = (evt: GestureResponderEvent) => {
    if (!onTap) return;
    const { pageX, pageY } = evt.nativeEvent;
    const lx = pageX - originRef.current.x;
    const ly = pageY - originRef.current.y;
    const cell = findCell(lx, ly, DW, DH, frets);
    if (cell) onTap(cell.col, cell.fret);
  };

  return (
    // Outer container: reserves the visual footprint in the layout and handles touches.
    <View
      ref={containerRef}
      style={{ width: portH, height: portW, alignSelf: "center" }}
      onLayout={measureOrigin}
      onStartShouldSetResponder={() => !!onTap}
      onResponderGrant={handleTouch}
    >
      {/* Inner view: physically rotated −90° CCW */}
      <View
        style={{
          position: "absolute",
          width: portW,
          height: portH,
          top,
          left,
          transform: [{ rotate: "-90deg" }],
        }}
      >
        <PhotoFretboard
          {...props}
          frets={frets}
          displayWidth={DW}
          // Disable internal Pressables — touch is owned by the outer container
          readOnly={!!onTap}
          onTap={undefined}
        />
      </View>
    </View>
  );
}
