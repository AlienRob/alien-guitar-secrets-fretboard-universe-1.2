/**
 * Mockup: Portrait fretboard for the mobile fretboard explorer tab.
 * Image: 474×1020 (transparent bg), nut at top, 18 frets shown.
 * SVG-drawn extension adds frets 19–24 below the transparent PNG.
 * Unified SVG overlay: strings, inlays (<image>), string label circles.
 */
import fretboardImg from "./fretboard_v.png";
import fretTile from "./fretboard_fret_tile.png";
import alienInlay from "./alien_inlay.png";

const BG = "#050816";

// ── Image natural size ─────────────────────────────────────────────────────
const IMG_W = 474;
const IMG_H = 1020;

// ── Display dimensions ─────────────────────────────────────────────────────
const DISPLAY_W = 260;
const DISPLAY_H = Math.round(DISPLAY_W * (IMG_H / IMG_W)); // ~568

// ── Neck extension constants (SVG-drawn section below the photo) ───────────
// All positions in display px (260px wide), measured from alpha/colour scan of source image.
const NECK_L        = 74;        // outer left edge of neck (first opaque pixel)
const NECK_R        = 188;       // outer right edge of neck (last opaque pixel)
const BINDING_L     = 79;        // left cream binding strip x
const BINDING_R     = 185;       // right cream binding strip x
const BINDING_W     = 2;         // binding strip width — very thin, matches photo
const WOOD_COLOR    = "#1A0E06"; // sampled from photo centre column
const BINDING_COLOR = "#E0DDD8"; // cream, averaged from #EAE9E4 / #DCD7CB scans
const WIRE_COLOR    = "#B6B2AB"; // sampled from fret wire positions

// ── Fretboard string lane boundaries (as % of display width) ──────────────
const FB_LEFT  = 33; // %
const FB_RIGHT = 67; // %

// ── 6 strings ─────────────────────────────────────────────────────────────
const N_STRINGS   = 6;
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];
function strX(i: number) {
  return FB_LEFT + (FB_RIGHT - FB_LEFT) * (i / (N_STRINGS - 1));
}
function strXpx(i: number) { return DISPLAY_W * strX(i) / 100; }

const STROKE_W = [3.0, 2.4, 2.0, 1.5, 1.0, 0.7]; // low-E → high-e
function strColor(i: number) {
  return i < 3 ? "rgba(210,175,110,0.92)" : "rgba(215,215,225,0.88)";
}

// ── Fret wire y positions as % of DISPLAY_H ───────────────────────────────
// Frets 0–18: measured from photo brightness scan (px / 1020 * 100).
// Frets 19–24: extrapolated via equal-temperament ratio (×0.9439 per fret).
const FRET_WIRE_Y: Record<number, number> = {
   0:   5.8,  // nut bottom
   1:  10.5,
   2:  16.5,
   3:  22.4,
   4:  28.3,
   5:  34.1,
   6:  40.0,
   7:  45.6,
   8:  50.9,
   9:  56.0,
  10:  61.1,
  11:  65.9,
  12:  70.7,
  13:  75.7,
  14:  80.5,
  15:  85.1,
  16:  89.3,
  17:  93.5,
  18:  97.2,
  // Extended — values >100 land below the photo in the SVG extension
  19: 100.7,
  20: 104.0,
  21: 107.1,
  22: 110.0,
  23: 112.8,
  24: 115.4,
};

// Pixel helpers (all relative to DISPLAY_H scale)
function fretYpx(k: number): number {
  return DISPLAY_H * (FRET_WIRE_Y[k] ?? 99) / 100;
}
function dotYpx(k: number): number {
  const y0 = FRET_WIRE_Y[k - 1] ?? 0;
  const y1 = FRET_WIRE_Y[k] ?? 99;
  return DISPLAY_H * (y0 + y1) / 2 / 100;
}

// ── Total height: photo + SVG extension ───────────────────────────────────
const EXTRA_H = Math.ceil(DISPLAY_H * (115.4 - 100) / 100) + 18; // ~106px
const TOTAL_H = DISPLAY_H + EXTRA_H;

// ── Dot and label positions ────────────────────────────────────────────────
const FRET_LABELS = [1, 3, 5, 7, 9, 12, 15, 17, 19, 21, 24];
const SINGLE_DOTS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_DOTS = [12, 24];
const EXT_FRETS   = [19, 20, 21, 22, 23, 24];

