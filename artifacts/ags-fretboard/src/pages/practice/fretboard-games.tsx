import React, { useState, useEffect, useRef, useSyncExternalStore } from "react";
import VerticalFretboard from "@/components/vertical-fretboard";
import Fretboard, { type NoteHighlight, DEGREE_COLORS } from "@/components/fretboard";
import { playFretNote } from "@/lib/audio";
import PracticeSessionBanner from "@/components/practice-session-banner";
import {
  CAGED_SCALES, NPS_SCALES, CAGED_POSITION_COUNT, PENT_BOX_COUNT,
  buildCagedShape, build3npsShape, buildPentBox,
  degreeName, randomPracticeRoot, rootPrefersFlats,
  getNoteValue, parseNote, type ScaleShape,
} from "@/lib/musicTheory";

function useIsWide() {
  const mq = typeof window !== "undefined" ? window.matchMedia("(min-width: 640px)") : null;
  return useSyncExternalStore(
    (cb) => { mq?.addEventListener("change", cb); return () => mq?.removeEventListener("change", cb); },
    () => mq?.matches ?? true,
    () => true,
  );
}

// ─── CSS animations injected once ────────────────────────────────────────────
const GAME_CSS = `
@keyframes comboFloat {
  0%   { opacity:1; transform:translateX(-50%) translateY(0) scale(1.1); }
  60%  { opacity:1; transform:translateX(-50%) translateY(-44px) scale(1.25); }
  100% { opacity:0; transform:translateX(-50%) translateY(-88px) scale(0.85); }
}
@keyframes flashGreen {
  0%,100% { opacity:0; }
  15%     { opacity:0.18; }
}
@keyframes flashRed {
  0%,100% { opacity:0; }
  15%     { opacity:0.28; }
}
@keyframes timerBlink {
  0%,100% { opacity:1; }
  50%     { opacity:0.35; }
}
@keyframes missionIn {
  from { opacity:0; transform:scale(0.88) translateY(24px); }
  to   { opacity:1; transform:scale(1)    translateY(0); }
}
@keyframes starPulse {
  0%,100% { box-shadow:0 0 8px currentColor; }
  50%     { box-shadow:0 0 28px currentColor; }
}
@keyframes cardPulse {
  0%,100% { opacity:.7; }
  50%     { opacity:1; }
}
.combo-float  { position:absolute; left:50%; white-space:nowrap; pointer-events:none;
                font-family:monospace; font-weight:900; letter-spacing:.08em;
                animation:comboFloat 1.1s ease-out forwards; z-index:20; }
.flash-green  { position:fixed; inset:0; background:#00FF66;
                animation:flashGreen .45s ease-out forwards; pointer-events:none; z-index:30; }
.flash-red    { position:fixed; inset:0; background:#FF3B30;
                animation:flashRed .45s ease-out forwards; pointer-events:none; z-index:30; }
`;

let cssInjected = false;
function useGameCSS() {
  useEffect(() => {
    if (cssInjected) return;
    const el = document.createElement("style");
    el.textContent = GAME_CSS;
    document.head.appendChild(el);
    cssInjected = true;
  }, []);
}

// ─── High score hook ──────────────────────────────────────────────────────────
function useHighScore(key: string): [number, (s: number) => number] {
  const lsKey = `ags-game-hs-${key}`;
  const [best, setBest] = React.useState(() => {
    try { return parseInt(localStorage.getItem(lsKey) ?? "0", 10) || 0; }
    catch { return 0; }
  });
  const update = React.useCallback((s: number) => {
    let next = best;
    setBest((prev) => {
      next = Math.max(prev, s);
      if (s > prev) {
        try { localStorage.setItem(lsKey, String(s)); } catch {}
      }
      return next;
    });
    return next;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey, best]);
  return [best, update];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function degreeLabel(interval: number): string {
  const m: Record<number, string> = {
    0:"R",1:"b2",2:"2",3:"b3",4:"3",5:"4",6:"b5",7:"5",8:"b6",9:"6",10:"b7",11:"7",
  };
  return m[interval % 12] ?? "?";
}

function findAllInstances(pitchClass: number, maxFrets = 12) {
  const r: { string: number; fret: number }[] = [];
  for (let s = 0; s < 6; s++)
    for (let f = 0; f <= maxFrets; f++)
      if (getNoteValue(s, f) % 12 === pitchClass) r.push({ string: s, fret: f });
  return r;
}

function randomPentShape(): ScaleShape {
  const root = randomPracticeRoot();
  return buildPentBox(root, pick(["Major Pentatonic","Minor Pentatonic"]), Math.floor(Math.random() * PENT_BOX_COUNT));
}

// ─── Floating combo text ──────────────────────────────────────────────────────
interface FloatMsg { id: string; text: string; color: string; size: string; }

function FloatLayer({ msgs }: { msgs: FloatMsg[] }) {
  return (
    <>
      {msgs.map((m) => (
        <span key={m.id} className="combo-float"
          style={{ color: m.color, fontSize: m.size, textShadow: `0 0 24px ${m.color}` }}>
          {m.text}
        </span>
      ))}
    </>
  );
}

// ─── Flash overlay ────────────────────────────────────────────────────────────
function Flash({ type }: { type: "green" | "red" | null }) {
  if (!type) return null;
  return <div className={type === "green" ? "flash-green" : "flash-red"} />;
}

// ─── Chain HUD ────────────────────────────────────────────────────────────────
const CHAIN_STEPS = [
  { label: "×1", color: "#4a5568" },
  { label: "×2", color: "#FFB800" },
  { label: "×3", color: "#00FFD5" },
  { label: "×5", color: "#FF2DCF" },
];

function ChainHUD({ level }: { level: number }) {
  const cur = Math.min(level, 3);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Chain</span>
      {CHAIN_STEPS.map((s, i) => (
        <div key={i}
          className="px-3 py-1 rounded font-mono font-bold text-sm transition-all duration-200"
          style={{
            background: i === cur ? `${s.color}22` : "transparent",
            color: i <= cur ? s.color : "#1e2d44",
            border: `1px solid ${i === cur ? s.color : "transparent"}`,
            boxShadow: i === cur && cur >= 2 ? `0 0 16px ${s.color}66` : "none",
            transform: i === cur ? "scale(1.18)" : "scale(1)",
          }}>
          {s.label}
        </div>
      ))}
      {cur >= 3 && (
        <span className="text-sm font-mono font-bold text-[#FF2DCF] animate-pulse">COSMIC!</span>
      )}
    </div>
  );
}

