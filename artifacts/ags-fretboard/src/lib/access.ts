import { useGetProfileSummary } from "@workspace/api-client-react";
import { GUITARS } from "@/data/guitars";
import { SKINS } from "@/data/avatarOptions";

// The highest level at which any collectible (guitar or aura) unlocks. A
// full-access tester is treated as if they were this level for every unlock
// check, so all collectibles and every solar system that actually holds content
// are reachable without grinding — but we never go past it, so the galaxy map
// doesn't page through endless empty systems.
export const MAX_CONTENT_LEVEL = Math.max(
  ...GUITARS.map((g) => g.unlockLevel),
  ...SKINS.map((s) => s.unlockLevel),
);

// Effective level used purely for unlock checks. Full-access testers get
// MAX_CONTENT_LEVEL (everything unlocked); everyone else keeps their real level.
// Their displayed level is never changed by this.
export function effectiveUnlockLevel(realLevel: number, fullAccess: boolean): number {
  return fullAccess ? Math.max(realLevel, MAX_CONTENT_LEVEL) : realLevel;
}

// Whether the current user has complete tester access (owner or redeemed code).
export function useFullAccess(): boolean {
  const { data: summary } = useGetProfileSummary();
  return summary?.fullAccess ?? false;
}
