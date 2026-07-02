import { useCallback, useMemo, useState, useEffect } from "react";
import { Link } from "wouter";
import { useGetProfile, useGetProfileSummary } from "@workspace/api-client-react";
import { Lock } from "lucide-react";
import {
  GUITARS,
  WINGS,
  RARITY_META,
  guitarsByWing,
  type Guitar,
} from "@/data/guitars";
import {
  GEAR_CATEGORIES,
  gearByCategory,
  isGearUnlocked,
  requirementLabel,
  type GearItem,
  type GearStats,
} from "@/data/gear";
import GuitarThumb from "@/components/guitar-thumb";
import GuitarModel3D from "@/components/guitar-model-3d";
import GearThumb from "@/components/gear-thumb";
import AvatarArt from "@/components/avatar-art";
import GuitarDetailModal from "@/components/guitar-detail-modal";
import GearDetailModal from "@/components/gear-detail-modal";
import UnlockAnimation from "@/components/unlock-animation";
import { BagShop } from "@/components/bag-shop";
import {
  loadAvatar,
  loadSeenGuitars,
  saveSeenGuitars,
  isSeenInitialized,
  loadEarnedGear,
  loadHandedness,
  saveHandedness,
  loadAlienCoins,
  type Handed,
} from "@/lib/playerCustomization";
import { DEFAULT_AVATAR, type AvatarConfig } from "@/data/avatarOptions";
import { effectiveUnlockLevel } from "@/lib/access";
import {
  loadBossState,
  allBossesDefeatedState,
  isGuitarUnlocked,
} from "@/lib/bossBattles";

// A single guitar hanging from a wall peg. Earned guitars hang in full colour
// with a rarity glow and a brass plaque; locked guitars show a ghosted
// silhouette dangling from an empty hanger with the level needed to claim it.
function HangingGuitar({
  guitar,
  unlocked,
  handed,
  onClick,
}: {
  guitar: Guitar;
  unlocked: boolean;
  handed: Handed;
  onClick: () => void;
}) {
  const rarity = RARITY_META[guitar.rarity];

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col items-center pt-4 focus:outline-none"
    >
      {/* wall peg */}
      <div
        className="relative z-20 h-3.5 w-3.5 rounded-full border border-white/40 bg-gradient-to-b from-zinc-200 to-zinc-600 shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
        style={unlocked ? { boxShadow: `0 0 8px ${rarity.glow}` } : undefined}
      />
      {/* hanging cord */}
      <div className="z-0 -mt-px h-7 w-px bg-gradient-to-b from-white/45 to-white/10" />

      {/* the guitar, swinging slightly from the peg on hover */}
      <div className="relative z-10 -mt-1 origin-top transition-transform duration-500 ease-out group-hover:-rotate-3">
        <div
          className="relative flex h-44 items-center justify-center px-2"
          style={unlocked ? { filter: `drop-shadow(0 0 14px ${rarity.glow})` } : undefined}
        >
          <div className={unlocked ? "" : "opacity-25 grayscale"}>
            {guitar.model3d && unlocked ? (
              <GuitarModel3D
                guitar={guitar}
                handed={handed}
                interactive={false}
                className="h-44 aspect-[0.34]"
              />
            ) : (
              <GuitarThumb guitar={guitar} handed={handed} className="h-44 w-auto" />
            )}
          </div>
          {!unlocked && (
            <div className="absolute right-0 top-1 flex items-center gap-1 rounded-md border border-white/15 bg-black/70 px-2 py-1 backdrop-blur">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[10px] font-mono text-muted-foreground">LVL {guitar.unlockLevel}</span>
            </div>
          )}
        </div>
      </div>

      {/* brass plaque under the guitar */}
      <div
        className="mt-2 w-[88%] rounded-md border px-2 py-1.5 text-center backdrop-blur transition-colors"
        style={{
          borderColor: unlocked ? rarity.color : "hsl(229 30% 22%)",
          background: unlocked
            ? "linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.25))"
            : "rgba(10,14,31,0.5)",
        }}
      >
        <div
          className="truncate text-sm font-sans font-semibold"
          style={{ color: unlocked ? "#fff" : "hsl(229 20% 60%)" }}
        >
          {guitar.name}
        </div>
        <div
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: unlocked ? rarity.color : "hsl(229 20% 44%)" }}
        >
          {unlocked ? rarity.label : `${rarity.label} · Locked`}
        </div>
      </div>
    </button>
  );
}

