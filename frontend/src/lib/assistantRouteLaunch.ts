export const ASSISTANT_ROUTE_LAUNCH_KEY = "pathfinder-assistant-route-launch";
import type { LanguageCode } from "@shared/i18n";

export type AssistantRouteLaunch = {
  sourceNodeId: string;
  destinationId: string;
  accessibleOnly: boolean;
  autoStart: boolean;
  voiceOn: boolean;
  language: LanguageCode;
};

export type MapRouteLaunchState = {
  destinationId: string;
  sourceNodeId: string;
  accessibleOnly: boolean;
  voiceOn: boolean;
  language: LanguageCode;
  autoStart: boolean;
};

export function resolveMapRouteLaunchState(launch: AssistantRouteLaunch | undefined, fallback: { destinationId: string; sourceNodeId: string }): MapRouteLaunchState {
  return {
    destinationId: launch?.destinationId ?? fallback.destinationId,
    sourceNodeId: launch?.sourceNodeId ?? fallback.sourceNodeId,
    accessibleOnly: launch?.accessibleOnly ?? false,
    voiceOn: launch?.voiceOn ?? false,
    language: launch?.language ?? "en",
    autoStart: launch?.autoStart ?? false,
  };
}

export function createAssistantRouteLaunch(route: AssistantRouteLaunch): AssistantRouteLaunch {
  return {
    sourceNodeId: route.sourceNodeId,
    destinationId: route.destinationId,
    accessibleOnly: Boolean(route.accessibleOnly),
    autoStart: Boolean(route.autoStart),
    voiceOn: Boolean(route.voiceOn),
    language: route.language,
  };
}

export function saveAssistantRouteLaunch(route: AssistantRouteLaunch) {
  const launch = createAssistantRouteLaunch(route);
  sessionStorage.setItem(ASSISTANT_ROUTE_LAUNCH_KEY, JSON.stringify(launch));
  sessionStorage.setItem("pathfinder-destination", launch.destinationId);
  sessionStorage.setItem("aiet-source", launch.sourceNodeId);
}

export function readAssistantRouteLaunch(): AssistantRouteLaunch | undefined {
  try {
    const raw = sessionStorage.getItem(ASSISTANT_ROUTE_LAUNCH_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as Partial<AssistantRouteLaunch>;
    if (!parsed.sourceNodeId || !parsed.destinationId) return undefined;
    const language = typeof parsed.language === "string" ? parsed.language as LanguageCode : "en";
    return { sourceNodeId: parsed.sourceNodeId, destinationId: parsed.destinationId, accessibleOnly: Boolean(parsed.accessibleOnly), autoStart: Boolean(parsed.autoStart), voiceOn: Boolean(parsed.voiceOn), language };
  } catch {
    return undefined;
  }
}

export function clearAssistantRouteLaunch() {
  sessionStorage.removeItem(ASSISTANT_ROUTE_LAUNCH_KEY);
}
