import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import logoEmblem from "@assets/Square_Web_Banner_1200x1200__No_Backgroound_1780055714866.png";
import themeMusic from "@assets/generated_audio/alien_greeting_theme.mp3";

type Phase = "starscape" | "card" | "portal" | "enter";

// ---------------------------------------------------------------------------
// Persistent canvas starfield — mounts once and stays alive the whole time.
// A "dim" overlay controls brightness without touching the canvas.
// ---------------------------------------------------------------------------
function StarCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const gctx = ctx;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    interface Star { angle: number; r: number; speed: number; size: number; bright: number }
    const stars: Star[] = Array.from({ length: 180 }, (_, i) => {
      const s = (n: number) => { const x = Math.sin(i * 9301 + n * 49297) * 233280; return x - Math.floor(x); };
      return { angle: s(1) * Math.PI * 2, r: s(2) * Math.max(W, H) * 0.5, speed: 0.25 + s(3) * 0.55, size: 0.5 + s(4) * 1.8, bright: 0.4 + s(5) * 0.6 };
    });

    let raf: number;
    function draw() {
      gctx.fillStyle = "rgba(5,3,15,0.18)";
      gctx.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      for (const st of stars) {
        st.r += st.speed * (1 + st.r * 0.004);
        if (st.r > Math.max(W, H) * 0.75) {
          st.r = 3 + Math.random() * 15;
          st.angle = Math.random() * Math.PI * 2;
        }
        const x = cx + Math.cos(st.angle) * st.r;
        const y = cy + Math.sin(st.angle) * st.r;
        const alpha = Math.min(1, st.r / 60) * st.bright;
        gctx.beginPath();
        gctx.arc(x, y, st.size, 0, Math.PI * 2);
        gctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        gctx.fill();
      }
      raf = requestAnimationFrame(draw);
    }

    gctx.fillStyle = "#05030f";
    gctx.fillRect(0, 0, W, H);
    draw();

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

