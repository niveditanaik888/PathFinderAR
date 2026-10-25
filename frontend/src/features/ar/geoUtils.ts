/**
 * Geographic utilities for outdoor campus AR navigation
 * Uses local tangent plane (East-North-Up) approximations suitable for campus scale (<10 km).
 */

export type LatLngAlt = {
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
};

export type Vector3D = {
  x: number; // East (meters)
  y: number; // Up (meters)
  z: number; // South / North (-z is North in Three.js camera frame)
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Converts a geographic point (lat, lng, alt) to local East-North-Up (ENU) coordinates
 * relative to an origin point (the user's current GPS position).
 *
 * In Three.js coordinate system:
 * +X = East
 * +Y = Up
 * -Z = North (+Z = South)
 */
export function latLngToLocalENU(
  origin: LatLngAlt,
  point: LatLngAlt
): Vector3D {
  const dLat = toRadians(point.latitude - origin.latitude);
  const dLng = toRadians(point.longitude - origin.longitude);
  const meanLat = toRadians((origin.latitude + point.latitude) / 2);

  // Easting (+X)
  const x = EARTH_RADIUS_METERS * dLng * Math.cos(meanLat);

  // Northing (+North is -Z in Three.js)
  const z = -EARTH_RADIUS_METERS * dLat;

  // Elevation (+Y)
  const y = (point.altitude ?? 0) - (origin.altitude ?? 0);

  return { x, y, z };
}

/**
 * Computes compass bearing in degrees (0..360, where 0=North, 90=East) from pointA to pointB.
 */
export function bearingBetween(pointA: LatLngAlt, pointB: LatLngAlt): number {
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
 * Computes great-circle distance in meters between two coordinates (Haversine formula).
 */
export function distanceMeters(pointA: LatLngAlt, pointB: LatLngAlt): number {
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
 * Computes perpendicular distance in meters from a given GPS point to a line segment
 * between segmentStart and segmentEnd using local ENU projection.
 *
 * Used for reliable off-route deviation detection.
 */
export function perpendicularDistanceToSegment(
  point: LatLngAlt,
  segmentStart: LatLngAlt,
  segmentEnd: LatLngAlt
): number {
  // Convert segment points to ENU relative to segmentStart
  const startENU = { x: 0, z: 0 };
  const endENU = latLngToLocalENU(segmentStart, segmentEnd);
  const pointENU = latLngToLocalENU(segmentStart, point);

  const dx = endENU.x - startENU.x;
  const dz = endENU.z - startENU.z;
  const segmentLengthSq = dx * dx + dz * dz;

  if (segmentLengthSq < 0.0001) {
    // Degenerate segment (start and end are virtually identical)
    return Math.hypot(pointENU.x, pointENU.z);
  }

  // Projection parameter t clamped to [0, 1]
  const t = Math.max(
    0,
    Math.min(
      1,
      ((pointENU.x - startENU.x) * dx + (pointENU.z - startENU.z) * dz) /
        segmentLengthSq
    )
  );

  // Closest point on the segment
  const closestX = startENU.x + t * dx;
  const closestZ = startENU.z + t * dz;

  // Distance from point to closest point on segment in meters
  return Math.hypot(pointENU.x - closestX, pointENU.z - closestZ);
}

/**
 * Normalizes an angle difference to the range -180..180 degrees.
 */
export function normalizeAngleDiff(angle: number): number {
  return ((((angle + 180) % 360) + 360) % 360) - 180;
}
