import { describe, expect, it } from "vitest";
import { supportedLanguageCodes } from "./i18n";
import { createLocalizedVoiceGuidance } from "./voice-guidance";

describe("localized voice guidance", () => {
  it("produces route-linked start, continuation, and arrival guidance for every supported language", () => {
    for (const language of supportedLanguageCodes) {
      const guidance = createLocalizedVoiceGuidance(["Main Gate", "Reception Plaza", "Central Library"], language);
      expect(guidance).toHaveLength(3);
      expect(guidance[0]).toContain("Main Gate");
      expect(guidance[2]).toContain("Central Library");
    }
  });

  it("uses the dedicated Tulu guidance template", () => {
    const guidance = createLocalizedVoiceGuidance(["Main Gate", "Central Library"], "tcy");
    expect(guidance[0]).toContain("ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ");
    expect(guidance[1]).toContain("ತಲುಪಿದ್ದೆರ್");
  });
});
