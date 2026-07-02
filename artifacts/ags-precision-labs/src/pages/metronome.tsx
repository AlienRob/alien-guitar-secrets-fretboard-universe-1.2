import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { MetronomeEngine, ensureAudioCtx, type SoundType } from "@/lib/metronomeEngine";
import { usePremium } from "@/lib/premium";
import { UpgradeModal } from "@/components/upgrade-modal";

// ── Colour themes (chakra order) ──────────────────────────────────────────────
const THEMES = [
  { label: "Red",    accent: "#FF2244", accentDim: "#7a0018", stripDim: "#4a000e" },
  { label: "Orange", accent: "#FF7700", accentDim: "#7a3800", stripDim: "#4a2000" },
  { label: "Gold",   accent: "#FFB800", accentDim: "#7a5800", stripDim: "#4a3200" },
  { label: "Green",  accent: "#00E060", accentDim: "#006830", stripDim: "#003a18" },
  { label: "Cyan",   accent: "#00D4FF", accentDim: "#006a80", stripDim: "#003040" },
  { label: "Purple", accent: "#C040FF", accentDim: "#6a1090", stripDim: "#3a0858" },
  { label: "Pink",   accent: "#FF40A0", accentDim: "#80104a", stripDim: "#500030" },
] as const;

type ThemeIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6;
type BeatState = "accent" | "normal" | "mute";

const C_SUB_LIT  = "#1E8CFF";
const BG_MAIN    = "#050816";
const BG_GRAD    = "#0a1030";

function nextBeatState(s: BeatState): BeatState {
  if (s === "accent") return "normal";
  if (s === "normal") return "mute";
  return "accent";
}

// ── Starfield ──────────────────────────────────────────────────────────────────
function useStars(n: number) {
  return useMemo(() => {
    let seed = 42;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    return Array.from({ length: n }, (_, i) => ({
      id: i, x: rand() * 100, y: rand() * 100,
      r: rand() > 0.85 ? 1.4 : rand() > 0.6 ? 0.9 : 0.5,
      op: 0.3 + rand() * 0.55,
      twinkle: rand() > 0.7,
    }));
  }, [n]);
}

