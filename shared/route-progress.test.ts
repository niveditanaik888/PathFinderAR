import { describe, expect, it } from "vitest";
import { CampusNode } from "./pathfinder";
import { deriveRouteProgress } from "./route-progress";

const routeNodes: CampusNode[] = [
  { id: "gate", name: "Main Gate", latitude: 13.027, longitude: 74.996, nodeType: "entrance", isAccessible: true },
  { id: "junction", name: "Central Junction", latitude: 13.0271, longitude: 74.9961, nodeType: "junction", isAccessible: true },
  { id: "library", name: "Central Library", latitude: 13.0272, longitude: 74.9962, nodeType: "building", isAccessible: true },
];

describe("deriveRouteProgress", () => {
  it("advances to the nearest upcoming waypoint and derives a remaining distance without retaining coordinates", () => {
    const progress = deriveRouteProgress({ latitude: 13.0271, longitude: 74.9961, accuracy: 8 }, routeNodes, 0);
    expect(progress.currentWaypointIndex).toBe(1);
    expect(progress.totalWaypoints).toBe(3);
    expect(progress.remainingDistance).toBeGreaterThan(0);
    expect(progress.progressPercent).toBe(50);
    expect(progress.isComplete).toBe(false);
  });

  it("does not move backwards when a noisy position is closer to a completed waypoint", () => {
    const progress = deriveRouteProgress({ latitude: 13.027, longitude: 74.996, accuracy: 8 }, routeNodes, 1);
    expect(progress.currentWaypointIndex).toBe(1);
  });

  it("marks the route complete when the destination is within the accuracy-aware arrival threshold", () => {
    const progress = deriveRouteProgress({ latitude: 13.0272, longitude: 74.9962, accuracy: 10 }, routeNodes, 1);
    expect(progress.currentWaypointIndex).toBe(2);
    expect(progress.remainingDistance).toBe(0);
    expect(progress.progressPercent).toBe(100);
    expect(progress.isComplete).toBe(true);
  });
});
