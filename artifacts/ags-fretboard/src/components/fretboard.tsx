import React from "react";
import { getNoteValue, getNoteName } from "@/lib/musicTheory";
import { playFretNote } from "@/lib/audio";
import fretboardPhotoSrc from "@assets/top_view_neck_1782370947897.png";

export interface NoteHighlight {
  string: number;
  fret: number;
  type: "root" | "scale" | "chord" | "correct" | "incorrect" | "degree";
  /** Correctly spelled note name; overrides the raw chromatic name when set. */
  label?: string;
  /**
   * Semitone interval (0–11) used when type === "degree" to pick a colour
   * from the 12-colour degree palette (the "Christmas tree" effect).
   */
  interval?: number;
}

export interface FretboardProps {
  frets?: number;
  startFret?: number;
  highlightNotes?: NoteHighlight[];
  onNoteClick?: (string: number, fret: number) => void;
  showNoteNames?: boolean;
  useSharps?: boolean;
  showStringLabels?: boolean;
  showFretNumbers?: boolean;
  showEmptyNoteNames?: boolean;
  playSound?: boolean;
  rosewood?: boolean;
  usePhoto?: boolean;
}

const STRING_NAMES = ["e", "B", "G", "D", "A", "E"];

const DOT_COLOR: Record<string, { fill: string; text: string }> = {
  root:      { fill: "#FF2D55", text: "#fff" },
  scale:     { fill: "#00FFD5", text: "#050816" },
  chord:     { fill: "#FFD700", text: "#050816" },
  correct:   { fill: "#00FF66", text: "#050816" },
  incorrect: { fill: "#FF3B30", text: "#fff" },
};

/**
 * One distinct neon colour per semitone interval (0 = root … 11 = maj7).
 * Passed as `interval` on a NoteHighlight with type "degree" to produce the
 * full 12-colour "Christmas tree" fretboard display.
 */
export const DEGREE_COLORS: Record<number, { fill: string; text: string }> = {
  0:  { fill: "#FF2D55", text: "#fff" },   // Root     — hot red
  1:  { fill: "#FF6B35", text: "#fff" },   // b2       — orange
  2:  { fill: "#FFB800", text: "#000" },   // 2nd      — amber
  3:  { fill: "#A8FF3E", text: "#000" },   // b3       — lime
  4:  { fill: "#00FF66", text: "#000" },   // 3rd      — green
  5:  { fill: "#00FFD5", text: "#000" },   // 4th      — cyan
  6:  { fill: "#00C8FF", text: "#000" },   // b5       — sky blue
  7:  { fill: "#4F8FFF", text: "#fff" },   // 5th      — electric blue
  8:  { fill: "#8B5CF6", text: "#fff" },   // b6       — violet
  9:  { fill: "#EC4899", text: "#fff" },   // 6th      — pink
  10: { fill: "#FF2DCF", text: "#fff" },   // b7       — magenta
  11: { fill: "#FFD700", text: "#000" },   // maj7     — gold
};

function resolveColor(h: NoteHighlight): { fill: string; text: string } {
  if (h.type === "degree" && h.interval !== undefined) {
    return DEGREE_COLORS[h.interval % 12] ?? DOT_COLOR.scale;
  }
  return DOT_COLOR[h.type] ?? DOT_COLOR.scale;
}

const SINGLE_MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
const DOUBLE_MARKERS = [12, 24];

