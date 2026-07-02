import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { User } from "@workspace/db";

const ACTIVE_STATUSES = ["active", "trialing", "past_due"];

// ⚠️ TEMPORARY DEV FLAG — flip back to false when done previewing
const DEV_UNLOCK_ALL = true;

// Owner/admin accounts (by Clerk ID) that always get full premium access,
// regardless of any Stripe subscription. Set via the PREMIUM_OWNER_CLERK_IDS
// env var as a comma-separated list. Useful for the app owner to preview the
// full premium experience without paying.
function ownerClerkIds(): string[] {
  return (process.env.PREMIUM_OWNER_CLERK_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Returns true when the user should receive COMPLETE tester access: every
 * level-gated feature (all solar systems, guitars, skins, etc.) is unlocked
 * regardless of their actual level. This is granted to owner accounts and to
 * anyone who redeemed a valid access code (compedPremium). It is distinct from
 * isPremium: a paying Stripe subscriber is premium but does NOT get full
 * access — they still progress through levels normally.
 */
export function hasFullAccess(user: User): boolean {
  if (DEV_UNLOCK_ALL) return true;
  if (user.clerkId && ownerClerkIds().includes(user.clerkId)) return true;
  if (user.compedPremium) return true;
  return false;
}

/**
 * Returns true when the user has a current Stripe subscription in an
 * access-granting state. Reads from the `stripe` schema synced by
 * stripe-replit-sync. Returns false when Stripe is not configured or the
 * user has no customer record. Owner accounts in PREMIUM_OWNER_CLERK_IDS
 * always return true.
 */
export async function isPremium(user: User): Promise<boolean> {
  if (user.clerkId && ownerClerkIds().includes(user.clerkId)) return true;
  // Manually comped accounts (redeemed a valid access code) are always premium.
  if (user.compedPremium) return true;
  if (!user.stripeCustomerId) return false;
  try {
    const result = await db.execute(sql`
      SELECT status
      FROM stripe.subscriptions
      WHERE customer = ${user.stripeCustomerId}
        AND status = ANY(${ACTIVE_STATUSES})
      LIMIT 1
    `);
    return result.rows.length > 0;
  } catch {
    // stripe schema not present yet (integration not connected) -> free tier
    return false;
  }
}
