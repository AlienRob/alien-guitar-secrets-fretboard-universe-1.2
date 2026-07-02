import { chordRootFlags, chordDegrees, chordNotes, type ChordPosition } from "@/lib/chordDiagrams";

interface Props {
  position: ChordPosition;
  /** Spelled chord root, used to highlight the root notes on the diagram. */
  root: string;
  /** Optional chord name shown as a heading above the diagram. */
  name?: string;
  /** Optional caption shown under the diagram (e.g. the chord name). */
  caption?: string;
  /** When true, label each sounding string with its role (R, 3, 5, b7 ...). */
  showDegrees?: boolean;
  /** When true, print each sounding string's note name (C, E, G ...) on its dot. */
  showNotes?: boolean;
  width?: number;
  className?: string;
}

const INK = "#1f2937";
const GOLD = "#C99700";
const PAPER = "#FAF7EF";

export default function ChordDiagram({
  position,
  root,
  name,
  caption,
  showDegrees = false,
  showNotes = false,
  width = 132,
  className,
}: Props) {
  const { frets, fingers, baseFret, barres } = position;

  const fretted = frets.filter((v) => v > 0);
  const maxV = fretted.length ? Math.max(...fretted) : 1;
  const FRETS = Math.max(4, maxV);
  const STRING_COUNT = 6;

  const padX = 16;
  const padTop = 24;
  const padBottom = 6;
  const degreeBand = showDegrees ? 16 : 0;
  const gridW = width - padX * 2;
  const colGap = gridW / (STRING_COUNT - 1);
  const rowGap = 16;
  const gridH = rowGap * FRETS;
  const height = padTop + gridH + padBottom + degreeBand;

  const xOf = (i: number) => padX + i * colGap;
  const yOfLine = (r: number) => padTop + r * rowGap;
  const dotY = (v: number) => padTop + (v - 0.5) * rowGap;

  const rootFlags = chordRootFlags(position, root);
  const degrees = showDegrees ? chordDegrees(position, root) : [];
  const notes = showNotes ? chordNotes(position, root) : [];
  const dotR = showNotes ? 8.5 : 6;
  const dotFont = showNotes ? 8 : 9;

  const barSpans = barres.map((bv) => {
    const idxs = frets
      .map((v, i) => (v === bv ? i : -1))
      .filter((i) => i >= 0);
    return { v: bv, from: Math.min(...idxs), to: Math.max(...idxs) };
  });
  const barredValues = new Set(barres);

  return (
    <div className={`inline-flex flex-col items-center ${className ?? ""}`}>
      {name && (
        <span className="mb-1 text-sm font-semibold text-amber-100">{name}</span>
      )}
      <div className="rounded-lg p-2" style={{ background: PAPER }}>
        <svg width={width} height={height} role="img" aria-label={caption ?? "Chord diagram"}>
          {Array.from({ length: FRETS + 1 }).map((_, r) => (
            <line
              key={`fret-${r}`}
              x1={padX}
              y1={yOfLine(r)}
              x2={width - padX}
              y2={yOfLine(r)}
              stroke={INK}
              strokeWidth={r === 0 && baseFret === 1 ? 3 : 1}
            />
          ))}
          {Array.from({ length: STRING_COUNT }).map((_, i) => (
            <line
              key={`string-${i}`}
              x1={xOf(i)}
              y1={padTop}
              x2={xOf(i)}
              y2={padTop + gridH}
              stroke={INK}
              strokeWidth={1}
            />
          ))}
          {baseFret > 1 && (
            <text
              x={padX - 5}
              y={dotY(1)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="10"
              fontFamily="monospace"
              fill={INK}
            >
              {baseFret}fr
            </text>
          )}
          {frets.map((v, i) =>
            v > 0 ? null : (
              <text
                key={`mark-${i}`}
                x={xOf(i)}
                y={padTop - 9}
                textAnchor="middle"
                fontSize="11"
                fontFamily="monospace"
                fontWeight={v === 0 && rootFlags[i] ? "bold" : undefined}
                fill={v === 0 && rootFlags[i] ? GOLD : INK}
              >
                {v === 0 ? (showNotes ? notes[i] : "O") : "×"}
              </text>
            ),
          )}
          {barSpans.map((b, k) => (
            <rect
              key={`barre-${k}`}
              x={xOf(b.from) - 5}
              y={dotY(b.v) - 6}
              width={xOf(b.to) - xOf(b.from) + 10}
              height={12}
              rx={6}
              fill={INK}
            />
          ))}
          {frets.map((v, i) => {
            if (v <= 0) return null;
            const isRoot = rootFlags[i];
            const isBarred = barredValues.has(v);
            // The dot prints its note name when showNotes is on, otherwise the
            // fingering number (only for plain, non-barred fretted strings).
            const label = showNotes ? notes[i] : fingers[i] > 0 && !isBarred ? String(fingers[i]) : null;
            // Non-root barred strings are already covered by the barre bar; only
            // draw a dot for them when they are a root, to mark it gold. With
            // showNotes we still print the note name on top of the barre bar.
            if (isBarred && !isRoot) {
              return showNotes && label != null ? (
                <text
                  key={`barnote-${i}`}
                  x={xOf(i)}
                  y={dotY(v)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={dotFont}
                  fontFamily="monospace"
                  fill={PAPER}
                >
                  {label}
                </text>
              ) : null;
            }
            return (
              <g key={`dot-${i}`}>
                <circle cx={xOf(i)} cy={dotY(v)} r={dotR} fill={isRoot ? GOLD : INK} />
                {label != null && (
                  <text
                    x={xOf(i)}
                    y={dotY(v)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={dotFont}
                    fontFamily="monospace"
                    fill={PAPER}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          {showDegrees &&
            degrees.map((d, i) =>
              d == null ? null : (
                <text
                  key={`deg-${i}`}
                  x={xOf(i)}
                  y={padTop + gridH + 11}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="9"
                  fontFamily="monospace"
                  fontWeight={d === "R" ? "bold" : undefined}
                  fill={d === "R" ? GOLD : INK}
                >
                  {d}
                </text>
              ),
            )}
        </svg>
      </div>
      {caption && (
        <span className="mt-1 text-xs font-medium text-amber-100/80">{caption}</span>
      )}
    </div>
  );
}
