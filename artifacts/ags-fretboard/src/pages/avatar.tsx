import { useEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { useGetProfile, useGetProfileSummary } from "@workspace/api-client-react";
import { Link } from "wouter";
import {
  Check,
  Shuffle,
  Lock,
  Guitar as GuitarIcon,
  Sparkles,
  Trophy,
  Share2,
  Speaker,
  Cable as CableIcon,
  SlidersHorizontal,
  Triangle,
  ChevronRight,
  ZoomIn,
  X,
} from "lucide-react";
import logoHorizontal from "@assets/ags_horizontal_logo_nobg.png";
import {
  AvatarConfig,
  SPECIES,
  GENDERS,
  HAIR_COLOURS,
  SKINS,
  DEFAULT_AVATAR,
  isHairless,
  type Option,
} from "@/data/avatarOptions";
import { GUITARS, isUnlocked, RARITY_META } from "@/data/guitars";
import {
  GEAR,
  isGearUnlocked,
  type GearItem,
  type GearStats,
} from "@/data/gear";
import GuitarThumb from "@/components/guitar-thumb";
import GearThumb from "@/components/gear-thumb";
import AvatarArt from "@/components/avatar-art";
import cosmicHallImg from "@assets/cosmic_hall_stage_no_title.png";
import {
  loadAvatar,
  saveAvatar,
  loadHandedness,
  loadEarnedGear,
  type Handed,
} from "@/lib/playerCustomization";
import { effectiveUnlockLevel } from "@/lib/access";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Guitar } from "@/data/guitars";

// What a zoom modal is showing: either an unlocked guitar or a won gear item.
type ZoomTarget =
  | { type: "guitar"; guitar: Guitar }
  | { type: "gear"; item: GearItem };

const CATEGORY_LABEL: Record<GearItem["category"], string> = {
  pick: "Pick",
  strap: "Strap",
  amp: "Amplifier",
  cable: "Cable",
  pedal: "Pedal",
  coin: "Coins",
};

// A large, read-only "zoomed in" look at a single won item, opened when the
// player taps any item card. Guitars show their inspiration/technique/theory;
// gear shows its blurb. Equipping still happens from the cards themselves.
function ItemZoomDialog({
  target,
  handed,
  onClose,
}: {
  target: ZoomTarget | null;
  handed: Handed;
  onClose: () => void;
}) {
  const rarity = target
    ? RARITY_META[target.type === "guitar" ? target.guitar.rarity : target.item.rarity]
    : null;

  return (
    <Dialog open={!!target} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md border border-primary/30 bg-[#0a0c1a] text-foreground">
        {target && rarity && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {target.type === "guitar" ? target.guitar.name : target.item.name}
              </DialogTitle>
              <DialogDescription
                className="font-mono text-[11px] uppercase tracking-widest"
                style={{ color: rarity.color }}
              >
                {rarity.label}{" "}
                {target.type === "guitar" ? "Guitar" : CATEGORY_LABEL[target.item.category]}
              </DialogDescription>
            </DialogHeader>

            <div
              className="flex items-center justify-center rounded-xl border border-primary/15 bg-black/30 py-6"
              style={{ boxShadow: `inset 0 0 40px ${rarity.glow}` }}
            >
              {target.type === "guitar" ? (
                <GuitarThumb guitar={target.guitar} handed={handed} className="h-56 w-auto" />
              ) : (
                <GearThumb item={target.item} className="h-48 w-auto" />
              )}
            </div>

            {target.type === "guitar" ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    Inspired by
                  </dt>
                  <dd className="text-foreground">{target.guitar.inspiration}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    Signature technique
                  </dt>
                  <dd className="text-foreground">{target.guitar.signatureTechnique}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
                    Theory focus
                  </dt>
                  <dd className="text-foreground">{target.guitar.theory}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">{target.item.blurb}</p>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Small magnifier overlay shown on equippable item cards. Sits as a sibling of
// the equip button (never nested) and opens the zoom modal without equipping.
function ZoomButton({ onClick, label }: { onClick: () => void; label?: string }) {
  const text = label ? `View larger: ${label}` : "View larger";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={text}
      aria-label={text}
      className="absolute right-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-primary/30 bg-black/60 text-muted-foreground backdrop-blur transition-colors hover:border-accent hover:text-accent"
    >
      <ZoomIn className="h-3.5 w-3.5" />
    </button>
  );
}

function OptionRow<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-xs uppercase tracking-widest text-primary">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`rounded-md border px-3 py-2 text-sm transition-all ${
              value === opt.id
                ? "border-accent bg-accent/15 text-accent alien-glow-cyan"
                : "border-primary/30 bg-card/40 text-muted-foreground hover:border-primary/60 hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Panel({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-xl border border-primary/30 bg-card/40 p-5 space-y-5 backdrop-blur"
    >
      <h2 className="text-sm font-sans font-bold uppercase tracking-widest text-secondary">{title}</h2>
      {children}
    </section>
  );
}

// Belt rank → display label + flavour title + glow colour. Mirrors the server's
// computeBelt thresholds so the showcase reads the same rank the dashboard does.
const BELT_RANKS: Record<string, { label: string; title: string; color: string }> = {
  white: { label: "White Belt", title: "Cosmic Initiate", color: "#e5e7eb" },
  yellow: { label: "Yellow Belt", title: "Star Cadet", color: "#facc15" },
  orange: { label: "Orange Belt", title: "Nebula Scout", color: "#fb923c" },
  green: { label: "Green Belt", title: "Astral Ranger", color: "#34d399" },
  blue: { label: "Blue Belt", title: "Void Voyager", color: "#60a5fa" },
  purple: { label: "Purple Belt", title: "Pulsar Adept", color: "#a78bfa" },
  brown: { label: "Brown Belt", title: "Quasar Knight", color: "#c79a6b" },
  black: { label: "Black Belt", title: "Galactic Sage", color: "#94a3b8" },
  alien_master: { label: "Alien Master", title: "Starborn Master", color: "#22d3ee" },
  galactic_master: { label: "Galactic Master", title: "Galactic Overlord", color: "#fde047" },
};

function beltRank(belt: string) {
  return BELT_RANKS[belt] ?? BELT_RANKS.white;
}

// One labelled stat line in the AVATAR identity panel.
function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-t border-primary/15 pt-2 first:border-0 first:pt-0">
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold" style={color ? { color } : undefined}>
        {value}
      </span>
    </div>
  );
}