// ── Beat Block ─────────────────────────────────────────────────────────────────
function BeatBlock({
  beatState, segs, activeSeg = -1, onTap,
  accent, accentDim, stripDim,
}: {
  beatState: BeatState; segs: number; activeSeg?: number; onTap?: () => void;
  accent: string; accentDim: string; stripDim: string;
}) {
  const isMute   = beatState === "mute";
  const isAccent = beatState === "accent";
  const isNormal = beatState === "normal";
  const stripCol  = isMute ? "#1a1a1a" : isAccent ? accent : stripDim;
  const borderCol = isMute ? "#141414" : isAccent ? accentDim : `${accentDim}88`;
  const firstLit  = isAccent ? accent : `${accent}99`;

  return (
    <div
      onClick={onTap}
      style={{
        flex: 1, height: 62, borderRadius: 8,
        backgroundColor: isMute ? "#06060e" : "#0d0d20",
        border: `${isAccent ? 1.5 : 1}px solid ${borderCol}`,
        display: "flex", flexDirection: "column", overflow: "hidden",
        cursor: "pointer", opacity: isMute ? 0.4 : 1,
        position: "relative",
        boxShadow: isAccent && activeSeg === 0 ? `0 0 10px ${accent}88` : "none",
      }}
    >
      {/* accent strip */}
      <div style={{
        height: 11, backgroundColor: stripCol, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isAccent && <div style={{ width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.85, boxShadow: `0 0 4px ${accent}` }} />}
        {isNormal && <div style={{ width: 3, height: 3, borderRadius: 1.5, background: accent, opacity: 0.4 }} />}
      </div>
      {/* subdivision segments */}
      <div style={{ flex: 1, display: "flex" }}>
        {Array.from({ length: segs }).map((_, j) => {
          const isFirst = j === 0;
          const isLit   = !isMute && activeSeg === j;
          const track   = isFirst && !isMute
            ? (isAccent ? `${accentDim}60` : `${accentDim}30`)
            : "transparent";
          return (
            <div key={j} style={{
              flex: 1,
              backgroundColor: isLit ? (isFirst ? firstLit : C_SUB_LIT) : track,
              borderLeft: j > 0 ? "1px solid #1e1e36" : "none",
            }} />
          );
        })}
      </div>
      {/* mute X */}
      {isMute && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <line x1="4" y1="4" x2="14" y2="14" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="14" y1="4" x2="4" y2="14" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
      {/* state chip */}
      {(isAccent || isMute) && (
        <div style={{
          position: "absolute", bottom: 3, right: 3,
          fontSize: 7, fontWeight: 700, letterSpacing: 0.5,
          color: isMute ? "#444" : accent, opacity: 0.85,
        }}>
          {isMute ? "GAP" : "ACC"}
        </div>
      )}
    </div>
  );
}

// ── Count labels ───────────────────────────────────────────────────────────────
const COUNT_LABELS: Record<number, string[][]> = {
  1: [["1"],["2"],["3"],["4"]],
  2: [["1","&"],["2","&"],["3","&"],["4","&"]],
  3: [["1","&","a"],["2","&","a"],["3","&","a"],["4","&","a"]],
  4: [["1","e","&","a"],["2","e","&","a"],["3","e","&","a"],["4","e","&","a"]],
};

function CountRow({ segs, states, numBeats, accent, accentDim }: {
  segs: number; states: BeatState[]; numBeats: number;
  accent: string; accentDim: string;
}) {
  const template = COUNT_LABELS[segs] ?? COUNT_LABELS[1];
  const groups   = template.slice(0, numBeats);
  return (
    <div style={{ width: "100%", display: "flex", gap: 6, marginTop: 3 }}>
      {groups.map((subs, bi) => (
        <div key={bi} style={{ flex: 1, display: "flex" }}>
          {subs.map((label, si) => (
            <div key={si} style={{
              flex: 1, textAlign: "center",
              fontSize: segs >= 4 ? 7.5 : 9,
              fontWeight: si === 0 ? 700 : 400,
              opacity: states[bi] === "mute" ? 0.2 : 1,
              color: si === 0
                ? (states[bi] === "accent" ? accent : accentDim)
                : "#40406a",
              fontFamily: "monospace",
            }}>
              {label}
            </div>
          ))}
        </div>
      ))}
      {/* spacer to balance the A-button column */}
      <div style={{ width: 36, flexShrink: 0 }} />
    </div>
  );
}

// ── Jog wheel visual ───────────────────────────────────────────────────────────
function JogWheelSvg({ glowColor, size = 160 }: { glowColor: string; size?: number }) {
  const C = size / 2;
  const R_BEZEL = C - 2, R_GRIP = R_BEZEL - 10;
  const R_WELL  = R_GRIP - Math.round(size * 0.11);
  return (
    <svg width={size} height={size} style={{ display: "block" }}>
      <defs>
        <radialGradient id="mbz2" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#42426a"/>
          <stop offset="42%" stopColor="#2c2c52"/>
          <stop offset="100%" stopColor="#07070f"/>
        </radialGradient>
        <radialGradient id="mgp2" cx="50%" cy="30%" r="66%">
          <stop offset="0%" stopColor="#2e2e50"/>
          <stop offset="100%" stopColor="#080814"/>
        </radialGradient>
      </defs>
      <circle cx={C} cy={C} r={R_BEZEL} fill="url(#mbz2)"/>
      <circle cx={C} cy={C} r={R_BEZEL-1} fill="none" stroke="#5a5a8a" strokeWidth={1.5} opacity={0.85}/>
      <circle cx={C} cy={C} r={R_GRIP} fill="url(#mgp2)"/>
      {Array.from({ length: 70 }).map((_, i) => {
        const ang = (i / 70) * 2 * Math.PI;
        const lit = (Math.cos(ang - Math.PI / 2) + 1) / 2;
        return (
          <line key={i}
            x1={C + (R_WELL+3)*Math.sin(ang)} y1={C - (R_WELL+3)*Math.cos(ang)}
            x2={C + (R_GRIP-3)*Math.sin(ang)} y2={C - (R_GRIP-3)*Math.cos(ang)}
            stroke="#a0a0d8" strokeWidth={i%4===0 ? 1.5 : 0.7} opacity={0.08+0.48*lit}
          />
        );
      })}
      <circle cx={C} cy={C} r={R_WELL+4} fill="none" stroke="#000" strokeWidth={8} opacity={0.8}/>
      <circle cx={C} cy={C} r={R_WELL} fill="#0c0c18"/>
      <circle cx={C} cy={C} r={R_WELL-2} fill="none" stroke={glowColor} strokeWidth={2.5}
        style={{ filter: `drop-shadow(0 0 6px ${glowColor})` }}/>
    </svg>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const FREE_TIME_SIGS = [
  { label: "4/4", beats: 4 },
  { label: "3/4", beats: 3 },
  { label: "6/8", beats: 6 },
];
const ALL_TIME_SIGS = [
  ...FREE_TIME_SIGS,
  { label: "2/4", beats: 2 },
  { label: "5/4", beats: 5 },
  { label: "7/8", beats: 7 },
  { label: "12/8", beats: 12 },
];
const SUBDIVISIONS = [
  { label: "♩",   value: 1 },
  { label: "♪",   value: 2 },
  { label: "♪3",  value: 3 },
  { label: "♬",   value: 4 },
];
const SOUND_TYPES: { label: string; value: SoundType }[] = [
  { label: "Classic",    value: "classic"    },
  { label: "Woodblock",  value: "woodblock"  },
  { label: "Electronic", value: "electronic" },
  { label: "Cosmic",     value: "cosmic"     },
];

const BPM_MIN = 20, BPM_MAX = 300, TAP_WINDOW_MS = 3000;
function clampBpm(v: number) { return Math.max(BPM_MIN, Math.min(BPM_MAX, Math.round(v))); }

const TEMPO_TABLE: [number, string][] = [
  [0, "LARGHISSIMO"], [24, "LARGO"], [40, "LARGHETTO"],
  [60, "ADAGIO"], [66, "ANDANTE"], [108, "MODERATO"],
  [120, "ALLEGRO"], [156, "VIVACE"], [168, "PRESTO"], [208, "PRESTISSIMO"],
];
function tempoMark(bpm: number): string {
  let mark = "MODERATO";
  for (const [b, m] of TEMPO_TABLE) if (bpm >= b) mark = m;
  return mark;
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function MetronomePage() {
  const [, navigate] = useLocation();
  const { isPremium } = usePremium();

  const [themeIdx,   setThemeIdx]   = useState<ThemeIdx>(4);
  const [timeSigIdx, setTimeSigIdx] = useState(0);
  const [subdivIdx,  setSubdivIdx]  = useState(0);
  const [soundIdx,   setSoundIdx]   = useState(0);
  const [bpm,        setBpm]        = useState(120);
  const [playing,    setPlaying]    = useState(false);
  const [beatStates, setBeatStates] = useState<BeatState[]>(["accent", "normal", "normal", "normal"]);
  const [currentBeat, setCurrentBeat] = useState<{ beat: number; sub: number } | null>(null);
  const [showBeats,  setShowBeats]  = useState(false);
  const [showSubdiv, setShowSubdiv] = useState(false);
  const [showSound,  setShowSound]  = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);

  const theme    = THEMES[themeIdx];
  const timeSig  = ALL_TIME_SIGS[timeSigIdx];
  const subdiv   = SUBDIVISIONS[subdivIdx];
  const sound    = SOUND_TYPES[soundIdx];
  const numBeats = timeSig.beats;
  const segs     = subdiv.value;

  const engineRef   = useRef<MetronomeEngine | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const jogRef      = useRef<HTMLDivElement>(null);
  const dragRef     = useRef<{ startAngle: number; startBpm: number } | null>(null);

  const stars = useStars(60);

  // Derive engine params from beatStates
  const mutedBeats = useMemo(
    () => beatStates.map((s, i) => s === "mute" ? i : -1).filter((i) => i >= 0),
    [beatStates],
  );
  const accentSilent = beatStates[0] === "mute";

  // Reset beat states when time signature changes
  useEffect(() => {
    setBeatStates(Array.from({ length: numBeats }, (_, i) => i === 0 ? "accent" : "normal"));
  }, [numBeats]);

  // Initialise engine
  useEffect(() => {
    const eng = new MetronomeEngine();
    engineRef.current = eng;
    eng.onTick = (beatIdx: number, subIdx: number) => {
      setCurrentBeat({ beat: beatIdx, sub: subIdx });
    };
    return () => { eng.stop(); engineRef.current = null; };
  }, []);

  // Sync engine params
  useEffect(() => {
    const eng = engineRef.current; if (!eng) return;
    eng.bpm             = bpm;
    eng.beatsPerMeasure = numBeats;
    eng.subdivision     = segs;
    eng.soundType       = sound.value;
    eng.mutedBeats      = mutedBeats;
    eng.accentSilent    = accentSilent;
  }, [bpm, numBeats, segs, sound.value, mutedBeats, accentSilent]);

  const restartEngine = useCallback((newBpm?: number) => {
    const eng = engineRef.current; if (!eng || !playing) return;
    eng.stop();
    setTimeout(() => {
      if (!engineRef.current) return;
      engineRef.current.bpm             = newBpm ?? bpm;
      engineRef.current.beatsPerMeasure = numBeats;
      engineRef.current.subdivision     = segs;
      engineRef.current.soundType       = sound.value;
      engineRef.current.mutedBeats      = mutedBeats;
      engineRef.current.accentSilent    = accentSilent;
      engineRef.current.start();
    }, 20);
  }, [playing, bpm, numBeats, segs, sound.value, mutedBeats, accentSilent]);

  const handlePlayStop = () => {
    const eng = engineRef.current; if (!eng) return;
    ensureAudioCtx();
    if (playing) {
      eng.stop();
      setPlaying(false);
      setCurrentBeat(null);
    } else {
      eng.bpm             = bpm;
      eng.beatsPerMeasure = numBeats;
      eng.subdivision     = segs;
      eng.soundType       = sound.value;
      eng.mutedBeats      = mutedBeats;
      eng.accentSilent    = accentSilent;
      eng.start();
      setPlaying(true);
    }
  };

  const handleTimeSig = (idx: number) => {
    const ts = ALL_TIME_SIGS[idx];
    if (!isPremium && !FREE_TIME_SIGS.some((f) => f.label === ts.label)) {
      setUpgradeFeature("Extended time signatures"); return;
    }
    setTimeSigIdx(idx);
    setShowBeats(false);
    restartEngine();
  };

  const handleSubdiv = (idx: number) => {
    if (!isPremium && idx !== 0) { setUpgradeFeature("Subdivisions"); return; }
    setSubdivIdx(idx);
    setShowSubdiv(false);
    restartEngine();
  };

  const handleSound = (idx: number) => {
    setSoundIdx(idx);
    setShowSound(false);
  };

  const handleBeatTap = (bi: number) => {
    if (!isPremium && bi !== 0) { setUpgradeFeature("Per-beat accent & mute"); return; }
    setBeatStates((prev) => {
      const next = [...prev];
      next[bi] = nextBeatState(next[bi]);
      return next;
    });
  };

  const handleTapTempo = () => {
    ensureAudioCtx();
    const now = Date.now();
    const recent = tapTimesRef.current.filter((t) => now - t < TAP_WINDOW_MS);
    recent.push(now);
    tapTimesRef.current = recent;
    if (recent.length >= 2) {
      const gaps = recent.slice(1).map((t, i) => t - recent[i]);
      const avg  = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const next = clampBpm(Math.round(60000 / avg));
      setBpm(next);
      if (engineRef.current) engineRef.current.bpm = next;
    }
  };

  const getAngle = useCallback((cx: number, cy: number, ex: number, ey: number) => {
    return Math.atan2(ex - cx, cy - ey) * (180 / Math.PI);
  }, []);

  const onJogPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    ensureAudioCtx();
    const rect = e.currentTarget.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const ang  = getAngle(cx, cy, e.clientX, e.clientY);
    dragRef.current = { startAngle: ang, startBpm: bpm };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [bpm, getAngle]);

  const onJogPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx   = rect.left + rect.width  / 2;
    const cy   = rect.top  + rect.height / 2;
    const ang  = getAngle(cx, cy, e.clientX, e.clientY);
    let delta  = ang - dragRef.current.startAngle;
    if (delta >  180) delta -= 360;
    if (delta < -180) delta += 360;
    const next = clampBpm(dragRef.current.startBpm + delta * 0.55);
    setBpm(next);
    if (engineRef.current) engineRef.current.bpm = next;
  }, [getAngle]);

  const onJogPointerUp = useCallback(() => { dragRef.current = null; }, []);

  // Glow colour for jog wheel (based on active beat state)
  const activeBeatState = currentBeat != null ? beatStates[currentBeat.beat] : beatStates[0];
  const glowColor = !playing || activeBeatState === "mute"
    ? "#222"
    : activeBeatState === "accent"
      ? theme.accent
      : `${theme.accent}66`;

  const BG = `linear-gradient(135deg, ${BG_MAIN} 0%, ${BG_GRAD} 50%, ${BG_MAIN} 100%)`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG, position: "relative", overflow: "hidden" }}>

      {/* Stars */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map((s) => (
          <circle key={s.id} cx={s.x} cy={s.y} r={s.r * 0.22} fill="#fff" opacity={s.op}>
            {s.twinkle && (
              <animate attributeName="opacity"
                values={`${s.op};${s.op * 0.3};${s.op}`}
                dur={`${2 + (s.id % 3)}s`} repeatCount="indefinite"/>
            )}
          </circle>
        ))}
        <ellipse cx="20" cy="15" rx="28" ry="18" fill="#0a1840" opacity="0.25"/>
        <ellipse cx="75" cy="70" rx="30" ry="20" fill="#100a30" opacity="0.20"/>
      </svg>

      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative", zIndex: 1 }}>
        <button onClick={() => { engineRef.current?.stop(); navigate("/"); }} className="p-2 -ml-2">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M13 4l-6 6 6 6" stroke="rgba(255,255,255,0.5)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold tracking-widest" style={{ color: theme.accent }}>PRECISION LABS</p>
          <p className="text-base font-bold text-white tracking-wide">METRONOME</p>
        </div>
        <div className="w-10" />
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center gap-3 px-4 py-3 pb-8" style={{ position: "relative", zIndex: 1, maxWidth: 480, margin: "0 auto", width: "100%" }}>

        {/* Colour picker */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 2, color: "#50508a", fontFamily: "monospace" }}>COLOUR</span>
          {THEMES.map((t, i) => (
            <button
              key={i}
              onClick={() => {
                if (!isPremium && i !== 4) { setUpgradeFeature("Colour themes"); return; }
                setThemeIdx(i as ThemeIdx);
              }}
              title={t.label}
              style={{
                width: i === themeIdx ? 22 : 16,
                height: i === themeIdx ? 22 : 16,
                borderRadius: "50%",
                backgroundColor: t.accent,
                border: i === themeIdx ? "2.5px solid #fff" : `2px solid ${t.accentDim}`,
                boxShadow: i === themeIdx ? `0 0 8px ${t.accent}, 0 0 16px ${t.accent}66` : "none",
                cursor: "pointer",
                padding: 0,
                transition: "all 0.15s ease",
                opacity: !isPremium && i !== 4 ? 0.4 : 1,
              }}
            />
          ))}
        </div>

        {/* Beat blocks */}
        <div style={{ width: "100%" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {beatStates.map((state, bi) => (
              <BeatBlock key={bi}
                beatState={state}
                segs={segs}
                activeSeg={playing && currentBeat?.beat === bi ? currentBeat.sub : -1}
                onTap={() => handleBeatTap(bi)}
                accent={theme.accent}
                accentDim={theme.accentDim}
                stripDim={theme.stripDim}
              />
            ))}
            {/* Global A button */}
            <div
              onClick={() => handleBeatTap(0)}
              style={{
                width: 36, height: 62, borderRadius: 8, flexShrink: 0,
                background: "linear-gradient(180deg,#36365a,#1e1e38)",
                border: "1px solid #4e4e7a",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                cursor: "pointer",
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent, boxShadow: `0 0 5px ${theme.accent}` }}/>
              <span style={{ fontSize: 10, fontWeight: 800, color: "#c8c0a0" }}>A</span>
            </div>
          </div>
          <CountRow
            segs={segs} states={beatStates} numBeats={numBeats}
            accent={theme.accent} accentDim={theme.accentDim}
          />
        </div>

        {/* Strip buttons */}
        <div className="flex gap-2 w-full relative">
          {/* BEATS */}
          <div className="flex-1 relative">
            <button
              onClick={() => { setShowBeats((v) => !v); setShowSubdiv(false); setShowSound(false); }}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                background: showBeats ? `${theme.accent}22` : "linear-gradient(180deg,#36365a,#1e1e38)",
                border: `1px solid ${showBeats ? theme.accent + "88" : "#4e4e7a"}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "#8080b0" }}>BEATS</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: showBeats ? theme.accent : "#c8c8ec" }}>{timeSig.label}</span>
            </button>
            {showBeats && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl overflow-hidden" style={{ background: "#0d0018", border: "1px solid rgba(255,255,255,0.1)" }}>
                {ALL_TIME_SIGS.map((ts, i) => {
                  const isFree = FREE_TIME_SIGS.some((f) => f.label === ts.label);
                  return (
                    <button key={i} onClick={() => handleTimeSig(i)}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs"
                      style={{ color: timeSigIdx === i ? theme.accent : "rgba(255,255,255,0.55)", background: timeSigIdx === i ? `${theme.accent}14` : "transparent" }}
                    >
                      <span className="flex items-center gap-1.5">
                        {!isPremium && !isFree && (
                          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                            <rect x="2" y="4" width="5" height="4" rx="0.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                            <path d="M3 4V3a1.5 1.5 0 0 1 3 0v1" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                          </svg>
                        )}
                        {ts.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* SUBDIV */}
          <div className="flex-1 relative">
            <button
              onClick={() => { setShowSubdiv((v) => !v); setShowBeats(false); setShowSound(false); }}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                background: showSubdiv ? `${theme.accent}22` : "linear-gradient(180deg,#36365a,#1e1e38)",
                border: `1px solid ${showSubdiv ? theme.accent + "88" : "#4e4e7a"}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "#8080b0" }}>SUBDIV</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: showSubdiv ? theme.accent : "#c8c8ec" }}>{subdiv.label}</span>
            </button>
            {showSubdiv && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl overflow-hidden" style={{ background: "#0d0018", border: "1px solid rgba(255,255,255,0.1)" }}>
                {SUBDIVISIONS.map((s, i) => (
                  <button key={i} onClick={() => handleSubdiv(i)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs"
                    style={{ color: subdivIdx === i ? theme.accent : "rgba(255,255,255,0.55)", background: subdivIdx === i ? `${theme.accent}14` : "transparent" }}
                  >
                    {!isPremium && i !== 0 && (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <rect x="2" y="4" width="5" height="4" rx="0.5" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                        <path d="M3 4V3a1.5 1.5 0 0 1 3 0v1" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/>
                      </svg>
                    )}
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* SOUND */}
          <div className="flex-1 relative">
            <button
              onClick={() => { setShowSound((v) => !v); setShowBeats(false); setShowSubdiv(false); }}
              style={{
                width: "100%", height: 48, borderRadius: 10,
                background: showSound ? `${theme.accent}22` : "linear-gradient(180deg,#36365a,#1e1e38)",
                border: `1px solid ${showSound ? theme.accent + "88" : "#4e4e7a"}`,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer",
              }}
            >
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 2, color: "#8080b0" }}>SOUND</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: showSound ? theme.accent : "#c8c8ec" }}>{sound.label}</span>
            </button>
            {showSound && (
              <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-xl overflow-hidden" style={{ background: "#0d0018", border: "1px solid rgba(255,255,255,0.1)" }}>
                {SOUND_TYPES.map((s, i) => (
                  <button key={i} onClick={() => handleSound(i)}
                    className="w-full px-3 py-2 text-xs text-left"
                    style={{ color: soundIdx === i ? theme.accent : "rgba(255,255,255,0.55)", background: soundIdx === i ? `${theme.accent}14` : "transparent" }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* BPM display */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 52, fontWeight: 800, color: "#e8e8fc", letterSpacing: -2, lineHeight: 1 }}>{bpm}</div>
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: 3, color: "#484870", marginTop: 2 }}>BPM</div>
          <div style={{ fontSize: 9, fontWeight: 500, letterSpacing: 2, color: "#50508a", marginTop: 2 }}>{tempoMark(bpm)}</div>
        </div>

        {/* Jog wheel */}
        <div
          ref={jogRef}
          style={{ width: 160, height: 160, touchAction: "none", cursor: "grab", flexShrink: 0 }}
          onPointerDown={onJogPointerDown}
          onPointerMove={onJogPointerMove}
          onPointerUp={onJogPointerUp}
          onPointerCancel={onJogPointerUp}
        >
          <JogWheelSvg glowColor={glowColor} size={160} />
        </div>

        {/* Play/Stop + Tap */}
        <div style={{ display: "flex", gap: 10, width: "100%" }}>
          <button
            onClick={handlePlayStop}
            style={{
              flex: 1, height: 48, borderRadius: 12,
              background: playing
                ? "linear-gradient(180deg,#42426a,#22223c)"
                : `linear-gradient(180deg,${theme.accentDim},#0c0c20)`,
              border: `1px solid ${playing ? "#8060e0" : theme.accent + "88"}`,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: playing ? "0 0 12px #8060e0aa" : `0 0 8px ${theme.accent}44`,
              cursor: "pointer",
            }}
          >
            {playing ? (
              <>
                <div style={{ width: 22, height: 3, borderRadius: 2, backgroundColor: "#8060e0", boxShadow: "0 0 5px #8060e0" }}/>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#dcdcf8" }}>PAUSE</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 2l10 5-10 5V2z" fill={theme.accent}/>
                </svg>
                <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#dcdcf8" }}>PLAY</span>
              </>
            )}
          </button>
          <button
            onClick={handleTapTempo}
            style={{
              flex: 1, height: 48, borderRadius: 12,
              background: "linear-gradient(180deg,#36365a,#1e1e38)",
              border: "1px solid #5a5a88",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: "#dcdcf8" }}>TAP</span>
          </button>
        </div>

        {/* BPM nudge */}
        <div className="flex gap-2 justify-center">
          {[-10,-5,-1,+1,+5,+10].map((d) => (
            <button
              key={d}
              onClick={() => {
                const next = clampBpm(bpm + d);
                setBpm(next);
                if (engineRef.current) engineRef.current.bpm = next;
              }}
              style={{
                padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer",
                background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)",
                border: "none",
              }}
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>

      </div>

      <UpgradeModal visible={!!upgradeFeature} feature={upgradeFeature ?? undefined} onClose={() => setUpgradeFeature(null)} />
    </div>
  );
}
