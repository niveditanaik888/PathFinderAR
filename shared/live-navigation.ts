export const LIVE_NAVIGATION_STORAGE_KEY = "pathfinder-live-navigation";

export type LiveNavigationSnapshot = {
  active: boolean;
  positionSource?: "gps" | "preview";
  sourceNodeId: string;
  destinationId: string;
  currentWaypointIndex: number;
  totalWaypoints: number;
  progressPercent: number;
  remainingDistance: number;
  currentInstruction: string;
  currentVoiceInstruction: string;
  isComplete: boolean;
  position: {
    latitude: number;
    longitude: number;
    accuracy: number;
    heading?: number;
    speed?: number;
  };
  updatedAt: number;
};

export function readLiveNavigationSnapshot(): LiveNavigationSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(LIVE_NAVIGATION_STORAGE_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as LiveNavigationSnapshot;
    if (!snapshot.active || Date.now() - snapshot.updatedAt > 5 * 60 * 1000) return null;
    if (!snapshot.position || !Number.isFinite(snapshot.position.latitude) || !Number.isFinite(snapshot.position.longitude)) return null;
    return snapshot;
  } catch {
    return null;
  }
}

export function writeLiveNavigationSnapshot(snapshot: LiveNavigationSnapshot) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(LIVE_NAVIGATION_STORAGE_KEY, JSON.stringify(snapshot));
}

export function clearLiveNavigationSnapshot() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(LIVE_NAVIGATION_STORAGE_KEY);
}
