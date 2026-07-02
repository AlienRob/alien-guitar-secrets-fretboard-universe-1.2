---
name: spellChord expects a chord key, not a display label
description: Passing "Cmaj7"/"C7" instead of "maj7"/"7" to spellChord silently mis-spells enharmonics.
---

`spellChord(root, chordName, intervals)` in
`artifacts/ags-fretboard/src/lib/musicTheory.ts` looks `chordName` up in
`CHORD_LETTER_STEPS` (keys like `Major`, `7`, `maj7`, `9`). If the name is not a
known key it silently falls back to a raw sharp/flat chromatic table.

**Why:** the fallback produces theory-wrong spellings — e.g. a dominant C7 then
shows **A#** instead of **Bb**, which clashes with the displayed b7 formula and
the whole point of correct enharmonic spelling.

**How to apply:** always pass the canonical chord KEY (`maj7`, `7`, `9`), never a
user-facing label (`Cmaj7`). Keep the display label separate from the spell key.
Same trap applies to anything feeding spellChord into the stave (notesToStaffKeys).
