import { getUncachableStripeClient } from "./stripeClient";

/**
 * Creates the Alien Guitar Secrets "Premium" product with monthly ($8) and
 * yearly ($60) prices in Stripe.
 *
 * Idempotent: skips creation if the product already exists.
 * Run with: pnpm --filter @workspace/scripts exec tsx src/seed-products.ts
 */
async function createProducts() {
  try {
    const stripe = await getUncachableStripeClient();

    console.log("Creating Premium product and prices in Stripe...");

    const existing = await stripe.products.search({
      query: "name:'Premium' AND active:'true'",
    });

    if (existing.data.length > 0) {
      console.log("Premium product already exists. Skipping creation.");
      console.log(`Existing product ID: ${existing.data[0].id}`);
      return;
    }

    const product = await stripe.products.create({
      name: "Premium",
      description:
        "Full galaxy access: all solar systems and bosses, Display Vault, cinematic launches, and avatar customization.",
      metadata: { plan: "premium" },
    });
    console.log(`Created product: ${product.name} (${product.id})`);

    const monthly = await stripe.prices.create({
      product: product.id,
      unit_amount: 800, // $8.00
      currency: "usd",
      recurring: { interval: "month" },
      metadata: { plan: "premium", interval: "month" },
    });
    console.log(`Created monthly price: $8.00/month (${monthly.id})`);

    const yearly = await stripe.prices.create({
      product: product.id,
      unit_amount: 6000, // $60.00
      currency: "usd",
      recurring: { interval: "year" },
      metadata: { plan: "premium", interval: "year" },
    });
    console.log(`Created yearly price: $60.00/year (${yearly.id})`);

    console.log("✓ Products and prices created successfully!");
    console.log("Webhooks will sync this data to your database automatically.");
  } catch (error) {
    console.error(
      "Error creating products:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

createProducts();
