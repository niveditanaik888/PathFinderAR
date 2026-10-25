export type LocationSample = {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading?: number;
  speed?: number;
  timestamp?: number;
};

export type LocationQuality = "live" | "low-accuracy" | "signal-lost" | "preview" | "unavailable";

export type LocationAssessment = {
  accepted: boolean;
  quality: LocationQuality;
  sample?: LocationSample;
  reason?: "invalid" | "stale" | "low-accuracy" | "implausible-jump";
};

const MAX_ACCEPTED_ACCURACY_METERS = 100;
const SIGNAL_LOSS_AFTER_MS = 20_000;

export function assessLocationSample(previous: LocationSample | undefined, next: LocationSample): LocationAssessment {
  if (!Number.isFinite(next.latitude) || !Number.isFinite(next.longitude) || !Number.isFinite(next.accuracy) || next.accuracy < 0) {
    return { accepted: false, quality: "unavailable", reason: "invalid" };
  }
  if (previous?.timestamp && next.timestamp && next.timestamp < previous.timestamp) {
    return { accepted: false, quality: "live", reason: "stale" };
  }
  if (next.accuracy > MAX_ACCEPTED_ACCURACY_METERS) {
    return { accepted: false, quality: "low-accuracy", reason: "low-accuracy" };
  }
  if (previous) {
    const meters = haversineMeters(previous.latitude, previous.longitude, next.latitude, next.longitude);
    const elapsedSeconds = Math.max(1, ((next.timestamp ?? Date.now()) - (previous.timestamp ?? Date.now())) / 1000);
    const allowedMeters = Math.max(80, (next.speed ?? previous.speed ?? 1.6) * elapsedSeconds * 4 + next.accuracy + previous.accuracy);
    if (meters > allowedMeters) return { accepted: false, quality: "live", reason: "implausible-jump" };
    const weight = Math.min(0.85, Math.max(0.2, previous.accuracy / Math.max(1, previous.accuracy + next.accuracy)));
    return {
      accepted: true,
      quality: next.accuracy > 30 ? "low-accuracy" : "live",
      sample: {
        ...next,
        latitude: previous.latitude * weight + next.latitude * (1 - weight),
        longitude: previous.longitude * weight + next.longitude * (1 - weight),
      },
    };
  }
  return { accepted: true, quality: next.accuracy > 30 ? "low-accuracy" : "live", sample: next };
}

export function locationQualityForAge(lastUpdatedAt: number | undefined, hasPosition: boolean, now = Date.now()): LocationQuality {
  if (!hasPosition) return "unavailable";
  if (!lastUpdatedAt || now - lastUpdatedAt > SIGNAL_LOSS_AFTER_MS) return "signal-lost";
  return "live";
}

export function haversineMeters(latitudeA: number, longitudeA: number, latitudeB: number, longitudeB: number) {
  const earthRadius = 6_371_000;
  const dLat = ((latitudeB - latitudeA) * Math.PI) / 180;
  const dLon = ((longitudeB - longitudeA) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((latitudeA * Math.PI) / 180) * Math.cos((latitudeB * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
