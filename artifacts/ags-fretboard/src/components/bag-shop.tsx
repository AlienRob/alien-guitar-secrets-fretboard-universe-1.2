/**
 * Web Bag Shop — lets players spend Alien Coins to open mystery gear bags.
 * Shows 3 tiers; when opened, the bag case animates open with a zipper sweep,
 * then cards burst out and fly to multi-row positions. Tap each to flip and reveal.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { RARITY_META } from "@/data/guitars";
import {
  gearByCategory,
  type GearCategory,
  type GearItem,
} from "@/data/gear";
import GearThumb from "@/components/gear-thumb";
import GearDetailModal from "@/components/gear-detail-modal";
import { CoinFlyOverlay } from "@/components/coin-fly";
import {
  loadAlienCoins,
  spendAlienCoins,
  addAlienCoins,
  loadEarnedGear,
  addEarnedGear,
} from "@/lib/playerCustomization";
import {
  WEB_BAG_TIERS,
  type WebBagTier,
  COINS_DUPLICATE_REFUND,
} from "@/lib/webCoins";

// ── Layout geometry ───────────────────────────────────────────────────────────
// These constants drive the card-layout math (SEAM_Y_IN_CTR = vertical origin
// for makeCards). The bag/seam/zip geometry is derived from the original bag
// images but SEAM_Y_IN_CTR itself is still used to position card rows.
const BAG_W          = 320;
const CLOSED_ASPECT  = 460 / 1536;
const OPEN_ASPECT    = 510 / 1536;
const BAG_H_CL       = Math.round(BAG_W * CLOSED_ASPECT); // 96
const BAG_H_OP       = Math.round(BAG_W * OPEN_ASPECT);   // 106
const SEAM_RIGHT_Y   = BAG_H_CL * 0.37;
const SEAM_LEFT_Y    = BAG_H_CL * 0.20;
const SEAM_CY        = (SEAM_RIGHT_Y + SEAM_LEFT_Y) / 2;
const PAD_TOP        = 160;
const SEAM_Y_IN_CTR  = PAD_TOP + (BAG_H_OP - BAG_H_CL) + SEAM_CY; // ≈ 187px

// ── Card layout ───────────────────────────────────────────────────────────────
const CARD_W = 88;
const CARD_H = 124;
const GAP_X  = 20;

/** Scale card dimensions down proportionally on containers narrower than 360px. */
function scaledCardDims(containerW: number) {
  const scale = Math.min(1, containerW / 360);
  return {
    cardW: Math.floor(CARD_W * scale),
    cardH: Math.floor(CARD_H * scale),
    gapX:  Math.max(8, Math.floor(GAP_X * scale)),
  };
}

// Cards per row (above bag = row 0, below = row 1+).
// Key is the bag key ("blue" / "purple" / "gold").
const CARD_ROWS: Record<string, number[] | undefined> = {
  blue:   undefined,  // 1–2 items: single staggered row
  purple: undefined,  // will be set dynamically if count = 3
  gold:   [2, 1],
};

interface CardDef { tx: number; ty: number; rot: number; delay: number; }

function makeCards(
  count:    number,
  vw:       number,
  ox:       number,
  oy:       number,
  dims:     { cardW: number; cardH: number; gapX: number },
  cardRows?: number[],
): CardDef[] {
  const { cardW, cardH, gapX } = dims;
  const GAP_Y = 14;
  if (cardRows && cardRows.reduce((a, b) => a + b, 0) === count) {
    const cards: CardDef[] = [];
    let idx = 0;
    cardRows.forEach((rowCount, row) => {
      const rowGap = row === 0 ? gapX + 20 : gapX;
      const rowW   = rowCount * cardW + (rowCount - 1) * rowGap;
      const startX = row === 0 ? ox - rowW / 2 : (vw - rowW) / 2;
      const rawTopY  = oy - 175;
      const clamped  = Math.max(cardH / 2 + 10, rawTopY);
      const rowY     = row === 0
        ? clamped
        : oy + 80 + (row - 1) * (cardH + GAP_Y);
      for (let i = 0; i < rowCount; i++) {
        cards.push({
          tx:    startX + i * (cardW + rowGap) - ox,
          ty:    rowY - oy,
          rot:   (Math.random() - 0.5) * 6,
          delay: idx * 250,
        });
        idx++;
      }
    });
    return cards;
  }
  // Single staggered row fallback
  const totalW = count * cardW + (count - 1) * gapX;
  const startX = (vw - totalW) / 2;
  return Array.from({ length: count }, (_, i) => ({
    tx:    startX + i * (cardW + gapX) - ox,
    ty:    80 + (i % 2 === 0 ? 0 : 28),
    rot:   (Math.random() - 0.5) * 6,
    delay: i * 250,
  }));
}

