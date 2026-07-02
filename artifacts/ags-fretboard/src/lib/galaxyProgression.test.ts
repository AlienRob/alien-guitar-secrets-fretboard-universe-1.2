import { describe, it, expect } from "vitest";
import {
  PLANETS_PER_SYSTEM,
  levelToSystem,
  levelToPlanet,
  isBossLevel,
  planetLevel,
  buildSolarSystem,
  maxUnlockedSystem,
} from "./galaxyProgression";

describe("levelToSystem", () => {
  it("maps the first ten levels to system 1", () => {
    for (let lvl = 1; lvl <= PLANETS_PER_SYSTEM; lvl++) {
      expect(levelToSystem(lvl)).toBe(1);
    }
  });

  it("rolls over to the next system on the eleventh level", () => {
    expect(levelToSystem(11)).toBe(2);
    expect(levelToSystem(20)).toBe(2);
    expect(levelToSystem(21)).toBe(3);
  });

  it("never returns less than 1, even for non-positive levels", () => {
    expect(levelToSystem(0)).toBe(1);
    expect(levelToSystem(-5)).toBe(1);
  });
});

describe("levelToPlanet", () => {
  it("returns a 1-based index within the 10-planet cycle", () => {
    expect(levelToPlanet(1)).toBe(1);
    expect(levelToPlanet(5)).toBe(5);
    expect(levelToPlanet(10)).toBe(10);
  });

  it("wraps around at the system boundary", () => {
    expect(levelToPlanet(11)).toBe(1);
    expect(levelToPlanet(20)).toBe(10);
    expect(levelToPlanet(21)).toBe(1);
  });

  it("clamps non-positive levels to the first planet", () => {
    expect(levelToPlanet(0)).toBe(1);
    expect(levelToPlanet(-3)).toBe(1);
  });
});

describe("isBossLevel", () => {
  it("treats every tenth level as a boss", () => {
    expect(isBossLevel(10)).toBe(true);
    expect(isBossLevel(20)).toBe(true);
    expect(isBossLevel(100)).toBe(true);
  });

  it("treats non-multiples of ten as regular planets", () => {
    expect(isBossLevel(1)).toBe(false);
    expect(isBossLevel(9)).toBe(false);
    expect(isBossLevel(11)).toBe(false);
  });
});

describe("planetLevel", () => {
  it("is the inverse of levelToSystem/levelToPlanet", () => {
    for (let lvl = 1; lvl <= 35; lvl++) {
      const system = levelToSystem(lvl);
      const index = levelToPlanet(lvl);
      expect(planetLevel(system, index)).toBe(lvl);
    }
  });
});

describe("buildSolarSystem", () => {
  it("produces ten planets with the tenth marked as the boss", () => {
    const system = buildSolarSystem(1, 1);
    expect(system.planets).toHaveLength(PLANETS_PER_SYSTEM);
    expect(system.planets.map((p) => p.isBoss)).toEqual([
      false, false, false, false, false, false, false, false, false, true,
    ]);
    // The 10th position is the boss; labels come from the guitar-themed names.
    expect(system.planets[9].label).toBe("Distortion Core");
    expect(system.planets[0].label).toBe("Open String");
  });

  it("marks planets completed / current / locked relative to the player level", () => {
    // Player is at level 3 (system 1, planet 3).
    const system = buildSolarSystem(1, 3);
    expect(system.planets[0].state).toBe("completed");
    expect(system.planets[1].state).toBe("completed");
    expect(system.planets[2].state).toBe("current");
    expect(system.planets[3].state).toBe("locked");
    expect(system.currentIndex).toBe(3);
  });

  it("exposes the absolute level and lock requirement per planet", () => {
    const system = buildSolarSystem(2, 5);
    // System 2, planet 1 -> absolute level 11.
    expect(system.planets[0].level).toBe(11);
    expect(system.planets[0].requirement).toBe("Reach level 11");
  });

  it("flags a fully-cleared system and reports no current planet", () => {
    // Player at level 15 has cleared system 1 entirely.
    const cleared = buildSolarSystem(1, 15);
    expect(cleared.cleared).toBe(true);
    expect(cleared.currentIndex).toBeNull();
    expect(cleared.planets.every((p) => p.state === "completed")).toBe(true);
  });

  it("marks reachable vs not-yet-unlocked systems", () => {
    // Player at level 12 is in system 2.
    expect(buildSolarSystem(1, 12).unlocked).toBe(true);
    expect(buildSolarSystem(2, 12).unlocked).toBe(true);
    expect(buildSolarSystem(3, 12).unlocked).toBe(false);
    // A not-yet-reached system has no current planet and is not cleared.
    const locked = buildSolarSystem(3, 12);
    expect(locked.currentIndex).toBeNull();
    expect(locked.cleared).toBe(false);
    expect(locked.planets.every((p) => p.state === "locked")).toBe(true);
  });
});

describe("maxUnlockedSystem", () => {
  it("equals the system containing the player's current level", () => {
    expect(maxUnlockedSystem(1)).toBe(1);
    expect(maxUnlockedSystem(10)).toBe(1);
    expect(maxUnlockedSystem(11)).toBe(2);
    expect(maxUnlockedSystem(31)).toBe(4);
  });
});
