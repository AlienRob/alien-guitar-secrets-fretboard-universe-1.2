---
name: Stripe is the source of truth for products/prices
description: Pricing/products are read live from Stripe, not the DB; how to change pricing
---

`artifacts/api-server/src/routes/stripe.ts` reads and validates products and
prices **directly from the Stripe API** (per request) rather than from a DB
table.

**Why:** Earlier, stale or cross-mode (test vs live) DB rows could reference
price IDs that didn't exist in the active Stripe account, breaking checkout.
Reading live from Stripe eliminates that drift entirely.

**How to apply:**
- To change pricing or add a plan, create/edit it in the Stripe account — do NOT
  add DB rows or hardcode price IDs.
- Each Stripe connection (dev = test account, prod = live account) must have its
  own Premium product + prices. They were created in both: Premium, $8/mo
  ($800) and $60/yr ($6000), USD recurring.
- Production runs the deployed bundle, so after changing this route's code you
  must republish for live checkout to pick it up.
