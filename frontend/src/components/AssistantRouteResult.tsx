import { executeAssistantRouteAction, type AssistantRouteAction } from "@/lib/assistantRouteActions";
import { RouteActions } from "@/components/RouteActions";
import type { GuidedRoute } from "@shared/assistant-conversation";
import type { LanguageCode } from "@shared/i18n";
import React from "react";

type Launch = {
  sourceNodeId: string;
  destinationId: string;
  accessibleOnly: boolean;
  autoStart: boolean;
  voiceOn: boolean;
  language: LanguageCode;
};

export function AssistantRouteResult({ route, accessibilityRequired, language, saveLaunch, navigate, onError }: {
  route: GuidedRoute;
  accessibilityRequired: boolean;
  language: LanguageCode;
  saveLaunch: (launch: Launch) => void;
  navigate: (href: string) => void;
  onError: () => void;
}) {
  const handleAction = (action: AssistantRouteAction) => {
    try {
      executeAssistantRouteAction({ action, sourceNodeId: route.source.id, destinationId: route.destination.id, accessibleOnly: accessibilityRequired, language }, { saveLaunch, navigate });
    } catch {
      onError();
    }
  };

  return <RouteActions route={route} onAction={handleAction} />;
}
