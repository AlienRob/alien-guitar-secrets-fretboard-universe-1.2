import { GuitarShape, GuitarFinish, PickupConfig } from "@/data/guitars";
import { Handed } from "@/lib/playerCustomization";

// Procedurally-drawn guitars — no image assets. Each guitar is a body shape +
// finish + two colours, with hardware (pickups, controls, headstock) chosen to
// match the real instrument it is inspired by. Shapes are detailed, recognisable
// silhouettes of the iconic instruments (double-cutaway, single-cut, V, explorer,
// superstrat, modern). Famous finishes (EVH stripes, bullseye, polka dot, floral,
// sunburst, relic) are layered on top. No trademarked logos are reproduced.
//
// Guitars are drawn RIGHT-handed by default (tuners on the bass/left side,
// controls on the lower-treble/right side). Passing handed="left" mirrors the
// whole instrument horizontally.

interface GuitarArtProps {
  shape: GuitarShape;
  finish: GuitarFinish;
  body: string;
  accent: string;
  className?: string;
  handed?: Handed;
  // Optional hardware overrides for accurate signature recreations.
  pickups?: PickupConfig;
  pickguard?: boolean;
  controls?: number;
  maple?: boolean;
  strings?: number;
}

// All geometry lives in a 120 x 380 viewBox, guitar vertical, headstock at top.
const BODY_PATHS: Record<GuitarShape, string> = {
  strat:
    "M28 184 C23 188.8 17.7 217 17 230 C16.3 243 24.3 250.3 24 262 C23.7 273.7 12.3 287 15 300 C17.7 313 32.5 332.2 40 340 C47.5 347.8 53.3 347 60 347 C66.7 347 72.5 347.8 80 340 C87.5 332.2 102.3 313 105 300 C107.7 287 96.3 273.7 96 262 C95.7 250.3 104.3 242.3 103 230 C101.7 217.7 93 192 88 188 C83 184 77.7 203.7 73 206 C68.3 208.3 64.3 202.8 60 202 C55.7 201.2 52.3 204 47 201 C41.7 198 33 179.2 28 184 Z",
  superstrat:
    "M25 176 C19.7 181.3 14.3 217 14 232 C13.7 247 23.2 254.3 23 266 C22.8 277.7 10.2 289.3 13 302 C15.8 314.7 32.2 334.3 40 342 C47.8 349.7 53.3 348 60 348 C66.7 348 72.2 349.7 80 342 C87.8 334.3 104.2 314.7 107 302 C109.8 289.3 97.2 277.7 97 266 C96.8 254.3 106.8 246 106 232 C105.2 218 97.7 186.3 92 182 C86.3 177.7 77.3 202.5 72 206 C66.7 209.5 64.3 204 60 203 C55.7 202 51.8 204.5 46 200 C40.2 195.5 30.3 170.7 25 176 Z",
  lespaul:
    "M33 200 C28 205 22.2 221.7 20 232 C17.8 242.3 18.8 250.7 20 262 C21.2 273.3 22.3 287.3 27 300 C31.7 312.7 42.3 330.5 48 338 C53.7 345.5 56.7 345 61 345 C65.3 345 67 345.5 74 338 C81 330.5 98.2 312.7 103 300 C107.8 287.3 104.8 273.7 103 262 C101.2 250.3 93.5 240.3 92 230 C90.5 219.7 97 204.2 94 200 C91 195.8 79.7 204 74 205 C68.3 206 64 206.5 60 206 C56 205.5 54.5 203 50 202 C45.5 201 38 195 33 200 Z",
  flyingv:
    "M52 200 L18 338 L42 346 L60 286 L78 346 L102 338 L68 200 Z",
  explorer:
    "M50 198 L43 240 L18 262 L18 302 L57 302 L57 250 L93 346 L106 339 L58 198 Z",
  majesty:
    "M27 182 C21.8 187 16.5 218.3 16 232 C15.5 245.7 24 252.7 24 264 C24 275.3 14.3 289 16 300 C17.7 311 26.7 321.5 34 330 C41.3 338.5 51.3 351 60 351 C68.7 351 78.7 338.5 86 330 C93.3 321.5 102.3 311 104 300 C105.7 289 96 275.3 96 264 C96 252.7 105 245 104 232 C103 219 95.3 190.3 90 186 C84.7 181.7 77 203.2 72 206 C67 208.8 64.2 203.7 60 203 C55.8 202.3 52.5 205.5 47 202 C41.5 198.5 32.2 177 27 182 Z",
  // Iceman: angular single-cut with a hooked lower-treble bout.
  iceman:
    "M60 196 C50 192 39 193 32 199 C25 205 25 219 31 229 C20 242 16 270 25 300 L34 344 L66 322 C84 312 99 290 101 264 C103 240 98 224 90 224 C97 212 94 199 85 196 C77 193 68 193 60 196 Z",
  // Axe bass: a battle-axe blade body.
  axebass:
    "M58 198 L52 250 C36 250 16 260 14 286 L42 300 C26 306 24 330 42 332 C70 330 100 312 106 280 C111 256 96 240 76 246 L70 198 Z",
};

