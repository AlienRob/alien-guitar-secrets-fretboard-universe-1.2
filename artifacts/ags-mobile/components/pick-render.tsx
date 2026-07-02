/**
 * SVG pick and strap renderers — no PNG images needed.
 * The pick silhouette is the exact same bezier shape used by the 3D viewer,
 * converted from Three.js Y-up artboard to SVG Y-down.
 * The finish colour logic mirrors buildPickColorMap in pick-3d-viewer.tsx.
 * The AGS alien logo is stamped in a contrast colour, matching the web vault thumbnails.
 */
import React from "react";
import Svg, {
  Circle,
  ClipPath,
  Defs,
  G,
  Image as SvgImage,
  Line,
  LinearGradient,
  Mask,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

import type { GearItem, PickFinish, StrapPattern } from "@/lib/gear";

// ---------------------------------------------------------------------------
// Pick shape
// ---------------------------------------------------------------------------
// Artboard 0..100 x, 0..102 y — wide rounded top (y≈6), pointed tip (y≈96).
const PICK_PATH =
  "M 50 6 C 72 6 88 21 88 43 C 88 71 62 92 50 96 C 38 92 12 71 12 43 C 12 21 28 6 50 6 Z";
const VB_W = 100;
const VB_H = 102;

// Logo asset — recoloured per pick to contrast with the body colour.
const LOGO = require("@/assets/images/ags-pick-logo.png") as number;

function safe(id: string): string {
  return id.replace(/[^a-z0-9]/gi, "_");
}

// Mirrors the web app's stampColorFor so the 3D pick and the flat thumbnail match.
function stampColorFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0b0b14" : "#ffffff";
}

// Build the base-fill gradient/colour definition for a given finish.
function PickFillDef({
  finish,
  c1,
  c2,
  uid,
}: {
  finish: PickFinish;
  c1: string;
  c2: string;
  uid: string;
}) {
  const id = `pf_${uid}`;
  switch (finish) {
    case "holographic":
      return (
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#ff5fa2" />
          <Stop offset="25%"  stopColor={c1} />
          <Stop offset="60%"  stopColor={c2} />
          <Stop offset="100%" stopColor="#a7ff5f" />
        </LinearGradient>
      );
    case "foil":
      return (
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor="#ffffff" />
          <Stop offset="30%"  stopColor={c1} />
          <Stop offset="55%"  stopColor="#6b7280" />
          <Stop offset="75%"  stopColor={c1} />
          <Stop offset="100%" stopColor="#e5e7eb" />
        </LinearGradient>
      );
    case "pearl":
      return (
        <RadialGradient id={id} cx="0.38" cy="0.32" r="0.75" gradientUnits="objectBoundingBox">
          <Stop offset="0%"   stopColor="#ffffff" />
          <Stop offset="45%"  stopColor={c1} />
          <Stop offset="100%" stopColor={c2} />
        </RadialGradient>
      );
    case "galaxy":
      return (
        <RadialGradient id={id} cx="0.42" cy="0.36" r="0.8" gradientUnits="objectBoundingBox">
          <Stop offset="0%"   stopColor={c2} />
          <Stop offset="45%"  stopColor={c1} />
          <Stop offset="100%" stopColor="#05060f" />
        </RadialGradient>
      );
    case "marble":
      return (
        <LinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor="#ffffff" />
          <Stop offset="50%"  stopColor={c1} />
          <Stop offset="100%" stopColor={c1} />
        </LinearGradient>
      );
    case "prism":
      return (
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0%"    stopColor="#f43f5e" />
          <Stop offset="25%"   stopColor="#f59e0b" />
          <Stop offset="50%"   stopColor="#22d3ee" />
          <Stop offset="75%"   stopColor="#a78bfa" />
          <Stop offset="100%"  stopColor="#f43f5e" />
        </LinearGradient>
      );
    default:
      // solid / carbon / glitter / neon
      return (
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%"   stopColor={c1} />
          <Stop offset="100%" stopColor={c2} />
        </LinearGradient>
      );
  }
}

