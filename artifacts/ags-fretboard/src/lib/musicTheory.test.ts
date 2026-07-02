import { describe, it, expect } from "vitest";
import {
  spellInterval,
  INTERVALS,
  randomPracticeRoot,
  chordFormula,
  rotateNotes,
  notesToStaffKeys,
  spellChord,
  CHORDS,
} from "./musicTheory";

describe("spellInterval", () => {
  it("spells a major 2nd above E as F#, not Gb", () => {
    expect(spellInterval("E", "Major 2nd")).toBe("F#");
  });

  it("spells a minor 3rd above E as G", () => {
    expect(spellInterval("E", "Minor 3rd")).toBe("G");
  });

  it("spells diatonic intervals on natural roots correctly", () => {
    expect(spellInterval("C", "Major 3rd")).toBe("E");
    expect(spellInterval("C", "Perfect 5th")).toBe("G");
    expect(spellInterval("G", "Major 7th")).toBe("F#");
    expect(spellInterval("Bb", "Major 3rd")).toBe("D");
    expect(spellInterval("F#", "Perfect 5th")).toBe("C#");
  });

  it("spells the tritone as an augmented 4th", () => {
    expect(spellInterval("C", "Tritone")).toBe("F#");
    expect(spellInterval("F", "Tritone")).toBe("B");
  });

  it("returns the root note for unison and octave", () => {
    expect(spellInterval("E", "Unison")).toBe("E");
    expect(spellInterval("F#", "Octave")).toBe("F#");
  });

  it("falls back to a clean single-accidental enharmonic instead of a double accidental", () => {
    const result = spellInterval("Db", "Minor 2nd");
    expect(result).not.toMatch(/##|bb/);
    expect(result).toBe("D");
  });

  it("never produces a double accidental for any root/interval combination", () => {
    const roots = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];
    for (const root of roots) {
      for (const name of Object.keys(INTERVALS) as (keyof typeof INTERVALS)[]) {
        expect(spellInterval(root, name)).not.toMatch(/##|bb/);
      }
    }
  });
});

describe("randomPracticeRoot", () => {
  const SHARP = new Set(["C", "G", "D", "A", "E", "B", "F#"]);
  const FLAT = new Set(["Ab", "Eb", "Bb", "F"]);

  it("only returns the guitar-friendly keys and never Db", () => {
    for (let i = 0; i < 500; i++) {
      const r = randomPracticeRoot();
      expect(SHARP.has(r) || FLAT.has(r)).toBe(true);
      expect(r).not.toBe("Db");
    }
  });

  it("leans hard toward sharp keys while keeping flats in the mix", () => {
    let sharp = 0;
    let flat = 0;
    for (let i = 0; i < 2000; i++) {
      SHARP.has(randomPracticeRoot()) ? sharp++ : flat++;
    }
    // Heavily sharp-weighted so beginners aren't hammered with flats, but flats
    // still appear regularly.
    expect(sharp).toBeGreaterThan(flat * 2);
    expect(flat).toBeGreaterThan(0);
  });
});

describe("chordFormula", () => {
  it("labels the common triads", () => {
    expect(chordFormula(CHORDS["Major"])).toEqual(["1", "3", "5"]);
    expect(chordFormula(CHORDS["Minor"])).toEqual(["1", "\u266D3", "5"]);
  });

  it("spells the augmented fifth as #5, not b6", () => {
    expect(chordFormula(CHORDS["aug"])).toEqual(["1", "3", "\u266F5"]);
  });

  it("labels seventh chords with a b7 or natural 7", () => {
    expect(chordFormula(CHORDS["7"])).toEqual(["1", "3", "5", "\u266D7"]);
    expect(chordFormula(CHORDS["maj7"])).toEqual(["1", "3", "5", "7"]);
  });

  it("keeps extensions distinct as 9, 11 and 13", () => {
    expect(chordFormula(CHORDS["13"])).toEqual([
      "1", "3", "5", "\u266D7", "9", "11", "13",
    ]);
  });

  it("produces a label for every chord in the library", () => {
    for (const intervals of Object.values(CHORDS)) {
      expect(chordFormula(intervals)).not.toContain("?");
    }
  });
});

describe("rotateNotes", () => {
  it("returns the same order in root position (rotate by 0)", () => {
    expect(rotateNotes(["C", "E", "G"], 0)).toEqual(["C", "E", "G"]);
  });

  it("puts the 3rd in the bass for a 1st inversion", () => {
    expect(rotateNotes(["C", "E", "G"], 1)).toEqual(["E", "G", "C"]);
  });

  it("puts the 5th in the bass for a 2nd inversion", () => {
    expect(rotateNotes(["C", "E", "G"], 2)).toEqual(["G", "C", "E"]);
  });

  it("wraps around for rotations beyond the chord size", () => {
    expect(rotateNotes(["C", "E", "G"], 3)).toEqual(["C", "E", "G"]);
  });
});

describe("notesToStaffKeys", () => {
  it("stacks a root-position triad ascending in one octave", () => {
    const { keys } = notesToStaffKeys(["C", "E", "G"]);
    expect(keys).toEqual(["c/4", "e/4", "g/4"]);
  });

  it("wraps an inversion's rotated tones up an octave", () => {
    // 2nd inversion of C major: G - C - E should be G4, C5, E5.
    const { keys } = notesToStaffKeys(rotateNotes(["C", "E", "G"], 2));
    expect(keys).toEqual(["g/4", "c/5", "e/5"]);
  });

  it("places a 9th above the seventh chord", () => {
    // C9 spelled C E G Bb D -> the D (9th) sits in the next octave.
    const notes = spellChord("C", "9", CHORDS["9"]);
    const { keys } = notesToStaffKeys(notes);
    expect(keys[keys.length - 1]).toBe("d/5");
  });

  it("spells dominant chords with a flat 7th (Bb, not A#) for staff display", () => {
    // The lesson must pass the chord KEY ("7"/"9"), not a display label, so the
    // 7th is spelled Bb. notesToStaffKeys then renders bb, never a#.
    expect(spellChord("C", "7", CHORDS["7"])).toContain("Bb");
    const { keys } = notesToStaffKeys(spellChord("C", "9", CHORDS["9"]));
    expect(keys).toContain("bb/4");
  });

  it("reports accidentals with their note index and converts unicode symbols", () => {
    const { keys, accidentals } = notesToStaffKeys(["E\u266D", "G", "B\u266D"]);
    expect(keys).toEqual(["eb/4", "g/4", "bb/4"]);
    expect(accidentals).toEqual([
      { index: 0, type: "b" },
      { index: 2, type: "b" },
    ]);
  });
});
