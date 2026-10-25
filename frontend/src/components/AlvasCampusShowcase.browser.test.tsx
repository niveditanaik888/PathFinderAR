import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigationSpy = vi.hoisted(() => vi.fn());

vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/", navigationSpy] };
});

import { AlvasCampusShowcase } from "./AlvasCampusShowcase";

afterEach(() => {
  cleanup();
  navigationSpy.mockReset();
  sessionStorage.clear();
});

describe("Alvas campus gallery", () => {
  it("renders six authentic campus photographs individually without the old group showcase", () => {
    render(<AlvasCampusShowcase />);
    expect(screen.getByText("Six supplied AIET building and grounds photographs")).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /Open larger view:/i })).toHaveLength(6);
    expect(screen.queryByText("Campus community")).toBeNull();
  });

  it("opens the viewer, navigates next and previous, and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<AlvasCampusShowcase />);

    await user.click(screen.getByRole("button", { name: "Open larger view: Entire Campus Overview" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Entire Campus Overview" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Next campus photograph" }));
    expect(screen.getByRole("heading", { name: "Engineering Block Aerial" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Previous campus photograph" }));
    expect(screen.getByRole("heading", { name: "Entire Campus Overview" })).toBeTruthy();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("offers a route handoff only for a verified photograph destination", async () => {
    const user = userEvent.setup();
    render(<AlvasCampusShowcase />);

    await user.click(screen.getByRole("button", { name: "Open larger view: Main Entrance" }));
    expect(screen.getByRole("button", { name: "Find on Map" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Find on Map" }));
    expect(sessionStorage.getItem("pathfinder-destination")).toBe("d1");
    expect(navigationSpy).toHaveBeenCalledWith("/map");

    await user.click(screen.getByRole("button", { name: "Open larger view: Entire Campus Overview" }));
    expect(screen.queryByRole("button", { name: "Find on Map" })).toBeNull();
  });
});
