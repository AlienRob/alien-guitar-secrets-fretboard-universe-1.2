import { Link } from "wouter";
import { Lock, Sparkles, Check, Guitar } from "lucide-react";
import RedeemCodeBox from "@/components/redeem-code";
import GuitarThumb from "@/components/guitar-thumb";
import { RARITY_META, type Guitar as GuitarModel } from "@/data/guitars";
import { loadHandedness } from "@/lib/playerCustomization";

interface Props {
  title: string;
  description: string;
  features?: string[];
  // Upcoming guitars that unlock within this premium-locked system's level
  // range — shown as a teaser to motivate upgrading. Only ones the player
  // hasn't earned yet.
  rewards?: GuitarModel[];
}

// How many reward guitars to tease on the paywall before collapsing the rest
// into a "+N more" hint.
const MAX_REWARD_PREVIEW = 4;

// Reusable upsell shown wherever a free player hits premium-only content.
export default function PremiumGate({ title, description, features, rewards }: Props) {
  const previewRewards = rewards?.slice(0, MAX_REWARD_PREVIEW) ?? [];
  const remaining = (rewards?.length ?? 0) - previewRewards.length;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-primary/30 bg-card/40 p-8 text-center backdrop-blur alien-glow">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-primary/10">
        <Lock className="h-6 w-6 text-accent" />
      </div>
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-accent">
        <Sparkles className="h-3.5 w-3.5" /> Premium
      </div>
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>

      {features && features.length > 0 && (
        <ul className="mt-5 w-full max-w-sm space-y-2 text-left">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" strokeWidth={3} />
              <span>{f}</span>
            </li>
          ))}
        </ul>
      )}

      {previewRewards.length > 0 && (
        <div className="mt-6 w-full max-w-sm space-y-3 border-t border-white/8 pt-6">
          <div className="text-left">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
              <Guitar className="h-4 w-4" /> Rewards in this system
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Upgrade and keep levelling up to claim these guitars for your Display Vault.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {previewRewards.map((g) => {
              const rarity = RARITY_META[g.rarity];
              return (
                <div
                  key={g.id}
                  className="flex items-center gap-3 rounded-lg border bg-card/30 p-3 text-left"
                  style={{ borderColor: `${rarity.color}40` }}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center">
                    <GuitarThumb
                      guitar={g}
                      handed={loadHandedness()}
                      className="h-16 w-auto opacity-90"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{g.name}</div>
                    <div
                      className="text-[10px] font-mono uppercase tracking-widest"
                      style={{ color: rarity.color }}
                    >
                      {rarity.label}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-xs text-[#FFD700]">
                      <Lock className="h-3 w-3 shrink-0" /> Unlocks at level {g.unlockLevel}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {remaining > 0 && (
            <p className="text-xs text-muted-foreground">
              + {remaining} more guitar{remaining === 1 ? "" : "s"} in this system
            </p>
          )}
        </div>
      )}

      <Link href="/pricing">
        <button
          type="button"
          className="mt-7 flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
        >
          <Sparkles className="h-4 w-4" />
          Upgrade to Premium
        </button>
      </Link>

      <RedeemCodeBox className="mt-6 w-full max-w-sm text-left" />
    </div>
  );
}
