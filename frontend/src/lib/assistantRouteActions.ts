import type { LanguageCode } from "@shared/i18n";

export type AssistantRouteAction = "voice" | "map" | "ar";

export type AssistantRouteActionInput = {
  action: AssistantRouteAction;
  sourceNodeId: string;
  destinationId: string;
  accessibleOnly: boolean;
  language: LanguageCode;
};

export function createAssistantRouteActionLinks(sourceNodeId: string, destinationId: string) {
  const query = new URLSearchParams({ from: sourceNodeId, to: destinationId }).toString();
  return { map: "/map", ar: "/ar" };
}

export function createAssistantRouteActionResult(input: AssistantRouteActionInput) {
  const links = createAssistantRouteActionLinks(input.sourceNodeId, input.destinationId);
  if (input.action === "ar") return { href: links.ar };
  return {
    href: links.map,
    launch: {
      sourceNodeId: input.sourceNodeId,
      destinationId: input.destinationId,
      accessibleOnly: input.accessibleOnly,
      autoStart: input.action === "voice",
      voiceOn: input.action === "voice",
      language: input.language,
    },
  };
}

export function executeAssistantRouteAction(
  input: AssistantRouteActionInput,
  effects: { saveLaunch: (launch: NonNullable<ReturnType<typeof createAssistantRouteActionResult>["launch"]>) => void; navigate: (href: string) => void },
) {
  const result = createAssistantRouteActionResult(input);
  if (result.launch) effects.saveLaunch(result.launch);
  effects.navigate(result.href);
  return result;
}
