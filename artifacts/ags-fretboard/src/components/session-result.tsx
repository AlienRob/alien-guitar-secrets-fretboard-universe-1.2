import React, { useEffect, useRef, useState } from "react";
import { ChallengeResult } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Check, X } from "lucide-react";
import { playChallengeCompleteTrill } from "@/lib/audio";
import { loadRound, isDisciplineComplete } from "@/lib/dailyPractice";
import { addAlienCoins, loadAlienCoins } from "@/lib/playerCustomization";
import { coinsForDrillAcc } from "@/lib/webCoins";

// Shared base styling for the action buttons rendered as wouter <Link>s.
const LINK_BASE =
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
const LINK_PRIMARY = `${LINK_BASE} bg-primary text-primary-foreground hover:bg-primary/80 alien-border`;
const LINK_SECONDARY = `${LINK_BASE} border border-input bg-background hover:bg-accent hover:text-accent-foreground`;

// One row of the end-of-session synopsis so players can see exactly which
// questions they missed and what the right answer was.
export interface ReviewItem {
  // What the question asked (e.g. the notes shown, or "Find C on string A").
  prompt: string;
  // What the player chose / did.
  yourAnswer: string;
  // The correct answer.
  correctAnswer: string;
  correct: boolean;
}

export function SessionResult({
  result,
  onReplay,
  review,
  discipline,
}: {
  result: ChallengeResult;
  onReplay: () => void;
  review?: ReviewItem[];
  // When this drill is one of the scored Daily Practice disciplines, its id is
  // passed so we can show routine-aware navigation.
  discipline?: string;
}) {
  const acc = Math.round((result.challenge.correctAnswers / result.challenge.totalQuestions) * 100);

  // Play the short completion trill once when the results screen appears.
  const playedRef = useRef(false);
  useEffect(() => {
    if (playedRef.current) return;
    playedRef.current = true;
    void playChallengeCompleteTrill();
  }, []);

  // Daily Practice context.
  const round = discipline ? loadRound() : null;
  const inRoutine = !!discipline && !!round && round.disciplines.includes(discipline);
  const disciplineDone =
    inRoutine && !!round && !!discipline && isDisciplineComplete(round, discipline);

  // Award coins for this drill once.
  const [coinsEarned, setCoinsEarned] = useState(0);
  const coinAwardedRef = useRef(false);
  useEffect(() => {
    if (coinAwardedRef.current) return;
    coinAwardedRef.current = true;
    const earned = coinsForDrillAcc(acc);
    addAlienCoins(earned);
    setCoinsEarned(earned);
  }, [acc]);

  const missed = review ? review.filter((r) => !r.correct).length : 0;

  return (
    <div className="flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-sans font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent alien-glow-cyan">
          MISSION COMPLETE
        </h2>
        <p className="text-xl text-muted-foreground">Accuracy: <span className="text-foreground">{acc}%</span></p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-lg">
        <div className="bg-card/50 border border-primary/30 rounded-lg p-6 text-center alien-glow">
          <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">XP Earned</div>
          <div className="text-5xl font-sans text-primary">+{result.xpEarned}</div>
        </div>
        <div className="bg-card/50 border border-primary/30 rounded-lg p-6 text-center alien-glow">
          <div className="text-sm text-muted-foreground uppercase tracking-widest mb-2">Score</div>
          <div className="text-5xl font-sans text-secondary">{result.challenge.score}</div>
        </div>
      </div>

      {/* Coin award */}
      {coinsEarned > 0 && (
        <div className="flex items-center gap-3 px-6 py-4 rounded-xl border border-amber-400/30 bg-amber-400/10 w-full max-w-lg animate-in fade-in zoom-in duration-500">
          <img src={`${import.meta.env.BASE_URL}gear/coin-single.png`} alt="Alien Coins" className="h-8 w-8 object-contain shrink-0" />
          <div className="min-w-0">
            <div className="text-lg font-sans font-bold text-amber-400">+{coinsEarned} Alien Coins</div>
            <div className="text-xs text-muted-foreground">
              Visit the Bag Shop in your Vault to spend coins on mystery gear.
            </div>
          </div>
        </div>
      )}

      {result.leveledUp && (
        <div className="bg-primary/20 border border-primary rounded-lg p-6 text-center alien-glow-cyan w-full max-w-lg animate-pulse">
          <h3 className="text-2xl font-bold text-accent mb-2">LEVEL UP!</h3>
          <p className="text-lg">You are now Level {result.newLevel}</p>
        </div>
      )}

      {result.newBelt && (
        <div className="bg-secondary/20 border border-secondary rounded-lg p-6 text-center alien-glow w-full max-w-lg">
          <h3 className="text-2xl font-bold text-secondary mb-2">NEW BELT UNLOCKED</h3>
          <p className="text-lg capitalize">{result.newBelt.replace('_', ' ')}</p>
        </div>
      )}

      {review && review.length > 0 && (
        <div className="w-full max-w-lg space-y-2 text-left">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Review
            </h3>
            <span className="text-xs text-muted-foreground">
              {missed === 0 ? "Flawless — no misses" : `${missed} to review`}
            </span>
          </div>
          <div className="space-y-1.5">
            {review.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-2.5 rounded-lg border p-3 ${
                  item.correct
                    ? "border-white/8 bg-card/30"
                    : "border-[#FF3B30]/40 bg-[#FF3B30]/5"
                }`}
              >
                <span
                  className={`mt-0.5 shrink-0 ${
                    item.correct ? "text-[#00FF66]" : "text-[#FF3B30]"
                  }`}
                >
                  {item.correct ? (
                    <Check className="h-4 w-4" strokeWidth={3} />
                  ) : (
                    <X className="h-4 w-4" strokeWidth={3} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-foreground">{item.prompt}</div>
                  {item.correct ? (
                    <div className="mt-0.5 text-xs text-muted-foreground">{item.correctAnswer}</div>
                  ) : (
                    <div className="mt-0.5 text-xs">
                      <span className="text-[#FF3B30]">You said {item.yourAnswer}</span>
                      <span className="text-muted-foreground"> · Answer: </span>
                      <span className="text-[#00FF66]">{item.correctAnswer}</span>
                    </div>
                  )}
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">#{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-4">
        {inRoutine ? (
          disciplineDone ? (
            <>
              <Link href="/practice" className={LINK_PRIMARY}>
                Back to routine
              </Link>
              <Link href="/galaxy" className={LINK_SECONDARY}>
                Return to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Button onClick={onReplay} className="bg-primary text-primary-foreground hover:bg-primary/80 alien-border">
                Continue routine
              </Button>
              <Link href="/practice" className={LINK_SECONDARY}>
                Back to routine
              </Link>
            </>
          )
        ) : (
          <>
            <Button onClick={onReplay} className="bg-primary text-primary-foreground hover:bg-primary/80 alien-border">
              Replay Mission
            </Button>
            <Link href="/galaxy" className={LINK_SECONDARY}>
              Return to Dashboard
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
