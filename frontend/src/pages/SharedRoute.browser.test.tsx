import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { readAssistantRouteLaunch } from "@/lib/assistantRouteLaunch";

const navigationSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/TopNav", () => ({ TopNav: () => <div data-testid="top-nav" /> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    sharedRoutes: {
      resolve: {
        useQuery: () => ({
          data: {
            label: "Main Gate → Central Library",
            sourceNodeExternalId: "gate",
            destinationExternalId: "d10",
            accessibleOnly: true,
            note: "Use the accessible entrance.",
            tags: ["study"],
          },
          isLoading: false,
          isError: false,
        }),
      },
    },
  },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return {
    ...actual,
    useLocation: () => ["/shared/demo-token", navigationSpy],
    useRoute: () => [true, { token: "demo-token" }],
  };
});

import SharedRoute from "./SharedRoute";

afterEach(() => {
  cleanup();
  navigationSpy.mockReset();
  sessionStorage.clear();
});

describe("SharedRoute", () => {
  it("shows only share-approved route details and hands the route off to the map without auto-starting navigation", async () => {
    const user = userEvent.setup();
    render(<SharedRoute />);

    expect(screen.getByText("Main Gate → Central Library")).toBeTruthy();
    expect(screen.getByText("Use the accessible entrance.")).toBeTruthy();
    expect(screen.getByText("#study")).toBeTruthy();
    expect(screen.getByText(/route details only/i)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: /open route on map/i }));

    expect(readAssistantRouteLaunch()).toEqual({
      sourceNodeId: "gate",
      destinationId: "d10",
      accessibleOnly: true,
      autoStart: false,
      voiceOn: false,
      language: "en",
    });
    expect(navigationSpy).toHaveBeenCalledWith("/map");
  });
});
