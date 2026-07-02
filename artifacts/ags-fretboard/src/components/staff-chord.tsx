import { useEffect, useRef } from "react";
import { Renderer, Stave, StaveNote, Accidental, Formatter } from "vexflow";
import { notesToStaffKeys } from "@/lib/musicTheory";

interface Props {
  // Spelled note names in voiced order, lowest first (e.g. ["C", "E", "G"]).
  notes: string[];
  width?: number;
  height?: number;
  className?: string;
}

// Renders a single chord as a stacked whole note on a treble-clef stave using
// VexFlow. Drawn black on a cream "music paper" card so it stays legible on the
// app's dark cosmic background.
export default function StaffChord({ notes, width = 170, height = 130, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.innerHTML = "";
    if (notes.length === 0) return;

    const renderer = new Renderer(el, Renderer.Backends.SVG);
    renderer.resize(width, height);
    const context = renderer.getContext();

    const stave = new Stave(0, 0, width - 4);
    stave.addClef("treble");
    stave.setContext(context).draw();

    const { keys, accidentals } = notesToStaffKeys(notes);
    const note = new StaveNote({ keys, duration: "w" });
    for (const { index, type } of accidentals) {
      note.addModifier(new Accidental(type), index);
    }

    Formatter.FormatAndDraw(context, stave, [note]);

    return () => {
      el.innerHTML = "";
    };
  }, [notes, width, height]);

  return (
    <div
      className={`inline-block rounded-lg bg-[#FAF7EF] px-1 py-1 ${className ?? ""}`}
    >
      <div ref={containerRef} />
    </div>
  );
}
