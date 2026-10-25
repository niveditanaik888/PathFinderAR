import { getTranslation, languageOptions, type LanguageCode, type TranslationKey } from "@shared/i18n";
import React, { createContext, type ReactNode, useContext, useEffect, useMemo, useState } from "react";

const LANGUAGE_STORAGE_KEY = "aiet-pathfinder-language";

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: TranslationKey) => string;
  speechLocale: string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getStoredLanguage(): LanguageCode {
  if (typeof window === "undefined") return "en";
  const value = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return value && Object.hasOwn(languageOptions, value) ? value as LanguageCode : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<LanguageCode>(getStoredLanguage);
  useEffect(() => { window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language); document.documentElement.lang = language; }, [language]);
  const value = useMemo(() => ({ language, setLanguage, t: (key: TranslationKey) => getTranslation(language, key), speechLocale: languageOptions[language].speechLocale }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    return {
      language: "en" as LanguageCode,
      setLanguage: () => {},
      t: (key: TranslationKey) => getTranslation("en", key),
      speechLocale: languageOptions["en"]?.speechLocale || "en-US",
    };
  }
  return context;
}
