import type { ImageSourcePropType } from "react-native";

// ── Rarity ─────────────────────────────────────────────────────────────────────
export type WardrobeRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const RARITY_COLOR: Record<WardrobeRarity, string> = {
  common:    "#9ca3af",
  rare:      "#60a5fa",
  epic:      "#a855f7",
  legendary: "#f59e0b",
  mythic:    "#ec4899",
};

// ── Layer system ───────────────────────────────────────────────────────────────
// Three independent layers, each a full-body image rendered in a fixed pose.
// The app clips each layer to its body region and stacks them so the player
// can freely mix any hair + outfit + boots combination.
//
export type LayerCategory = "hair" | "outfit" | "boots";

export interface LayerItem {
  id: string;
  name: string;
  category: LayerCategory;
  rarity: WardrobeRarity;
  male: ImageSourcePropType;
  female: ImageSourcePropType;
}

// ── Hair items ─────────────────────────────────────────────────────────────────
export const HAIR_ITEMS: LayerItem[] = [
  {
    id: "hair_1", name: "Bald", category: "hair", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_hair_1.png"),
    female: require("@/assets/wardrobe/layers/v3/female_hair_1.png"),
  },
  {
    id: "hair_2", name: "Dark Rocker", category: "hair", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_hair_2.png"),
    female: require("@/assets/wardrobe/layers/v3/female_hair_2.png"),
  },
  {
    id: "hair_3", name: "Blonde Undercut", category: "hair", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_hair_3.png"),
    female: require("@/assets/wardrobe/layers/v3/female_hair_3.png"),
  },
  {
    id: "hair_4", name: "Space Mohawk", category: "hair", rarity: "rare",
    male:   require("@/assets/wardrobe/layers/v3/male_hair_4.png"),
    female: require("@/assets/wardrobe/layers/v3/female_hair_4.png"),
  },
  {
    id: "hair_5", name: "Viking Braids", category: "hair", rarity: "rare",
    male:   require("@/assets/wardrobe/layers/v3/male_hair_5.png"),
    female: require("@/assets/wardrobe/layers/v3/female_hair_5.png"),
  },
];

// ── Outfit items ───────────────────────────────────────────────────────────────
export const OUTFIT_ITEMS: LayerItem[] = [
  {
    id: "outfit_1", name: "Black Leather", category: "outfit", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_outfit_1.png"),
    female: require("@/assets/wardrobe/layers/v3/female_outfit_1.png"),
  },
  {
    id: "outfit_2", name: "Band Tee", category: "outfit", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_outfit_2.png"),
    female: require("@/assets/wardrobe/layers/v3/female_outfit_2.png"),
  },
  {
    id: "outfit_3", name: "Metallic", category: "outfit", rarity: "rare",
    male:   require("@/assets/wardrobe/layers/v3/male_outfit_3.png"),
    female: require("@/assets/wardrobe/layers/v3/female_outfit_3.png"),
  },
  {
    id: "outfit_4", name: "Denim", category: "outfit", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_outfit_4.png"),
    female: require("@/assets/wardrobe/layers/v3/female_outfit_4.png"),
  },
  {
    id: "outfit_5", name: "Stage Star", category: "outfit", rarity: "rare",
    male:   require("@/assets/wardrobe/layers/v3/male_outfit_5.png"),
    female: require("@/assets/wardrobe/layers/v3/female_outfit_5.png"),
  },
];

// ── Boots items ────────────────────────────────────────────────────────────────
export const BOOTS_ITEMS: LayerItem[] = [
  {
    id: "boots_1", name: "Combat", category: "boots", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_boots_1.png"),
    female: require("@/assets/wardrobe/layers/v3/female_boots_1.png"),
  },
  {
    id: "boots_2", name: "Lace-Up", category: "boots", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_boots_2.png"),
    female: require("@/assets/wardrobe/layers/v3/female_boots_2.png"),
  },
  {
    id: "boots_3", name: "Chelsea", category: "boots", rarity: "common",
    male:   require("@/assets/wardrobe/layers/v3/male_boots_3.png"),
    female: require("@/assets/wardrobe/layers/v3/female_boots_3.png"),
  },
  {
    id: "boots_4", name: "Platform", category: "boots", rarity: "rare",
    male:   require("@/assets/wardrobe/layers/v3/male_boots_4.png"),
    female: require("@/assets/wardrobe/layers/v3/female_boots_4.png"),
  },
  {
    id: "boots_5", name: "Gold Stage", category: "boots", rarity: "epic",
    male:   require("@/assets/wardrobe/layers/v3/male_boots_5.png"),
    female: require("@/assets/wardrobe/layers/v3/female_boots_5.png"),
  },
];

export const ALL_LAYER_ITEMS: LayerItem[] = [
  ...HAIR_ITEMS,
  ...OUTFIT_ITEMS,
  ...BOOTS_ITEMS,
];

export function layerItemById(id: string | null | undefined, category: LayerCategory): LayerItem {
  const pool = category === "hair" ? HAIR_ITEMS : category === "outfit" ? OUTFIT_ITEMS : BOOTS_ITEMS;
  return pool.find((i) => i.id === id) ?? pool[0];
}
