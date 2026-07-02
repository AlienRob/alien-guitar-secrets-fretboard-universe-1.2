import { Link } from "wouter";
import { Lock, Swords, Trophy } from "lucide-react";
import type { BossCharacter } from "@/data/bossCharacters";
import { getBossCharacterImages } from "@/data/bossCharacters";
import type { BossBattle } from "@/data/bossBattles";

interface Props {
  character: BossCharacter;
  boss: BossBattle;
  reached: boolean;
  defeated: boolean;
  href: string;
}

export default function BossSpotlight({ character, boss, reached, defeated, href }: Props) {
  const images = getBossCharacterImages(character.id);

  return (
    <div
      className="relative flex flex-col items-center overflow-hidden rounded-xl border bg-[#05060f]"
      style={{ borderColor: `${character.accentColor}50` }}
    >
      {/* Ambient glow rising up behind the avatar */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 80% 55% at 50% 100%, ${character.accentColor}22, transparent 65%)`,
        }}
      />

      {/* Name — sits between the galaxy belt above and the avatar below */}
      <div className="relative z-10 pt-6 pb-1 text-center">
        <div className="mb-1.5 text-[10px] uppercase tracking-[0.35em] text-muted-foreground">
          System {boss.system} · Boss
        </div>
        <h2 className="text-4xl font-black leading-tight tracking-tight text-white">
          {character.name}
        </h2>
        {character.nameAccent && (
          <h2
            className="text-3xl font-black leading-tight tracking-tight"
            style={{ color: character.accentColor }}
          >
            {character.nameAccent}
          </h2>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">{character.titles[0]}</p>
      </div>

      {/* Big full-body avatar */}
      <div className="relative z-10 mx-auto w-full max-w-[280px]">
        <img
          src={images.full}
          alt={character.name}
          className="h-72 w-full object-contain object-bottom sm:h-80"
          style={{
            filter: reached
              ? undefined
              : "grayscale(0.7) brightness(0.55)",
          }}
        />
        {/* fade bottom edge into the button */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-20"
          style={{
            background: "linear-gradient(to bottom, transparent, #05060f)",
          }}
        />
      </div>

      {/* Enter / Locked button pinned below the avatar */}
      <div className="relative z-10 w-full px-5 pb-5 pt-1">
        {reached ? (
          <Link href={href}>
            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold uppercase tracking-wider transition-colors"
              style={{
                background: `${character.accentColor}18`,
                border: `1px solid ${character.accentColor}60`,
                color: character.accentColor,
              }}
            >
              {defeated ? (
                <>
                  <Trophy className="h-4 w-4" />
                  Replay Boss
                </>
              ) : (
                <>
                  <Swords className="h-4 w-4" />
                  Enter Boss Battle
                </>
              )}
            </button>
          </Link>
        ) : (
          <div className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 py-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Lock className="h-4 w-4" />
            Locked · Level {boss.bossLevel} required
          </div>
        )}
      </div>
    </div>
  );
}
