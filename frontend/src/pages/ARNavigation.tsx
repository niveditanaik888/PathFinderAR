import { TopNav } from "@/components/TopNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { bearingDegrees, evaluateRouteDeviation, haversineDistanceMeters, normalizeRelativeBearing, calculateRoute } from "@shared/routing";
import { deriveRouteProgress } from "@shared/route-progress";
import { campusEdges, campusNodes, DEVIATION_THRESHOLD_METERS, destinations, getNode } from "@shared/pathfinder";
import { AlertTriangle, ArrowUp, Camera, CheckCircle2, ChevronLeft, Compass, FlipHorizontal, LocateFixed, Map as MapIcon, Navigation, RotateCcw, ShieldAlert, Smartphone, SwitchCamera, Volume2, VolumeX, X } from "lucide-react";
import React from "react";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link } from "wouter";

import { ARRouteScene } from "@/features/ar/ARRouteScene";
import { ARVoiceAssistant, type WaypointNode } from "@/features/ar/voiceAssistant";
import { computeTurnGuidance, type TurnGuidanceResult } from "@/features/ar/turnGuidance";
import { useLanguage } from "@/contexts/LanguageContext";
import { readLiveNavigationSnapshot, writeLiveNavigationSnapshot } from "@shared/live-navigation";


type CameraStatus = "idle" | "loading" | "active" | "error";
type LocationStatus = "idle" | "requesting" | "active" | "signal-lost" | "denied" | "error";
type OrientationStatus = "idle" | "unsupported" | "requesting" | "granted" | "denied";
type LocationState = { latitude: number; longitude: number; accuracy: number; timestamp: number; speed?: number; heading?: number };
type OrientationEventWithPermission = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };
type CompassEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };

const stopStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

