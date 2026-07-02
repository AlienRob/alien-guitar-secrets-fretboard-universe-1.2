---
name: AGS Fretboard audio + note model
description: Web Audio gotcha and the fretboard value->MIDI mapping used in artifacts/ags-fretboard
---

# Web Audio: resume before scheduling
Always `await audioContext.resume()` BEFORE reading `currentTime` and scheduling oscillators.

**Why:** A suspended context has a frozen clock; oscillators scheduled at `currentTime + offset` while suspended land in the past once it resumes and never sound. This caused total silence in the ear-training module.

**How to apply:** Use the shared engine `src/lib/audio.ts` (module-level singleton AudioContext, `ensureRunning` awaits resume). Use `exponentialRampToValueAtTime` with a non-zero floor (0.0001) — exponential ramps to 0 are invalid. Don't create per-component AudioContexts.

# Fretboard note value -> MIDI offset
`musicTheory.ts` STRINGS use a custom semitone scale (open high-e = 40), NOT MIDI. Real MIDI = appValue + 24 (40 -> E4 = MIDI 64). Use `playFretNote(getNoteValue(s,f))` which applies the offset.

# Audio loudness balance (three knobs, keep them even)
The app mixes sources with very different inherent loudness; keep them perceptually even so users never adjust device volume. Measured integrated loudness: level-up shred lick file ≈ -9.4 LUFS (brutally hot), narration files ≈ -24 LUFS, guitar samples ≈ -36..-43 LUFS (quiet), calm practice ambient ≈ -16.1 LUFS.

Three independent gain knobs:
- Note/interval/trill playback: `OUTPUT_GAIN` in `src/lib/audio.ts` (one constant feeds notes, intervals AND the completion trill). Set to 0.6 — 1/3 left intervals too quiet; the original full level was overpowering on phones. Raising it risks clipping harmonic intervals (two notes summed) so stay ≤ ~0.66.
- Level-up shred lick: `el.volume` in `src/lib/levelupSfx.ts`. Kept very low (0.08) because the file is mastered hot and was the #1 "way too loud / off-putting" complaint.
- Lesson narration: `a.volume` in `components/learn/narration-player.tsx` (0.8, a touch below full).

**Leave alone:** practice ambient ("calm thinking music") `TARGET_VOLUME` 0.06 in `practiceMusic.ts`, and the alien-greeting intro mix — the user is happy with both; the greeting has a carefully tuned internal music/voice duck.
**Why:** Integrated LUFS is NOT a reliable proxy here — the shred lick and note attacks are transient/peaky and perceive much louder than their LUFS suggests; tune by the user's relative complaints, not by matching LUFS numbers.

# Note-finding answer check
A note name occurs at multiple frets on a string (e.g. A on the A string = open AND fret 12). Correctness is `same string && clicked note NAME === target note name`, not exact-fret. Question generator includes fret 0 so open-string questions actually appear. Open-string (fret 0) positions must be rendered as clickable hit targets — easy to forget since they sit left of the nut.
