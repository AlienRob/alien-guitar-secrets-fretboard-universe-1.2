import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useVideoPlayer } from '@/lib/video';
import { SCENE_DURATIONS } from './sceneDurations';

export { SCENE_DURATIONS };

// ─── helpers ────────────────────────────────────────────────────────────────

function img(name: string) {
  return `${import.meta.env.BASE_URL}images/${name}`;
}

function vid(name: string) {
  return `${import.meta.env.BASE_URL}videos/${name}`;
}

function Sub({
  text,
  delay = 0,
  className = '',
}: {
  text: string;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.7, delay, ease: 'easeOut' }}
      className={`drop-shadow-lg ${className}`}
    >
      {text}
    </motion.p>
  );
}

function Vignette() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        background:
          'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.65) 100%)',
      }}
    />
  );
}

// ─── persistent starfield (rendered outside scenes) ─────────────────────────

function StarField({ intensity = 1 }: { intensity?: number }) {
  return (
    <motion.img
      src={img('fretboard-stars.png')}
      className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      animate={{ scale: [1.04, 1.0, 1.04] }}
      transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      style={{ opacity: 0.55 * intensity, filter: 'brightness(0.9)' }}
    />
  );
}

// ─── Scene 1 : The Void ──────────────────────────────────────────────────────

