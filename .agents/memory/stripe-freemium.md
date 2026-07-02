---
name: Stripe freemium enforcement
description: How premium entitlement is enforced/degraded in the ags-fretboard Stripe subscription setup.
---

- Premium status is server-derived from synced `stripe.subscriptions` (via stripe-replit-sync), exposed as `isPremium` on `/profile/summary`. This is the single source of truth.
- App feature gating (galaxy systems 2+, vault, avatar, cinematic) is **client-side** in React; it gates UX only. There are no server endpoints that withhold premium *content* because that content is level-based data rendered client-side. The money/entitlement decision is fully server-side, so billing cannot be tampered with even though feature UI can.
- **Checkout must allowlist the client-supplied `priceId`** against synced active prices (`stripe.prices` JOIN `stripe.products` WHERE active). **Why:** without it a client could pass an arbitrary cheaper/test price and still flip `isPremium` true (any active/trialing/past_due sub grants premium).
- Checkout/portal redirect URLs take a client-supplied **relative** path (`successPath`/`cancelPath`/`returnPath`, must start with `/` not `//`) prefixed by server origin — avoids hardcoding `/ags` base path and avoids open redirects.
- **Graceful degradation when Stripe not connected:** `isPremium()` and `/stripe/products` catch the missing `stripe` schema → return false / empty `{data:[]}`; `initStripe()` only warns on boot. Pricing page shows "plans being set up" on empty products.

## Training "Learn" lessons are premium by design
The galaxy "Training modules" link to teaching pages at `/learn/<topic>` (e.g.
`/learn/intervals`) that render narrative + a studyable reference table with
per-row audio. These are gated with `PremiumRoute` — the lessons ARE the paid
product ("buy the backend info"). **Never make `/learn/*` free.** Free users get
the PremiumGate upsell. Source teaching content comes from the user's AGS course
PDFs (Rob Lobasso) under attached_assets/.
