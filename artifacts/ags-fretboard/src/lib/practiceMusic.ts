// Ambient background music for the practice pages.
//
// Uses the Web Audio API (AudioContext + decodeAudioData + BufferSource) rather
// than an HTML5 <audio> element. On phones, <audio> is unreliable — it gets
// silenced by ringer/volume routing and is finicky about autoplay. Web Audio
// plays cleanly once the context is resumed inside a user gesture and is the
// robust cross-device path.
//
// Mute state is persisted so the player's choice sticks between sessions.
// Playback starts after a user gesture; if the context can't resume yet (e.g.
// the player refreshed directly onto a practice page), a one-time gesture
// listener is armed so the next tap/key starts the music.

import ambientUrl from "@assets/generated_audio/practice_ambient_cosmic.mp3";

const MUTE_KEY = "ags.practiceMusic.muted.v1";
const TARGET_VOLUME = 0.06;
const FADE_SECONDS = 0.9;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let source: AudioBufferSourceNode | null = null;
let buffer: AudioBuffer | null = null;
let rawData: ArrayBuffer | null = null;
let playing = false;
let starting = false;
// Bumped on every stop so an in-flight async start can detect it was cancelled
// (route unmount, mute, or quick navigation) and abort before starting a source.
let generation = 0;
let gestureHandler: (() => void) | null = null;

function AudioCtor(): typeof AudioContext | null {
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext ||
    null
  );
}

function disarmGestureUnlock(): void {
  if (!gestureHandler) return;
  window.removeEventListener("pointerdown", gestureHandler);
  window.removeEventListener("keydown", gestureHandler);
  window.removeEventListener("touchstart", gestureHandler);
  gestureHandler = null;
}

function armGestureUnlock(): void {
  if (gestureHandler) return;
  gestureHandler = () => {
    disarmGestureUnlock();
    if (!isPracticeMusicMuted()) void startPracticeMusic();
  };
  window.addEventListener("pointerdown", gestureHandler);
  window.addEventListener("keydown", gestureHandler);
  window.addEventListener("touchstart", gestureHandler);
}

async function loadBuffer(context: AudioContext): Promise<AudioBuffer> {
  if (buffer) return buffer;
  if (!rawData) {
    rawData = await (await fetch(ambientUrl)).arrayBuffer();
  }
  // decodeAudioData detaches the ArrayBuffer, so decode a copy and keep the
  // original around for retries.
  buffer = await context.decodeAudioData(rawData.slice(0));
  return buffer;
}

export function isPracticeMusicMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    return false;
  }
}

function storeMuted(muted: boolean): void {
  try {
    localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
  } catch {
    // ignore — preference just won't persist
  }
}

export async function startPracticeMusic(): Promise<void> {
  if (isPracticeMusicMuted() || playing || starting) return;

  const Ctor = AudioCtor();
  if (!Ctor) return;

  // Tie this start to the current generation; if stop() runs while we await,
  // the generation changes and we abort instead of starting an orphan source.
  starting = true;
  const gen = generation;

  try {
    const context = ctx ?? new Ctor();
    ctx = context;

    if (context.state === "suspended") {
      await context.resume();
    }
    if (gen !== generation || isPracticeMusicMuted()) return;

    // Still not running means there was no usable gesture — wait for one.
    if (context.state !== "running") {
      armGestureUnlock();
      return;
    }

    if (!masterGain) {
      masterGain = context.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(context.destination);
    }

    const buf = await loadBuffer(context);
    if (gen !== generation || isPracticeMusicMuted()) return;

    const src = context.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    src.connect(masterGain);
    src.start();
    source = src;
    playing = true;
    disarmGestureUnlock();

    const now = context.currentTime;
    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(masterGain.gain.value, now);
    masterGain.gain.linearRampToValueAtTime(TARGET_VOLUME, now + FADE_SECONDS);
  } catch {
    // Couldn't start (autoplay/decoding) — retry on the next user gesture.
    playing = false;
    armGestureUnlock();
  } finally {
    starting = false;
  }
}

export function stopPracticeMusic(): void {
  // Invalidate any in-flight start() so it aborts before creating a source.
  generation += 1;
  disarmGestureUnlock();
  if (source) {
    try {
      source.stop();
    } catch {
      /* already stopped */
    }
    try {
      source.disconnect();
    } catch {
      /* already disconnected */
    }
    source = null;
  }
  if (masterGain && ctx) {
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(0, ctx.currentTime);
  }
  playing = false;
}

export function setPracticeMusicMuted(muted: boolean): void {
  storeMuted(muted);
  if (muted) {
    stopPracticeMusic();
  } else {
    void startPracticeMusic();
  }
}