export default function VerticalFretboard() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: BG,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: 32,
        paddingBottom: 48,
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ color: "#a78bfa", fontSize: 10, letterSpacing: 3, marginBottom: 3, fontWeight: 700 }}>
        FRETBOARD EXPLORER
      </div>
      <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 9, letterSpacing: 2, marginBottom: 20 }}>
        KEY OF C · MAJOR SCALE
      </div>

      {/* ── Main fretboard area ──────────────────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "flex-start", gap: 6 }}>

        {/* ── Fretboard column ─────────────────────────────────────────── */}
        <div style={{ position: "relative", width: DISPLAY_W, height: TOTAL_H, flexShrink: 0 }}>

          {/* Main photo — pinned at its own height */}
          <img
            src={fretboardImg}
            alt="Fretboard"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: DISPLAY_W,
              height: DISPLAY_H,
              objectFit: "fill",
              display: "block",
            }}
          />

          {/* Extension — one real fret tile per extra fret, each scaled to that fret's height.
              The tile (474×43px) contains wire+wood+wire from fret 16 of the photo.
              Stacked 6 times they produce seamless real-looking frets 19–24. */}
          {EXT_FRETS.map((k) => {
            const top = fretYpx(k - 1);
            const height = fretYpx(k) - fretYpx(k - 1);
            return (
              <img
                key={k}
                src={fretTile}
                alt=""
                style={{
                  position: "absolute",
                  top,
                  left: 0,
                  width: DISPLAY_W,
                  height,
                  objectFit: "fill",
                  display: "block",
                }}
              />
            );
          })}

          {/* ── Unified SVG: extension bg · fret wires · strings · inlays · labels ── */}
          <svg
            viewBox={`0 0 ${DISPLAY_W} ${TOTAL_H}`}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
          >
            {/* ── Strings (full height, photo + extension) ── */}
            {Array.from({ length: N_STRINGS }).map((_, i) => (
              <line
                key={i}
                x1={strXpx(i)} y1={0}
                x2={strXpx(i)} y2={TOTAL_H}
                stroke={strColor(i)}
                strokeWidth={STROKE_W[i] * 0.35}
                strokeLinecap="round"
              />
            ))}

            {/* ── Single dot inlays ── */}
            {SINGLE_DOTS.map((k) => {
              const cy = dotYpx(k);
              const sz = 32;
              return (
                <image
                  key={k}
                  href={alienInlay}
                  x={DISPLAY_W / 2 - sz / 2}
                  y={cy - sz / 2}
                  width={sz}
                  height={sz}
                  preserveAspectRatio="xMidYMid meet"
                  opacity={0.95}
                />
              );
            })}

            {/* ── Double dot inlays (frets 12 and 24) ── */}
            {DOUBLE_DOTS.map((k) => {
              const cy = dotYpx(k);
              const sz = 26;
              const lx = DISPLAY_W * 0.38 - sz / 2;
              const rx = DISPLAY_W * 0.62 - sz / 2;
              return (
                <g key={k}>
                  <image href={alienInlay} x={lx} y={cy - sz / 2} width={sz} height={sz} preserveAspectRatio="xMidYMid meet" opacity={0.95} />
                  <image href={alienInlay} x={rx} y={cy - sz / 2} width={sz} height={sz} preserveAspectRatio="xMidYMid meet" opacity={0.95} />
                </g>
              );
            })}

            {/* ── String name labels — top ── */}
            {STRING_NAMES.map((name, i) => (
              <g key={`top-${i}`}>
                <circle cx={strXpx(i)} cy={9} r={9} fill="#c8a030" stroke="#000" strokeWidth={1.5} />
                <text
                  x={strXpx(i)} y={12.5}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight="800"
                  fill="#000"
                  fontFamily="system-ui,sans-serif"
                >
                  {name}
                </text>
              </g>
            ))}

            {/* ── String name labels — bottom ── */}
            {STRING_NAMES.map((name, i) => (
              <g key={`bot-${i}`}>
                <circle cx={strXpx(i)} cy={TOTAL_H - 9} r={9} fill="#c8a030" stroke="#000" strokeWidth={1.5} />
                <text
                  x={strXpx(i)} y={TOTAL_H - 5.5}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight="800"
                  fill="#000"
                  fontFamily="system-ui,sans-serif"
                >
                  {name}
                </text>
              </g>
            ))}
          </svg>
        </div>

        {/* ── Fret number ruler — right side ───────────────────────────── */}
        <div style={{ position: "relative", width: 22, height: TOTAL_H, flexShrink: 0 }}>
          {FRET_LABELS.map((k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                top: fretYpx(k),
                left: 0,
                transform: "translateY(-50%)",
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
              }}
            >
              <div style={{ width: 4, height: 1, backgroundColor: "rgba(167,139,250,0.5)" }} />
              <div style={{ color: "rgba(167,139,250,0.8)", fontSize: 9, fontWeight: 700, lineHeight: 1, whiteSpace: "nowrap" }}>
                {k}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key / Scale selector pills ──────────────────────────────────── */}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        {["Key: C", "Scale: Major"].map((label) => (
          <div
            key={label}
            style={{
              padding: "5px 12px",
              borderRadius: 20,
              border: "1px solid rgba(124,58,237,0.5)",
              backgroundColor: "rgba(124,58,237,0.12)",
              color: "#a78bfa",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: 0.5,
              cursor: "pointer",
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* ── Design notes ─────────────────────────────────────────────────── */}
      <div
        style={{
          marginTop: 28,
          padding: "10px 14px",
          borderRadius: 10,
          border: "1px solid rgba(124,58,237,0.2)",
          backgroundColor: "rgba(124,58,237,0.06)",
          width: DISPLAY_W + 28,
          color: "rgba(255,255,255,0.5)",
          fontSize: 10,
          lineHeight: 1.8,
        }}
      >
        <div style={{ color: "#a78bfa", fontWeight: 700, fontSize: 8, letterSpacing: 1.5, marginBottom: 4 }}>
          DESIGN NOTES
        </div>
        <div>· Portrait top-view neck PNG, nut at top, frets 1–18</div>
        <div>· SVG-drawn extension adds frets 19–24</div>
        <div>· Unified SVG: strings + inlays + string labels</div>
        <div>· Standard dots: 3 5 7 9 12(×2) 15 17 19 21 24(×2)</div>
        <div>· Fret numbers on right ruler · Key + Scale pickers</div>
      </div>
    </div>
  );
}
