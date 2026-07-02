/**
 * AvatarPreview — layered PNG avatar renderer.
 *
 * The container is a fixed 200×400 box. Each equipped wardrobe item renders
 * as an absolutely-positioned image at the correct body zone for its category.
 * Items are standalone transparent PNGs (just the item itself, no figure).
 * When an image hasn't been added yet the slot shows a translucent placeholder.
 */
import { useState } from "react";
import type { WardrobeItem, WardrobeEquipped } from "@/lib/wardrobe";
import { RARITY_STYLE, wardrobeAssetUrl } from "@/lib/wardrobe";

interface Props {
  equipped: WardrobeEquipped;
  items: WardrobeItem[];
  /** Optional base avatar image URL (overrides the SVG silhouette). */
  baseUrl?: string;
}

// Body-zone bounding box for each category, as % of the 200×400 container.
// Items are standalone PNGs so we must place them at the right body location.
const SLOT_BOUNDS: Record<string, { top: string; left: string; width: string; height: string }> = {
  hair:           { top: "3%",  left: "8%",  width: "84%", height: "26%" },
  headwear:       { top: "0%",  left: "12%", width: "76%", height: "22%" },
  top:            { top: "29%", left: "4%",  width: "92%", height: "26%" },
  jacket:         { top: "26%", left: "0%",  width: "100%",height: "36%" },
  pants:          { top: "52%", left: "8%",  width: "84%", height: "30%" },
  boots:          { top: "78%", left: "12%", width: "76%", height: "22%" },
  accessory:      { top: "26%", left: "22%", width: "56%", height: "16%" },
  special_effect: { top: "0%",  left: "0%",  width: "100%",height: "100%" },
};

// SVG silhouette shown when no base avatar PNG is present.
function Silhouette() {
  return (
    <svg
      viewBox="0 0 200 400"
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <ellipse cx="100" cy="200" rx="65" ry="155" fill="rgba(106,0,255,0.07)" />
      {/* Head */}
      <ellipse cx="100" cy="68" rx="38" ry="42" fill="#1a1145" stroke="#6A00FF" strokeWidth="1.5" />
      <ellipse cx="86" cy="65" rx="6" ry="4" fill="#00ffd5" opacity="0.7" />
      <ellipse cx="114" cy="65" rx="6" ry="4" fill="#00ffd5" opacity="0.7" />
      {/* Torso */}
      <path d="M45 120 Q30 140 32 220 L168 220 Q170 140 155 120 Q130 108 100 108 Q70 108 45 120Z"
        fill="#1a1145" stroke="#6A00FF" strokeWidth="1.5" />
      <rect x="60" y="212" width="80" height="14" rx="4" fill="#6A00FF" opacity="0.45" />
      {/* Arms */}
      <path d="M45 124 Q22 160 28 220 L50 215 Q46 165 60 130Z" fill="#1a1145" stroke="#6A00FF" strokeWidth="1.2" />
      <path d="M155 124 Q178 160 172 220 L150 215 Q154 165 140 130Z" fill="#1a1145" stroke="#6A00FF" strokeWidth="1.2" />
      {/* Legs */}
      <path d="M68 220 Q62 300 64 380 L96 380 Q98 300 100 226Z" fill="#1a1145" stroke="#6A00FF" strokeWidth="1.2" />
      <path d="M132 220 Q138 300 136 380 L104 380 Q102 300 100 226Z" fill="#1a1145" stroke="#6A00FF" strokeWidth="1.2" />
    </svg>
  );
}

function FallbackBand({ item }: { item: WardrobeItem }) {
  const style = RARITY_STYLE[item.rarity];
  const bounds = SLOT_BOUNDS[item.category] ?? SLOT_BOUNDS.special_effect;
  return (
    <div
      className="absolute flex items-center justify-center rounded pointer-events-none"
      style={{
        top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height,
        background: style.bg,
        border: `1px dashed ${style.color}55`,
        zIndex: item.layer,
      }}
    >
      <span className="text-[9px] font-mono uppercase tracking-widest truncate px-1" style={{ color: style.color }}>
        {item.name}
      </span>
    </div>
  );
}

function LayerImage({ item }: { item: WardrobeItem }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <FallbackBand item={item} />;
  const bounds = SLOT_BOUNDS[item.category] ?? SLOT_BOUNDS.special_effect;
  return (
    <img
      src={wardrobeAssetUrl(item.asset)}
      alt={item.name}
      onError={() => setFailed(true)}
      className="absolute pointer-events-none select-none object-contain"
      style={{
        top: bounds.top, left: bounds.left,
        width: bounds.width, height: bounds.height,
        zIndex: item.layer,
      }}
      draggable={false}
    />
  );
}

function BaseAvatar({ url }: { url?: string }) {
  const [failed, setFailed] = useState(false);
  if (!url || failed) return <Silhouette />;
  return (
    <img
      src={url}
      alt="Base avatar"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-contain pointer-events-none select-none"
      style={{ zIndex: 10 }}
      draggable={false}
    />
  );
}

export default function AvatarPreview({ equipped, items, baseUrl }: Props) {
  const activeLayers = Object.entries(equipped)
    .flatMap(([cat, id]) => {
      if (!id) return [];
      const item = items.find((it) => it.id === id && it.category === cat);
      return item ? [item] : [];
    })
    .sort((a, b) => a.layer - b.layer);

  return (
    <div
      className="relative mx-auto overflow-hidden rounded-2xl border border-primary/30 bg-[#05060f]"
      style={{ width: 200, height: 400 }}
      aria-label="Avatar preview"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 50% 40%, rgba(106,0,255,0.14) 0%, transparent 70%)" }}
      />
      <BaseAvatar url={baseUrl} />
      {activeLayers.map((item) => (
        <LayerImage key={item.id} item={item} />
      ))}
      <div
        className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(106,0,255,0.18), transparent)" }}
      />
    </div>
  );
}