export default function ARNavigation() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const locationWatchRef = useRef<number | null>(null);
  const lastRerouteAt = useRef(0);

  const sceneRef = useRef<ARRouteScene | null>(null);
  const voiceAssistantRef = useRef<ARVoiceAssistant | null>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isMirrored, setIsMirrored] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [orientationStatus, setOrientationStatus] = useState<OrientationStatus>("idle");
  const liveSnapshot = useMemo(() => readLiveNavigationSnapshot(), []);
  const [location, setLocation] = useState<LocationState | undefined>(() => {
    if (liveSnapshot?.position && liveSnapshot.position.latitude !== 0 && liveSnapshot.position.longitude !== 0) {
      return {
        latitude: liveSnapshot.position.latitude,
        longitude: liveSnapshot.position.longitude,
        accuracy: liveSnapshot.position.accuracy ?? 12,
        speed: liveSnapshot.position.speed,
        heading: liveSnapshot.position.heading,
        timestamp: liveSnapshot.updatedAt ?? Date.now(),
      };
    }
    return undefined;
  });
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [gpsHeading, setGpsHeading] = useState<number | null>(() => liveSnapshot?.position?.heading ?? null);
  const [headingSource, setHeadingSource] = useState<"compass" | "gps" | "none">("none");
  const [headingReliable, setHeadingReliable] = useState(false);
  const prevPositionRef = useRef<LocationState | null>(null);

  // Unified heading: compass sensor takes precedence; if unavailable or stationary, fall back to GPS course
  const heading = useMemo(() => {
    if (compassHeading !== null) return compassHeading;
    if (gpsHeading !== null) return gpsHeading;
    return null;
  }, [compassHeading, gpsHeading]);

  useEffect(() => {
    if (compassHeading !== null) {
      setHeadingSource("compass");
    } else if (gpsHeading !== null) {
      setHeadingSource("gps");
    } else {
      setHeadingSource("none");
    }
  }, [compassHeading, gpsHeading]);

  const [sourceNodeId, setSourceNodeId] = useState(() => liveSnapshot?.sourceNodeId || sessionStorage.getItem("aiet-source") || "current-location");
  const [destinationId] = useState(() => liveSnapshot?.destinationId || sessionStorage.getItem("pathfinder-destination") || "d7");
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState(() => liveSnapshot?.currentWaypointIndex ?? 0);
  const [error, setError] = useState("");
  const [deviationMessage, setDeviationMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [hasPulse, setHasPulse] = useState(false);
  const [isArrived, setIsArrived] = useState(false);

  const { language } = useLanguage();

  const destination = destinations.find((item) => item.id === destinationId) ?? destinations[0];

  // Auto-snap to nearest accessible campus node from live GPS
  const liveNearestNode = useMemo(() => {
    if (!location) return null;
    return campusNodes
      .filter((n) => n.isAccessible && n.isActive)
      .reduce((closest, node) => {
        return haversineDistanceMeters(location, node) < haversineDistanceMeters(location, closest) ? node : closest;
      }, campusNodes[0]);
  }, [location]);

  const activeStartNodeId = useMemo(() => {
    if (liveNearestNode) return liveNearestNode.id;
    if (sourceNodeId && sourceNodeId !== "current-location") return sourceNodeId;
    return "gate";
  }, [liveNearestNode, sourceNodeId]);

  const route = useMemo(() => {
    if (activeStartNodeId === destination.nodeId) {
      return {
        algorithm: "dijkstra" as const,
        nodeIds: [activeStartNodeId],
        totalDistance: 0,
        estimatedTime: 0,
        visitedNodeCount: 1,
        executionTimeMs: 0,
      };
    }
    try {
      return calculateRoute(campusNodes, campusEdges, activeStartNodeId, destination.nodeId);
    } catch {
      return {
        algorithm: "dijkstra" as const,
        nodeIds: [activeStartNodeId, destination.nodeId],
        totalDistance: 0,
        estimatedTime: 0,
        visitedNodeCount: 2,
        executionTimeMs: 0,
      };
    }
  }, [destination.nodeId, activeStartNodeId]);

  const routeNodes = useMemo(() => route.nodeIds.map(getNode).filter((node): node is NonNullable<typeof node> => Boolean(node)), [route.nodeIds]);
  const progress = useMemo(() => location
    ? deriveRouteProgress(location, routeNodes, currentWaypointIndex)
    : { currentWaypointIndex, totalWaypoints: routeNodes.length, remainingDistance: route.totalDistance, progressPercent: 0, isComplete: false, distanceToCurrentWaypoint: 0, arrivalThreshold: 18 },
  [currentWaypointIndex, location, route.totalDistance, routeNodes]);
  
  const activeIndex = Math.max(currentWaypointIndex, progress.currentWaypointIndex);
  const nextWaypointIndex = Math.min(activeIndex + 1, Math.max(0, routeNodes.length - 1));
  const nextWaypoint = routeNodes[nextWaypointIndex] ?? routeNodes[0];
  const distanceToNext = location && nextWaypoint ? Math.round(haversineDistanceMeters(location, nextWaypoint)) : null;
  const targetBearing = nextWaypoint ? bearingDegrees(location ?? routeNodes[Math.min(activeIndex, routeNodes.length - 1)] ?? campusNodes[0], nextWaypoint) : 0;
  const relativeBearing = heading === null ? 0 : normalizeRelativeBearing(targetBearing, heading);
  const arrowRotation = heading === null ? 0 : Math.max(-80, Math.min(80, relativeBearing));
  const directionLabel = heading === null ? "Align your device for direction" : Math.abs(relativeBearing) <= 18 ? "Continue straight" : Math.abs(relativeBearing) > 145 ? "Turn around" : relativeBearing > 0 ? "Turn right" : "Turn left";
  const instruction = progress.isComplete ? `You have reached ${destination.name}.` : nextWaypoint ? `Continue toward ${nextWaypoint.name}.` : "Route ready.";

  // Dynamic Turn Guidance for HUD
  const guidance: TurnGuidanceResult = useMemo(() => {
    const origin = location ?? (routeNodes[0] ? { latitude: routeNodes[0].latitude, longitude: routeNodes[0].longitude } : null);
    if (!origin || !nextWaypoint) {
      return {
        bearingToNext: targetBearing,
        relativeAngle: relativeBearing,
        turnType: "straight",
        actionText: directionLabel,
        detailedInstruction: instruction,
        distanceToNextMeters: distanceToNext ?? 0,
        isCloseToTurn: (distanceToNext ?? 999) <= 8,
      };
    }
    return computeTurnGuidance(origin, nextWaypoint, heading);
  }, [location, nextWaypoint, heading, targetBearing, relativeBearing, directionLabel, instruction, distanceToNext]);

  // Automated Rerouting Callback for Voice Assistant
  const handleAutomatedReroute = useCallback(async (): Promise<boolean> => {
    if (!location) return false;
    const nearestSafeNode = campusNodes.filter((node) => node.isAccessible).reduce((closest, node) => 
      haversineDistanceMeters(location, node) < haversineDistanceMeters(location, closest) ? node : closest, campusNodes[0]
    );
    try {
      lastRerouteAt.current = Date.now();
      setSourceNodeId(nearestSafeNode.id);
      setCurrentWaypointIndex(0);
      setDeviationMessage(`Route updated from ${nearestSafeNode.name}.`);
      return true;
    } catch {
      return false;
    }
  }, [location]);

  // Initialize Voice Assistant
  useEffect(() => {
    const assistant = new ARVoiceAssistant({
      enabled: voiceEnabled,
      language,
      onRerouteRequest: handleAutomatedReroute,
    });
    voiceAssistantRef.current = assistant;

    if (route && destination) {
      assistant.reset(destination.name, route.totalDistance, route.estimatedTime);
    }

    return () => {
      assistant.stop();
      voiceAssistantRef.current = null;
    };
  }, [voiceEnabled, language, destination.name, route?.totalDistance, route?.estimatedTime, handleAutomatedReroute]);

  // Initialize Three.js Scene when canvas is mounted
  useEffect(() => {
    if (!canvasRef.current || cameraStatus !== "active") return;

    if (!sceneRef.current) {
      try {
        sceneRef.current = new ARRouteScene(canvasRef.current);
      } catch (err) {
        console.warn("Could not initialize 3D AR Scene:", err);
      }
    }

    const scene = sceneRef.current;
    if (scene && routeNodes.length > 0) {
      scene.setWaypoints(routeNodes.map((n) => ({ id: n.id, name: n.name, latitude: n.latitude, longitude: n.longitude })));
    }

    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        sceneRef.current.resize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [cameraStatus, routeNodes]);

  // Update Three.js and Voice Assistant on Location/Heading changes
  useEffect(() => {
    if (sceneRef.current) {
      if (location) {
        sceneRef.current.setUserPosition(location);
      }
      if (heading !== null) {
        sceneRef.current.setHeading(heading);
      }
    }

    if (progress.isComplete || (distanceToNext !== null && distanceToNext <= 5 && nextWaypointIndex === routeNodes.length - 1)) {
      setIsArrived(true);
    }

    if (voiceAssistantRef.current && location && routeNodes.length > 0) {
      voiceAssistantRef.current.processUpdate(
        location,
        activeIndex,
        routeNodes.map((n) => ({ id: n.id, name: n.name, latitude: n.latitude, longitude: n.longitude })),
        guidance,
        progress.isComplete || isArrived
      );
    }

    // Persist live navigation snapshot
    if (location) {
      writeLiveNavigationSnapshot({
        active: true,
        sourceNodeId,
        destinationId,
        currentWaypointIndex: activeIndex,
        totalWaypoints: routeNodes.length,
        progressPercent: progress.progressPercent,
        remainingDistance: progress.remainingDistance,
        currentInstruction: instruction,
        currentVoiceInstruction: guidance.actionText,
        isComplete: progress.isComplete || isArrived,
        positionSource: "gps",
        position: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          heading: heading ?? undefined,
        },
        updatedAt: Date.now(),
      });
    }
  }, [location, heading, activeIndex, routeNodes, guidance, progress.isComplete, progress.progressPercent, progress.remainingDistance, instruction, distanceToNext, nextWaypointIndex, isArrived, sourceNodeId, destinationId]);

  // Waypoint approach pulse
  useEffect(() => {
    if (guidance.isCloseToTurn) {
      setHasPulse(true);
      const timer = setTimeout(() => setHasPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [guidance.isCloseToTurn]);

  const setLocationFromPosition = (position: GeolocationPosition) => {
    const next: LocationState = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ?? undefined,
      heading: position.coords.heading ?? undefined,
      timestamp: position.timestamp,
    };

    // 1. Native GPS heading from device if moving
    if (typeof position.coords.heading === "number" && !isNaN(position.coords.heading) && position.coords.heading >= 0) {
      setGpsHeading(Math.round(position.coords.heading));
      setHeadingReliable(true);
    } else if (prevPositionRef.current) {
      // 2. GPS course derived from consecutive fixes if moved >= 2.5 meters
      const distMoved = haversineDistanceMeters(prevPositionRef.current, next);
      if (distMoved >= 2.5) {
        const course = bearingDegrees(prevPositionRef.current, next);
        setGpsHeading(Math.round((course + 360) % 360));
        setHeadingReliable(true);
      }
    }

    prevPositionRef.current = next;
    setLocation(next);
    setLocationStatus("active");
  };

  const handleLocationError = (locationError: GeolocationPositionError) => {
    if (locationError.code === 1) {
      setLocationStatus("denied");
      setError("Location permission was denied. AR alignment is unavailable; use the map for reliable turn-by-turn guidance.");
    } else if (locationError.code === 2) {
      setLocationStatus("signal-lost");
      setError("Live location is temporarily unavailable. The route remains visible while PathFinder waits for recovery.");
    } else {
      setLocationStatus("error");
      setError("Location timed out. Try again outdoors or continue with map navigation.");
    }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setError("Geolocation is unavailable in this browser. Open map navigation to continue.");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(setLocationFromPosition, handleLocationError, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 });
    if (locationWatchRef.current !== null) navigator.geolocation.clearWatch(locationWatchRef.current);
    locationWatchRef.current = navigator.geolocation.watchPosition(setLocationFromPosition, handleLocationError, { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 });
  };

  const enableOrientation = async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setOrientationStatus("unsupported");
      return false;
    }
    setOrientationStatus("requesting");
    try {
      const eventWithPermission = DeviceOrientationEvent as OrientationEventWithPermission;
      if (typeof eventWithPermission.requestPermission === "function") {
        const response = await eventWithPermission.requestPermission();
        if (response === "granted") {
          setOrientationStatus("granted");
          return true;
        } else {
          setOrientationStatus("denied");
          return false;
        }
      } else {
        setOrientationStatus("granted");
        return true;
      }
    } catch {
      setOrientationStatus("denied");
      return false;
    }
  };

  const startCameraStream = async (targetFacing?: "environment" | "user") => {
    if (!window.isSecureContext && window.location.hostname !== "localhost") {
      setCameraStatus("error");
      setError("Camera access requires HTTPS. Open map navigation to continue on this connection.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraStatus("error");
      setError("Camera access is unavailable in this browser. Open map navigation to continue.");
      return;
    }
    const desiredFacing = targetFacing === "user" || targetFacing === "environment" ? targetFacing : facingMode;
    setCameraStatus("loading");
    setError("");
    stopStream(streamRef.current);
    requestLocation();
    void enableOrientation();

    try {
      let stream: MediaStream;
      if (desiredFacing === "environment") {
        try {
          // 1. Try environment with HD constraints
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: "environment" },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch (err) {
          if (err instanceof DOMException && err.name === "NotAllowedError") {
            throw err;
          }
          // 2. Fallback to basic ideal environment
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: "environment" } },
            audio: false,
          });
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" } },
          audio: false,
        });
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch {}
      }

      const videoTrack = stream.getVideoTracks?.()?.[0];
      const actualSettings = videoTrack?.getSettings?.() as MediaTrackSettings | undefined;
      const actualFacing = actualSettings?.facingMode;
      if (actualFacing === "user" || actualFacing === "environment") {
        setFacingMode(actualFacing);
        setIsMirrored(actualFacing === "user");
      } else {
        setFacingMode(desiredFacing);
        setIsMirrored(desiredFacing === "user");
      }
      setCameraStatus("active");
    } catch (cameraError) {
      setCameraStatus("error");
      const denied = cameraError instanceof DOMException && cameraError.name === "NotAllowedError";
      setError(
        denied
          ? "Camera permission was denied. Allow camera access or use map navigation as the reliable fallback."
          : "Camera could not be started. Check browser permissions and HTTPS, then try again."
      );
      stopStream(streamRef.current);
      streamRef.current = null;
    }
  };

  const enableCamera = () => {
    void enableOrientation();
    void startCameraStream();
  };

  const toggleCameraFacing = async () => {
    const nextFacing: "environment" | "user" = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setIsMirrored(nextFacing === "user");
    await startCameraStream(nextFacing);
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev);
  };

  const exitCamera = () => {
    stopStream(streamRef.current);
    streamRef.current = null;
    if (locationWatchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(locationWatchRef.current);
    locationWatchRef.current = null;
    if (sceneRef.current) {
      sceneRef.current.destroy();
      sceneRef.current = null;
    }
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.stop();
    }
    setCameraStatus("idle");
  };

  useEffect(() => {
    if (orientationStatus !== "granted" || typeof window === "undefined") return;

    const handler = (event: DeviceOrientationEvent) => {
      const compassEvent = event as CompassEvent;
      // 1. iOS Safari native webkitCompassHeading (0 = North, clockwise)
      if (typeof compassEvent.webkitCompassHeading === "number" && !isNaN(compassEvent.webkitCompassHeading)) {
        setCompassHeading(Math.round((compassEvent.webkitCompassHeading + 360) % 360));
        setHeadingReliable(true);
        return;
      }

      // 2. Android deviceorientationabsolute or absolute deviceorientation
      if (typeof event.alpha === "number" && !isNaN(event.alpha)) {
        // Standard W3C compass calculation: clockwise from North
        const androidHeading = Math.round((360 - event.alpha + 360) % 360);
        setCompassHeading(androidHeading);
        setHeadingReliable(Boolean(event.absolute));
      }
    };

    const hasAbsolute = "ondeviceorientationabsolute" in window;
    if (hasAbsolute) {
      window.addEventListener("deviceorientationabsolute", handler as EventListener, true);
    }
    window.addEventListener("deviceorientation", handler, true);

    return () => {
      if (hasAbsolute) {
        window.removeEventListener("deviceorientationabsolute", handler as EventListener, true);
      }
      window.removeEventListener("deviceorientation", handler, true);
    };
  }, [orientationStatus]);

  useEffect(() => {
    if (!location || !routeNodes.length) return;
    const nextProgress = deriveRouteProgress(location, routeNodes, currentWaypointIndex);
    if (nextProgress.currentWaypointIndex > currentWaypointIndex) setCurrentWaypointIndex(nextProgress.currentWaypointIndex);
    if (!cameraStatus || cameraStatus !== "active") return;
    const deviation = evaluateRouteDeviation(location, routeNodes, DEVIATION_THRESHOLD_METERS, lastRerouteAt.current, 15000);
    if (!deviation.shouldReroute) {
      if (!deviation.isOffRoute) setDeviationMessage("");
      return;
    }
    const nearestSafeNode = campusNodes.filter((node) => node.isAccessible).reduce((closest, node) => haversineDistanceMeters(location, node) < haversineDistanceMeters(location, closest) ? node : closest, campusNodes[0]);
    lastRerouteAt.current = Date.now();
    setSourceNodeId(nearestSafeNode.id);
    setCurrentWaypointIndex(0);
    setDeviationMessage(`Route updated from ${nearestSafeNode.name}.`);
  }, [cameraStatus, currentWaypointIndex, location, routeNodes]);

  useEffect(() => () => {
    stopStream(streamRef.current);
    if (locationWatchRef.current !== null && navigator.geolocation) navigator.geolocation.clearWatch(locationWatchRef.current);
    if (sceneRef.current) {
      sceneRef.current.destroy();
      sceneRef.current = null;
    }
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.stop();
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <TopNav transparent />
      <main className="container py-5 sm:py-8">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">Browser AR guidance</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Follow your route to {destination.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Interactive 3D Three.js camera guidance with real-world compass lock, turn-by-turn HUD, continuous voice assistant, and automatic off-route recalculation.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setVoiceEnabled((v) => !v)}
              className={`p-2 rounded-xl border backdrop-blur transition flex items-center gap-1.5 text-xs font-semibold ${
                voiceEnabled ? "border-cyan-400 bg-cyan-500/20 text-cyan-300" : "border-white/10 bg-slate-900 text-slate-400"
              }`}
              aria-label={voiceEnabled ? "Mute Voice Assistant" : "Unmute Voice Assistant"}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              <span>Voice {voiceEnabled ? "on" : "off"}</span>
            </button>
            <Badge className="border border-amber-300/30 bg-amber-300/10 text-amber-200 hover:bg-amber-300/10">
              <ShieldAlert className="mr-1.5 h-3.5 w-3.5" />Three.js 3D AR
            </Badge>
          </div>
        </div>

        <section className="relative mx-auto max-w-5xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl">
          <div className="relative aspect-[9/16] min-h-[480px] max-h-[75vh] sm:aspect-[16/10] sm:max-h-[640px] w-full overflow-hidden">
            {/* Live Camera Video Feed */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 ${cameraStatus === "active" ? "opacity-100" : "opacity-0"}`}
              aria-label={`Live ${facingMode === "environment" ? "rear" : "front"} camera preview`}
            />

            {/* Three.js 3D WebGL Canvas Layer */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 h-full w-full pointer-events-none z-10 ${cameraStatus === "active" ? "block" : "hidden"}`}
            />

            <div className={`absolute inset-0 ${cameraStatus === "active" ? "bg-gradient-to-b from-slate-950/60 via-transparent to-slate-950/85 pointer-events-none z-10" : "ar-fallback"}`} />

            {/* Idle / Requesting / Error Permission States */}
            {(cameraStatus === "idle" || cameraStatus === "loading" || cameraStatus === "error") && (
              <div className="absolute inset-0 grid place-items-center p-6 z-20">
                <div className="max-w-md text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400 text-slate-950">
                    {cameraStatus === "loading" ? <Navigation className="h-7 w-7 animate-pulse" /> : <Camera className="h-7 w-7" />}
                  </div>
                  <h2 className="mt-5 font-display text-2xl font-bold">
                    {cameraStatus === "loading" ? "Starting 3D AR camera guidance…" : "Interactive 3D AR Guidance, with safe 2D fallback."}
                  </h2>
                  <p className="mt-3 leading-7 text-slate-300">
                    PathFinder projects a glowing 3D path and destination light-beam over your device camera with turn-by-turn voice prompts and automated off-route recalculation.
                  </p>
                  <div className="mt-6 flex flex-wrap justify-center gap-3">
                    {cameraStatus !== "loading" && (
                      <Button onClick={enableCamera} className="bg-cyan-400 font-bold text-slate-950 hover:bg-cyan-300">
                        <Camera className="mr-2 h-4 w-4" />Enable camera & location
                      </Button>
                    )}
                    <Link href="/map" className="inline-flex items-center rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/10">
                      <MapIcon className="mr-2 h-4 w-4" />Open map navigation
                    </Link>
                  </div>
                  {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/30 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}
                </div>
              </div>
            )}

            {/* Active AR View Overlays */}
            {cameraStatus === "active" && (
              <>
                {/* Top Overlay Badge & Exit */}
                <div className="absolute left-3 right-3 sm:left-5 sm:right-5 top-3 sm:top-5 z-20 flex flex-wrap items-center justify-between gap-2">
                  <div className="rounded-full bg-slate-950/80 px-3.5 py-1.5 text-xs font-bold backdrop-blur border border-white/10 flex items-center gap-1.5 shadow-lg">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
                    <span className="truncate max-w-[110px] sm:max-w-none">AR route · {destination.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Switch Camera: Rear <-> Front */}
                    <button
                      type="button"
                      onClick={toggleCameraFacing}
                      title={`Switch to ${facingMode === "environment" ? "front" : "rear"} camera`}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-slate-950/80 px-3 text-xs font-bold backdrop-blur border border-white/15 text-white hover:bg-slate-900 active:scale-95 transition shadow-lg"
                      aria-label="Switch camera"
                    >
                      <SwitchCamera className="h-4 w-4 text-cyan-400" />
                      <span className="text-[11px] font-semibold">{facingMode === "environment" ? "Rear" : "Front"}</span>
                    </button>

                    {/* Mirror / Flip View Horizontally */}
                    <button
                      type="button"
                      onClick={toggleMirror}
                      title={isMirrored ? "Unflip view (normal)" : "Flip view right (mirror)"}
                      className={`grid h-9 w-9 place-items-center rounded-full backdrop-blur border transition active:scale-95 shadow-lg ${
                        isMirrored
                          ? "bg-cyan-500/25 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/30"
                          : "bg-slate-950/80 border-white/15 text-white hover:bg-slate-900"
                      }`}
                      aria-label={isMirrored ? "Mirror active, click to unflip" : "Flip camera horizontally"}
                    >
                      <FlipHorizontal className="h-4 w-4" />
                    </button>

                    <Link
                      href="/map"
                      aria-label="Return to map"
                      className="inline-flex min-h-9 items-center rounded-full bg-slate-950/80 px-3.5 text-xs font-bold backdrop-blur border border-white/15 hover:bg-slate-900 text-white shadow-lg"
                      onClick={exitCamera}
                    >
                      <span className="hidden sm:inline">Return to </span>map
                    </Link>
                    <button
                      type="button"
                      onClick={exitCamera}
                      className="grid h-9 w-9 place-items-center rounded-full bg-slate-950/80 backdrop-blur border border-white/15 hover:bg-slate-900 text-white shadow-lg"
                      aria-label="Exit AR"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Central Rotating Directional HUD Arrow */}
                <div className="absolute left-1/2 top-[28%] -translate-x-1/2 text-center z-20 pointer-events-none">
                  <div
                    className={`ar-arrow transition-transform duration-200 ${hasPulse ? "scale-110 shadow-cyan-400/50" : ""} ${heading === null ? "opacity-60" : ""}`}
                    style={{ transform: `rotate(${arrowRotation}deg)` }}
                    aria-label={heading === null ? "Direction unavailable until compass is ready" : `Direction ${Math.round(targetBearing)} degrees`}
                  >
                    ➜
                  </div>
                  <p className="mt-3 rounded-full bg-slate-950/85 px-4 py-2 text-center text-sm font-bold backdrop-blur border border-white/10 text-cyan-300 shadow-lg">
                    {guidance.actionText}
                  </p>
                  {headingSource === "gps" && (
                    <span className="mt-1.5 inline-block rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-400/30 backdrop-blur">
                      Using GPS direction
                    </span>
                  )}
                  {heading === null && cameraStatus === "active" && (
                    <span className="mt-1.5 inline-block rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-semibold text-amber-200 border border-amber-400/30 backdrop-blur">
                      Move phone in figure-8 to calibrate compass
                    </span>
                  )}
                </div>

                {/* Turn-by-Turn Instruction & Mini-Stats Bottom Card */}
                <div className="absolute bottom-5 left-5 right-5 z-20 rounded-2xl bg-slate-950/85 p-4 backdrop-blur border border-white/10 shadow-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase tracking-[.16em] text-cyan-300">Next instruction</p>
                      <p className="mt-1 font-display text-lg font-bold">{guidance.detailedInstruction}</p>
                      <p className="mt-1 truncate text-xs text-slate-300">
                        Next waypoint: {nextWaypoint?.name ?? destination.name}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-2xl font-medium text-cyan-300">
                        {distanceToNext === null ? "—" : `${distanceToNext} m`}
                      </p>
                      <p className="text-xs text-slate-300">
                        {heading === null
                          ? "heading unavailable"
                          : `${headingSource === "gps" ? "GPS course" : headingReliable ? "heading" : "estimated heading"} ${heading}°`}
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3 h-1.5 rounded-full bg-white/15">
                    <div className="h-full rounded-full bg-cyan-400 transition-[width] duration-300" style={{ width: `${progress.progressPercent}%` }} />
                  </div>

                  {/* Mini Stats Strip */}
                  <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-2.5 text-center text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Remaining</span>
                      <strong className="text-white font-mono">{progress.remainingDistance} m</strong>
                    </div>
                    <div className="border-x border-white/10">
                      <span className="text-slate-400 block text-[10px]">Walking ETA</span>
                      <strong className="text-cyan-300 font-mono">{Math.max(1, Math.ceil(progress.remainingDistance / 1.4 / 60))} min</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Accuracy</span>
                      <strong className="text-cyan-400 font-mono">±{Math.round(location?.accuracy ?? 12)} m</strong>
                    </div>
                  </div>

                  {deviationMessage && (
                    <p className="mt-3 rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs text-amber-100 flex items-center gap-1.5">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                      <span>{deviationMessage}</span>
                    </p>
                  )}
                </div>

                {/* Destination Arrival Modal */}
                {isArrived && (
                  <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-6 backdrop-blur-md">
                    <div className="w-full max-w-sm rounded-3xl border border-cyan-400/40 bg-slate-900 p-6 text-center shadow-2xl">
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-cyan-400 text-slate-950 mb-4 animate-bounce">
                        <CheckCircle2 className="h-10 w-10" />
                      </div>
                      <h2 className="text-2xl font-bold font-display text-white">You have arrived!</h2>
                      <p className="mt-1 text-sm text-cyan-300 font-semibold">{destination.name}</p>
                      <p className="mt-2 text-xs text-slate-400">
                        You reached your destination using AIET PathFinder AR navigation.
                      </p>
                      <Button
                        onClick={() => {
                          exitCamera();
                          window.location.href = "/map";
                        }}
                        className="mt-6 w-full bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400 py-6 text-base rounded-xl"
                      >
                        End Navigation
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Lower Diagnostic / Device Capability Cards */}
        <section className="mx-auto mt-5 grid max-w-5xl gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <Compass className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-3 font-semibold">Motion & orientation</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {heading === null ? "Heading unavailable until the device sends a compass reading." : `${headingReliable ? "Compass heading" : "Estimated device heading"}: ${heading}°.`} AR arrow uses target bearing minus device heading.
            </p>
            <Button variant="outline" onClick={enableOrientation} className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <Smartphone className="mr-2 h-4 w-4" />{orientationStatus === "granted" ? "Refresh orientation" : "Enable motion & orientation"}
            </Button>
            {orientationStatus === "unsupported" && <p className="mt-2 text-xs text-amber-200">Device orientation is not supported here. The map remains the reliable directional guide.</p>}
            {orientationStatus === "denied" && <p className="mt-2 text-xs text-amber-200">Compass access was denied or unavailable. The overlay is not accurately aligned.</p>}
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <LocateFixed className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-3 font-semibold">Live route status</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              {locationStatus === "active" ? `GPS connected · ±${Math.round(location?.accuracy ?? 0)} m` : locationStatus === "requesting" ? "Requesting location permission…" : locationStatus === "signal-lost" ? "Signal lost; waiting for recovery." : "No live position shared yet."}
            </p>
            <Button variant="outline" onClick={requestLocation} className="mt-4 border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <LocateFixed className="mr-2 h-4 w-4" />{locationStatus === "active" ? "Refresh location" : "Enable live location"}
            </Button>
          </article>

          <article className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <RotateCcw className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-3 font-semibold">Three.js 3D Engine</h2>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Rendering real-time glowing TubeGeometry, directional chevrons, and vertical destination beacon anchored to campus GPS coordinates.
            </p>
            <p className="mt-3 text-xs text-cyan-300">Outdoor GPS + Compass alignment mode active.</p>
          </article>
        </section>

        <div className="mx-auto mt-5 flex max-w-5xl justify-start">
          <Link href="/map" onClick={exitCamera} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            <MapIcon className="h-4 w-4" />Return to map navigation
          </Link>
        </div>
      </main>
    </div>
  );
}
