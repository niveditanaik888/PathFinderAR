import { CampusNode } from "./pathfinder";
import { haversineDistanceMeters } from "./routing";

export const DEFAULT_WAYPOINT_ARRIVAL_THRESHOLD_METERS = 18;

export type RouteProgressSnapshot = {
  currentWaypointIndex: number;
  totalWaypoints: number;
  remainingDistance: number;
  progressPercent: number;
  isComplete: boolean;
  distanceToCurrentWaypoint: number;
  arrivalThreshold: number;
};

type LivePosition = Pick<CampusNode, "latitude" | "longitude"> & { accuracy?: number };

/**
 * Produces a local progress snapshot from an explicitly shared browser position.
 * It never retains raw coordinates, and it never moves a user backwards along a route.
 */
export function deriveRouteProgress(
  position: LivePosition,
  routeNodes: CampusNode[],
  previousWaypointIndex = 0,
): RouteProgressSnapshot {
  if (!routeNodes.length) {
    return { currentWaypointIndex: 0, totalWaypoints: 0, remainingDistance: 0, progressPercent: 0, isComplete: false, distanceToCurrentWaypoint: Infinity, arrivalThreshold: DEFAULT_WAYPOINT_ARRIVAL_THRESHOLD_METERS };
  }

  const lastIndex = routeNodes.length - 1;
  const safePreviousIndex = Math.max(0, Math.min(previousWaypointIndex, lastIndex));
  const candidates = routeNodes.slice(safePreviousIndex);
  const closestOffset = candidates.reduce<number>((bestOffset, node, offset) => {
    return haversineDistanceMeters(position, node) < haversineDistanceMeters(position, candidates[bestOffset]!) ? offset : bestOffset;
  }, 0);
  const nearestIndex = safePreviousIndex + closestOffset;
  const distanceToCurrentWaypoint = haversineDistanceMeters(position, routeNodes[nearestIndex]);
  const arrivalThreshold = Math.max(12, Math.min(30, position.accuracy ?? DEFAULT_WAYPOINT_ARRIVAL_THRESHOLD_METERS));
  const currentWaypointIndex = Math.max(safePreviousIndex, nearestIndex);
  const isComplete = currentWaypointIndex === lastIndex && distanceToCurrentWaypoint <= arrivalThreshold;
  const tailDistance = routeNodes.slice(currentWaypointIndex).reduce((total, node, offset, nodes) => {
    return offset === 0 ? total : total + haversineDistanceMeters(nodes[offset - 1], node);
  }, 0);
  const remainingDistance = isComplete ? 0 : Math.round(distanceToCurrentWaypoint + tailDistance);
  const progressPercent = isComplete ? 100 : Math.round((currentWaypointIndex / Math.max(1, lastIndex)) * 100);

  return { currentWaypointIndex, totalWaypoints: routeNodes.length, remainingDistance, progressPercent, isComplete, distanceToCurrentWaypoint: Math.round(distanceToCurrentWaypoint), arrivalThreshold };
}
