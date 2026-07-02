import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The Galaxy page reads the player's level/quests/activity through generated
// React Query hooks. We mock that module so the page renders deterministically
// without a network layer or a QueryClientProvider.
interface Summary {
  isPremium: boolean;
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
  fullAccess: boolean;
}

// Cinematic launches are a premium-only feature, so the mock player is premium
// to exercise that UI (toggle + launch overlay).
const baseSummary: Summary = {
  isPremium: true,
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
  fullAccess: false,
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
const CINEMATIC_KEY = "ags.galaxy.cinematic.v1";

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

// The cinematic launch overlay is the only fixed full-screen layer the page
// renders; we identify it by its high z-index inline style.
function launchOverlay(): HTMLElement | null {
  return document.querySelector('[class*="z-[210]"]') as HTMLElement | null;
}

describe("Galaxy cinematic toggle", () => {
  beforeEach(() => {
    localStorage.clear();
    setReducedMotion(false);
    setLevel(1);
  });

  it("defaults to Cinematic On and persists the choice when toggled off", async () => {
    const user = userEvent.setup();
    render(<Galaxy />);

    const toggle = screen.getByRole("button", { name: /cinematic/i });
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    expect(toggle).toHaveTextContent(/cinematic on/i);

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-pressed", "false");
    expect(toggle).toHaveTextContent(/cinematic off/i);
    // Persisted as "0" (off) in localStorage.
    expect(localStorage.getItem(CINEMATIC_KEY)).toBe("0");
  });

  it("restores a previously-saved Cinematic Off preference on mount", () => {
    localStorage.setItem(CINEMATIC_KEY, "0");
    render(<Galaxy />);
    const toggle = screen.getByRole("button", { name: /cinematic/i });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });
});

describe("Galaxy launch sequence gating on level-up", () => {
  beforeEach(() => {
    localStorage.clear();
    setReducedMotion(false);
  });

  it("plays the cinematic launch on a level-up when Cinematic Mode is on", () => {
    // A prior visit recorded level 1; the player is now level 2 -> level-up.
    localStorage.setItem(LAST_LEVEL_KEY, "1");
    localStorage.setItem(CINEMATIC_KEY, "1");
    setLevel(2);

    render(<Galaxy />);

    expect(launchOverlay()).not.toBeNull();
  });

  it("skips the launch sequence on a level-up when Cinematic Mode is off", () => {
    localStorage.setItem(LAST_LEVEL_KEY, "1");
    localStorage.setItem(CINEMATIC_KEY, "0");
    setLevel(2);

    render(<Galaxy />);

    expect(launchOverlay()).toBeNull();
  });

  it("skips the launch sequence on a level-up when reduced motion is preferred", () => {
    localStorage.setItem(LAST_LEVEL_KEY, "1");
    localStorage.setItem(CINEMATIC_KEY, "1");
    setReducedMotion(true);
    setLevel(2);

    render(<Galaxy />);

    expect(launchOverlay()).toBeNull();
  });

  it("does not celebrate pre-existing progress on the very first ever visit", () => {
    // No LAST_LEVEL_KEY stored -> first visit; level should just be recorded.
    setLevel(5);

    render(<Galaxy />);

    expect(launchOverlay()).toBeNull();
    expect(localStorage.getItem(LAST_LEVEL_KEY)).toBe("5");
  });
});
