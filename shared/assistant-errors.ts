export type AssistantErrorTranslationKey = "assistantError" | "assistantUnsupportedLanguage";

export function getAssistantErrorTranslationKey(code?: string): AssistantErrorTranslationKey {
  return code === "PRECONDITION_FAILED" ? "assistantUnsupportedLanguage" : "assistantError";
}
