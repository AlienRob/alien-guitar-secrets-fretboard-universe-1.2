import { Router, type IRouter } from "express";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { getUncachableStripeClient } from "../lib/stripeClient";
import { isPremium } from "../lib/premium";

const router: IRouter = Router();

// True when an expanded price.product is a real, active product (not a string
// id and not a deleted product).
function isActiveProduct(
  product: string | Stripe.Product | Stripe.DeletedProduct | null,
): product is Stripe.Product {
  return (
    typeof product === "object" &&
    product !== null &&
    !("deleted" in product && product.deleted) &&
    product.active === true
  );
}

// Public origin for redirect URLs (prefers the published domain).
function getOrigin(req: { protocol: string; get: (h: string) => string | undefined }): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}`;
  return `${req.protocol}://${req.get("host")}`;
}

// List active recurring prices for active products, read directly from Stripe.
// Reading live (rather than a synced DB table) guarantees only prices that
// actually exist in this deployment's Stripe account are offered, so stale or
// cross-mode (test vs live) rows can never break checkout.
router.get("/stripe/products", async (_req, res) => {
  try {
    const stripe = await getUncachableStripeClient();
    const prices = await stripe.prices.list({
      active: true,
      type: "recurring",
      expand: ["data.product"],
      limit: 100,
    });
    const data = prices.data
      .filter((pr) => isActiveProduct(pr.product))
      .map((pr) => {
        const product = pr.product as Stripe.Product;
        return {
          product_id: product.id,
          product_name: product.name,
          product_description: product.description,
          price_id: pr.id,
          unit_amount: pr.unit_amount,
          currency: pr.currency,
          nickname: pr.nickname ?? null,
          metadata: pr.metadata ?? {},
          recurring: pr.recurring
            ? {
                interval: pr.recurring.interval,
                interval_count: pr.recurring.interval_count,
              }
            : null,
        };
      })
      .sort((a, b) => (a.unit_amount ?? 0) - (b.unit_amount ?? 0));
    res.json({ data });
  } catch {
    // Stripe not configured / unreachable -> empty catalog ("coming soon").
    res.json({ data: [] });
  }
});

// Current user's subscription / premium status.
router.get("/stripe/subscription", async (req, res, next) => {
  try {
    const user = req.appUser!;
    const premium = await isPremium(user);
    res.json({ isPremium: premium });
  } catch (err) {
    next(err);
  }
});

// Relative path supplied by the client (its own BASE_URL-prefixed route).
// Reject anything that isn't a same-origin relative path to avoid open redirects.
function safeReturnPath(value: unknown, fallback: string): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : fallback;
}

// Create a Stripe Checkout session for the given price.
router.post("/stripe/checkout", async (req, res, next) => {
  try {
    const user = req.appUser!;
    const priceId = req.body?.priceId;
    if (typeof priceId !== "string" || !priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    const stripe = await getUncachableStripeClient();

    // Validate the price against Stripe directly: it must exist, be active, and
    // belong to an active product. This prevents a client from passing an
    // arbitrary (cheaper/test) price ID, without relying on a synced DB table.
    let price: Stripe.Price;
    try {
      price = await stripe.prices.retrieve(priceId, { expand: ["product"] });
    } catch {
      res.status(400).json({ error: "Invalid or unavailable price" });
      return;
    }
    if (!price.active || !isActiveProduct(price.product)) {
      res.status(400).json({ error: "Invalid or unavailable price" });
      return;
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { userId: String(user.id), username: user.username },
      });
      customerId = customer.id;
      await db
        .update(usersTable)
        .set({ stripeCustomerId: customerId })
        .where(eq(usersTable.id, user.id));
    }

    const origin = getOrigin(req);
    const successPath = safeReturnPath(req.body?.successPath, "/ags/galaxy?checkout=success");
    const cancelPath = safeReturnPath(req.body?.cancelPath, "/ags/pricing?checkout=cancelled");
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}${successPath}`,
      cancel_url: `${origin}${cancelPath}`,
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

// Create a Stripe billing portal session to manage/cancel the subscription.
router.post("/stripe/portal", async (req, res, next) => {
  try {
    const user = req.appUser!;
    if (!user.stripeCustomerId) {
      res.status(400).json({ error: "No billing account" });
      return;
    }
    const stripe = await getUncachableStripeClient();
    const origin = getOrigin(req);
    const returnPath = safeReturnPath(req.body?.returnPath, "/ags/pricing");
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}${returnPath}`,
    });
    res.json({ url: session.url });
  } catch (err) {
    next(err);
  }
});

export default router;
