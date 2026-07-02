/**
 * @workspace/native-metronome
 *
 * JavaScript interface for the iOS native AVAudioEngine metronome.
 *
 * REQUIRES AN EAS BUILD — not available in Expo Go.
 * Falls back gracefully (isAvailable = false) in Expo Go or on Android/web.
 *
 * Usage:
 *   NativeMetronome.isAvailable   → true only in an iOS EAS build
 *   NativeMetronome.start({...})  → renders + loops the bar, starts audio
 *   NativeMetronome.stop()        → stops audio
 *   NativeMetronome.setTempo(bpm) → re-renders bar at new BPM
 *   NativeMetronome.addBeatListener(cb) → returns { remove() } subscription
 *
 * Beat events are ONLY for visual display. Never use them to trigger audio.
 */

import { Platform } from "react-native";
import { requireNativeModule, EventEmitter } from "expo-modules-core";
import type { Subscription } from "expo-modules-core";

export type NativeMetronomeStartOptions = {
  bpm: number;
  beatsPerBar: number;
  subdivision: number;
  accentFirstBeat: boolean;
};

const _mod = (() => {
  if (Platform.OS !== "ios") return null;
  try {
    return requireNativeModule("NativeMetronome");
  } catch {
    return null;
  }
})();

const _emitter = _mod ? new EventEmitter(_mod) : null;

export const NativeMetronome = {
  /** true only inside an iOS EAS build (not Expo Go, not Android, not web) */
  isAvailable: _mod !== null,

  start(options: NativeMetronomeStartOptions): Promise<void> {
    return _mod?.start(options) ?? Promise.resolve();
  },

  stop(): Promise<void> {
    return _mod?.stop() ?? Promise.resolve();
  },

  setTempo(bpm: number): Promise<void> {
    return _mod?.setTempo({ bpm }) ?? Promise.resolve();
  },

  /**
   * Subscribe to beat events (visual display only — never trigger audio here).
   * Returns a Subscription; call .remove() on cleanup.
   */
  addBeatListener(
    callback: (beatIndex: number) => void,
  ): Subscription | null {
    return (
      _emitter?.addListener("beat", (event: { beatIndex: number }) => {
        callback(event.beatIndex);
      }) ?? null
    );
  },
};
