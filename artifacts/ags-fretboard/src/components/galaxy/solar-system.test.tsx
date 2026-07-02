import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SolarSystem from "./solar-system";
import { buildSolarSystem } from "@/lib/galaxyProgression";

function renderSystem(focusIndex = 3) {
  const planets = buildSolarSystem(1, 3).planets;
  const onFocus = vi.fn();
  render(
    <SolarSystem
      planets={planets}
      focusIndex={focusIndex}
      onFocus={onFocus}
      instant
    />,
  );
  return { onFocus, planets };
}

describe("SolarSystem focus interactions", () => {
  it("renders one option per planet inside a listbox", () => {
    renderSystem();
    expect(screen.getByRole("listbox", { name: /solar system planets/i })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(10);
  });

  it("focuses a planet when it is clicked", async () => {
    const user = userEvent.setup();
    const { onFocus } = renderSystem();

    // Planet at index 5 -> aria-label "Octave Gate, level 5, locked".
    const planet5 = screen.getByRole("option", { name: /Octave Gate, level 5/i });
    await user.click(planet5);

    expect(onFocus).toHaveBeenCalledWith(5);
  });

  it("moves focus with the arrow keys", async () => {
    const user = userEvent.setup();
    const { onFocus } = renderSystem(3);

    const stage = screen.getByRole("listbox", { name: /solar system planets/i });
    stage.focus();

    await user.keyboard("{ArrowRight}");
    expect(onFocus).toHaveBeenLastCalledWith(4);

    await user.keyboard("{ArrowLeft}");
    expect(onFocus).toHaveBeenLastCalledWith(2);
  });

  it("clamps keyboard navigation at the first and last planet", async () => {
    const user = userEvent.setup();

    // At planet 1, ArrowLeft should stay at 1.
    const { onFocus, planets } = renderSystem(1);
    const stage = screen.getByRole("listbox", { name: /solar system planets/i });
    stage.focus();
    await user.keyboard("{ArrowLeft}");
    expect(onFocus).toHaveBeenLastCalledWith(1);
    expect(planets).toHaveLength(10);
  });

  it("marks the focused planet as selected", () => {
    renderSystem(3);
    const planet3 = screen.getByRole("option", { name: /Soundhole Drift, level 3/i });
    expect(planet3).toHaveAttribute("aria-selected", "true");
  });
});
