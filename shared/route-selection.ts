import { campusNodes, destinations, getNode } from "./pathfinder";

export type RouteSelection = {
  sourceNodeId: string;
  destinationId: string;
};

const DEFAULT_SELECTION: RouteSelection = { sourceNodeId: "gate", destinationId: "d10" };

export function isValidRouteSelection(selection: Partial<RouteSelection>): selection is RouteSelection {
  const isCurrentLocation = selection.sourceNodeId === "current-location";
  const source = isCurrentLocation ? true : getNode(selection.sourceNodeId ?? "");
  const destination = destinations.find((item) => item.id === selection.destinationId && item.isActive);
  return Boolean((isCurrentLocation || (typeof source === "object" && source?.isActive)) && destination && getNode(destination.nodeId)?.isActive);
}

export function normalizeRouteSelection(selection: Partial<RouteSelection>, fallback: RouteSelection = DEFAULT_SELECTION): RouteSelection {
  const candidate = { sourceNodeId: selection.sourceNodeId ?? "", destinationId: selection.destinationId ?? "" };
  if (isValidRouteSelection(candidate)) return candidate;
  return isValidRouteSelection(fallback) ? fallback : DEFAULT_SELECTION;
}

export function readRouteSelection(storage?: Storage, search = ""): RouteSelection {
  const params = new URLSearchParams(search);
  const sessionSelection = storage ? {
    sourceNodeId: storage.getItem("aiet-source") ?? "",
    destinationId: storage.getItem("pathfinder-destination") ?? "",
  } : { sourceNodeId: "", destinationId: "" };
  const sourceParam = params.get("source") ?? params.get("from");
  const destParam = params.get("destination") ?? params.get("to");
  const resolvedSource = sourceParam || (sessionSelection.sourceNodeId && sessionSelection.sourceNodeId !== "gate" ? sessionSelection.sourceNodeId : "current-location");
  return normalizeRouteSelection({
    sourceNodeId: resolvedSource,
    destinationId: destParam ?? sessionSelection.destinationId,
  });
}

export function writeRouteSelection(selection: RouteSelection, storage?: Storage) {
  const normalized = normalizeRouteSelection(selection);
  storage?.setItem("aiet-source", normalized.sourceNodeId);
  storage?.setItem("pathfinder-destination", normalized.destinationId);
  return normalized;
}

export function routeSelectionSearch(selection: RouteSelection) {
  const normalized = normalizeRouteSelection(selection);
  return `?source=${encodeURIComponent(normalized.sourceNodeId)}&destination=${encodeURIComponent(normalized.destinationId)}`;
}

export function routableSourceNodes() {
  return campusNodes.filter((node) => node.isActive);
}

export function routeDestination(destinationId: string) {
  return destinations.find((item) => item.id === destinationId && item.isActive);
}
