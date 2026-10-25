import { bearingBetween, distanceMeters, normalizeAngleDiff, type LatLngAlt } from "./geoUtils";

export type TurnType =
  | "straight"
  | "slight-right"
  | "turn-right"
  | "slight-left"
  | "turn-left"
  | "u-turn";

export type TurnGuidanceResult = {
  bearingToNext: number; // degrees 0..360
  relativeAngle: number; // degrees -180..180 (target bearing minus device heading)
  turnType: TurnType;
  actionText: string; // e.g. "Turn right", "Continue straight"
  detailedInstruction: string; // e.g. "Turn right in 25 m", "Continue straight for 80 m"
  distanceToNextMeters: number;
  isCloseToTurn: boolean; // within 8 meters
};

/**
 * Computes live turn-by-turn directional guidance from the user's current GPS position
 * and device heading toward the upcoming target waypoint.
 */
export function computeTurnGuidance(
  currentPosition: LatLngAlt,
  nextWaypoint: LatLngAlt & { name?: string },
  deviceHeading: number | null
): TurnGuidanceResult {
  const bearingToNext = bearingBetween(currentPosition, nextWaypoint);
  const distanceToNextMeters = Math.round(distanceMeters(currentPosition, nextWaypoint));

  // If heading is unavailable, default relative angle to 0 (straight ahead)
  const relativeAngle = deviceHeading !== null
    ? normalizeAngleDiff(bearingToNext - deviceHeading)
    : 0;

  let turnType: TurnType = "straight";
  let actionText = "Continue straight";

  const absAngle = Math.abs(relativeAngle);

  if (absAngle <= 15) {
    turnType = "straight";
    actionText = "Continue straight";
  } else if (relativeAngle > 15 && relativeAngle <= 45) {
    turnType = "slight-right";
    actionText = "Bear slight right";
  } else if (relativeAngle < -15 && relativeAngle >= -45) {
    turnType = "slight-left";
    actionText = "Bear slight left";
  } else if (relativeAngle > 45 && relativeAngle <= 135) {
    turnType = "turn-right";
    actionText = "Turn right";
  } else if (relativeAngle < -45 && relativeAngle >= -135) {
    turnType = "turn-left";
    actionText = "Turn left";
  } else {
    turnType = "u-turn";
    actionText = "Turn around (U-turn)";
  }

  const isCloseToTurn = distanceToNextMeters <= 8;
  const waypointName = nextWaypoint.name ? ` toward ${nextWaypoint.name}` : "";

  let detailedInstruction: string;
  if (isCloseToTurn) {
    detailedInstruction = `${actionText} now${waypointName}`;
  } else if (turnType === "straight") {
    detailedInstruction = `Continue straight${waypointName} for ${distanceToNextMeters} m`;
  } else {
    detailedInstruction = `${actionText}${waypointName} in ${distanceToNextMeters} m`;
  }

  return {
    bearingToNext,
    relativeAngle,
    turnType,
    actionText,
    detailedInstruction,
    distanceToNextMeters,
    isCloseToTurn,
  };
}
