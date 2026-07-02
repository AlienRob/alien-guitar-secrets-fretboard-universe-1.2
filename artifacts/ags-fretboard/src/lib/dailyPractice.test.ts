import { describe, it, expect, beforeEach } from "vitest";
import {
  startRound,
  awardDrillReward,
  tierForAccuracy,
  GREAT_SCORE_THRESHOLD,
} from "./dailyPractice";
import { loadEarnedGear } from "./playerCustomization";
import { pickRewardPool, GEAR } from "@/data/gear";

const OK = GREAT_SCORE_THRESHOLD - 10; // an "ok" accuracy
const GREAT = 100; // a "great" accuracy

describe("tierForAccuracy", () => {
  it("grades at/above the threshold as great, below as ok", () => {
    expect(tierForAccuracy(GREAT_SCORE_THRESHOLD)).toBe("great");
    expect(tierForAccuracy(GREAT_SCORE_THRESHOLD - 1)).toBe("ok");
    expect(tierForAccuracy(0)).toBe("ok");
  });
});

describe("awardDrillReward", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("awards nothing when there is no active round", () => {
    expect(awardDrillReward("notes", GREAT, 0)).toBeNull();
    expect(loadEarnedGear().size).toBe(0);
  });

  it("awards nothing for a discipline outside the active round", () => {
    startRound();
    expect(awardDrillReward("definitely-not-a-discipline", GREAT, 0)).toBeNull();
    expect(loadEarnedGear().size).toBe(0);
  });

  it("grades the first (pick) reward by accuracy: ok=everyday, great=flashy", () => {
    // Rotation starts on picks, so the very first award is always a pick and we
    // can assert the accuracy grading still applies.
    const round = startRound();
    const great = awardDrillReward(round.disciplines[0], GREAT, 0);
    expect(great).not.toBeNull();
    expect(great!.category).toBe("pick");
    expect(pickRewardPool("great").some((p) => p.id === great!.id)).toBe(true);

    localStorage.clear();
    const round2 = startRound();
    const ok = awardDrillReward(round2.disciplines[0], OK, 0);
    expect(ok).not.toBeNull();
    expect(ok!.category).toBe("pick");
    expect(pickRewardPool("ok").some((p) => p.id === ok!.id)).toBe(true);
  });

  it("rotates across gear types so straps and pedals feature as rewards", () => {
    const round = startRound();
    const [d1, d2, d3] = round.disciplines;
    // At level 0 no amp is unlocked, so the rotation lands pick -> strap -> pedal.
    const first = awardDrillReward(d1, OK, 0);
    const second = awardDrillReward(d2, OK, 0);
    const third = awardDrillReward(d3, OK, 0);
    expect(first!.category).toBe("pick");
    expect(second!.category).toBe("strap");
    expect(third!.category).toBe("pedal");
    expect(loadEarnedGear().size).toBe(3);
  });

  it("awards an amp once the player's level has unlocked one", () => {
    const round = startRound();
    const [d1, d2, d3] = round.disciplines;
    // Burn through pick/strap/pedal, then the upgrade lands on the amp slot.
    awardDrillReward(d1, OK, 99); // pick
    awardDrillReward(d2, OK, 99); // strap
    awardDrillReward(d3, OK, 99); // pedal
    const amp = awardDrillReward(d1, GREAT, 99); // upgrade -> amp slot
    expect(amp).not.toBeNull();
    expect(amp!.category).toBe("amp");
  });

  it("does not award the same tier twice for one discipline in a round", () => {
    const round = startRound();
    const d = round.disciplines[0];
    expect(awardDrillReward(d, OK, 0)).not.toBeNull();
    expect(awardDrillReward(d, OK, 0)).toBeNull();
    expect(loadEarnedGear().size).toBe(1);
  });

  it("upgrades from ok to great once, then suppresses further awards", () => {
    const round = startRound();
    const d = round.disciplines[0];
    const ok = awardDrillReward(d, OK, 0);
    const great = awardDrillReward(d, GREAT, 0);
    expect(ok).not.toBeNull();
    expect(great).not.toBeNull();
    expect(great!.id).not.toBe(ok!.id);
    // No further upgrade is possible once great has been granted.
    expect(awardDrillReward(d, GREAT, 0)).toBeNull();
    expect(awardDrillReward(d, OK, 0)).toBeNull();
    expect(loadEarnedGear().size).toBe(2);
  });

  it("does not re-award gear the player already earned", () => {
    const round = startRound();
    const [d1, d2] = round.disciplines;
    const first = awardDrillReward(d1, OK, 0);
    const second = awardDrillReward(d2, OK, 0);
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    expect(second!.id).not.toBe(first!.id);
  });

  it("handles having nothing left to collect without throwing", () => {
    const round = startRound();
    // Pre-mark every gear item as already earned.
    localStorage.setItem(
      "ags.gear.earned.v1",
      JSON.stringify(GEAR.map((g) => g.id)),
    );
    const earnedBefore = loadEarnedGear().size;
    const result = awardDrillReward(round.disciplines[0], GREAT, 99);
    expect(result).toBeNull();
    // Nothing new earned, and no crash.
    expect(loadEarnedGear().size).toBe(earnedBefore);
  });
});
