import { describe, expect, it } from "vitest";
import { normalizeRouteSelection, readRouteSelection, routeSelectionSearch, writeRouteSelection } from "./route-selection";

describe("shared route selection", () => {
  it("preserves valid source and destination IDs from URL state", () => {
    expect(readRouteSelection(undefined, "?source=cafe&destination=d10")).toEqual({ sourceNodeId: "cafe", destinationId: "d10" });
  });

  it("rejects invalid IDs instead of falling back to an arbitrary label", () => {
    expect(normalizeRouteSelection({ sourceNodeId: "missing", destinationId: "unknown" })).toEqual({ sourceNodeId: "gate", destinationId: "d10" });
  });

  it("writes both endpoint IDs and creates a shareable map query", () => {
    const values = new Map<string, string>();
    const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) } as unknown as Storage;
    const selection = writeRouteSelection({ sourceNodeId: "cafe", destinationId: "d7" }, storage);
    expect(values.get("aiet-source")).toBe("cafe");
    expect(values.get("pathfinder-destination")).toBe("d7");
    expect(routeSelectionSearch(selection)).toBe("?source=cafe&destination=d7");
  });
});
