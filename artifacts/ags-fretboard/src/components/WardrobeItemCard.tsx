import { useState } from "react";
import { Check, Lock } from "lucide-react";
import type { WardrobeItem } from "@/lib/wardrobe";
import { RARITY_STYLE, wardrobeAssetUrl, unlockDescription } from "@/lib/wardrobe";

interface Props {
  item: WardrobeItem;
  unlocked: boolean;
  equipped: boolean;
  onEquip: (id: string) => void;
  onUnequip: (id: string) => void;
}

export default function WardrobeItemCard({ item, unlocked, equipped, onEquip, onUnequip }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const rarity = RARITY_STYLE[item.rarity];

  return (
    <div
      className="relative flex flex-col rounded-xl border transition-all duration-200"
      style={{
        borderColor: equipped ? rarity.color : "rgba(106,0,255,0.25)",
        background: equipped ? rarity.bg : "rgba(10,12,26,0.7)",
        boxShadow: equipped ? `0 0 14px ${rarity.glow}` : "none",
        opacity: unlocked ? 1 : 0.55,
      }}
    >
      {/* Rarity label */}
      <div
        className="rounded-t-xl px-2 py-1 text-center font-mono text-[9px] uppercase tracking-widest"
        style={{ color: rarity.color, background: rarity.bg }}
      >
        {rarity.label}
      </div>

      {/* Art / placeholder */}
      <div
        className="relative flex h-24 items-center justify-center overflow-hidden border-y border-primary/15 bg-black/30"
        style={equipped ? { boxShadow: `inset 0 0 20px ${rarity.glow}` } : undefined}
      >
        {!imgFailed ? (
          <img
            src={wardrobeAssetUrl(item.asset)}
            alt={item.name}
            onError={() => setImgFailed(true)}
            className="h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="flex flex-col items-center gap-1 px-2 text-center">
            <div
              className="h-10 w-10 rounded-full border-2 flex items-center justify-center text-lg"
              style={{ borderColor: rarity.color, background: rarity.bg, color: rarity.color }}
            >
              {CATEGORY_ICON[item.category] ?? "✦"}
            </div>
          </div>
        )}

        {/* Locked overlay */}
        {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/55 backdrop-blur-[1px]">
            <Lock className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        {/* Equipped check badge */}
        {equipped && (
          <div
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full"
            style={{ background: rarity.color }}
          >
            <Check className="h-3 w-3 text-black" />
          </div>
        )}
      </div>

      {/* Name + action */}
      <div className="flex flex-col gap-1.5 p-2">
        <p className="text-center text-xs font-semibold leading-tight text-foreground">{item.name}</p>

        {unlocked ? (
          <button
            type="button"
            onClick={() => equipped ? onUnequip(item.id) : onEquip(item.id)}
            className="w-full rounded-md py-1.5 text-[11px] font-bold uppercase tracking-widest transition-all"
            style={
              equipped
                ? { background: rarity.bg, color: rarity.color, border: `1px solid ${rarity.color}55` }
                : { background: "rgba(106,0,255,0.18)", color: "#c4b5fd", border: "1px solid rgba(106,0,255,0.4)" }
            }
          >
            {equipped ? "Equipped" : "Equip"}
          </button>
        ) : (
          <p className="text-center text-[9px] leading-tight text-muted-foreground">
            {unlockDescription(item.unlock)}
          </p>
        )}
      </div>
    </div>
  );
}

const CATEGORY_ICON: Record<string, string> = {
  hair:          "💇",
  headwear:      "🎩",
  top:           "👕",
  jacket:        "🧥",
  pants:         "👖",
  boots:         "👢",
  accessory:     "📿",
  special_effect:"✨",
};
