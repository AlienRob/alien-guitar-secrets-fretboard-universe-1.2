---
name: Lesson narration voice ("Zashtar")
description: Which TTS voice + post-processing to reuse so future lesson narrations match the first one.
---

# Decision

Premium lesson voiceovers use a single consistent narrator the user chose by ear,
nicknamed **Zashtar** (a deep, James-Earl-Jones-ish British master). Reuse the
exact recipe for every new lesson so they sound like the same person:

- Voice: ElevenLabs **"George - Warm, Captivating Storyteller"** (British).
- TTS settings: stability ~0.6, similarity_boost ~0.8, style ~0.2,
  use_speaker_boost true, **speed 0.88** (a touch slow).
- Then pitch the result **down a whole tone** (≈2 semitones) with ffmpeg without
  changing tempo: `asetrate=44100*0.890899, aresample=44100, atempo=1.122462`.
  (This is the take the user approved as "Deep A".)

**Why:** The user iterated through many voices/effects and settled specifically on
British-George-pitched-down-a-whole-tone, clean (no reverb/tunnel — those were
rejected). A different voice or pitch on a later lesson would break continuity.

**How to apply:** Generating narration for a new lesson → use the same voice id +
settings + whole-tone pitch chain, drop the mp3 into the artifact's
`src/assets/lessons/`, and pass it through `LessonLayout`'s `narrationSrc` prop.
Voice cloning of the user's own voice is NOT available via the audio tools — only
search/use existing voices + textToSpeech.

# Narration spans BOTH lessons and practice modes

Every training module (3 Learn lessons + the practice modes) has a Zashtar
voiceover. Lessons use `LessonLayout` `narrationSrc`. Practice pages mount
`<NarrationPlayer src label />` (a standalone HTML5 audio component) near the top,
right after `<PracticeSessionBanner>`. PracticeSessionBanner renders null outside
an active daily routine, so it is NOT a host — mount NarrationPlayer directly.

**Ear Training is nested inside Intervals.** `practice/intervals.tsx` is a wrapper
with two tabs (sight drill + ear) and the shared narration on top; the ear drill
is the named export `EarTrainingDrill({embedded})` from `ear-training.tsx`. The
default export of `ear-training.tsx` stays a zero-prop wrapper so the standalone
`/practice/ear-training` route still typechecks with wouter (it passes route
props). When `embedded`, the drill hides its own NarrationPlayer to avoid a
duplicate; standalone it shows it. Both intervals tabs reuse one
`intervals-narration.mp3`.
