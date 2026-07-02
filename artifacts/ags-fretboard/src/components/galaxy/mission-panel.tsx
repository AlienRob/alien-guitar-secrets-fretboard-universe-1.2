import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import {
  Compass,
  Zap,
  Music,
  ListMusic,
  BookOpen,
  Guitar,
  UserCircle,
  Lock,
  Check,
  Rocket,
  Skull,
  Swords,
  Trophy,
  ChevronRight,
  Sparkles,
  LogIn,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type {
  DashboardSummary,
  DailyQuest,
  Challenge,
} from "@workspace/api-client-react";
import type { PlanetInfo } from "@/lib/galaxyProgression";
import type { BossBattle } from "@/data/bossBattles";
import { RARITY_META, type Guitar as GuitarModel } from "@/data/guitars";
import GuitarThumb from "@/components/guitar-thumb";
import GuitarDetailModal from "@/components/guitar-detail-modal";
import { loadHandedness } from "@/lib/playerCustomization";
import {
  type TrailState,
  type TrailStepDef,
  type SystemTrailDef,
  trailStep,
} from "@/lib/beginnerTrail";

const MODULES = [
  { title: "Scale & Chord Finder", desc: "The Ancient Frequencies live in every scale and chord. Map them across the neck before they're forgotten.", href: "/fretboard", icon: BookOpen },
  { title: "Finding the Notes", desc: "Notes are being ignored across Earth. Relearn every one. Know exactly where they live on every string.", href: "/learn/finding-notes", icon: Compass },
  { title: "Intervals", desc: "Harmony itself is dying. Intervals are the building blocks — learn to hear and name them before the knowledge is lost.", href: "/learn/intervals", icon: Zap },
  { title: "Scale Recognition", desc: "The scales are fading from memory. Train until you can recognise every pattern by ear and by shape.", href: "/practice/scales", icon: Music },
  { title: "Chord Decoder", desc: "Earth is drowning in endless four-chord songs. Understand what lies beyond — how chords are truly built.", href: "/learn/chord-construction", icon: ListMusic },
];

interface TrailCardProps {
  trail: TrailState;
  steps: readonly TrailStepDef[];
  level: number;
  bossLevel: number;
}

function TrailCard({ trail, steps, level, bossLevel }: TrailCardProps) {
  const step = trailStep(trail);
  const { isSignedIn } = useUser();

  if (step === 3) return null;

  // When practice is started but boss level not yet reached, keep the Daily
  // Practice card visible (encourage continued drilling) rather than going blank.
  const activeStep = step === 2 && level < bossLevel
    ? steps[1]   // "Keep practising" — same CTA as step 2 card
    : steps[step];

  if (!activeStep) return null;

  // Show a sign-in nudge for guest players who have made progress (step 1 or
  // 2) but haven't created an account yet. Their progress lives only in this
  // browser, so clearing storage would erase it. The nudge is intentionally
  // lightweight — it sits below the main CTA and doesn't block anything.
  const showSignInNudge = !isSignedIn && step >= 1;

  return (
    <div className="rounded-lg border border-accent/50 bg-gradient-to-br from-accent/10 to-transparent p-4 alien-glow">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        <Sparkles className="h-3.5 w-3.5" />
        Your next mission
      </div>
      <div className="mt-1.5 text-sm font-semibold text-white">{activeStep.label}</div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{activeStep.blurb}</p>
      <Link href={activeStep.href}>
        <button
          type="button"
          className="mt-3 inline-flex items-center gap-2 rounded-md border border-accent/50 bg-accent/10 px-4 py-2 text-xs font-semibold text-accent transition-colors hover:bg-accent/20"
        >
          {activeStep.cta} <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </Link>

      {showSignInNudge && (
        <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/4 px-3 py-2">
          <p className="text-xs text-muted-foreground">
            Your progress is saved in this browser only. Sign in to keep it permanently.
          </p>
          <Link href="/sign-in">
            <button
              type="button"
              className="flex shrink-0 items-center gap-1.5 text-xs font-semibold text-accent hover:underline"
            >
              <LogIn className="h-3.5 w-3.5" /> Sign in
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

interface Props {
  planet: PlanetInfo;
  summary?: DashboardSummary;
  quests?: DailyQuest[];
  recent?: Challenge[];
  isLoadingQuests: boolean;
  isLoadingRecent: boolean;
  canLaunch: boolean; // a fresh level-up is available to replay
  onLaunch: () => void;
  // Upcoming guitars that unlock within this (locked preview) system's level
  // range. Only ones the player hasn't earned yet.
  rewards?: GuitarModel[];
  // When the focused planet is a boss the player has reached, the boss config to
  // surface an "Enter Boss Battle" entry. Undefined for non-boss/unreached planets.
  boss?: BossBattle;
  bossDefeated?: boolean;
  bossHref?: string;
  // Beginner trail state — supplied for System 1 and System 2.
  trail?: TrailState;
  // The per-system trail definition (steps + bossLevel). Required when trail is set.
  trailDef?: SystemTrailDef;
  // True when the player is at or past the boss-unlock level but hasn't beaten
  // the current system boss yet. Shows a pulsing "You're ready" banner.
  bossReady?: boolean;
}

export default function MissionPanel({
  planet,
  summary,
  quests,
  recent,
  isLoadingQuests,
  isLoadingRecent,
  canLaunch,
  onLaunch,
  rewards,
  boss,
  bossDefeated,
  bossHref,
  trail,
  trailDef,
  bossReady,
}: Props) {
  const [selectedReward, setSelectedReward] = useState<GuitarModel | null>(null);

  const xpPct = summary
    ? Math.round((summary.xp / (summary.xp + summary.xpToNextLevel)) * 100)
    : 0;

  const locked = planet.state === "locked";

  return (
    <div className="space-y-5">
      {/* Planet header */}
      <div className="rounded-lg border border-primary/30 bg-card/40 p-5 alien-glow">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-accent">
              {planet.isBoss ? <Skull className="h-4 w-4" /> : null}
              <span>System {planet.system}</span>
            </div>
            <h2 className="mt-1 text-2xl font-bold text-white">
              {planet.label}
            </h2>
            <div className="mt-0.5 text-sm text-muted-foreground">
              {locked ? (
                <span className="flex items-center gap-1.5 text-[#FFD700]">
                  <Lock className="h-3.5 w-3.5" /> {planet.requirement}
                </span>
              ) : boss ? (
                bossDefeated ? (
                  <span className="flex items-center gap-1.5 text-[#FFD700]">
                    <Trophy className="h-3.5 w-3.5" /> Boss defeated · Wormhole open
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[#FFD700]">
                    <Skull className="h-3.5 w-3.5" /> Boss awaits · Level {planet.level}
                  </span>
                )
              ) : planet.state === "completed" ? (
                <span className="flex items-center gap-1.5 text-accent">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} /> Cleared · Level {planet.level}
                </span>
              ) : (
                <span>Current objective · Level {planet.level}</span>
              )}
            </div>
          </div>
          {boss && bossHref ? (
            <Link href={bossHref}>
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-md border border-[#FFD700]/50 bg-[#FFD700]/10 px-3 py-2 text-sm font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/20"
              >
                <Swords className="h-4 w-4" />
                {bossDefeated ? "Replay Boss" : "Enter Boss Battle"}
              </button>
            </Link>
          ) : planet.state === "current" ? (
            <button
              type="button"
              onClick={onLaunch}
              className="flex shrink-0 items-center gap-2 rounded-md border border-accent/50 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/20"
            >
              <Rocket className="h-4 w-4" />
              {canLaunch ? "Replay launch" : "Launch"}
            </button>
          ) : null}
        </div>

        {/* Player stats */}
        {summary && (
          <div className="mt-5 space-y-3 border-t border-white/8 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <div>
                  <div className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Level</div>
                  <div className="font-mono text-2xl font-bold text-white">{summary.level}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Belt</div>
                  <div className="text-base font-semibold capitalize text-[#00BFFF]">{summary.belt.replace("_", " ")}</div>
                </div>
                <div>
                  <div className="mb-0.5 text-xs uppercase tracking-wider text-muted-foreground">Streak</div>
                  <div className="text-base font-semibold text-[#FFD700]">{summary.streak} days</div>
                </div>
              </div>
              <div className="font-mono text-xs text-muted-foreground">
                {summary.xp} / {summary.xp + summary.xpToNextLevel} XP
              </div>
            </div>
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/6">
                <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${xpPct}%` }} />
              </div>
              <div className="mt-1 text-xs text-muted-foreground">{xpPct}% to next level</div>
            </div>
          </div>
        )}
      </div>

      {locked && (
        <div className="flex items-center gap-2 rounded-lg border border-[#FFD700]/30 bg-[#FFD700]/5 p-4 text-sm text-[#FFD700]">
          <Lock className="h-4 w-4 shrink-0" />
          <span>This world is still beyond your reach. {planet.requirement} to chart a course here.</span>
        </div>
      )}

      {/* Boss-ready pulsing banner — shown for any system when the player is
          ready to fight but hasn't beaten the boss yet and isn't on the boss planet. */}
      {bossReady && !bossDefeated && (
        <div className="animate-pulse rounded-lg border border-[#FFD700]/60 bg-[#FFD700]/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#FFD700]">
                <Skull className="h-3.5 w-3.5" /> Challenge Awaiting
              </div>
              <div className="mt-1 text-sm font-semibold text-white">
                You are ready — Challenge the System {planet.system} Boss
              </div>
              <p className="mt-0.5 text-xs text-[#FFD700]/80">
                You've reached the boss level. Navigate to planet 10 — Distortion Core — to enter the battle.
              </p>
            </div>
            <Link href={`/boss/${planet.system}`}>
              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-md border border-[#FFD700]/50 bg-[#FFD700]/10 px-3 py-2 text-sm font-semibold text-[#FFD700] transition-colors hover:bg-[#FFD700]/20"
              >
                <Swords className="h-4 w-4" /> Fight Now
              </button>
            </Link>
          </div>
        </div>
      )}

      {/* Beginner trail card — the one obvious next step for new players */}
      {trail && trailDef && summary && (
        <TrailCard
          trail={trail}
          steps={trailDef.steps}
          level={summary.level}
          bossLevel={trailDef.bossLevel}
        />
      )}

      {/* Rewards awaiting in this locked preview system */}
      {locked && rewards && rewards.length > 0 && (
        <div className="space-y-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-accent">
              <Guitar className="h-4 w-4" /> Rewards in this system
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Keep levelling up to claim these guitars for your Display Vault.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {rewards.map((g) => {
              const rarity = RARITY_META[g.rarity];
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedReward(g)}
                  className="flex items-center gap-3 rounded-lg border bg-card/30 p-3 text-left transition-all hover:bg-card/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
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
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Training modules */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Training modules</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MODULES.map((m) => (
                <Link key={m.href} href={m.href}>
                  <div className="group flex cursor-pointer items-start gap-3 rounded-lg border border-white/8 bg-card/30 p-4 transition-all hover:border-primary/50 hover:bg-primary/5">
                    <m.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-colors group-hover:text-white" />
                    <div>
                      <div className="text-sm font-semibold text-white">{m.title}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">{m.desc}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Light Up the Neck */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Light Up the Neck</h3>
            <Link href="/practice/fretboard-games">
              <div className="group flex cursor-pointer items-start gap-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 transition-all hover:border-primary/60 hover:from-primary/20">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary transition-colors group-hover:text-white" />
                <div>
                  <div className="text-sm font-semibold text-white">Fretboard Games</div>
                  <div className="mt-0.5 text-xs text-muted-foreground">Shape Spotter · Note Hunter · Scale Constellation · Alien Invasion</div>
                </div>
              </div>
            </Link>
          </div>

          {/* Collection */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Collection</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link href="/vault">
                <div className="group flex cursor-pointer items-start gap-3 rounded-lg border border-primary/30 bg-gradient-to-br from-primary/10 to-transparent p-4 transition-all alien-glow hover:border-primary hover:from-primary/20">
                  <Guitar className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <div>
                    <div className="text-sm font-semibold text-white">Display Vault</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Collect legendary guitars as you level up</div>
                  </div>
                </div>
              </Link>
              <Link href="/avatar">
                <div className="group flex cursor-pointer items-start gap-3 rounded-lg border border-secondary/30 bg-gradient-to-br from-secondary/10 to-transparent p-4 transition-all alien-glow-cyan hover:border-secondary hover:from-secondary/20">
                  <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-secondary" />
                  <div>
                    <div className="text-sm font-semibold text-white">Avatar Creator</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">Forge your galactic guitarist identity</div>
                  </div>
                </div>
              </Link>
            </div>
          </div>

          {/* Today's goals */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Today's goals</h3>
            <div className="space-y-4 rounded-lg border border-white/8 bg-card/30 p-4">
              {isLoadingQuests ? (
                <div className="h-16 animate-pulse rounded bg-white/5" />
              ) : !quests?.length ? (
                <p className="text-sm text-muted-foreground">No goals yet — complete a session to get started.</p>
              ) : (
                quests.map((q) => (
                  <div key={q.id} className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium text-white">{q.title}</div>
                        <div className="text-xs text-muted-foreground">{q.description}</div>
                      </div>
                      <span className="shrink-0 font-mono text-xs text-primary">+{q.xpReward} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/6">
                        <div
                          className={`h-full rounded-full transition-all ${q.completed ? "bg-[#00FF66]" : "bg-primary"}`}
                          style={{ width: `${Math.min(100, (q.currentCount / q.targetCount) * 100)}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-mono text-xs text-muted-foreground">
                        {q.currentCount}/{q.targetCount}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent sessions */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Recent sessions</h3>
            <div className="space-y-3 rounded-lg border border-white/8 bg-card/30 p-4">
              {isLoadingRecent ? (
                <div className="h-24 animate-pulse rounded bg-white/5" />
              ) : !recent?.length ? (
                <p className="text-sm text-muted-foreground">No sessions yet — pick a module above to begin.</p>
              ) : (
                recent.slice(0, 5).map((log) => (
                  <div key={log.id} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm last:border-0 last:pb-0">
                    <div>
                      <div className="font-medium capitalize text-white">{log.exerciseType.replace("_", " ")}</div>
                      <div className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.completedAt), { addSuffix: true })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-[#00FFD5]">+{log.xpEarned} XP</div>
                      <div className="text-xs text-muted-foreground">
                        {log.correctAnswers}/{log.totalQuestions} · {Math.round(log.score)}%
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

      {selectedReward && (
        <GuitarDetailModal
          guitar={selectedReward}
          level={summary?.level ?? 0}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </div>
  );
}
