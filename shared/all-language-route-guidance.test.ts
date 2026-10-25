import { createRouteActionHandler } from "../frontend/src/components/RouteActions";
import { executeAssistantRouteAction } from "../frontend/src/lib/assistantRouteActions";
import { continueRouteConversation, createConversationState } from "./assistant-conversation";
import { supportedLanguageCodes, type LanguageCode } from "./i18n";
import { createLocalizedVoiceGuidance } from "./voice-guidance";
import { describe, expect, it } from "vitest";

const requests: Record<LanguageCode, string> = {
  en: "from Main Gate to Central Library",
  kn: "ಮುಖ್ಯ ದ್ವಾರದಿಂದ ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯಕ್ಕೆ",
  tcy: "ಮುಖ್ಯ ದ್ವಾರದಿಂದ ಕೇಂದ್ರ ಗ್ರಂಥಾಲಯಕ್ಕೆ",
  hi: "मुख्य द्वार से केंद्रीय पुस्तकालय तक",
  ta: "முதன்மை நுழைவாயிலில் இருந்து மத்திய நூலகம் வரை",
  te: "ప్రధాన ద్వారం నుండి కేంద్ర గ్రంథాలయం వరకు",
  ml: "പ്രധാന കവാടത്തിൽ നിന്ന് സെൻട്രൽ ലൈബ്രറിയിലേക്ക്",
};

describe("all-language assistant route guidance", () => {
  it.each(supportedLanguageCodes)("guides the configured Main Gate to Central Library route in %s", (language) => {
    const response = continueRouteConversation(requests[language], createConversationState(language, `all-language-${language}`));
    const route = response.route;
    expect(route).toBeDefined();
    expect(route?.source.name).toBe("Main Gate");
    expect(route?.destination.name).toBe("Central Library");

    const buttonActions: string[] = [];
    createRouteActionHandler("voice", (action) => buttonActions.push(action))();
    const launches: unknown[] = [];
    const navigations: string[] = [];
    executeAssistantRouteAction({ action: "voice", sourceNodeId: route!.source.id, destinationId: route!.destination.id, accessibleOnly: false, language }, { saveLaunch: (launch) => launches.push(launch), navigate: (href) => navigations.push(href) });

    const spokenSteps = createLocalizedVoiceGuidance(route!.instructions, language);
    expect(buttonActions).toEqual(["voice"]);
    expect(navigations).toEqual(["/map"]);
    expect(launches[0]).toMatchObject({ language, autoStart: true, voiceOn: true });
    expect(spokenSteps).toHaveLength(route!.instructions.length);
    console.info(`ROUTE_GUIDANCE_VALIDATED language=${language} source=${route!.source.id} destination=${route!.destination.id} spokenSteps=${spokenSteps.length}`);
  });
});
