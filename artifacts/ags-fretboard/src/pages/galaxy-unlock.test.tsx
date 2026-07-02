import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GUITARS } from "@/data/guitars";

// The unlock celebration is driven by the Galaxy page: on a level-up it filters
// GUITARS down to the axes whose unlockLevel falls inside the gained range and
// feeds them, one at a time, to <UnlockAnimation />. We mock the generated React
// Query hooks so the page renders deterministically without a network layer.
// A free (non-premium) player is used on purpose: their level-up skips the
// cinematic launch sequence and queues the unlock celebration directly, which is
// exactly the flow under test here.
interface Summary {
  xp: number;
  level: number;
  belt: string;
  streak: number;
  totalChallenges: number;
  todayChallenges: number;
  weeklyXp: number;
  accuracyRate: number;
  solarSystem: number;
  planet: number;
  xpToNextLevel: number;
  questsCompleted: number;
  questsTotal: number;
  isPremium: boolean;
}

const baseSummary: Summary = {
  xp: 120,
  level: 1,
  belt: "white",
  streak: 4,
  totalChallenges: 10,
  todayChallenges: 2,
  weeklyXp: 300,
  accuracyRate: 0.8,
  solarSystem: 1,
  planet: 1,
  xpToNextLevel: 80,
  questsCompleted: 1,
  questsTotal: 3,
  isPremium: false,
};

const summaryRef = { current: { ...baseSummary } };

function setLevel(level: number) {
  summaryRef.current = { ...baseSummary, level };
}

vi.mock("@workspace/api-client-react", () => ({
  useGetProfileSummary: () => ({ data: summaryRef.current }),
  useGetDailyQuests: () => ({ data: [], isLoading: false }),
  useGetRecentActivity: () => ({ data: [], isLoading: false }),
  useUpdateTrail: () => ({ mutate: vi.fn() }),
}));

import Galaxy from "./galaxy";

const LAST_LEVEL_KEY = "ags.galaxy.lastLevel.v1";

function guitarName(unlockLevel: number): string {
  const g = GUITARS.find((x) => x.unlockLevel === unlockLevel);
  if (!g) throw new Error(`No guitar fixture unlocks at level ${unlockLevel}`);
  return g.name;
}

// The celebration overlay always renders this caption; presence/absence of it
// is a reliable signal for "is the unlock celebration on screen?".
function celebrationVisible(): boolean {
  return screen.queryByText(/new guitar unlocked/i) !== null;
}

// Simulates the player arriving at the Galaxy Map having previously been seen at
// `from`, now at `to` — i.e. a level-up that gained `to - from` levels.
function renderLevelUp(from: number, to: number) {
  localStorage.setItem(LAST_LEVEL_KEY, String(from));
  setLevel(to);
  return render(<Galaxy />);
}

describe("Galaxy guitar unlock celebration", () => {
  beforeEach(() => {
    localStorage.clear();
    setLevel(1);
  });

  it("celebrates exactly the guitars whose unlock level falls in the gained range", () => {
    // Level 1 -> 3 crosses unlock levels 2 (Comet Cruiser) and 3 (Asteroid Axe).
    renderLevelUp(1, 3);

    expect(celebrationVisible()).toBe(true);
    // First card is the lowest newly-unlocked guitar.
    expect(
      screen.getByRole("heading", { name: new RegExp(guitarName(2), "i") }),
    ).toBeInTheDocument();
    // Two guitars in the queue -> a "1 / 2" progress counter is shown.
    expect(screen.getByText(/1 \/ 2/)).toBeInTheDocument();

    // A guitar the player already owned (unlock level 1) is NOT celebrated...
    expect(
      screen.queryByRole("heading", { name: new RegExp(guitarName(1), "i") }),
    ).not.toBeInTheDocument();
    // ...nor is one beyond the gained range (unlock level 4).
    expect(
      screen.queryByRole("heading", { name: new RegExp(guitarName(4), "i") }),
    ).not.toBeInTheDocument();
  });

  it("steps through each newly unlocked guitar in order, then dismisses the queue", async () => {
    const user = userEvent.setup();
    renderLevelUp(1, 3);

    // Card 1 of 2: Comet Cruiser (unlock level 2).
    const first = screen.getByRole("heading", { name: new RegExp(guitarName(2), "i") });
    expect(first).toBeInTheDocument();

    // Tapping the overlay advances to the next guitar.
    await user.click(first);

    // Card 2 of 2: Asteroid Axe (unlock level 3).
    expect(
      screen.getByRole("heading", { name: new RegExp(guitarName(3), "i") }),
    ).toBeInTheDocument();
    expect(screen.getByText(/2 \/ 2/)).toBeInTheDocument();
    expect(celebrationVisible()).toBe(true);

    // Tapping again past the last guitar dismisses the celebration entirely.
    await user.click(screen.getByRole("heading", { name: new RegExp(guitarName(3), "i") }));

    expect(celebrationVisible()).toBe(false);
    expect(
      screen.queryByRole("heading", { name: new RegExp(guitarName(3), "i") }),
    ).not.toBeInTheDocument();
  });

  it("celebrates a single guitar without a progress counter and dismisses on one tap", async () => {
    const user = userEvent.setup();
    // Level 7 -> 8 crosses only unlock level 8 (Quasar Quake).
    renderLevelUp(7, 8);

    expect(celebrationVisible()).toBe(true);
    const card = screen.getByRole("heading", { name: new RegExp(guitarName(8), "i") });
    expect(card).toBeInTheDocument();
    // A lone unlock shows just "Tap to continue" with no "x / y" counter prefix.
    expect(screen.getByText(/tap to continue/i).textContent).not.toMatch(/\d+ \/ \d+/);

    await user.click(card);
    expect(celebrationVisible()).toBe(false);
  });

  it("does not celebrate when a level-up crosses no guitar unlock levels", () => {
    // No guitar unlocks at level 7, so gaining 6 -> 7 unlocks nothing.
    expect(GUITARS.some((g) => g.unlockLevel === 7)).toBe(false);
    renderLevelUp(6, 7);

    expect(celebrationVisible()).toBe(false);
  });

  it("does not celebrate on the very first ever visit (no prior level recorded)", () => {
    // No LAST_LEVEL_KEY -> first visit; pre-existing unlocks must not be celebrated.
    setLevel(5);
    render(<Galaxy />);

    expect(celebrationVisible()).toBe(false);
    expect(localStorage.getItem(LAST_LEVEL_KEY)).toBe("5");
  });
});
