import { describe, expect, it } from "vitest";
import { getAssistantErrorTranslationKey } from "./assistant-errors";

describe("assistant error-state mapping", () => {
  it("shows the dedicated unsupported-language state for rejected assistant inputs", () => {
    expect(getAssistantErrorTranslationKey("PRECONDITION_FAILED")).toBe("assistantUnsupportedLanguage");
  });

  it("keeps service failures distinct from rejected assistant inputs", () => {
    expect(getAssistantErrorTranslationKey("INTERNAL_SERVER_ERROR")).toBe("assistantError");
    expect(getAssistantErrorTranslationKey("BAD_REQUEST")).toBe("assistantError");
  });
});
