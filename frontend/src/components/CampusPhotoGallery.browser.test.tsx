import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigationSpy = vi.hoisted(() => vi.fn());

vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/", navigationSpy] };
});

import { CampusPhotoGallery } from "./CampusPhotoGallery";

afterEach(() => { cleanup(); navigationSpy.mockReset(); sessionStorage.clear(); });

describe("CampusPhotoGallery", () => {
  it("uses the supplied group photograph, exposes visual filters, and preserves route handoffs only for existing destinations", async () => {
    const user = userEvent.setup();
    render(<CampusPhotoGallery />);
    expect(screen.getByAltText("Students and staff gathered at the AIET campus")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "New Building" }));
    expect(screen.getByText("New Building Mini Fountain")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "All" }));
    await user.click(screen.getByRole("button", { name: "View Main Library image" }));
    expect(screen.getByRole("button", { name: "Plan configured route" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Plan configured route" }));
    expect(sessionStorage.getItem("pathfinder-destination")).toBe("d10");
    expect(navigationSpy).toHaveBeenCalledWith("/map");
  });

  it("does not offer a route action for an unsurveyed interior visual", async () => {
    const user = userEvent.setup();
    render(<CampusPhotoGallery />);
    await user.click(screen.getByRole("button", { name: "New Building" }));
    await user.click(screen.getByRole("button", { name: "View New Building Mini Fountain image" }));
    expect(screen.queryByRole("button", { name: "Plan configured route" })).toBeNull();
    expect(screen.getByText(/No verified destination handoff is configured/i)).toBeTruthy();
  });

  it("filters the compact archive by meaningful photo groups and restores all photos", async () => {
    const user = userEvent.setup();
    render(<CampusPhotoGallery />);
    expect(screen.getAllByRole("article").length).toBeGreaterThan(1);
    await user.click(screen.getByRole("button", { name: "CSE Department" }));
    expect(screen.getAllByRole("article").length).toBe(40);
    expect(screen.getByText("CSE Department — Submitted Photo 01")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Campus Buildings" }));
    expect(screen.getAllByRole("article").length).toBeGreaterThan(0);
    await user.click(screen.getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("article").length).toBeGreaterThan(1);
  });
});
