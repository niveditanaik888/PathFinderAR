import { continueRouteConversation, createConversationState } from "@shared/assistant-conversation";
import { supportedLanguageCodes } from "@shared/i18n";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { readAssistantRouteLaunch } from "@/lib/assistantRouteLaunch";

const navigationSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/TopNav", () => ({ TopNav: () => <div data-testid="top-nav" /> }));
vi.mock("streamdown", () => ({ Streamdown: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    assistant: {
      chat: {
        useMutation: ({ onSuccess }: { onSuccess: (response: unknown) => void }) => ({
          isPending: false,
          mutate: (input: { message: string; language: (typeof supportedLanguageCodes)[number] }) => {
            const response = continueRouteConversation(input.message, createConversationState(input.language));
            onSuccess({ reply: response.reply, conversation: response.state, route: response.route });
          },
        }),
      },
      transcribe: {
        useMutation: () => ({ isPending: false, mutate: vi.fn() }),
      },
    },
  },
}));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/assistant", navigationSpy] };
});

import Assistant from "./Assistant";

afterEach(() => { cleanup(); navigationSpy.mockReset(); sessionStorage.clear(); localStorage.clear(); });

describe("Assistant page verified route actions", () => {
  it("presents the supplied Alvas Robo identity while retaining the assistant controls", () => {
    render(<LanguageProvider><Assistant /></LanguageProvider>);
    expect(screen.getAllByRole("heading", { name: "Alvas Robo" }).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByAltText("Alvas Robo, PathFinder's friendly robotic campus guide").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTestId("voice-input-toggle")).toBeTruthy();
  });

  it.each(supportedLanguageCodes)("persists and navigates a real assistant-selected route from the page in %s", async (language) => {
    localStorage.setItem("aiet-pathfinder-language", language);
    const user = userEvent.setup();
    render(<LanguageProvider><Assistant /></LanguageProvider>);

    const chatInput = screen.getByRole("textbox");
    await user.type(chatInput, "from Main Gate to Central Library");
    await user.keyboard("{Enter}");
    await screen.findByRole("button", { name: "Start voice guidance" });
    await user.click(screen.getByRole("button", { name: "Start voice guidance" }));
    expect(navigationSpy).toHaveBeenLastCalledWith("/map");
    expect(readAssistantRouteLaunch()).toMatchObject({ sourceNodeId: "gate", destinationId: "d10", autoStart: true, voiceOn: true, language });

    await user.click(screen.getByRole("button", { name: "Open map" }));
    expect(readAssistantRouteLaunch()).toMatchObject({ autoStart: false, voiceOn: false, language });
    await user.click(screen.getByRole("button", { name: "AR guidance" }));
    await waitFor(() => expect(navigationSpy.mock.calls.map(([href]) => href)).toEqual(["/map", "/map", "/ar"]));
    console.info(`ASSISTANT_PAGE_ROUTE_HANDOFF_VALIDATED language=${language} route=gate:d10`);
  });

});
