---
name: Chord diagram data (chords-db)
description: How @tombatossals/chords-db shapes are decoded and rendered as fretboard boxes in ags-fretboard.
---

Chord fingering diagrams come from `@tombatossals/chords-db` (`lib/guitar.json`,
~236K, static-imported). Decoded in `lib/chordDiagrams.ts`, rendered by
`components/chord-diagram.tsx`.

`frets`/`fingers` arrays are ordered **low-E to high-E** — the opposite of this
app's `STRINGS` (high-to-low), so reverse `STRINGS` to get open pitch classes.
Values: `-1` muted, `0` open, otherwise the position. When `baseFret > 1` the
values are **relative** to the window, so `actualFret = baseFret + v - 1`; when
`baseFret === 1` they are absolute. Either way `v` is also the display row.
`barres` holds the (relative) fret value(s) of the barre.

DB object keys use `Csharp`/`Fsharp` (not `C#`/`F#`) and carry only one
enharmonic per pitch, so flat roots must map to their sharp equivalent
(Db→Csharp, Eb/Ab/Bb keep their own keys). There is no `"5"` power-chord
suffix → diagrams return null for it (handled gracefully).

**Why (root highlight rule):** a chord's root can sound on an open string or a
barred string, not just a plain fretted dot. `chordRootFlags()` computes a
per-string root flag for every sounding string (open + barre included); the
renderer must use it for all three cases or many roots go un-highlighted.
**How to apply:** when touching the diagram renderer, drive gold root markers
from `chordRootFlags`, never from a fret-only check.

## Per-string degree labels (R/3/5/b7…) — `chordDegrees()`
`chordDegrees(position, root)` labels each sounding string with its interval role
so a box of dots reads as "which note does what". The 2nd/4th/6th are
**context-aware**: named as plain steps (2/4/6) for simple chords, but as compound
extensions (9/11/13) only when the voicing also contains a 7th (semitone 10 or 11).
**Why:** a sus2's added tone should read "2" for beginners, but a true ninth chord's
upper tone should read "9". A 7th in the voicing is what makes a step an extension.

**Gotcha — chords-db voicings are often incomplete.** The first `"9"` position for
many roots omits the ♭7 (it's effectively an add9), so it is NOT a valid fixture for
extension-naming tests. Build a hand-made `ChordPosition` (with a real ♭7 + 9th) for
that test instead of trusting the library voicing.

`chordNotes(position, root)` is the sibling of `chordDegrees`: it returns each
sounding string's spelled note name (flats/sharps chosen via `rootPrefersFlats`).
`ChordDiagram`'s `showNotes` prop prints those note names on the dots (and on the
barre / open markers) instead of fingering numbers.

Diagram label policy: lessons pass `name` + `showDegrees`; the Chord Decoder quiz
passes `showNotes` + `showDegrees` (note names on the dots, R/3/5 role band below)
but never `name` — the chord title is only revealed in the end-of-round review, so
the student still has to assemble the notes into a chord name themselves.