function SceneVoid() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 800),
      setTimeout(() => setPhase(2), 2400),
      setTimeout(() => setPhase(3), 3800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      style={{ background: '#000' }}
    >
      <StarField />

      {/* nebula */}
      <motion.img
        src={img('nebula.png')}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: phase >= 1 ? 0.28 : 0 }}
        transition={{ duration: 2.5 }}
      />

      {/* indigo wormhole glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          background:
            'radial-gradient(circle, #c4b5fd 0%, #6d28d9 35%, #1e1b4b 65%, transparent 100%)',
          filter: 'blur(2px)',
        }}
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: phase >= 1 ? 280 : 0,
          height: phase >= 1 ? 280 : 0,
          opacity: phase >= 1 ? 1 : 0,
        }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />
      <motion.div
        className="absolute rounded-full border border-violet-400/40"
        initial={{ width: 0, height: 0, opacity: 0 }}
        animate={{
          width: phase >= 1 ? 380 : 0,
          height: phase >= 1 ? 380 : 0,
          opacity: phase >= 1 ? 0.5 : 0,
        }}
        transition={{ duration: 2.5, delay: 0.4, ease: 'easeOut' }}
      />

      <Vignette />

      {/* text */}
      <div className="relative z-10 text-center space-y-5 mt-72">
        <AnimatePresence>
          {phase >= 2 && (
            <Sub
              key="g1"
              text="Greetings, Alien Guitarist."
              className="text-2xl italic text-violet-200 tracking-wide"
            />
          )}
          {phase >= 3 && (
            <Sub
              key="g2"
              text="My name is Zashtar."
              delay={0.35}
              className="text-3xl font-semibold text-white tracking-wide"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Scene 2 : Arrival ───────────────────────────────────────────────────────

function SceneArrival() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 2800),
      setTimeout(() => setPhase(3), 5800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        size: 3 + (i % 5),
        left: 5 + (i * 7) % 90,
        top: 10 + (i * 11) % 80,
        dur: 2.5 + (i % 4) * 0.7,
        delay: (i * 0.3) % 2,
      })),
    [],
  );

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.2 }}
      style={{
        background:
          'radial-gradient(ellipse at center, #2e1065 0%, #0f0023 55%, #000 100%)',
      }}
    >
      <StarField intensity={0.7} />

      {/* portal bg */}
      <motion.img
        src={img('portal.png')}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: phase >= 1 ? 0.65 : 0, scale: phase >= 1 ? 1.15 : 0.6 }}
        transition={{ duration: 2, ease: 'easeOut' }}
      />

      {/* Zashtar video */}
      {phase >= 1 && (
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.82 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        >
          <video
            src={vid('zashtar.mp4')}
            autoPlay
            muted
            loop
            playsInline
            className="h-[68vh] object-contain"
            style={{ filter: 'drop-shadow(0 0 48px rgba(139,92,246,0.85))' }}
          />
        </motion.div>
      )}

      {/* particles */}
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-violet-300"
          style={{ width: p.size, height: p.size, left: `${p.left}%`, top: `${p.top}%` }}
          animate={{ y: [0, -28, 0], opacity: [0, 0.75, 0] }}
          transition={{ duration: p.dur, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        />
      ))}

      <Vignette />

      {/* voiceover text */}
      <div className="absolute bottom-20 left-0 right-0 text-center z-20 px-20 space-y-3">
        <AnimatePresence>
          {phase >= 2 && (
            <Sub
              key="a1"
              text="For countless ages I have travelled the musical dimensions of the universe..."
              className="text-xl italic text-violet-200 leading-relaxed"
            />
          )}
          {phase >= 3 && (
            <Sub
              key="a2"
              text="I have been waiting for you."
              delay={0.4}
              className="text-2xl font-semibold text-white"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Scene 3 : Fretboard Universe Reveal ────────────────────────────────────

function SceneGalaxy() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 200),
      setTimeout(() => setPhase(2), 2800),
      setTimeout(() => setPhase(3), 5400),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0, scale: 1.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1, ease: 'easeOut' }}
    >
      <motion.img
        src={img('galaxy-fretboard.png')}
        className="absolute inset-0 w-full h-full object-cover"
        animate={{ scale: [1.08, 1.01], rotate: [0, 1.5] }}
        transition={{ duration: 8, ease: 'easeInOut' }}
      />

      {/* gold energy pulse */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 25%, rgba(234,179,8,0.07) 100%)',
        }}
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity }}
      />

      <Vignette />

      <div className="absolute bottom-20 left-0 right-0 text-center z-20 px-16 space-y-5">
        <AnimatePresence>
          {phase >= 2 && (
            <motion.p
              key="g1"
              initial={{ opacity: 0, letterSpacing: '0.6em' }}
              animate={{ opacity: 1, letterSpacing: '0.18em' }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-4xl font-bold text-amber-400 uppercase tracking-widest drop-shadow-lg"
            >
              Welcome to Fretboard Universe.
            </motion.p>
          )}
          {phase >= 3 && (
            <Sub
              key="g2"
              text="A living galaxy where every challenge brings you closer to complete fretboard mastery."
              delay={0.3}
              className="text-xl italic text-violet-200 leading-relaxed"
            />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Scene 4 : The Journey ───────────────────────────────────────────────────

const JOURNEY_ITEMS = ['Notes', 'Intervals', 'Scales', 'Chords', 'Arpeggios'];

function SceneJourney() {
  const [shown, setShown] = useState<number[]>([]);
  const [showFreedom, setShowFreedom] = useState(false);

  useEffect(() => {
    const timers = JOURNEY_ITEMS.map((_, i) =>
      setTimeout(() => setShown(prev => [...prev, i]), 500 + i * 920),
    );
    const tf = setTimeout(() => setShowFreedom(true), 500 + JOURNEY_ITEMS.length * 920 + 350);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(tf);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      style={{ background: 'radial-gradient(ellipse at center, #0f0a1e 0%, #000 100%)' }}
    >
      {/* drifting stars – parallax fly-through */}
      <motion.img
        src={img('fretboard-stars.png')}
        className="absolute inset-0 w-full h-full object-cover opacity-70"
        animate={{ x: [0, -55], y: [0, -38] }}
        transition={{ duration: 7, ease: 'linear' }}
      />

      <Vignette />

      <div className="relative z-10 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.9 }}
          className="text-xl italic text-violet-300 mb-8 tracking-wide"
        >
          Here you will discover…
        </motion.p>

        <div className="flex flex-col items-center gap-3">
          {JOURNEY_ITEMS.map((item, i) => (
            <AnimatePresence key={item}>
              {shown.includes(i) && (
                <motion.p
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="text-4xl font-bold text-amber-400 tracking-wide drop-shadow-lg"
                >
                  {item}
                </motion.p>
              )}
            </AnimatePresence>
          ))}
        </div>

        <AnimatePresence>
          {showFreedom && (
            <motion.p
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="text-2xl italic text-white mt-7 tracking-wide"
            >
              And the secrets of Musical Freedom.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Scene 5 : Guardians ─────────────────────────────────────────────────────

function SceneGuardians() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 700),
      setTimeout(() => setPhase(2), 2700),
      setTimeout(() => setPhase(3), 4300),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.1 }}
    >
      <motion.img
        src={img('guardian-planet.png')}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.14 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
        style={{ filter: 'brightness(0.72)' }}
      />

      {/* indigo energy pulse around guardian */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 40% 60% at 50% 40%, rgba(109,40,217,0.18) 0%, transparent 70%)',
        }}
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.78) 100%)',
        }}
      />

      <div className="absolute bottom-20 left-0 right-0 text-center z-20 px-16 space-y-4">
        <AnimatePresence>
          {phase >= 1 && (
            <Sub
              key="p1"
              text="Every solar system is protected by powerful Guardians."
              className="text-2xl italic text-violet-200"
            />
          )}
          {phase >= 2 && (
            <Sub
              key="p2"
              text="And beyond them…"
              delay={0.2}
              className="text-xl text-white/80"
            />
          )}
          {phase >= 3 && (
            <motion.p
              key="p3"
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, type: 'spring', damping: 14 }}
              className="text-4xl font-bold text-amber-400 uppercase tracking-widest drop-shadow-lg"
            >
              Legendary Boss Battles.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Scene 6 : Hall of Legends ───────────────────────────────────────────────