// ─── Back button ─────────────────────────────────────────────────────────────
function BackBtn({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="text-xs text-muted-foreground hover:text-white transition-colors font-mono tracking-wide">
      ← BACK
    </button>
  );
}

// ─── SHAPE SPOTTER ────────────────────────────────────────────────────────────
// Pick a random scale shape. Neck is blank. Tap every correct dot.
// Correct = gold dot + sound. Wrong = red flash. Finish = score screen.

type SpotterPhase = "intro" | "playing" | "done";

interface SpotterState {
  shape: ScaleShape;
  root: string;
  scaleName: string;
  useFlats: boolean;
  /** set of "s:f" keys for notes already found */
  found: Set<string>;
  /** set of "s:f" keys that flashed red (cleared after animation) */
  wrong: Set<string>;
  misses: number;
  startMs: number;
}

function randomSpotterShape(): { shape: ScaleShape; root: string; scaleName: string } {
  const root = randomPracticeRoot();
  const systems = [
    () => { const sc = pick(CAGED_SCALES); return { shape: buildCagedShape(root, sc, Math.floor(Math.random() * CAGED_POSITION_COUNT)), scaleName: sc }; },
    () => { const sc = pick(NPS_SCALES);   return { shape: build3npsShape(root, sc, Math.floor(Math.random() * 7)), scaleName: sc }; },
    () => { const sc = pick(["Major Pentatonic","Minor Pentatonic"]); return { shape: buildPentBox(root, sc, Math.floor(Math.random() * PENT_BOX_COUNT)), scaleName: sc }; },
  ];
  const { shape, scaleName } = pick(systems)();
  return { shape, root, scaleName };
}

