import { getUncachableStripeClient } from "./stripeClient";

/**
 * Updates Alien Guitar Secrets pricing to:
 *   - $12.00 / month
 *   - $89.00 / year  (regular annual)
 *   - $59.00 / year  (Founders — limited time, metadata founders:"true")
 *
 * Archives the old $8.00/month and $60.00/year prices so they no longer appear
 * in the product listing (existing subscribers are unaffected — Stripe keeps
 * their price active until they cancel or upgrade).
 *
 * Run with:
 *   pnpm --filter @workspace/scripts exec tsx src/update-prices.ts
 */
async function updatePrices() {
  const stripe = await getUncachableStripeClient();

  // ── 1. Find the Premium product ──────────────────────────────────────────
  const existing = await stripe.products.search({
    query: "name:'Premium' AND active:'true'",
  });

  if (existing.data.length === 0) {
    console.error("No active 'Premium' product found. Run seed-products.ts first.");
    process.exit(1);
  }

  const product = existing.data[0];
  console.log(`Found product: ${product.name} (${product.id})`);

  // ── 2. Archive old prices that we are replacing ───────────────────────────
  const allPrices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });

  const OLD_AMOUNTS = [800, 6000]; // $8.00/month and $60.00/year in cents
  for (const price of allPrices.data) {
    if (OLD_AMOUNTS.includes(price.unit_amount ?? -1)) {
      await stripe.prices.update(price.id, { active: false });
      console.log(`Archived old price: ${price.id} ($${(price.unit_amount ?? 0) / 100})`);
    }
  }

  // ── 3. Check which new prices already exist (idempotency) ─────────────────
  const currentActive = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const existingAmounts = new Set(currentActive.data.map((p) => p.unit_amount));

  // ── 4. Create new prices if not already present ───────────────────────────
  if (!existingAmounts.has(1200)) {
    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 1200, // $12.00
      currency: "usd",
      recurring: { interval: "month" },
      nickname: "Monthly",
      metadata: { plan: "premium", interval: "month" },
    });
    console.log(`Created monthly price: $12.00/month (${monthly.id})`);
  } else {
    console.log("Monthly $12.00 price already exists — skipping.");
  }

  if (!existingAmounts.has(8900)) {
    const annual = await stripe.prices.create({
      product: product.id,
      unit_amount: 8900, // $89.00
      currency: "usd",
      recurring: { interval: "year" },
      nickname: "Annual",
      metadata: { plan: "premium", interval: "year" },
    });
    console.log(`Created annual price: $89.00/year (${annual.id})`);
  } else {
    console.log("Annual $89.00 price already exists — skipping.");
  }

  if (!existingAmounts.has(5900)) {
    const founders = await stripe.prices.create({
      product: product.id,
      unit_amount: 5900, // $59.00
      currency: "usd",
      recurring: { interval: "year" },
      nickname: "Founders Annual",
      metadata: { plan: "premium", interval: "year", founders: "true" },
    });
    console.log(`Created founders annual price: $59.00/year (${founders.id})`);
  } else {
    console.log("Founders $59.00 price already exists — skipping.");
  }

  console.log("\nDone! Prices updated. The pricing page reads live from Stripe.");
  console.log("To end the founders period: archive the $59.00 price in the Stripe dashboard.");
}

updatePrices().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
