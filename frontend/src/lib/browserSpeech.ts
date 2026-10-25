import { languageOptions, type LanguageCode } from "@shared/i18n";

type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<{ transcript: string }>>; resultIndex: number };
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export function getSpeechRecognition() {
  if (typeof window === "undefined") return undefined;
  const browser = window as typeof window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };
  const Recognition = browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
  return Recognition ? new Recognition() : undefined;
}

export function supportsSpeechSynthesis() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking() {
  if (supportsSpeechSynthesis()) window.speechSynthesis.cancel();
}

export function speakText(text: string, language: LanguageCode) {
  if (!supportsSpeechSynthesis()) return false;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = languageOptions[language].speechLocale;
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
  return true;
}