// A single collectible gear item sitting in its display niche. Earned items
// glow with their rarity colour; locked items are ghosted with the milestone
// needed to claim them.
function GearCard({
  item,
  unlocked,
  onClick,
}: {
  item: GearItem;
  unlocked: boolean;
  onClick: () => void;
}) {
  const rarity = RARITY_META[item.rarity];
  return (
    <button
      onClick={onClick}
      className="group relative flex flex-col items-center focus:outline-none"
    >
      <div
        className="flex aspect-square w-full items-center justify-center rounded-xl border p-3 transition-colors group-hover:border-accent/70"
        style={{
          borderColor: unlocked ? rarity.color : "hsl(229 30% 22%)",
          background: unlocked
            ? "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.08), rgba(0,0,0,0.35))"
            : "rgba(10,14,31,0.5)",
          boxShadow: unlocked ? `inset 0 0 22px ${rarity.glow}` : undefined,
        }}
      >
        <div
          className={unlocked ? "h-24 w-24" : "h-24 w-24 opacity-25 grayscale"}
          style={unlocked ? { filter: `drop-shadow(0 0 8px ${rarity.glow})` } : undefined}
        >
          <GearThumb item={item} className="h-full w-full" />
        </div>
        {!unlocked && (
          <div className="absolute right-2 top-2 flex items-center gap-1 rounded-md border border-white/15 bg-black/70 px-2 py-1 backdrop-blur">
            <Lock className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-mono text-muted-foreground">
              {requirementLabel(item.req)}
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 w-full text-center">
        <div
          className="truncate text-sm font-sans font-semibold"
          style={{ color: unlocked ? "#fff" : "hsl(229 20% 60%)" }}
        >
          {item.name}
        </div>
        <div
          className="text-[10px] font-mono uppercase tracking-widest"
          style={{ color: unlocked ? rarity.color : "hsl(229 20% 44%)" }}
        >
          {unlocked ? rarity.label : `${rarity.label} · Locked`}
        </div>
      </div>
    </button>
  );
}

export default function Vault() {
  const { data: profile, isLoading } = useGetProfile();
  const { data: summary } = useGetProfileSummary();
  const realLevel = profile?.level ?? 0;
  const fullAccess = summary?.fullAccess ?? false;
  const level = effectiveUnlockLevel(realLevel, fullAccess);

  const realBossState = useMemo(() => loadBossState(), []);
  const displayBossState = useMemo(
    () => (fullAccess ? allBossesDefeatedState() : realBossState),
    [fullAccess, realBossState],
  );

  const [selected, setSelected] = useState<Guitar | null>(null);
  const [selectedGear, setSelectedGear] = useState<GearItem | null>(null);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Guitar[]>([]);
  const [celebrateIndex, setCelebrateIndex] = useState(0);
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [handed, setHanded] = useState<Handed>("right");
  const [coins, setCoins] = useState(() => loadAlienCoins());
  const [earnedGearKey, setEarnedGearKey] = useState(0); // bump to re-derive earnedGear

  useEffect(() => {
    setAvatar(loadAvatar());
    setHanded(loadHandedness());
    setCoins(loadAlienCoins());
  }, []);

  const toggleHanded = useCallback(() => {
    setHanded((h) => {
      const next: Handed = h === "right" ? "left" : "right";
      saveHandedness(next);
      return next;
    });
  }, []);

  const unlockedCount = useMemo(
    () => GUITARS.filter((g) => isGuitarUnlocked(g, level, displayBossState)).length,
    [level, displayBossState],
  );

  const gearStats: GearStats = useMemo(
    () => ({
      level: realLevel,
      sessions: profile?.totalChallenges ?? 0,
      streak: profile?.streak ?? 0,
      fullAccess,
    }),
    [realLevel, profile?.totalChallenges, profile?.streak, fullAccess],
  );

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const earnedGear = useMemo(() => loadEarnedGear(), [earnedGearKey]);
  const isGearItemUnlocked = useCallback(
    (item: GearItem) => isGearUnlocked(item, gearStats) || earnedGear.has(item.id),
    [gearStats, earnedGear],
  );

  useEffect(() => {
    if (isLoading || !profile) return;
    const unlockedIds = GUITARS.filter((g) => isGuitarUnlocked(g, realLevel, realBossState)).map((g) => g.id);
    if (!isSeenInitialized()) {
      saveSeenGuitars(new Set(unlockedIds));
      return;
    }
    const seen = loadSeenGuitars();
    const fresh = unlockedIds.filter((id) => !seen.has(id));
    if (fresh.length > 0) {
      setNewlyUnlocked(GUITARS.filter((g) => fresh.includes(g.id)));
      setCelebrateIndex(0);
      saveSeenGuitars(new Set(unlockedIds));
    }
  }, [isLoading, profile, realLevel]);

  const advanceCelebration = useCallback(() => {
    setCelebrateIndex((i) => {
      if (i + 1 >= newlyUnlocked.length) {
        setNewlyUnlocked([]);
        return 0;
      }
      return i + 1;
    });
  }, [newlyUnlocked.length]);

  const handleCoinsChanged = useCallback((newTotal: number) => {
    setCoins(newTotal);
    // Re-derive earned gear so newly claimed items appear unlocked
    setEarnedGearKey((k) => k + 1);
  }, []);

  if (isLoading) {
    return <div className="text-accent animate-pulse">OPENING THE VAULT...</div>;
  }

  return (
    <div className="space-y-10 max-w-6xl mx-auto pb-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-sans font-bold text-accent">GALACTIC DISPLAY VAULT</h1>
          <p className="text-muted-foreground">
            A hanging gallery of legendary instruments. Level up to fill every empty hanger.
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Coin balance */}
          <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-400/8 px-4 py-2">
            <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="Alien Coins" className="h-7 w-7 object-contain" />
            <div>
              <div className="text-lg font-bold text-amber-400">{coins}</div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Alien Coins</div>
            </div>
          </div>
          <button
            onClick={toggleHanded}
            className="rounded-lg border border-primary/40 bg-card/40 px-4 py-2 text-center transition-colors hover:border-accent/60"
            title="Switch guitar orientation"
          >
            <div className="text-sm font-bold text-accent">{handed === "right" ? "Right" : "Left"} handed</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Tap to flip</div>
          </button>
          <div className="rounded-lg border border-primary/40 bg-card/40 px-4 py-2 text-center alien-glow">
            <div className="text-2xl font-bold text-accent">
              {unlockedCount}
              <span className="text-muted-foreground text-base"> / {GUITARS.length}</span>
            </div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Collected</div>
          </div>
        </div>
      </div>

      {/* Curator avatar */}
      <div className="flex items-center gap-4 rounded-xl border border-primary/30 bg-card/40 p-4 backdrop-blur transition-all hover:border-accent/60">
        <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl sm:h-32 sm:w-28">
          <AvatarArt config={avatar} className="h-full w-full" enlargeable headshot />
        </div>
        <Link href="/avatar" className="min-w-0 flex-1 cursor-pointer">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Vault Curator</div>
          <div className="truncate text-lg font-sans font-bold text-foreground">
            {avatar.displayName || profile?.username || "Unnamed Cadet"}
          </div>
          <div className="text-xs font-mono uppercase tracking-widest text-accent">Level {realLevel}</div>
          <div className="mt-1 text-xs text-secondary">Tap to customise your guitarist</div>
        </Link>
      </div>

      {/* ── BAG SHOP ─────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="border-b border-primary/20 pb-2">
          <h2 className="text-2xl font-sans font-bold text-accent">BAG SHOP</h2>
          <p className="text-muted-foreground text-sm">
            Spend your Alien Coins to open mystery gear bags. Earn coins by completing drills.
          </p>
        </div>
        <div className="rounded-xl border border-primary/20 bg-gradient-to-b from-[#0c1126] to-[#070a18] p-5 sm:p-7"
          style={{ boxShadow: "inset 0 0 40px rgba(0,191,255,0.04)" }}>
          <BagShop onCoinsChanged={handleCoinsChanged} />
        </div>
      </div>

      {/* ── Guitar wings ─────────────────────────────────────────────────── */}
      {WINGS.map((wing) => {
        const guitars = guitarsByWing(wing.id);
        if (guitars.length === 0) return null;
        const wingUnlocked = guitars.filter((g) => isGuitarUnlocked(g, level, displayBossState)).length;
        return (
          <section key={wing.id}>
            <div className="mb-4 flex items-baseline justify-between border-b border-primary/20 pb-2">
              <div>
                <h2 className="text-xl font-sans font-bold text-secondary">{wing.title}</h2>
                <p className="text-xs text-muted-foreground">{wing.subtitle}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {wingUnlocked}/{guitars.length}
              </span>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-b from-[#0c1126] to-[#070a18] p-4 pt-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-30px_60px_rgba(0,0,0,0.5)] sm:p-6 sm:pt-4">
              {/* mounting rail */}
              <div className="mb-1 h-2 w-full rounded-full bg-gradient-to-b from-zinc-500/70 to-zinc-800/80 shadow-[0_2px_4px_rgba(0,0,0,0.5)]" />
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                {guitars.map((g) => (
                  <HangingGuitar
                    key={g.id}
                    guitar={g}
                    unlocked={isGuitarUnlocked(g, level, displayBossState)}
                    handed={handed}
                    onClick={() => setSelected(g)}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* Gear Locker */}
      <div className="border-t border-primary/20 pt-8">
        <h2 className="text-2xl font-sans font-bold text-accent">GEAR LOCKER</h2>
        <p className="text-muted-foreground">
          Collectible kit earned from the Bag Shop and milestone unlocks. Amps unlock by levelling up.
        </p>
      </div>

      {GEAR_CATEGORIES.map((cat) => {
        const items = gearByCategory(cat.id);
        if (items.length === 0) return null;
        const catUnlocked = items.filter((i) => isGearItemUnlocked(i)).length;
        return (
          <section key={cat.id}>
            <div className="mb-4 flex items-baseline justify-between border-b border-primary/20 pb-2">
              <div>
                <h2 className="text-xl font-sans font-bold text-secondary">{cat.title}</h2>
                <p className="text-xs text-muted-foreground">{cat.subtitle}</p>
              </div>
              <span className="text-xs font-mono text-muted-foreground">
                {catUnlocked}/{items.length}
              </span>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-b from-[#0c1126] to-[#070a18] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),inset_0_-30px_60px_rgba(0,0,0,0.5)] sm:p-6">
              <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4">
                {items.map((item) => (
                  <GearCard
                    key={item.id}
                    item={item}
                    unlocked={isGearItemUnlocked(item)}
                    onClick={() => setSelectedGear(item)}
                  />
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {selected && (
        <GuitarDetailModal guitar={selected} level={level} onClose={() => setSelected(null)} />
      )}

      {selectedGear && (
        <GearDetailModal
          item={selectedGear}
          unlocked={isGearItemUnlocked(selectedGear)}
          onClose={() => setSelectedGear(null)}
        />
      )}

      {newlyUnlocked.length > 0 && (
        <UnlockAnimation
          guitars={newlyUnlocked}
          index={celebrateIndex}
          onNext={advanceCelebration}
        />
      )}
    </div>
  );
}