// ── Tier → bag colour ─────────────────────────────────────────────────────────
const TIER_BAG: Record<string, string> = {
  standard:  "blue",
  premium:   "purple",
  legendary: "gold",
};

// ── Rarity weights / roll logic (unchanged) ───────────────────────────────────
type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

const RARITY_WEIGHTS_STANDARD: Record<Rarity, number> = {
  common: 50, rare: 30, epic: 14, legendary: 5, mythic: 1,
};
const RARITY_WEIGHTS_PREMIUM: Record<Rarity, number> = {
  common: 20, rare: 40, epic: 28, legendary: 10, mythic: 2,
};
const RARITY_WEIGHTS_LEGENDARY: Record<Rarity, number> = {
  common: 0, rare: 10, epic: 40, legendary: 40, mythic: 10,
};

function rarityWeightsForTier(tier: WebBagTier): Record<Rarity, number> {
  if (tier.id === "legendary") return RARITY_WEIGHTS_LEGENDARY;
  if (tier.id === "premium")   return RARITY_WEIGHTS_PREMIUM;
  return RARITY_WEIGHTS_STANDARD;
}

type BagType = "coin" | "strap" | "pick" | "cable" | "pedal";

const BAG_TYPE_WEIGHTS: Record<BagType, number> = {
  coin: 4, strap: 4, pick: 4, cable: 2, pedal: 1,
};

function getBagTypePool(type: BagType): GearItem[] {
  switch (type) {
    case "coin":  return gearByCategory("coin");
    case "strap": return gearByCategory("strap").filter((s) => s.id.startsWith("strap-p-"));
    case "pick":  return gearByCategory("pick");
    case "cable": return gearByCategory("cable");
    case "pedal": return gearByCategory("pedal");
  }
}

function rollRarity(weights: Record<Rarity, number>): Rarity {
  const total = (Object.values(weights) as number[]).reduce((s, v) => s + v, 0);
  let r = Math.random() * total;
  for (const [rarity, weight] of Object.entries(weights) as [Rarity, number][]) {
    r -= weight;
    if (r <= 0) return rarity;
  }
  return "common";
}

function pickWeightedType(available: BagType[]): BagType {
  const total = available.reduce((s, t) => s + BAG_TYPE_WEIGHTS[t], 0);
  let r = Math.random() * total;
  for (const t of available) {
    r -= BAG_TYPE_WEIGHTS[t];
    if (r <= 0) return t;
  }
  return available[available.length - 1];
}

function rollBagItems(tier: WebBagTier): GearItem[] {
  const count =
    tier.itemCountMin === tier.itemCountMax
      ? tier.itemCountMax
      : tier.itemCountMin + Math.round(Math.random());

  const weights   = rarityWeightsForTier(tier);
  const dropped: GearItem[] = [];
  const droppedIds = new Set<string>();
  const usedTypes  = new Set<BagType>();

  for (let i = 0; i < count; i++) {
    const availableTypes = (Object.keys(BAG_TYPE_WEIGHTS) as BagType[]).filter(
      (t) => !usedTypes.has(t) && getBagTypePool(t).some((g) => !droppedIds.has(g.id)),
    );
    if (availableTypes.length === 0) break;

    const type = pickWeightedType(availableTypes);
    usedTypes.add(type);

    const typePool = getBagTypePool(type).filter((g) => !droppedIds.has(g.id));
    let picked: GearItem;
    if (type === "coin") {
      picked = typePool[Math.floor(Math.random() * typePool.length)];
    } else {
      const rarity  = rollRarity(weights);
      const rarPool = typePool.filter((g) => g.rarity === rarity);
      const pool    = rarPool.length > 0 ? rarPool : typePool;
      picked = pool[Math.floor(Math.random() * pool.length)];
    }

    dropped.push(picked);
    droppedIds.add(picked.id);
  }

  return dropped;
}

