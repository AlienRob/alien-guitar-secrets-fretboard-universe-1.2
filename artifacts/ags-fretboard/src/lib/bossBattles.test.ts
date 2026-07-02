import { describe, it, expect, beforeEach } from "vitest";
import {
  BOSS_BATTLES,
  MAX_BOSS_SYSTEM,
  getBossBattle,
  isTrophyGuitar,
} from "@/data/bossBattles";
import { GUITARS } from "@/data/guitars";
import {
  loadBossState,
  getBossRecord,
  isBossDefeated,
  isBossUnlocked,
  highestAccessibleSystem,
  isSystemBossGated,
  gatingBossSystem,
  recordBossAttempt,
  isTrophyUnlocked,
  isGuitarUnlocked,
  allBossesDefeatedState,
} from "@/lib/bossBattles";

beforeEach(() => {
  window.localStorage.clear();
});

describe("loadBossState", () => {
  it("returns an empty state when nothing is stored", () => {
    expect(loadBossState()).toEqual({ systems: {} });
  });

  it("survives corrupted storage", () => {
    window.localStorage.setItem("ags.boss.v1", "not json");
    expect(loadBossState()).toEqual({ systems: {} });
  });
});

describe("isBossUnlocked", () => {
  it("unlocks the boss only once the player reaches the boss level", () => {
    expect(isBossUnlocked(9, 1)).toBe(false);
    expect(isBossUnlocked(10, 1)).toBe(true);
    expect(isBossUnlocked(19, 2)).toBe(false);
    expect(isBossUnlocked(20, 2)).toBe(true);
  });

  it("returns false for systems with no boss", () => {
    expect(isBossUnlocked(999, MAX_BOSS_SYSTEM + 1)).toBe(false);
  });
});

describe("recordBossAttempt", () => {
  it("records a loss without marking the boss defeated", () => {
    const out = recordBossAttempt(1, 50);
    expect(out.defeated).toBe(false);
    expect(out.firstWin).toBe(false);
    expect(out.bestPct).toBe(50);
    expect(out.attempts).toBe(1);
    expect(isBossDefeated(loadBossState(), 1)).toBe(false);
  });

  it("marks a win as a first win and defeats the boss", () => {
    const out = recordBossAttempt(1, 85);
    expect(out.defeated).toBe(true);
    expect(out.firstWin).toBe(true);
    expect(isBossDefeated(loadBossState(), 1)).toBe(true);
  });

  it("treats exactly the pass threshold as a win", () => {
    const boss = getBossBattle(1)!;
    const out = recordBossAttempt(1, boss.passPct);
    expect(out.defeated).toBe(true);
  });

  it("only counts the first win once, keeping the best score", () => {
    recordBossAttempt(1, 85); // first win
    const second = recordBossAttempt(1, 95); // higher, but not a first win
    expect(second.defeated).toBe(true);
    expect(second.firstWin).toBe(false);
    expect(second.bestPct).toBe(95);
    expect(second.attempts).toBe(2);
  });

  it("keeps the best score after a later worse run", () => {
    recordBossAttempt(1, 90);
    const worse = recordBossAttempt(1, 40);
    expect(worse.bestPct).toBe(90);
    expect(getBossRecord(loadBossState(), 1).bestPct).toBe(90);
  });
});

describe("highestAccessibleSystem / gating", () => {
  it("only system 1 is accessible with no bosses defeated", () => {
    const state = loadBossState();
    expect(highestAccessibleSystem(state)).toBe(1);
    expect(isSystemBossGated(state, 2)).toBe(true);
  });

  it("defeating a boss opens exactly the next system", () => {
    recordBossAttempt(1, 90);
    const state = loadBossState();
    expect(highestAccessibleSystem(state)).toBe(2);
    expect(isSystemBossGated(state, 2)).toBe(false);
    expect(isSystemBossGated(state, 3)).toBe(true);
  });

  it("opens every system once all bosses are beaten", () => {
    for (let s = 1; s <= MAX_BOSS_SYSTEM; s++) recordBossAttempt(s, 100);
    expect(highestAccessibleSystem(loadBossState())).toBe(MAX_BOSS_SYSTEM + 1);
  });

  it("names the boss that guards each system", () => {
    expect(gatingBossSystem(1)).toBeUndefined();
    expect(gatingBossSystem(2)).toBe(1);
    expect(gatingBossSystem(5)).toBe(4);
  });
});

describe("trophy gating", () => {
  it("flags every boss trophy guitar as a trophy", () => {
    for (const boss of BOSS_BATTLES) {
      expect(isTrophyGuitar(boss.trophyGuitarId)).toBe(true);
    }
  });

  it("keeps a trophy locked until its boss is defeated", () => {
    const boss = getBossBattle(1)!;
    const trophy = GUITARS.find((g) => g.id === boss.trophyGuitarId)!;
    const before = loadBossState();
    expect(isTrophyUnlocked(before, trophy.id)).toBe(false);
    // Even at a sky-high level, the trophy stays locked without a win.
    expect(isGuitarUnlocked(trophy, 999, before)).toBe(false);

    recordBossAttempt(1, 90);
    const after = loadBossState();
    expect(isTrophyUnlocked(after, trophy.id)).toBe(true);
    expect(isGuitarUnlocked(trophy, 0, after)).toBe(true);
  });

  it("leaves non-trophy guitars on the normal level unlock", () => {
    const normal = GUITARS.find((g) => !isTrophyGuitar(g.id))!;
    const state = loadBossState();
    expect(isGuitarUnlocked(normal, normal.unlockLevel, state)).toBe(true);
    expect(isGuitarUnlocked(normal, normal.unlockLevel - 1, state)).toBe(false);
  });
});

describe("allBossesDefeatedState", () => {
  it("treats every boss as defeated", () => {
    const state = allBossesDefeatedState();
    for (let s = 1; s <= MAX_BOSS_SYSTEM; s++) {
      expect(isBossDefeated(state, s)).toBe(true);
    }
    expect(highestAccessibleSystem(state)).toBe(MAX_BOSS_SYSTEM + 1);
  });
});
