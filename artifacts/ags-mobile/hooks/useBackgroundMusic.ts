/**
 * Plays a looping background music track while the component is mounted.
 * Returns { muted, toggleMuted } so the drill screen can render a toggle button.
 * Mute preference is persisted in AsyncStorage so it survives across drills.
 * Uses expo-audio (SDK-54 new-arch compatible); skipped on web.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

const VOLUME = 0.022;
const MUTE_KEY = "ags-music-muted";

interface AudioPlayer {
  loop: boolean;
  volume: number;
  play: () => void;
  pause: () => void;
  remove: () => void;
}

export function useBackgroundMusic(source: number): {
  muted: boolean;
  toggleMuted: () => void;
} {
  const [muted, setMuted] = useState(false);
  const playerRef = useRef<AudioPlayer | null>(null);
  const mutedRef = useRef(false);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(MUTE_KEY).then((val) => {
      if (val === "1") {
        setMuted(true);
        mutedRef.current = true;
        if (playerRef.current) playerRef.current.pause();
      }
    });
  }, []);

  // Start/stop player when muted state changes
  useEffect(() => {
    mutedRef.current = muted;
    const p = playerRef.current;
    if (!p) return;
    if (muted) {
      p.pause();
    } else {
      p.play();
    }
  }, [muted]);

  // Create the player once on mount
  useEffect(() => {
    if (Platform.OS === "web") return;

    let cancelled = false;

    async function start() {
      try {
        const { createAudioPlayer, setAudioModeAsync } = require("expo-audio") as {
          createAudioPlayer: (src: number) => AudioPlayer;
          setAudioModeAsync: (opts: Record<string, unknown>) => Promise<void>;
        };

        await setAudioModeAsync({ playsInSilentMode: true });

        if (cancelled) return;

        const player = createAudioPlayer(source);
        player.loop = true;
        player.volume = VOLUME;
        playerRef.current = player;

        if (!mutedRef.current) {
          player.play();
        }
      } catch {
        // Audio unavailable — silent fallback
      }
    }

    void start();

    return () => {
      cancelled = true;
      const p = playerRef.current;
      playerRef.current = null;
      if (p) {
        try {
          p.pause();
          p.remove();
        } catch { /* ignore */ }
      }
    };
  }, [source]);

  const toggleMuted = () => {
    setMuted((prev) => {
      const next = !prev;
      void AsyncStorage.setItem(MUTE_KEY, next ? "1" : "0");
      return next;
    });
  };

  return { muted, toggleMuted };
}
