---
name: Enharmonic note spelling (ags-fretboard)
description: How scales/chords must be spelled by letter name, not raw chromatic index, and why.
---

# Enharmonic note spelling

Scales and chords must be spelled by **letter name per degree**, not by mapping a
raw semitone to a single flat-only (or sharp-only) chromatic table.

**Why:** A single global accidental table produces theory-invalid spellings — e.g.
A major came out `A B Db D E Gb Ab` (contains both A *and* Ab, with a missing/
duplicate letter), and symmetric scales (diminished/chromatic) show adjacent
enharmonics like `Ab` and `A` together. A correct diatonic scale uses each of the
7 letter names appropriately.

**How to apply (ags-fretboard `src/lib/musicTheory.ts`):**
- `spellScale`/`spellChord` advance one letter per degree using `SCALE_LETTER_STEPS`
  / `CHORD_LETTER_STEPS`, then add the accidental needed to hit the pitch.
- 7-note diatonic scales/modes use letter steps `[0..6]`. Pentatonic/blues use
  explicit per-scale letter-step arrays (blues duplicates the 5th letter slot for
  b5+5). Symmetric scales (Whole Tone, Diminished, Chromatic) have no canonical
  letter-walk → fall back to `rootPrefersFlats(root)` flat/sharp preference.
- Chord spelling caps double accidentals (e.g. dim7 bb7) to a readable enharmonic.
- Practice root selection is sharp-weighted via a per-key weight pool, NOT 50/50:
  `randomPracticeRoot()` draws from `PRACTICE_KEY_WEIGHTS` (open C,G,D,A,E weighted
  highest; B,F#,F regular; Bb sparse; Eb,Ab rarest) → ~80%+ sharp. Db is EXCLUDED
  entirely (no 5-flat keys for beginners). Allowed keys = the 11 guitar-friendly
  ones (C,G,D,A,E,B,F#,F,Bb,Eb,Ab). `ROOT_OPTIONS` is those same 11 (NOT all 12)
  and backs the fretboard explorer dropdown. User preference = challenge beginners
  with sharps but KEEP flats sparingly — do not remove flats, do not re-add Db.
  Each root spells conventionally for its key.
- The fretboard `NoteHighlight` carries an optional `label` (the correctly spelled
  name) that overrides the raw chromatic name on the rendered dots.

The sibling app `artifacts/guitar-practice/src/lib/musicTheory.ts` uses a simpler
per-key single `useFlat` flag — adequate for standard major/minor but not as
general as the letter-step approach.

## Note-finder game (src/pages/practice/fretboard.tsx)
Deliberately NOT key-centric. After iterating (all-flat → all-sharp → per-key
diatonic-only with a "Key of X" label), the user settled on: drop keys entirely,
label every accidental with BOTH enharmonic names (e.g. "A#/Bb") via a local
`noteLabel(pitch)` using `NOTES_SHARP`/`NOTES_FLAT`; naturals show a single name.
**Why:** without a key there is no single "correct" sharp-vs-flat spelling, so a
single-table label is always arguable (key of G must never show G#); dual labels
are always factually correct. Match answers by **pitch class** (`getNoteValue%12`)
+ string, never by the displayed string — so enharmonic spelling never affects
correctness. Do not reintroduce a key label or single-accidental spelling here.

## Intervals quiz (src/pages/practice/intervals.tsx)
The intervals quiz must NOT label the target note from a flat-only table — that
produced wrong spellings (E + Major 2nd showed "Gb", which is a diminished 3rd).
Use `spellInterval(root, intervalName)` from musicTheory.ts: it spans the right
number of letter names per interval (`INTERVAL_LETTER_STEPS`, tritone = aug 4th),
keeps the pitch exact, and falls back to a clean enharmonic if a double accidental
would result. Roots are drawn from `ROOT_OPTIONS` (conventional single-accidental
spellings), not the raw chromatic flat table.
