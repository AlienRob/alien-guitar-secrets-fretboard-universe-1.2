// Persistence + helpers for the Galaxy Map's "Cinematic Mode".
//
// Cinematic Mode ON  -> full launch/wormhole/landing transitions play.
// Cinematic Mode OFF -> planet changes are near-instant (no long animation).
//
// The player's choice is stored in localStorage. We also honour the OS-level
// "prefers-reduced-motion" setting: when the user has asked for reduced motion
// we always skip the long sequences regardless of the toggle.

const CINEMATIC_KEY = "ags.galaxy.cinematic.v1";
const LAST_LEVEL_KEY = "ags.galaxy.lastLevel.v1";

export function loadCinematicMode(): boolean {
  try {
    // Default ON — the cinematic experience is the headline feature.
    return localStorage.getItem(CINEMATIC_KEY) !== "0";
  } catch {
    return true;
  }
}

export function saveCinematicMode(on: boolean): void {
  try {
    localStorage.setItem(CINEMATIC_KEY, on ? "1" : "0");
  } catch {
    // storage unavailable — setting simply won't persist
  }
}

export function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Whether long cinematic transitions should actually play right now.
export function cinematicEnabled(): boolean {
  return loadCinematicMode() && !prefersReducedMotion();
}

// Track the last level we've shown a launch celebration for, so we can detect a
// fresh level-up between visits and auto-play the sequence exactly once. Returns
// null on the very first ever load (so we don't celebrate pre-existing progress).
export function loadLastSeenLevel(): number | null {
  try {
    const raw = localStorage.getItem(LAST_LEVEL_KEY);
    if (raw === null) return null;
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

export function saveLastSeenLevel(level: number): void {
  try {
    localStorage.setItem(LAST_LEVEL_KEY, String(level));
  } catch {
    // ignore
  }
}
