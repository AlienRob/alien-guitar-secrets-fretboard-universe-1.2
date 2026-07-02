import type wardrobeData from "@/data/wardrobe_items.json";

export type WardrobeCategory =
  | "hair"
  | "headwear"
  | "top"
  | "jacket"
  | "pants"
  | "boots"
  | "accessory"
  | "special_effect";

export type WardrobeRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface WardrobeItem {
  id: string;
  name: string;
  category: WardrobeCategory;
  layer: number;
  rarity: WardrobeRarity;
  unlock: string;
  asset: string;
}

export interface WardrobeEquipped {
  hair: string | null;
  headwear: string | null;
  top: string | null;
  jacket: string | null;
  pants: string | null;
  boots: string | null;
  accessory: string | null;
  special_effect: string | null;
}

export const DEFAULT_EQUIPPED: WardrobeEquipped = {
  hair: "hair_long_rocker",
  headwear: null,
  top: "top_black_ags_tshirt",
  jacket: null,
  pants: "pants_black_jeans",
  boots: "boots_black_stage",
  accessory: "accessory_silver_chain",
  special_effect: null,
};

const WARDROBE_KEY = "ags.wardrobe.v1";

export function loadWardrobe(): WardrobeEquipped {
  try {
    const raw = localStorage.getItem(WARDROBE_KEY);
    if (!raw) return { ...DEFAULT_EQUIPPED };
    return { ...DEFAULT_EQUIPPED, ...(JSON.parse(raw) as Partial<WardrobeEquipped>) };
  } catch {
    return { ...DEFAULT_EQUIPPED };
  }
}

export function saveWardrobe(equipped: WardrobeEquipped): void {
  try {
    localStorage.setItem(WARDROBE_KEY, JSON.stringify(equipped));
  } catch {
    // storage unavailable
  }
}

// Level required to unlock each progression tier.
const UNLOCK_LEVEL: Record<string, number> = {
  starter: 0,
  solar_system_2: 5,
  solar_system_3: 10,
  solar_system_4: 15,
  solar_system_5: 20,
  boss_reward: 8,
  hall_of_legends: 30,
};

export function isWardrobeItemUnlocked(item: WardrobeItem, level: number): boolean {
  const required = UNLOCK_LEVEL[item.unlock] ?? 0;
  return level >= required;
}

export function unlockDescription(unlock: string): string {
  switch (unlock) {
    case "starter": return "Available from the start";
    case "solar_system_2": return "Reach Level 5 (Solar System 2)";
    case "solar_system_3": return "Reach Level 10 (Solar System 3)";
    case "solar_system_4": return "Reach Level 15 (Solar System 4)";
    case "solar_system_5": return "Reach Level 20 (Solar System 5)";
    case "boss_reward": return "Defeat a Boss Battle";
    case "hall_of_legends": return "Reach the Hall of Legends (Level 30)";
    default: return "Keep playing to unlock";
  }
}

export const RARITY_STYLE: Record<WardrobeRarity, { label: string; color: string; glow: string; bg: string }> = {
  common:    { label: "Common",    color: "#9ca3af", glow: "rgba(156,163,175,0.25)", bg: "rgba(156,163,175,0.08)" },
  rare:      { label: "Rare",      color: "#60a5fa", glow: "rgba(96,165,250,0.30)",  bg: "rgba(96,165,250,0.08)" },
  epic:      { label: "Epic",      color: "#a78bfa", glow: "rgba(167,139,250,0.35)", bg: "rgba(167,139,250,0.10)" },
  legendary: { label: "Legendary", color: "#f3c14b", glow: "rgba(243,193,75,0.40)",  bg: "rgba(243,193,75,0.10)" },
  mythic:    { label: "Mythic",    color: "#f472b6", glow: "rgba(244,114,182,0.45)", bg: "rgba(244,114,182,0.12)" },
};

export const CATEGORY_LABEL: Record<WardrobeCategory, string> = {
  hair: "Hair",
  headwear: "Headwear",
  top: "Top",
  jacket: "Jacket",
  pants: "Pants",
  boots: "Boots",
  accessory: "Accessory",
  special_effect: "Special Effect",
};

// Category display order in the UI tabs.
export const CATEGORY_ORDER: WardrobeCategory[] = [
  "hair", "headwear", "top", "jacket", "pants", "boots", "accessory",
];

// Public asset path for a wardrobe item, respecting Vite's BASE_URL.
const basePath = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
export function wardrobeAssetUrl(asset: string): string {
  return `${basePath}/assets/wardrobe/${asset}`;
}