// ── CSS Keyframes ─────────────────────────────────────────────────────────────
const BAG_KEYFRAMES = `
  @keyframes bag-card-bloom {
    0%   { transform: scale(0.06) rotate(calc(var(--bag-rot)*-4deg)); opacity: 0; }
    50%  { opacity: 1; }
    72%  { transform: scale(1.10) rotate(calc(var(--bag-rot)*1.5deg)); }
    87%  { transform: scale(0.96) rotate(calc(var(--bag-rot)*0.8deg)); }
    100% { transform: scale(1)    rotate(calc(var(--bag-rot)*1deg));   opacity: 1; }
  }
  @keyframes bag-tier-flash {
    0%   { opacity: 0.88; }
    100% { opacity: 0; }
  }
  @keyframes bag-card-float {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-4px); }
  }
  @keyframes bag-card-shake {
    0%,100% { transform: rotate(0deg) translateY(0px); }
    18%     { transform: rotate(-2.5deg) translateY(-1px); }
    36%     { transform: rotate(2.5deg) translateY(1px); }
    54%     { transform: rotate(-1.5deg) translateY(-1px); }
    72%     { transform: rotate(1.5deg) translateY(0px); }
    88%     { transform: rotate(-0.5deg) translateY(0px); }
  }
  @keyframes bag-burst-pop {
    0%    { opacity: 0; }
    8%    { opacity: 0.18; }
    20%   { opacity: 0.72; }
    33%   { opacity: 1; }
    65%   { opacity: 1; }
    80%   { opacity: 0.52; }
    92%   { opacity: 0.1; }
    100%  { opacity: 0; }
  }
  @keyframes bag-flash {
    0%,100% { opacity: 0; }
    25%     { opacity: 1; }
  }
  @keyframes bag-pip-pulse {
    0%,100% { opacity: 1; }
    50%     { opacity: 0.45; }
  }
  @keyframes bag-gold-glow {
    0%,100% { box-shadow: 0 0 14px 5px #ffd700, 0 0 28px 10px #ffd70044, 0 6px 20px #000e; }
    50%     { box-shadow: 0 0 22px 8px #ffd700, 0 0 40px 14px #ffd70066, 0 6px 20px #000e; }
  }
  @keyframes bag-epic-glow {
    0%,100% { box-shadow: 0 0 12px 4px #a855f7, 0 0 22px 8px #a855f744, 0 6px 20px #000e; }
    50%     { box-shadow: 0 0 18px 7px #a855f7, 0 0 32px 12px #a855f766, 0 6px 20px #000e; }
  }
  @keyframes bag-rare-glow {
    0%,100% { box-shadow: 0 0 10px 3px #3b82f6, 0 0 18px 7px #3b82f644, 0 6px 20px #000e; }
    50%     { box-shadow: 0 0 15px 5px #3b82f6, 0 0 26px 10px #3b82f666, 0 6px 20px #000e; }
  }
`;

