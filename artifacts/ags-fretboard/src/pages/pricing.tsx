import { useEffect, useState } from "react";
import { Link } from "wouter";
import { useGetProfileSummary } from "@workspace/api-client-react";
import { Check, Sparkles, Loader2, Crown, ArrowLeft, Star } from "lucide-react";
import RedeemCodeBox from "@/components/redeem-code";

interface PriceRow {
  product_id: string;
  product_name: string;
  product_description: string | null;
  price_id: string;
  unit_amount: number | null;
  currency: string;
  nickname: string | null;
  metadata: Record<string, string>;
  recurring: { interval?: string; interval_count?: number } | null;
}

const PREMIUM_FEATURES = [
  "All drills — fretboard notes, scales, chords, ear training & games",
  "Every lesson — intervals, finding notes, chord construction, scales & modes",
  "The full galaxy — every solar system and boss battle",
  "Display Vault — collect and showcase legendary guitars",
  "Avatar Creator — forge your galactic guitarist identity",
  "Cinematic launch sequences and wormhole jumps",
];

const FREE_FEATURES = [
  "Intervals drill — unlimited practice",
  "Fretboard explorer — full neck, all keys",
  "Basic tuner (standard 6-string)",
  "Basic metronome (4/4 time)",
  "Galaxy Solar System 1",
];

function intervalOf(p: PriceRow): "month" | "year" {
  if (p.recurring?.interval === "year") return "year";
  if (p.recurring?.interval === "month") return "month";
  return (p.unit_amount ?? 0) >= 3000 ? "year" : "month";
}

function isFounders(p: PriceRow): boolean {
  return p.metadata?.founders === "true" || p.nickname === "Founders Annual";
}

function formatPrice(p: PriceRow): string {
  const amount = (p.unit_amount ?? 0) / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: (p.currency || "usd").toUpperCase(),
      minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    }).format(amount);
  } catch {
    return `$${amount}`;
  }
}