// ---------------------------------------------------------------------------
// Spinning galaxy / wormhole layers for the portal phase
// ---------------------------------------------------------------------------
function GalaxyLayers() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
      <div className="absolute rounded-full opacity-90"
        style={{ width: "180vmax", height: "180vmax", animation: "spin 28s linear infinite",
          background: "conic-gradient(from 0deg,rgba(106,0,255,0) 0deg,rgba(106,0,255,0.5) 60deg,rgba(0,229,255,0.4) 140deg,rgba(106,0,255,0) 220deg,rgba(168,85,247,0.45) 300deg,rgba(106,0,255,0) 360deg)",
          maskImage: "radial-gradient(circle,rgba(0,0,0,1) 0%,rgba(0,0,0,0.9) 35%,rgba(0,0,0,0) 70%)",
          WebkitMaskImage: "radial-gradient(circle,rgba(0,0,0,1) 0%,rgba(0,0,0,0.9) 35%,rgba(0,0,0,0) 70%)" }} />
      <div className="absolute rounded-full opacity-75"
        style={{ width: "130vmax", height: "130vmax", animation: "spin 17s linear infinite reverse",
          background: "conic-gradient(from 90deg,rgba(0,229,255,0) 0deg,rgba(0,229,255,0.42) 80deg,rgba(106,0,255,0) 180deg,rgba(168,85,247,0.42) 280deg,rgba(0,229,255,0) 360deg)",
          maskImage: "radial-gradient(circle,rgba(0,0,0,1) 0%,rgba(0,0,0,0.75) 30%,rgba(0,0,0,0) 65%)",
          WebkitMaskImage: "radial-gradient(circle,rgba(0,0,0,1) 0%,rgba(0,0,0,0.75) 30%,rgba(0,0,0,0) 65%)" }} />
      <div className="absolute rounded-full blur-2xl" style={{ width: "22rem", height: "22rem",
          background: "radial-gradient(circle,rgba(255,255,255,0.95),rgba(168,85,247,0.65) 30%,rgba(106,0,255,0) 70%)" }} />
      {/* Inner bright portal core */}
      <div className="absolute rounded-full" style={{ width: "5rem", height: "5rem",
          background: "radial-gradient(circle,rgba(255,255,255,1) 0%,rgba(200,150,255,0.9) 40%,rgba(106,0,255,0.2) 80%,transparent 100%)",
          boxShadow: "0 0 90px 35px rgba(168,85,247,0.75), 0 0 220px 90px rgba(106,0,255,0.35)" }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
const GREETING =
  "The portal is open.\n\n" +
  "Beyond it lies a universe of challenges, discoveries and legendary rewards. " +
  "Each quest completed will test your knowledge, sharpen your skills and bring you " +
  "closer to mastering the guitar fretboard.\n\n" +
  "Mythical guitars await those worthy enough to unlock them.\n\n" +
  "Your journey begins now.";

// Shared fade transition — used for every phase crossfade
const FADE = { duration: 1.8, ease: [0.4, 0, 0.2, 1] as const };

export default function AlienGreeting({ onEnter }: { onEnter: () => void }) {
  const [phase, setPhase] = useState<Phase>("starscape");
  const [typed, setTyped] = useState("");
  const [muted, setMuted] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const musicSrcRef = useRef<AudioBufferSourceNode | null>(null);
  const musicDataRef = useRef<ArrayBuffer | null>(null);
  const audioStartedRef = useRef(false);
  const mutedRef = useRef(false);
  const timersRef = useRef<number[]>([]);

  const MUSIC_VOL = 0.06;

  useEffect(() => { mutedRef.current = muted; }, [muted]);

  // Prefetch music
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { const buf = await (await fetch(themeMusic)).arrayBuffer(); if (!cancelled) musicDataRef.current = buf; }
      catch { /* on-demand fallback */ }
    })();
    return () => { cancelled = true; };
  }, []);

  // Typewriter when card is shown
  useEffect(() => {
    if (phase !== "card") return;
    let i = 0;
    const id = window.setInterval(() => { i++; setTyped(GREETING.slice(0, i)); if (i >= GREETING.length) clearInterval(id); }, 40);
    return () => clearInterval(id);
  }, [phase]);

  // Auto-advance portal → enter after 2.6s
  useEffect(() => {
    if (phase !== "portal") return;
    const id = window.setTimeout(() => setPhase("enter"), 2600);
    timersRef.current.push(id);
    return () => clearTimeout(id);
  }, [phase]);

  // Cleanup
  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => { clearTimeout(id); clearInterval(id); });
      try { musicSrcRef.current?.stop(); } catch { /* already stopped */ }
      const c = ctxRef.current;
      if (c && c.state !== "closed") void c.close();
    };
  }, []);

  async function getOrCreateCtx(): Promise<AudioContext | null> {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      const actx = ctxRef.current ?? new Ctor();
      ctxRef.current = actx;
      if (actx.state === "suspended") await actx.resume();
      return actx;
    } catch { return null; }
  }

  async function startMusic() {
    if (audioStartedRef.current || mutedRef.current) return;
    audioStartedRef.current = true;
    try {
      const actx = await getOrCreateCtx();
      if (!actx) return;

      const master = actx.createGain();
      master.gain.value = mutedRef.current ? 0 : 1;
      master.connect(actx.destination);
      masterGainRef.current = master;

      const musicGain = actx.createGain();
      musicGain.gain.value = 0;
      musicGain.connect(master);
      musicGainRef.current = musicGain;

      const data = musicDataRef.current ?? (await (await fetch(themeMusic)).arrayBuffer());
      const buf = await actx.decodeAudioData(data.slice(0));
      const src = actx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      const dur = buf.duration;
      const head = 0.25, tail = Math.min(2, dur * 0.25);
      if (dur > head + tail + 2) { src.loopStart = head; src.loopEnd = dur - tail; }
      src.connect(musicGain);
      src.start(0, src.loopStart || 0);
      musicSrcRef.current = src;

      // Slow fade-in after dive bomb settles
      musicGain.gain.setValueAtTime(0, actx.currentTime);
      musicGain.gain.linearRampToValueAtTime(MUSIC_VOL, actx.currentTime + 3.2);
    } catch { audioStartedRef.current = false; }
  }

  async function handleTapStarscape() {
    await getOrCreateCtx();
    void startMusic();
    // Wait a beat, then cross-fade to card
    const id = window.setTimeout(() => setPhase("card"), 400);
    timersRef.current.push(id);
  }

  function handleOpenPortal() { setPhase("portal"); }

  function handleEnter() {
    const master = masterGainRef.current, c = ctxRef.current;
    if (master && c) {
      master.gain.cancelScheduledValues(c.currentTime);
      master.gain.setValueAtTime(master.gain.value, c.currentTime);
      master.gain.linearRampToValueAtTime(0, c.currentTime + 1.2);
    }
    const id = window.setTimeout(onEnter, 1400);
    timersRef.current.push(id);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    mutedRef.current = next;
    const master = masterGainRef.current, c = ctxRef.current;
    if (master && c) { master.gain.cancelScheduledValues(c.currentTime); master.gain.setValueAtTime(next ? 0 : 1, c.currentTime); }
    if (!next && !audioStartedRef.current) void startMusic();
  }

  const isPortal = phase === "portal";

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#05030f]">

      {/* ── Single persistent starfield — never re-mounts ── */}
      <StarCanvas />

      {/* Dim overlay: softens stars on card/portal/enter phases */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-[#05030f]"
        animate={{ opacity: phase === "starscape" ? 0 : 0.55 }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* ── Galaxy vortex — only in portal phase ── */}
      <AnimatePresence>
        {isPortal && (
          <motion.div key="galaxy" className="absolute inset-0"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: "easeInOut" }}>
            <GalaxyLayers />
            {/* Rushing ring */}
            <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div className="rounded-full border-2 border-violet-400/50"
                style={{ boxShadow: "0 0 60px 20px rgba(168,85,247,0.5)" }}
                initial={{ width: "0rem", height: "0rem", opacity: 0 }}
                animate={{ width: "110vmax", height: "110vmax", opacity: [0, 0.7, 0] }}
                transition={{ duration: 2.5, ease: "easeIn" }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Phase content — crossfades over the persistent canvas ── */}
      <AnimatePresence mode="sync">

        {/* Phase 1 — Starscape: logos + tap prompt */}
        {phase === "starscape" && (
          <motion.div key="starscape"
            className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center select-none"
            onClick={handleTapStarscape}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}>
            <div className="flex flex-col items-center gap-5">
              <motion.img src={logoEmblem} alt="Alien Guitar Secrets"
                className="h-[44vh] max-h-[420px] w-auto object-contain drop-shadow-[0_0_55px_rgba(106,0,255,0.7)]"
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }} />
              <div className="flex flex-col items-center gap-1">
                <span className="font-sans text-3xl font-bold tracking-widest text-white md:text-4xl"
                  style={{ textShadow: "0 0 30px rgba(168,85,247,0.85), 0 0 80px rgba(106,0,255,0.4)", letterSpacing: "0.18em" }}>
                  FRETBOARD UNIVERSE
                </span>
                <span className="font-sans text-xs uppercase tracking-[0.35em] text-[#9d7fe8]/80">
                  Alien Guitar Secrets
                </span>
              </div>
              <motion.p className="mt-6 font-sans text-xs uppercase tracking-[0.3em] text-[#6a90d4]/70"
                animate={{ opacity: [0.35, 1, 0.35] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
                tap anywhere to begin
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Phase 2 — Intro card: typewriter text */}
        {phase === "card" && (
          <motion.div key="card"
            className="absolute inset-0 flex flex-col items-center justify-center px-5 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}>
            <div className="flex flex-col items-center gap-6 max-w-xl w-full">
              <motion.img src={logoEmblem} alt="AGS"
                className="h-24 w-auto object-contain drop-shadow-[0_0_30px_rgba(106,0,255,0.6)]"
                initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 1.0 }} />
              <div className="min-h-[10rem]">
                <p className="whitespace-pre-line font-sans text-base leading-relaxed text-[#dfe3f5] md:text-lg">
                  {typed}
                  <span className="ml-0.5 inline-block h-5 w-[2px] translate-y-1 animate-pulse bg-violet-400 align-middle" />
                </p>
              </div>
              {typed.length >= GREETING.length && (
                <motion.button onClick={handleOpenPortal}
                  className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-10 py-3 text-sm font-semibold text-white shadow-[0_0_35px_rgba(106,0,255,0.65)] transition-colors hover:bg-primary/90"
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9 }}
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                  Open the Portal
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Phase 4 — Enter screen */}
        {phase === "enter" && (
          <motion.div key="enter"
            className="absolute inset-0 flex cursor-pointer items-center justify-center select-none"
            onClick={handleEnter}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={FADE}>
            <div className="flex flex-col items-center gap-3">
              <motion.span
                className="font-sans text-6xl font-light tracking-[0.3em] text-white md:text-8xl"
                style={{ textShadow: "0 0 45px rgba(168,85,247,0.95), 0 0 110px rgba(106,0,255,0.55)" }}
                animate={{ opacity: [0.55, 1, 0.55] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}>
                enter…
              </motion.span>
              <motion.span className="font-sans text-xs uppercase tracking-[0.45em] text-violet-400/55"
                animate={{ opacity: [0.25, 0.75, 0.25] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}>
                tap to continue
              </motion.span>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* ── Persistent controls ── */}
      {phase !== "portal" && (
        <>
          <button onClick={toggleMute} aria-label={muted ? "Unmute" : "Mute"}
            className="absolute left-4 top-4 z-[110] rounded-full border border-primary/40 bg-black/40 p-2 text-[#cdd1e0] backdrop-blur transition-colors hover:text-white">
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          {phase !== "enter" && (
            <button onClick={() => setPhase("enter")}
              className="absolute right-4 top-4 z-[110] rounded-full border border-primary/30 bg-black/40 px-4 py-2 text-xs font-medium text-[#a6abc4] backdrop-blur transition-colors hover:text-white">
              Skip
            </button>
          )}
        </>
      )}
    </div>
  );
}
