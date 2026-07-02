import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MissionPanel from "./mission-panel";
import { buildSolarSystem } from "@/lib/galaxyProgression";
import type { DashboardSummary } from "@workspace/api-client-react";

const summary: DashboardSummary = {
  isPremium: true,
  fullAccess: false,
  xp: 120,
  level: 3,
  belt: "white",
  streak: 4,
  totalChallenges: 10,
  todayChallenges: 2,
  weeklyXp: 300,
  accuracyRate: 0.8,
  solarSystem: 1,
  planet: 3,
  xpToNextLevel: 80,
  questsCompleted: 1,
  questsTotal: 3,
  trailFlags: { findingNotesViewed: false, intervalsViewed: false, practiceStarted: false, scaleLessonViewed: false, chordLessonViewed: false },
};

function renderPanel(planetIndex: number, opts: { canLaunch?: boolean; onLaunch?: () => void } = {}) {
  // System 1 with the player at level 3: planets 1-2 completed, 3 current, 4+ locked.
  const planet = buildSolarSystem(1, 3).planets[planetIndex - 1];
  const onLaunch = opts.onLaunch ?? vi.fn();
  render(
    <MissionPanel
      planet={planet}
      summary={summary}
      quests={[]}
      recent={[]}
      isLoadingQuests={false}
      isLoadingRecent={false}
      canLaunch={opts.canLaunch ?? false}
      onLaunch={onLaunch}
    />,
  );
  return { onLaunch, planet };
}

describe("MissionPanel planet states", () => {
  it("shows the current objective and a Launch button for the current planet", () => {
    renderPanel(3);
    expect(screen.getByText(/current objective · level 3/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /launch/i })).toBeInTheDocument();
  });

  it("shows a cleared badge and no launch button for a completed planet", () => {
    renderPanel(1);
    expect(screen.getByText(/cleared · level 1/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument();
  });

  it("shows the unlock requirement and a beyond-reach notice for a locked planet", () => {
    renderPanel(5);
    expect(screen.getAllByText(/reach level 5/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/still beyond your reach/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /launch/i })).not.toBeInTheDocument();
  });

  it("labels the boss planet and its launch button", () => {
    // Player at level 10 -> the boss (planet 10) is the current planet.
    const planet = buildSolarSystem(1, 10).planets[9];
    render(
      <MissionPanel
        planet={planet}
        summary={{ ...summary, level: 10 }}
        quests={[]}
        recent={[]}
        isLoadingQuests={false}
        isLoadingRecent={false}
        canLaunch={false}
        onLaunch={vi.fn()}
      />,
    );
    // The boss position is named "Distortion Core" but still renders as current.
    expect(screen.getByRole("heading", { name: /distortion core/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /launch/i })).toBeInTheDocument();
  });

  it("calls onLaunch when the current planet's launch button is pressed", async () => {
    const user = userEvent.setup();
    const { onLaunch } = renderPanel(3);
    await user.click(screen.getByRole("button", { name: /launch/i }));
    expect(onLaunch).toHaveBeenCalledTimes(1);
  });

  it('shows "Replay launch" when a fresh level-up is available', () => {
    renderPanel(3, { canLaunch: true });
    expect(screen.getByRole("button", { name: /replay launch/i })).toBeInTheDocument();
  });
});