// One row in the EQUIPPED GEAR list: a small art thumb (or fallback icon),
// the slot name, and the equipped item's name.
function EquipRow({
  icon,
  thumb,
  label,
  value,
}: {
  icon: React.ReactNode;
  thumb?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-background/30 p-2.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-primary/25 bg-card/60 text-accent">
        {thumb ?? icon}
      </div>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
        <div className="truncate text-sm font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

// One glass "display case" in the bottom row. Shows the equipped/representative
// art big, the slot name, and opens a full-screen "locker" carousel for that
// category so the player can scroll their winnings and choose one. The whole
// card is the tap target (large + thumb-friendly on phones).
function GearCase({
  label,
  name,
  onOpen,
  children,
}: {
  label: string;
  name: string;
  onOpen: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col rounded-xl border border-primary/30 bg-gradient-to-b from-primary/10 to-background/40 p-3 text-center backdrop-blur transition-all hover:border-accent/60 hover:from-primary/20"
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-secondary">{label}</div>
      <div className="my-2 flex h-32 items-center justify-center rounded-lg border border-primary/20 bg-background/50 p-2 sm:h-24">
        {children}
      </div>
      <div className="truncate text-xs font-semibold text-foreground">{name}</div>
      <span className="mt-2 inline-flex items-center justify-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-accent transition-all group-hover:bg-accent/20">
        View all <ChevronRight className="h-3 w-3" />
      </span>
    </button>
  );
}

// A full-screen "locker": a horizontal, snap-scrolling carousel of one
// category's winnings, each shown large. Equippable categories (guitar, strap,
// amp, cable) get an Equip toggle; collections (pedals, picks) are view-only.
// Picking closes the locker so the choice is visible back on the rig.
type LockerEntry = {
  id: string;
  name: string;
  rarityKey: string;
  equipped: boolean;
  thumb: React.ReactNode;
  detail: React.ReactNode;
};

function EquipmentLocker({
  title,
  entries,
  equippable,
  removable,
  onEquip,
  onClose,
}: {
  title: string;
  entries: LockerEntry[];
  equippable: boolean;
  removable: boolean;
  onEquip?: (id: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-[#05060f]/97 backdrop-blur">
      <div className="flex items-center justify-between border-b border-primary/30 px-4 py-3">
        <div className="text-sm font-sans font-bold uppercase tracking-widest text-secondary">
          {title}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-card/60 text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-muted-foreground">
          Nothing here yet — win more by levelling up and practising.
        </div>
      ) : (
        <div className="flex flex-1 snap-x snap-mandatory items-stretch gap-4 overflow-x-auto px-[7.5vw] py-6">
          {entries.map((e) => {
            const rarity = RARITY_META[e.rarityKey as keyof typeof RARITY_META] ?? null;
            const showEquip = equippable && !!onEquip;
            const locked = e.equipped && !removable;
            return (
              <div
                key={e.id}
                className="flex w-[85vw] max-w-md shrink-0 snap-center flex-col rounded-2xl border border-primary/30 bg-[#0a0c1a]/90 p-5"
              >
                {rarity && (
                  <div
                    className="text-center font-mono text-[11px] uppercase tracking-widest"
                    style={{ color: rarity.color }}
                  >
                    {rarity.label}
                  </div>
                )}
                <div className="mt-1 text-center text-lg font-bold text-foreground">{e.name}</div>
                <div
                  className="my-4 flex flex-1 items-center justify-center rounded-xl border border-primary/15 bg-black/30 p-4"
                  style={rarity ? { boxShadow: `inset 0 0 40px ${rarity.glow}` } : undefined}
                >
                  {e.thumb}
                </div>
                <div className="text-sm text-muted-foreground">{e.detail}</div>
                {showEquip && (
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => onEquip?.(e.id)}
                    className={`mt-4 inline-flex items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold transition-all ${
                      e.equipped
                        ? "border border-accent bg-accent/15 text-accent"
                        : "bg-primary text-primary-foreground hover:bg-primary/80"
                    } ${locked ? "cursor-default" : ""}`}
                  >
                    {e.equipped ? (
                      <>
                        <Check className="h-4 w-4" /> {removable ? "Equipped — tap to remove" : "Equipped"}
                      </>
                    ) : (
                      "Equip"
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Avatar() {
  const { data: profile } = useGetProfile();
  const { data: summary } = useGetProfileSummary();
  const [config, setConfig] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const [saved, setSaved] = useState(false);
  const [handed, setHanded] = useState<Handed>("right");
  const [zoom, setZoom] = useState<ZoomTarget | null>(null);
  // Which category's full-screen locker carousel is open (null = closed).
  const [locker, setLocker] = useState<"guitar" | GearItem["category"] | null>(null);

  const level = summary?.level ?? profile?.level ?? 0;
  const fullAccess = summary?.fullAccess ?? false;
  // Full-access testers see every guitar and aura unlocked; the displayed level
  // (`level`) stays their real level.
  const unlockLevel = effectiveUnlockLevel(level, fullAccess);

  useEffect(() => {
    setConfig(loadAvatar());
    setHanded(loadHandedness());
  }, []);

  // Default display name + starting guitar from profile once loaded.
  useEffect(() => {
    setConfig((c) => {
      const next = { ...c };
      if (!next.displayName && profile?.username) next.displayName = profile.username;
      if (!next.guitarId) {
        const firstUnlocked = GUITARS.find((g) => isUnlocked(g, unlockLevel));
        if (firstUnlocked) next.guitarId = firstUnlocked.id;
      }
      return next;
    });
  }, [profile?.username, unlockLevel]);

  const unlockedGuitars = useMemo(() => GUITARS.filter((g) => isUnlocked(g, unlockLevel)), [unlockLevel]);
  const unlockedSkins = useMemo(() => SKINS.filter((s) => unlockLevel >= s.unlockLevel), [unlockLevel]);
  const equippedGuitar = useMemo(
    () => GUITARS.find((g) => g.id === config.guitarId),
    [config.guitarId],
  );

  // Gear unlocks the same way as the vault: from levels, total sessions, daily
  // streak, plus any picks earned as Daily Practice rewards. Full-access testers
  // see everything. The avatar scene only shows gear the player actually owns.
  const gearStats: GearStats = useMemo(
    () => ({
      level,
      sessions: profile?.totalChallenges ?? 0,
      streak: profile?.streak ?? 0,
      fullAccess,
    }),
    [level, profile?.totalChallenges, profile?.streak, fullAccess],
  );
  const earnedGear = useMemo(() => loadEarnedGear(), []);
  const ownsGear = useMemo(
    () => (item: GearItem) => isGearUnlocked(item, gearStats) || earnedGear.has(item.id),
    [gearStats, earnedGear],
  );

  const ownedStraps = useMemo(
    () => GEAR.filter((g): g is Extract<GearItem, { category: "strap" }> => g.category === "strap" && ownsGear(g)),
    [ownsGear],
  );
  const ownedAmps = useMemo(
    () => GEAR.filter((g): g is Extract<GearItem, { category: "amp" }> => g.category === "amp" && ownsGear(g)),
    [ownsGear],
  );
  const ownedPedals = useMemo(
    () => GEAR.filter((g): g is Extract<GearItem, { category: "pedal" }> => g.category === "pedal" && ownsGear(g)),
    [ownsGear],
  );
  const ownedPicks = useMemo(
    () => GEAR.filter((g): g is Extract<GearItem, { category: "pick" }> => g.category === "pick" && ownsGear(g)),
    [ownsGear],
  );
  const ownedCables = useMemo(
    () => GEAR.filter((g): g is Extract<GearItem, { category: "cable" }> => g.category === "cable" && ownsGear(g)),
    [ownsGear],
  );

  const equippedStrap = useMemo(
    () => ownedStraps.find((s) => s.id === config.strapId),
    [ownedStraps, config.strapId],
  );
  const equippedAmp = useMemo(
    () => ownedAmps.find((a) => a.id === config.ampId),
    [ownedAmps, config.ampId],
  );
  const equippedCable = useMemo(
    () => ownedCables.find((c) => c.id === config.cableId),
    [ownedCables, config.cableId],
  );

  const update = <K extends keyof AvatarConfig>(key: K, val: AvatarConfig[K]) => {
    setConfig((c) => ({ ...c, [key]: val }));
    setSaved(false);
  };

  const randomize = () => {
    const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
    setConfig((c) => ({
      ...c,
      species: pick(SPECIES).id,
      gender: pick(GENDERS).id,
      hairColour: pick(HAIR_COLOURS).id,
      guitarId: unlockedGuitars.length ? pick(unlockedGuitars).id : c.guitarId,
      strapId: ownedStraps.length ? pick(ownedStraps).id : c.strapId,
      ampId: ownedAmps.length ? pick(ownedAmps).id : c.ampId,
      cableId: ownedCables.length ? pick(ownedCables).id : c.cableId,
      skin: unlockedSkins.length ? pick(unlockedSkins).id : "none",
    }));
    setSaved(false);
  };

  const handleSave = () => {
    saveAvatar(config);
    setSaved(true);
  };

  const rigRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!rigRef.current || sharing) return;
    setSharing(true);
    try {
      // Wait for every image inside the rig (avatar photo, guitar art, pick logo
      // stamps) to finish decoding, otherwise the PNG can capture half-loaded
      // assets when the button is clicked right after the page loads.
      const imgs = Array.from(rigRef.current.querySelectorAll("img"));
      await Promise.all(
        imgs.map((img) =>
          img.complete && img.naturalWidth > 0
            ? img.decode().catch(() => undefined)
            : new Promise<void>((resolve) => {
                img.addEventListener("load", () => resolve(), { once: true });
                img.addEventListener("error", () => resolve(), { once: true });
              }),
        ),
      );

      const dataUrl = await toPng(rigRef.current, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: "#05060f",
      });
      const fileName = `${(config.displayName || "my-rig").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-ags-rig.png`;

      // Prefer the native share sheet on devices that support sharing files
      // (mobile), otherwise fall back to a plain download.
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], fileName, { type: "image/png" });
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
        share?: (data: { files: File[]; title?: string; text?: string }) => Promise<void>;
      };
      if (nav.canShare?.({ files: [file] }) && nav.share) {
        await nav.share({
          files: [file],
          title: "My Alien Guitar Secrets rig",
          text: "Check out my rig in Alien Guitar Secrets.",
        });
      } else {
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        a.click();
      }
    } catch {
      // user cancelled the share sheet, or capture failed — nothing to do.
    } finally {
      setSharing(false);
    }
  };

  const speciesLabel = SPECIES.find((s) => s.id === config.species)?.label ?? "Unknown";
  const rank = beltRank(summary?.belt ?? "white");
  const xpTotal = summary ? summary.xp + summary.xpToNextLevel : 0;
  const xpPct = summary && xpTotal > 0 ? Math.round((summary.xp / xpTotal) * 100) : 0;
  const pedalLabel = ownedPedals.length
    ? `${ownedPedals.length} pedal${ownedPedals.length > 1 ? "s" : ""}`
    : "None";
  const pickLabel = ownedPicks.length
    ? `${ownedPicks.length} pick${ownedPicks.length > 1 ? "s" : ""}`
    : "None";
  const emptyCase = (
    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Locked</span>
  );

  // Build the data for whichever category locker is open. Guitars and the
  // single-equip gear (strap/amp/cable) are equippable; pedals and picks are
  // collections you only browse. Equipping closes the locker so the choice
  // shows on the rig immediately.
  const closeLocker = () => setLocker(null);
  const guitarDetail = (g: Guitar) => (
    <dl className="space-y-1.5">
      <div>
        <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Inspired by</dt>
        <dd className="text-foreground">{g.inspiration}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Signature technique</dt>
        <dd className="text-foreground">{g.signatureTechnique}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Theory focus</dt>
        <dd className="text-foreground">{g.theory}</dd>
      </div>
    </dl>
  );

  let lockerView: {
    title: string;
    equippable: boolean;
    removable: boolean;
    entries: LockerEntry[];
    onEquip?: (id: string) => void;
  } | null = null;

  if (locker === "guitar") {
    lockerView = {
      title: "Your Guitars",
      equippable: true,
      removable: false,
      onEquip: (id) => {
        update("guitarId", id);
        closeLocker();
      },
      entries: unlockedGuitars.map((g) => ({
        id: g.id,
        name: g.name,
        rarityKey: g.rarity,
        equipped: config.guitarId === g.id,
        thumb: <GuitarThumb guitar={g} handed={handed} className="h-44 w-auto sm:h-56" />,
        detail: guitarDetail(g),
      })),
    };
  } else if (locker) {
    const ownedByCat: Record<GearItem["category"], GearItem[]> = {
      strap: ownedStraps,
      amp: ownedAmps,
      cable: ownedCables,
      pedal: ownedPedals,
      pick: ownedPicks,
      coin: [],
    };
    const equippable = locker === "strap" || locker === "amp" || locker === "cable";
    const equippedId =
      locker === "strap" ? config.strapId : locker === "amp" ? config.ampId : locker === "cable" ? config.cableId : "";
    lockerView = {
      title: `Your ${CATEGORY_LABEL[locker]}s`,
      equippable,
      removable: true,
      onEquip: equippable
        ? (id) => {
            const key = locker === "strap" ? "strapId" : locker === "amp" ? "ampId" : "cableId";
            update(key, equippedId === id ? "" : id);
            if (equippedId !== id) closeLocker();
          }
        : undefined,
      entries: ownedByCat[locker].map((it) => ({
        id: it.id,
        name: it.name,
        rarityKey: it.rarity,
        equipped: equippable && equippedId === it.id,
        thumb: <GearThumb item={it} className="h-40 w-auto sm:h-52" />,
        detail: <p>{it.blurb}</p>,
      })),
    };
  }

  return (
    <div className="pb-10">
      {/* === Premium "My Rig" showcase — full-width Cosmic Hall ========== */}
      {/* Negative margins cancel the layout container's padding so the hall
          spans the full width of the content area (edge to edge, beside the
          sidebar) without the 100vw scrollbar overflow. */}
      <section
        ref={rigRef}
        className="relative -mx-4 -mt-4 overflow-hidden border-b border-primary/30 bg-[#05060f] md:-mx-6 md:-mt-6"
      >
        {/* Cosmic Hall backdrop. object-contain shrinks the whole stage to
            fit any width without cropping; the section's cosmic-dark backing
            blends any letterbox edges. The title-less image keeps a single
            (overlaid) logo. */}
        <img
          src={cosmicHallImg}
          alt=""
          aria-hidden
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover object-center lg:object-contain"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#05030f]/55 via-transparent to-[#05030f]/85" />

        <div className="relative mx-auto flex min-h-[560px] max-w-6xl flex-col px-4 py-8 sm:min-h-[640px] sm:py-10 lg:min-h-[760px]">
          <h1 className="sr-only">My Rig</h1>
          {/* Logo header */}
          <div className="flex flex-col items-center text-center">
            <img
              src={logoHorizontal}
              alt="Alien Guitar Secrets"
              className="h-12 w-auto drop-shadow-[0_2px_18px_rgba(0,0,0,0.8)] sm:h-16"
            />
            <div className="mt-1 text-[11px] font-sans font-bold uppercase tracking-[0.35em] text-secondary drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
              Fretboard Universe
            </div>
          </div>

          {/* Three columns: AVATAR · stage · EQUIPPED GEAR */}
          <div className="mt-6 grid flex-1 items-center gap-4 lg:grid-cols-[260px_1fr_260px]">
            {/* AVATAR identity */}
            <div className="order-2 self-center rounded-xl border border-primary/30 bg-[#0a0a1f]/70 p-4 backdrop-blur lg:order-1">
              <h2 className="mb-3 text-center text-xs font-sans font-bold uppercase tracking-widest text-secondary">
                Avatar
              </h2>
              <div className="text-center">
                <div className="text-lg font-sans font-bold text-foreground">
                  {config.displayName || "Unnamed Cadet"}
                </div>
                <div
                  className="text-[11px] font-mono uppercase tracking-widest"
                  style={{ color: rank.color }}
                >
                  {rank.title}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <StatRow label="Race" value={speciesLabel} />
                <StatRow label="Level" value={`${level}`} />
                {summary && (
                  <div className="border-t border-primary/15 pt-2">
                    <div className="mb-1 flex justify-between text-[10px] font-mono text-muted-foreground">
                      <span>XP</span>
                      <span>
                        {summary.xp.toLocaleString()} / {xpTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                        style={{ width: `${xpPct}%` }}
                      />
                    </div>
                  </div>
                )}
                <StatRow label="Rank" value={rank.label} color={rank.color} />
              </div>
            </div>

            {/* Center stage — avatar + equipped guitar, as large as possible */}
            <div className="order-1 flex h-[360px] items-end justify-center gap-1 sm:h-[440px] lg:order-2">
              <div className="relative aspect-[3/4] h-full">
                <AvatarArt config={config} className="h-full w-full" enlargeable />
              </div>
              {equippedGuitar && (
                <GuitarThumb
                  guitar={equippedGuitar}
                  handed={handed}
                  className="h-[62%] w-auto self-end drop-shadow-[0_0_16px_rgba(0,255,213,0.4)]"
                />
              )}
            </div>

            {/* EQUIPPED GEAR */}
            <div className="order-3 self-center rounded-xl border border-primary/30 bg-[#0a0a1f]/70 p-4 backdrop-blur">
              <h2 className="mb-3 text-center text-xs font-sans font-bold uppercase tracking-widest text-secondary">
                Equipped Gear
              </h2>
              <div className="space-y-2">
                <EquipRow
                  label="Guitar"
                  value={equippedGuitar?.name ?? "None"}
                  icon={<GuitarIcon className="h-4 w-4" />}
                  thumb={equippedGuitar ? <GuitarThumb guitar={equippedGuitar} handed={handed} className="h-7 w-auto" /> : undefined}
                />
                <EquipRow
                  label="Amp"
                  value={equippedAmp?.name ?? "None"}
                  icon={<Speaker className="h-4 w-4" />}
                  thumb={equippedAmp ? <GearThumb item={equippedAmp} className="h-7 w-auto" /> : undefined}
                />
                <EquipRow
                  label="Pedalboard"
                  value={pedalLabel}
                  icon={<SlidersHorizontal className="h-4 w-4" />}
                  thumb={ownedPedals[0] ? <GearThumb item={ownedPedals[0]} className="h-7 w-auto" /> : undefined}
                />
                <EquipRow
                  label="Pick"
                  value={pickLabel}
                  icon={<Triangle className="h-4 w-4" />}
                  thumb={ownedPicks[0] ? <GearThumb item={ownedPicks[0]} className="h-7 w-auto" /> : undefined}
                />
                <EquipRow
                  label="Cable"
                  value={equippedCable?.name ?? "None"}
                  icon={<CableIcon className="h-4 w-4" />}
                  thumb={equippedCable ? <GearThumb item={equippedCable} className="h-7 w-auto" /> : undefined}
                />
                <EquipRow
                  label="Strap"
                  value={equippedStrap?.name ?? "None"}
                  icon={<Sparkles className="h-4 w-4" />}
                  thumb={equippedStrap ? <GearThumb item={equippedStrap} className="h-7 w-auto" /> : undefined}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-6 pt-6">
      {/* Actions */}
      <div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={handleSave}
            className="flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/80 alien-border"
          >
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              "Save Avatar"
            )}
          </button>
          <button
            onClick={randomize}
            className="flex items-center justify-center gap-2 rounded-md border border-secondary/50 px-5 py-2.5 text-sm text-secondary transition-all hover:bg-secondary/15"
          >
            <Shuffle className="h-4 w-4" /> Random
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex items-center gap-2 rounded-md border border-accent/50 bg-accent/10 px-5 py-2.5 text-sm font-semibold text-accent transition-all hover:bg-accent/20 disabled:opacity-60"
          >
            <Share2 className="h-4 w-4" /> {sharing ? "Preparing…" : "Share Rig"}
          </button>
        </div>

        {/* Display cases */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <GearCase label="Guitar" name={equippedGuitar?.name ?? "None yet"} onOpen={() => setLocker("guitar")}>
            {equippedGuitar ? <GuitarThumb guitar={equippedGuitar} handed={handed} className="h-20 w-auto sm:h-16" /> : emptyCase}
          </GearCase>
          <GearCase label="Amp" name={equippedAmp?.name ?? "None yet"} onOpen={() => setLocker("amp")}>
            {equippedAmp ? <GearThumb item={equippedAmp} className="h-20 w-auto sm:h-16" /> : emptyCase}
          </GearCase>
          <GearCase label="Pedalboard" name={pedalLabel} onOpen={() => setLocker("pedal")}>
            {ownedPedals.length ? (
              <div className="flex flex-wrap items-center justify-center gap-1">
                {ownedPedals.slice(0, 4).map((p) => (
                  <GearThumb key={p.id} item={p} className="h-11 w-auto sm:h-9" />
                ))}
              </div>
            ) : (
              emptyCase
            )}
          </GearCase>
          <GearCase label="Pick" name={pickLabel} onOpen={() => setLocker("pick")}>
            {ownedPicks[0] ? <GearThumb item={ownedPicks[0]} className="h-20 w-auto sm:h-16" /> : emptyCase}
          </GearCase>
          <GearCase label="Cable" name={equippedCable?.name ?? "None yet"} onOpen={() => setLocker("cable")}>
            {equippedCable ? <GearThumb item={equippedCable} className="h-20 w-auto sm:h-16" /> : emptyCase}
          </GearCase>
          <GearCase label="Strap" name={equippedStrap?.name ?? "None yet"} onOpen={() => setLocker("strap")}>
            {equippedStrap ? <GearThumb item={equippedStrap} className="h-20 w-auto sm:h-16" /> : emptyCase}
          </GearCase>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
        {/* Collection progress + customisation controls */}
        <div className="lg:sticky lg:top-4 self-start space-y-4">
          {/* Progression */}
          <div className="rounded-xl border border-primary/30 bg-card/40 p-4 space-y-3">
            {summary && (
              <div>
                <div className="mb-1 flex justify-between text-[11px] font-mono text-muted-foreground">
                  <span>XP</span>
                  <span>
                    {summary.xp} / {summary.xp + summary.xpToNextLevel}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-primary/15">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    style={{
                      width: `${Math.round((summary.xp / (summary.xp + summary.xpToNextLevel)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-primary/20 bg-background/40 p-3 text-center">
                <GuitarIcon className="mx-auto mb-1 h-4 w-4 text-accent" />
                <div className="text-lg font-bold text-foreground">{unlockedGuitars.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Guitars</div>
              </div>
              <div className="rounded-lg border border-primary/20 bg-background/40 p-3 text-center">
                <Sparkles className="mx-auto mb-1 h-4 w-4 text-accent" />
                <div className="text-lg font-bold text-foreground">{unlockedSkins.length}</div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Auras</div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <Panel title="Identity">
            <div>
              <div className="mb-2 text-xs uppercase tracking-widest text-primary">Display Name</div>
              <input
                value={config.displayName}
                onChange={(e) => update("displayName", e.target.value.slice(0, 20))}
                placeholder="Name your guitarist"
                className="w-full rounded-md border border-primary/30 bg-background/50 px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
              />
            </div>
            <OptionRow label="Species" options={SPECIES} value={config.species} onChange={(v) => update("species", v)} />
            <OptionRow label="Gender" options={GENDERS} value={config.gender} onChange={(v) => update("gender", v)} />
          </Panel>

          <Panel title="Style">
            {isHairless(config.species) ? (
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-primary">Hair Colour</div>
                <p className="text-sm text-muted-foreground">
                  This species has no hair, so there's no hair colour to choose.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-2 text-xs uppercase tracking-widest text-primary">Hair Colour</div>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLOURS.map((h) => (
                    <button
                      key={h.id}
                      title={h.label}
                      onClick={() => update("hairColour", h.id)}
                      className={`h-9 w-9 rounded-full border-2 transition-all ${
                        config.hairColour === h.id ? "border-accent scale-110 alien-glow-cyan" : "border-primary/30 hover:scale-105"
                      }`}
                      style={{ background: h.color }}
                    />
                  ))}
                </div>
              </div>
            )}
          </Panel>

          <Panel title="Starting Guitar" id="panel-guitar">
            {unlockedGuitars.length === 0 ? (
              <p className="text-sm text-muted-foreground">Unlock guitars by levelling up to equip one.</p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {unlockedGuitars.map((g) => {
                  const rarity = RARITY_META[g.rarity];
                  const active = config.guitarId === g.id;
                  return (
                    <div key={g.id} className="relative">
                      <button
                        onClick={() => update("guitarId", g.id)}
                        className={`flex w-full flex-col items-center rounded-lg border p-2 transition-all ${
                          active ? "border-accent bg-accent/10" : "border-primary/20 hover:border-primary/50"
                        }`}
                        style={active ? { boxShadow: `0 0 14px ${rarity.glow}` } : undefined}
                      >
                        <GuitarThumb
                          guitar={g}
                          handed={handed}
                          className="h-20 w-auto"
                        />
                        <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">{g.name}</span>
                      </button>
                      <ZoomButton label={g.name} onClick={() => setZoom({ type: "guitar", guitar: g })} />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Strap" id="panel-strap">
            {ownedStraps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Earn straps from practice sessions and streaks in the Vault to drape one on your axe.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {ownedStraps.map((s) => {
                  const active = config.strapId === s.id;
                  return (
                    <div key={s.id} className="relative">
                      <button
                        onClick={() => update("strapId", active ? "" : s.id)}
                        className={`flex w-full flex-col items-center rounded-lg border p-2 transition-all ${
                          active ? "border-accent bg-accent/10" : "border-primary/20 hover:border-primary/50"
                        }`}
                      >
                        <GearThumb item={s} className="h-16 w-auto" />
                        <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">{s.name}</span>
                      </button>
                      <ZoomButton label={s.name} onClick={() => setZoom({ type: "gear", item: s })} />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Amplifier" id="panel-amp">
            {ownedAmps.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Level up to earn amplifiers, then plug into one to complete your rig.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {ownedAmps.map((a) => {
                  const active = config.ampId === a.id;
                  return (
                    <div key={a.id} className="relative">
                      <button
                        onClick={() => update("ampId", active ? "" : a.id)}
                        className={`flex w-full flex-col items-center rounded-lg border p-2 transition-all ${
                          active ? "border-accent bg-accent/10" : "border-primary/20 hover:border-primary/50"
                        }`}
                      >
                        <GearThumb item={a} className="h-16 w-auto" />
                        <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">{a.name}</span>
                      </button>
                      <ZoomButton label={a.name} onClick={() => setZoom({ type: "gear", item: a })} />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Cable" id="panel-cable">
            {ownedCables.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Earn patch cables from practice sessions and streaks to wire your guitar into your rig.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                {ownedCables.map((c) => {
                  const active = config.cableId === c.id;
                  return (
                    <div key={c.id} className="relative">
                      <button
                        onClick={() => update("cableId", active ? "" : c.id)}
                        className={`flex w-full flex-col items-center rounded-lg border p-2 transition-all ${
                          active ? "border-accent bg-accent/10" : "border-primary/20 hover:border-primary/50"
                        }`}
                      >
                        <GearThumb item={c} className="h-16 w-auto" />
                        <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">{c.name}</span>
                      </button>
                      <ZoomButton label={c.name} onClick={() => setZoom({ type: "gear", item: c })} />
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>

          <Panel title="Pedalboard" id="panel-pedal">
            {ownedPedals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Win effect pedals from practice milestones — they'll appear on the floor of your rig.
              </p>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  Every pedal you've won sits on your stage floor{ownedPedals.length > 5 ? " (the first five are shown)" : ""}.
                </p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
                  {ownedPedals.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setZoom({ type: "gear", item: p })}
                      className="flex flex-col items-center rounded-lg border border-primary/20 p-2 transition-all hover:border-primary/50"
                      title={p.name}
                    >
                      <GearThumb item={p} className="h-14 w-auto" />
                      <span className="mt-1 w-full truncate text-center text-[10px] text-muted-foreground">{p.name}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </Panel>

          <Panel title="Picks Won" id="panel-pick">
            {ownedPicks.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Earn picks from Daily Practice and milestones — they go on the wall rack in your rig.
              </p>
            ) : (
              <div className="grid grid-cols-5 gap-3 sm:grid-cols-7">
                {ownedPicks.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setZoom({ type: "gear", item: p })}
                    className="flex flex-col items-center rounded-lg p-1 transition-all hover:bg-primary/10"
                    title={p.name}
                  >
                    <GearThumb item={p} className="h-12 w-auto" />
                    <span className="mt-1 w-full truncate text-center text-[9px] text-muted-foreground">{p.name}</span>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Unlockable Auras">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {SKINS.map((s) => {
                const locked = unlockLevel < s.unlockLevel;
                const active = config.skin === s.id;
                return (
                  <button
                    key={s.id}
                    disabled={locked}
                    onClick={() => update("skin", s.id)}
                    className={`relative flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                      active
                        ? "border-accent bg-accent/10"
                        : locked
                          ? "border-primary/15 opacity-60"
                          : "border-primary/25 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {s.aura ? (
                        <span className="h-4 w-4 rounded-full" style={{ background: s.aura, boxShadow: `0 0 8px ${s.aura}` }} />
                      ) : (
                        <span className="h-4 w-4 rounded-full border border-primary/40" />
                      )}
                      <span className="text-sm font-semibold text-foreground">{s.label}</span>
                    </div>
                    <span className="mt-1 text-[11px] text-muted-foreground">{s.description}</span>
                    {locked && (
                      <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                        <Lock className="h-3 w-3" /> Level {s.unlockLevel}
                      </span>
                    )}
                    {active && (
                      <span className="absolute right-2 top-2 inline-flex items-center text-accent">
                        <Trophy className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </Panel>
        </div>
      </div>
      </div>

      <ItemZoomDialog target={zoom} handed={handed} onClose={() => setZoom(null)} />

      {lockerView && (
        <EquipmentLocker
          title={lockerView.title}
          entries={lockerView.entries}
          equippable={lockerView.equippable}
          removable={lockerView.removable}
          onEquip={lockerView.onEquip}
          onClose={closeLocker}
        />
      )}
    </div>
  );
}
