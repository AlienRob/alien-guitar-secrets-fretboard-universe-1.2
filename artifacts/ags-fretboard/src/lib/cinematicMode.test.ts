import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  loadCinematicMode,
  saveCinematicMode,
  prefersReducedMotion,
  cinematicEnabled,
  loadLastSeenLevel,
  saveLastSeenLevel,
} from "./cinematicMode";

function setReducedMotion(reduced: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: reduced,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

describe("cinematic mode persistence", () => {
  beforeEach(() => {
    localStorage.clear();
    setReducedMotion(false);
  });

  it("defaults to ON when nothing is stored", () => {
    expect(loadCinematicMode()).toBe(true);
  });

  it("round-trips the saved choice through localStorage", () => {
    saveCinematicMode(false);
    expect(loadCinematicMode()).toBe(false);
    saveCinematicMode(true);
    expect(loadCinematicMode()).toBe(true);
  });
});

describe("cinematicEnabled gating", () => {
  beforeEach(() => {
    localStorage.clear();
    setReducedMotion(false);
  });

  it("is enabled when cinematic is on and reduced motion is off", () => {
    saveCinematicMode(true);
    setReducedMotion(false);
    expect(cinematicEnabled()).toBe(true);
  });

  it("is disabled when cinematic is toggled off", () => {
    saveCinematicMode(false);
    expect(cinematicEnabled()).toBe(false);
  });

  it("is disabled when the OS prefers reduced motion, regardless of the toggle", () => {
    saveCinematicMode(true);
    setReducedMotion(true);
    expect(prefersReducedMotion()).toBe(true);
    expect(cinematicEnabled()).toBe(false);
  });
});

describe("last seen level tracking", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns null before any level has been recorded", () => {
    expect(loadLastSeenLevel()).toBeNull();
  });

  it("round-trips the stored level", () => {
    saveLastSeenLevel(7);
    expect(loadLastSeenLevel()).toBe(7);
  });

  it("returns null for a corrupt stored value", () => {
    localStorage.setItem("ags.galaxy.lastLevel.v1", "not-a-number");
    expect(loadLastSeenLevel()).toBeNull();
  });

  it("falls back to true when storage throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage unavailable");
    });
    expect(loadCinematicMode()).toBe(true);
    spy.mockRestore();
  });
});
