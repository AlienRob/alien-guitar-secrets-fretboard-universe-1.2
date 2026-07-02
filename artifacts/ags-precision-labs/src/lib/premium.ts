/**
 * Premium status — Phase 1 stub.
 * Always returns false (free tier). Wire to Clerk + RevenueCat in a later phase.
 */
export function usePremium(): { isPremium: boolean } {
  return { isPremium: false };
}
