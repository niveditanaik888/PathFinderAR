import { describe, expect, it } from "vitest";
import { campusEdges, campusNodes, DEVIATION_THRESHOLD_METERS, SMALL_GRAPH_NODE_THRESHOLD } from "./pathfinder";
import { aStar, calculateRoute, createRouteInstructions, dijkstra, evaluateRouteDeviation, normalizeRelativeBearing } from "./routing";

describe("PathFinder graph routing", () => {
  it("calculates a Dijkstra route from the Main Gate to the AI Lab", () => {
    const route = dijkstra(campusNodes, campusEdges, "gate", "ai-lab");
    expect(route.algorithm).toBe("dijkstra");
    expect(route.nodeIds[0]).toBe("gate");
    expect(route.nodeIds.at(-1)).toBe("ai-lab");
    expect(route.totalDistance).toBeGreaterThan(0);
    expect(route.estimatedTime).toBeGreaterThan(0);
  });

  it("calculates an A* route with a valid path and bounded visited nodes", () => {
    const route = aStar(campusNodes, campusEdges, "gate", "research");
    expect(route.algorithm).toBe("astar");
    expect(route.nodeIds.at(-1)).toBe("research");
    expect(route.visitedNodeCount).toBeLessThanOrEqual(campusNodes.length);
  });

  it("selects Dijkstra automatically for a graph no larger than the named threshold", () => {
    expect(campusNodes.length).toBeLessThanOrEqual(SMALL_GRAPH_NODE_THRESHOLD);
    const route = calculateRoute(campusNodes, campusEdges, "gate", "library", "auto");
    expect(route.algorithm).toBe("dijkstra");
  });

  it("creates human-readable route instructions", () => {
    const route = calculateRoute(campusNodes, campusEdges, "gate", "library");
    const instructions = createRouteInstructions(campusNodes, route.nodeIds);
    expect(instructions[0]).toContain("Main Gate");
    expect(instructions.at(-1)).toContain("Central Library");
  });
});

describe("PathFinder AR and deviation rules", () => {
  it("uses targetBearing − deviceHeading for a normalized AR overlay angle", () => {
    expect(normalizeRelativeBearing(20, 350)).toBe(30);
    expect(normalizeRelativeBearing(350, 20)).toBe(-30);
  });

  it("flags a location beyond the configured 20 metre threshold and respects reroute cooldown", () => {
    const gate = campusNodes.find(node => node.id === "gate")!;
    const farPosition = { latitude: gate.latitude + 0.001, longitude: gate.longitude + 0.001 };
    const first = evaluateRouteDeviation(farPosition, [gate], DEVIATION_THRESHOLD_METERS);
    expect(first.isOffRoute).toBe(true);
    expect(first.shouldReroute).toBe(true);
    const coolingDown = evaluateRouteDeviation(farPosition, [gate], DEVIATION_THRESHOLD_METERS, Date.now());
    expect(coolingDown.cooldownActive).toBe(true);
    expect(coolingDown.shouldReroute).toBe(false);
  });
});
