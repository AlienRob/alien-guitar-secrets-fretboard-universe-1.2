import React, { useState, useMemo } from "react";
import Fretboard from "@/components/fretboard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  SCALES,
  CHORDS,
  getNoteValue,
  parseNote,
  spellScale,
  spellChord,
  rootPrefersFlats,
  ROOT_OPTIONS,
} from "@/lib/musicTheory";

type Mode = "notes" | "scales" | "chords";

function buildHighlights(
  mode: Mode,
  rootPitch: number,
  intervals: number[],
  startFret: number,
  numFrets: number,
  nameByPitch: Record<number, string>,
) {
  const targets = intervals.map((i) => (rootPitch + i) % 12);
  const out: { string: number; fret: number; type: "root" | "scale" | "chord"; label?: string }[] = [];
  for (let s = 0; s < 6; s++) {
    for (let f = startFret; f <= startFret + numFrets; f++) {
      const cls = getNoteValue(s, f) % 12;
      if (mode === "notes") {
        if (cls === rootPitch) out.push({ string: s, fret: f, type: "root", label: nameByPitch[cls] });
      } else {
        if (targets.includes(cls)) {
          out.push({
            string: s,
            fret: f,
            type: cls === rootPitch ? "root" : mode === "scales" ? "scale" : "chord",
            label: nameByPitch[cls],
          });
        }
      }
    }
  }
  return out;
}

const LEGEND = [
  { type: "root", color: "#FF2D55", label: "Root" },
  { type: "scale", color: "#00FFD5", label: "Scale tone" },
  { type: "chord", color: "#FFD700", label: "Chord tone" },
];

export default function FretboardExplorer() {
  const [mode, setMode] = useState<Mode>("scales");
  const [root, setRoot] = useState("C");
  const [scale, setScale] = useState("Major");
  const [chord, setChord] = useState("Major");
  const [view, setView] = useState<"position" | "full">("position");
  const [position, setPosition] = useState(0); // start fret for position view

  const useFlats = rootPrefersFlats(root);
  const rootPitch = parseNote(root).pitch;

  const intervals = useMemo(() => {
    if (mode === "scales") return SCALES[scale as keyof typeof SCALES] ?? [];
    if (mode === "chords") return CHORDS[chord as keyof typeof CHORDS] ?? [];
    return [];
  }, [mode, scale, chord]);

  // Correctly spelled note name for each pitch class in the current selection.
  const spelled = useMemo(() => {
    if (mode === "scales") return spellScale(root, scale, intervals);
    if (mode === "chords") return spellChord(root, chord, intervals);
    return [root];
  }, [mode, root, scale, chord, intervals]);

  const nameByPitch = useMemo(() => {
    const map: Record<number, string> = {};
    const ivs = mode === "notes" ? [0] : intervals;
    ivs.forEach((iv, idx) => {
      map[(rootPitch + iv) % 12] = spelled[idx];
    });
    return map;
  }, [mode, intervals, spelled, rootPitch]);

  const highlights = useMemo(() => {
    if (view === "full") return buildHighlights(mode, rootPitch, intervals, 0, 24, nameByPitch);
    return buildHighlights(mode, rootPitch, intervals, position, 5, nameByPitch);
  }, [mode, rootPitch, intervals, view, position, nameByPitch]);

  const positionFrets = [0, 2, 4, 5, 7, 9, 11];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-sans font-bold text-white tracking-tight">Scale &amp; Chord Finder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Visualize scales, chords and notes across the neck.</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 items-end bg-card/40 border border-white/8 rounded-lg p-4">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">View</label>
          <div className="flex rounded-md overflow-hidden border border-white/10">
            {(["position", "full"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  view === v ? "bg-primary text-white" : "bg-transparent text-muted-foreground hover:text-white"
                }`}
              >
                {v === "position" ? "Position" : "Full neck"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Mode</label>
          <Select value={mode} onValueChange={(v: Mode) => setMode(v)}>
            <SelectTrigger className="h-8 text-sm w-[130px] border-white/10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="notes">Single note</SelectItem>
              <SelectItem value="scales">Scale</SelectItem>
              <SelectItem value="chords">Chord</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase tracking-wider">Root</label>
          <Select value={root} onValueChange={setRoot}>
            <SelectTrigger className="h-8 text-sm w-[80px] border-white/10 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROOT_OPTIONS.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {mode === "scales" && (
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Scale</label>
            <Select value={scale} onValueChange={setScale}>
              <SelectTrigger className="h-8 text-sm w-full sm:w-[180px] border-white/10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(SCALES).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {mode === "chords" && (
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Chord</label>
            <Select value={chord} onValueChange={setChord}>
              <SelectTrigger className="h-8 text-sm w-full sm:w-[140px] border-white/10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CHORDS).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        )}

        {view === "position" && (
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase tracking-wider">Position</label>
            <Select value={String(position)} onValueChange={(v) => setPosition(Number(v))}>
              <SelectTrigger className="h-8 text-sm w-[110px] border-white/10 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {positionFrets.map((f) => (
                  <SelectItem key={f} value={String(f)}>Fret {f === 0 ? "Open" : f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Legend */}
      {mode !== "notes" && (
        <div className="flex gap-4 text-xs text-muted-foreground">
          {LEGEND.filter(l => mode === "scales" ? l.type !== "chord" : l.type !== "scale").map(l => (
            <div key={l.type} className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
      )}

      {/* Fretboard */}
      <div className="rounded-lg border border-white/8 bg-card/30 p-3 sm:p-5 overflow-hidden">
        {view === "position" ? (
          <Fretboard
            frets={5}
            startFret={position}
            highlightNotes={highlights}
            showNoteNames
            useSharps={!useFlats}
            showStringLabels
            showFretNumbers
            usePhoto
          />
        ) : (
          <Fretboard
            frets={12}
            startFret={0}
            highlightNotes={highlights}
            showNoteNames
            useSharps={!useFlats}
            showStringLabels
            showFretNumbers
            usePhoto
          />
        )}
      </div>

      {/* Info row */}
      {mode !== "notes" && (
        <div className="text-xs text-muted-foreground border border-white/6 rounded-md p-3 bg-card/20">
          <span className="text-white font-medium mr-2">{root} {mode === "scales" ? scale : chord}</span>
          {intervals.map((i, idx) => {
            const isRoot = i === 0;
            return (
              <span key={idx} className={`mr-2 ${isRoot ? "text-[#FF2D55] font-bold" : "text-muted-foreground"}`}>
                {spelled[idx]}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
