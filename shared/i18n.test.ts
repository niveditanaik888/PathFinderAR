import { describe, expect, it } from "vitest";
import { assistantNetworkUnavailable, getTranslation, languageOptions, routeLaunchUnavailable, supportedLanguageCodes, translations, voicePermissionDenied } from "./i18n";

describe("PathFinder language support", () => {
  it("includes Tulu immediately after English and Kannada with a compatible speech locale", () => {
    expect(supportedLanguageCodes).toEqual(["en", "kn", "tcy", "hi", "ta", "te", "ml"]);
    expect(languageOptions.tcy).toMatchObject({ label: "Tulu", nativeLabel: "ತುಳು", speechLocale: "kn-IN" });
    expect(languageOptions.ml.speechLocale).toBe("ml-IN");
  });

  it("provides each interface key for every supported language", () => {
    const englishKeys = Object.keys(translations.en).sort();
    for (const language of supportedLanguageCodes) {
      expect(Object.keys(translations[language]).sort()).toEqual(englishKeys);
      expect(getTranslation(language, "assistantTitle").trim().length).toBeGreaterThan(10);
      expect(getTranslation(language, "assistantLanguageSupport").trim().length).toBeGreaterThan(10);
      expect(routeLaunchUnavailable[language].trim().length).toBeGreaterThan(10);
      expect(assistantNetworkUnavailable[language].trim().length).toBeGreaterThan(10);
      expect(voicePermissionDenied[language].trim().length).toBeGreaterThan(10);
    }
  });
});
