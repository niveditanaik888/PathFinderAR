import { describe, expect, it } from "vitest";
import { supportedLanguageCodes } from "@shared/i18n";
import { createAssistantRouteLaunch, resolveMapRouteLaunchState } from "./assistantRouteLaunch";

describe("assistant route launch", () => {
  it("preserves the route and voice-start choices passed to map navigation", () => {
    expect(createAssistantRouteLaunch({ sourceNodeId: "gate", destinationId: "d10", accessibleOnly: true, autoStart: true, voiceOn: true, language: "kn" })).toEqual({
      sourceNodeId: "gate", destinationId: "d10", accessibleOnly: true, autoStart: true, voiceOn: true, language: "kn",
    });
  });

  it("normalizes optional launch flags to booleans", () => {
    expect(createAssistantRouteLaunch({ sourceNodeId: "parking", destinationId: "d7", accessibleOnly: false, autoStart: false, voiceOn: false, language: "en" }).voiceOn).toBe(false);
  });

  it("preserves the selected language for every supported spoken-guidance launch", () => {
    for (const language of supportedLanguageCodes) {
      expect(createAssistantRouteLaunch({ sourceNodeId: "gate", destinationId: "d10", accessibleOnly: false, autoStart: true, voiceOn: true, language }).language).toBe(language);
    }
  });

  it("provides map navigation with the exact assistant-selected route and spoken language", () => {
    const launch = createAssistantRouteLaunch({ sourceNodeId: "gate", destinationId: "d10", accessibleOnly: true, autoStart: true, voiceOn: true, language: "ml" });
    expect(resolveMapRouteLaunchState(launch, { sourceNodeId: "parking", destinationId: "d7" })).toEqual({ sourceNodeId: "gate", destinationId: "d10", accessibleOnly: true, voiceOn: true, language: "ml", autoStart: true });
  });

  it("uses safe defaults when map navigation was not opened from the assistant", () => {
    expect(resolveMapRouteLaunchState(undefined, { sourceNodeId: "gate", destinationId: "d7" })).toEqual({ sourceNodeId: "gate", destinationId: "d7", accessibleOnly: false, voiceOn: false, language: "en", autoStart: false });
  });
});
