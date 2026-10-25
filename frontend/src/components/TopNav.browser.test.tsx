import { cleanup, render, screen, within } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "@/contexts/LanguageContext";

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ isAuthenticated: false, logout: vi.fn() }) }));
vi.mock("@/components/TuluVoiceSampleButton", () => ({ TuluVoiceSampleButton: () => <button aria-label="Tulu sample" /> }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("wouter", async () => {
  const actual = await vi.importActual<typeof import("wouter")>("wouter");
  return { ...actual, useLocation: () => ["/", vi.fn()] };
});

import { TopNav } from "./TopNav";

afterEach(cleanup);

describe("TopNav Alvas Robo entry", () => {
  it("keeps Alvas Robo outside the desktop main-navigation list and at the utility end", () => {
    render(<LanguageProvider><TopNav transparent /></LanguageProvider>);
    const roboLink = screen.getByRole("link", { name: "Open Alvas Robo assistant" });
    expect(roboLink.getAttribute("href")).toBe("/assistant");
    expect(within(screen.getByRole("navigation", { name: "Main navigation" })).queryByText("Alvas Robo")).toBeNull();
    expect(screen.getByText("Alvas Robo")).toBeTruthy();
    expect(screen.getByRole("banner").className).toContain("bg-[#2b0f16]/95");
  });
});