function ShapeSpotter({ onBack }: { onBack: () => void }) {
  useGameCSS();
  const isWide = useIsWide();
  const [phase, setPhase] = useState<SpotterPhase>("intro");
  const [game, setGame]   = useState<SpotterState | null>(null);
  const [flash, setFlash] = useState<"green" | "red" | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [bestScore, updateBestScore] = useHighScore("spotter");
  const isNewBestRef = useRef(false);

  const stopTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };

  const startGame = () => {
    stopTimer();
    const { shape, root, scaleName } = randomSpotterShape();
    const t0 = Date.now();
    setGame({
      shape, root, scaleName,
      useFlats: rootPrefersFlats(root),
      found: new Set(),
      wrong: new Set(),
      misses: 0,
      startMs: t0,
    });
    setElapsed(0);
    setPhase("playing");
    timerRef.current = setInterval(() => setElapsed(Math.floor((Date.now() - t0) / 1000)), 250);
  };

  useEffect(() => () => stopTimer(), []);

  // Save high score when game ends
  useEffect(() => {
    if (phase !== "done" || !game) return;
    const s = Math.max(100, 1000 - game.misses * 30 - elapsed * 10);
    isNewBestRef.current = s > bestScore;
    updateBestScore(s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleTap = (s: number, fret: number) => {
    if (!game || phase !== "playing") return;
    const key = `${s}:${fret}`;
    if (game.found.has(key)) return;

    const isCorrect = game.shape.notes.some((n) => n.string === s && n.fret === fret);

    if (isCorrect) {
      playFretNote(getNoteValue(s, fret));
      const newFound = new Set(game.found);
      newFound.add(key);
      const done = newFound.size === game.shape.notes.length;
      setGame({ ...game, found: newFound });
      setFlash("green");
      setTimeout(() => setFlash(null), 450);
      if (done) {
        stopTimer();
        setElapsed(Math.floor((Date.now() - game.startMs) / 1000));
        setPhase("done");
      }
    } else {
      const newWrong = new Set(game.wrong);
      newWrong.add(key);
      setGame({ ...game, wrong: newWrong, misses: game.misses + 1 });
      setFlash("red");
      setTimeout(() => {
        setFlash(null);
        setGame((g) => {
          if (!g) return g;
          const w = new Set(g.wrong);
          w.delete(key);
          return { ...g, wrong: w };
        });
      }, 600);
    }
  };

  // Build highlights
  const highlights: NoteHighlight[] = [];
  if (game && phase !== "intro") {
    for (const n of game.shape.notes) {
      const key = `${n.string}:${n.fret}`;
      if (game.found.has(key)) {
        highlights.push({ string: n.string, fret: n.fret, type: "correct", interval: n.interval });
      }
    }
    for (const key of game.wrong) {
      const [s, f] = key.split(":").map(Number);
      highlights.push({ string: s, fret: f, type: "incorrect", interval: 0 });
    }
    // in done phase reveal remaining unfound (shouldn't happen — all found = done)
  }

  const startFret = game ? Math.max(0, game.shape.minFret - 1) : 0;
  const endFret   = game ? Math.max(startFret + 5, game.shape.maxFret + 2) : 12;

  // Score = base 1000 − 30 per miss − 10 per second, min 100
  const calcScore = () => {
    if (!game) return 0;
    return Math.max(100, 1000 - game.misses * 30 - elapsed * 10);
  };

  if (phase === "intro") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 max-w-md mx-auto text-center"
        style={{ animation: "missionIn .5s cubic-bezier(0.16,1,0.3,1)" }}>
        <div className="self-start">
          <BackBtn onClick={onBack} />
        </div>

        <div className="space-y-5">
          {/* Gold rule */}
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8" style={{ background: "#FFD700" }} />
            <span className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#FFD700" }}>Shape Spotter</span>
            <div className="h-px w-8" style={{ background: "#FFD700" }} />
          </div>

          <h2 className="text-5xl font-black text-white leading-none tracking-tight">
            Restore the shape.
          </h2>

          <p className="text-base leading-7" style={{ color: "#6b7fa0" }}>
            A scale is given. The neck goes dark — just as the<br />
            knowledge is fading across Earth. Tap every note<br />
            that belongs. Gold restores it. Red loses it.<br />
            Speed and accuracy determine how much you save.
          </p>
        </div>

        <button onClick={startGame}
          className="group relative px-12 py-4 rounded-2xl font-mono font-black text-xl text-black transition-all duration-200 hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #FFD700, #FF8C00)",
            boxShadow: "0 8px 40px #FFD70040, 0 2px 8px #00000060",
            letterSpacing: "0.1em",
          }}>
          START
        </button>

        {bestScore > 0 && (
          <div className="font-mono text-xs" style={{ color: "#4a5e7a" }}>
            Best: <span style={{ color: "#FFD700" }}>{bestScore.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }

  if (phase === "done" && game) {
    const score = calcScore();
    const perfect = game.misses === 0;
    return (
      <div className="flex flex-col items-center gap-8 max-w-lg mx-auto"
        style={{ animation: "missionIn .5s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* Score hero */}
        <div className="text-center space-y-3 w-full">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px w-8" style={{ background: "#FFD700" }} />
            <span className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#FFD700" }}>Shape Spotter</span>
            <div className="h-px w-8" style={{ background: "#FFD700" }} />
          </div>

          <div className="text-8xl font-black leading-none"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #c8c8c8 40%, #888888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              textShadow: "none",
              filter: "drop-shadow(0 2px 8px rgba(180,180,180,0.18))",
            }}>
            {score.toLocaleString()}
          </div>

          <div className="flex items-center justify-center gap-2 flex-wrap">
            {isNewBestRef.current && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-xs tracking-widest uppercase"
                style={{ background: "#FFD70018", color: "#FFD700", border: "1px solid #FFD70044" }}>
                New Best
              </div>
            )}
            {perfect && (
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-xs tracking-widest uppercase"
                style={{ background: "#A8FF3E18", color: "#A8FF3E", border: "1px solid #A8FF3E44" }}>
                Perfect — no misses
              </div>
            )}
          </div>

          {!isNewBestRef.current && bestScore > 0 && (
            <div className="font-mono text-xs" style={{ color: "#4a5e7a" }}>
              Best: <span style={{ color: "#FFD700" }}>{bestScore.toLocaleString()}</span>
            </div>
          )}

          {/* Stat row */}
          <div className="flex items-center justify-center gap-6 pt-2 text-xs font-mono" style={{ color: "#4a5e7a" }}>
            <span>{game.root} {game.scaleName}</span>
            <span>·</span>
            <span>{game.shape.notes.length} notes</span>
            <span>·</span>
            <span>{elapsed}s</span>
            <span>·</span>
            <span style={{ color: game.misses > 0 ? "#FF3B30" : "#4a5e7a" }}>
              {game.misses} {game.misses === 1 ? "miss" : "misses"}
            </span>
          </div>
        </div>

        {/* Revealed shape */}
        <div className="w-full overflow-x-auto">
          <VerticalFretboard
            startFret={startFret}
            endFret={endFret}
            highlightNotes={game.shape.notes.map((n) => ({
              string: n.string, fret: n.fret,
              type: (n.interval === 0 ? "root" : "scale") as "root" | "scale",
              interval: n.interval,
              label: degreeLabel(n.interval),
            }))}
            showNoteNames={false}
            useSharps={!game.useFlats}
            playSound
            horizontal={isWide}
            usePhoto
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full max-w-xs">
          <button onClick={startGame}
            className="flex-1 py-3.5 rounded-xl font-mono font-bold text-sm text-black transition-all hover:scale-105 active:scale-95"
            style={{
              background: "linear-gradient(135deg, #FFD700, #FF8C00)",
              boxShadow: "0 4px 20px #FFD70030",
              letterSpacing: "0.08em",
            }}>
            NEXT SHAPE
          </button>
          <button onClick={onBack}
            className="flex-1 py-3.5 rounded-xl font-mono font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: "transparent",
              color: "#4a5e7a",
              border: "1px solid #1c2747",
              letterSpacing: "0.08em",
            }}>
            BACK
          </button>
        </div>
      </div>
    );
  }

  // playing
  if (!game) return null;
  const remaining = game.shape.notes.length - game.found.size;

  return (
    <div className="flex flex-col gap-5 max-w-2xl mx-auto">
      <Flash type={flash} />

      {/* Top strip */}
      <div className="flex items-center justify-between">
        <BackBtn onClick={onBack} />

        {/* Stat pills */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="px-3 py-1.5 rounded-lg" style={{ background: "#0d1525", border: "1px solid #1c2747", color: "#4a5e7a" }}>
            {elapsed}s
          </div>
          <div className="px-3 py-1.5 rounded-lg" style={{
            background: "#0d1525", border: `1px solid ${game.misses > 0 ? "#FF3B3044" : "#1c2747"}`,
            color: game.misses > 0 ? "#FF3B30" : "#4a5e7a",
          }}>
            {game.misses} {game.misses === 1 ? "miss" : "misses"}
          </div>
        </div>
      </div>

      {/* Scale name — hero */}
      <div className="text-center space-y-1">
        <div className="text-xs font-mono tracking-[0.2em] uppercase" style={{ color: "#4a5e7a" }}>Find every note of</div>
        <div className="text-3xl font-black text-white leading-tight">
          <span style={{ color: "#FFD700" }}>{game.root}</span> {game.scaleName}
        </div>
        <div className="text-xs font-mono" style={{ color: "#2e3f5a" }}>{game.shape.label}</div>
      </div>

      {/* Remaining counter */}
      <div className="text-center">
        <div className="text-6xl font-black leading-none" style={{ color: remaining === 0 ? "#A8FF3E" : "#ffffff" }}>
          {remaining}
        </div>
        <div className="text-xs font-mono mt-1" style={{ color: "#4a5e7a" }}>
          {remaining === 1 ? "note left" : "notes left"}
        </div>
      </div>

      {/* Neck */}
      <div className="w-full overflow-x-auto">
        <VerticalFretboard
          startFret={startFret}
          endFret={endFret}
          highlightNotes={highlights}
          onNoteClick={handleTap}
          showNoteNames={false}
          useSharps={!game.useFlats}
          playSound={false}
          horizontal={isWide}
          usePhoto
        />
      </div>
    </div>
  );
}

