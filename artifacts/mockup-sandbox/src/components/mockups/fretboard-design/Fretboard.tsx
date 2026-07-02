// Fretboard design preview — 4-layer SVG, no photo texture
// Approve this on canvas before applying to the main mobile app

const FRETS = 24;

// Neck geometry (pixels)
const NUT_W      = 160;   // string span at nut
const BODY_W     = 194;   // string span at body (~21% wider)
const NECK_INSET = 14;    // wood edge beyond outermost string (before binding)
const BINDING_W  = 5;     // gold binding strip width
const NUT_H      = 14;    // thick cream nut height
const STRING_TAIL = 20;   // how far strings extend past each end of the neck

// Layout
const LEFT_GUTTER = 32;   // space for fret numbers
const TOP_PAD     = 32;   // space above nut (strings emerge from here)
const BOT_PAD     = 52;   // space below neck (string tail + name labels)
const FRET_AREA_H = FRETS * 28;

const SVG_W    = 312;
const CENTER_X = LEFT_GUTTER + (SVG_W - LEFT_GUTTER) / 2; // ~172

const WOOD_TOP    = TOP_PAD;
const FIRST_FRET_Y = WOOD_TOP + NUT_H;
const WOOD_BOTTOM  = FIRST_FRET_Y + FRET_AREA_H;
const SVG_H        = WOOD_BOTTOM + BOT_PAD;

// String start/end — extend STRING_TAIL past each neck end
const STRING_TOP = WOOD_TOP - STRING_TAIL;
const STRING_BOT = WOOD_BOTTOM + STRING_TAIL;

// Fret Y positions — evenly distributed
const fretY  = (f: number) => FIRST_FRET_Y + (f / FRETS) * FRET_AREA_H;
const fretCY = (f: number) =>
  f === 0 ? WOOD_TOP - 10 : (fretY(f - 1) + fretY(f)) / 2;

// Taper helpers: t=0 at wood top, t=1 at wood bottom
const woodT   = (y: number) => (y - WOOD_TOP) / (WOOD_BOTTOM - WOOD_TOP);
const spanAt  = (t: number) => NUT_W + (BODY_W - NUT_W) * t;
const neckL   = (t: number) => CENTER_X - spanAt(t) / 2 - NECK_INSET;
const neckR   = (t: number) => CENTER_X + spanAt(t) / 2 + NECK_INSET;
const stringX = (col: number, t: number) => {
  const half = spanAt(t) / 2;
  return CENTER_X - half + col * (spanAt(t) / 5);
};

// SVG paths
const trapPath  = `M ${neckL(0)} ${WOOD_TOP} L ${neckR(0)} ${WOOD_TOP} L ${neckR(1)} ${WOOD_BOTTOM} L ${neckL(1)} ${WOOD_BOTTOM} Z`;
const leftBind  = `M ${neckL(0)} ${WOOD_TOP} L ${neckL(0) + BINDING_W} ${WOOD_TOP} L ${neckL(1) + BINDING_W} ${WOOD_BOTTOM} L ${neckL(1)} ${WOOD_BOTTOM} Z`;
const rightBind = `M ${neckR(0) - BINDING_W} ${WOOD_TOP} L ${neckR(0)} ${WOOD_TOP} L ${neckR(1)} ${WOOD_BOTTOM} L ${neckR(1) - BINDING_W} ${WOOD_BOTTOM} Z`;

// Inlay sets
const SINGLE_INLAYS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_INLAYS = [12, 24];

// String visual weights and colours (col 0 = low E … col 5 = high e)
const STRING_W   = [4.2, 3.4, 2.7, 1.8, 1.3, 0.95];
const STRING_COL = ["#c9a055", "#c8a96a", "#cbae80", "#d0d5de", "#dce0e8", "#e6eaf2"];
const IS_WOUND   = [true, true, true, false, false, false];
const STRING_NAMES = ["E", "A", "D", "G", "B", "e"];