// Pattern overlays drawn on top of the base fill (clipped to pick shape).
function PickOverlay({ finish, c1, c2 }: { finish: PickFinish; c1: string; c2: string }) {
  switch (finish) {
    case "carbon": {
      const step = 9;
      const cells: React.ReactElement[] = [];
      for (let row = -3; row < 14; row++) {
        for (let col = -3; col < 14; col++) {
          const half = step / 2;
          cells.push(
            <Rect key={`a${row}_${col}`} x={col * step}        y={row * step}        width={half} height={half} fill={c2} opacity={0.6} />,
            <Rect key={`b${row}_${col}`} x={col * step + half} y={row * step + half} width={half} height={half} fill={c2} opacity={0.6} />,
          );
        }
      }
      return <G transform="rotate(45 50 51)">{cells}</G>;
    }
    case "glitter":
    case "galaxy": {
      const pts =
        finish === "glitter"
          ? [[22,18],[42,22],[62,20],[30,32],[55,35],[68,42],[25,50],[48,55],[70,58],[32,68],[58,72],[42,38],[60,82],[35,85],[50,80]]
          : [[30,22],[55,28],[70,40],[38,52],[62,60],[28,70],[50,78],[65,72],[40,42],[58,88]];
      return (
        <G>
          {pts.map(([x, y], i) => (
            <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 0.9} fill="rgba(255,255,255,0.85)" />
          ))}
        </G>
      );
    }
    case "marble":
      return (
        <G>
          <Path d="M 16 66 C 34 50 44 60 58 40 C 68 26 78 30 88 20" stroke={c2} strokeWidth="2.2" strokeLinecap="round" fill="none" opacity={0.55} />
          <Path d="M 12 48 C 30 44 40 28 58 24 C 70 21 80 16 90 12" stroke={c2} strokeWidth="1.3" strokeLinecap="round" fill="none" opacity={0.40} />
          <Path d="M 22 88 C 30 72 48 74 60 62"                     stroke={c2} strokeWidth="1.1" strokeLinecap="round" fill="none" opacity={0.35} />
        </G>
      );
    case "neon":
      return <Path d={PICK_PATH} fill="none" stroke={c1} strokeWidth="4" opacity={0.35} />;
    default:
      return null;
  }
}

export interface PickRenderProps {
  item: GearItem;
  size: number;
}

