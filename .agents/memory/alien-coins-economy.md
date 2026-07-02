---
name: Alien Coins economy
description: How the coin currency is stored, awarded, and spent on mobile and web.
---

## The rule
Coins are earned from drills (10/20/30 by accuracy band) and boss victories (100). They are spent in the Bag Shop to open mystery gear bags. Auto-gear-award after drills is fully removed on both platforms.

## Mobile storage
- Lives in `contexts/progress.tsx` alongside XP, AsyncStorage key `ags-progress-v1`, field `alienCoins`.
- `addCoins(n)` / `spendCoins(n) → Promise<boolean>` are exposed on the context value.
- Coin amounts and bag tier config are in `lib/coins.ts`.

## Web storage
- Lives in `lib/playerCustomization.ts`, localStorage key `ags.alienCoins.v1`.
- Helpers: `loadAlienCoins`, `saveAlienCoins`, `addAlienCoins`, `spendAlienCoins`.
- After a bag is claimed, vault.tsx re-derives `earnedGear` by bumping an `earnedGearKey` counter (useMemo dependency). Without this, newly earned gear stays locked-looking until page reload.

## Duplicate handling
- Any bag item the player already owns yields a 10-coin refund (`COINS_DUPLICATE_REFUND`).
- Mobile: refund passed back via `onClaim(newItems, coinRefundTotal)` from GearBagModal to gear.tsx, which calls `addCoins`.
- Web: BagShop component handles it internally in `handleClaim`, then calls `onCoinsChanged` to sync vault's displayed balance.

**Why:** The old awardDrillReward was a deterministic rotation (pick → strap → pedal → amp) that players could game and quickly exhaust. Coins + bag tiers give players agency and a reason to keep drilling.
