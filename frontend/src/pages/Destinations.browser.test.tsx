import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const navigationSpy = vi.hoisted(() => vi.fn());
const saveFavoriteSpy = vi.hoisted(() => vi.fn());
const removeFavoriteSpy = vi.hoisted(() => vi.fn());
const updateFavoriteSpy = vi.hoisted(() => vi.fn());
const createShareSpy = vi.hoisted(() => vi.fn());
const revokeShareSpy = vi.hoisted(() => vi.fn());
const invalidateSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/TopNav", () => ({ TopNav: () => <div data-testid="top-nav" /> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 11, name: "Campus visitor" } }) }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ favorites: { list: { invalidate: invalidateSpy } } }),
    favorites: {
      list: { useQuery: () => ({ data: [{ id: 7, label: "Main Gate → Central Library", sourceNodeExternalId: "gate", destinationExternalId: "d10", accessibleOnly: false, note: "Collect a book before class", tags: ["study", "morning"] }] }) },
      save: { useMutation: () => ({ mutate: saveFavoriteSpy }) },
      remove: { useMutation: () => ({ mutate: removeFavoriteSpy }) },
      update: { useMutation: () => ({ isPending: false, mutate: updateFavoriteSpy }) },
      createShare: { useMutation: () => ({ isPending: false, mutate: (input: unknown, options?: { onSuccess?: (data: { token: string }) => void }) => { createShareSpy(input); options?.onSuccess?.({ token: "shared-route-token" }); } }) },
      revokeShare: { useMutation: () => ({ isPending: false, mutate: revokeShareSpy }) },
    },
  },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/destinations", navigationSpy] };
});

import Destinations from "./Destinations";

afterEach(() => {
  cleanup();
  navigationSpy.mockReset();
  saveFavoriteSpy.mockReset();
  removeFavoriteSpy.mockReset();
  updateFavoriteSpy.mockReset();
  createShareSpy.mockReset();
  revokeShareSpy.mockReset();
  invalidateSpy.mockReset();
  sessionStorage.clear();
});

describe("Destinations favourite routes", () => {
  it("keeps the selected source when opening a destination route", async () => {
    const user = userEvent.setup();
    render(<Destinations />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Starting point" }), "cafe");
    expect(screen.getByText(/Available destinations from Cafeteria/)).toBeTruthy();
    await user.click(screen.getAllByRole("button", { name: "View route" })[0]);

    expect(sessionStorage.getItem("aiet-source")).toBe("cafe");
    expect(sessionStorage.getItem("pathfinder-destination")).toBeTruthy();
    expect(navigationSpy).toHaveBeenLastCalledWith(expect.stringMatching(/^\/map\?source=cafe&destination=d\d+$/));
  });

  it("saves a configured route from a destination card", async () => {
    const user = userEvent.setup();
    render(<Destinations />);

    await user.click(screen.getByRole("button", { name: "Save route to AI Lab" }));

    expect(saveFavoriteSpy).toHaveBeenCalledWith({
      label: "Main Gate → AI Lab",
      sourceNodeExternalId: "gate",
      destinationExternalId: "d7",
      accessibleOnly: false,
    });
  });

  it("reopens and removes a saved route from the route-planning workflow", async () => {
    const user = userEvent.setup();
    render(<Destinations />);

    const savedRouteLaunch = screen.getByText("Main Gate → Central Library").closest("button");
    expect(savedRouteLaunch).toBeTruthy();
    await user.click(savedRouteLaunch!);
    expect(sessionStorage.getItem("aiet-source")).toBe("gate");
    expect(sessionStorage.getItem("pathfinder-destination")).toBe("d10");
    expect(navigationSpy).toHaveBeenCalledWith("/map?source=gate&destination=d10");

    await user.click(screen.getByRole("button", { name: "Remove Main Gate → Central Library" }));
    expect(removeFavoriteSpy).toHaveBeenCalledWith({ favoriteId: 7 });
  });

  it("saves a private note and normalized tags, then filters routes by a tag", async () => {
    const user = userEvent.setup();
    render(<Destinations />);

    const note = screen.getByRole("textbox", { name: "Note for Main Gate → Central Library" });
    await user.clear(note);
    await user.type(note, "Meet study group at entrance");
    const tags = screen.getByRole("textbox", { name: "Tags for Main Gate → Central Library" });
    await user.clear(tags);
    await user.type(tags, "Study, Morning");
    await user.click(screen.getByRole("button", { name: "Save details" }));

    expect(updateFavoriteSpy).toHaveBeenCalledWith({ favoriteId: 7, note: "Meet study group at entrance", tags: ["Study", "Morning"] });
    await user.type(screen.getByRole("textbox", { name: "Filter saved routes by tag" }), "study");
    expect(screen.getByText("Main Gate → Central Library")).toBeTruthy();
  }, 15000);

  it("generates a shareable link and QR presentation only after explicit annotation consent", async () => {
    const user = userEvent.setup();
    render(<Destinations />);

    await user.click(screen.getByRole("checkbox", { name: "Include notes and tags for Main Gate → Central Library" }));
    await user.click(screen.getByRole("button", { name: "Generate link" }));

    expect(createShareSpy).toHaveBeenCalledWith({ favoriteId: 7, includeAnnotations: true });
    expect(screen.getByText(/\/shared\/shared-route-token/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Open" }).getAttribute("href")).toContain("/shared/shared-route-token");
    expect(document.querySelector("svg[role='img']")).toBeTruthy();
  });
});
