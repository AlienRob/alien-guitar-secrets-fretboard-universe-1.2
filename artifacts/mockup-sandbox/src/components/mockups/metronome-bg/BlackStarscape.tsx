import { useMemo, useState } from "react";

// ── Colour themes ─────────────────────────────────────────────────────────────
// Chakra order: root → crown
const THEMES = [
  { label: "Red",       accent: "#FF2244", accentDim: "#7a0018", stripDim: "#4a000e" },
  { label: "Orange",    accent: "#FF7700", accentDim: "#7a3800", stripDim: "#4a2000" },
  { label: "Gold",      accent: "#FFB800", accentDim: "#7a5800", stripDim: "#4a3200" },
  { label: "Green",     accent: "#00E060", accentDim: "#006830", stripDim: "#003a18" },
  { label: "Cyan",      accent: "#00D4FF", accentDim: "#006a80", stripDim: "#003040" },
  { label: "Purple",    accent: "#C040FF", accentDim: "#6a1090", stripDim: "#3a0858" },
  { label: "Pink",      accent: "#FF40A0", accentDim: "#80104a", stripDim: "#500030" },
] as const;

type ThemeIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const C_SUB_LIT   = "#1E8CFF";   // sub-segment lit (blue)
const C_MUTE_STRIP = "#1a1a1a";

// Navy background colours (back to the original dark navy)
const BG_MAIN     = "#050816";
const BG_GRADIENT = "#0a1030";

// ── Beat states ───────────────────────────────────────────────────────────────
type BeatState = "accent" | "normal" | "mute";
const STATE_CYCLE: BeatState[] = ["accent", "normal", "mute"];
const nextState = (s: BeatState): BeatState =>
  STATE_CYCLE[(STATE_CYCLE.indexOf(s) + 1) % STATE_CYCLE.length];

// ── Stars ─────────────────────────────────────────────────────────────────────
function useStars(n: number) {
  return useMemo(() => {
    let s = 42;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    return Array.from({ length: n }, (_, i) => ({
      id: i, x: rand() * 100, y: rand() * 100,
      r: rand() > 0.85 ? 1.4 : rand() > 0.6 ? 0.9 : 0.5,
      op: 0.3 + rand() * 0.55,
      twinkle: rand() > 0.7,
    }));
  }, [n]);
}

// ── Beat Block ────────────────────────────────────────────────────────────────
function BeatBlock({
  beatState, segs, active = -1, onTap, accent, accentDim, stripDim,
}: {
  beatState: BeatState; segs: number; active?: number; onTap?: () => void;
  accent: string; accentDim: string; stripDim: string;
}) {
  const isMute    = beatState === "mute";
  const isAccent  = beatState === "accent";
  const isNormal  = beatState === "normal";

  const stripCol  = isMute ? C_MUTE_STRIP : isAccent ? accent : stripDim;
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
        boxShadow: isAccent && active === 0
          ? `0 0 10px ${accent}88`
          : "none",
      }}
    >
      {/* top accent strip */}
      <div style={{
        height: 11, backgroundColor: stripCol, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {isAccent && (
          <div style={{
            width: 4, height: 4, borderRadius: 2, background: "#fff", opacity: 0.85,
            boxShadow: `0 0 4px ${accent}`,
          }} />
        )}
        {isNormal && (
          <div style={{
            width: 3, height: 3, borderRadius: 1.5,
            background: accent, opacity: 0.4,
          }} />
        )}
      </div>

      {/* subdivision segments */}
      <div style={{ flex: 1, display: "flex" }}>
        {Array.from({ length: segs }).map((_, j) => {
          const isFirst = j === 0;
          const isLit   = !isMute && active === j;
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
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          alignItems: "center", justifyContent: "center",
        }}>
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

// ── Count labels ──────────────────────────────────────────────────────────────
const LABELS: Record<number, string[][]> = {
  1: [["1"],["2"],["3"],["4"]],
  2: [["1","&"],["2","&"],["3","&"],["4","&"]],
  3: [["1","&","a"],["2","&","a"],["3","&","a"],["4","&","a"]],
  4: [["1","e","&","a"],["2","e","&","a"],["3","e","&","a"],["4","e","&","a"]],
};

function CountRow({ segs, states, accent, accentDim }: {
  segs: number; states: BeatState[];
  accent: string; accentDim: string;
}) {
  const groups = LABELS[segs] ?? LABELS[1];
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
      <div style={{ width: 36, flexShrink: 0 }} />
    </div>
  );
}

// ── Jog wheel ─────────────────────────────────────────────────────────────────
function JogWheel({ glowColor, size = 160 }: { glowColor: string; size?: number }) {
  const C = size / 2;
  const R_BEZEL = C - 2, R_GRIP = R_BEZEL - 10;
  const R_WELL  = R_GRIP - Math.round(size * 0.11);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <radialGradient id="bz2" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#42426a"/>
            <stop offset="42%" stopColor="#2c2c52"/>
            <stop offset="100%" stopColor="#07070f"/>
          </radialGradient>
          <radialGradient id="gp2" cx="50%" cy="30%" r="66%">
            <stop offset="0%" stopColor="#2e2e50"/>
            <stop offset="100%" stopColor="#080814"/>
          </radialGradient>
        </defs>
        <circle cx={C} cy={C} r={R_BEZEL} fill="url(#bz2)"/>
        <circle cx={C} cy={C} r={R_BEZEL-1} fill="none" stroke="#5a5a8a" strokeWidth={1.5} opacity={0.85}/>
        <circle cx={C} cy={C} r={R_GRIP} fill="url(#gp2)"/>
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
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", pointerEvents: "none",
      }}>
        <div style={{
          width: (R_WELL-2)*2, height: (R_WELL-2)*2, borderRadius: R_WELL-2,
          border: `2.5px solid ${glowColor}`,
          boxShadow: `0 0 16px ${glowColor}`,
        }}/>
      </div>
    </div>
  );
}