export function PickRender({ item, size }: PickRenderProps) {
  const h = Math.round((size * VB_H) / VB_W);
  const finish: PickFinish = item.finish ?? "solid";
  const c1 = item.color  ?? "#333333";
  const c2 = item.color2 ?? c1;
  const uid = safe(item.id);
  const stamp = stampColorFor(c1);

  return (
    <Svg width={size} height={h} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      <Defs>
        <ClipPath id={`pc_${uid}`}>
          <Path d={PICK_PATH} />
        </ClipPath>
        <PickFillDef finish={finish} c1={c1} c2={c2} uid={uid} />
        <RadialGradient id={`ps_${uid}`} cx="0.38" cy="0.28" r="0.28" gradientUnits="objectBoundingBox">
          <Stop offset="0%"   stopColor="#ffffff" stopOpacity="0.35" />
          <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </RadialGradient>
        {/* Alpha mask of the AGS logo — used to stamp it in the contrast colour */}
        <Mask id={`lm_${uid}`} maskUnits="userSpaceOnUse" x={0} y={0} width={VB_W} height={VB_H}>
          <SvgImage href={LOGO} x={22} y={27} width={56} height={44} />
        </Mask>
      </Defs>

      {/* Base fill */}
      <Path d={PICK_PATH} fill={`url(#pf_${uid})`} />

      {/* Finish overlays, clipped to pick silhouette */}
      <G clipPath={`url(#pc_${uid})`}>
        <PickOverlay finish={finish} c1={c1} c2={c2} />
      </G>

      {/* Specular sheen */}
      <Path d={PICK_PATH} fill={`url(#ps_${uid})`} />

      {/* AGS logo stamp — filled in the contrast colour through the logo alpha mask */}
      <G clipPath={`url(#pc_${uid})`}>
        <Rect x={0} y={0} width={VB_W} height={VB_H} fill={stamp} mask={`url(#lm_${uid})`} opacity={0.9} />
      </G>

      {/* Outline */}
      <Path d={PICK_PATH} fill="none" stroke={c2} strokeWidth="1.2" opacity={0.4} />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Strap shape
// ---------------------------------------------------------------------------

function StrapOverlay({
  pattern,
  c2,
  W,
  H,
}: {
  pattern: StrapPattern;
  c2: string;
  W: number;
  H: number;
}) {
  switch (pattern) {
    case "stripes": {
      const sw = W / 8;
      return (
        <G>
          {[1, 3, 5, 7].map((i) => (
            <Rect key={i} x={i * sw} y={0} width={sw * 0.55} height={H} fill={c2} opacity={0.65} />
          ))}
        </G>
      );
    }
    case "chevron": {
      const chevs: React.ReactElement[] = [];
      const step = W / 10;
      for (let i = -1; i < 12; i++) {
        const x = i * step;
        chevs.push(
          <Path key={i} d={`M ${x} 0 L ${x + step / 2} ${H / 2} L ${x} ${H}`}
            stroke={c2} strokeWidth={H * 0.14} fill="none" opacity={0.55} />
        );
      }
      return <G>{chevs}</G>;
    }
    case "rainbow": {
      const colors = ["#f43f5e", "#f97316", "#facc15", "#22d3ee", "#a78bfa", "#ec4899"];
      const sw = W / colors.length;
      return (
        <G opacity={0.6}>
          {colors.map((c, i) => (
            <Rect key={i} x={i * sw} y={0} width={sw} height={H} fill={c} />
          ))}
        </G>
      );
    }
    case "zebra": {
      const sw = W / 7;
      return (
        <G>
          {[0, 2, 4, 6].map((i) => (
            <Rect key={i} x={i * sw} y={0} width={sw} height={H} fill={c2} opacity={0.75} />
          ))}
        </G>
      );
    }
    case "studded": {
      const cols = Math.max(4, Math.floor(W / 14));
      const studs: React.ReactElement[] = [];
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < cols; col++) {
          const cx = (col + 0.5) * (W / cols);
          const cy = (row + 0.5) * (H / 2);
          studs.push(<Circle key={`${row}_${col}`} cx={cx} cy={cy} r={H * 0.13} fill={c2} opacity={0.8} />);
        }
      }
      return <G>{studs}</G>;
    }
    case "lightning": {
      const bolts: React.ReactElement[] = [];
      const n = 6;
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (W / n);
        bolts.push(
          <Path key={i}
            d={`M ${x} 0 L ${x - 5} ${H * 0.48} L ${x + 4} ${H * 0.48} L ${x - 3} ${H}`}
            fill={c2} opacity={0.65} />
        );
      }
      return <G>{bolts}</G>;
    }
    case "diamond": {
      const n = 7;
      const dw = W / n;
      const dh = H * 0.82;
      const diamonds: React.ReactElement[] = [];
      for (let i = 0; i < n; i++) {
        const cx = (i + 0.5) * dw;
        diamonds.push(
          <Path key={i}
            d={`M ${cx} ${(H - dh) / 2} L ${cx + dw / 2} ${H / 2} L ${cx} ${(H + dh) / 2} L ${cx - dw / 2} ${H / 2} Z`}
            fill="none" stroke={c2} strokeWidth="1.8" opacity={0.6} />
        );
      }
      return <G>{diamonds}</G>;
    }
    case "cosmic": {
      const stars = [[0.08,0.3],[0.22,0.72],[0.35,0.2],[0.5,0.62],[0.62,0.3],[0.75,0.75],[0.9,0.4]];
      return (
        <G>
          {stars.map(([fx, fy], i) => (
            <Circle key={i} cx={fx * W} cy={fy * H} r={H * 0.09} fill={c2} opacity={0.45} />
          ))}
        </G>
      );
    }
    case "flames": {
      const n = 8;
      const flames: React.ReactElement[] = [];
      for (let i = 0; i < n; i++) {
        const x = (i + 0.5) * (W / n);
        flames.push(
          <Path key={i}
            d={`M ${x - 5} ${H} C ${x - 8} ${H * 0.6} ${x} ${H * 0.3} ${x} 0 C ${x} ${H * 0.3} ${x + 8} ${H * 0.6} ${x + 5} ${H} Z`}
            fill={c2} opacity={0.5} />
        );
      }
      return <G>{flames}</G>;
    }
    case "leopard": {
      const spots = [[0.1,0.4],[0.25,0.15],[0.4,0.7],[0.55,0.3],[0.7,0.65],[0.85,0.2]];
      return (
        <G>
          {spots.map(([fx, fy], i) => (
            <Circle key={i} cx={fx * W} cy={fy * H} r={H * 0.22} fill={c2} opacity={0.35} />
          ))}
        </G>
      );
    }
    case "woven": {
      const step = H * 0.35;
      const weaves: React.ReactElement[] = [];
      for (let i = 0; i < W / step + 1; i++) {
        weaves.push(
          <Line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={H}
            stroke={c2} strokeWidth="1.2" opacity={0.4} />,
          <Line key={`h${i}`} x1={0} y1={i * step} x2={W} y2={i * step}
            stroke={c2} strokeWidth="1.2" opacity={0.4} />,
        );
      }
      return <G>{weaves}</G>;
    }
    case "leather": {
      const n = 5;
      return (
        <G>
          {Array.from({ length: n }, (_, i) => (
            <Rect key={i} x={0} y={(i * H * 1.1) / n} width={W} height={H * 0.06 / n}
              fill={c2} opacity={0.25} />
          ))}
        </G>
      );
    }
    default:
      return null;
  }
}

