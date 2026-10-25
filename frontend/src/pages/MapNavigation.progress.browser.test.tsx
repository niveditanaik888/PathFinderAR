import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";

const startSessionSpy = vi.hoisted(() => vi.fn());
const updateProgressSpy = vi.hoisted(() => vi.fn());
const watchPositionSpy = vi.hoisted(() => vi.fn());
const clearWatchSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/TopNav", () => ({ TopNav: () => <div data-testid="top-nav" /> }));
vi.mock("@/components/CampusMap", () => ({ CampusMap: () => <div data-testid="campus-map" /> }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { id: 9, name: "Signed-in navigator" } }) }));
vi.mock("@/lib/browserSpeech", () => ({ speakText: vi.fn() }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    routing: {
      startSession: { useMutation: (options: { onSuccess?: (value: { routeId: number }) => void }) => ({ mutate: (input: unknown) => { startSessionSpy(input); options.onSuccess?.({ routeId: 41 }); } }) },
      completeSession: { useMutation: () => ({ mutate: vi.fn() }) },
      updateProgress: { useMutation: () => ({ mutate: updateProgressSpy, isPending: false }) },
      recordDeviation: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    favorites: {
      list: { useQuery: () => ({ data: [] }) },
      save: { useMutation: () => ({ mutate: vi.fn() }) },
      remove: { useMutation: () => ({ mutate: vi.fn() }) },
    },
    useUtils: () => ({ favorites: { list: { invalidate: vi.fn() } } }),
  },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/map", vi.fn()] };
});

import MapNavigation from "./MapNavigation";

let watchCallback: PositionCallback | undefined;

function createPosition(latitude: number, longitude: number): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
      accuracy: 6,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: Date.now(),
    toJSON: () => ({}),
  } as GeolocationPosition;
}

beforeEach(() => {
  watchPositionSpy.mockImplementation((success: PositionCallback) => { watchCallback = success; return 73; });
  Object.defineProperty(navigator, "geolocation", {
    configurable: true,
    value: { getCurrentPosition: vi.fn(), watchPosition: watchPositionSpy, clearWatch: clearWatchSpy },
  });
  sessionStorage.clear();
  sessionStorage.setItem("aiet-source", "gate");
  sessionStorage.setItem("pathfinder-destination", "d7");
});

afterEach(() => {
  cleanup();
  startSessionSpy.mockReset();
  updateProgressSpy.mockReset();
  watchPositionSpy.mockReset();
  clearWatchSpy.mockReset();
  watchCallback = undefined;
  sessionStorage.clear();
});

describe("MapNavigation live progress", () => {
  it("watches permitted location updates and persists completed route progress for the signed-in navigator", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><MapNavigation /></LanguageProvider>);

    await user.click(screen.getByRole("button", { name: "Start navigation" }));
    await waitFor(() => expect(startSessionSpy).toHaveBeenCalled());
    await waitFor(() => expect(watchPositionSpy).toHaveBeenCalled());
    const progressbar = screen.getByRole("progressbar", { name: "Route progress: 0%" });
    expect(progressbar.firstElementChild?.className).toContain("transition-[width]");

    await act(async () => { watchCallback?.(createPosition(13.02156, 74.98203)); });

    await waitFor(() => expect(updateProgressSpy).toHaveBeenCalledWith(expect.objectContaining({
      routeId: 41,
      navigationState: "completed",
      currentWaypointIndex: expect.any(Number),
      totalWaypoints: expect.any(Number),
      remainingDistance: 0,
    })));
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("100");
  });
});
