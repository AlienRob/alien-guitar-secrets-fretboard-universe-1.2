---
name: expo-av Android sound playback
description: How to reliably play dynamically-generated WAV files on Android in Expo; what breaks and why.
---

## Rules

1. **Use `data:` URIs, not `file://` URIs, for dynamically-generated audio on Android.**  
   Both expo-audio and expo-av silently fail when given a `file://` cache-dir URI on Android — the player is created without error but produces no sound. The confirmed working pattern is to encode the WAV as base64 and pass it as a data URI directly:
   ```js
   const wav = encodeWav(renderSamples(...));
   const uri = `data:audio/wav;base64,${uint8ToBase64(wav)}`;
   const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
   ```
   This eliminates expo-file-system entirely and works on Android with expo-av (ExoPlayer supports data: URIs). Cache Sound objects in a module-level Map — they are only generated once per app session.

2. **Await `Audio.setAudioModeAsync` before `createAsync`.**  
   On Android the audio session must be fully configured before Sound objects are created.
   ```js
   await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, allowsRecordingIOS: false, staysActiveInBackground: false });
   const { sound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: false });
   ```

3. **Use `sound.replayAsync()` not `playAsync()` for repeated short sounds.**  
   `replayAsync()` atomically seeks to 0 and plays. `playAsync()` alone does not reset position, so the second play call on the same Sound produces silence on Android.

4. **expo-av property names differ from expo-audio:**  
   - expo-av  → `playsInSilentModeIOS`, `allowsRecordingIOS`  
   - expo-audio → `playsInSilentMode` (no IOS suffix)  
   Wrong names are silently ignored.

5. **expo-audio (`createAudioPlayer`) works only with bundled `require()` assets on Android.** Use it for background music loaded via `require('./file.mp3')`. Never use it for runtime-generated or file:// URIs.

6. **Console.log from the Expo Go app does NOT tunnel back through Replit's Metro proxy.** You cannot use `console.log` in the app to debug — logs go nowhere visible. Use `Alert.alert()` to show errors directly on the phone screen instead.

7. **Tuner screen (`useMicPitch`) on iOS calls `setAudioModeAsync({ allowsRecordingIOS: true })` which kills all playback.** Keep tuner tab hidden with `href: null` and tuner.tsx as a blank stub.

**Why:** All these failures are silent — no crash, no error — so they're impossible to debug by watching Metro logs alone.
