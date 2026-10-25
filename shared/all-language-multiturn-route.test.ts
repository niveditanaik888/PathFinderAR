import { continueRouteConversation, createConversationState } from "./assistant-conversation";
import { supportedLanguageCodes, type LanguageCode } from "./i18n";
import { createLocalizedVoiceGuidance } from "./voice-guidance";
import { describe, expect, it } from "vitest";

const turns: Record<LanguageCode, { destination: string; yes: string; source: string; start: string }> = {
  en: { destination: "Central Library", yes: "yes", source: "Main Gate", start: "start navigation" },
  kn: { destination: "ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯ", yes: "ಹೌದು", source: "ಮುಖ್ಯ ದ್ವಾರ", start: "ನ್ಯಾವಿಗೇಶನ್ ಪ್ರಾರಂಭಿಸಿ" },
  tcy: { destination: "ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯ", yes: "ಆಂಡ", source: "ಮುಖ್ಯ ದ್ವಾರ", start: "ಮಾರ್ಗದರ್ಶನ ಪ್ರಾರಂಭ ಮಲ್ಪುಲೆ" },
  hi: { destination: "केंद्रीय पुस्तकालय", yes: "हाँ", source: "मुख्य द्वार", start: "नेविगेशन शुरू करें" },
  ta: { destination: "மத்திய நூலகம்", yes: "ஆம்", source: "முதன்மை நுழைவாயில்", start: "வழிசெலுத்தலைத் தொடங்கு" },
  te: { destination: "కేంద్ర గ్రంథాలయం", yes: "అవును", source: "ప్రధాన ద్వారం", start: "నావిగేషన్ ప్రారంభించండి" },
  ml: { destination: "സെൻട്രൽ ലൈബ്രറി", yes: "അതെ", source: "പ്രധാന കവാടം", start: "നാവിഗേഷൻ ആരംഭിക്കുക" },
};

describe("seven-language multi-turn route and voice guidance", () => {
  it.each(supportedLanguageCodes)("continues destination → confirmation → source → voice launch in %s", (language) => {
    const turn = turns[language];
    const destination = continueRouteConversation(turn.destination, createConversationState(language, `multiturn-${language}`));
    const confirmation = continueRouteConversation(turn.yes, destination.state);
    const route = continueRouteConversation(turn.source, confirmation.state);
    const navigation = continueRouteConversation(turn.start, route.state);

    expect(destination.state.intent).toBe("awaiting_route_confirmation");
    expect(confirmation.state.intent).toBe("awaiting_source");
    expect(route.route).toBeDefined();
    expect(route.route?.source.id).toBe("gate");
    expect(route.route?.destination.id).toBe("d10");
    expect(navigation.action).toBe("start_navigation");
    expect(navigation.state.navigationStatus).toBe("active");
    expect(createLocalizedVoiceGuidance(route.route!.instructions, language)).toHaveLength(route.route!.instructions.length);
    console.info(`MULTITURN_ROUTE_VOICE_VALIDATED language=${language} source=gate destination=d10 action=start_navigation`);
  });
});
