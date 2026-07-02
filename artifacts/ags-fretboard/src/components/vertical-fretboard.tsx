/**
 * VerticalFretboard — portrait-orientation neck with:
 *   • 4-layer ebony wood (gradient + sheen + grain)
 *   • Gold binding, cream nut
 *   • 3-layer fret wires (shadow / gold / highlight)
 *   • Realistic wound strings
 *   • Inlay dots
 *   • Glowing degree-coloured note dots (the Christmas tree effect)
 *   • Full click interaction for games
 */
import React from "react";
import { getNoteValue, getNoteName } from "@/lib/musicTheory";
import { playFretNote } from "@/lib/audio";
import { type NoteHighlight, DEGREE_COLORS } from "@/components/fretboard";
import fretboardPhotoSrc from "@assets/top_view_neck_1782370947897.png";

// ─── Geometry ─────────────────────────────────────────────────────────────────
const FRET_H      = 52;    // height per fret slot (px)
const NUT_SPAN    = 152;   // string span at nut
const BODY_TAPER  = 0.21;  // 21% wider at fret 24 vs nut
const NECK_INSET  = 13;    // wood margin beyond outermost string (before binding)
const BINDING_W   = 5;     // gold binding width
const NUT_H       = 13;    // cream nut height
const L_GUTTER    = 28;    // left gutter for fret numbers
const TOP_PAD     = 16;
const BOT_PAD     = 26;
const DOT_R       = 13;    // fretted note dot radius
const OPEN_R      = 10;    // open string dot radius
const NUM_STRINGS = 6;

// String span at a given absolute fret number
const spanAt = (absFret: number) =>
  NUT_SPAN * (1 + BODY_TAPER * absFret / 24);

// X of string col (0=low-E … 5=high-e) at an absolute fret position
const strX = (col: number, absFret: number, cx: number) => {
  const half = spanAt(absFret) / 2;
  return cx - half + col * (spanAt(absFret) / 5);
};

// Main fretboard uses string 0=high-e, 5=low-E; vertical uses col 0=low-E, 5=high-e
const toCol = (s: number) => 5 - s;

// ─── Visuals ─────────────────────────────────────────────────────────────────
const STRING_W   = [4.0, 3.2, 2.5, 1.7, 1.25, 0.9]; // col 0=lowE→5=highE
const STRING_COL = ["#c9a055","#c8a96a","#cbae80","#d0d5de","#dce0e8","#e6eaf2"];
const IS_WOUND   = [true, true, true, false, false, false];
const STR_LABELS = ["E","A","D","G","B","e"];
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];

const DOT_COLOR_MAP: Record<string, { fill: string; text: string }> = {
  root:      { fill: "#FF2D55", text: "#fff" },
  scale:     { fill: "#1E3A8A", text: "#fff" },
  chord:     { fill: "#FFD700", text: "#000" },
  correct:   { fill: "#1E3A8A", text: "#fff" },
  incorrect: { fill: "#FF2D55", text: "#fff" },
};

function resolveColor(h: NoteHighlight) {
  if (h.type === "degree" && h.interval !== undefined) {
    return DEGREE_COLORS[h.interval % 12] ?? { fill: "#00FFD5", text: "#000" };
  }
  return DOT_COLOR_MAP[h.type] ?? DOT_COLOR_MAP.scale;
}

// ─── Props ────────────────────────────────────────────────────────────────────
export interface VerticalFretboardProps {
  startFret?: number;
  endFret?: number;
  highlightNotes?: NoteHighlight[];
  onNoteClick?: (string: number, fret: number) => void;
  showNoteNames?: boolean;
  showAllNoteNames?: boolean;  // show faint note name at every position (Note Hunter mode)
  useSharps?: boolean;
  playSound?: boolean;
  chainLevel?: number;  // 0-3 → ambient glow intensity
  horizontal?: boolean; // landscape orientation (frets left→right, strings top→bottom)
  usePhoto?: boolean;   // use real fretboard photo as background instead of synthetic wood
}