export default function Pricing() {
  const { data: summary } = useGetProfileSummary();
  const isPremium = summary?.isPremium ?? false;

  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/stripe/products", { headers: { accept: "application/json" } })
      .then((r) => r.json())
      .then((j) => {
        if (active) setPrices(Array.isArray(j?.data) ? j.data : []);
      })
      .catch(() => {
        if (active) setPrices([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const startCheckout = async (priceId: string) => {
    setBusy(priceId);
    setError(null);
    try {
      const base = import.meta.env.BASE_URL;
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          priceId,
          successPath: `${base}galaxy?checkout=success`,
          cancelPath: `${base}pricing?checkout=cancelled`,
        }),
      });
      if (!res.ok) throw new Error();
      const j = await res.json();
      if (j?.url) {
        window.location.href = j.url;
      } else {
        throw new Error();
      }
    } catch {
      setError("Could not start checkout. Please try again.");
      setBusy(null);
    }
  };

  const openPortal = async () => {
    setBusy("portal");
    setError(null);
    try {
      const base = import.meta.env.BASE_URL;
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ returnPath: `${base}pricing` }),
      });
      if (!res.ok) throw new Error();
      const j = await res.json();
      if (j?.url) {
        window.location.href = j.url;
      } else {
        throw new Error();
      }
    } catch {
      setError("Could not open the billing portal. Please try again.");
      setBusy(null);
    }
  };

  // Separate plans: prefer founders annual if present, else regular annual
  const monthly = prices.find((p) => intervalOf(p) === "month");
  const annualPlans = prices.filter((p) => intervalOf(p) === "year");
  const foundersAnnual = annualPlans.find(isFounders);
  const regularAnnual = annualPlans.find((p) => !isFounders(p));
  const annual = foundersAnnual ?? regularAnnual;

  // Savings vs monthly
  let savingsLabel: string | null = null;
  if (monthly?.unit_amount && annual?.unit_amount) {
    const annualised = monthly.unit_amount * 12;
    const saved = annualised - annual.unit_amount;
    if (saved > 0) {
      const pct = Math.round((saved / annualised) * 100);
      savingsLabel = `Save ${pct}% vs monthly`;
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      {/* ── Hero ── */}
      <div className="text-center">
        <div className="mb-2 flex items-center justify-center gap-1.5 text-xs uppercase tracking-[0.35em] text-accent">
          <Sparkles className="h-3.5 w-3.5" /> Alien Guitar Secrets Premium
        </div>
        <h1 className="text-3xl font-bold text-white sm:text-4xl">
          Unlock the full galaxy
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Start free with the fretboard explorer and intervals drill.
          Go Premium for every lesson, every drill, boss battles, and the full collection experience.
        </p>
      </div>

      {error && (
        <div className="mx-auto max-w-xl rounded-md border border-[#ff3b30]/40 bg-[#ff3b30]/10 px-4 py-3 text-center text-sm text-[#ff6b60]">
          {error}
        </div>
      )}

      {/* ── Already premium ── */}
      {isPremium ? (
        <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-primary/30 bg-card/40 p-8 text-center backdrop-blur alien-glow">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
            <Crown className="h-6 w-6 text-[#FFD700]" />
          </div>
          <h2 className="text-2xl font-bold text-white">You're Premium</h2>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            The entire galaxy is yours. Manage your plan, payment method, or
            cancel anytime through the billing portal.
          </p>
          <button
            type="button"
            onClick={openPortal}
            disabled={busy === "portal"}
            className="mt-6 flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {busy === "portal" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Crown className="h-4 w-4" />
            )}
            Manage subscription
          </button>
          <Link href="/galaxy">
            <button className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" /> Back to the galaxy
            </button>
          </Link>
        </div>
      ) : loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : (
        <>
          {/* ── Plan cards ── */}
          {prices.length === 0 ? (
            <div className="mx-auto max-w-xl space-y-6">
              <div className="rounded-2xl border border-primary/30 bg-card/40 p-8 backdrop-blur">
                <h2 className="text-lg font-bold text-white">What you'll get</h2>
                <ul className="mt-4 space-y-2.5">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={3} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-center text-sm text-muted-foreground">
                Subscription plans are being set up. Please check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              {monthly && (
                <PlanCard
                  title="Monthly"
                  price={formatPrice(monthly)}
                  cadence="/month"
                  features={PREMIUM_FEATURES}
                  busy={busy === monthly.price_id}
                  disabled={busy !== null}
                  onSelect={() => startCheckout(monthly.price_id)}
                />
              )}
              {annual && (
                <PlanCard
                  title={foundersAnnual ? "Founders Annual" : "Annual"}
                  price={formatPrice(annual)}
                  cadence="/year"
                  highlight
                  badge={foundersAnnual ? "Founders — limited time" : (savingsLabel ?? "Best value")}
                  badgeVariant={foundersAnnual ? "founders" : "default"}
                  features={PREMIUM_FEATURES}
                  busy={busy === annual.price_id}
                  disabled={busy !== null}
                  onSelect={() => startCheckout(annual.price_id)}
                  footnote={
                    foundersAnnual
                      ? `Locked in for life — renews at $${((annual.unit_amount ?? 0) / 100).toFixed(0)}/year. Price rises when the founders period ends.`
                      : savingsLabel
                        ? `Equivalent to $${(((annual.unit_amount ?? 0) / 100) / 12).toFixed(2)}/month`
                        : undefined
                  }
                />
              )}
            </div>
          )}

          {/* ── Free vs Premium comparison ── */}
          <div className="mx-auto max-w-2xl">
            <h2 className="mb-5 text-center text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Free vs Premium
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-card/20 p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Free</p>
                <ul className="space-y-2">
                  {FREE_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/70">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-white/30" strokeWidth={3} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-primary/40 bg-primary/5 p-5 alien-glow">
                <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-accent">
                  <Star className="h-3 w-3" /> Premium
                </p>
                <ul className="space-y-2">
                  {PREMIUM_FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" strokeWidth={3} />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* ── Redeem code ── */}
          <RedeemCodeBox className="mx-auto max-w-xl" />

          <div className="text-center">
            <Link href="/galaxy">
              <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Continue with the free tier
              </button>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}

function PlanCard({
  title,
  price,
  cadence,
  features,
  highlight,
  badge,
  badgeVariant = "default",
  busy,
  disabled,
  onSelect,
  footnote,
}: {
  title: string;
  price: string;
  cadence: string;
  features: string[];
  highlight?: boolean;
  badge?: string;
  badgeVariant?: "default" | "founders";
  busy: boolean;
  disabled: boolean;
  onSelect: () => void;
  footnote?: string;
}) {
  const badgeCls =
    badgeVariant === "founders"
      ? "border-amber-400/60 bg-[#0b1020] text-amber-300"
      : "border-accent/50 bg-[#0b1020] text-accent";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border bg-card/40 p-6 backdrop-blur ${
        highlight ? "border-primary alien-glow" : "border-primary/30"
      }`}
    >
      {badge && (
        <span
          className={`absolute -top-3 left-6 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${badgeCls}`}
        >
          {badge}
        </span>
      )}
      <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-bold text-white">{price}</span>
        <span className="text-sm text-muted-foreground">{cadence}</span>
      </div>
      {footnote && (
        <p className="mt-1 text-xs text-muted-foreground/70">{footnote}</p>
      )}
      <ul className="mt-5 flex-1 space-y-2.5">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={3} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled}
        className={`mt-6 flex items-center justify-center gap-2 rounded-md px-6 py-3 text-sm font-semibold transition-colors disabled:opacity-60 ${
          highlight
            ? "bg-primary text-white hover:bg-primary/90"
            : "border border-primary/40 bg-primary/10 text-white hover:bg-primary/20"
        }`}
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
        Get Premium
      </button>
    </div>
  );
}
