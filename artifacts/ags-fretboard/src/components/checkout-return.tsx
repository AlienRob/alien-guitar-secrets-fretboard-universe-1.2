import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProfileSummary,
  getGetProfileSummaryQueryKey,
} from "@workspace/api-client-react";
import { toast } from "@/hooks/use-toast";

// How long to keep checking for the subscription to be recognised after a
// successful Stripe checkout. Premium status is granted by a background Stripe
// webhook, so it can lag a few seconds behind the redirect back into the app.
const POLL_INTERVAL_MS = 2000;
const POLL_MAX_TRIES = 8;

/**
 * Watches for the `?checkout=` return parameter that Stripe Checkout appends
 * when it redirects the user back into the app, and turns that silent return
 * into clear feedback:
 *
 *  - `success`  — confirm the upgrade and actively refetch the profile summary
 *                 (polling briefly to cover the webhook sync delay) so the rest
 *                 of the app unlocks premium the moment it is recognised.
 *  - `cancelled` — reassure the user that no charge was made.
 *
 * Mounted once inside the signed-in shell so it catches the redirect no matter
 * which page Stripe lands the user on. Renders nothing.
 */
export default function CheckoutReturn() {
  const qc = useQueryClient();
  const { data: summary } = useGetProfileSummary();
  const [awaitingPremium, setAwaitingPremium] = useState(false);
  const handled = useRef(false);
  const premiumRef = useRef(false);

  useEffect(() => {
    premiumRef.current = summary?.isPremium ?? false;
  }, [summary?.isPremium]);

  // Detect the return parameter exactly once, then strip it from the URL so a
  // refresh or back-navigation doesn't replay the confirmation.
  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    const checkout = params.get("checkout");
    if (!checkout) return;
    handled.current = true;

    params.delete("checkout");
    const query = params.toString();
    window.history.replaceState(
      {},
      "",
      window.location.pathname + (query ? `?${query}` : ""),
    );

    if (checkout === "success") {
      qc.invalidateQueries({ queryKey: getGetProfileSummaryQueryKey() });
      setAwaitingPremium(true);
    } else if (checkout === "cancelled") {
      toast({
        title: "Checkout cancelled",
        description: "No charge was made. You can upgrade to Premium anytime.",
      });
    }
  }, [qc]);

  // Celebrate as soon as the subscription is recognised.
  useEffect(() => {
    if (awaitingPremium && summary?.isPremium) {
      setAwaitingPremium(false);
      toast({
        title: "Welcome to Premium!",
        description: "The full galaxy is now unlocked. Enjoy the journey.",
      });
    }
  }, [awaitingPremium, summary?.isPremium]);

  // While waiting, re-check the subscription on a short interval to cover the
  // Stripe webhook sync lag, giving up gracefully after a few tries.
  useEffect(() => {
    if (!awaitingPremium) return;
    let tries = 0;
    const id = window.setInterval(() => {
      if (premiumRef.current) {
        window.clearInterval(id);
        return;
      }
      tries += 1;
      qc.invalidateQueries({ queryKey: getGetProfileSummaryQueryKey() });
      if (tries >= POLL_MAX_TRIES) {
        window.clearInterval(id);
        setAwaitingPremium(false);
        toast({
          title: "Payment received",
          description:
            "Your Premium access will appear in a moment. Refresh the page if it doesn't.",
        });
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [awaitingPremium, qc]);

  return null;
}
