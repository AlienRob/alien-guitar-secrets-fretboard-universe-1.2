import { describe, it, expect } from "vitest";
import {
  CAGED_SCALES,
  NPS_SCALES,
  CAGED_POSITION_COUNT,
  PENT_BOX_COUNT,
  ARP_POSITION_COUNT,
  VOICING_POSITION_COUNT,
  npsPatternCount,
  buildScaleShape,
  buildCagedShape,
  build3npsShape,
  buildPentBox,
  buildArpeggioShape,
  buildChordVoicing,
  degreeName,
  SCALES,
  CHORDS,
  STRINGS,
  parseNote,
} from "./musicTheory";

const ROOTS = ["C", "G", "D", "A", "E", "B", "F#", "Db", "Ab", "Eb", "Bb", "F"];

function pitchClassesOf(root: string, scaleName: string): Set<number> {
  const rootPitch = parseNote(root).pitch;
  const intervals = SCALES[scaleName as keyof typeof SCALES];
  return new Set(intervals.map((i) => (rootPitch + i) % 12));
}

describe("buildCagedShape", () => {
  it("produces only in-scale notes, on the neck, with a root present, for every root/scale/position", () => {
    for (const scaleName of CAGED_SCALES) {
      const pcs = pitchClassesOf("C", scaleName);
      for (const root of ROOTS) {
        const scalePcs = pitchClassesOf(root, scaleName);
        for (let pos = 0; pos < CAGED_POSITION_COUNT; pos++) {
          const shape = buildCagedShape(root, scaleName, pos);
          expect(shape.notes.length).toBeGreaterThan(0);
          for (const n of shape.notes) {
            expect(n.fret).toBeGreaterThanOrEqual(0);
            expect(scalePcs.has(n.pitch)).toBe(true);
            // The actual fret pitch must match the recorded pitch class.
            expect((STRINGS[n.string].open + n.fret) % 12).toBe(n.pitch);
          }
          expect(shape.notes.some((n) => n.isRoot)).toBe(true);
        }
      }
      // reference set unused beyond construction; keep lint quiet
      expect(pcs.size).toBeGreaterThan(0);
    }
  });

  it("keeps each box within a compact six-fret window", () => {
    for (const scaleName of CAGED_SCALES) {
      for (const root of ROOTS) {
        for (let pos = 0; pos < CAGED_POSITION_COUNT; pos++) {
          const shape = buildCagedShape(root, scaleName, pos);
          // Real CAGED shapes span up to 5 frets on some positions (A, G, E shapes).
          // Allow up to 5 (maxFret - minFret <= 5).
          expect(shape.maxFret - shape.minFret).toBeLessThanOrEqual(5);
        }
      }
    }
  });
});

describe("buildPentBox", () => {
  const PENT_SCALES = ["Major Pentatonic", "Minor Pentatonic"];

  it("produces exactly 12 notes (2 per string), all in scale, root present", () => {
    for (const scaleName of PENT_SCALES) {
      for (const root of ROOTS) {
        const scalePcs = pitchClassesOf(root, scaleName);
        for (let box = 0; box < PENT_BOX_COUNT; box++) {
          const shape = buildPentBox(root, scaleName, box);
          expect(shape.notes.length).toBe(12);
          for (let s = 0; s < 6; s++) {
            expect(shape.notes.filter((n) => n.string === s).length).toBe(2);
          }
          for (const n of shape.notes) {
            expect(n.fret).toBeGreaterThanOrEqual(0);
            expect(scalePcs.has(n.pitch)).toBe(true);
            expect((STRINGS[n.string].open + n.fret) % 12).toBe(n.pitch);
          }
          expect(shape.notes.some((n) => n.isRoot)).toBe(true);
        }
      }
    }
  });
});

describe("build3npsShape", () => {
  it("lays exactly three notes on each of the six strings, all in scale, root present", () => {
    for (const scaleName of NPS_SCALES) {
      const count = npsPatternCount(scaleName);
      for (const root of ROOTS) {
        const scalePcs = pitchClassesOf(root, scaleName);
        for (let p = 0; p < count; p++) {
          const shape = build3npsShape(root, scaleName, p);
          expect(shape.notes.length).toBe(18);
          for (let s = 0; s < 6; s++) {
            expect(shape.notes.filter((n) => n.string === s).length).toBe(3);
          }
          for (const n of shape.notes) {
            expect(n.fret).toBeGreaterThanOrEqual(0);
            expect(scalePcs.has(n.pitch)).toBe(true);
            expect((STRINGS[n.string].open + n.fret) % 12).toBe(n.pitch);
          }
          expect(shape.notes.some((n) => n.isRoot)).toBe(true);
        }
      }
    }
  });
});

describe("build3npsShape root position (index 0)", () => {
  it("starts with the root as the lowest note on the low E string", () => {
    for (const scaleName of NPS_SCALES) {
      for (const root of ROOTS) {
        const shape = build3npsShape(root, scaleName, 0);
        const first = shape.notes[0];
        // Notes are built low E first, ascending, so notes[0] is the lowest.
        expect(first.string).toBe(5); // low E (STRINGS index 5)
        expect(first.isRoot).toBe(true);
        const lowEFrets = shape.notes.filter((n) => n.string === 5).map((n) => n.fret);
        expect(Math.min(...lowEFrets)).toBe(first.fret);
      }
    }
  });
});

