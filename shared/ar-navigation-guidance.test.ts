import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { latLngToLocalENU, bearingBetween, normalizeAngleDiff } from "../frontend/src/features/ar/geoUtils";
import { computeTurnGuidance } from "../frontend/src/features/ar/turnGuidance";

describe("AR Navigation Arrow Geometry and Orientation Math", () => {
  it("converts geographic bearings to exact Three.js ENU coordinates where North is -Z and East is +X", () => {
    const origin = { latitude: 13.02170, longitude: 74.98105 };
    // Point directly North (higher latitude)
    const northPt = { latitude: 13.02270, longitude: 74.98105 };
    const enuNorth = latLngToLocalENU(origin, northPt);

    expect(enuNorth.x).toBeCloseTo(0, 1);
    expect(enuNorth.z).toBeLessThan(0); // -Z is North in Three.js camera frame
    expect(bearingBetween(origin, northPt)).toBeCloseTo(0, 1);

    // Point directly East (higher longitude)
    const eastPt = { latitude: 13.02170, longitude: 74.98205 };
    const enuEast = latLngToLocalENU(origin, eastPt);

    expect(enuEast.x).toBeGreaterThan(0); // +X is East in Three.js
    expect(enuEast.z).toBeCloseTo(0, 1);
    expect(bearingBetween(origin, eastPt)).toBeCloseTo(90, 1);
  });

  it("calculates Three.js Y-rotation so arrow points toward target waypoint bearing without mirroring", () => {
    // Helper to rotate forward vector (0, 0, -1) by theta around +Y
    const rotateForwardVector = (theta: number) => {
      const v = new THREE.Vector3(0, 0, -1);
      v.applyAxisAngle(new THREE.Vector3(0, 1, 0), theta);
      return v;
    };

    // Case 1: Target is directly North (dir = 0, 0, -1)
    const dirNorth = new THREE.Vector3(0, 0, -1);
    const angleNorth = Math.atan2(-dirNorth.x, -dirNorth.z);
    expect(angleNorth).toBeCloseTo(0, 3);
    const resultNorth = rotateForwardVector(angleNorth);
    expect(resultNorth.x).toBeCloseTo(0, 3);
    expect(resultNorth.z).toBeCloseTo(-1, 3);

    // Case 2: Target is directly East (dir = 1, 0, 0)
    const dirEast = new THREE.Vector3(1, 0, 0);
    const angleEast = Math.atan2(-dirEast.x, -dirEast.z);
    expect(angleEast).toBeCloseTo(-Math.PI / 2, 3);
    const resultEast = rotateForwardVector(angleEast);
    expect(resultEast.x).toBeCloseTo(1, 3);
    expect(resultEast.z).toBeCloseTo(0, 3);

    // Case 3: Target is directly South (dir = 0, 0, 1)
    const dirSouth = new THREE.Vector3(0, 0, 1);
    const angleSouth = Math.atan2(-dirSouth.x, -dirSouth.z);
    const resultSouth = rotateForwardVector(angleSouth);
    expect(resultSouth.x).toBeCloseTo(0, 3);
    expect(resultSouth.z).toBeCloseTo(1, 3);

    // Case 4: Target is directly West (dir = -1, 0, 0)
    const dirWest = new THREE.Vector3(-1, 0, 0);
    const angleWest = Math.atan2(-dirWest.x, -dirWest.z);
    expect(angleWest).toBeCloseTo(Math.PI / 2, 3);
    const resultWest = rotateForwardVector(angleWest);
    expect(resultWest.x).toBeCloseTo(-1, 3);
    expect(resultWest.z).toBeCloseTo(0, 3);
  });

  it("verifies 3D arrow rotation and 2D turn instructions never contradict each other", () => {
    const origin = { latitude: 13.02170, longitude: 74.98105 };
    // Waypoint is at bearing 90° (East)
    const waypointEast = { latitude: 13.02170, longitude: 74.98205, name: "East Marker" };

    // When phone faces North (heading = 0°):
    // Waypoint is 90° to the right
    const guideFacingNorth = computeTurnGuidance(origin, waypointEast, 0);
    expect(guideFacingNorth.turnType).toBe("turn-right");
    expect(guideFacingNorth.relativeAngle).toBeCloseTo(90, 1);

    // In 3D camera space, rotation by -degToRad(relativeAngle) points arrow to the right (+X):
    const arrowAngleNorth = -THREE.MathUtils.degToRad(guideFacingNorth.relativeAngle);
    const arrowDirNorth = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), arrowAngleNorth);
    expect(arrowDirNorth.x).toBeGreaterThan(0.9); // Points to the right (+X)

    // When phone faces East (heading = 90°):
    // Waypoint is straight ahead
    const guideFacingEast = computeTurnGuidance(origin, waypointEast, 90);
    expect(guideFacingEast.turnType).toBe("straight");
    expect(guideFacingEast.relativeAngle).toBeCloseTo(0, 1);

    const arrowAngleEast = -THREE.MathUtils.degToRad(guideFacingEast.relativeAngle);
    const arrowDirEast = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), arrowAngleEast);
    expect(arrowDirEast.z).toBeCloseTo(-1, 3); // Points straight ahead (-Z)

    // When phone faces South (heading = 180°):
    // Waypoint is 90° to the left (relativeAngle = -90°)
    const guideFacingSouth = computeTurnGuidance(origin, waypointEast, 180);
    expect(guideFacingSouth.turnType).toBe("turn-left");
    expect(guideFacingSouth.relativeAngle).toBeCloseTo(-90, 1);

    const arrowAngleSouth = -THREE.MathUtils.degToRad(guideFacingSouth.relativeAngle);
    const arrowDirSouth = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), arrowAngleSouth);
    expect(arrowDirSouth.x).toBeLessThan(-0.9); // Points to the left (-X)
  });

  it("verifies smooth transition of relative angle as user physically turns toward target waypoint", () => {
    const origin = { latitude: 13.02170, longitude: 74.98105 };
    const target = { latitude: 13.02270, longitude: 74.98105 }; // 0° North

    // User starts facing 60° East of North (heading = 60°):
    // Target is to their left by -60°
    const turn1 = computeTurnGuidance(origin, target, 60);
    expect(turn1.relativeAngle).toBe(-60);
    expect(turn1.turnType).toBe("turn-left");

    // User turns closer to heading = 30°:
    const turn2 = computeTurnGuidance(origin, target, 30);
    expect(turn2.relativeAngle).toBe(-30);
    expect(turn2.turnType).toBe("slight-left");

    // User faces target directly (heading = 0°):
    const turn3 = computeTurnGuidance(origin, target, 0);
    expect(turn3.relativeAngle).toBe(0);
    expect(turn3.turnType).toBe("straight");

    // User turns slightly past to heading = 350° (-10°):
    const turn4 = computeTurnGuidance(origin, target, 350);
    expect(turn4.relativeAngle).toBe(10);
    expect(turn4.turnType).toBe("straight"); // within 15° deadband
  });
});
