---
name: Bag & Coin Monetization Plan
description: Future paid purchases for mystery bags and Alien Coins — not yet implemented.
---

## The plan
Players will eventually be able to buy mystery bags and/or Alien Coin bundles for real money, as an alternative to earning coins through practice.

**Web app** — Stripe (already integrated)
**Mobile app** — RevenueCat (deferred to a later phase)

## What exists today
- Coins are earned through drills and boss battles only.
- Bags are opened by spending earned coins in the Gear Room (mobile) / Bag Shop in the Vault (web).
- One bag per session limit added — this limit should be lifted (or given a higher cap) once paid bags are live, since paid purchases shouldn't be artificially throttled.

**Why:** The one-bag-per-session cap exists to prevent coin-rich players from hoarding all gear in a single sitting. Once bags can be purchased, the economics change — revisit the cap at that point.

## How to apply
When implementing paid bags/coins:
1. Web: add Stripe checkout for coin bundles and/or individual bag opens in the Vault's bag-shop section.
2. Mobile: add RevenueCat products for coin bundles / bag packs.
3. Revisit the one-bag-per-session cap in `gear.tsx` (mobile) and `bag-shop.tsx` (web) — paid bags should probably bypass or raise this limit.
