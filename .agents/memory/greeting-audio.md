---
name: Alien greeting audio playback
description: How the intro splash plays music reliably across phones
---

# Greeting audio (theme music only)

The intro splash (`alien-greeting.tsx`) plays a looping background theme and a
typewriter greeting, all kicked off by a single `begin()` on the first tap.
The TTS voiceover was removed (user disliked the generated voice) — the on-screen
greeting text stays, but there is no spoken audio. If re-adding voice later, see
the ducking notes at the bottom.

**Use the Web Audio API, not `<audio>` elements.**
**Why:** On phones, HTML5 `<audio>` is unreliable — it can be silenced by ringer
/ volume routing and is finicky about autoplay. Web Audio (AudioContext +
decodeAudioData + BufferSource) plays cleanly inside the tap gesture and is the
robust cross-device path. Symptom that led here: user heard it once over car
Bluetooth but never on the phone speaker.

**How to apply:**
- Resume the AudioContext inside the user gesture; do NOT rely on autoplay-on-mount
  (start is deterministic on first tap, gated by a "Tap to begin" prompt; the Enter
  button only appears after `started`).
- Mute/unmute = set the master GainNode to 0/1; unmuting before audio started must
  call `begin()` so it actually starts.
- **Initialize the master gain from `mutedRef.current`, NOT the `muted` React state.**
  **Why:** `begin()` runs synchronously inside the same handler that flips state, so
  `muted` is the stale pre-toggle value. Using it (mute-then-unmute before first tap)
  sets master gain to 0 and the UI shows unmuted while audio stays silent forever.
- Read `muted` via `mutedRef` inside ALL audio callbacks (stale-closure trap).
- `decodeAudioData` detaches the ArrayBuffer — decode a `.slice(0)` copy so retries
  work. Prefetch the mp3 ArrayBuffer on mount for instant start.
- Stop sources + close the context, and clear all timers, on unmount.
- Note: nothing in-page can override the user's MEDIA volume being down (separate
  from ringer on Android) — that's a hardware-side cause to mention to the user.

**Practice-page music follows the same rule.** The ambient bed on practice routes
(`lib/practiceMusic.ts`, mounted by `practice-music.tsx`) also uses Web Audio, not
`<audio>`, for the same mobile reliability. Because start is async (resume + decode)
but stop is sync, it guards against a stop/unmount-during-start race with a
generation counter (bumped on stop, re-checked after every `await`) plus a
`starting` lock so a quick navigate/mute can't leave an orphan looping source
playing after the page is gone.

**If re-adding a voiceover:** duck the music gain (~0.32) while the voice plays,
then on `voiceSrc.onended` ramp it back up (~0.55) via `linearRampToValueAtTime`.
