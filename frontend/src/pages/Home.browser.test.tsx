import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";

const navigationSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/TopNav", () => ({ TopNav: () => <div data-testid="top-nav" /> }));
vi.mock("@/components/AlvasCampusShowcase", () => ({ AlvasCampusShowcase: () => <div data-testid="campus-lens" /> }));
vi.mock("@/lib/trpc", () => ({ trpc: { campus: { media: { useQuery: () => ({ data: [] }) } } } }));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/", navigationSpy] };
});

import Home from "./Home";

afterEach(() => {
  cleanup();
  navigationSpy.mockReset();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  localStorage.clear();
});

describe("cinematic Home page", () => {
  it("falls back from the campus video to the supplied AIET image when media cannot play", () => {
    render(<LanguageProvider><Home /></LanguageProvider>);
    fireEvent.error(screen.getByLabelText("AIET campus highlights"));
    expect(screen.getByAltText("AIET academic block")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Campus image fallback" })).toBeTruthy();
  });

  it("presents the hero video with a brighter high-definition visual treatment", () => {
    render(<LanguageProvider><Home /></LanguageProvider>);
    const video = screen.getByLabelText("AIET campus highlights");
    expect(video.getAttribute("preload")).toBe("auto");
    expect(video.className).toContain("hero-campus-video");
    expect(document.querySelector(".hero-video-light")).toBeTruthy();
  });

  it("lets visitors pause and resume the cinematic campus video", async () => {
    const pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => undefined);
    const play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LanguageProvider><Home /></LanguageProvider>);

    await user.click(screen.getByRole("button", { name: "Pause campus video" }));
    expect(pause).toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Play campus video" })).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Play campus video" }));
    expect(play).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("button", { name: "Pause campus video" })).toBeTruthy());
  });

  it("hands a selected configured source and destination to the live map", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><Home /></LanguageProvider>);
    await user.selectOptions(screen.getByLabelText("To"), "d11");
    await user.click(screen.getByRole("button", { name: "Start navigation" }));
    expect(sessionStorage.getItem("aiet-source")).toBe("gate");
    expect(sessionStorage.getItem("pathfinder-destination")).toBe("d11");
    expect(navigationSpy).toHaveBeenCalledWith("/map?source=gate&destination=d11");
  });

  it("presents the balanced campus hero actions without removing planner access", () => {
    render(<LanguageProvider><Home /></LanguageProvider>);
    const heroCopy = within(screen.getByTestId("hero-copy"));
    expect(screen.getByRole("heading", { name: /Explore AIET.*Find Your Way/i })).toBeTruthy();
    expect(heroCopy.getByRole("link", { name: /Explore Campus/i }).getAttribute("href")).toBe("#explore");
    expect(heroCopy.getByRole("link", { name: /Plan Your Route/i }).getAttribute("href")).toBe("/destinations");
    expect(heroCopy.getByRole("link", { name: /AR guidance/i }).getAttribute("href")).toBe("/ar");
  });

  it("keeps the hero balanced and exposes the destination search controls", () => {
    render(<LanguageProvider><Home /></LanguageProvider>);

    const heroCopy = screen.getByTestId("hero-copy");
    expect(heroCopy.className).toContain("max-w-lg");
    expect(screen.getByAltText("Alva's Education Foundation official logo")).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Everything you need.*move with confidence/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Explore Campus" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Interactive 2D Map" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "AR Navigation" })).toBeTruthy();
    expect(screen.getByLabelText("Search buildings, departments, labs or facilities")).toBeTruthy();
    expect(screen.getByRole("button", { name: "All destinations" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: /Everything you need.*move with confidence/i })).toBeTruthy();
  });

  it("filters configured destinations by category and clears the search query", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><Home /></LanguageProvider>);

    const searchPanel = within(screen.getByTestId("destination-search"));
    await user.click(searchPanel.getByRole("button", { name: "Academic" }));
    expect(searchPanel.getByText("Computer Science Department")).toBeTruthy();
    expect(searchPanel.queryByText("Central Library")).toBeNull();

    const search = screen.getByLabelText("Search buildings, departments, labs or facilities");
    await user.type(search, "library");
    expect(screen.getByRole("button", { name: "Clear destination search" })).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Clear destination search" }));
    expect((search as HTMLInputElement).value).toBe("");
  });

  it("plays the English route sample and presents first-run Tulu navigation prompts", async () => {
    const speak = vi.fn();
    vi.stubGlobal("speechSynthesis", { cancel: vi.fn(), speak });
    vi.stubGlobal("SpeechSynthesisUtterance", class {
      lang = "";
      rate = 1;
      onend: (() => void) | null = null;
      constructor(public text: string) {}
    });
    const user = userEvent.setup();
    render(<LanguageProvider><Home /></LanguageProvider>);

    await user.selectOptions(screen.getByLabelText("Preview language"), "tcy");
    expect(await screen.findByText("ತುಳುದ ಮಧಿಪ್ಪ್ ದಾರಿ ಕಲ್ಪನೆ")).toBeTruthy();
    expect(screen.getByText(/ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯದ ದಾರಿ ತೋರ್ಸೆ/)).toBeTruthy();
    expect(screen.getByText(/ಮುಖ್ಯ ದ್ವಾರದಿಂದ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ/)).toBeTruthy();
    expect(screen.getByText(/ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ/)).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Hear an English route sample" }));
    expect(speak).toHaveBeenCalledTimes(1);
    expect(speak.mock.calls[0][0]).toMatchObject({ text: "Turn left in 30 metres.", lang: "en-IN" });
    expect(screen.getByText("Playing the English route sample.")).toBeTruthy();
  });

  it("explains the readable English fallback when browser audio is unavailable", async () => {
    const user = userEvent.setup();
    render(<LanguageProvider><Home /></LanguageProvider>);

    await user.click(screen.getByRole("button", { name: "Hear an English route sample" }));
    expect(screen.getByText("English audio sample is unavailable in this browser. You can still read the English route prompt.")).toBeTruthy();
  });
});
