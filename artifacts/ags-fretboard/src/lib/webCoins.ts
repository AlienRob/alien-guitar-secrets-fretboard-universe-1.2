/**
 * Coin award amounts for the web app.
 * Mirrors the mobile lib/coins.ts values — keep them in sync.
 */

export const COINS_DRILL_BAD   = 10;  // <50% accuracy
export const COINS_DRILL_OK    = 20;  // 50–79% accuracy
export const COINS_DRILL_GREAT = 30;  // >=80% accuracy
export const COINS_BOSS_WIN    = 150;
export const COINS_DUPLICATE_REFUND = 10;

/** Compute coins earned from a drill based on accuracy percentage. */
export function coinsForDrillAcc(accuracyPct: number): number {
  if (accuracyPct >= 80) return COINS_DRILL_GREAT;
  if (accuracyPct >= 50) return COINS_DRILL_OK;
  return COINS_DRILL_BAD;
}

export interface WebBagTier {
  id: "standard" | "premium" | "legendary";
  label: string;
  cost: number;
  itemCountMin: number;
  itemCountMax: number;
  accentColor: string;
  borderColor: string;
  oddsBlurb: string;
}

export const WEB_BAG_TIERS: WebBagTier[] = [
  {
    id: "standard",
    label: "Standard Bag",
    cost: 50,
    itemCountMin: 1,
    itemCountMax: 2,
    accentColor: "#60a5fa",
    borderColor: "#3b82f640",
    oddsBlurb: "1–2 items · Common & Rare",
  },
  {
    id: "premium",
    label: "Premium Bag",
    cost: 150,
    itemCountMin: 2,
    itemCountMax: 3,
    accentColor: "#a855f7",
    borderColor: "#a855f740",
    oddsBlurb: "2–3 items · Rare & Epic boosted",
  },
  {
    id: "legendary",
    label: "Legendary Bag",
    cost: 400,
    itemCountMin: 3,
    itemCountMax: 3,
    accentColor: "#f59e0b",
    borderColor: "#f59e0b40",
    oddsBlurb: "3 items · Legendary guaranteed",
  },
];