export default function Fretboard({
  frets = 12,
  startFret = 0,
  highlightNotes = [],
  onNoteClick,
  showNoteNames = true,
  useSharps = false,
  showStringLabels = true,
  showFretNumbers = true,
  showEmptyNoteNames = false,
  playSound = true,
  rosewood = false,
  usePhoto = false,
}: FretboardProps) {
  const wood = rosewood
    ? {
        container: "bg-[#3a1208]",
        board: "#6b2510",
        nut: startFret === 0 ? "#f0e4c8" : "#7a3820",
        fret: "#c0c0c0",
        inlay: "#e8d8b0",
        strLabel: "#c8906050",
        fretLabel: "#c89060",
        strColor: "#c8c8c8",
      }
    : {
        container: "bg-[#0a1029]",
        board: "#14213d",
        nut: startFret === 0 ? "#d8dde8" : "#3a4560",
        fret: "#3a4d6e",
        inlay: "#2a3d5e",
        strLabel: "#4a5568",
        fretLabel: "#4a5568",
        strColor: "#c8d4e8",
      };
  const handleNoteClick = (s: number, f: number) => {
    if (playSound) playFretNote(getNoteValue(s, f));
    onNoteClick?.(s, f);
  };
  const NUM_STRINGS = 6;
  const STRING_SPACING = 36;
  const FRET_WIDTH = 56;
  const LABEL_W = showStringLabels ? 28 : 8;
  const TOP_PAD = showFretNumbers ? 28 : 12;
  const BOT_PAD = 12;
  const NUT_W = startFret === 0 ? 6 : 2;

  const svgWidth = LABEL_W + NUT_W + FRET_WIDTH * frets + 8;
  const svgHeight = TOP_PAD + STRING_SPACING * (NUM_STRINGS - 1) + BOT_PAD;

  const stringY = (s: number) => TOP_PAD + s * STRING_SPACING;
  const fretX = (f: number) => LABEL_W + NUT_W + f * FRET_WIDTH;
  const dotX = (f: number) => fretX(f) - FRET_WIDTH / 2;

  return (
    <div className={`w-full overflow-x-auto rounded-lg border p-3 shadow-inner ${rosewood ? "border-[#5a2810] bg-[#120604]" : "border-[#1c2747] bg-[#0a1029]"}`}>
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{ display: "block", minWidth: svgWidth }}
      >
        {/* Fretboard background */}
        {usePhoto ? (
          <>
            {/* Horizontal fretboard is already landscape — photo orientation matches directly */}
            <image
              href={fretboardPhotoSrc}
              x={LABEL_W}
              y={TOP_PAD}
              width={svgWidth - LABEL_W}
              height={STRING_SPACING * (NUM_STRINGS - 1)}
              preserveAspectRatio="xMidYMid slice"
            />
            <rect
              x={LABEL_W}
              y={TOP_PAD}
              width={svgWidth - LABEL_W}
              height={STRING_SPACING * (NUM_STRINGS - 1)}
              fill="rgba(5,8,22,0.40)"
              rx={2}
            />
          </>
        ) : (
          <rect
            x={LABEL_W}
            y={TOP_PAD}
            width={svgWidth - LABEL_W}
            height={STRING_SPACING * (NUM_STRINGS - 1)}
            fill={wood.board}
            rx={2}
          />
        )}

        {/* Fret numbers */}
        {showFretNumbers &&
          Array.from({ length: frets }, (_, i) => {
            const num = startFret + i + 1;
            return (
              <text
                key={`fnum-${i}`}
                x={dotX(i + 1)}
                y={TOP_PAD - 8}
                textAnchor="middle"
                fontSize="11"
                fill={wood.fretLabel}
                fontFamily="JetBrains Mono, monospace"
              >
                {num}
              </text>
            );
          })}

        {/* Nut */}
        <rect
          x={LABEL_W}
          y={TOP_PAD}
          width={NUT_W}
          height={STRING_SPACING * (NUM_STRINGS - 1)}
          fill={wood.nut}
          rx={1}
        />

        {/* Fret wires */}
        {Array.from({ length: frets }, (_, i) => (
          <line
            key={`fret-${i}`}
            x1={fretX(i + 1)}
            y1={TOP_PAD}
            x2={fretX(i + 1)}
            y2={TOP_PAD + STRING_SPACING * (NUM_STRINGS - 1)}
            stroke={wood.fret}
            strokeWidth={1.5}
          />
        ))}

        {/* Position marker dots (inlays) */}
        {Array.from({ length: frets }, (_, i) => {
          const absF = startFret + i + 1;
          const cx = dotX(i + 1);
          const midY = TOP_PAD + STRING_SPACING * (NUM_STRINGS - 1) / 2;
          if (SINGLE_MARKERS.includes(absF)) {
            return (
              <circle key={`marker-${i}`} cx={cx} cy={midY} r={5} fill={wood.inlay} />
            );
          }
          if (DOUBLE_MARKERS.includes(absF)) {
            return (
              <g key={`marker-${i}`}>
                <circle cx={cx} cy={midY - STRING_SPACING} r={5} fill={wood.inlay} />
                <circle cx={cx} cy={midY + STRING_SPACING} r={5} fill={wood.inlay} />
              </g>
            );
          }
          return null;
        })}

        {/* Strings */}
        {Array.from({ length: NUM_STRINGS }, (_, s) => {
          const thickness = 0.9 + s * 0.5;
          return (
            <line
              key={`str-${s}`}
              x1={LABEL_W}
              y1={stringY(s)}
              x2={svgWidth - 4}
              y2={stringY(s)}
              stroke={wood.strColor}
              strokeWidth={thickness}
              strokeLinecap="round"
            />
          );
        })}

        {/* String labels */}
        {showStringLabels &&
          Array.from({ length: NUM_STRINGS }, (_, s) => (
            <text
              key={`slabel-${s}`}
              x={LABEL_W - 6}
              y={stringY(s) + 4}
              textAnchor="end"
              fontSize="11"
              fill={wood.strLabel}
              fontFamily="JetBrains Mono, monospace"
              fontWeight="bold"
            >
              {STRING_NAMES[s]}
            </text>
          ))}

        {/* Open string positions (fret 0) */}
        {startFret === 0 &&
          Array.from({ length: NUM_STRINGS }, (_, s) => {
            const highlight = highlightNotes.find((n) => n.string === s && n.fret === 0);
            const cx = LABEL_W - NUT_W - 10;
            const cy = stringY(s);

            if (highlight) {
              const colors = resolveColor(highlight);
              const name = highlight.label ?? getNoteName(getNoteValue(s, 0), useSharps);
              return (
                <g
                  key={`open-${s}`}
                  onClick={() => onNoteClick && handleNoteClick(s, 0)}
                  style={{ cursor: onNoteClick ? "pointer" : "default" }}
                >
                  <circle cx={cx} cy={cy} r={11} fill={colors.fill} />
                  {showNoteNames && (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9"
                      fill={colors.text} fontWeight="bold" fontFamily="Space Grotesk, sans-serif"
                      style={{ pointerEvents: "none" }}>
                      {name}
                    </text>
                  )}
                </g>
              );
            }

            if (onNoteClick) {
              const name = showEmptyNoteNames ? getNoteName(getNoteValue(s, 0), useSharps) : null;
              return (
                <g key={`open-${s}`} onClick={() => handleNoteClick(s, 0)} style={{ cursor: "pointer" }}>
                  <circle cx={cx} cy={cy} r={12} fill="transparent"
                    className="hover:fill-white/10 transition-colors" />
                  {name && (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9"
                      fill="rgba(138,154,184,0.3)" fontWeight="bold" fontFamily="Space Grotesk, sans-serif"
                      style={{ pointerEvents: "none" }}>
                      {name}
                    </text>
                  )}
                </g>
              );
            }

            return null;
          })}

        {/* Note dots — fretted positions */}
        {Array.from({ length: NUM_STRINGS }, (_, s) =>
          Array.from({ length: frets }, (_, fi) => {
            const f = startFret + fi + 1;
            const highlight = highlightNotes.find((n) => n.string === s && n.fret === f);
            const cx = dotX(fi + 1);
            const cy = stringY(s);

            if (highlight) {
              const colors = resolveColor(highlight);
              const name = highlight.label ?? getNoteName(getNoteValue(s, f), useSharps);
              return (
                <g
                  key={`dot-${s}-${fi}`}
                  onClick={() => onNoteClick && handleNoteClick(s, f)}
                  style={{ cursor: onNoteClick ? "pointer" : "default" }}
                >
                  <circle cx={cx} cy={cy} r={13} fill={colors.fill} />
                  {showNoteNames && (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10"
                      fill={colors.text} fontWeight="bold" fontFamily="Space Grotesk, sans-serif"
                      style={{ pointerEvents: "none" }}>
                      {name}
                    </text>
                  )}
                </g>
              );
            }

            if (onNoteClick) {
              const name = showEmptyNoteNames
                ? getNoteName(getNoteValue(s, f), useSharps)
                : null;
              return (
                <g
                  key={`dot-${s}-${fi}`}
                  onClick={() => handleNoteClick(s, f)}
                  style={{ cursor: "pointer" }}
                >
                  <circle cx={cx} cy={cy} r={14} fill="transparent"
                    className="hover:fill-white/10 transition-colors" />
                  {name && (
                    <text x={cx} y={cy + 4} textAnchor="middle" fontSize="9"
                      fill="rgba(138,154,184,0.3)" fontWeight="bold" fontFamily="Space Grotesk, sans-serif"
                      style={{ pointerEvents: "none" }}>
                      {name}
                    </text>
                  )}
                </g>
              );
            }

            return null;
          })
        )}
      </svg>
    </div>
  );
}