export default function VerticalFretboard({
  startFret = 0,
  endFret = 12,
  highlightNotes = [],
  onNoteClick,
  showNoteNames = true,
  showAllNoteNames = false,
  useSharps = false,
  playSound = true,
  chainLevel = 0,
  horizontal = false,
  usePhoto = false,
}: VerticalFretboardProps) {
  const numFrets = endFret - startFret;
  const hasNut   = startFret === 0;

  const woodTop  = TOP_PAD;
  const wireBase = woodTop + (hasNut ? NUT_H : 0);
  const woodBot  = wireBase + numFrets * FRET_H;

  // Total SVG width — wide enough to contain the neck at endFret
  const halfSpan = spanAt(endFret) / 2 + NECK_INSET + BINDING_W;
  const svgW = L_GUTTER + halfSpan * 2 + 8;
  const svgH = woodBot + BOT_PAD;
  const cx   = L_GUTTER + halfSpan;  // horizontal centre of the neck

  // Y of centre of slot i (0 = open-string slot, above nut)
  const slotY = (windowFret: number) => {
    if (windowFret === 0) return woodTop - 10;
    return wireBase + (windowFret - 0.5) * FRET_H;
  };

  const wireY = (i: number) => wireBase + i * FRET_H;

  const handleClick = (s: number, f: number) => {
    if (playSound) playFretNote(getNoteValue(s, f));
    onNoteClick?.(s, f);
  };

  const highlightMap = new Map<string, NoteHighlight>();
  for (const h of highlightNotes) highlightMap.set(`${h.string}-${h.fret}`, h);

  // ─── Horizontal rendering ──────────────────────────────────────────────────
  if (horizontal) {
    const H_FRET_W   = 50;
    const H_STR_SP   = 25;
    const H_INSET    = 11;
    const H_BIND     = 0;
    const H_NUT_W    = 13;
    const H_LEFT     = 52;
    const H_RIGHT_P  = 48;
    const H_TOP_P    = 17;
    const H_BOT_P    = 25;

    const woodX    = H_LEFT + (hasNut ? H_NUT_W : 0);
    const woodRight = woodX + numFrets * H_FRET_W;
    const neckTop  = H_TOP_P + H_BIND;
    const neckBot  = neckTop + H_INSET + 5 * H_STR_SP + H_INSET;
    const cy       = (neckTop + neckBot) / 2;
    const svgW     = woodRight + H_RIGHT_P;
    const svgH     = neckBot + H_BIND + H_BOT_P;

    // col 0=low-E → bottom, col 5=high-e → top
    const hStrY  = (col: number) => neckTop + H_INSET + (5 - col) * H_STR_SP;
    const hWireX = (i: number)   => woodX + i * H_FRET_W;
    const hSlotX = (wf: number)  => wf === 0 ? H_LEFT - 12 : woodX + (wf - 0.5) * H_FRET_W;

    const hGrain = Array.from({ length: 14 }, (_, i) => {
      const t  = (i + 0.5) / 14;
      const x  = woodX + t * numFrets * H_FRET_W;
      const op = 0.03 + (i % 5 === 0 ? 0.04 : 0) + (i % 3 === 0 ? 0.02 : 0);
      return { x, op };
    });

    const hChainFill =
      chainLevel >= 3 ? "#FF2DCF28" :
      chainLevel >= 2 ? "#00FFD520" : null;

    return (
      <div style={{ display: "inline-block" }}>
        <svg
          width={svgW} height={svgH}
          style={{
            display: "block",
            filter:
              chainLevel >= 3 ? "drop-shadow(0 0 20px #FF2DCF99)" :
              chainLevel >= 2 ? "drop-shadow(0 0 12px #00FFD577)" : "none",
          }}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="hfb-ebony" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#1c0f08" />
              <stop offset="25%"  stopColor="#0f0805" />
              <stop offset="100%" stopColor="#050302" />
            </linearGradient>
            <linearGradient id="hfb-sheen" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="#000000" stopOpacity="0.50" />
              <stop offset="30%"  stopColor="#3d1e0a" stopOpacity="0.00" />
              <stop offset="70%"  stopColor="#3d1e0a" stopOpacity="0.00" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.50" />
            </linearGradient>
            <linearGradient id="hfb-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#7a4e0e" />
              <stop offset="45%"  stopColor="#d4a020" />
              <stop offset="60%"  stopColor="#edd040" />
              <stop offset="100%" stopColor="#7a4e0e" />
            </linearGradient>
            <clipPath id="hfb-neck-clip">
              <rect x={woodX} y={neckTop} width={numFrets * H_FRET_W} height={neckBot - neckTop} />
            </clipPath>
          </defs>

          {/* ── Wood / Photo ── */}
          {usePhoto ? (() => {
            const cxImg = woodX + (woodRight - woodX) / 2;
            const cyImg = (neckTop + neckBot) / 2;
            const imgW  = neckBot - neckTop;
            const imgH  = woodRight - woodX;
            return (
              <>
                <image
                  href={fretboardPhotoSrc}
                  x={cxImg - imgW / 2}
                  y={cyImg - imgH / 2}
                  width={imgW}
                  height={imgH}
                  preserveAspectRatio="none"
                  transform={`rotate(-90, ${cxImg}, ${cyImg})`}
                  clipPath="url(#hfb-neck-clip)"
                />
                {hChainFill && <rect x={woodX} y={neckTop} width={numFrets * H_FRET_W} height={neckBot - neckTop} fill={hChainFill} />}
              </>
            );
          })() : (
            <g clipPath="url(#hfb-neck-clip)">
              <rect x={woodX} y={neckTop} width={numFrets * H_FRET_W} height={neckBot - neckTop} fill="url(#hfb-ebony)" />
              <rect x={woodX} y={neckTop} width={numFrets * H_FRET_W} height={neckBot - neckTop} fill="url(#hfb-sheen)" />
              {hChainFill && <rect x={woodX} y={neckTop} width={numFrets * H_FRET_W} height={neckBot - neckTop} fill={hChainFill} />}
              {hGrain.map((g, i) => (
                <line key={i} x1={g.x} y1={neckTop + 1} x2={g.x} y2={neckBot - 1}
                  stroke="#4a2510" strokeWidth="1" opacity={g.op} />
              ))}
            </g>
          )}

          {/* ── Cream nut ── */}
          {hasNut && !usePhoto && (
            <>
              <rect x={H_LEFT} y={neckTop} width={H_NUT_W} height={neckBot - neckTop} fill="#ede6d2" rx={1.5} />
              <line x1={H_LEFT + H_NUT_W - 1.5} y1={neckTop + 3} x2={H_LEFT + H_NUT_W - 1.5} y2={neckBot - 3}
                stroke="#ffffff" strokeWidth="1.5" opacity={0.36} />
            </>
          )}

          {/* ── Inlay dots ── */}
          {SINGLE_INLAYS.filter(f => f > startFret && f <= endFret).map(f => {
            const wf = f - startFret;
            return <circle key={f} cx={hSlotX(wf)} cy={cy} r={6} fill="#ebebeb" opacity={0.80} />;
          })}
          {DOUBLE_INLAYS.filter(f => f > startFret && f <= endFret).map(f => {
            const wf  = f - startFret;
            const off = H_STR_SP * 0.80;
            return (
              <g key={f}>
                <circle cx={hSlotX(wf)} cy={cy - off} r={6} fill="#ebebeb" opacity={0.80} />
                <circle cx={hSlotX(wf)} cy={cy + off} r={6} fill="#ebebeb" opacity={0.80} />
              </g>
            );
          })}

          {/* ── Fret wires ── */}
          {Array.from({ length: numFrets }, (_, i) => {
            const x = hWireX(i + 1);
            return (
              <g key={i}>
                <line x1={x + 1.8} y1={neckTop} x2={x + 1.8} y2={neckBot} stroke="#1a1a1a" strokeWidth="3.0" opacity={0.60} />
                <line x1={x}       y1={neckTop} x2={x}       y2={neckBot} stroke="#b0b4bc" strokeWidth="2.5" />
                <line x1={x - 0.6} y1={neckTop} x2={x - 0.6} y2={neckBot} stroke="#e8eaf0" strokeWidth="0.7" opacity={0.55} />
              </g>
            );
          })}

          {/* ── Strings ── */}
          {[0,1,2,3,4,5].map(col => {
            const y     = hStrY(col);
            const w     = STRING_W[col];
            const c     = STRING_COL[col];
            const wound = IS_WOUND[col];
            return (
              <g key={col}>
                <line x1={woodX} y1={y + w * 0.35} x2={woodRight} y2={y + w * 0.35}
                  stroke="#000000" strokeWidth={w * 0.72} opacity={0.35} />
                <line x1={woodX} y1={y} x2={woodRight} y2={y}
                  stroke={c} strokeWidth={w} opacity={0.90} />
                {wound && Array.from({ length: Math.floor((woodRight - woodX) / 5) }, (_, k) => {
                  const px = woodX + k * 5;
                  return (
                    <line key={k} x1={px} y1={y - w * 0.45} x2={px} y2={y + w * 0.45}
                      stroke="#8a6020" strokeWidth="0.5" opacity={0.20} />
                  );
                })}
                <line x1={woodX} y1={y - w * 0.28} x2={woodRight} y2={y - w * 0.28}
                  stroke="#ffffff" strokeWidth={w * 0.28} opacity={0.28} />
              </g>
            );
          })}

          {/* ── Note dots ── */}
          {Array.from({ length: numFrets + 1 }, (_, fi) => {
            const absF = startFret + fi;
            if (fi === 0 && !hasNut) return null;
            return Array.from({ length: NUM_STRINGS }, (_, s) => {
              const col  = toCol(s);
              const dotX    = hSlotX(fi);
              const dotY    = hStrY(col);
              const H_DOT_R = fi === 0 ? 10 : 13;
              const h       = highlightMap.get(`${s}-${absF}`);
              if (h) {
                const clr   = resolveColor(h);
                const label = h.label ?? (showNoteNames ? getNoteName(getNoteValue(s, absF), useSharps) : "");
                return (
                  <g key={`dot-${s}-${fi}`} onClick={() => handleClick(s, absF)}
                    style={{ cursor: onNoteClick ? "pointer" : "default" }}>
                    <circle cx={dotX} cy={dotY} r={H_DOT_R} fill={clr.fill} />
                    {label && (
                      <text x={dotX} y={dotY + 5} textAnchor="middle" fontSize="14"
                        fill={clr.text} fontWeight="500" fontFamily="EB Garamond, serif"
                        style={{ pointerEvents: "none", userSelect: "none" }}>
                        {label}
                      </text>
                    )}
                  </g>
                );
              }

              if (showAllNoteNames) {
                const name = getNoteName(getNoteValue(s, absF), useSharps);
                return (
                  <g key={`ghost-${s}-${fi}`} onClick={() => onNoteClick && handleClick(s, absF)}
                    style={{ cursor: onNoteClick ? "pointer" : "default" }}>
                    <circle cx={dotX} cy={dotY} r={H_DOT_R} fill="#ffffff" opacity={0.05} />
                    <text x={dotX} y={dotY + 4} textAnchor="middle" fontSize="8"
                      fill="#6b7ea0" fontFamily="Space Grotesk, sans-serif"
                      style={{ pointerEvents: "none", userSelect: "none" }}>
                      {name}
                    </text>
                  </g>
                );
              }

              if (onNoteClick) {
                return (
                  <g key={`click-${s}-${fi}`} onClick={() => handleClick(s, absF)} style={{ cursor: "pointer", pointerEvents: "all" }}>
                    <circle cx={dotX} cy={dotY} r={H_DOT_R + 4} fill="white" opacity={0.001} />
                  </g>
                );
              }

              return null;
            });
          })}

          {/* ── Fret numbers ── */}
          {Array.from({ length: numFrets }, (_, i) => {
            const absF = startFret + i + 1;
            return (
              <text key={absF}
                x={woodX + (i + 0.5) * H_FRET_W} y={neckBot + H_BIND + 13}
                textAnchor="middle" fontSize="10" fontFamily="monospace" fill="#8a7a60">
                {absF}
              </text>
            );
          })}

          {/* ── String labels — both ends ── */}
          {STR_LABELS.map((name, col) => {
            const strNum = 6 - col;
            const y = hStrY(col) + 5;
            return (
              <React.Fragment key={col}>
                <text x={H_LEFT - 8} y={y} textAnchor="end" fontFamily="sans-serif">
                  <tspan fontSize="17" fontWeight="700" fill="#c8b090">{name}</tspan>
                  <tspan dx="6" fontSize="14" fontWeight="500" fill="#7a6848">{strNum}</tspan>
                </text>
                <text x={woodRight + 6} y={y} textAnchor="start" fontFamily="sans-serif">
                  <tspan fontSize="17" fontWeight="700" fill="#c8b090">{name}</tspan>
                  <tspan dx="6" fontSize="14" fontWeight="500" fill="#7a6848">{strNum}</tspan>
                </text>
              </React.Fragment>
            );
          })}
        </svg>
      </div>
    );
  }

  // ─── Vertical rendering ────────────────────────────────────────────────────
  // Neck edge helpers (at absolute fret)
  const neckL = (af: number) => cx - spanAt(af) / 2 - NECK_INSET;
  const neckR = (af: number) => cx + spanAt(af) / 2 + NECK_INSET;

  const trapPath  = `M ${neckL(startFret)} ${woodTop} L ${neckR(startFret)} ${woodTop} L ${neckR(endFret)} ${woodBot} L ${neckL(endFret)} ${woodBot} Z`;
  const leftBind  = `M ${neckL(startFret)} ${woodTop} L ${neckL(startFret)+BINDING_W} ${woodTop} L ${neckL(endFret)+BINDING_W} ${woodBot} L ${neckL(endFret)} ${woodBot} Z`;
  const rightBind = `M ${neckR(startFret)-BINDING_W} ${woodTop} L ${neckR(startFret)} ${woodTop} L ${neckR(endFret)} ${woodBot} L ${neckR(endFret)-BINDING_W} ${woodBot} Z`;

  // 18 wood grain lines
  const grainLines = Array.from({ length: 18 }, (_, i) => {
    const t  = (i + 0.5) / 18;
    const y  = woodTop + t * (woodBot - woodTop);
    const af = startFret + t * numFrets;
    const lx = neckL(af) + BINDING_W + 1;
    const rx = neckR(af) - BINDING_W - 1;
    const op = 0.03 + (i % 5 === 0 ? 0.04 : 0) + (i % 3 === 0 ? 0.02 : 0);
    return { y, lx, rx, op };
  });

  const chainGlowFill =
    chainLevel >= 3 ? "#FF2DCF28" :
    chainLevel >= 2 ? "#00FFD520" : null;

  return (
    <div style={{ display: "inline-block" }}>
      <svg
        width={svgW}
        height={svgH}
        style={{
          display: "block",
          filter:
            chainLevel >= 3 ? "drop-shadow(0 0 20px #FF2DCF99)" :
            chainLevel >= 2 ? "drop-shadow(0 0 12px #00FFD577)" : "none",
        }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <clipPath id="vfb-neck-clip">
            <path d={trapPath} />
          </clipPath>
          <linearGradient id="vfb-ebony" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1c0f08" />
            <stop offset="25%"  stopColor="#0f0805" />
            <stop offset="100%" stopColor="#050302" />
          </linearGradient>
          <linearGradient id="vfb-sheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#000000" stopOpacity="0.60" />
            <stop offset="22%"  stopColor="#2a1508" stopOpacity="0.06" />
            <stop offset="50%"  stopColor="#3d1e0a" stopOpacity="0.00" />
            <stop offset="78%"  stopColor="#2a1508" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.60" />
          </linearGradient>
          <linearGradient id="vfb-gold" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7a4e0e" />
            <stop offset="45%"  stopColor="#d4a020" />
            <stop offset="60%"  stopColor="#edd040" />
            <stop offset="100%" stopColor="#7a4e0e" />
          </linearGradient>
        </defs>

        {/* ── Wood / Photo background ── */}
        {usePhoto ? (
          <>
            <g clipPath="url(#vfb-neck-clip)">
              {/* Direct placement — landscape photo cropped to fill portrait neck area */}
              <image
                href={fretboardPhotoSrc}
                x={neckL(endFret)}
                y={woodTop}
                width={neckR(endFret) - neckL(endFret)}
                height={woodBot - woodTop}
                preserveAspectRatio="xMidYMid slice"
              />
              <path d={trapPath} fill="rgba(5,8,22,0.44)" />
              {chainGlowFill && <path d={trapPath} fill={chainGlowFill} />}
            </g>
            {hasNut && (
              <>
                <rect
                  x={neckL(0) + BINDING_W} y={woodTop}
                  width={neckR(0) - neckL(0) - BINDING_W * 2} height={NUT_H}
                  fill="#ede6d2" rx={1.5}
                />
                <line
                  x1={neckL(0) + BINDING_W + 3} y1={woodTop + 1.5}
                  x2={neckR(0) - BINDING_W - 3} y2={woodTop + 1.5}
                  stroke="#ffffff" strokeWidth="1.5" opacity={0.36}
                />
              </>
            )}
          </>
        ) : (
          <>
            <g clipPath="url(#vfb-neck-clip)">
              <path d={trapPath} fill="url(#vfb-ebony)" />
              <path d={trapPath} fill="url(#vfb-sheen)" />
              {chainGlowFill && <path d={trapPath} fill={chainGlowFill} />}
              {grainLines.map((g, i) => (
                <line key={i} x1={g.lx} y1={g.y} x2={g.rx} y2={g.y}
                  stroke="#4a2510" strokeWidth="1" opacity={g.op} />
              ))}
            </g>
            {/* ── Gold binding ── */}
            <path d={leftBind}  fill="url(#vfb-gold)" opacity={0.88} />
            <path d={rightBind} fill="url(#vfb-gold)" opacity={0.88} />
            <path d={leftBind}  fill="none" stroke="#f5dd70" strokeWidth="0.5" opacity={0.40} />
            <path d={rightBind} fill="none" stroke="#f5dd70" strokeWidth="0.5" opacity={0.40} />
            {/* ── Cream nut ── */}
            {hasNut && (
              <>
                <rect
                  x={neckL(0) + BINDING_W} y={woodTop}
                  width={neckR(0) - neckL(0) - BINDING_W * 2} height={NUT_H}
                  fill="#ede6d2" rx={1.5}
                />
                <line
                  x1={neckL(0) + BINDING_W + 3} y1={woodTop + 1.5}
                  x2={neckR(0) - BINDING_W - 3} y2={woodTop + 1.5}
                  stroke="#ffffff" strokeWidth="1.5" opacity={0.36}
                />
              </>
            )}
          </>
        )}

        {/* ── Inlay dots ── */}
        {SINGLE_INLAYS.filter(f => f > startFret && f <= endFret).map(f => {
          const wf = f - startFret;
          return <circle key={f} cx={cx} cy={slotY(wf)} r={6} fill="#ebebeb" opacity={0.80} />;
        })}
        {DOUBLE_INLAYS.filter(f => f > startFret && f <= endFret).map(f => {
          const wf  = f - startFret;
          const off = spanAt(f - 0.5) * 0.20;
          return (
            <g key={f}>
              <circle cx={cx - off} cy={slotY(wf)} r={6} fill="#ebebeb" opacity={0.80} />
              <circle cx={cx + off} cy={slotY(wf)} r={6} fill="#ebebeb" opacity={0.80} />
            </g>
          );
        })}

        {/* ── Fret wires ── */}
        {Array.from({ length: numFrets }, (_, i) => {
          const af = startFret + i + 1;
          const y  = wireY(i + 1);
          const lx = neckL(af) + BINDING_W;
          const rx = neckR(af) - BINDING_W;
          return (
            <g key={i}>
              <line x1={lx} y1={y+1.8} x2={rx} y2={y+1.8}
                stroke="#1a1a1a" strokeWidth="3.0" opacity={0.60} />
              <line x1={lx} y1={y}     x2={rx} y2={y}
                stroke="#b0b4bc" strokeWidth="2.5" />
              <line x1={lx} y1={y-0.6} x2={rx} y2={y-0.6}
                stroke="#e8eaf0" strokeWidth="0.7" opacity={0.55} />
            </g>
          );
        })}

        {/* ── Strings ── */}
        {[0,1,2,3,4,5].map(col => {
          const xTop  = strX(col, startFret, cx);
          const xBot  = strX(col, endFret,   cx);
          const w     = STRING_W[col];
          const c     = STRING_COL[col];
          const wound = IS_WOUND[col];
          return (
            <g key={col}>
              <line x1={xTop+w*0.35} y1={woodTop} x2={xBot+w*0.35} y2={woodBot}
                stroke="#000000" strokeWidth={w*0.72} opacity={0.35} />
              <line x1={xTop} y1={woodTop} x2={xBot} y2={woodBot}
                stroke={c} strokeWidth={w} opacity={0.90} />
              {wound && Array.from({ length: Math.floor((woodBot - woodTop) / 5) }, (_, k) => {
                const py = woodTop + k * 5;
                const t  = (py - woodTop) / (woodBot - woodTop);
                const px = strX(col, startFret + t * numFrets, cx);
                return (
                  <line key={k}
                    x1={px-w*0.45} y1={py} x2={px+w*0.45} y2={py}
                    stroke="#8a6020" strokeWidth="0.5" opacity={0.20}
                  />
                );
              })}
              <line x1={xTop-w*0.28} y1={woodTop} x2={xBot-w*0.28} y2={woodBot}
                stroke="#ffffff" strokeWidth={w*0.28} opacity={0.28} />
            </g>
          );
        })}

        {/* ── Note dots ── */}
        {Array.from({ length: numFrets + 1 }, (_, fi) => {
          const absF = startFret + fi;   // fi=0 → open strings
          if (fi === 0 && !hasNut) return null;
          return Array.from({ length: NUM_STRINGS }, (_, s) => {
            const col  = toCol(s);
            const dotX = fi === 0
              ? strX(col, 0, cx)
              : strX(col, startFret + (fi - 0.5), cx);
            const dotY = slotY(fi);
            const r    = fi === 0 ? OPEN_R : DOT_R;
            const h    = highlightMap.get(`${s}-${absF}`);

            if (h) {
              const clr   = resolveColor(h);
              const label = h.label
                ?? (showNoteNames ? getNoteName(getNoteValue(s, absF), useSharps) : "");
              return (
                <g key={`dot-${s}-${fi}`}
                  onClick={() => handleClick(s, absF)}
                  style={{ cursor: onNoteClick ? "pointer" : "default" }}>
                  {/* Main dot */}
                  <circle cx={dotX} cy={dotY} r={r} fill={clr.fill} />
                  {/* Label */}
                  {label && (
                    <text x={dotX} y={dotY + 4}
                      textAnchor="middle" fontSize="9"
                      fill={clr.text} fontWeight="bold"
                      fontFamily="Space Grotesk, sans-serif"
                      style={{ pointerEvents: "none", userSelect: "none" }}>
                      {label}
                    </text>
                  )}
                </g>
              );
            }

            // Ghost / empty position
            if (showAllNoteNames) {
              const name = getNoteName(getNoteValue(s, absF), useSharps);
              return (
                <g key={`ghost-${s}-${fi}`}
                  onClick={() => onNoteClick && handleClick(s, absF)}
                  style={{ cursor: onNoteClick ? "pointer" : "default" }}>
                  <circle cx={dotX} cy={dotY} r={r} fill="#ffffff" opacity={0.05} />
                  <text x={dotX} y={dotY + 4}
                    textAnchor="middle" fontSize="8"
                    fill="#6b7ea0" fontFamily="Space Grotesk, sans-serif"
                    style={{ pointerEvents: "none", userSelect: "none" }}>
                    {name}
                  </text>
                </g>
              );
            }

            if (onNoteClick) {
              return (
                <g key={`click-${s}-${fi}`}
                  onClick={() => handleClick(s, absF)}
                  style={{ cursor: "pointer", pointerEvents: "all" }}>
                  <circle cx={dotX} cy={dotY} r={r + 4} fill="white" opacity={0.001} />
                </g>
              );
            }

            return null;
          });
        })}

        {/* ── Fret numbers ── */}
        {Array.from({ length: numFrets }, (_, i) => {
          const absF = startFret + i + 1;
          return (
            <text key={absF}
              x={L_GUTTER - 4} y={slotY(i + 1) + 4}
              textAnchor="end" fontSize="10"
              fontFamily="monospace" fill="#8a7a60">
              {absF}
            </text>
          );
        })}

        {/* ── String labels ── */}
        {STR_LABELS.map((name, col) => (
          <text key={col}
            x={strX(col, endFret, cx)} y={woodBot + 18}
            textAnchor="middle" fontSize="10" fontWeight="600"
            fontFamily="sans-serif" fill="#b0a080">
            {name}
          </text>
        ))}
      </svg>
    </div>
  );
}
