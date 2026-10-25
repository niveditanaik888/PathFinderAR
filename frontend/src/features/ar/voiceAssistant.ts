import { speakText, stopSpeaking, supportsSpeechSynthesis } from "@/lib/browserSpeech";
import type { LanguageCode } from "@shared/i18n";
import { perpendicularDistanceToSegment, distanceMeters, type LatLngAlt } from "./geoUtils";
import type { TurnGuidanceResult } from "./turnGuidance";

export type WaypointNode = LatLngAlt & {
  id: string;
  name: string;
};

export type VoiceAssistantConfig = {
  enabled: boolean;
  language: LanguageCode;
  offRouteThresholdMeters?: number; // default 18m
  consecutiveOffRouteLimit?: number; // default 3 fixes
  rerouteCooldownMs?: number; // default 12000ms
  onRerouteRequest: () => Promise<boolean>; // automated recalculation trigger
};

export class ARVoiceAssistant {
  private enabled: boolean;
  private language: LanguageCode;
  private offRouteThreshold: number;
  private consecutiveOffRouteLimit: number;
  private rerouteCooldownMs: number;
  private onRerouteRequest: () => Promise<boolean>;

  private spokenWaypoints = new Map<number, Set<string>>(); // waypointIndex -> Set of cues ("far", "near", "arrive")
  private offRouteCounter = 0;
  private lastRerouteTimestamp = 0;
  private isRerouting = false;
  private hasAnnouncedStart = false;

  constructor(config: VoiceAssistantConfig) {
    this.enabled = config.enabled;
    this.language = config.language;
    this.offRouteThreshold = config.offRouteThresholdMeters ?? 18;
    this.consecutiveOffRouteLimit = config.consecutiveOffRouteLimit ?? 3;
    this.rerouteCooldownMs = config.rerouteCooldownMs ?? 12000;
    this.onRerouteRequest = config.onRerouteRequest;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      stopSpeaking();
    }
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setLanguage(lang: LanguageCode) {
    this.language = lang;
  }

  /**
   * Reset state when starting a new route
   */
  public reset(destinationName: string, totalDistance: number, estimatedSeconds: number) {
    this.spokenWaypoints.clear();
    this.offRouteCounter = 0;
    this.lastRerouteTimestamp = 0;
    this.isRerouting = false;
    this.hasAnnouncedStart = false;

    if (this.enabled && destinationName) {
      this.hasAnnouncedStart = true;
      const minutes = Math.max(1, Math.round(estimatedSeconds / 60));
      const message = `Starting navigation to ${destinationName}, ${Math.round(totalDistance)} meters, about ${minutes} ${minutes === 1 ? "minute" : "minutes"}.`;
      this.speak(message);
    }
  }

  /**
   * Evaluates user GPS fix against current route segment, computes off-route state,
   * triggers automatic rerouting, and speaks turn guidance when distance thresholds are crossed.
   */
  public async processUpdate(
    currentPosition: LatLngAlt,
    activeWaypointIndex: number,
    waypoints: WaypointNode[],
    guidance: TurnGuidanceResult,
    isComplete: boolean
  ) {
    if (waypoints.length === 0) return;

    // 1. Arrival announcement
    if (isComplete) {
      const lastIndex = waypoints.length - 1;
      const cues = this.getWaypointCues(lastIndex);
      if (!cues.has("arrived")) {
        cues.add("arrived");
        const dest = waypoints[lastIndex];
        this.speak(`You have arrived at ${dest.name}.`);
      }
      return;
    }

    // 2. Off-Route Detection using perpendicular distance to current active segment
    const segmentStartIndex = Math.max(0, activeWaypointIndex - 1);
    const segmentEndIndex = Math.min(waypoints.length - 1, activeWaypointIndex);

    const startNode = waypoints[segmentStartIndex];
    const endNode = waypoints[segmentEndIndex];

    const perpDistance = perpendicularDistanceToSegment(currentPosition, startNode, endNode);
    const directEndDistance = distanceMeters(currentPosition, endNode);
    const effectiveDeviation = Math.min(perpDistance, directEndDistance);

    const now = Date.now();
    const canReroute = now - this.lastRerouteTimestamp > this.rerouteCooldownMs;

    if (effectiveDeviation > this.offRouteThreshold) {
      this.offRouteCounter++;
      if (this.offRouteCounter >= this.consecutiveOffRouteLimit && canReroute && !this.isRerouting) {
        this.isRerouting = true;
        this.lastRerouteTimestamp = now;
        this.offRouteCounter = 0;

        // Verbal alert and trigger recalculation
        this.speak("You've gone off the planned route, recalculating...");

        try {
          const success = await this.onRerouteRequest();
          if (success) {
            this.spokenWaypoints.clear();
            this.speak(`New route found, ${guidance.actionText.toLowerCase()}.`);
          } else {
            this.speak("Could not recalculate route. Please check your connection.");
          }
        } catch {
          this.speak("Could not recalculate route. Keeping existing path.");
        } finally {
          this.isRerouting = false;
        }
        return;
      }
    } else {
      // User is on track; reset consecutive off-route counter
      this.offRouteCounter = 0;
    }

    // 3. Spoken Turn Guidance at distance thresholds
    const distance = guidance.distanceToNextMeters;
    const cues = this.getWaypointCues(activeWaypointIndex);

    if (distance <= 8 && !cues.has("now")) {
      cues.add("now");
      const targetName = waypoints[activeWaypointIndex]?.name ?? "";
      this.speak(`${guidance.actionText} now${targetName ? ` toward ${targetName}` : ""}.`);
    } else if (distance <= 40 && distance > 15 && !cues.has("mid") && guidance.turnType !== "straight") {
      cues.add("mid");
      this.speak(`In ${distance} meters, ${guidance.actionText.toLowerCase()}.`);
    } else if (distance <= 80 && distance > 50 && !cues.has("far") && guidance.turnType !== "straight") {
      cues.add("far");
      this.speak(`In ${distance} meters, prepare to ${guidance.actionText.toLowerCase()}.`);
    }
  }

  private getWaypointCues(index: number): Set<string> {
    if (!this.spokenWaypoints.has(index)) {
      this.spokenWaypoints.set(index, new Set<string>());
    }
    return this.spokenWaypoints.get(index)!;
  }

  private speak(text: string) {
    if (!this.enabled || !supportsSpeechSynthesis()) return;
    speakText(text, this.language);
  }

  public stop() {
    stopSpeaking();
  }
}
