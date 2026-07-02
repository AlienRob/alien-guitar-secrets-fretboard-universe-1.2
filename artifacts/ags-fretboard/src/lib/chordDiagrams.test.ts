import { describe, it, expect } from "vitest";
import { getChordDiagram, chordRootFlags, chordDegrees, chordNotes, type ChordPosition } from "./chordDiagrams";

describe("getChordDiagram", () => {
  it("returns the common open C major shape (x32010)", () => {
    const pos = getChordDiagram("C", "Major");
    expect(pos).not.toBeNull();
    expect(pos!.frets).toEqual([-1, 3, 2, 0, 1, 0]);
    expect(pos!.baseFret).toBe(1);
  });

  it("maps flat roots to their enharmonic database key (Db -> C#)", () => {
    const flat = getChordDiagram("Db", "Major");
    const sharp = getChordDiagram("C#", "Major");
    expect(flat).not.toBeNull();
    expect(flat).toEqual(sharp);
  });

  it("resolves sharp roots stored as 'Fsharp'", () => {
    const pos = getChordDiagram("F#", "Major");
    expect(pos).not.toBeNull();
    expect(pos!.frets).toHaveLength(6);
  });

  it("maps quality keys to database suffixes (dim, aug, m7b5)", () => {
    for (const key of ["dim", "aug", "m7b5", "maj7", "sus4", "13"]) {
      expect(getChordDiagram("C", key)).not.toBeNull();
    }
  });

  it("returns null for chord types with no database entry (power chord)", () => {
    expect(getChordDiagram("C", "5")).toBeNull();
  });

  it("returns null for an unknown root", () => {
    expect(getChordDiagram("H", "Major")).toBeNull();
  });

  it("uses fret values within a window when baseFret > 1", () => {
    const pos = getChordDiagram("C", "13");
    expect(pos).not.toBeNull();
    expect(pos!.baseFret).toBeGreaterThan(1);
    // every fretted value stays inside the visible window (<= 5 frets)
    for (const v of pos!.frets) {
      expect(v).toBeLessThanOrEqual(5);
      expect(v).toBeGreaterThanOrEqual(-1);
    }
  });
});

describe("chordRootFlags", () => {
  it("flags open-string roots (E major: low E, D-string E, high E)", () => {
    const pos = getChordDiagram("E", "Major");
    expect(chordRootFlags(pos!, "E")).toEqual([
      true,
      false,
      true,
      false,
      false,
      true,
    ]);
  });

  it("flags barred roots (F# major barre on the 2nd fret)", () => {
    const pos = getChordDiagram("F#", "Major");
    expect(pos!.barres.length).toBeGreaterThan(0);
    expect(chordRootFlags(pos!, "F#")).toEqual([
      true,
      false,
      true,
      false,
      false,
      true,
    ]);
  });

  it("never flags muted strings", () => {
    const pos = getChordDiagram("C", "Major"); // x32010, low E muted
    const flags = chordRootFlags(pos!, "C");
    expect(flags[0]).toBe(false); // muted low E
    expect(flags).toContain(true); // C still has a root somewhere
  });
});

describe("chordDegrees", () => {
  it("labels each sounding string with its role in C major (x32010 = C E G C E)", () => {
    const pos = getChordDiagram("C", "Major");
    expect(chordDegrees(pos!, "C")).toEqual([null, "R", "3", "5", "R", "3"]);
  });

  it("labels the minor third (and never a major third) for a minor chord", () => {
    const pos = getChordDiagram("A", "Minor");
    const labels = new Set(chordDegrees(pos!, "A").filter((d): d is string => d != null));
    expect(labels.has("\u266D3")).toBe(true);
    expect(labels.has("3")).toBe(false);
    expect(labels).toEqual(new Set(["R", "\u266D3", "5"]));
  });

  it("only contains chord tones for a seventh chord", () => {
    const pos = getChordDiagram("G", "7");
    const labels = chordDegrees(pos!, "G").filter((d): d is string => d != null);
    expect(labels.length).toBeGreaterThan(0);
    for (const l of labels) {
      expect(["R", "3", "5", "\u266D7"]).toContain(l);
    }
  });

  it("names a sus2's added tone as a plain 2 (no 7th present)", () => {
    const pos = getChordDiagram("C", "sus2");
    const labels = new Set(chordDegrees(pos!, "C").filter((d): d is string => d != null));
    expect(labels.has("2")).toBe(true);
    expect(labels.has("9")).toBe(false);
  });

  it("spells the note name of each sounding string for C major (x32010)", () => {
    const pos = getChordDiagram("C", "Major"); // x32010 = C E G C E
    expect(chordNotes(pos!, "C")).toEqual([null, "C", "E", "G", "C", "E"]);
  });

  it("spells a flat-key chord with flats (Bb major)", () => {
    const pos = getChordDiagram("Bb", "Major");
    const names = chordNotes(pos!, "Bb").filter((n): n is string => n != null);
    // Bb major = Bb D F; flats, never sharps.
    expect(new Set(names)).toEqual(new Set(["Bb", "D", "F"]));
    expect(names.some((n) => n.includes("#"))).toBe(false);
  });

  it("names the upper tone as a 9 when a 7th makes it an extension", () => {
    // A true C9 voicing (C E B\u266D D) built by hand: the chord library's first
    // "C9" position omits the \u266D7, so it is not a valid fixture for this rule.
    const c9: ChordPosition = {
      frets: [8, 7, 8, 7, -1, -1], // low-E\u2192high-e: C E B\u266D D, top two muted
      fingers: [0, 0, 0, 0, 0, 0],
      baseFret: 1,
      barres: [],
    };
    const labels = new Set(chordDegrees(c9, "C").filter((d): d is string => d != null));
    expect(labels).toEqual(new Set(["R", "3", "\u266D7", "9"]));
    expect(labels.has("2")).toBe(false);
  });
});
