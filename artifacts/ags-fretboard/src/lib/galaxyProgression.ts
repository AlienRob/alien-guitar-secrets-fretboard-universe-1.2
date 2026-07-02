// Frontend progression model for the Galaxy Map.
//
// Turns the player's level (from the profile summary) into solar systems and
// planets. One planet = one level, 10 planets per solar system, and the 10th
// planet of every system is a boss. This mirrors the backend math
// (system = ceil(level / 10)) but uses a 10-planet cycle for the map; it does
// NOT change any backend logic.

export const PLANETS_PER_SYSTEM = 10;

// Guitar-themed display names for the 10 planet positions within every solar
// system. They ascend in intensity, and the 10th is the system boss. The
// isBoss flag (not this name) still drives all boss visuals and icons.
export const PLANET_NAMES = [
  "Open String",
  "Fretline",
  "Soundhole Drift",
  "Harmonic Reach",
  "Octave Gate",
  "Tremolo Belt",
  "Vibrato Expanse",
  "Arpeggio Rise",
  "Sustain Veil",
  "Distortion Core",
] as const;

export type PlanetState = "completed" | "current" | "locked";

export interface PlanetInfo {
  // 1-based index within its solar system (1..10).
  index: number;
  // The absolute player level this planet corresponds to.
  level: number;
  // The solar system this planet belongs to (1-based).
  system: number;
  isBoss: boolean;
  state: PlanetState;
  // Human label, e.g. "Planet 3" or "Boss".
  label: string;
  // Requirement text shown on locked planets, e.g. "Reach level 4".
  requirement: string;
}

export interface SolarSystemInfo {
  system: number;
  planets: PlanetInfo[];
  // 1-based index of the current planet within this system, or null if the
  // player's current planet is not in this system.
  currentIndex: number | null;
  // Whether the player has fully cleared this system (all planets completed).
  cleared: boolean;
  // Whether this system is reachable yet (system <= the player's current one).
  unlocked: boolean;
}

export function levelToSystem(level: number): number {
  return Math.max(1, Math.ceil(level / PLANETS_PER_SYSTEM));
}

// 1-based planet index within the system for a given level (1..10).
export function levelToPlanet(level: number): number {
  return ((Math.max(1, level) - 1) % PLANETS_PER_SYSTEM) + 1;
}

export function isBossLevel(level: number): boolean {
  return level % PLANETS_PER_SYSTEM === 0;
}

// The absolute level for a given (system, planetIndex) pair.
export function planetLevel(system: number, index: number): number {
  return (system - 1) * PLANETS_PER_SYSTEM + index;
}

// Build the view model for a single solar system relative to the player's level.
export function buildSolarSystem(system: number, playerLevel: number): SolarSystemInfo {
  const playerSystem = levelToSystem(playerLevel);
  const planets: PlanetInfo[] = [];
  let currentIndex: number | null = null;

  for (let index = 1; index <= PLANETS_PER_SYSTEM; index++) {
    const level = planetLevel(system, index);
    const isBoss = index === PLANETS_PER_SYSTEM;

    let state: PlanetState;
    if (level < playerLevel) state = "completed";
    else if (level === playerLevel) state = "current";
    else state = "locked";

    if (state === "current") currentIndex = index;

    planets.push({
      index,
      level,
      system,
      isBoss,
      state,
      label: PLANET_NAMES[index - 1] ?? (isBoss ? "Boss" : `Planet ${index}`),
      requirement: `Reach level ${level}`,
    });
  }

  const cleared = playerLevel > planetLevel(system, PLANETS_PER_SYSTEM);

  return {
    system,
    planets,
    currentIndex,
    cleared,
    unlocked: system <= playerSystem,
  };
}

// Highest solar system the player can have reached.
export function maxUnlockedSystem(playerLevel: number): number {
  return levelToSystem(playerLevel);
}
