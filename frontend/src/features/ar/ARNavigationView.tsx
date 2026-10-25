import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { Link, useLocation } from "wouter";
import {
  ArrowUp,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Compass,
  FlipHorizontal,
  Map as MapIcon,
  Navigation,
  RefreshCw,
  ShieldAlert,
  SwitchCamera,
  Volume2,
  VolumeX,
  X,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { destinations, campusNodes, campusEdges, getNode } from "@shared/pathfinder";
import { calculateRoute, haversineDistanceMeters } from "@shared/routing";
import { deriveRouteProgress } from "@shared/route-progress";
import { readLiveNavigationSnapshot, writeLiveNavigationSnapshot, clearLiveNavigationSnapshot } from "@shared/live-navigation";
import { useLanguage } from "@/contexts/LanguageContext";

import { useGeolocationWatch } from "./useGeolocationWatch";
import { useDeviceOrientation } from "./useDeviceOrientation";
import { computeTurnGuidance, type TurnGuidanceResult } from "./turnGuidance";
import { ARVoiceAssistant, type WaypointNode } from "./voiceAssistant";
import { ARRouteScene } from "./ARRouteScene";

export default function ARNavigationView() {
  const [, setLocation] = useLocation();
  const { language } = useLanguage();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<ARRouteScene | null>(null);
  const voiceAssistantRef = useRef<ARVoiceAssistant | null>(null);

  // Read persisted or snapshot route parameters
  const [sourceNodeId, setSourceNodeId] = useState<string>(() => {
    const snap = readLiveNavigationSnapshot();
    if (snap?.sourceNodeId) return snap.sourceNodeId;
    return (typeof window !== "undefined" && sessionStorage.getItem("aiet-source")) || "gate";
  });

  const [destinationId, setDestinationId] = useState<string>(() => {
    const snap = readLiveNavigationSnapshot();
    if (snap?.destinationId) return snap.destinationId;
    return (typeof window !== "undefined" && sessionStorage.getItem("pathfinder-destination")) || "d7";
  });

  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);
  const [accessibleOnly] = useState<boolean>(false);
  const [currentWaypointIndex, setCurrentWaypointIndex] = useState<number>(() => {
    const snap = readLiveNavigationSnapshot();
    return snap?.currentWaypointIndex ?? 0;
  });

  // Permission & Hardware states
  const [cameraState, setCameraState] = useState<"idle" | "requesting" | "ready" | "denied">("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isMirrored, setIsMirrored] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [hasPulse, setHasPulse] = useState(false);
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [isArrived, setIsArrived] = useState(false);

  // Hardware sensors
  const geo = useGeolocationWatch(true);
  const orientation = useDeviceOrientation(geo.heading, geo.speed);

  // Resolve Destination & Route
  const destination = useMemo(() => {
    return destinations.find((item) => item.id === destinationId) ?? destinations[0];
  }, [destinationId]);

  const route = useMemo(() => {
    try {
      return calculateRoute(campusNodes, campusEdges, sourceNodeId, destination.nodeId, "auto", accessibleOnly);
    } catch {
      return null;
    }
  }, [sourceNodeId, destination.nodeId, accessibleOnly]);

  const routeNodes: WaypointNode[] = useMemo(() => {
    if (!route) return [];
    return route.nodeIds
      .map(getNode)
      .filter((n): n is NonNullable<typeof n> => Boolean(n))
      .map((n) => ({
        id: n.id,
        name: n.name,
        latitude: n.latitude,
        longitude: n.longitude,
      }));
  }, [route]);

  // Derive live progress
  const progress = useMemo(() => {
    if (geo.position && routeNodes.length > 0) {
      return deriveRouteProgress(geo.position, routeNodes as any, currentWaypointIndex);
    }
    return {
      currentWaypointIndex,
      totalWaypoints: routeNodes.length,
      remainingDistance: route?.totalDistance ?? 0,
      progressPercent: 0,
      isComplete: false,
      distanceToCurrentWaypoint: 0,
      arrivalThreshold: 6,
    };
  }, [geo.position, routeNodes, currentWaypointIndex, route?.totalDistance]);

  const activeWaypointIdx = Math.max(currentWaypointIndex, progress.currentWaypointIndex);
  const targetWaypoint = routeNodes[activeWaypointIdx] ?? routeNodes[routeNodes.length - 1];

  // Turn guidance
  const guidance: TurnGuidanceResult = useMemo(() => {
    const origin = geo.position ?? (routeNodes[0] ? { latitude: routeNodes[0].latitude, longitude: routeNodes[0].longitude } : null);
    if (!origin || !targetWaypoint) {
      return {
        bearingToNext: 0,
        relativeAngle: 0,
        turnType: "straight",
        actionText: "Aligning route...",
        detailedInstruction: "Acquiring live GPS fix...",
        distanceToNextMeters: 0,
        isCloseToTurn: false,
      };
    }
    return computeTurnGuidance(origin, targetWaypoint, orientation.heading);
  }, [geo.position, targetWaypoint, orientation.heading, routeNodes]);

  // Automated off-route recalculation callback
  const handleAutomatedReroute = useCallback(async (): Promise<boolean> => {
    if (!geo.position) return false;

    // Find nearest safe campus node to user's position
    let closestNode = campusNodes[0];
    let minDistance = Infinity;

    for (const node of campusNodes) {
      const d = haversineDistanceMeters(geo.position, node);
      if (d < minDistance) {
        minDistance = d;
        closestNode = node;
      }
    }

    try {
      const newRoute = calculateRoute(campusNodes, campusEdges, closestNode.id, destination.nodeId, "auto", accessibleOnly);
      if (newRoute && newRoute.nodeIds.length > 0) {
        setSourceNodeId(closestNode.id);
        setCurrentWaypointIndex(0);
        setIsOffRoute(false);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [geo.position, destination.nodeId, accessibleOnly]);

  // 1. Initialize Camera
  const startCamera = useCallback(async (targetFacing?: "environment" | "user") => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraState("denied");
      setPermissionError("Camera access is not supported in this browser environment.");
      return;
    }

    const desiredFacing = targetFacing === "user" || targetFacing === "environment" ? targetFacing : facingMode;
    setCameraState("requesting");
    setPermissionError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: desiredFacing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const videoTrack = stream.getVideoTracks?.()?.[0];
      const actualSettings = videoTrack?.getSettings?.() as MediaTrackSettings | undefined;
      const actualFacing = actualSettings?.facingMode;
      if (actualFacing === "user" || actualFacing === "environment") {
        setFacingMode(actualFacing);
        setIsMirrored(actualFacing === "user");
      } else {
        setFacingMode(desiredFacing);
        if (desiredFacing === "user") {
          setIsMirrored(true);
        }
      }
      setCameraState("ready");
    } catch (err: any) {
      console.warn("Camera access failed:", err);
      setCameraState("denied");
      setPermissionError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Camera permission was denied. Camera overlay requires user permission."
          : "Unable to start device camera. Please check your camera settings."
      );
    }
  }, [facingMode]);

  const toggleFacingMode = useCallback(async () => {
    const nextFacing: "environment" | "user" = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextFacing);
    setIsMirrored(nextFacing === "user");
    await startCamera(nextFacing);
  }, [facingMode, startCamera]);

  const toggleMirror = useCallback(() => {
    setIsMirrored((prev) => !prev);
  }, []);

  // 2. Initialize Three.js Scene
  useEffect(() => {
    if (!canvasRef.current || sceneRef.current) return;

    const scene = new ARRouteScene(canvasRef.current);
    sceneRef.current = scene;

    const handleResize = () => {
      if (canvasRef.current && sceneRef.current) {
        sceneRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      scene.destroy();
      sceneRef.current = null;
    };
  }, []);

  // 3. Initialize Voice Assistant
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

  // Synchronize Three.js Scene with Waypoints
  useEffect(() => {
    if (sceneRef.current && routeNodes.length > 0) {
      sceneRef.current.setWaypoints(routeNodes);
    }
  }, [routeNodes]);

  // Synchronize GPS & Heading with Three.js Scene and Voice Assistant
  useEffect(() => {
    if (!sceneRef.current) return;

    if (geo.position) {
      sceneRef.current.setUserPosition(geo.position);
    }
    if (orientation.heading !== null) {
      sceneRef.current.setHeading(orientation.heading);
    }
    sceneRef.current.setActiveWaypointIndex(activeWaypointIdx);
    sceneRef.current.setTurnGuidance(
      guidance.bearingToNext,
      guidance.relativeAngle,
      guidance.isCloseToTurn,
      guidance.turnType
    );

    // Check arrival
    if (progress.isComplete || (targetWaypoint && geo.position && haversineDistanceMeters(geo.position, targetWaypoint) <= 5 && activeWaypointIdx === routeNodes.length - 1)) {
      setIsArrived(true);
    }

    // Process Voice Guidance & Off-Route detection
    if (voiceAssistantRef.current && geo.position) {
      voiceAssistantRef.current.processUpdate(
        geo.position,
        activeWaypointIdx,
        routeNodes,
        guidance,
        progress.isComplete || isArrived
      );
    }

    // Save snapshot so returning to /map keeps active progress
    writeLiveNavigationSnapshot({
      active: true,
      sourceNodeId,
      destinationId,
      currentWaypointIndex: activeWaypointIdx,
      totalWaypoints: routeNodes.length,
      progressPercent: progress.progressPercent,
      remainingDistance: progress.remainingDistance,
      currentInstruction: guidance.detailedInstruction,
      currentVoiceInstruction: guidance.actionText,
      isComplete: progress.isComplete || isArrived,
      positionSource: "gps",
      position: {
        latitude: geo.position?.latitude ?? 0,
        longitude: geo.position?.longitude ?? 0,
        accuracy: geo.accuracy ?? 999,
        heading: orientation.heading ?? undefined,
        speed: geo.speed ?? undefined,
      },
      updatedAt: Date.now(),
    });
  }, [
    geo.position,
    geo.accuracy,
    geo.speed,
    orientation.heading,
    activeWaypointIdx,
    routeNodes,
    guidance,
    progress.isComplete,
    progress.progressPercent,
    progress.remainingDistance,
    sourceNodeId,
    destinationId,
    targetWaypoint,
    isArrived,
  ]);

  // Waypoint reached visual pulse
  useEffect(() => {
    if (guidance.isCloseToTurn) {
      setHasPulse(true);
      const timer = setTimeout(() => setHasPulse(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [guidance.isCloseToTurn]);

  // Start Camera on Mount
  useEffect(() => {
    startCamera();
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [startCamera]);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.setEnabled(next);
    }
  };

  const handleEndNavigation = () => {
    clearLiveNavigationSnapshot();
    if (voiceAssistantRef.current) {
      voiceAssistantRef.current.stop();
    }
    setLocation("/map");
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 font-sans text-white select-none">
      {/* 1. Camera Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ transform: isMirrored ? "scaleX(-1)" : "none" }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300"
      />

      {/* 2. Three.js 3D WebGL Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full pointer-events-none z-10"
      />

      {/* Camera / Permission Fallback Banner */}
      {cameraState === "denied" && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/90 p-6 text-center">
          <ShieldAlert className="h-14 w-14 text-amber-400 mb-3" />
          <h2 className="text-xl font-bold font-display text-white">Camera Preview Unavailable</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-sm">
            {permissionError || "Camera permission is required to display the real-world 3D AR pathway."}
          </p>
          <div className="mt-5 flex gap-3">
            <Button onClick={() => startCamera()} className="bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400">
              <Camera className="mr-2 h-4 w-4" />Retry Camera
            </Button>
            <Button variant="outline" onClick={() => setLocation("/map")} className="border-slate-700 text-white">
              <MapIcon className="mr-2 h-4 w-4" />Open 2D Map
            </Button>
          </div>
        </div>
      )}

      {/* iOS Motion Permission Prompt if needed */}
      {orientation.permissionStatus === "prompt" && orientation.isSupported && (
        <div className="absolute top-20 left-4 right-4 z-40 rounded-2xl border border-cyan-400/40 bg-slate-950/85 p-4 backdrop-blur-md shadow-xl text-center">
          <Compass className="mx-auto h-8 w-8 text-cyan-300 animate-pulse mb-2" />
          <h3 className="font-bold text-white text-base">Enable Compass Alignment</h3>
          <p className="text-xs text-slate-300 mt-1">Tap below to grant motion access so the 3D route locks to your real-world heading.</p>
          <Button
            onClick={() => orientation.requestPermission()}
            className="mt-3 w-full bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400"
          >
            Enable Orientation
          </Button>
        </div>
      )}

      {/* 3. Top Navigation Bar */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between p-4 bg-gradient-to-b from-slate-950/80 via-slate-950/40 to-transparent">
        <Link
          href="/map"
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-slate-950/70 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md hover:bg-white/20 transition"
        >
          <ChevronLeft className="h-4 w-4 text-cyan-400" />
          2D Map
        </Link>

        <div className="flex items-center gap-2">
          {/* Flip / Switch Camera (Rear <-> Front) */}
          <button
            type="button"
            onClick={toggleFacingMode}
            title={`Switch to ${facingMode === "environment" ? "front" : "rear"} camera`}
            className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-slate-950/70 px-2.5 py-1 text-xs font-semibold backdrop-blur-md border border-white/10 text-white hover:bg-white/10 active:scale-95 transition"
            aria-label="Switch camera"
          >
            <SwitchCamera className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-[11px]">{facingMode === "environment" ? "Rear" : "Front"}</span>
          </button>

          {/* Mirror / Flip View Horizontally */}
          <button
            type="button"
            onClick={toggleMirror}
            title={isMirrored ? "Unflip view (normal)" : "Flip view right (mirror)"}
            className={`grid h-8 w-8 place-items-center rounded-full backdrop-blur-md border transition active:scale-95 ${
              isMirrored
                ? "bg-cyan-500/25 border-cyan-400 text-cyan-300 ring-2 ring-cyan-400/30"
                : "bg-slate-950/70 border-white/10 text-slate-300 hover:bg-white/10"
            }`}
            aria-label={isMirrored ? "Mirror active, click to unflip" : "Flip camera horizontally"}
          >
            <FlipHorizontal className="h-3.5 w-3.5" />
          </button>

          <Badge className="border border-cyan-400/30 bg-cyan-950/60 text-cyan-300 text-xs backdrop-blur-md">
            <Navigation className="mr-1 h-3 w-3" />
            {destination.name}
          </Badge>

          <button
            onClick={toggleVoice}
            aria-label={voiceEnabled ? "Mute Voice" : "Enable Voice"}
            className={`p-2 rounded-full border backdrop-blur-md transition ${
              voiceEnabled
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-300"
                : "border-white/10 bg-slate-950/70 text-slate-400"
            }`}
          >
            {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 4. Directional HUD (Turn-by-Turn Overlay) */}
      <div className="absolute top-16 left-4 right-4 z-20 flex flex-col items-center">
        <div
          className={`w-full max-w-sm rounded-2xl border border-cyan-500/30 bg-slate-950/85 p-4 shadow-2xl backdrop-blur-md transition-all duration-300 ${
            hasPulse ? "ring-4 ring-cyan-400/50 scale-[1.02]" : ""
          }`}
        >
          <div className="flex items-center gap-4">
            {/* Dynamic Directional Arrow rotating smoothly with relative bearing */}
            <div
              className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30 transition-transform duration-200 ${
                hasPulse ? "animate-pulse" : ""
              }`}
              style={{
                transform: `rotate(${Math.round(guidance.relativeAngle)}deg)`,
              }}
            >
              <ArrowUp className="h-8 w-8 stroke-[2.5]" />
            </div>

            {/* Turn instruction text */}
            <div className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                {guidance.actionText}
              </span>
              <h2 className="mt-0.5 truncate text-lg font-bold font-display text-white">
                {guidance.detailedInstruction}
              </h2>
              <p className="text-xs text-slate-400 truncate">
                Waypoint {activeWaypointIdx + 1} of {routeNodes.length}: {targetWaypoint?.name ?? destination.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Off-Route Alert Banner */}
      {isOffRoute && (
        <div className="absolute top-44 left-4 right-4 z-20 mx-auto max-w-sm flex items-start gap-3 rounded-xl border border-amber-400/50 bg-amber-950/90 p-3 text-amber-200 backdrop-blur-md shadow-lg animate-bounce">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold">You're off the planned route.</p>
            <p className="text-amber-300/90 mt-0.5">Recalculating shortest path from current location...</p>
          </div>
        </div>
      )}

      {/* 5. Mini-Stats Strip at Bottom */}
      <footer className="absolute bottom-6 left-4 right-4 z-30 mx-auto max-w-md">
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-950/85 p-3.5 backdrop-blur-md shadow-2xl">
          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-400">Remaining</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-white">
              {progress.remainingDistance} m
            </p>
          </div>

          <div className="text-center border-x border-white/10">
            <p className="text-[11px] font-medium text-slate-400">Walking ETA</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-cyan-300">
              {Math.max(1, Math.ceil(progress.remainingDistance / 1.4 / 60))} min
            </p>
          </div>

          <div className="text-center">
            <p className="text-[11px] font-medium text-slate-400">Accuracy</p>
            <p className="mt-0.5 text-base font-bold tabular-nums text-cyan-400">
              ±{Math.round(geo.accuracy ?? 12)} m
            </p>
          </div>
        </div>

        {/* Live compass orientation indicator */}
        <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-slate-400">
          <Compass className="h-3 w-3 text-cyan-400 animate-spin" style={{ animationDuration: "12s" }} />
          <span>Compass Heading: {orientation.heading !== null ? `${Math.round(orientation.heading)}°` : "Aligning..."}</span>
          <span>•</span>
          <span>Mode: Three.js 3D AR</span>
        </div>
      </footer>

      {/* 6. Destination Arrival Modal Dialog */}
      {isArrived && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-md">
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
              onClick={handleEndNavigation}
              className="mt-6 w-full bg-cyan-500 font-bold text-slate-950 hover:bg-cyan-400 py-6 text-base rounded-xl"
            >
              End Navigation
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
