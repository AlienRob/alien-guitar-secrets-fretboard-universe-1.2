import { useGetProfileSummary } from "@workspace/api-client-react";

// Single source of truth for the player's premium status on the client.
// Reads the `isPremium` flag exposed by the profile summary endpoint, which the
// server derives from the user's active Stripe subscription.
export function usePremium(): { isPremium: boolean; isLoading: boolean } {
  const { data, isLoading } = useGetProfileSummary();
  return { isPremium: data?.isPremium ?? false, isLoading };
}
