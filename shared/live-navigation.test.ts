// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import {
  LIVE_NAVIGATION_STORAGE_KEY,
  clearLiveNavigationSnapshot,
  readLiveNavigationSnapshot,
  writeLiveNavigationSnapshot,
} from "./live-navigation";

const snapshot = {
  active: true,
  sourceNodeId: "gate",
  destinationId: "d10",
  currentWaypointIndex: 1,
  totalWaypoints: 4,
  progressPercent: 33,
  remainingDistance: 120,
  currentInstruction: "Continue toward the library.",
  currentVoiceInstruction: "Continue toward the library.",
  isComplete: false,
  position: { latitude: 13.0217, longitude: 74.98105, accuracy: 8 },
  updatedAt: Date.now(),
};

afterEach(() => window.sessionStorage.clear());

describe("live navigation snapshot", () => {
  it("round-trips only the privacy-minimised route snapshot", () => {
    writeLiveNavigationSnapshot(snapshot);
    expect(readLiveNavigationSnapshot()).toEqual(snapshot);
    expect(window.sessionStorage.getItem(LIVE_NAVIGATION_STORAGE_KEY)).not.toContain("routeNodes");
  });

  it("clears the handoff when navigation ends", () => {
    writeLiveNavigationSnapshot(snapshot);
    clearLiveNavigationSnapshot();
    expect(readLiveNavigationSnapshot()).toBeNull();
  });
});
