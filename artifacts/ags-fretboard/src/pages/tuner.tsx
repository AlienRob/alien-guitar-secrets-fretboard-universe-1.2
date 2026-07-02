import { useState, useMemo, useRef, useEffect } from "react";
import { Link } from "wouter";
import { useTunerPitch } from "@/hooks/useTunerPitch";
import { usePremium } from "@/lib/usePremium";
import { tunings, STRING_COUNTS, type Instrument } from "@/lib/tunerData";
import "@/tuner.css";

const A = `${import.meta.env.BASE_URL}tuner-assets/`;

const TL = 21, TR = 79;
const BL = 15, BR = 85;
const A4_MIN = 430, A4_MAX = 450;

function strX(i: number, n: number, top: boolean): number {
  const L = top ? TL : BL, R = top ? TR : BR;
  return L + (R - L) * (n > 1 ? i / (n - 1) : 0.5);
}
function strW(i: number, n: number): number {
  return parseFloat((1.15 - 0.87 * (n > 1 ? i / (n - 1) : 0)).toFixed(2));
}
function woundCount(n: number): number { return n >= 6 ? 3 : n >= 4 ? 2 : 1; }
function formatNote(label: string): string {
  return label.replace(/#/g, "♯").replace(/b$/, "♭");
}

export default function TunerPage() {
  const { isPremium } = usePremium();

  const [instrument, setInstrument] = useState<Instrument>("guitar");
  const [stringCount, setStringCount] = useState("6");
  const [tuningIndex, setTuningIndex] = useState(0);
  const [a4, setA4] = useState(440);
  const [lockMode, setLockMode] = useState<"auto" | "locked">("auto");
  const [lockedString, setLockedString] = useState(0);
  const [showTuning, setShowTuning] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [a4Typing, setA4Typing] = useState(false);
  const [a4Input, setA4Input] = useState("");
  const [upgradeBanner, setUpgradeBanner] = useState<string | null>(null);

  const phoneRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const counts = STRING_COUNTS[instrument];
  const tuning = useMemo(() => {
    const presets = tunings[instrument][stringCount] ?? tunings[instrument][counts[0]];
    return presets[tuningIndex] ?? presets[0];
  }, [instrument, stringCount, tuningIndex, counts]);

  const strings = tuning.strings;

  const { running, start, stop, detectedFreq, cents, activeString, vibration, error } =
    useTunerPitch({ strings, lockedString, lockMode, a4 });

  useEffect(() => {
    setStringCount(STRING_COUNTS[instrument][0]);
    setTuningIndex(0);
    setLockedString(0);
  }, [instrument]);

  useEffect(() => {
    setTuningIndex(0);
    setLockedString(0);
  }, [stringCount]);

  useEffect(() => () => { stop(); }, [stop]);

  useEffect(() => {
    function applyScale() {
      const el = phoneRef.current;
      if (!el) return;
      const vw = window.innerWidth;
      if (vw > 450) { el.style.transform = ""; el.style.top = ""; return; }
      const vh = window.visualViewport?.height ?? window.innerHeight;
      const scale = Math.min(vw / 390, vh / 844);
      el.style.transform = `scale(${scale})`;
    }
    applyScale();
    window.addEventListener("resize", applyScale);
    window.visualViewport?.addEventListener("resize", applyScale);
    return () => {
      window.removeEventListener("resize", applyScale);
      window.visualViewport?.removeEventListener("resize", applyScale);
    };
  }, []);

  const handleInstPick = (inst: Instrument) => {
    if (!isPremium && inst !== "guitar") { setUpgradeBanner("Bass & Ukulele support"); return; }
    setInstrument(inst);
  };

  const handleStrings = (sc: string) => {
    if (!isPremium && sc !== "6") { setUpgradeBanner("7, 8 and 12-string tuning"); return; }
    setStringCount(sc);
  };

  const handleA4 = (v: number) => {
    if (!isPremium && v !== 440) { setUpgradeBanner("Custom A4 reference pitch"); return; }
    setA4(v);
  };

  function freqToNoteName(freq: number): string {
    const useFlats = tuning.strings.some((s) => s.label.includes("b"));
    const sharps = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const flats  = ["C","Db","D","Eb","E","F","Gb","G","Ab","A","Bb","B"];
    const names  = useFlats ? flats : sharps;
    const midi   = Math.round(12 * Math.log2(freq / a4) + 69);
    return names[((midi % 12) + 12) % 12];
  }

  const inTune     = detectedFreq != null && Math.abs(cents) <= 3;
  const isClose    = detectedFreq != null && !inTune && Math.abs(cents) <= 8;
  const isOut      = detectedFreq != null && !inTune && !isClose;
  const activeNote = detectedFreq != null ? formatNote(freqToNoteName(detectedFreq)) : "—";
  const litFlat    = (detectedFreq != null && cents < 0) ? Math.min(12, Math.round(-cents * 12 / 50)) : 0;
  const litSharp   = (detectedFreq != null && cents > 0) ? Math.min(12, Math.round( cents * 12 / 50)) : 0;
  const n          = tuning.strings.length;

  return (
    /* bleed past the layout's p-4 padding so the dark bg fills edge-to-edge */
    <div style={{ margin: "-16px -16px -16px -16px" }}>
      <div className="tuner-root">
        <img className="tuner-space-bg tuner-space-bg--mobile" src={A + "png/space_background.png"} alt="" />
        <div className="tuner-phone" ref={phoneRef}>
          <main className="tuner-screen">
            <img className="tuner-space-bg tuner-space-bg--desktop" src={A + "png/space_background.png"} alt="" />
            <div className="tuner-dynamic-island" />

            {/* Inline upgrade banner (replaces modal) */}
            {upgradeBanner && (
              <div style={{
                position: "absolute", top: 52, left: 8, right: 8, zIndex: 100,
                padding: "10px 14px", borderRadius: 12,
                background: "rgba(80,0,180,0.92)", border: "1px solid rgba(185,66,255,0.6)",
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
              }}>
                <span style={{ fontSize: 12, color: "#c084fc", lineHeight: 1.3 }}>
                  {upgradeBanner} — premium
                </span>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                  <Link href="/pricing" style={{
                    fontSize: 11, fontWeight: 800, color: "#fff",
                    background: "#b942ff", padding: "4px 10px", borderRadius: 6,
                    textDecoration: "none", letterSpacing: 1,
                  }}>
                    UPGRADE
                  </Link>
                  <button onClick={() => setUpgradeBanner(null)} style={{
                    background: "none", border: "none", color: "#c084fc",
                    cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 0,
                  }}>×</button>
                </div>
              </div>
            )}

            <header className="tuner-header">
              <img src={A + "branding/AGS_logo_nobg.png"} alt="Alien Guitar Secrets" style={{ height: 36, width: "auto" }} />
            </header>

            <section className="tuner-instrument-select">
              <img className="tuner-bar-bg" src={A + "png/dropdown_bar.png"} alt="" />
              <img className="tuner-inst-icon" src={A + "svg/instrument_guitar_icon.svg"} alt="" />
              <select value={instrument} onChange={(e) => handleInstPick(e.target.value as Instrument)}>
                <option value="guitar">Electric Guitar</option>
                <option value="bass">Bass</option>
                <option value="uke">Ukulele</option>
              </select>
              <select value={stringCount} onChange={(e) => handleStrings(e.target.value)}>
                {counts.map((c) => <option key={c} value={c}>{c} String</option>)}
              </select>
            </section>

            <section className="tuner-readout">
              <button className="tuner-icon-btn" onClick={() => { setShowTuning(true); setShowSettings(false); }}>
                <img src={A + "svg/hamburger_icon.svg"} alt="Tunings" />
              </button>
              <div className="tuner-readout-centre">
                <div className="tuner-detected">{tuning.label}</div>
                <div className="tuner-string-notes">
                  {tuning.strings.map((s) => formatNote(s.label)).join(" · ")}
                </div>
              </div>
              <button className="tuner-icon-btn" onClick={() => { setShowSettings(true); setShowTuning(false); }}>
                <img src={A + "svg/settings_icon.svg"} alt="Settings" />
              </button>
            </section>

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

            <section className="tuner-fretboard">
              <img className="tuner-wood" src={A + "png/fretboard_with_nut.png"} alt="" />
              <img className="tuner-glow" src={A + "png/fretboard_cosmic_glow_overlay.png"} alt="" />

              <svg className="tuner-strings-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
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

              <div className="tuner-play-prompt">Tune Up</div>

              <div className="tuner-note-row">
                {tuning.strings.map((s, i) => {
                  const active = i === activeString;
                  return (
                    <button
                      key={i}
                      className={`tuner-note-btn${active ? " active" : ""}${i === lockedString && lockMode === "locked" ? " locked" : ""}`}
                      style={{ left: `${strX(i, n, false)}%` }}
                      onClick={() => { setLockedString(i); setLockMode("locked"); }}
                    >
                      <b>{formatNote(s.label)}</b>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="tuner-bottom">
              {error && <div className="tuner-mic-error">Microphone unavailable — check browser permissions</div>}
              <div className="tuner-core-wrap">
                <button
                  className={`tuner-core${inTune ? " balanced" : isClose ? " close" : isOut ? " out" : ""}`}
                  onClick={() => { if (running) stop(); else void start(); }}
                  aria-label={running ? "Stop tuner" : "Start tuner"}
                >
                  <img className="tuner-core-bg"   src={A + "svg/galactic_core.svg"} alt="" />
                  <img className="tuner-core-logo" src={A + "branding/AGS_COA.svg"}  alt="" />
                </button>
                <span className="tuner-core-label">
                  {running ? (inTune ? "IN TUNE" : "LISTENING") : "TAP TO TUNE"}
                </span>
              </div>
            </div>

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
                        onClick={() => {
                          if (!isPremium && i > 0) { setUpgradeBanner("Alternate tunings"); return; }
                          setTuningIndex(i); setShowTuning(false);
                        }}
                      >
                        <span className="tuner-sheet-label">{t.label}</span>
                        <span className="tuner-sheet-notes">{t.strings.map((s) => formatNote(s.label)).join(" · ")}</span>
                      </button>
                    ))}
                  </div>
                  <button className="tuner-sheet-close" onClick={() => setShowTuning(false)}>CLOSE</button>
                </div>
              </div>
            )}

            {showSettings && (
              <div className="tuner-overlay" onClick={() => setShowSettings(false)}>
                <div className="tuner-sheet" onClick={(e) => e.stopPropagation()}>
                  <div className="tuner-sheet-handle" />
                  <div className="tuner-sheet-title">SETTINGS</div>
                  <div className="tuner-settings-row">
                    <span className="tuner-settings-label">A4 REFERENCE</span>
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
                            if (v >= A4_MIN && v <= A4_MAX) handleA4(v);
                            setA4Typing(false);
                          }
                          if (e.key === "Escape") setA4Typing(false);
                        }}
                        onBlur={() => {
                          const v = Math.round(Number(a4Input));
                          if (v >= A4_MIN && v <= A4_MAX) handleA4(v);
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

            <div className="tuner-home-bar" />
          </main>
        </div>
      </div>
    </div>
  );
}
