/**
 * Premium status — Phase 1 stub.
 * Always returns false (free tier). Wire this up to Clerk + RevenueCat
 * when accounts are enabled in a later phase.
 */
export function usePremium(): { isPremium: boolean } {
  return { isPremium: false };
}