// ─── NOTE HUNTER ("Galactic Note Hunt") ──────────────────────────────────────
const NATURAL_NOTES = ["C","D","E","F","G","A","B"];
const NOTE_COLORS   = ["#FF2D55","#FF6B35","#FFB800","#A8FF3E","#00FF66","#00FFD5","#4F8FFF"];

function NoteHunterGame({ onBack }: { onBack: () => void }) {
  useGameCSS();
  const isWide = useIsWide();
  const [targetNote, setTargetNote] = useState<string | null>(null);
  const [found, setFound]           = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft]     = useState(45);
  const [chain, setChain]           = useState(0);
  const [started, setStarted]       = useState(false);
  const [done, setDone]             = useState(false);
  const [flashType, setFlashType]   = useState<"green"|"red"|null>(null);
  const [floatMsgs, setFloatMsgs]   = useState<FloatMsg[]>([]);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [bestAcc, updateBestAcc] = useHighScore("hunter");
  const isNewBestRef = useRef(false);

  const noteIdx   = targetNote ? NATURAL_NOTES.indexOf(targetNote) : 0;
  const noteColor = NOTE_COLORS[noteIdx] ?? "#00FFD5";
  const targets   = targetNote ? findAllInstances(parseNote(targetNote).pitch) : [];
  const foundCount = found.size;

  const addFloat = (text: string, color: string, size = "1.5rem") => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatMsgs((prev) => [...prev, { id, text, color, size }]);
    setTimeout(() => setFloatMsgs((prev) => prev.filter((m) => m.id !== id)), 1200);
  };

  const flashScreen = (type: "green" | "red") => {
    if (flashTimer.current) clearTimeout(flashTimer.current);
    setFlashType(type);
    flashTimer.current = setTimeout(() => setFlashType(null), 450);
  };

  const start = (note: string) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTargetNote(note); setFound(new Set()); setTimeLeft(45);
    setChain(0); setStarted(true); setDone(false); setFloatMsgs([]);
  };

  useEffect(() => {
    if (!started || done) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); setDone(true); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [started, done]);

  useEffect(() => {
    if (started && !done && targets.length > 0 && foundCount === targets.length) {
      clearInterval(timerRef.current!); setDone(true);
    }
  }, [foundCount, targets.length, started, done]);

  // Save high score when done
  useEffect(() => {
    if (!done || !targetNote || targets.length === 0) return;
    const acc = Math.round((foundCount / targets.length) * 100);
    isNewBestRef.current = acc > bestAcc;
    updateBestAcc(acc);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const handleClick = (s: number, f: number) => {
    if (!started || done || !targetNote) return;
    const pitch = getNoteValue(s, f) % 12;
    const target = parseNote(targetNote).pitch;
    const key = `${s}-${f}`;
    if (pitch === target) {
      if (!found.has(key)) {
        playFretNote(getNoteValue(s, f));
        const newFound = new Set([...found, key]);
        setFound(newFound);
        const newChain = Math.min(chain + 1, 3);
        setChain(newChain);
        flashScreen("green");
        const mult = newChain >= 3 ? 5 : newChain === 2 ? 3 : newChain === 1 ? 2 : 1;
        if (mult > 1) addFloat(`×${mult} CHAIN!`, CHAIN_STEPS[newChain].color, "1.6rem");
        else addFloat(`+${targetNote}`, noteColor, "1.2rem");
      }
    } else {
      setChain(0);
      setTimeLeft((t) => Math.max(0, t - 3));
      flashScreen("red");
      addFloat("−3 sec", "#FF3B30", "1.1rem");
    }
  };

  const highlights: NoteHighlight[] = targets
    .filter((p) => found.has(`${p.string}-${p.fret}`))
    .map((p) => ({
      string: p.string, fret: p.fret,
      type: "chord" as const,
      label: targetNote ?? "",
    }));

  // ── Note picker (mission select) ──
  if (!targetNote) {
    return (
      <div className="space-y-6 max-w-xl mx-auto text-center" style={{ animation: "missionIn .4s ease-out" }}>
        <BackBtn onClick={onBack} />
        <div className="space-y-2">
          <div className="text-xs font-mono uppercase tracking-widest text-[#00FFD5]">Galactic Note Hunt</div>
          <h2 className="text-3xl font-sans font-bold text-white">Choose your target</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Find every occurrence of that note across the neck in 45 seconds.
            Wrong taps cost 3 seconds. Chain multiplier up to ×5.
          </p>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
          {NATURAL_NOTES.map((n) => (
            <button key={n} onClick={() => start(n)}
              className="flex items-center justify-center p-5 rounded-xl font-mono font-bold text-3xl transition-all hover:scale-110 active:scale-95"
              style={{
                background: "#00FFD512",
                color: "#00FFD5",
                border: "2px solid #00FFD555",
                boxShadow: "0 0 24px #00FFD522",
              }}>
              {n}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──
  if (done) {
    const accuracy = targets.length > 0 ? Math.round((foundCount / targets.length) * 100) : 0;
    const perfect = foundCount === targets.length;
    return (
      <div className="space-y-5 max-w-xl mx-auto text-center" style={{ animation: "missionIn .4s ease-out" }}>
        <div className="text-4xl font-bold text-white">{perfect ? "ALL FOUND!" : `${foundCount} / ${targets.length}`}</div>
        <div className="text-8xl font-mono font-bold leading-none"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #c8c8c8 40%, #888888 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 2px 8px rgba(180,180,180,0.18))",
          }}>
          {accuracy}%
        </div>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {isNewBestRef.current && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-xs tracking-widest uppercase"
              style={{ background: "#00FFD518", color: "#00FFD5", border: "1px solid #00FFD544" }}>
              New Best
            </div>
          )}
          {!isNewBestRef.current && bestAcc > 0 && (
            <div className="font-mono text-xs" style={{ color: "#4a5e7a" }}>
              Best: <span style={{ color: "#00FFD5" }}>{bestAcc}%</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">
          {foundCount} of {targets.length} {targetNote} notes · {45 - timeLeft}s used
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={() => { setTargetNote(null); setStarted(false); setDone(false); }}
            className="px-5 py-2.5 bg-card border border-white/10 text-white rounded-xl text-sm font-mono hover:bg-white/10 transition-colors">
            New Note
          </button>
          <button onClick={() => start(targetNote)}
            className="px-6 py-2.5 text-black rounded-xl text-sm font-mono font-bold transition-all hover:opacity-80"
            style={{ background: noteColor }}>
            Again
          </button>
        </div>
      </div>
    );
  }

  // ── Game ──
  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Flash type={flashType} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <BackBtn onClick={onBack} />
          <div className="text-xs font-mono uppercase tracking-widest text-[#00FFD5] mt-1">Galactic Note Hunt</div>
          <div className="text-2xl font-bold text-white mt-0.5">
            Destroy all <span style={{ color: noteColor, textShadow: `0 0 16px ${noteColor}` }}>{targetNote}</span> notes
          </div>
          <div className="text-sm text-muted-foreground">{foundCount}/{targets.length} found · Miss = −3 sec</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-5xl font-mono font-bold transition-colors"
            style={{
              color: timeLeft <= 10 ? "#FF3B30" : "#fff",
              animation: timeLeft <= 10 ? "timerBlink .6s ease-in-out infinite" : "none",
              textShadow: timeLeft <= 10 ? "0 0 20px #FF3B3088" : "none",
            }}>
            {timeLeft}
          </div>
          <div className="text-xs text-muted-foreground font-mono">seconds</div>
        </div>
      </div>

      <ChainHUD level={chain} />

      {/* Progress bar */}
      <div className="h-2 bg-white/8 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-300"
          style={{ width: `${targets.length > 0 ? (foundCount / targets.length) * 100 : 0}%`, background: noteColor, boxShadow: `0 0 8px ${noteColor}` }} />
      </div>

      {/* Fretboard */}
      <div className="flex justify-center relative">
        <FloatLayer msgs={floatMsgs} />
        <div className="rounded-2xl overflow-hidden transition-all duration-500"
          style={{
            boxShadow: chain >= 3 ? `0 0 80px ${CHAIN_STEPS[3].color}55` : chain >= 2 ? `0 0 50px ${CHAIN_STEPS[2].color}44` : `0 0 30px ${noteColor}22`,
          }}>
          <VerticalFretboard
            startFret={0}
            endFret={12}
            highlightNotes={highlights}
            onNoteClick={handleClick}
            showNoteNames={false}
            useSharps
            playSound={false}
            chainLevel={chain}
            horizontal={isWide}
            usePhoto
          />
        </div>
      </div>
    </div>
  );
}

// ─── ALIEN INVASION ───────────────────────────────────────────────────────────
interface AlienNote { id: string; string: number; fret: number; interval: number; expiresAt: number; }

function AlienInvasionGame({ onBack }: { onBack: () => void }) {
  useGameCSS();
  const isWide = useIsWide();
  const [shape, setShape]             = useState<ScaleShape | null>(null);
  const [activeNotes, setActiveNotes] = useState<AlienNote[]>([]);
  const [chain, setChain]             = useState(0);
  const [score, setScore]             = useState(0);
  const [timeLeft, setTimeLeft]       = useState(60);
  const [done, setDone]               = useState(false);
  const [started, setStarted]         = useState(false);
  const [tick, setTick]               = useState(0);
  const [flashType, setFlashType]     = useState<"green"|"red"|null>(null);
  const [floatMsgs, setFloatMsgs]     = useState<FloatMsg[]>([]);
  const gameRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const flashRef = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const poolRef  = useRef<Array<{ string: number; fret: number; interval: number }>>([] as any);
  const idxRef   = useRef(0);
  const scoreRef = useRef(0);
  scoreRef.current = score;
  const [bestScore, updateBestScore] = useHighScore("invasion");
  const isNewBestRef = useRef(false);

  const addFloat = (text: string, color: string, size = "1.5rem") => {
    const id = `${Date.now()}-${Math.random()}`;
    setFloatMsgs((prev) => [...prev, { id, text, color, size }]);
    setTimeout(() => setFloatMsgs((prev) => prev.filter((m) => m.id !== id)), 1100);
  };

  const flashScreen = (type: "green" | "red") => {
    if (flashRef.current) clearTimeout(flashRef.current);
    setFlashType(type);
    flashRef.current = setTimeout(() => setFlashType(null), 400);
  };

  const start = () => {
    [gameRef, spawnRef, tickRef].forEach((r) => { if (r.current) clearInterval(r.current); });
    const s = randomPentShape();
    setShape(s);
    poolRef.current = [...s.notes].sort(() => Math.random() - 0.5);
    idxRef.current = 0;
    setActiveNotes([]); setChain(0); setScore(0); setTimeLeft(60);
    setDone(false); setStarted(true); setFloatMsgs([]);
  };

  useEffect(() => {
    if (!started || done || !shape) return;
    gameRef.current  = setInterval(() => {
      setTimeLeft((t) => { if (t <= 1) { setDone(true); return 0; } return t - 1; });
    }, 1000);
    tickRef.current  = setInterval(() => setTick((n) => n + 1), 200);
    spawnRef.current = setInterval(() => {
      const pool = poolRef.current;
      if (!pool.length) return;
      const src = pool[idxRef.current++ % pool.length];
      setActiveNotes((prev) => {
        const now = Date.now();
        const live = prev.filter((n) => n.expiresAt > now);
        if (live.some((n) => n.string === src.string && n.fret === src.fret)) return live;
        if (live.length >= 4) return live;
        // Dynamic difficulty: window shrinks from 2200ms → 1400ms as score grows
        const expireMs = Math.max(1400, 2200 - Math.floor(scoreRef.current / 60) * 160);
        return [...live, { id:`${now}-${src.string}-${src.fret}`, ...src, expiresAt: now + expireMs }];
      });
    }, 700);
    return () => { [gameRef, spawnRef, tickRef].forEach((r) => clearInterval(r.current!)); };
  }, [started, done, shape]);

  useEffect(() => {
    const now = Date.now();
    setActiveNotes((prev) => prev.filter((n) => n.expiresAt > now));
  }, [tick]);

  // Save high score when done
  useEffect(() => {
    if (!done || !started) return;
    isNewBestRef.current = score > bestScore;
    updateBestScore(score);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const handleClick = (s: number, f: number) => {
    if (!started || done) return;
    const idx = activeNotes.findIndex((n) => n.string === s && n.fret === f);
    if (idx >= 0) {
      playFretNote(getNoteValue(s, f));
      setActiveNotes((prev) => prev.filter((_, i) => i !== idx));
      const newChain = Math.min(chain + 1, 3);
      setChain(newChain);
      const mult = newChain >= 3 ? 5 : newChain === 2 ? 3 : newChain === 1 ? 2 : 1;
      const pts = 10 * mult;
      setScore((sc) => sc + pts);
      flashScreen("green");
      if (mult > 1) addFloat(`+${pts} ×${mult}`, CHAIN_STEPS[newChain].color);
      else addFloat(`+10`, "#FF6B35", "1.2rem");
    } else {
      setChain(0);
      flashScreen("red");
      addFloat("miss!", "#FF3B30", "1.1rem");
    }
  };

  const INVASION_COLOR = "#FF6B35";

  if (!started || !shape) {
    return (
      <div className="space-y-6 max-w-xl mx-auto text-center" style={{ animation: "missionIn .4s ease-out" }}>
        <BackBtn onClick={onBack} />
        <div className="text-xs font-mono uppercase tracking-widest" style={{ color: INVASION_COLOR }}>Alien Invasion</div>
        <h2 className="text-3xl font-bold text-white">Tap them before they escape</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Notes invade a pentatonic shape and vanish after 2.2 seconds.
          Tap each glowing note before it disappears. Build your chain for up to ×5 score.
          Miss and the chain resets.
        </p>
        <button onClick={start}
          className="px-10 py-4 rounded-2xl font-bold text-xl text-white transition-all hover:scale-105 active:scale-95"
          style={{ background: `linear-gradient(135deg, ${INVASION_COLOR}, #FF2D55)` }}>
          Launch Invasion
        </button>

        {bestScore > 0 && (
          <div className="font-mono text-xs" style={{ color: "#4a5e7a" }}>
            Best: <span style={{ color: INVASION_COLOR }}>{bestScore.toLocaleString()}</span>
          </div>
        )}
      </div>
    );
  }

  if (done) {
    return (
      <div className="space-y-5 max-w-xl mx-auto text-center" style={{ animation: "missionIn .4s ease-out" }}>
        <div className="text-5xl font-black text-white">INVASION OVER</div>
        <div className="text-8xl font-mono font-bold leading-none"
          style={{
            background: "linear-gradient(180deg, #ffffff 0%, #c8c8c8 40%, #888888 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            filter: "drop-shadow(0 2px 8px rgba(180,180,180,0.18))",
          }}>
          {score}
        </div>
        <div className="flex items-center justify-center gap-2">
          {isNewBestRef.current && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-mono font-bold text-xs tracking-widest uppercase"
              style={{ background: "#FF6B3518", color: INVASION_COLOR, border: `1px solid ${INVASION_COLOR}44` }}>
              New Best
            </div>
          )}
          {!isNewBestRef.current && bestScore > 0 && (
            <div className="font-mono text-xs" style={{ color: "#4a5e7a" }}>
              Best: <span style={{ color: INVASION_COLOR }}>{bestScore.toLocaleString()}</span>
            </div>
          )}
        </div>
        <p className="text-muted-foreground">{shape!.root} {shape!.scaleName} · {shape!.label}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={start}
            className="px-6 py-2.5 rounded-xl text-sm font-mono font-bold text-white transition-all hover:opacity-80"
            style={{ background: INVASION_COLOR }}>
            Play Again
          </button>
          <button onClick={onBack}
            className="px-5 py-2.5 bg-card border border-white/10 text-white rounded-xl text-sm font-mono hover:bg-white/10">
            Back
          </button>
        </div>
      </div>
    );
  }

  const startFret = Math.max(0, shape.minFret - 1);
  const endFret   = Math.max(startFret + 5, shape.maxFret + 2);
  const useFlats  = rootPrefersFlats(shape.root);
  const now       = Date.now();

  const highlights: NoteHighlight[] = activeNotes.filter((n) => n.expiresAt > now).map((n) => ({
    string: n.string, fret: n.fret, type: "degree" as const, interval: n.interval,
  }));

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <Flash type={flashType} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <BackBtn onClick={onBack} />
          <div className="text-xs font-mono uppercase tracking-widest mt-1" style={{ color: INVASION_COLOR }}>Alien Invasion</div>
          <div className="text-2xl font-bold text-white mt-0.5">
            <span style={{ color: "#FFD700" }}>{shape.root}</span> {shape.scaleName}
          </div>
          <div className="text-sm text-muted-foreground">{activeNotes.length} notes active</div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-5xl font-mono font-bold"
            style={{
              background: "linear-gradient(180deg, #ffffff 0%, #c8c8c8 40%, #888888 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>{score}</div>
          <div className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? "text-[#FF3B30]" : "text-white"}`}
            style={{ animation: timeLeft <= 10 ? "timerBlink .5s ease-in-out infinite" : "none" }}>
            {timeLeft}s
          </div>
        </div>
      </div>

      <ChainHUD level={chain} />

      <div className="flex justify-center relative">
        <FloatLayer msgs={floatMsgs} />
        <div className="rounded-2xl overflow-hidden transition-all duration-300"
          style={{
            boxShadow: chain >= 3 ? "0 0 80px #FF2DCF66" : chain >= 2 ? `0 0 50px ${INVASION_COLOR}55` : activeNotes.length > 0 ? `0 0 30px ${INVASION_COLOR}33` : "none",
          }}>
          <VerticalFretboard
            startFret={startFret}
            endFret={endFret}
            highlightNotes={highlights}
            onNoteClick={handleClick}
            showNoteNames={false}
            useSharps={!useFlats}
            playSound={false}
            chainLevel={chain}
            horizontal={isWide}
            usePhoto
          />
        </div>
      </div>

      <p className="text-xs text-center text-muted-foreground font-mono">
        TAP THE GLOWING NOTES · CHAIN RESETS ON MISS
      </p>
    </div>
  );
}

// ─── GAME PICKER ─────────────────────────────────────────────────────────────
function readBestScore(key: string): number {
  try { return parseInt(localStorage.getItem(`ags-game-hs-${key}`) ?? "0", 10) || 0; }
  catch { return 0; }
}

const GAMES = [
  {
    id: "explorer",
    hsKey: "spotter",
    hsLabel: (n: number) => n.toLocaleString(),
    title: "Shape Spotter",
    tagline: "Blank neck · restore the shape",
    desc: "A scale is given. The neck goes dark. Tap every note that belongs — prove you know where it lives. Each shape mastered is one frequency restored to the galaxy.",
    color: "#FFD700",
    gradient: "linear-gradient(135deg, #FFD70022, #FF8C0011)",
    label: "RESTORE",
  },
  {
    id: "hunter",
    hsKey: "hunter",
    hsLabel: (n: number) => `${n}%`,
    title: "Galactic Note Hunt",
    tagline: "45 seconds · before it vanishes",
    desc: "A note is disappearing from the neck. Find every place it lives before the clock runs out. Notes forgotten are notes lost — don't let this one go.",
    color: "#00FFD5",
    gradient: "linear-gradient(135deg, #00FFD522, #00FF6611)",
    label: "HUNT",
  },
  {
    id: "invasion",
    hsKey: "invasion",
    hsLabel: (n: number) => n.toLocaleString(),
    title: "Alien Invasion",
    tagline: "React fast · notes are vanishing",
    desc: "Notes are appearing and disappearing — just like the musical crisis itself. They give you 2.2 seconds. Tap them before they're gone for good. Hit ×5 chain for Cosmic Mode.",
    color: "#FF6B35",
    gradient: "linear-gradient(135deg, #FF6B3522, #FF2D5511)",
    label: "DESTROY",
  },
];

export default function FretboardGames() {
  useGameCSS();
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [bestScores, setBestScores] = useState<Record<string, number>>(() =>
    Object.fromEntries(GAMES.map((g) => [g.hsKey, readBestScore(g.hsKey)])),
  );
  const back = () => {
    // Refresh best scores when returning from a game (player may have set a new record).
    setBestScores(Object.fromEntries(GAMES.map((g) => [g.hsKey, readBestScore(g.hsKey)])));
    setActiveGame(null);
  };

  if (activeGame === "explorer")     return <ShapeSpotter onBack={back} />;
  if (activeGame === "hunter")       return <NoteHunterGame onBack={back} />;
  if (activeGame === "invasion")     return <AlienInvasionGame onBack={back} />;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <PracticeSessionBanner discipline="scales" />

      {/* Header */}
      <div className="text-center space-y-3">
        <div className="text-xs font-mono tracking-widest text-primary uppercase">Fretboard Games</div>
        <h1 className="text-4xl font-sans font-black text-white leading-none">
          Light up the neck.
        </h1>
        <p className="text-muted-foreground">
          Scales are fading. Notes are being lost. Reclaim the fretboard one shape at a time.
        </p>
      </div>

      {/* Game cards — 3-col on desktop so all three sit side by side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {GAMES.map((g) => {
          const best = bestScores[g.hsKey] ?? 0;
          return (
            <button key={g.id} onClick={() => setActiveGame(g.id)}
              className="group text-left p-6 rounded-2xl transition-all duration-200 hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]"
              style={{
                background: g.gradient,
                border: `1px solid ${g.color}44`,
                boxShadow: `0 0 24px ${g.color}11`,
              }}>
              {/* Accent line */}
              <div className="h-0.5 w-12 rounded-full mb-4 transition-all duration-300 group-hover:w-24"
                style={{ background: g.color, boxShadow: `0 0 8px ${g.color}` }} />
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: g.color }}>
                    {g.tagline}
                  </div>
                  <div className="text-xl font-sans font-bold text-white">{g.title}</div>
                </div>
                <div className="shrink-0 px-3 py-1 rounded-full text-xs font-mono font-bold border transition-all duration-200 group-hover:scale-105"
                  style={{
                    color: g.color,
                    borderColor: `${g.color}66`,
                    background: `${g.color}15`,
                  }}>
                  {g.label}
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{g.desc}</p>
              {best > 0 && (
                <div className="text-xs font-mono" style={{ color: `${g.color}99` }}>
                  Best: <span style={{ color: g.color }}>{g.hsLabel(best)}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

    </div>
  );
}
