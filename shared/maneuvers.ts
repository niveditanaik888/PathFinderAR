import type { CampusNode } from "./pathfinder";


export type ManeuverType =
  | "depart"
  | "straight"
  | "slight-right"
  | "turn-right"
  | "slight-left"
  | "turn-left"
  | "u-turn"
  | "staircase"
  | "floor-change"
  | "arrive";

export type RouteManeuver = {
  stepIndex: number;
  waypointIndex: number; // Index in path
  nodeId: string;
  name: string;
  maneuver: ManeuverType;
  directionLabel: string;
  instruction: string;
  distanceMeters: number;
  cumulativeDistanceMeters: number;
  latitude: number;
  longitude: number;
  relativeBearing: number;
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Calculates initial compass bearing in degrees (0..360) from pointA to pointB.
 */
export function calculateBearing(
  pointA: { latitude: number; longitude: number },
  pointB: { latitude: number; longitude: number }
): number {
  const dLng = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const initialBearing = toDegrees(Math.atan2(y, x));
  return (initialBearing + 360) % 360;
}

/**
 * Normalizes angle difference to -180..180 degrees.
 */
export function normalizeAngleDiff(angle: number): number {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}

/**
 * Great-circle distance between two points in meters.
 */
export function haversineMeters(
  pointA: { latitude: number; longitude: number },
  pointB: { latitude: number; longitude: number }
): number {
  const dLat = toRadians(pointB.latitude - pointA.latitude);
  const dLng = toRadians(pointB.longitude - pointA.longitude);
  const lat1 = toRadians(pointA.latitude);
  const lat2 = toRadians(pointB.latitude);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_METERS * c;
}

/**
 * Classifies compass bearing into 8 cardinal/intercardinal directions.
 */
export function getCardinalDirection(bearing: number): string {
  const normalized = ((bearing % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return "north";
  if (normalized >= 22.5 && normalized < 67.5) return "northeast";
  if (normalized >= 67.5 && normalized < 112.5) return "east";
  if (normalized >= 112.5 && normalized < 157.5) return "southeast";
  if (normalized >= 157.5 && normalized < 202.5) return "south";
  if (normalized >= 202.5 && normalized < 247.5) return "southwest";
  if (normalized >= 247.5 && normalized < 292.5) return "west";
  return "northwest";
}

/**
 * Classifies bearing delta into turn types matching turnGuidance logic.
 */
export function classifyTurnDelta(delta: number): {
  type: ManeuverType;
  label: string;
} {
  const absDelta = Math.abs(delta);
  if (absDelta <= 18) {
    return { type: "straight", label: "Continue straight" };
  }
  if (delta > 18 && delta <= 45) {
    return { type: "slight-right", label: "Bear slight right" };
  }
  if (delta < -18 && delta >= -45) {
    return { type: "slight-left", label: "Bear slight left" };
  }
  if (delta > 45 && delta <= 135) {
    return { type: "turn-right", label: "Turn right" };
  }
  if (delta < -45 && delta >= -135) {
    return { type: "turn-left", label: "Turn left" };
  }
  return { type: "u-turn", label: "Turn around" };
}

/**
 * Derives comprehensive turn-by-turn maneuvers from a sequence of campus node IDs.
 * Used uniformly across 2D Map navigation, AR HUD, and Alva's Robo voice assistant.
 */
export function deriveRouteManeuvers(
  nodes: CampusNode[],
  nodeIds: string[]
): RouteManeuver[] {
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));
  const path = nodeIds
    .map((id) => nodeMap.get(id))
    .filter((node): node is CampusNode => Boolean(node));

  if (path.length === 0) return [];
  if (path.length === 1) {
    return [
      {
        stepIndex: 0,
        waypointIndex: 0,
        nodeId: path[0].id,
        name: path[0].name,
        maneuver: "arrive",
        directionLabel: "Arrive at destination",
        instruction: `You are at ${path[0].name}.`,
        distanceMeters: 0,
        cumulativeDistanceMeters: 0,
        latitude: path[0].latitude,
        longitude: path[0].longitude,
        relativeBearing: 0,
      },
    ];
  }

  const maneuvers: RouteManeuver[] = [];
  let cumulativeDistance = 0;

  // Step 0: Departure from starting node
  const startNode = path[0];
  const firstTarget = path[1];
  const initialBearing = calculateBearing(startNode, firstTarget);
  const initialDist = Math.round(haversineMeters(startNode, firstTarget));
  const cardinal = getCardinalDirection(initialBearing);

  maneuvers.push({
    stepIndex: 0,
    waypointIndex: 1,
    nodeId: firstTarget.id,
    name: firstTarget.name,
    maneuver: "depart",
    directionLabel: `Head ${cardinal}`,
    instruction: `Head ${cardinal} toward ${firstTarget.name} for ${initialDist} m`,
    distanceMeters: initialDist,
    cumulativeDistanceMeters: initialDist,
    latitude: firstTarget.latitude,
    longitude: firstTarget.longitude,
    relativeBearing: initialBearing,
  });

  cumulativeDistance += initialDist;

  // Intermediate steps
  for (let i = 1; i < path.length - 1; i += 1) {
    const prevNode = path[i - 1];
    const currNode = path[i];
    const nextNode = path[i + 1];

    const prevBearing = calculateBearing(prevNode, currNode);
    const nextBearing = calculateBearing(currNode, nextNode);
    const bearingDelta = normalizeAngleDiff(nextBearing - prevBearing);
    const legDistance = Math.round(haversineMeters(currNode, nextNode));
    cumulativeDistance += legDistance;

    if (currNode.nodeType === "staircase") {
      maneuvers.push({
        stepIndex: maneuvers.length,
        waypointIndex: i + 1,
        nodeId: nextNode.id,
        name: nextNode.name,
        maneuver: "staircase",
        directionLabel: "Take staircase",
        instruction: `Take the staircase at ${currNode.name} toward ${nextNode.name} for ${legDistance} m`,
        distanceMeters: legDistance,
        cumulativeDistanceMeters: cumulativeDistance,
        latitude: nextNode.latitude,
        longitude: nextNode.longitude,
        relativeBearing: bearingDelta,
      });
    } else if (
      prevNode.floorId !== currNode.floorId &&
      currNode.floorName &&
      prevNode.floorName
    ) {
      maneuvers.push({
        stepIndex: maneuvers.length,
        waypointIndex: i + 1,
        nodeId: nextNode.id,
        name: nextNode.name,
        maneuver: "floor-change",
        directionLabel: `Go to ${currNode.floorName}`,
        instruction: `Proceed to ${currNode.floorName} toward ${nextNode.name} for ${legDistance} m`,
        distanceMeters: legDistance,
        cumulativeDistanceMeters: cumulativeDistance,
        latitude: nextNode.latitude,
        longitude: nextNode.longitude,
        relativeBearing: bearingDelta,
      });
    } else {
      const { type, label } = classifyTurnDelta(bearingDelta);
      maneuvers.push({
        stepIndex: maneuvers.length,
        waypointIndex: i + 1,
        nodeId: nextNode.id,
        name: nextNode.name,
        maneuver: type,
        directionLabel: label,
        instruction: `${label} toward ${nextNode.name} for ${legDistance} m`,
        distanceMeters: legDistance,
        cumulativeDistanceMeters: cumulativeDistance,
        latitude: nextNode.latitude,
        longitude: nextNode.longitude,
        relativeBearing: bearingDelta,
      });
    }
  }

  // Final step: Arrival
  const finalNode = path[path.length - 1];
  maneuvers.push({
    stepIndex: maneuvers.length,
    waypointIndex: path.length - 1,
    nodeId: finalNode.id,
    name: finalNode.name,
    maneuver: "arrive",
    directionLabel: "Arrive at destination",
    instruction: `Arrive at ${finalNode.name}`,
    distanceMeters: 0,
    cumulativeDistanceMeters: cumulativeDistance,
    latitude: finalNode.latitude,
    longitude: finalNode.longitude,
    relativeBearing: 0,
  });

  return maneuvers;
}

/**
 * Formats a maneuver into spoken text for text-to-speech.
 */
export function formatManeuverSpeech(maneuver: RouteManeuver): string {
  if (maneuver.maneuver === "arrive") {
    return `You have arrived at your destination, ${maneuver.name}.`;
  }
  if (maneuver.maneuver === "depart") {
    return `${maneuver.directionLabel} toward ${maneuver.name} for ${maneuver.distanceMeters} meters.`;
  }
  return `${maneuver.directionLabel} toward ${maneuver.name} for ${maneuver.distanceMeters} meters.`;
}

/**
 * Checks if user is within waypoint arrival threshold (default 8 meters).
 */
export function isWaypointReached(
  userPos: { latitude: number; longitude: number },
  waypoint: { latitude: number; longitude: number },
  thresholdMeters = 8
): boolean {
  return haversineMeters(userPos, waypoint) <= thresholdMeters;
}
