---
name: Zashtar narration voice recipe
description: Exact ElevenLabs + ffmpeg recipe to generate new AGS module voiceovers that match the existing Zashtar narrator.
---

# Zashtar narration voice recipe

All training-module voiceovers in `artifacts/ags-fretboard/src/assets/lessons/*-narration.mp3`
were produced with one fixed recipe. To add or re-cut narration that matches the
existing voice, reuse it EXACTLY:

- ElevenLabs voiceId `JBFqnCBsd6RMkjVDRZzb` ("George"), modelId `eleven_multilingual_v2`
- voiceSettings: stability 0.6, similarity_boost 0.8, style 0.2, use_speaker_boost true, speed 0.88
- Then pitch the result DOWN a whole tone (cleanly) with ffmpeg:
  `asetrate=44100*0.890899, aresample=44100, atempo=1.122462`
- Output mp3 -> `artifacts/ags-fretboard/src/assets/lessons/`
- Scripts are written from the source PDFs in `attached_assets/` (Lesson_1.x..7.x,
  How_to_Practice_Scales).

**Why:** the mp3 files themselves do not reveal the generation settings, and the
user is cost-sensitive — regenerating audio costs ElevenLabs credits. Never
regenerate existing narration just to "redo" it; only generate when content
genuinely changes, and match this recipe so the narrator stays consistent.

**How to apply:** wire a finished mp3 into a Learn page via `LessonLayout`'s
`narrationSrc` prop, or into a Practice page by mounting `<NarrationPlayer src=... />`
(see `components/learn/narration-player.tsx`).
