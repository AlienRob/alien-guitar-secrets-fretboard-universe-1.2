import { Link } from "wouter";
import { Lock, Skull, Swords, Guitar } from "lucide-react";
import GuitarThumb from "@/components/guitar-thumb";
import { RARITY_META, type Guitar as GuitarModel } from "@/data/guitars";
import { loadHandedness } from "@/lib/playerCustomization";
import type { BossBattle } from "@/data/bossBattles";

interface Props {
  // The boss that guards entry to the system being previewed.
  boss: BossBattle;
  // Whether the player has levelled up to the boss yet (can fight it now).
  reached: boolean;
  // Trophy + level guitars awaiting in the locked system.
  rewards?: GuitarModel[];
}

const MAX_REWARD_PREVIEW = 4;

// Shown when a premium player pages into a solar system whose guarding boss they
// haven't defeated. The wormhole stays shut until the boss falls.
export default function WormholeGate({ boss, reached, rewards }: Props) {
  const previewRewards = rewards?.slice(0, MAX_REWARD_PREVIEW) ?? [];
  const remaining = (rewards?.length ?? 0) - previewRewards.length;

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-[#FFD700]/30 bg-card/40 p-8 text-center backdrop-blur alien-glow">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#FFD700]/40 bg-[#FFD700]/10">
        <Skull className="h-6 w-6 text-[#FFD700]" />
      </div>
      <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.3em] text-[#FFD700]">
        <Lock className="h-3.5 w-3.5" /> Wormhole Sealed
      </div>
      <h2 className="text-2xl font-bold text-white">{boss.name}</h2>
      <p className="mt-2 max-w-md text-sm text-[#FFD700]">{boss.tagline}</p>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">{boss.flavor}</p>

      {reached ? (
        <Link href={`/boss/${boss.system}`}>
          <button
            type="button"
            className="mt-7 flex items-center gap-2 rounded-md bg-[#FFD700] px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-[#FFD700]/90"
          >
            <Swords className="h-4 w-4" />
            Enter Boss Battle
          </button>
        </Link>
      ) : (
        <div className="mt-7 flex items-center gap-2 rounded-md border border-white/10 px-6 py-3 text-sm font-semibold text-muted-foreground">
          <Lock className="h-4 w-4" />
          Reach level {boss.bossLevel} to challenge {boss.name}
        </div>
      )}

      {previewRewards.length > 0 && (
        <div className="mt-7 w-full max-w-sm space-y-3 border-t border-white/8 pt-6">
          <div className="text-left">
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
              <Guitar className="h-4 w-4" /> Rewards beyond the wormhole
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Defeat the boss and keep levelling up to claim these for your Display Vault.
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
              + {remaining} more guitar{remaining === 1 ? "" : "s"} beyond the wormhole
            </p>
          )}
        </div>
      )}
    </div>
  );
}