const HALL_LINES = [
  { text: 'Earn experience.', big: false },
  { text: 'Unlock mythical guitars.', big: false },
  { text: 'Build your collection.', big: false },
  { text: 'And earn your place within the Hall of Legends.', big: true },
];

function SceneHall() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 2000),
      setTimeout(() => setPhase(3), 3500),
      setTimeout(() => setPhase(4), 4800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.3 }}
    >
      <motion.img
        src={img('hall-of-legends.png')}
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 6 }}
        style={{ filter: 'brightness(0.68)' }}
      />

      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, transparent 35%, rgba(0,0,0,0.82) 100%)',
        }}
      />

      <div className="absolute bottom-20 left-0 right-0 text-center z-20 px-16 space-y-3">
        {HALL_LINES.map((line, i) => (
          <AnimatePresence key={line.text}>
            {phase >= i + 1 && (
              <Sub
                text={line.text}
                className={
                  line.big
                    ? 'text-2xl italic text-amber-300 tracking-wide'
                    : 'text-xl text-white/80'
                }
              />
            )}
          </AnimatePresence>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Scene 7 : Final Call ────────────────────────────────────────────────────

function SceneFinal() {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const t = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 2200),
      setTimeout(() => setPhase(3), 3600),
      setTimeout(() => setPhase(4), 4800),
    ];
    return () => t.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      style={{ background: 'radial-gradient(ellipse at center, #1a0533 0%, #000 100%)' }}
    >
      <StarField intensity={0.5} />

      {/* swirling portal behind Zashtar */}
      <motion.img
        src={img('portal.png')}
        className="absolute inset-0 w-full h-full object-cover opacity-45"
        animate={{ rotate: [0, 8], scale: [1, 1.04] }}
        transition={{ duration: 7, ease: 'easeInOut' }}
      />

      {/* Zashtar video */}
      {phase >= 1 && (
        <motion.div
          className="relative z-10"
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
        >
          <video
            src={vid('zashtar.mp4')}
            autoPlay
            muted
            loop
            playsInline
            className="h-[52vh] object-contain"
            style={{ filter: 'drop-shadow(0 0 64px rgba(139,92,246,0.9))' }}
          />
        </motion.div>
      )}

      {/* voiceover lines — below Zashtar */}
      <div className="absolute z-20 left-0 right-0 text-center px-16 space-y-3" style={{ top: '62%' }}>
        <AnimatePresence>
          {phase >= 2 && (
            <Sub
              key="f1"
              text="The portal is open. The galaxies await."
              className="text-2xl italic text-violet-200"
            />
          )}
          {phase >= 3 && (
            <Sub
              key="f2"
              text="Your legend is about to begin."
              delay={0.35}
              className="text-xl text-white/80"
            />
          )}
        </AnimatePresence>
      </div>

      {/* logo slam */}
      <AnimatePresence>
        {phase >= 4 && (
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            style={{ background: 'rgba(0,0,0,0.68)' }}
          >
            <motion.img
              src={img('ags-logo.png')}
              className="w-[500px] max-w-[80%]"
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.55, type: 'spring', damping: 11 }}
            />
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.65 }}
              className="text-xl text-amber-400 tracking-[0.32em] uppercase mt-6 font-light"
            >
              The Adventure Starts Here
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Scene registry ──────────────────────────────────────────────────────────

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  void: SceneVoid,
  arrival: SceneArrival,
  galaxy: SceneGalaxy,
  journey: SceneJourney,
  guardians: SceneGuardians,
  hall: SceneHall,
  final: SceneFinal,
};

// ─── Audio scene offsets (derived once from canonical durations) ─────────────

const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let ms = 0;
  for (const [k, v] of Object.entries(SCENE_DURATIONS)) {
    out[k] = ms / 1000;
    ms += v;
  }
  return out;
})();

// ─── Main export ─────────────────────────────────────────────────────────────

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '');
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const SEEK_EPS = 0.18;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = 0.45;
    const target = SCENE_START_SEC[baseSceneKey] ?? 0;
    if (Math.abs(audio.currentTime - target) > SEEK_EPS) {
      audio.currentTime = target;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, baseSceneKey]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* persistent background */}
      <div className="absolute inset-0">
        <motion.img
          src={`${import.meta.env.BASE_URL}images/fretboard-stars.png`}
          className="w-full h-full object-cover"
          style={{ opacity: 0.45 }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>

      <audio
        ref={audioRef}
        src={`${import.meta.env.BASE_URL}audio/bg_music.mp3`}
        preload="auto"
        autoPlay
        muted={muted}
      />
    </div>
  );
}
