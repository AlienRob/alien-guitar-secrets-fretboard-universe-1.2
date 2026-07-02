---
name: expo-audio SDK 54 migration
description: How to correctly use expo-audio (SDK 54) for dynamically-generated WAV files on native; common pitfalls vs expo-av.
---

## Rule
When migrating from expo-av to expo-audio for native WAV playback:

1. **Property name**: expo-audio's `setAudioModeAsync` uses `playsInSilentMode` (not `playsInSilentModeIOS` — that was expo-av). Passing the wrong name is silently ignored; iOS audio stays muted by the silent switch.

2. **Await seekTo**: `player.seekTo(seconds)` returns `Promise<void>`. Always `await` it inside async wrappers, or `play()` fires before the seek completes.

3. **require() vs URI**: `useBackgroundMusic` (which works) passes a bundled `number` (`require()` asset) to `createAudioPlayer`. Dynamic cache-file playback uses `{ uri: "file://..." }` — the same `AudioSource` type, confirmed in expo-audio v1.1.1 types.

4. **seekTo takes seconds**: expo-av's `setPositionAsync` took milliseconds; expo-audio's `seekTo` takes seconds. Divide by 1000 at the call site.

**Why:** expo-audio silently ignores unknown audio-mode properties, so misconfiguration looks like success but audio is muted. expo-av's async seekTo pattern differs from expo-audio's synchronous-constructor + async-seek pattern.

**How to apply:** Any new audio player code — check property names against useBackgroundMusic as the working reference.