export function Fretboard() {
  const grainLines = Array.from({ length: 20 }, (_, i) => {
    const t  = (i + 0.5) / 20;
    const y  = WOOD_TOP + t * (WOOD_BOTTOM - WOOD_TOP);
    const lx = neckL(t) + BINDING_W + 1;
    const rx = neckR(t) - BINDING_W - 1;
    const op = 0.035 + (i % 5 === 0 ? 0.045 : 0) + (i % 3 === 0 ? 0.02 : 0);
    return { y, lx, rx, op };
  });

  return (
    <div style={{
      background: "#080614",
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
    }}>
      <svg width={SVG_W} height={SVG_H} xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
        <defs>
          <clipPath id="neckClip">
            <path d={trapPath} />
          </clipPath>
          <linearGradient id="ebonyBase" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1c0f08" />
            <stop offset="25%"  stopColor="#0f0805" />
            <stop offset="100%" stopColor="#050302" />
          </linearGradient>
          <linearGradient id="ebonySheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#000000" stopOpacity="0.62" />
            <stop offset="22%"  stopColor="#2a1508" stopOpacity="0.08" />
            <stop offset="50%"  stopColor="#3d1e0a" stopOpacity="0.00" />
            <stop offset="78%"  stopColor="#2a1508" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id="goldBind" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#7a4e0e" />
            <stop offset="45%"  stopColor="#d4a020" />
            <stop offset="60%"  stopColor="#edd040" />
            <stop offset="100%" stopColor="#7a4e0e" />
          </linearGradient>
        </defs>

        {/* ═══ LAYER 1 — Wood ═══ */}
        <g clipPath="url(#neckClip)">
          <path d={trapPath} fill="url(#ebonyBase)" />
          <path d={trapPath} fill="url(#ebonySheen)" />
          {grainLines.map((g, i) => (
            <line key={i} x1={g.lx} y1={g.y} x2={g.rx} y2={g.y}
              stroke="#4a2510" strokeWidth="1" opacity={g.op} />
          ))}
        </g>
        <path d={trapPath} fill="none" stroke="#030200" strokeWidth="2" />

        {/* Gold binding */}
        <path d={leftBind}  fill="url(#goldBind)" opacity={0.90} />
        <path d={rightBind} fill="url(#goldBind)" opacity={0.90} />
        <path d={leftBind}  fill="none" stroke="#f5dd70" strokeWidth="0.5" opacity={0.45} />
        <path d={rightBind} fill="none" stroke="#f5dd70" strokeWidth="0.5" opacity={0.45} />

        {/* Thick cream nut */}
        <rect
          x={neckL(0) + BINDING_W} y={WOOD_TOP}
          width={neckR(0) - neckL(0) - BINDING_W * 2} height={NUT_H}
          fill="#ede6d2" rx={1.5}
        />
        <line x1={neckL(0) + BINDING_W + 3} y1={WOOD_TOP + 1.5}
              x2={neckR(0) - BINDING_W - 3} y2={WOOD_TOP + 1.5}
              stroke="#ffffff" strokeWidth="1.5" opacity={0.38} />
        <line x1={neckL(0) + BINDING_W + 2} y1={WOOD_TOP + NUT_H - 1}
              x2={neckR(0) - BINDING_W - 2} y2={WOOD_TOP + NUT_H - 1}
              stroke="#000000" strokeWidth="1.5" opacity={0.30} />

        {/* ═══ LAYER 4 — Inlay dots (under frets) ═══ */}
        {SINGLE_INLAYS.filter(f => f <= FRETS).map(f => (
          <circle key={f} cx={CENTER_X} cy={fretCY(f)} r={6} fill="#ebebeb" opacity={0.88} />
        ))}
        {DOUBLE_INLAYS.filter(f => f <= FRETS).map(f => {
          const cy  = fretCY(f);
          const t   = woodT(cy);
          const off = spanAt(t) * 0.22;
          return (
            <g key={f}>
              <circle cx={CENTER_X - off} cy={cy} r={6} fill="#ebebeb" opacity={0.88} />
              <circle cx={CENTER_X + off} cy={cy} r={6} fill="#ebebeb" opacity={0.88} />
            </g>
          );
        })}

        {/* ═══ LAYER 2 — Fret wires ═══ */}
        {Array.from({ length: FRETS }, (_, i) => {
          const f  = i + 1;
          const y  = fretY(f);
          const t  = woodT(y);
          const lx = neckL(t) + BINDING_W;
          const rx = neckR(t) - BINDING_W;
          return (
            <g key={f}>
              <line x1={lx} y1={y + 1.8} x2={rx} y2={y + 1.8}
                stroke="#5a3608" strokeWidth="3.2" opacity={0.65} />
              <line x1={lx} y1={y} x2={rx} y2={y}
                stroke="#c89030" strokeWidth="2.6" />
              <line x1={lx} y1={y - 0.7} x2={rx} y2={y - 0.7}
                stroke="#f5eabc" strokeWidth="0.8" opacity={0.42} />
            </g>
          );
        })}

        {/* ═══ LAYER 3 — Strings (through both ends) ═══ */}
        {[0, 1, 2, 3, 4, 5].map(col => {
          const xTop = stringX(col, 0);
          const xBot = stringX(col, 1);
          const w    = STRING_W[col];
          const c    = STRING_COL[col];
          const wound = IS_WOUND[col];
          return (
            <g key={col}>
              {/* Shadow */}
              <line x1={xTop + w * 0.35} y1={STRING_TOP} x2={xBot + w * 0.35} y2={STRING_BOT}
                stroke="#000000" strokeWidth={w * 0.75} opacity={0.38} />
              {/* Core */}
              <line x1={xTop} y1={STRING_TOP} x2={xBot} y2={STRING_BOT}
                stroke={c} strokeWidth={w} opacity={0.92} />
              {/* Wound winding ticks */}
              {wound && Array.from({ length: Math.floor(FRET_AREA_H / 5) }, (_, k) => {
                const py = FIRST_FRET_Y + k * 5;
                const tx = woodT(py);
                const px = stringX(col, tx);
                return (
                  <line key={k} x1={px - w * 0.48} y1={py} x2={px + w * 0.48} y2={py}
                    stroke="#8a6020" strokeWidth="0.55" opacity={0.22} />
                );
              })}
              {/* Highlight */}
              <line x1={xTop - w * 0.28} y1={STRING_TOP} x2={xBot - w * 0.28} y2={STRING_BOT}
                stroke="#ffffff" strokeWidth={w * 0.30} opacity={0.30} />
            </g>
          );
        })}

        {/* ═══ Fret numbers — track the left edge of the neck ═══ */}
        {Array.from({ length: FRETS }, (_, i) => {
          const f  = i + 1;
          const cy = fretCY(f);
          const t  = woodT(cy);
          const lx = neckL(t) - 6;   // just outside the binding at this fret's y
          return (
            <text key={f}
              x={lx} y={cy + 4}
              textAnchor="end"
              fontSize="10"
              fontFamily="monospace"
              fill="#8a7a60"
            >
              {f}
            </text>
          );
        })}

        {/* ═══ String name labels — below neck ═══ */}
        {STRING_NAMES.map((name, col) => {
          const xBot = stringX(col, 1);
          return (
            <text key={col}
              x={xBot} y={STRING_BOT + 16}
              textAnchor="middle"
              fontSize="11"
              fontWeight="600"
              fontFamily="sans-serif"
              fill="#b0a080"
            >
              {name}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
