import { useEffect, useMemo, useRef, useState } from "react";
import { type Instrument, tunings } from "./tunerData";
import { type TunerString, detectEnergyString, detectStringCandidates, getCentsOff, midiToFrequency } from "./pitch";
import "./_group.css";

type LockMode = "auto" | "locked";
const A = "/__mockup/tuner-assets/";

// Taper constants — outer E strings pulled well inside the chrome binding.
// TL/TR = string centres at nut (top of SVG); BL/BR = at body end (bottom of SVG).
const TL = 21, TR = 79;
const BL = 15, BR = 85;

function strX(i: number, n: number, top: boolean): number {
  const L = top ? TL : BL, R = top ? TR : BR;
  return L + (R - L) * (n > 1 ? i / (n - 1) : 0.5);
}
function strW(i: number, n: number): number {
  return parseFloat((1.15 - 0.87 * (n > 1 ? i / (n - 1) : 0)).toFixed(2));
}
// Wound strings: low-E, A, D (first 3 on a 6-str; scales for other counts).
function woundCount(n: number): number { return n >= 6 ? 3 : n >= 4 ? 2 : 1; }

/** Replace ASCII accidentals with proper musical symbols: F# → F♯, Bb → B♭ */
function formatNote(label: string): string {
  return label.replace(/#/g, "♯").replace(/b$/, "♭");
}

const A4_MIN  = 430;
const A4_MAX  = 450;
const A4_VALS = Array.from({ length: A4_MAX - A4_MIN + 1 }, (_, i) => A4_MIN + i);
const ITEM_H  = 24; // px per drum-roller row

export function Tuner() {
  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [stringCount, setStringCount]   = useState("6");
  const [tuningIndex, setTuningIndex]   = useState(0);
  const [a4, setA4]                     = useState(440);
  const [lockMode, setLockMode]         = useState<LockMode>("auto");
  const [lockedString, setLockedString] = useState(0);
  const [activeString, setActiveString] = useState<number | null>(null);
  const [detectedFreq, setDetectedFreq] = useState<number | null>(null);
  const [targetFreq, setTargetFreq]     = useState<number | null>(null);
  const [cents, setCents]               = useState(0);
  const [running, setRunning]           = useState(false);
  const [vibration, setVibration]       = useState(0);
  const [showTuning, setShowTuning]     = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [a4Typing, setA4Typing]         = useState(false);
  const [a4Input, setA4Input]           = useState("");
  const [micError, setMicError]         = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef     = useRef<AnalyserNode | null>(null);
  const mediaStreamRef  = useRef<MediaStream | null>(null);
  const bufferRef       = useRef<Float32Array<ArrayBuffer> | null>(null);
  const lastStringIdxRef = useRef<number | null>(null);
  const rafRef          = useRef<number | null>(null);
  const phoneRef        = useRef<HTMLDivElement>(null);
  // Stability refs — never stored in state so tick() always reads fresh values
  const smoothCentsRef  = useRef(0);
  const holdTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Stable-engine refs
  const attackStartRef  = useRef(0);
  const wasLoudRef      = useRef(false);
  type HistEntry = { stringIdx: number; cents: number; frequency: number; confidence: number; time: number };
  const historyRef      = useRef<HistEntry[]>([]);
  // In-tune chime gating
  const inTuneStartRef  = useRef<number | null>(null);
  const chimeFiredRef   = useRef(false);

  const counts = Object.keys(tunings[instrument]);
  const tuning = useMemo(() => {
    const presets = tunings[instrument][stringCount] ?? tunings[instrument][counts[0]];
    return presets[tuningIndex] ?? presets[0];
  }, [instrument, stringCount, tuningIndex, counts]);

  useEffect(() => {
    const first = Object.keys(tunings[instrument])[0];
    setStringCount(first);
    setTuningIndex(0);
    setLockedString(0);
  }, [instrument]);

  useEffect(() => {
    setTuningIndex(0);
    setLockedString(0);
  }, [stringCount]);

  useEffect(() => () => stop(), []);

  // Reset chime gate whenever the player switches to a different string —
  // so each string gets its own "ding" rather than staying silent after the first.
  useEffect(() => {
    inTuneStartRef.current = null;
    chimeFiredRef.current  = false;
  }, [lockedString]);

  /* Scale the 390×844 shell to fill the phone screen edge-to-edge.
     Uses the tighter of width/height so no padding shows on either axis. */
  useEffect(() => {
    function applyScale() {
      const el = phoneRef.current;
      if (!el) return;
      const vw = window.innerWidth;
      if (vw > 450) { el.style.transform = ""; el.style.top = ""; return; }
      const vh = window.visualViewport?.height ?? window.innerHeight;
      // Fit within whichever dimension is shorter — no clipping on any phone
      const scale = Math.min(vw / 390, vh / 844);
      el.style.transform = `scale(${scale})`;
      el.style.top = "0px";
    }
    applyScale();
    window.addEventListener("resize", applyScale);
    window.visualViewport?.addEventListener("resize", applyScale);
    return () => {
      window.removeEventListener("resize", applyScale);
      window.visualViewport?.removeEventListener("resize", applyScale);
    };
  }, []);

  function handleA4Scroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const idx = Math.round(el.scrollTop / ITEM_H);
    const val = A4_MIN + Math.max(0, Math.min(A4_VALS.length - 1, idx));
    if (val !== a4) setA4(val);
  }

  async function start() {
    if (running) return;
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 },
      });
      const audioContext = new AudioContext();
      const source       = audioContext.createMediaStreamSource(stream);

      // High-pass removes room rumble; low-pass cuts hiss above high-E harmonics.
      const highPass = audioContext.createBiquadFilter();
      highPass.type            = "highpass";
      highPass.frequency.value = 65;
      highPass.Q.value         = 0.707;
      const lowPass  = audioContext.createBiquadFilter();
      lowPass.type             = "lowpass";
      lowPass.frequency.value  = 1800;
      lowPass.Q.value          = 0.707;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize               = 8192; // larger window → better low-E resolution
      analyser.smoothingTimeConstant = 0;
      source.connect(highPass);
      highPass.connect(lowPass);
      lowPass.connect(analyser);

      mediaStreamRef.current  = stream;
      audioContextRef.current = audioContext;
      analyserRef.current     = analyser;
      bufferRef.current       = new Float32Array(analyser.fftSize);
      setRunning(true);
      tick(audioContext.sampleRate);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone not available";
      setMicError(msg);
    }
  }

  function stop() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioContextRef.current?.close();
    mediaStreamRef.current  = null;
    audioContextRef.current = null;
    analyserRef.current     = null;
    bufferRef.current       = null;
    smoothCentsRef.current  = 0;
    attackStartRef.current  = 0;
    wasLoudRef.current      = false;
    historyRef.current       = [];
    lastStringIdxRef.current = null;
    inTuneStartRef.current   = null;
    chimeFiredRef.current    = false;
    setRunning(false);
    setDetectedFreq(null);
    setTargetFreq(null);
    setActiveString(null);
    setVibration(0);
  }

  function tick(sampleRate: number) {
    const analyser = analyserRef.current;
    const buffer   = bufferRef.current;
    if (!analyser || !buffer) return;

    const now = performance.now();
    analyser.getFloatTimeDomainData(buffer);

    // ── 1. DC remove — eliminates microphone bias that shifts the waveform ──
    let mean = 0;
    for (let i = 0; i < buffer.length; i++) mean += buffer[i];
    mean /= buffer.length;
    for (let i = 0; i < buffer.length; i++) buffer[i] -= mean;

    // ── 2. Energy — drives vibration animation immediately on pluck ──
    let sq = 0;
    for (let i = 0; i < buffer.length; i++) sq += buffer[i] * buffer[i];
    const rms    = Math.sqrt(sq / buffer.length);
    const isLoud = rms > 0.0045;

    if (isLoud) {
      setVibration(Math.min(1, rms * 12));
    } else {
      setVibration((v) => Math.max(0, v - 0.03));
    }

    // ── 3. Attack onset tracking ──
    if (isLoud && !wasLoudRef.current) {
      attackStartRef.current = now;
      historyRef.current     = [];
    }
    wasLoudRef.current = isLoud;

    if (!isLoud) {
      historyRef.current       = [];
      lastStringIdxRef.current = null;
      if (!holdTimerRef.current) {
        holdTimerRef.current = setTimeout(() => {
          setDetectedFreq(null);
          setTargetFreq(null);
          setActiveString(null);
          smoothCentsRef.current = 0;
          holdTimerRef.current   = null;
        }, 400);
      }
      rafRef.current = requestAnimationFrame(() => tick(sampleRate));
      return;
    }

    if (holdTimerRef.current) { clearTimeout(holdTimerRef.current); holdTimerRef.current = null; }

    // ── 4. Build string definitions for current tuning + calibration ──
    const strings: TunerString[] = tuning.strings.map((s, i) => ({
      idx: i, label: s.label, midi: s.midi,
      frequency: midiToFrequency(s.midi, a4),
    }));

    // ── 5. Goertzel energy — fires every frame, gives instant visual feedback ──
    //    Highlights the active string before the NSDF stability gate clears.
    const energyIdx = detectEnergyString(buffer, sampleRate, strings);
    if (energyIdx !== null) {
      const visualIdx = lockMode === "locked" ? lockedString : energyIdx;
      setActiveString(visualIdx);
      setTargetFreq(midiToFrequency(tuning.strings[visualIdx].midi, a4));
    }

    // ── 6. Attack window — ignore the first 90 ms of a hard pick transient ──
    if (now - attackStartRef.current < 90) {
      rafRef.current = requestAnimationFrame(() => tick(sampleRate));
      return;
    }

    // ── 7. Per-string NSDF candidates ──
    //    For each guitar string, run MPM in a ±5.5 % lag window around its
    //    expected period.  The window is too narrow for an octave harmonic to
    //    land inside it, so octave errors are geometrically impossible.
    const candidateStrings = lockMode === "locked"
      ? strings.filter((s) => s.idx === lockedString)
      : strings;

    const candidates = detectStringCandidates(
      buffer, sampleRate, candidateStrings, energyIdx, lastStringIdxRef.current,
    );
    const best = candidates[0];

    if (!best || best.confidence < 0.48 || Math.abs(best.cents) > 70) {
      rafRef.current = requestAnimationFrame(() => tick(sampleRate));
      return;
    }

    // ── 8. Rolling history (360 ms window) ──
    historyRef.current.push({
      stringIdx:  best.string.idx,
      cents:      best.cents,
      frequency:  best.frequency,
      confidence: best.confidence,
      time:       now,
    });
    historyRef.current = historyRef.current.filter((r) => now - r.time <= 360);

    // ── 9. Stable gate: 4+ readings of same string, IQR spread < 9 cents ──
    const latestIdx = historyRef.current[historyRef.current.length - 1].stringIdx;
    const sameStr   = historyRef.current.filter((r) => r.stringIdx === latestIdx);
    if (sameStr.length < 4) {
      rafRef.current = requestAnimationFrame(() => tick(sampleRate));
      return;
    }
    const centsArr = sameStr.map((r) => r.cents).sort((a, b) => a - b);
    const iqLo     = centsArr[Math.floor(centsArr.length * 0.20)];
    const iqHi     = centsArr[Math.floor(centsArr.length * 0.80)];
    if (iqHi - iqLo > 9) {
      rafRef.current = requestAnimationFrame(() => tick(sampleRate));
      return;
    }

    // ── 10. Committed reading — median cents ──
    const medianCents = centsArr[Math.floor(centsArr.length / 2)];
    const targetF     = midiToFrequency(tuning.strings[latestIdx].midi, a4);
    const stableFreq  = targetF * Math.pow(2, medianCents / 1200);

    lastStringIdxRef.current = latestIdx;

    const displayIdx = lockMode === "locked" ? lockedString : latestIdx;
    const displayTgt = midiToFrequency(tuning.strings[displayIdx].midi, a4);
    const rawCents   = Math.max(-50, Math.min(50,
      displayIdx === latestIdx ? medianCents : getCentsOff(stableFreq, displayTgt),
    ));

    setDetectedFreq(stableFreq);
    setTargetFreq(displayTgt);
    setActiveString(displayIdx);

    // ── 11. Centre lock ±2 cents → snap needle to zero ──
    const centsTarget = Math.abs(rawCents) <= 2 ? 0 : rawCents;

    // ── 12. EMA smoothing — 0.20 per frame gives calm but responsive needle ──
    smoothCentsRef.current += (centsTarget - smoothCentsRef.current) * 0.20;
    setCents(smoothCentsRef.current);

    // ── 13. In-tune chime — one soft ping after 300 ms in the ±3 cent zone ──
    const displayInTune = Math.abs(smoothCentsRef.current) <= 3;
    if (displayInTune) {
      if (inTuneStartRef.current === null) inTuneStartRef.current = now;
      if (!chimeFiredRef.current && now - inTuneStartRef.current >= 300) {
        chimeFiredRef.current = true;
        playInTuneChime();
      }
    } else {
      inTuneStartRef.current = null;
      // Hysteresis: only allow re-chime once clearly out of tune (> ±8 ¢).
      // This stops a stable string sitting at 6 ¢ from flickering in/out.
      if (Math.abs(smoothCentsRef.current) > 8) chimeFiredRef.current = false;
    }

    rafRef.current = requestAnimationFrame(() => tick(sampleRate));
  }

  function playInTuneChime() {
    // Use a fresh AudioContext so mic-input routing never blocks the chime.
    try {
      const ctx = new AudioContext();
      // Gentle two-tone ping: root + perfect fifth, short exponential decay
      const pairs: [number, number][] = [[1046.5, 0.18], [1568.0, 0.12]]; // C6, G6
      pairs.forEach(([freq, vol]) => {
        const osc  = ctx.createOscillator();
        const amp  = ctx.createGain();
        osc.type   = "sine";
        osc.frequency.value = freq;
        amp.gain.setValueAtTime(0, ctx.currentTime);
        amp.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.012);
        amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
        osc.connect(amp);
        amp.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.75);
      });
      // Auto-close after the sound finishes
      setTimeout(() => ctx.close(), 900);
    } catch { /* audio not available */ }
  }

  // Derive the note name directly from the detected frequency so it is
  // always accurate regardless of which string was matched.
  function freqToNoteName(freq: number): string {
    const useFlats = tuning.strings.some((s) => s.label.includes("b"));
    const sharps   = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const flats    = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
    const names    = useFlats ? flats : sharps;
    const midi     = Math.round(12 * Math.log2(freq / a4) + 69);
    return names[((midi % 12) + 12) % 12];
  }

  // ── TEMP MOCK: ?mock=flat|intune|sharp|tuning|settings ──────────
  const _mock = new URLSearchParams(window.location.search).get("mock");
  const _mFreq  = _mock && _mock !== "tuning" && _mock !== "settings" ? 108.0 : detectedFreq;
  const _mCents = _mock === "flat" ? -18 : _mock === "sharp" ? +18 : _mock === "intune" ? +1 : cents;
  const _mShow  = _mock === "tuning";
  const _mSet   = _mock === "settings";
  // ────────────────────────────────────────────────────────────────

  const inTune     = _mFreq != null && Math.abs(_mCents) <= 3;
  const isClose    = _mFreq != null && !inTune && Math.abs(_mCents) <= 8;
  const isOut      = _mFreq != null && !inTune && !isClose;
  const activeNote = _mFreq != null ? formatNote(freqToNoteName(_mFreq)) : "—";
  const litFlat    = (detectedFreq != null && cents < 0) ? Math.min(12, Math.round(-cents * 12 / 50)) : 0;
  const litSharp   = (detectedFreq != null && cents > 0) ? Math.min(12, Math.round( cents * 12 / 50)) : 0;
  const lockedNote = tuning.strings[lockedString]?.label ?? tuning.strings[0].label;
  const n = tuning.strings.length;

  const resonanceStatus = running ? (vibration > 0.5 ? "STABLE" : "ACTIVE") : "INACTIVE";

  return (
    <div className="tuner-root">
      {/* Mobile bg — fixed to viewport, immune to scale transform */}
      <img className="tuner-space-bg tuner-space-bg--mobile" src={A + "png/space_background.png"} alt="" />
      <div className="tuner-phone" ref={phoneRef}>
      <main className="tuner-screen">
        {/* Desktop bg — inside phone shell, clipped by border-radius */}
        <img className="tuner-space-bg tuner-space-bg--desktop" src={A + "png/space_background.png"} alt="" />

        {/* Dynamic Island */}
        <div className="tuner-dynamic-island" />

        {/* Header — logo only */}
        <header className="tuner-header">
          <img className="tuner-top-bar" src={A + "branding/AGS_logo_nobg.png"} alt="Alien Guitar Secrets" />
        </header>

        {/* Instrument + string count */}
        <section className="tuner-instrument-select">
          <img className="tuner-bar-bg" src={A + "png/dropdown_bar.png"} alt="" />
          <img className="tuner-inst-icon" src={A + "svg/instrument_guitar_icon.svg"} alt="" />
          <select value={instrument} onChange={(e) => setInstrument(e.target.value as Instrument)}>
            <option value="guitar">Electric Guitar</option>
            <option value="bass">Bass</option>
            <option value="uke">Ukulele</option>
          </select>
          <select value={stringCount} onChange={(e) => setStringCount(e.target.value)}>
            {counts.map((c) => <option key={c} value={c}>{c} String</option>)}
          </select>
        </section>

        {/* Tuning label + icon buttons */}
        <section className="tuner-readout">
          <button className="tuner-icon-btn" onClick={() => { setShowTuning(true); setShowSettings(false); }}>
            <img src={A + "svg/hamburger_icon.svg"} alt="Tunings" />
          </button>
          <div className="tuner-readout-centre">
            <div className="tuner-detected">{tuning.label}</div>
            <div className="tuner-string-notes">
              {tuning.strings.map(s => formatNote(s.label)).join(" · ")}
            </div>
          </div>
          <button className="tuner-icon-btn" onClick={() => { setShowSettings(true); setShowTuning(false); }}>
            <img src={A + "svg/settings_icon.svg"} alt="Settings" />
          </button>
        </section>

        {/* Meter — pips above, note in centre flanked by ♭ / ♯ arrows */}
        <section className="tuner-meter">
          <div className="tuner-cents-bar">
            {Array.from({ length: 25 }, (_, idx) => {
              const pos = idx - 12;
              let cls = "tuner-cent-pip";
              if (pos === 0) {
                if (inTune)                    cls += " lit-tune";
                else if (isClose)              cls += " lit-close";
                else if (isOut)                cls += " lit-out";
                else if (detectedFreq != null) cls += " lit-center";
              } else if (pos < 0 && Math.abs(pos) <= litFlat) {
                cls += isClose ? " lit-close" : " lit-out";
              } else if (pos > 0 && pos <= litSharp) {
                cls += isClose ? " lit-close" : " lit-out";
              }
              return <div key={idx} className={cls} data-center={pos === 0 || undefined} />;
            })}
          </div>
          {(() => {
            const ts = detectedFreq == null ? "idle"
              : inTune   ? "tune"
              : isClose  ? (cents < 0 ? "close-flat" : "close-sharp")
              :              cents < 0 ? "out-flat"   : "out-sharp";
            return (
              <div className="tuner-meter-labels">
                <span className={`tuner-flat ts-${ts}`}>◄ ♭</span>
                <div className="tuner-meter-centre">
                  <span className={`tuner-tune-arrow${inTune ? " visible" : ""}`}>▲</span>
                  <div className="tuner-note">{activeNote}</div>
                </div>
                <span className={`tuner-sharp ts-${ts}`}>♯ ►</span>
              </div>
            );
          })()}
        </section>

        {/* Fretboard — fills all remaining height */}
        <section className="tuner-fretboard">
          <img className="tuner-wood" src={A + "png/fretboard_with_nut.png?v=6"} alt="" />
          <img className="tuner-glow" src={A + "png/fretboard_cosmic_glow_overlay.png"} alt="" />

          {/* Tapered strings */}
          <svg className="tuner-strings-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              {/* Wound string winding — hard-edged nickel ridge + deep shadow groove */}
              <pattern id="wnd" x="0" y="0" width="100" height="0.64" patternUnits="userSpaceOnUse">
                <rect width="100" height="0.08" fill="#e8e8e0"/>
                <rect y="0.08" width="100" height="0.34" fill="#a8a8a0"/>
                <rect y="0.42" width="100" height="0.22" fill="#141210"/>
              </pattern>
              <pattern id="wnd-a" x="0" y="0" width="100" height="0.64" patternUnits="userSpaceOnUse">
                <rect width="100" height="0.08" fill="#fce878"/>
                <rect y="0.08" width="100" height="0.34" fill="#e8b430"/>
                <rect y="0.42" width="100" height="0.22" fill="#2a1800"/>
              </pattern>
              {/* Plain steel string — cross-gradient gives a round-wire highlight */}
              <linearGradient id="plain" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="#6a6a68"/>
                <stop offset="28%"  stopColor="#deded8"/>
                <stop offset="62%"  stopColor="#c8c8c2"/>
                <stop offset="100%" stopColor="#626260"/>
              </linearGradient>
              <linearGradient id="plain-a" x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%"   stopColor="#b07820"/>
                <stop offset="28%"  stopColor="#fcd96a"/>
                <stop offset="62%"  stopColor="#f4c64b"/>
                <stop offset="100%" stopColor="#a06810"/>
              </linearGradient>
            </defs>
            {tuning.strings.map((s, i) => {
              const active = i === activeString;
              const x1 = strX(i, n, true);
              const x2 = strX(i, n, false);
              const w  = strW(i, n);
              const wound = i < woundCount(n);
              const fill = wound
                ? (active ? "url(#wnd-a)" : "url(#wnd)")
                : (active ? "url(#plain-a)" : "url(#plain)");
              return (
                <polygon
                  key={i}
                  className={active ? "tuner-str-active" : undefined}
                  points={`${x1 - w / 2},0 ${x1 + w / 2},0 ${x2 + w},100 ${x2 - w},100`}
                  fill={fill}
                  stroke={wound ? (active ? "#3a2000" : "#0e0d0c") : "none"}
                  strokeWidth={wound ? 0.3 : 0}
                  opacity={active ? 1 : 0.9}
                  style={active ? { "--vibe": `${vibration * 0.6}px` } as React.CSSProperties : undefined}
                />
              );
            })}
          </svg>

          {/* Play prompt pill — space always reserved so fretboard height never shifts */}
          <div className="tuner-play-prompt">
            Tune Up
          </div>

          {/* String note buttons — overlaid at the bottom of the neck */}
          <div className="tuner-note-row">
            {tuning.strings.map((s, i) => {
              const active = i === activeString;
              return (
                <button
                  key={i}
                  className={`tuner-note-btn${active ? " active" : ""}${i === lockedString ? " locked" : ""}`}
                  style={{ left: `${strX(i, n, false)}%` }}
                  onClick={() => { setLockedString(i); setLockMode("locked"); }}
                >
                  <b>{formatNote(s.label)}</b>
                </button>
              );
            })}
          </div>

        </section>

        {/* Mic button — in flow below fretboard */}
        <div className="tuner-bottom">
          {micError && (
            <div className="tuner-mic-error">
              Microphone unavailable — check browser permissions
            </div>
          )}
          <div className="tuner-core-wrap">
            <button
              className={`tuner-core${inTune ? " balanced" : isClose ? " close" : isOut ? " out" : ""}`}
              onClick={running ? stop : start}
              aria-label={running ? "Stop tuner" : "Start tuner"}
            >
              <img className="tuner-core-bg"   src={A + "svg/galactic_core.svg"}  alt="" />
              <img className="tuner-core-logo" src={A + "branding/AGS_COA.svg"}   alt="" />
            </button>
            <span className="tuner-core-label">
              {running ? (inTune ? "IN TUNE" : "LISTENING") : "TAP TO TUNE"}
            </span>
          </div>
        </div>

        {/* ── Tuning picker panel (hamburger) ── */}
        {showTuning && (
          <div className="tuner-overlay" onClick={() => setShowTuning(false)}>
            <div className="tuner-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="tuner-sheet-handle" />
              <div className="tuner-sheet-title">SELECT TUNING</div>
              <div className="tuner-sheet-list">
                {(tunings[instrument][stringCount] ?? []).map((t, i) => (
                  <button
                    key={t.label}
                    className={`tuner-sheet-row${i === tuningIndex ? " active" : ""}`}
                    onClick={() => { setTuningIndex(i); setShowTuning(false); }}
                  >
                    <span className="tuner-sheet-label">{t.label}</span>
                    <span className="tuner-sheet-notes">{t.strings.map(s => formatNote(s.label)).join(" · ")}</span>
                  </button>
                ))}
              </div>
              <button className="tuner-sheet-close" onClick={() => setShowTuning(false)}>CLOSE</button>
            </div>
          </div>
        )}

        {/* ── Settings panel (gear) ── */}
        {showSettings && (
          <div className="tuner-overlay" onClick={() => setShowSettings(false)}>
            <div className="tuner-sheet" onClick={(e) => e.stopPropagation()}>
              <div className="tuner-sheet-handle" />
              <div className="tuner-sheet-title">SETTINGS</div>
              <div className="tuner-settings-row">
                <span className="tuner-settings-label">A4 REFERENCE</span>
                <select
                  className="tuner-a4-select"
                  value={a4}
                  onChange={(e) => setA4(Number(e.target.value))}
                >
                  {A4_VALS.map((v) => (
                    <option key={v} value={v}>{v} Hz</option>
                  ))}
                </select>
                {a4Typing ? (
                  <input
                    className="tuner-a4-input"
                    autoFocus
                    type="number"
                    min={A4_MIN}
                    max={A4_MAX}
                    value={a4Input}
                    onChange={(e) => setA4Input(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = Math.round(Number(a4Input));
                        if (v >= A4_MIN && v <= A4_MAX) setA4(v);
                        setA4Typing(false);
                      }
                      if (e.key === "Escape") setA4Typing(false);
                    }}
                    onBlur={() => {
                      const v = Math.round(Number(a4Input));
                      if (v >= A4_MIN && v <= A4_MAX) setA4(v);
                      setA4Typing(false);
                    }}
                  />
                ) : (
                  <span
                    className="tuner-settings-hz"
                    onMouseDown={() => { longPressRef.current = setTimeout(() => { setA4Input(String(a4)); setA4Typing(true); }, 600); }}
                    onMouseUp={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                    onTouchStart={() => { longPressRef.current = setTimeout(() => { setA4Input(String(a4)); setA4Typing(true); }, 600); }}
                    onTouchEnd={() => { if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; } }}
                    title="Hold to type a value"
                  >{a4} Hz</span>
                )}
              </div>
              <p className="tuner-settings-hint">Hold the Hz number to type a value (430–450)</p>
              <button className="tuner-sheet-close" onClick={() => { setShowSettings(false); setA4Typing(false); }}>DONE</button>
            </div>
          </div>
        )}

        {/* Home indicator bar */}
        <div className="tuner-home-bar" />
      </main>
      </div>
    </div>
  );
}