export interface StrapRenderProps {
  item: GearItem;
  width: number;
}

export function StrapRender({ item, width }: StrapRenderProps) {
  const W = width;
  const H = Math.round(W * 0.28);
  const r = H / 2;
  const c1 = item.color  ?? "#333333";
  const c2 = item.color2 ?? c1;
  const pattern: StrapPattern = item.pattern ?? "solid";
  const uid = safe(item.id);
  const bandPath = `M ${r} 0 L ${W - r} 0 Q ${W} 0 ${W} ${r} Q ${W} ${H} ${W - r} ${H} L ${r} ${H} Q 0 ${H} 0 ${r} Q 0 0 ${r} 0 Z`;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id={`sg_${uid}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%"   stopColor={c2} />
          <Stop offset="50%"  stopColor={c1} />
          <Stop offset="100%" stopColor={c2} />
        </LinearGradient>
        <ClipPath id={`sc_${uid}`}>
          <Path d={bandPath} />
        </ClipPath>
      </Defs>

      <Path d={bandPath} fill={`url(#sg_${uid})`} />
      <G clipPath={`url(#sc_${uid})`}>
        <StrapOverlay pattern={pattern} c2={c2} W={W} H={H} />
      </G>
      {/* Top highlight */}
      <Line x1={r} y1={H * 0.22} x2={W - r} y2={H * 0.22}
        stroke="white" strokeWidth={H * 0.07} strokeOpacity={0.2} strokeLinecap="round" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Unified dispatcher
// ---------------------------------------------------------------------------

export function GearRender({ item, size }: { item: GearItem; size: number }) {
  if (item.category === "pick")  return <PickRender item={item} size={size} />;
  if (item.category === "strap") return <StrapRender item={item} width={size * 2.2} />;
  return null;
}
