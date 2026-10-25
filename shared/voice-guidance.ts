import type { LanguageCode } from "./i18n";

type VoiceTemplate = { start: (name: string) => string; continueTo: (name: string) => string; arrive: (name: string) => string };

const templates: Record<LanguageCode, VoiceTemplate> = {
  en: { start: (name) => `Start from ${name}.`, continueTo: (name) => `Continue to ${name}.`, arrive: (name) => `You have arrived at ${name}.` },
  kn: { start: (name) => `${name} ಇಂದ ಪ್ರಾರಂಭಿಸಿ.`, continueTo: (name) => `${name} ಕಡೆ ಮುಂದುವರಿಯಿರಿ.`, arrive: (name) => `ನೀವು ${name} ತಲುಪಿದ್ದೀರಿ.` },
  tcy: { start: (name) => `${name} ದಿಂಡ್ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ.`, continueTo: (name) => `${name} ಕಡೆಗ್ ಮುಂದುವರುಲೆ.`, arrive: (name) => `ನಿಂಗ ${name} ತಲುಪಿದ್ದೆರ್.` },
  hi: { start: (name) => `${name} से शुरू करें।`, continueTo: (name) => `${name} की ओर बढ़ें।`, arrive: (name) => `आप ${name} पहुँच गए हैं।` },
  ta: { start: (name) => `${name} இலிருந்து தொடங்குங்கள்.`, continueTo: (name) => `${name} நோக்கிச் செல்லுங்கள்.`, arrive: (name) => `நீங்கள் ${name} ஐ அடைந்துவிட்டீர்கள்.` },
  te: { start: (name) => `${name} నుండి ప్రారంభించండి.`, continueTo: (name) => `${name} వైపు కొనసాగండి.`, arrive: (name) => `మీరు ${name} చేరుకున్నారు.` },
  ml: { start: (name) => `${name} ൽ നിന്ന് ആരംഭിക്കുക.`, continueTo: (name) => `${name} ലേക്ക് തുടരുക.`, arrive: (name) => `നിങ്ങൾ ${name} ൽ എത്തി.` },
};

export function createLocalizedVoiceGuidance(nodeNames: string[], language: LanguageCode) {
  if (!nodeNames.length) return [];
  const template = templates[language];
  return nodeNames.map((name, index) => index === 0 ? template.start(name) : index === nodeNames.length - 1 ? template.arrive(name) : template.continueTo(name));
}
