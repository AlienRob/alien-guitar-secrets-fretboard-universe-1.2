import { useEffect, useRef, useState } from "react";
import { Guitar, RARITY_META } from "@/data/guitars";
import GuitarThumb from "@/components/guitar-thumb";
import AvatarArt from "@/components/avatar-art";
import { loadAvatar, loadHandedness } from "@/lib/playerCustomization";
import { playLevelUpLick } from "@/lib/levelupSfx";
import type { AvatarConfig } from "@/data/avatarOptions";

interface Props {
  guitars: Guitar[]; // newly unlocked guitars to celebrate, shown one at a time
  index: number;
  onNext: () => void;
}

// Hand-scattered star positions (percent of overlay) for the spangle layer.
const SPANGLES: Array<{ x: number; y: number; s: number; d: number; c: string }> = [
  { x: 12, y: 18, s: 22, d: 0, c: "#FFD700" },
  { x: 86, y: 14, s: 18, d: 0.3, c: "#ff3b6b" },
  { x: 22, y: 70, s: 16, d: 0.6, c: "#4cc9ff" },
  { x: 78, y: 74, s: 24, d: 0.15, c: "#FFD700" },
  { x: 8, y: 46, s: 14, d: 0.5, c: "#ffffff" },
  { x: 92, y: 44, s: 20, d: 0.8, c: "#ff3b6b" },
  { x: 32, y: 10, s: 14, d: 0.9, c: "#4cc9ff" },
  { x: 68, y: 8, s: 16, d: 0.45, c: "#ffffff" },
  { x: 16, y: 88, s: 18, d: 0.25, c: "#FFD700" },
  { x: 84, y: 90, s: 14, d: 0.7, c: "#4cc9ff" },
  { x: 48, y: 4, s: 18, d: 1.0, c: "#ff3b6b" },
  { x: 50, y: 94, s: 16, d: 0.35, c: "#ffffff" },
];

function StarBurst({ color, size }: { color: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M12 0 L14.5 8.2 L23 8.2 L16 13.2 L18.6 22 L12 16.8 L5.4 22 L8 13.2 L1 8.2 L9.5 8.2 Z" />
    </svg>
  );
}

// Full-screen, spangled "Bill & Ted" style celebration shown when the player
// levels up (or returns to the vault) with newly unlocked guitars. A shred lick
// rips, stars twinkle, a starburst spins behind the guitar and each new axe gets
// a flashy reveal and commemorative plaque.
export default function UnlockAnimation({ guitars, index, onNext }: Props) {
  const guitar = guitars[index];
  const [avatar, setAvatar] = useState<AvatarConfig | null>(null);

  useEffect(() => {
    setAvatar(loadAvatar());
  }, []);

  // Rip the lick each time a new guitar is revealed.
  useEffect(() => {
    if (guitars.length > 0) playLevelUpLick();
  }, [index, guitars.length]);

  // Keep the latest onNext in a ref so the auto-advance timer only restarts when
  // a new guitar is shown — not whenever the parent passes a fresh inline
  // callback (which would otherwise repeatedly reset / stall progression).
  const onNextRef = useRef(onNext);
  useEffect(() => {
    onNextRef.current = onNext;
  }, [onNext]);

  useEffect(() => {
    const t = setTimeout(() => onNextRef.current(), 5200);
    return () => clearTimeout(t);
  }, [index]);

  if (!guitar) return null;
  const rarity = RARITY_META[guitar.rarity];

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center overflow-hidden p-4 bg-black/85 backdrop-blur-md"
      onClick={onNext}
    >
      {/* spangle star layer */}
      {SPANGLES.map((sp, i) => (
        <div
          key={i}
          className="pointer-events-none absolute animate-bounce drop-shadow-[0_0_8px_currentColor]"
          style={{
            left: `${sp.x}%`,
            top: `${sp.y}%`,
            color: sp.c,
            animationDelay: `${sp.d}s`,
            animationDuration: "1.6s",
          }}
        >
          <StarBurst color={sp.c} size={sp.s} />
        </div>
      ))}

      <div className="relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        {/* spinning ray starburst behind the guitar */}
        <div
          className="absolute left-1/2 top-1/2 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 opacity-50 blur-[1px]"
          style={{
            background: `conic-gradient(from 0deg, transparent 0deg, ${rarity.glow} 14deg, transparent 28deg, ${rarity.glow} 42deg, transparent 56deg, ${rarity.glow} 70deg, transparent 84deg, ${rarity.glow} 98deg, transparent 112deg, ${rarity.glow} 126deg, transparent 140deg)`,
            animation: "spin 8s linear infinite",
            maskImage: "radial-gradient(circle, black 0%, transparent 68%)",
            WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 68%)",
          }}
        />
        {/* radiant glow */}
        <div
          className="absolute -inset-32 -z-10 rounded-full opacity-40 blur-2xl animate-pulse"
          style={{ background: `radial-gradient(circle, ${rarity.glow}, transparent 70%)` }}
        />

        {avatar && (
          <div className="absolute -left-28 bottom-0 z-0 hidden h-64 w-40 items-end justify-center opacity-90 md:flex animate-in fade-in slide-in-from-left-6 duration-700">
            <AvatarArt config={avatar} className="h-full w-full drop-shadow-[0_0_18px_rgba(0,255,213,0.4)]" />
          </div>
        )}

        <div className="relative z-10 mb-1 text-2xl font-sans font-black tracking-tight text-[#FFD700] drop-shadow-[0_0_14px_rgba(255,215,0,0.6)]">
          ★ LEVEL UP! ★
        </div>
        <div className="relative z-10 text-xs font-mono uppercase tracking-[0.3em] text-accent mb-2">
          New Guitar Unlocked
        </div>
        <div
          className="relative z-10 text-sm font-mono uppercase tracking-widest mb-4"
          style={{ color: rarity.color }}
        >
          {rarity.label}
        </div>

        <div
          className="relative z-10 w-44 h-72 rounded-2xl flex items-center justify-center bg-white/5 animate-pulse"
          style={{ boxShadow: `0 0 60px ${rarity.glow}, inset 0 0 34px ${rarity.glow}` }}
        >
          <GuitarThumb guitar={guitar} handed={loadHandedness()} className="h-64 w-auto" />
        </div>

        <h2 className="relative z-10 mt-5 text-3xl font-sans font-bold text-foreground">{guitar.name}</h2>
        <p className="relative z-10 text-sm text-muted-foreground italic mt-1 max-w-md">{guitar.inspiration}</p>

        {/* plaque */}
        <div
          className="relative z-10 mt-5 rounded-lg border bg-card/70 px-5 py-3 backdrop-blur"
          style={{ borderColor: rarity.color }}
        >
          <div className="text-xs text-muted-foreground uppercase tracking-widest">Added to Vault</div>
          <div className="text-sm text-foreground mt-0.5">
            Level {guitar.unlockLevel} · {new Date().toLocaleDateString()}
          </div>
        </div>

        <div className="relative z-10 mt-6 text-xs text-muted-foreground">
          {guitars.length > 1 ? `${index + 1} / ${guitars.length} · ` : ""}Tap to continue
        </div>
      </div>
    </div>
  );
}
