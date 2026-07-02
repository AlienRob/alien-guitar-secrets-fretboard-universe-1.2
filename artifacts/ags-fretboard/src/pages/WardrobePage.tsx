import { useEffect, useMemo, useState } from "react";
import { Check, Shirt } from "lucide-react";
import { useGetProfileSummary, useGetProfile } from "@workspace/api-client-react";
import wardrobeData from "@/data/wardrobe_items.json";
import {
  type WardrobeItem,
  type WardrobeEquipped,
  type WardrobeCategory,
  DEFAULT_EQUIPPED,
  loadWardrobe,
  saveWardrobe,
  isWardrobeItemUnlocked,
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  RARITY_STYLE,
} from "@/lib/wardrobe";
import { effectiveUnlockLevel } from "@/lib/access";
import AvatarPreview from "@/components/AvatarPreview";
import WardrobeItemCard from "@/components/WardrobeItemCard";

const ALL_ITEMS = wardrobeData.items as WardrobeItem[];

// Slot label + emoji shown in the "Equipped" summary panel.
const SLOT_META: { slot: keyof WardrobeEquipped; label: string; icon: string }[] = [
  { slot: "hair",          label: "Hair",          icon: "💇" },
  { slot: "headwear",      label: "Headwear",       icon: "🎩" },
  { slot: "top",           label: "Top",            icon: "👕" },
  { slot: "jacket",        label: "Jacket",         icon: "🧥" },
  { slot: "pants",         label: "Pants",          icon: "👖" },
  { slot: "boots",         label: "Boots",          icon: "👢" },
  { slot: "accessory",     label: "Accessory",      icon: "📿" },
  { slot: "special_effect",label: "Special Effect", icon: "✨" },
];

export default function WardrobePage() {
  const { data: summary } = useGetProfileSummary();
  const { data: profile } = useGetProfile();

  const level = summary?.level ?? profile?.level ?? 0;
  const fullAccess = summary?.fullAccess ?? false;
  const unlockLevel = effectiveUnlockLevel(level, fullAccess);

  const [equipped, setEquipped] = useState<WardrobeEquipped>(DEFAULT_EQUIPPED);
  const [activeCategory, setActiveCategory] = useState<WardrobeCategory>("hair");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setEquipped(loadWardrobe());
  }, []);

  const categoryItems = useMemo(
    () => ALL_ITEMS.filter((it) => it.category === activeCategory),
    [activeCategory],
  );

  const equip = (id: string) => {
    const item = ALL_ITEMS.find((it) => it.id === id);
    if (!item) return;
    setEquipped((prev) => ({
      ...prev,
      [item.category]: id,
    }));
    setSaved(false);
  };

  const unequip = (id: string) => {
    const item = ALL_ITEMS.find((it) => it.id === id);
    if (!item) return;
    setEquipped((prev) => ({
      ...prev,
      [item.category]: null,
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveWardrobe(equipped);
    setSaved(true);
  };

  const unlockedCount = ALL_ITEMS.filter((it) => isWardrobeItemUnlocked(it, unlockLevel)).length;

  return (
    <div className="min-h-screen p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-accent" />
            <h1 className="text-sm font-sans font-bold uppercase tracking-widest text-secondary">
              Wardrobe
            </h1>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {unlockedCount} of {ALL_ITEMS.length} items unlocked · Level {level}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-all ${
            saved
              ? "border border-accent/40 bg-accent/10 text-accent"
              : "bg-primary text-primary-foreground hover:bg-primary/80"
          }`}
        >
          {saved ? <><Check className="h-4 w-4" /> Saved</> : "Save outfit"}
        </button>
      </div>

      {/* Main layout: preview + grid */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">

        {/* Left: avatar preview + equipped summary */}
        <div className="flex shrink-0 flex-col items-center gap-4 lg:w-56">
          <AvatarPreview equipped={equipped} items={ALL_ITEMS} />

          {/* Equipped summary */}
          <div className="w-full rounded-xl border border-primary/25 bg-card/40 p-3 backdrop-blur">
            <p className="mb-2 text-[10px] font-mono uppercase tracking-widest text-primary">
              Current outfit
            </p>
            <div className="space-y-1.5">
              {SLOT_META.filter((m) => m.slot !== "special_effect").map(({ slot, label, icon }) => {
                const id = equipped[slot];
                const item = id ? ALL_ITEMS.find((it) => it.id === id) : null;
                const rarity = item ? RARITY_STYLE[item.rarity] : null;
                return (
                  <div key={slot} className="flex items-center gap-2 text-xs">
                    <span className="w-4 shrink-0 text-center text-[12px]">{icon}</span>
                    <span className="w-14 shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {label}
                    </span>
                    {item ? (
                      <span
                        className="truncate text-[11px] font-semibold"
                        style={{ color: rarity?.color ?? "#fff" }}
                      >
                        {item.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground/50">—</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: category tabs + item grid */}
        <div className="min-w-0 flex-1">
          {/* Category tabs */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {CATEGORY_ORDER.map((cat) => {
              const count = ALL_ITEMS.filter(
                (it) => it.category === cat && isWardrobeItemUnlocked(it, unlockLevel),
              ).length;
              const total = ALL_ITEMS.filter((it) => it.category === cat).length;
              const isActive = cat === activeCategory;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`flex shrink-0 flex-col items-center rounded-lg border px-3 py-2 text-[11px] font-semibold uppercase tracking-widest transition-all ${
                    isActive
                      ? "border-accent bg-accent/15 text-accent alien-glow-cyan"
                      : "border-primary/30 bg-card/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
                  }`}
                >
                  <span>{CATEGORY_LABEL[cat]}</span>
                  <span className={`mt-0.5 text-[9px] ${isActive ? "text-accent/70" : "text-muted-foreground/60"}`}>
                    {count}/{total}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Item grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
            {categoryItems.map((item) => {
              const unlocked = isWardrobeItemUnlocked(item, unlockLevel);
              const isEquipped = equipped[item.category as keyof WardrobeEquipped] === item.id;
              return (
                <WardrobeItemCard
                  key={item.id}
                  item={item}
                  unlocked={unlocked}
                  equipped={isEquipped}
                  onEquip={equip}
                  onUnequip={unequip}
                />
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
