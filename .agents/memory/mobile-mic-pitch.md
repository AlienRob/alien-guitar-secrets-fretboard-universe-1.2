---
name: Mobile mic pitch detection (Note Check)
description: Why the ear-trainer mic capture is web-only and what it takes to make it work on a phone.
---

The "Note Check" ear trainer (`app/note-check.tsx`) detects which note the user
plays. The detection maths is a pure autocorrelation engine in `lib/pitch.ts`
(validated to sub-cent accuracy on synthetic tones). Capture is split out into
`hooks/useMicPitch.ts`.

**Decision: live mic capture is implemented for WEB only; native returns
`supported: false`.**

**Why:**
- Real-time microphone PCM on iOS/Android needs a custom native audio module
  (e.g. an audio-stream lib). `expo-audio` can only record to a file (AAC/m4a on
  Android), so there is no cross-platform PCM stream without native code.
- Adding any native module makes the app require a dev/EAS build to open —
  the daily **Expo Go preview would stop loading the app entirely**, not just the
  one screen. That is a big regression to take without explicit user consent,
  especially right after shipping working TestFlight/Play builds.
- The mic engine/algorithm cannot be tested from the Replit environment (no real
  microphone or guitar), so native capture must be verified on the user's device.

**How to apply:**
- To enable phones, add a native audio-stream module + Expo config plugin and
  implement the native branch of `useMicPitch` only — the screen and `lib/pitch.ts`
  stay unchanged. Get user sign-off first (it changes the build and breaks Expo Go).
- iOS needs `NSMicrophoneUsageDescription` (already set via the expo-audio plugin
  config + infoPlist); Android needs `RECORD_AUDIO` (already present).
- `lib/pitch.ts` MIDI mapping uses `VALUE_TO_MIDI = 24` to stay in sync with
  `lib/audio.ts`; keep them aligned if either changes.