// ── FlipCard ──────────────────────────────────────────────────────────────────
function FlipCard({
  item,
  isDuplicate,
  accentColor,
  def,
  isLegendary,
  onFlipped,
  cardIndex = 0,
  cardW: cw = CARD_W,
  cardH: ch = CARD_H,
}: {
  item:        GearItem;
  isDuplicate: boolean;
  accentColor: string;
  def:         CardDef;
  isLegendary: boolean;
  onFlipped:   () => void;
  cardIndex?:  number;
  cardW?:      number;
  cardH?:      number;
}) {
  const [flipped,  setFlipped]  = useState(false);
  const [canFlip,  setCanFlip]  = useState(false);
  const flippedRef = useRef(false);

  // Card becomes tappable once its bloom animation completes
  useEffect(() => {
    const landMs = def.delay + 700;
    const t = setTimeout(() => setCanFlip(true), landMs);
    return () => clearTimeout(t);
  }, [def.delay]);

  // Auto-flip: fire sequentially by card index, staggered 600ms apart,
  // 300ms after landing. Uses flippedRef directly to avoid stale-closure issues.
  useEffect(() => {
    const autoMs = def.delay + 1000 + cardIndex * 600;
    const t = setTimeout(() => {
      if (!flippedRef.current) {
        flippedRef.current = true;
        setFlipped(true);
        setTimeout(() => onFlipped(), 400);
      }
    }, autoMs);
    return () => clearTimeout(t);
  // onFlipped changes identity each render; use def.delay + cardIndex as the
  // stable key. We capture onFlipped in the closure; it's stable from useCallback.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [def.delay, cardIndex]);

  const doFlip = useCallback(() => {
    if (flippedRef.current || !canFlip) return;
    flippedRef.current = true;
    setFlipped(true);
    setTimeout(() => onFlipped(), 400);
  }, [canFlip, onFlipped]);

  const rarity = RARITY_META[item.rarity];

  const floatAnim = `bag-card-float 2.4s ease-in-out ${def.delay + 800}ms infinite both`;
  const shakeAnim = isLegendary
    ? `${floatAnim}, bag-card-shake 0.55s ease-in-out ${def.delay + 720}ms 3 both`
    : floatAnim;

  const isEpic   = item.rarity === "epic";
  const isRare   = item.rarity === "rare";
  const cardGlowAnim = isLegendary
    ? "bag-gold-glow 2s ease-in-out infinite"
    : isEpic
    ? "bag-epic-glow 2s ease-in-out infinite"
    : isRare
    ? "bag-rare-glow 2.4s ease-in-out infinite"
    : "none";
  const cardBorderColor = isLegendary ? "#ffd700"
    : isEpic   ? "#a855f7"
    : isRare    ? "#3b82f6"
    : accentColor + "88";

  return (
    // Outer: bloom animation (positioned at final coords by parent)
    <div
      style={{
        width: cw, height: ch,
        // @ts-expect-error css vars
        "--bag-rot": def.rot,
        animation: `bag-card-bloom 700ms ${def.delay}ms cubic-bezier(0.34,1.56,0.64,1) both`,
        zIndex: 20,
        position: "absolute",
        inset: "auto",
      }}
    >
      {/* Middle: float bob + legendary shake */}
      <div style={{ width: "100%", height: "100%", animation: shakeAnim }}>
        {/* Inner: 3D flip */}
        <div
          className="relative cursor-pointer select-none"
          style={{ perspective: 700, width: cw, height: ch }}
          onClick={doFlip}
          title={canFlip && !flipped ? "Tap to reveal" : undefined}
        >
          <div
            style={{
              position: "absolute", inset: 0,
              transformStyle: "preserve-3d",
              transition: "transform 0.55s cubic-bezier(0.4,0,0.2,1)",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              borderRadius: 10,
            }}
          >
            {/* ── Card back ── */}
            <div
              style={{
                position: "absolute", inset: 0, borderRadius: 10,
                backfaceVisibility: "hidden",
                overflow: "hidden",
                background: "linear-gradient(145deg,#06001a 0%,#110030 55%,#070015 100%)",
                border: `1.5px solid ${cardBorderColor}`,
                animation: cardGlowAnim,
              }}
            >
              {/* Accent bar */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 3,
                background: isLegendary
                  ? "linear-gradient(90deg,#ffd700,#fffacd,#ffd700)"
                  : `linear-gradient(90deg,transparent,${accentColor},transparent)`,
                boxShadow: `0 0 8px 2px ${isLegendary ? "#ffd70088" : accentColor + "88"}`,
                animation: isLegendary ? "none" : "bag-pip-pulse 2.5s ease-in-out infinite",
              }} />
              {/* Centre icon */}
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <span style={{ fontSize: 32, filter: isLegendary ? `drop-shadow(0 0 8px #ffd700)` : isEpic ? `drop-shadow(0 0 8px #a855f7)` : isRare ? `drop-shadow(0 0 6px #3b82f6)` : `drop-shadow(0 0 6px ${accentColor})` }}>
                  👽
                </span>
                {canFlip && (
                  <span style={{
                    fontSize: 7, letterSpacing: 2, fontWeight: 800,
                    color: accentColor, textTransform: "uppercase",
                    animation: "bag-pip-pulse 1.6s ease-in-out infinite",
                  }}>TAP TO REVEAL</span>
                )}
              </div>
            </div>

            {/* ── Card face ── */}
            <div
              style={{
                position: "absolute", inset: 0, borderRadius: 10,
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                overflow: "hidden",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                padding: 7, gap: 4,
                background: "#07001a",
                border: `1.5px solid ${isDuplicate ? "#6b728088" : rarity.color}`,
                boxShadow: isDuplicate ? undefined : `inset 0 0 18px ${rarity.glow}`,
              }}
            >
              {isDuplicate ? (
                <span style={{ borderRadius: 20, border: "1px solid #6b7280", padding: "2px 6px", fontSize: 7, letterSpacing: 1, color: "#6b7280", fontWeight: 700, textTransform: "uppercase" }}>
                  DUPE
                </span>
              ) : (
                <span style={{ borderRadius: 20, border: `1px solid ${rarity.color}`, background: rarity.color + "30", padding: "2px 6px", fontSize: 7, letterSpacing: 1, color: rarity.color, fontWeight: 700, textTransform: "uppercase" }}>
                  {rarity.label.toUpperCase()}
                </span>
              )}
              <div
                style={{
                  flex: 1, width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                  opacity: isDuplicate ? 0.35 : 1,
                  filter: isDuplicate ? undefined : `drop-shadow(0 0 6px ${rarity.glow})`,
                }}
              >
                <GearThumb item={item} className="h-full w-full" />
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: isDuplicate ? "#6b7280" : "#fff", textAlign: "center", lineHeight: 1.3 }}>
                {item.category === "coin" ? `+${(item as any).coinAmount}` : item.name}
              </div>
              {isDuplicate && item.category !== "coin" && (
                <div style={{ display: "flex", alignItems: "center", gap: 2, fontSize: 9, fontWeight: 700, color: "#fbbf24" }}>
                  <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="" style={{ width: 10, height: 10, objectFit: "contain" }} />
                  +{COINS_DUPLICATE_REFUND}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Opening state machine ─────────────────────────────────────────────────────
type OpenPhase = "idle" | "opening" | "reveal" | "done";

interface OpenResult {
  tier:       WebBagTier;
  items:      GearItem[];
  earnedSet:  Set<string>;
  coinRefund: number;
  newCoins:   number;
  cardDefs:   CardDef[];
  bagKey:     string;
  containerW: number;
  cardW:      number;
  cardH:      number;
}

// ── Tier card ─────────────────────────────────────────────────────────────────
function TierCard({ tier, coins, onOpen }: { tier: WebBagTier; coins: number; onOpen: () => void }) {
  const canAfford = coins >= tier.cost;
  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5 transition-all"
      style={{
        borderColor: canAfford ? tier.accentColor + "60" : "hsl(229 30% 18%)",
        background: canAfford
          ? `radial-gradient(ellipse at 0% 0%, ${tier.accentColor}12, rgba(7,10,24,0.9))`
          : "rgba(7,10,24,0.6)",
      }}
    >
      <div className="mb-3">
        <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: canAfford ? tier.accentColor : "#6b7280" }}>
          {tier.label}
        </div>
        <div className="text-sm text-muted-foreground">{tier.oddsBlurb}</div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="coin" className="h-5 w-5 object-contain" />
          <span className="text-xl font-sans font-bold" style={{ color: canAfford ? tier.accentColor : "#6b7280" }}>
            {tier.cost}
          </span>
          <span className="text-xs text-muted-foreground">coins</span>
        </div>
        <button
          disabled={!canAfford}
          onClick={onOpen}
          className="rounded-lg px-5 py-2 text-sm font-bold transition-opacity"
          style={
            canAfford
              ? { backgroundColor: tier.accentColor, color: "#030816" }
              : { backgroundColor: "hsl(229 20% 22%)", color: "#6b7280", cursor: "not-allowed" }
          }
        >
          {canAfford ? "Open" : "Need more coins"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function BagShop({ onCoinsChanged }: { onCoinsChanged?: (newTotal: number) => void }) {
  const [coins, setCoins]           = useState(() => loadAlienCoins());
  const [phase, setPhase]           = useState<OpenPhase>("idle");
  const [openResult, setOpenResult] = useState<OpenResult | null>(null);
  const [flippedCount, setFlippedCount] = useState(0);
  const [inspectItem, setInspectItem]   = useState<GearItem | null>(null);
  const [flyState, setFlyState] = useState<{
    fromX: number; fromY: number; toX: number; toY: number;
  } | null>(null);

  const [showFlash, setShowFlash]   = useState(false);

  const coinBalanceRef   = useRef<HTMLDivElement>(null);
  const cardsRef         = useRef<HTMLDivElement>(null);
  const animContainerRef = useRef<HTMLDivElement>(null);
  // Guard so the useLayoutEffect only fires once per open action.
  const animStartedRef   = useRef(false);

  // Refresh coins when component mounts
  useEffect(() => {
    setCoins(loadAlienCoins());
  }, []);

  const handleOpenTier = useCallback((tier: WebBagTier) => {
    const ok = spendAlienCoins(tier.cost);
    if (!ok) return;
    const newCoins   = loadAlienCoins();
    setCoins(newCoins);
    onCoinsChanged?.(newCoins);

    const earnedSet  = loadEarnedGear();
    const items      = rollBagItems(tier);
    const dups       = items.filter((i) => earnedSet.has(i.id));
    const coinRefund = dups.length * COINS_DUPLICATE_REFUND;
    const bagKey     = TIER_BAG[tier.id] ?? "blue";

    // Use a fixed container width — the modal content area is max-w-2xl (672px)
    // minus 2×24px padding ≈ 560px.  We avoid DOM measurement here because the
    // animation container isn't in the DOM until React commits the render that
    // shows it, which happens AFTER this callback returns.
    const cw = 560;
    const ox = cw / 2;
    const oy = SEAM_Y_IN_CTR;
    const dims = scaledCardDims(cw);

    let rows: number[] | undefined;
    if (items.length === 3) rows = [2, 1];
    else if (items.length >= 4) rows = [2, items.length - 2];

    const cardDefs = makeCards(Math.max(items.length, 1), cw, ox, oy, dims, rows);

    // Reset animation guard so useLayoutEffect fires for this new opening.
    animStartedRef.current = false;
    setFlippedCount(0);
    setOpenResult({ tier, items, earnedSet, coinRefund, newCoins, cardDefs, bagKey, containerW: cw, cardW: dims.cardW, cardH: dims.cardH });
    setPhase("opening");
  }, [onCoinsChanged]);

  // Fire once per open action, after React has committed the container to the DOM.
  useLayoutEffect(() => {
    if (phase !== "opening" || !openResult || animStartedRef.current) return;
    animStartedRef.current = true;

    // Correct card positions for the actual container width (may differ from
    // the 560px fallback assumed in handleOpenTier on narrow viewports).
    const measuredW = animContainerRef.current?.getBoundingClientRect().width ?? 0;
    if (measuredW > 0 && Math.abs(measuredW - openResult.containerW) > 1) {
      const cw = measuredW;
      const ox = cw / 2;
      const oy = SEAM_Y_IN_CTR;
      const dims = scaledCardDims(cw);
      const { items } = openResult;
      let rows: number[] | undefined;
      if (items.length === 3) rows = [2, 1];
      else if (items.length >= 4) rows = [2, items.length - 2];
      const cardDefs = makeCards(Math.max(items.length, 1), cw, ox, oy, dims, rows);
      setOpenResult((prev) => prev ? { ...prev, cardDefs, containerW: cw, cardW: dims.cardW, cardH: dims.cardH } : prev);
    }

    // Tier-colour flash, then transition to reveal after the last card has bloomed.
    setShowFlash(true);
    const n = openResult.items.length;
    const t1 = setTimeout(() => setShowFlash(false), 220);
    const t2 = setTimeout(() => setPhase("reveal"), (n - 1) * 250 + 750);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  // openResult.bagKey changes when a new bag is opened; that resets animStartedRef
  // above so this effect correctly re-runs for each new opening.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, openResult?.bagKey]);

  const handleFlipped = useCallback(() => {
    setFlippedCount((n) => n + 1);
  }, []);

  const handleClaim = useCallback(() => {
    if (!openResult) return;

    const newGearItems = openResult.items.filter(
      (i) => i.category !== "coin" && !openResult.earnedSet.has(i.id),
    );
    for (const item of newGearItems) addEarnedGear(item.id);

    const coinPrizeTotal = openResult.items.reduce((s, i) => {
      if (i.category === "coin") return s + (i as any).coinAmount;
      return s;
    }, 0);

    const totalCoins = openResult.coinRefund + coinPrizeTotal;
    if (totalCoins > 0) {
      addAlienCoins(totalCoins);
      if (coinBalanceRef.current && cardsRef.current) {
        const to   = coinBalanceRef.current.getBoundingClientRect();
        const from = cardsRef.current.getBoundingClientRect();
        setFlyState({
          fromX: from.left + from.width  / 2,
          fromY: from.top  + from.height / 2,
          toX:   to.left   + to.width    / 2,
          toY:   to.top    + to.height   / 2,
        });
      }
    }

    const finalCoins = loadAlienCoins();
    setCoins(finalCoins);
    onCoinsChanged?.(finalCoins);

    setPhase("idle");
    setOpenResult(null);
    setFlippedCount(0);
  }, [openResult, onCoinsChanged]);

  const allFlipped      = openResult ? flippedCount >= openResult.items.length : false;
  const showClaimButton = phase === "reveal" && allFlipped;
  const accentColor     = openResult?.tier.accentColor ?? "#60a5fa";

  return (
    <div className="space-y-6">
      <style>{BAG_KEYFRAMES}</style>

      {/* Coin balance */}
      <div ref={coinBalanceRef} className="flex items-center gap-3">
        <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="Alien Coins" className="h-8 w-8 object-contain" />
        <div>
          <div className="text-2xl font-sans font-bold text-amber-400">{coins}</div>
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Alien Coins</div>
        </div>
        <div className="ml-4 text-xs text-muted-foreground leading-relaxed max-w-xs">
          Complete drills to earn coins. Duplicates convert to a {COINS_DUPLICATE_REFUND}-coin refund each.
        </div>
      </div>

      {/* Tier selection */}
      {phase === "idle" && (
        <div className="grid gap-4 sm:grid-cols-3">
          {WEB_BAG_TIERS.map((tier) => (
            <TierCard key={tier.id} tier={tier} coins={coins} onOpen={() => handleOpenTier(tier)} />
          ))}
        </div>
      )}

      {/* ── Cinematic card reveal ── */}
      {(phase === "opening" || phase === "reveal") && openResult && (
        <div
          ref={animContainerRef}
          style={{
            position: "relative",
            width: "100%",
            height: SEAM_Y_IN_CTR + CARD_H * 2 + 60,
            overflow: "hidden",
            borderRadius: 16,
            background: "radial-gradient(ellipse 80% 55% at 50% 18%, #1e0545 0%, #0b0028 40%, #040210 75%, #020108 100%)",
          }}
        >
          {/* Tier-colour flash on open */}
          {showFlash && (
            <div
              style={{
                position: "absolute", inset: 0, zIndex: 25,
                backgroundColor: accentColor,
                pointerEvents: "none",
                animation: "bag-tier-flash 280ms ease-out forwards",
              }}
            />
          )}

          {/* Cards bloom in from final positions, one by one */}
          {openResult.items.map((item, i) => {
            const def = openResult.cardDefs[i];
            if (!def) return null;
            const isLegendary = item.rarity === "legendary" || item.rarity === "mythic";
            const ox = openResult.containerW / 2;
            const oy = SEAM_Y_IN_CTR;
            const { cardW: rCardW, cardH: rCardH } = openResult;
            return (
              <div
                key={item.id}
                style={{
                  position: "absolute",
                  left: ox + def.tx - rCardW / 2,
                  top:  oy + def.ty - rCardH / 2,
                }}
              >
                <FlipCard
                  item={item}
                  isDuplicate={openResult.earnedSet.has(item.id)}
                  accentColor={accentColor}
                  def={def}
                  isLegendary={isLegendary}
                  onFlipped={handleFlipped}
                  cardIndex={i}
                  cardW={rCardW}
                  cardH={rCardH}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* ── Reveal UI (overlaid below the animation container) ── */}
      {phase === "reveal" && openResult && (
        <div ref={cardsRef} className="space-y-4 animate-in fade-in duration-500">
          {!allFlipped && (
            <div className="text-center text-xs text-muted-foreground animate-pulse">
              Tap each card to reveal
            </div>
          )}

          {openResult.coinRefund > 0 && allFlipped && (
            <div className="flex items-center justify-center gap-2 text-sm text-amber-400">
              <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="coin" className="h-4 w-4 object-contain" />
              <span>
                +{openResult.coinRefund} coins back for{" "}
                {openResult.items.filter((i) => openResult.earnedSet.has(i.id)).length} duplicate
                {openResult.items.filter((i) => openResult.earnedSet.has(i.id)).length > 1 ? "s" : ""}
              </span>
            </div>
          )}

          {showClaimButton && (
            <div className="flex justify-center gap-3">
              <button
                onClick={handleClaim}
                className="rounded-xl px-8 py-3 font-sans font-bold text-black transition-opacity hover:opacity-90 animate-in fade-in duration-500"
                style={{ backgroundColor: accentColor }}
              >
                Claim rewards
              </button>
              <button
                onClick={handleClaim}
                className="rounded-xl border px-6 py-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
                style={{ borderColor: "hsl(229 30% 22%)" }}
              >
                Open another
              </button>
            </div>
          )}
        </div>
      )}

      {inspectItem && (
        <GearDetailModal item={inspectItem} unlocked onClose={() => setInspectItem(null)} />
      )}

      {flyState && (
        <CoinFlyOverlay
          fromX={flyState.fromX} fromY={flyState.fromY}
          toX={flyState.toX}    toY={flyState.toY}
          count={8}
          onDone={() => setFlyState(null)}
        />
      )}
    </div>
  );
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
export function BagShopModal({
  onClose,
  onCoinsChanged,
}: {
  onClose: () => void;
  onCoinsChanged?: (newTotal: number) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur p-4">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-primary/30 bg-[#070a18] p-6 shadow-2xl"
        style={{ boxShadow: "0 0 60px rgba(0,191,255,0.08)" }}
      >
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-sans font-bold text-accent">BAG SHOP</h2>
            <p className="text-sm text-muted-foreground">Spend your Alien Coins to reveal new gear</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
        <BagShop onCoinsChanged={onCoinsChanged} />
      </div>
    </div>
  );
}