// ── Full metronome panel ──────────────────────────────────────────────────────
function Panel({ themeIdx }: { themeIdx: ThemeIdx }) {
  const theme = THEMES[themeIdx];
  const stars = useStars(60);

  const [beatStates, setBeatStates] = useState<BeatState[]>(
    ["accent", "normal", "normal", "normal"]
  );
  const [segs] = useState(4);

  const activeBlock = 0, activeSeg = 0;

  const glowColor = beatStates[activeBlock] === "mute"
    ? "#222"
    : beatStates[activeBlock] === "accent"
      ? theme.accent
      : `${theme.accent}66`;

  const tap = (bi: number) =>
    setBeatStates(prev => { const n=[...prev]; n[bi]=nextState(n[bi]); return n; });

  return (
    <div style={{
      width: 402,
      background: `linear-gradient(135deg, ${BG_MAIN} 0%, ${BG_GRADIENT} 50%, ${BG_MAIN} 100%)`,
      position: "relative", overflow: "hidden",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif",
      display: "flex", flexDirection: "column",
      padding: "18px 14px 18px", gap: 10,
    }}>
      {/* stars */}
      <svg style={{ position:"absolute", inset:0, width:"100%", height:"100%", pointerEvents:"none" }}
        viewBox="0 0 100 100" preserveAspectRatio="none">
        {stars.map(s => (
          <circle key={s.id} cx={s.x} cy={s.y} r={s.r*0.22} fill="#fff" opacity={s.op}>
            {s.twinkle && (
              <animate attributeName="opacity"
                values={`${s.op};${s.op*0.3};${s.op}`}
                dur={`${2+(s.id%3)}s`} repeatCount="indefinite"/>
            )}
          </circle>
        ))}
        <ellipse cx="20" cy="15" rx="28" ry="18" fill="#0a1840" opacity="0.25"/>
        <ellipse cx="75" cy="70" rx="30" ry="20" fill="#100a30" opacity="0.20"/>
      </svg>

      <div style={{ position:"relative", zIndex:1, display:"flex", flexDirection:"column", gap:10 }}>

        {/* theme name badge */}
        <div style={{
          alignSelf: "center",
          background: `${theme.accent}22`,
          border: `1px solid ${theme.accent}55`,
          borderRadius: 20,
          padding: "3px 14px",
          fontSize: 11, fontWeight: 700, letterSpacing: 2,
          color: theme.accent,
        }}>
          {theme.label.toUpperCase()} ACCENT
        </div>

        {/* beat blocks */}
        <div>
          <div style={{ display:"flex", gap:6 }}>
            {beatStates.map((state, bi) => (
              <BeatBlock key={bi}
                beatState={state} segs={segs}
                active={bi===activeBlock ? activeSeg : -1}
                onTap={() => tap(bi)}
                accent={theme.accent}
                accentDim={theme.accentDim}
                stripDim={theme.stripDim}
              />
            ))}
            {/* global A button */}
            <div style={{
              width:36, height:62, borderRadius:8, flexShrink:0,
              background:"linear-gradient(180deg,#36365a,#1e1e38)",
              border:"1px solid #4e4e7a",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:3,
            }}>
              <div style={{
                width:6, height:6, borderRadius:3,
                backgroundColor:theme.accent,
                boxShadow:`0 0 5px ${theme.accent}`,
              }}/>
              <span style={{ fontSize:10, fontWeight:800, color:"#c8c0a0" }}>A</span>
            </div>
          </div>
          <CountRow segs={segs} states={beatStates}
            accent={theme.accent} accentDim={theme.accentDim}/>
        </div>

        {/* strip buttons */}
        <div style={{ display:"flex", gap:8 }}>
          {[
            { tag:"BEATS", val:"4/4" },
            { tag:"SUBDIV", val:"♬ 16ths" },
            { tag:"SOUND",  val:"Click", valColor:"#9060f0" },
          ].map(({ tag, val, valColor }) => (
            <div key={tag} style={{
              flex:1, height:48, borderRadius:10,
              background:"linear-gradient(180deg,#36365a,#1e1e38)",
              border:"1px solid #4e4e7a",
              display:"flex", flexDirection:"column",
              alignItems:"center", justifyContent:"center", gap:2,
            }}>
              <span style={{ fontSize:7, fontWeight:700, letterSpacing:2, color:"#8080b0" }}>{tag}</span>
              <span style={{ fontSize:14, fontWeight:700, color:valColor??"#c8c8ec" }}>{val}</span>
            </div>
          ))}
        </div>

        {/* BPM */}
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:46, fontWeight:800, color:"#e8e8fc", letterSpacing:-2, lineHeight:1 }}>120</div>
          <div style={{ fontSize:9, fontWeight:600, letterSpacing:3, color:"#484870", marginTop:2 }}>BPM</div>
        </div>
        <div style={{ fontSize:9, fontWeight:500, letterSpacing:2, color:"#50508a", textAlign:"center" }}>MODERATO</div>

        <div style={{ display:"flex", justifyContent:"center" }}>
          <JogWheel glowColor={glowColor}/>
        </div>

        <div style={{ display:"flex", gap:10 }}>
          {[
            { label:"⏸  PAUSE", active:true },
            { label:"TAP", active:false },
          ].map(({ label, active }) => (
            <div key={label} style={{
              flex:1, height:44, borderRadius:12,
              background:"linear-gradient(180deg,#42426a,#22223c)",
              border:`1px solid ${active?"#8060e0":"#5a5a88"}`,
              display:"flex", alignItems:"center", justifyContent:"center",
              boxShadow: active ? "0 0 10px #8060e0aa" : "none",
            }}>
              {active && (
                <div style={{ width:22, height:3, borderRadius:2,
                  backgroundColor:"#8060e0", boxShadow:"0 0 5px #8060e0", marginRight:6 }}/>
              )}
              <span style={{ fontSize:12, fontWeight:700, letterSpacing:1, color:"#dcdcf8" }}>{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

// ── Single panel with colour picker ──────────────────────────────────────────
export function BlackStarscape() {
  const [themeIdx, setThemeIdx] = useState<ThemeIdx>(0);
  const theme = THEMES[themeIdx];

  return (
    <div style={{ background: "#020408", display: "inline-flex", flexDirection: "column" }}>
      {/* colour picker bar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "center",
        gap: 10, padding: "10px 14px 6px",
      }}>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 2,
          color: "#50508a", fontFamily: "monospace",
        }}>COLOUR</span>
        {THEMES.map((t, i) => (
          <button
            key={i}
            onClick={() => setThemeIdx(i as ThemeIdx)}
            title={t.label}
            style={{
              width: i === themeIdx ? 22 : 16,
              height: i === themeIdx ? 22 : 16,
              borderRadius: "50%",
              backgroundColor: t.accent,
              border: i === themeIdx
                ? `2.5px solid #fff`
                : `2px solid ${t.accentDim}`,
              boxShadow: i === themeIdx
                ? `0 0 8px ${t.accent}, 0 0 16px ${t.accent}66`
                : "none",
              cursor: "pointer",
              padding: 0,
              transition: "all 0.15s ease",
            }}
          />
        ))}
      </div>
      <Panel themeIdx={themeIdx} />
    </div>
  );
}
