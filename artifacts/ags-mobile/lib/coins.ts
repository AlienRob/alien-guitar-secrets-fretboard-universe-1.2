/**
 * Alien Coin economy constants and helpers.
 */

export const COINS_DRILL_BAD  = 10;  // <50% accuracy
export const COINS_DRILL_OK   = 20;  // 50–79% accuracy
export const COINS_DRILL_GREAT = 30; // >=80% accuracy
export const COINS_BOSS_WIN   = 150;
export const COINS_DUPLICATE_REFUND = 10; // per duplicate item in a bag

/** Compute coins earned from a drill based on correct / total answers. */
export function coinsForDrill(correct: number, total: number): number {
  const pct = total > 0 ? (correct / total) * 100 : 0;
  if (pct >= 80) return COINS_DRILL_GREAT;
  if (pct >= 50) return COINS_DRILL_OK;
  return COINS_DRILL_BAD;
}

export interface BagTierConfig {
  id: "standard" | "premium" | "elite" | "legendary" | "mythic";
  label: string;
  cost: number;
  itemCount: number; // guaranteed items
  itemCountMax: number;
  bagColor: string;  // which bag photo to use
  accentColor: string;
  oddsBlurb: string;
}

export const BAG_TIERS: BagTierConfig[] = [
  {
    id: "standard",
    label: "Standard Bag",
    cost: 50,
    itemCount: 1,
    itemCountMax: 2,
    bagColor: "blue",
    accentColor: "#60a5fa",
    oddsBlurb: "1–2 items · Picks, straps, coins & more",
  },
  {
    id: "premium",
    label: "Premium Bag",
    cost: 150,
    itemCount: 2,
    itemCountMax: 3,
    bagColor: "purple",
    accentColor: "#a855f7",
    oddsBlurb: "2–3 items · Rare & Epic · coins boosted",
  },
  {
    id: "elite",
    label: "Elite Bag",
    cost: 250,
    itemCount: 3,
    itemCountMax: 4,
    bagColor: "silver",
    accentColor: "#94a3b8",
    oddsBlurb: "3–4 items · Epic & Legendary focus",
  },
  {
    id: "legendary",
    label: "Legendary Bag",
    cost: 400,
    itemCount: 3,
    itemCountMax: 3,
    bagColor: "gold",
    accentColor: "#f59e0b",
    oddsBlurb: "3 items · Legendary guaranteed · big coin prizes",
  },
  {
    id: "mythic",
    label: "Mythic Bag",
    cost: 750,
    itemCount: 3,
    itemCountMax: 3,
    bagColor: "red",
    accentColor: "#ef4444",
    oddsBlurb: "3 items · Mythic possible · rarest gear",
  },
];
