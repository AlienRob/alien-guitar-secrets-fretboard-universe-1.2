import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Rocket, Skull } from "lucide-react";

// A cinematic launch: an AGS rocket lifts off, streaks through a hyperspace
// trail while the solar system rotates underneath, then lands on the arriving
// planet. The boss variant adds a "system cleared" flourish. The whole thing is
// purely decorative and self-contained; the parent advances the focused planet
// at the midpoint so the new world is centred when the overlay clears.

type Phase = "launch" | "warp" | "arrive" | "done";

interface Props {
  active: boolean;
  token: number;
  boss: boolean;
  onMidpoint: () => void; // rotate the system to the new planet
  onDone: () => void;
}

const TIMINGS = {
  launch: 850,
  warp: 900,
  arrive: 900,
  bossExtra: 1000,
};

export default function LaunchSequence({ active, token, boss, onMidpoint, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>("launch");
  const onMidpointRef = useRef(onMidpoint);
  const onDoneRef = useRef(onDone);
  onMidpointRef.current = onMidpoint;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;
    setPhase("launch");
    const timers: number[] = [];

    timers.push(
      window.setTimeout(() => {
        onMidpointRef.current();
        setPhase("warp");
      }, TIMINGS.launch),
    );
    timers.push(window.setTimeout(() => setPhase("arrive"), TIMINGS.launch + TIMINGS.warp));
    timers.push(
      window.setTimeout(
        () => {
          setPhase("done");
          onDoneRef.current();
        },
        TIMINGS.launch + TIMINGS.warp + TIMINGS.arrive + (boss ? TIMINGS.bossExtra : 0),
      ),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [active, token, boss]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[210] flex items-center justify-center overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          style={{ background: "radial-gradient(circle at 50% 55%, rgba(10,6,30,0.92), rgba(2,3,10,0.97))" }}
        >
          {/* Hyperspace streaks during warp */}
          {phase === "warp" && (
            <div className="pointer-events-none absolute inset-0">
              {Array.from({ length: 28 }).map((_, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-px origin-left"
                  style={{
                    rotate: (i / 28) * 360,
                    background: "linear-gradient(90deg, transparent, rgba(123,224,255,0.9), transparent)",
                  }}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: ["0px", "60vw"], opacity: [0, 1, 0] }}
                  transition={{ duration: 0.9, ease: "easeOut", delay: (i % 6) * 0.04 }}
                />
              ))}
            </div>
          )}

          {/* Arriving planet */}
          {(phase === "arrive" || phase === "done") && (
            <motion.div
              className="absolute rounded-full"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: 160,
                height: 160,
                background: boss
                  ? "radial-gradient(circle at 32% 28%, #ff6b9d, #b1184e 55%, #3b0a1f 100%)"
                  : "radial-gradient(circle at 32% 28%, hsl(220 95% 80%), hsl(220 85% 52%) 55%, hsl(220 70% 22%) 100%)",
                boxShadow: boss
                  ? "0 0 60px 14px rgba(255,45,85,0.5)"
                  : "0 0 60px 14px rgba(106,0,255,0.5)",
              }}
            />
          )}

          {/* Rocket */}
          <motion.div
            className="absolute z-10 flex items-center justify-center"
            initial={{ y: "42vh", scale: 0.8, opacity: 0, rotate: 0 }}
            animate={
              phase === "launch"
                ? { y: "0vh", scale: 1, opacity: 1, rotate: 0 }
                : phase === "warp"
                  ? { y: "-30vh", scale: 0.5, opacity: 0.9, rotate: 0 }
                  : { y: "-2vh", scale: 0.9, opacity: 1, rotate: 0 }
            }
            transition={{ duration: phase === "launch" ? 0.85 : phase === "warp" ? 0.9 : 0.7, ease: "easeInOut" }}
          >
            <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/50 bg-card/70 shadow-[0_0_30px_rgba(0,255,213,0.5)] backdrop-blur">
              <Rocket className="h-8 w-8 -rotate-45 text-accent" />
              {/* engine glow trail */}
              <motion.span
                className="absolute -bottom-8 left-1/2 h-10 w-3 -translate-x-1/2 rounded-full"
                style={{ background: "linear-gradient(to bottom, rgba(0,255,213,0.9), transparent)" }}
                animate={{ scaleY: [0.6, 1.2, 0.6], opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 0.4, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Boss cleared flourish */}
          {boss && (phase === "arrive" || phase === "done") && (
            <motion.div
              className="absolute bottom-[18%] flex flex-col items-center gap-2 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Skull className="h-7 w-7 text-[#FF2D55]" />
              <div className="text-lg font-bold uppercase tracking-[0.3em] text-white">System Cleared</div>
              <div className="text-xs uppercase tracking-widest text-accent">Wormhole to the next system</div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
