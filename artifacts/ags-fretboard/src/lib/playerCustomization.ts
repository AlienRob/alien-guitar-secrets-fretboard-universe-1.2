// Local persistence for player customisation that doesn't live on the server:
// the avatar configuration and the set of guitar unlocks the player has already
// "seen" (so we only celebrate brand-new unlocks once).

import { AvatarConfig, DEFAULT_AVATAR } from "@/data/avatarOptions";

const AVATAR_KEY = "ags.avatar.v1";
const SEEN_KEY = "ags.vault.seen.v1";
const SEEN_INIT_KEY = "ags.vault.seen.initialized.v1";
const HANDED_KEY = "ags.handed.v1";
const COINS_KEY = "ags.alienCoins.v1";

export type Handed = "right" | "left";

export function loadHandedness(): Handed {
  try {
    return localStorage.getItem(HANDED_KEY) === "left" ? "left" : "right";
  } catch {
    return "right";
  }
}

export function saveHandedness(h: Handed): void {
  try {
    localStorage.setItem(HANDED_KEY, h);
  } catch {
    // ignore
  }
}

export function loadAvatar(): AvatarConfig {
  try {
    const raw = localStorage.getItem(AVATAR_KEY);
    if (!raw) return { ...DEFAULT_AVATAR };
    const parsed = JSON.parse(raw) as Partial<AvatarConfig>;
    return { ...DEFAULT_AVATAR, ...parsed };
  } catch {
    return { ...DEFAULT_AVATAR };
  }
}

export function saveAvatar(config: AvatarConfig): void {
  try {
    localStorage.setItem(AVATAR_KEY, JSON.stringify(config));
  } catch {
    // storage unavailable — avatar simply won't persist
  }
}

export function loadSeenGuitars(): Set<string> {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function saveSeenGuitars(ids: Set<string>): void {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...ids]));
    localStorage.setItem(SEEN_INIT_KEY, "1");
  } catch {
    // ignore
  }
}

// Whether the vault has ever recorded a snapshot. Used to suppress celebrations
// on the very first visit (so we don't celebrate guitars unlocked before the
// player ever opened the vault) without relying on the seen-set being empty —
// a level-0 first visit legitimately has an empty seen-set.
export function isSeenInitialized(): boolean {
  try {
    return localStorage.getItem(SEEN_INIT_KEY) === "1";
  } catch {
    return false;
  }
}

const EARNED_GEAR_KEY = "ags.gear.earned.v1";

// Gear the player has earned as Bag Shop rewards or Daily Practice rewards,
// on top of the milestone-based unlocks computed from their stats.
export function loadEarnedGear(): Set<string> {
  try {
    const raw = localStorage.getItem(EARNED_GEAR_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}

export function addEarnedGear(id: string): void {
  try {
    const set = loadEarnedGear();
    set.add(id);
    localStorage.setItem(EARNED_GEAR_KEY, JSON.stringify([...set]));
  } catch {
    // storage unavailable — reward simply won't persist
  }
}

// Alien Coins — the in-game currency earned from drills and boss victories.
// Spent in the Bag Shop for mystery gear bags.

export function loadAlienCoins(): number {
  try {
    const raw = localStorage.getItem(COINS_KEY);
    if (!raw) return 0;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}

export function saveAlienCoins(n: number): void {
  try {
    localStorage.setItem(COINS_KEY, String(Math.max(0, Math.floor(n))));
  } catch {
    // storage unavailable — coins won't persist
  }
}

export function addAlienCoins(amount: number): number {
  const next = loadAlienCoins() + amount;
  saveAlienCoins(next);
  return next;
}

export function spendAlienCoins(amount: number): boolean {
  const current = loadAlienCoins();
  if (current < amount) return false;
  saveAlienCoins(current - amount);
  return true;
}