describe("buildScaleShape", () => {
  it("dispatches to the right system", () => {
    expect(buildScaleShape("caged", "C", "Major", 0).system).toBe("caged");
    expect(buildScaleShape("3nps", "C", "Major", 0).system).toBe("3nps");
    expect(buildScaleShape("pent", "C", "Minor Pentatonic", 0).system).toBe("pent");
    expect(buildScaleShape("arp", "C", "Major", 0).system).toBe("arp");
    expect(buildScaleShape("voicing", "C", "Major", 0).system).toBe("voicing");
  });
});

const ARP_CHORD_NAMES = ["Major", "Minor", "7", "maj7", "m7", "dim", "m7b5"] as const;

function chordPcsOf(root: string, chordName: string): Set<number> {
  const rootPitch = parseNote(root).pitch;
  const ivs = (CHORDS[chordName as keyof typeof CHORDS] ?? [0, 4, 7]).map((i) => i % 12);
  return new Set(ivs.map((i) => (rootPitch + i) % 12));
}

describe("buildArpeggioShape", () => {
  it("produces only in-chord notes, all on the neck, root present, for every root/chord/position", () => {
    for (const chordName of ARP_CHORD_NAMES) {
      for (const root of ROOTS) {
        const pcs = chordPcsOf(root, chordName);
        for (let pos = 0; pos < ARP_POSITION_COUNT; pos++) {
          const shape = buildArpeggioShape(root, chordName, pos);
          expect(shape.notes.length).toBeGreaterThan(0);
          for (const n of shape.notes) {
            expect(n.fret).toBeGreaterThanOrEqual(0);
            expect(pcs.has(n.pitch)).toBe(true);
            expect((STRINGS[n.string].open + n.fret) % 12).toBe(n.pitch);
          }
          expect(shape.notes.some((n) => n.isRoot)).toBe(true);
        }
      }
    }
  });

  it("matches C major shape 1 exactly against reference (E/G on low-E, C on A, E on D, G on G, C on B, E/G on high-e)", () => {
    const shape = buildArpeggioShape("C", "Major", 0);
    const byString = (s: number) => shape.notes.filter((n) => n.string === s).map((n) => n.fret).sort((a, b) => a - b);
    expect(byString(5)).toEqual([0, 3]); // low E: E(0), G(3)
    expect(byString(4)).toEqual([3]);    // A:     C(3) root
    expect(byString(3)).toEqual([2]);    // D:     E(2)
    expect(byString(2)).toEqual([0]);    // G:     G(0) open
    expect(byString(1)).toEqual([1]);    // B:     C(1) root
    expect(byString(0)).toEqual([0, 3]); // high e: E(0), G(3)
  });

  it("matches C minor shape 1 against reference (G on low-E, C on A, Eb on D, G on G, C+Eb on B, G on high-e)", () => {
    const shape = buildArpeggioShape("C", "Minor", 0);
    const byString = (s: number) => shape.notes.filter((n) => n.string === s).map((n) => n.fret).sort((a, b) => a - b);
    expect(byString(5)).toEqual([3]);    // low E: G(3) — Eb is fret 11, outside window
    expect(byString(4)).toEqual([3]);    // A:     C(3) root
    expect(byString(3)).toEqual([1]);    // D:     Eb(1)
    expect(byString(2)).toEqual([0]);    // G:     G(0) open
    expect(byString(1)).toEqual([1, 4]); // B:     C(1) root, Eb(4)
    expect(byString(0)).toEqual([3]);    // high e: G(3) — Eb is fret 11
  });
});

describe("buildChordVoicing", () => {
  it("produces exactly one note per non-muted string, all in chord, root present", () => {
    for (const chordName of ARP_CHORD_NAMES) {
      for (const root of ROOTS) {
        const pcs = chordPcsOf(root, chordName);
        for (let pos = 0; pos < VOICING_POSITION_COUNT; pos++) {
          const shape = buildChordVoicing(root, chordName, pos);
          expect(shape.notes.length).toBeGreaterThan(0);
          for (const n of shape.notes) {
            expect(n.fret).toBeGreaterThanOrEqual(0);
            expect(pcs.has(n.pitch)).toBe(true);
          }
          // No two notes on the same string
          const strings = shape.notes.map((n) => n.string);
          expect(new Set(strings).size).toBe(strings.length);
          expect(shape.notes.some((n) => n.isRoot)).toBe(true);
          // mutedStrings + played strings = all 6 strings
          const played = new Set(shape.notes.map((n) => n.string));
          const muted = new Set(shape.mutedStrings ?? []);
          expect(played.size + muted.size).toBe(6);
          expect([...played].every((s) => !muted.has(s))).toBe(true);
        }
      }
    }
  });
});

describe("degreeName", () => {
  it("names common scale degrees", () => {
    expect(degreeName(0)).toBe("Root");
    expect(degreeName(4)).toBe("3rd");
    expect(degreeName(7)).toBe("5th");
    expect(degreeName(3)).toBe("\u266D3");
  });
});