const HEADSTOCK: Record<GuitarShape, "inline" | "open"> = {
  strat: "inline",
  superstrat: "inline",
  majesty: "inline",
  lespaul: "open",
  flyingv: "open",
  explorer: "open",
  iceman: "open",
  axebass: "inline",
};

const DEFAULT_PICKUPS: Record<GuitarShape, PickupConfig> = {
  strat: "sss",
  superstrat: "hsh",
  majesty: "hh",
  lespaul: "hh",
  flyingv: "hh",
  explorer: "hh",
  iceman: "hh",
  axebass: "hh",
};

const STRING_X = [54, 56.4, 58.8, 61.2, 63.6, 66];

// Even string positions across the neck for any string count (basses use 4).
function stringPositions(count: number): number[] {
  if (count === 6) return STRING_X;
  if (count <= 1) return [60];
  return Array.from({ length: count }, (_, i) => 54 + (12 * i) / (count - 1));
}

export default function GuitarArt({
  shape,
  finish,
  body,
  accent,
  className,
  handed = "right",
  pickups: pickupsProp,
  pickguard: pickguardProp,
  controls: controlsProp,
  maple,
  strings: stringsProp,
}: GuitarArtProps) {
  const bodyPath = BODY_PATHS[shape];
  const headstock = HEADSTOCK[shape];
  const pickups = pickupsProp ?? DEFAULT_PICKUPS[shape];
  const showPickguard = pickguardProp ?? pickups === "sss";
  const knobCount = controlsProp ?? (pickups === "h" ? 1 : pickups === "sss" ? 3 : 2);
  const stringCount = stringsProp ?? 6;
  const strX = stringPositions(stringCount);
  const fbColor = maple ? "#e3bd7d" : "#3a2a1c";
  const inlayColor = maple ? "#1f2937" : "#e5e7eb";
  const tremolo = pickups === "sss";
  const uid = `g-${shape}-${finish}-${body}-${accent}-${pickups}`.replace(/[^a-zA-Z0-9]/g, "");
  const clipId = `clip-${uid}`;

  const bodyFill =
    finish === "sunburst"
      ? `url(#sb-${uid})`
      : finish === "chrome"
        ? `url(#cr-${uid})`
        : finish === "alien"
          ? `url(#al-${uid})`
          : finish === "mirror"
            ? `url(#mr-${uid})`
            : body;

  // Humbucker = wide black soapbar with two pole rows; single = thin coil.
  const humbucker = (cy: number) => (
    <g>
      <rect x="44" y={cy - 7} width="32" height="14" rx="2.5" fill="#111" stroke="#000" />
      <rect x="46" y={cy - 6} width="13" height="12" rx="1.5" fill="#1c1c1c" />
      <rect x="61" y={cy - 6} width="13" height="12" rx="1.5" fill="#1c1c1c" />
      {[48, 51.5, 55, 58.5].map((x) => (
        <circle key={`a${x}`} cx={x} cy={cy} r="0.9" fill="#cbd5e1" />
      ))}
      {[62.5, 66, 69.5, 73].map((x) => (
        <circle key={`b${x}`} cx={x} cy={cy} r="0.9" fill="#cbd5e1" />
      ))}
    </g>
  );

  const singleCoil = (cy: number) => (
    <g>
      <rect x="49" y={cy - 8} width="22" height="16" rx="3" fill="#1b1b1b" stroke="#000" />
      {STRING_X.map((x) => (
        <circle key={x} cx={x} cy={cy} r="0.9" fill="#d1d5db" />
      ))}
    </g>
  );

  const knobPositions = [
    { x: 80, y: 306 },
    { x: 84, y: 316 },
    { x: 74, y: 316 },
  ];

  return (
    <svg viewBox="0 0 120 380" className={className} role="img" aria-hidden="true">
      <defs>
        <clipPath id={clipId}>
          <path d={bodyPath} />
        </clipPath>
        <linearGradient id={`gloss-${uid}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <stop offset="42%" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="60%" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`wood-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#caa472" />
          <stop offset="100%" stopColor="#a07b4d" />
        </linearGradient>
        {/* contour shading: lit upper-left shoulder fading to darkened edges,
            giving the flat body a rounded, carved-and-lacquered look */}
        <radialGradient id={`shade-${uid}`} cx="42%" cy="32%" r="80%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.26" />
          <stop offset="42%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="78%" stopColor="#000000" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.45" />
        </radialGradient>
        {finish === "sunburst" && (
          <radialGradient id={`sb-${uid}`} cx="50%" cy="68%" r="62%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="55%" stopColor={body} />
            <stop offset="100%" stopColor="#160a04" />
          </radialGradient>
        )}
        {finish === "chrome" && (
          <linearGradient id={`cr-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="45%" stopColor={body} />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        )}
        {finish === "alien" && (
          <linearGradient id={`al-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={body} />
            <stop offset="100%" stopColor={accent} />
          </linearGradient>
        )}
        {finish === "mirror" && (
          <linearGradient id={`mr-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#cbd5e1" />
            <stop offset="52%" stopColor="#7c8aa0" />
            <stop offset="74%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        )}
      </defs>

      <g transform={handed === "left" ? "translate(120,0) scale(-1,1)" : undefined}>
        {/* ---- Headstock ---- */}
        {headstock === "inline" ? (
          <>
            {/* right-handed Fender-style headstock: leans up-left, six tuners
                down the bass (left) side */}
            <path
              d="M68 54 L66 13 Q66 7 59 7 L43 9 Q37 10 37 16 L37 49 Q37 53 43 53 L52 54 Z"
              fill="#241a12"
              stroke="#000"
              strokeOpacity="0.4"
            />
            {Array.from({ length: stringCount }, (_, i) => 14 + (35 * i) / Math.max(1, stringCount - 1)).map((y) => (
              <g key={y}>
                <circle cx="42" cy={y} r="2.3" fill={accent} stroke="#000" strokeOpacity="0.3" />
                <rect x="44" y={y - 0.7} width="4" height="1.4" fill="#9ca3af" />
              </g>
            ))}
          </>
        ) : (
          <>
            <path
              d="M48 12 C48 8 52 7 56 8 L64 8 C68 7 72 8 72 12 L70 52 L50 52 Z"
              fill="#241a12"
              stroke="#000"
              strokeOpacity="0.4"
            />
            {[16, 24, 32].map((y) => (
              <g key={y}>
                <circle cx="45" cy={y} r="2.2" fill={accent} stroke="#000" strokeOpacity="0.3" />
                <circle cx="75" cy={y} r="2.2" fill={accent} stroke="#000" strokeOpacity="0.3" />
              </g>
            ))}
          </>
        )}
        {/* nut */}
        <rect x="51" y="52" width="18" height="3" rx="1" fill="#e8e2d2" />

        {/* ---- Neck + fretboard ---- */}
        <rect x="52" y="54" width="16" height="148" fill={`url(#wood-${uid})`} />
        <rect x="52.5" y="54" width="15" height="148" fill={fbColor} />
        {/* frets */}
        {Array.from({ length: 11 }).map((_, i) => {
          const y = 66 + i * 12.5;
          return <rect key={i} x="52.5" y={y} width="15" height="1" fill="#d4d4d8" />;
        })}
        {/* inlays */}
        {[78, 103, 128, 153].map((y) => (
          <circle key={y} cx="60" cy={y} r="1.8" fill={inlayColor} opacity="0.85" />
        ))}
        <circle cx="56" cy="190" r="1.8" fill={inlayColor} opacity="0.85" />
        <circle cx="64" cy="190" r="1.8" fill={inlayColor} opacity="0.85" />

        {/* ---- Body base ---- */}
        <path d={bodyPath} fill={bodyFill} stroke="#000" strokeOpacity="0.4" strokeWidth="1.5" />

        {/* ---- Finish overlays (clipped) ---- */}
        <g clipPath={`url(#${clipId})`}>
          {finish === "stripes" && (
            <>
              {/* red base, then irregular white and black criss-cross stripes */}
              <path
                d="M-6 358 L72 168 M16 360 L94 166 M40 362 L116 178"
                stroke="#ffffff"
                strokeWidth="9"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M120 356 L42 168 M98 362 L22 172 M70 366 L-6 198"
                stroke="#000000"
                strokeWidth="6"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M8 300 L62 360 M82 298 L112 352"
                stroke="#ffffff"
                strokeWidth="5"
                strokeLinecap="round"
                fill="none"
              />
            </>
          )}
          {finish === "bullseye" &&
            [44, 36, 28, 20, 12, 5].map((r, i) => (
              <circle
                key={r}
                cx="60"
                cy="270"
                r={r}
                fill="none"
                stroke={i % 2 === 0 ? accent : body}
                strokeWidth="7"
              />
            ))}
          {finish === "polkadot" &&
            Array.from({ length: 30 }).map((_, i) => {
              const x = 16 + ((i * 37) % 88);
              const y = 200 + ((i * 53) % 150);
              return <circle key={i} cx={x} cy={y} r="3.4" fill={accent} />;
            })}
          {finish === "floral" &&
            Array.from({ length: 12 }).map((_, i) => {
              const x = 22 + ((i * 41) % 76);
              const y = 206 + ((i * 47) % 140);
              return (
                <g key={i} transform={`translate(${x} ${y})`}>
                  {[0, 72, 144, 216, 288].map((a) => (
                    <ellipse key={a} cx="0" cy="-5" rx="2.4" ry="5" fill={accent} transform={`rotate(${a})`} />
                  ))}
                  <circle cx="0" cy="0" r="2" fill="#fde047" />
                </g>
              );
            })}
          {finish === "relic" &&
            Array.from({ length: 14 }).map((_, i) => {
              const x = 18 + ((i * 29) % 84);
              const y = 205 + ((i * 41) % 140);
              return <circle key={i} cx={x} cy={y} r={1 + (i % 3)} fill="#000" opacity="0.22" />;
            })}
          {finish === "alien" && (
            <>
              <path d="M22 250 Q60 224 98 252" stroke={accent} strokeWidth="2.5" fill="none" opacity="0.7" />
              <path d="M22 286 Q60 312 98 288" stroke="#fff" strokeWidth="1.5" fill="none" opacity="0.5" />
              {Array.from({ length: 16 }).map((_, i) => (
                <circle key={i} cx={24 + ((i * 31) % 72)} cy={212 + ((i * 37) % 140)} r="1.5" fill="#fff" opacity="0.8" />
              ))}
            </>
          )}
          {finish === "mirror" && (
            <>
              {/* shattered mirror facets: bright shards + dark crack seams */}
              <g fill="none" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="0.8">
                <path d="M38 204 L58 250 L44 300 L66 342" />
                <path d="M88 208 L64 248 L90 296 L70 340" />
                <path d="M26 256 L60 268 L98 252" />
                <path d="M30 304 L60 286 L96 308" />
                <path d="M58 250 L60 286" />
                <path d="M44 226 L78 232" />
              </g>
              <g fill="none" stroke="#1e293b" strokeOpacity="0.45" strokeWidth="0.5">
                <path d="M40 206 L60 252 L46 302 L68 344" />
                <path d="M90 210 L66 250 L92 298" />
                <path d="M28 258 L62 270 L100 254" />
              </g>
            </>
          )}
          {/* rounded body contour shading, then the vertical gloss streak */}
          <rect x="0" y="180" width="120" height="180" fill={`url(#shade-${uid})`} />
          <rect x="0" y="180" width="120" height="180" fill={`url(#gloss-${uid})`} />
        </g>

        {/* ---- Pickguard (single-coil guitars) ---- */}
        {showPickguard && (
          <path
            d="M50 232 C48 244 48 296 56 314 C66 326 78 322 80 308 L80 244 C80 234 72 230 64 230 C58 230 52 228 50 232 Z"
            fill={body === "#000000" || body === "#0a0a0a" ? "#0a0a0a" : "#f3f4f6"}
            opacity="0.92"
            stroke="#000"
            strokeOpacity="0.3"
          />
        )}

        {/* ---- Pickups ---- */}
        {pickups === "sss" && (
          <>
            {singleCoil(244)}
            {singleCoil(270)}
            {singleCoil(296)}
          </>
        )}
        {pickups === "hh" && (
          <>
            {humbucker(250)}
            {humbucker(296)}
          </>
        )}
        {pickups === "hsh" && (
          <>
            {humbucker(248)}
            {singleCoil(272)}
            {humbucker(298)}
          </>
        )}
        {pickups === "sh" && (
          <>
            {singleCoil(248)}
            {humbucker(296)}
          </>
        )}
        {pickups === "hhh" && (
          <>
            {humbucker(244)}
            {humbucker(272)}
            {humbucker(300)}
          </>
        )}
        {pickups === "h" && humbucker(294)}

        {/* ---- Strings over neck + body to bridge ---- */}
        {strX.map((x, i) => (
          <line
            key={x}
            x1={x}
            y1="54"
            x2={x}
            y2="322"
            stroke="#e5e7eb"
            strokeWidth={(stringCount === 4 ? 1.1 : 0.5) + i * (stringCount === 4 ? 0.25 : 0.12)}
            opacity="0.85"
          />
        ))}

        {/* ---- Bridge ---- */}
        {tremolo ? (
          <>
            <rect x="50" y="318" width="20" height="8" rx="1.5" fill="#9ca3af" stroke="#000" strokeOpacity="0.3" />
            <rect x="58" y="324" width="4" height="14" rx="1.5" fill="#cbd5e1" />
          </>
        ) : (
          <>
            <rect x="49" y="314" width="22" height="5" rx="1" fill="#cbd5e1" stroke="#000" strokeOpacity="0.3" />
            <rect x="50" y="322" width="20" height="6" rx="1.5" fill="#9ca3af" stroke="#000" strokeOpacity="0.3" />
          </>
        )}

        {/* ---- Controls ---- */}
        {knobPositions.slice(0, knobCount).map((k) => (
          <circle key={`${k.x}-${k.y}`} cx={k.x} cy={k.y} r="3" fill="#d1d5db" stroke="#000" strokeOpacity="0.3" />
        ))}
        <rect x="40" y="312" width="6" height="3" rx="1" fill="#1f2937" />
      </g>
    </svg>
  );
}
