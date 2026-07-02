import { useId } from "react";

import { type GearItem } from "@/data/gear";
import agsLogo from "@assets/AGS_Pick_Template__Eyes_Green_1780383489732.png";

// On-brand artwork for each collectible gear item. Picks, straps and cables are
// drawn procedurally from the item's colours/finish; pedals and amps render
// real photo-style (background-removed) PNG artwork via the item's `image`.
// Gradient ids are suffixed with the item id to avoid collisions when many
// thumbs render on the same page.

// Picks additionally carry the Alien Guitar Secrets logo, stamped through an
// alpha mask in a colour that contrasts with the pick so the brand always reads.
function stampColorFor(hex: string): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return "#ffffff";
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#0b0b14" : "#ffffff";
}

function PickArt({ item }: { item: Extract<GearItem, { category: "pick" }> }) {
  // Namespace all gradient/mask/clip ids per render instance so the same pick
  // shown twice (e.g. list + detail modal) cannot collide on SVG def ids.
  const uid = `${item.id}-${useId().replace(/:/g, "")}`;
  const stamp = stampColorFor(item.color);
  // Silhouette traced from the user's uploaded 3D pick model (ags-pick.glb) so
  // this flat cover matches the spinning 3D pick exactly (same outline). The
  // outline was projected from the model's wide face and fitted, aspect-correct,
  // into the same ~13..87 x / 6..96 y box the old teardrop used, so the logo
  // mask, sheen and finish overlays below still line up.
  const path =
    "M13.35 30.91 L14.38 38.5 L17.43 48.2 L21.92 59.2 L27.47 70.02 L34.06 80.56 L40.71 89.41 L45.9 94.46 L49.87 96 L54.05 94.49 L58.73 90.05 L65.76 80.81 L72.28 70.43 L78.08 59.19 L82.6 48.11 L85.8 37.77 L86.65 31.15 L86.11 25.61 L84.33 20.42 L81.43 15.79 L77.71 12.26 L73.48 9.97 L66.48 7.79 L50.93 6 L34.99 7.46 L27.48 9.59 L22.67 11.99 L18.94 15.34 L15.93 19.9 L13.96 25.29 L13.35 30.63 Z";
  let fill = item.color;
  const defs: React.ReactNode[] = [];

  if (item.finish === "holographic") {
    fill = `url(#holo-${uid})`;
    defs.push(
      <linearGradient key="g" id={`holo-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ff5fa2" />
        <stop offset="30%" stopColor={item.color} />
        <stop offset="60%" stopColor={item.color2 ?? "#00e5ff"} />
        <stop offset="100%" stopColor="#a7ff5f" />
      </linearGradient>,
    );
  } else if (item.finish === "foil") {
    fill = `url(#foil-${uid})`;
    defs.push(
      <linearGradient key="g" id={`foil-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="35%" stopColor={item.color} />
        <stop offset="55%" stopColor="#6b7280" />
        <stop offset="75%" stopColor={item.color} />
        <stop offset="100%" stopColor="#e5e7eb" />
      </linearGradient>,
    );
  } else if (item.finish === "pearl") {
    fill = `url(#pearl-${uid})`;
    defs.push(
      <radialGradient key="g" id={`pearl-${uid}`} cx="38%" cy="32%" r="75%">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="45%" stopColor={item.color} />
        <stop offset="100%" stopColor={item.color2 ?? "#60a5fa"} />
      </radialGradient>,
    );
  } else if (item.finish === "neon") {
    fill = `url(#neon-${uid})`;
    defs.push(
      <linearGradient key="g" id={`neon-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor={item.color} />
        <stop offset="100%" stopColor={item.color2 ?? item.color} />
      </linearGradient>,
    );
  } else if (item.finish === "galaxy") {
    fill = `url(#galaxy-${uid})`;
    defs.push(
      <radialGradient key="g" id={`galaxy-${uid}`} cx="42%" cy="36%" r="80%">
        <stop offset="0%" stopColor={item.color2 ?? "#00e5ff"} />
        <stop offset="45%" stopColor={item.color} />
        <stop offset="100%" stopColor="#05060f" />
      </radialGradient>,
    );
  } else if (item.finish === "carbon") {
    fill = `url(#carbon-${uid})`;
    defs.push(
      <pattern key="g" id={`carbon-${uid}`} width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="9" height="9" fill={item.color} />
        <rect width="4.5" height="4.5" fill={item.color2 ?? "#2b3242"} />
        <rect x="4.5" y="4.5" width="4.5" height="4.5" fill={item.color2 ?? "#2b3242"} />
      </pattern>,
    );
  } else if (item.finish === "marble") {
    fill = `url(#marble-${uid})`;
    defs.push(
      <linearGradient key="g" id={`marble-${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="55%" stopColor={item.color} />
        <stop offset="100%" stopColor={item.color} />
      </linearGradient>,
    );
  }

  // Logo stamp resources: an alpha mask cut from the AGS logo plus a clip to the
  // pick outline. Kept in <defs> so the references are robust across browsers.
  defs.push(
    <clipPath key="lclip" id={`lclip-${uid}`}>
      <path d={path} />
    </clipPath>,
    <mask
      key="logo"
      id={`logo-${uid}`}
      maskUnits="userSpaceOnUse"
      x="0"
      y="0"
      width="100"
      height="102"
      style={{ maskType: "alpha" }}
    >
      <image href={agsLogo} x="22" y="27" width="56" height="44" preserveAspectRatio="xMidYMid meet" />
    </mask>,
  );

  return (
    <svg viewBox="0 0 100 102" className="h-full w-full" aria-hidden>
      <defs>{defs}</defs>
      <path
        d={path}
        fill={fill}
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
        style={
          item.finish === "neon"
            ? { filter: `drop-shadow(0 0 6px ${item.color})` }
            : undefined
        }
      />
      {item.finish === "prism" && (
        <g clipPath={`url(#clip-${uid})`}>
          <clipPath id={`clip-${uid}`}>
            <path d={path} />
          </clipPath>
          {["#f43f5e", "#f59e0b", "#22d3ee", "#a78bfa"].map((c, i) => (
            <rect key={c} x={6 + i * 22} y="0" width="22" height="102" fill={c} opacity="0.85" />
          ))}
        </g>
      )}
      {item.finish === "glitter" &&
        Array.from({ length: 22 }).map((_, i) => (
          <circle
            key={i}
            cx={20 + ((i * 37) % 60)}
            cy={18 + ((i * 53) % 70)}
            r={i % 3 === 0 ? 1.8 : 1.1}
            fill="#ffffff"
            opacity={0.85}
          />
        ))}
      {item.finish === "galaxy" &&
        Array.from({ length: 16 }).map((_, i) => (
          <circle
            key={`gx${i}`}
            cx={20 + ((i * 41) % 60)}
            cy={16 + ((i * 47) % 72)}
            r={i % 4 === 0 ? 1.6 : 0.8}
            fill="#ffffff"
            opacity={0.85}
          />
        ))}
      {item.finish === "marble" && (
        <g clipPath={`url(#mclip-${uid})`}>
          <clipPath id={`mclip-${uid}`}>
            <path d={path} />
          </clipPath>
          <path d="M16 66 C34 50 44 60 58 40 C68 26 78 30 88 20" stroke={item.color2 ?? "#c026d3"} strokeWidth="2.2" fill="none" opacity="0.55" />
          <path d="M12 48 C30 44 40 28 58 24 C70 21 80 16 90 12" stroke={item.color2 ?? "#c026d3"} strokeWidth="1.3" fill="none" opacity="0.4" />
          <path d="M22 88 C30 72 48 74 60 62" stroke={item.color2 ?? "#c026d3"} strokeWidth="1.1" fill="none" opacity="0.35" />
        </g>
      )}
      {/* highlight sheen */}
      <ellipse cx="40" cy="30" rx="14" ry="9" fill="rgba(255,255,255,0.25)" />
      {/* Alien Guitar Secrets logo stamp, recoloured to contrast with the pick */}
      <g clipPath={`url(#lclip-${uid})`}>
        <rect x="0" y="0" width="100" height="102" fill={stamp} mask={`url(#logo-${uid})`} opacity="0.92" />
      </g>
    </svg>
  );
}

function CoinArt({ item }: { item: Extract<GearItem, { category: "coin" }> }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1">
      <img src={`${import.meta.env.BASE_URL}gear/coins.png`} alt="Alien Coins" className="h-10 w-10 object-contain" draggable={false} />
      <span className="text-xs font-bold text-amber-400">+{item.coinAmount}</span>
    </div>
  );
}

function StrapArt({ item }: { item: Extract<GearItem, { category: "strap" }> }) {
  if (item.image) {
    return <img src={item.image} alt={item.name} className="h-full w-full object-contain" draggable={false} />;
  }
  const uid = `${item.id}-${useId().replace(/:/g, "")}`;
  const accent = item.color2 ?? "#ffffff";
  const clip = `bandclip-${uid}`;
  const defs: React.ReactNode[] = [
    <linearGradient key="base" id={`strap-${uid}`} x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stopColor={item.color} stopOpacity="0.78" />
      <stop offset="45%" stopColor={item.color} />
      <stop offset="100%" stopColor={item.color} stopOpacity="0.7" />
    </linearGradient>,
    <clipPath key="clip" id={clip}>
      <rect x="38" y="10" width="24" height="82" rx="5" />
    </clipPath>,
  ];

  let baseFill = `url(#strap-${uid})`;

  if (item.pattern === "tiedye") {
    baseFill = `url(#tiedye-${uid})`;
    defs.push(
      <radialGradient key="td" id={`tiedye-${uid}`} cx="50%" cy="40%" r="75%">
        <stop offset="0%" stopColor="#fff27a" />
        <stop offset="30%" stopColor={accent} />
        <stop offset="62%" stopColor={item.color} />
        <stop offset="100%" stopColor="#ff3ea5" />
      </radialGradient>,
    );
  } else if (item.pattern === "rainbow") {
    baseFill = `url(#rainbow-${uid})`;
    defs.push(
      <linearGradient key="rb" id={`rainbow-${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff3b30" />
        <stop offset="20%" stopColor="#ff9500" />
        <stop offset="40%" stopColor="#ffe600" />
        <stop offset="58%" stopColor="#34d399" />
        <stop offset="78%" stopColor="#22d3ee" />
        <stop offset="100%" stopColor="#a855f7" />
      </linearGradient>,
    );
  } else if (item.pattern === "flames") {
    defs.push(
      <linearGradient key="fl" id={`flame-${uid}`} x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#ffd60a" />
        <stop offset="50%" stopColor={accent} />
        <stop offset="100%" stopColor="#ff1f1f" />
      </linearGradient>,
    );
  }

  return (
    <svg viewBox="0 0 100 102" className="h-full w-full" aria-hidden>
      <defs>{defs}</defs>
      {/* end tabs */}
      <rect x="34" y="6" width="32" height="12" rx="3" fill="#0f1424" stroke="rgba(255,255,255,0.2)" />
      <rect x="34" y="84" width="32" height="12" rx="3" fill="#0f1424" stroke="rgba(255,255,255,0.2)" />
      {/* main band */}
      <rect x="38" y="10" width="24" height="82" rx="5" fill={baseFill} stroke="rgba(255,255,255,0.25)" />

      <g clipPath={`url(#${clip})`}>
        {item.pattern === "stripes" && (
          <>
            <rect x="42" y="10" width="4" height="82" fill={accent} opacity="0.95" />
            <rect x="48" y="10" width="4" height="82" fill="#ffffff" opacity="0.5" />
            <rect x="54" y="10" width="4" height="82" fill={accent} opacity="0.95" />
          </>
        )}
        {item.pattern === "woven" &&
          Array.from({ length: 18 }).flatMap((_, i) => [
            <line key={`a${i}`} x1="38" y1={12 + i * 5} x2="62" y2={16 + i * 5} stroke={accent} strokeWidth="1.2" opacity="0.6" />,
            <line key={`b${i}`} x1="62" y1={12 + i * 5} x2="38" y2={16 + i * 5} stroke="#ffffff" strokeWidth="0.7" opacity="0.25" />,
          ])}
        {item.pattern === "leather" && (
          <>
            <rect x="41" y="13" width="18" height="76" rx="3" fill="none" stroke="rgba(0,0,0,0.45)" strokeDasharray="2 3" />
            {Array.from({ length: 6 }).map((_, i) => (
              <circle key={i} cx={i % 2 ? 46 : 54} cy={20 + i * 12} r="1.8" fill="rgba(0,0,0,0.35)" />
            ))}
          </>
        )}
        {item.pattern === "cosmic" &&
          Array.from({ length: 16 }).map((_, i) => (
            <circle key={i} cx={42 + ((i * 17) % 16)} cy={14 + ((i * 41) % 76)} r={i % 4 === 0 ? 1.8 : 0.9} fill={accent} opacity="0.9" />
          ))}
        {item.pattern === "chevron" &&
          Array.from({ length: 8 }).map((_, i) => (
            <polyline key={i} points={`40,${14 + i * 10} 50,${19 + i * 10} 60,${14 + i * 10}`} fill="none" stroke={accent} strokeWidth="2.6" opacity="0.95" />
          ))}
        {item.pattern === "diamond" &&
          Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="46" y={14 + i * 10} width="8" height="8" fill="none" stroke={accent} strokeWidth="1.6" opacity="0.9" transform={`rotate(45 50 ${18 + i * 10})`} />
          ))}
        {item.pattern === "studded" &&
          Array.from({ length: 8 }).flatMap((_, i) =>
            [44, 56].map((x) => (
              <g key={`${i}-${x}`}>
                <circle cx={x} cy={16 + i * 9} r="2.3" fill={accent} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5" />
                <circle cx={x - 0.6} cy={15.4 + i * 9} r="0.7" fill="#ffffff" opacity="0.8" />
              </g>
            )),
          )}
        {item.pattern === "flames" &&
          [12, 32, 52, 72].map((y, i) => (
            <path
              key={i}
              d={`M38 ${y + 16} C42 ${y + 6} 46 ${y + 10} 48 ${y} C50 ${y + 9} 54 ${y + 5} 56 ${y + 12} C60 ${y + 7} 61 ${y + 12} 62 ${y + 16} Z`}
              fill={`url(#flame-${uid})`}
              opacity="0.95"
            />
          ))}
        {item.pattern === "leopard" &&
          Array.from({ length: 12 }).map((_, i) => {
            const cx = 43 + ((i * 7) % 14);
            const cy = 15 + ((i * 23) % 74);
            return (
              <g key={i}>
                <ellipse cx={cx} cy={cy} rx="3" ry="2.4" fill="none" stroke={accent} strokeWidth="1.4" />
                <circle cx={cx} cy={cy} r="0.9" fill={accent} />
              </g>
            );
          })}
        {item.pattern === "lightning" &&
          [46, 54].map((x, i) => (
            <polyline
              key={i}
              points={`${x},12 ${x - 4},34 ${x + 2},38 ${x - 5},66 ${x + 1},70 ${x - 3},90`}
              fill="none"
              stroke={accent}
              strokeWidth="2.2"
              opacity="0.95"
              style={{ filter: `drop-shadow(0 0 2px ${accent})` }}
            />
          ))}
        {item.pattern === "zebra" &&
          Array.from({ length: 11 }).map((_, i) => (
            <path
              key={i}
              d={`M38 ${10 + i * 8} q6 4 12 0 t12 0`}
              fill="none"
              stroke={item.color2 ?? "#0a0a0f"}
              strokeWidth={i % 2 ? 4 : 2.5}
              opacity="0.92"
            />
          ))}
        {item.pattern === "tiedye" &&
          Array.from({ length: 4 }).map((_, i) => (
            <circle key={i} cx="50" cy="41" r={8 + i * 7} fill="none" stroke="#ffffff" strokeWidth="0.8" opacity={0.4 - i * 0.07} />
          ))}
        {/* sheen */}
        <rect x="40" y="10" width="4" height="82" fill="#ffffff" opacity="0.14" />
      </g>
      {/* buckle */}
      <rect x="36" y="46" width="28" height="4" rx="2" fill="#c0c6d6" opacity="0.8" />
    </svg>
  );
}

// Pedals are now real photo-style artwork (background-removed PNGs), so the
// thumb just renders the item's image. `object-contain` keeps the portrait
// pedal shape intact inside square/landscape gear slots.
function PedalArt({ item }: { item: Extract<GearItem, { category: "pedal" }> }) {
  return <img src={item.image} alt={item.name} className="h-full w-full object-contain" draggable={false} />;
}

// Amps are now real photo-style artwork (background-removed PNGs), so the thumb
// just renders the item's image. `object-contain` keeps the amp/stack shape
// intact inside square/landscape gear slots.
function AmpArt({ item }: { item: Extract<GearItem, { category: "amp" }> }) {
  return <img src={item.image} alt={item.name} className="h-full w-full object-contain" draggable={false} />;
}

function CableArt({ item }: { item: Extract<GearItem, { category: "cable" }> }) {
  return (
    <img
      src={item.image}
      alt={item.name}
      className="h-full w-full object-contain"
      draggable={false}
    />
  );
}

export default function GearThumb({
  item,
  className,
}: {
  item: GearItem;
  className?: string;
}) {
  return (
    <div className={className}>
      {item.category === "pick"   && <PickArt item={item} />}
      {item.category === "strap"  && <StrapArt item={item} />}
      {item.category === "pedal"  && <PedalArt item={item} />}
      {item.category === "amp"    && <AmpArt item={item} />}
      {item.category === "cable"  && <CableArt item={item} />}
      {item.category === "coin"   && <CoinArt item={item} />}
    </div>
  );
}
