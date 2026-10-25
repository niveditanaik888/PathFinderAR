import { CampusMap, MapPosition } from "@/components/CampusMap";
import { TopNav } from "@/components/TopNav";
import { Search as SearchComponent } from "@/components/Search";
import { useAuth } from "@/_core/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { clearAssistantRouteLaunch, readAssistantRouteLaunch, resolveMapRouteLaunchState } from "@/lib/assistantRouteLaunch";
import { speakText } from "@/lib/browserSpeech";
import { useLanguage } from "@/contexts/LanguageContext";
import { createLocalizedVoiceGuidance } from "@shared/voice-guidance";
import { calculateRoute, createRouteInstructions, evaluateRouteDeviation, haversineDistanceMeters } from "@shared/routing";
import { deriveRouteManeuvers, isWaypointReached } from "@shared/maneuvers";
import { StepByStepGuidancePanel } from "@/components/StepByStepGuidancePanel";
import { deriveRouteProgress } from "@shared/route-progress";
import { clearLiveNavigationSnapshot, writeLiveNavigationSnapshot } from "@shared/live-navigation";
import { assessLocationSample, locationQualityForAge, type LocationQuality } from "@shared/location-quality";
import { campusEdges, campusNodes, DEVIATION_THRESHOLD_METERS, destinations, getNode, REROUTE_COOLDOWN_MS } from "@shared/pathfinder";
import { normalizeRouteSelection, readRouteSelection, routeSelectionSearch, routableSourceNodes, routeDestination, writeRouteSelection } from "@shared/route-selection";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronLeft,
  Compass,
  Heart,
  LocateFixed,
  Map as MapIcon,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Route,
  Search,
  ShieldAlert,
  Sparkles,
  Volume2,
  VolumeX,
  X,
  Zap,
  Radio,
  Wifi,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation } from "wouter";

type LocationState = Omit<MapPosition, "accuracy"> & { accuracy: number; speed?: number; timestamp?: number };

export default function MapNavigation() {
  const [, setLocation] = useLocation();
  const [assistantLaunch] = useState(() => readAssistantRouteLaunch());
  const [mapLaunch] = useState(() => {
    const persisted = readRouteSelection(sessionStorage, window.location.search);
    return resolveMapRouteLaunchState(assistantLaunch, persisted);
  });
  const [routeSelection, setRouteSelection] = useState(() =>
    normalizeRouteSelection(assistantLaunch ?? readRouteSelection(sessionStorage, window.location.search))
  );
  const destinationId = routeSelection.destinationId;
  const sourceNodeId = routeSelection.sourceNodeId;
  const [position, setPosition] = useState<LocationState | undefined>();
  const [locationMessage, setLocationMessage] = useState("Location not yet shared. Route preview is not a live position.");
  const [locationQuality, setLocationQuality] = useState<LocationQuality>("unavailable");
  const [tracking, setTracking] = useState(false);
  const [accessibleOnly, setAccessibleOnly] = useState(() => mapLaunch.accessibleOnly);
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [voiceOn, setVoiceOn] = useState(() => mapLaunch.voiceOn);
  const [persistedRouteId, setPersistedRouteId] = useState<number | null>(null);
  const [deviationCount, setDeviationCount] = useState(0);
  const [rerouteStartNodeId, setRerouteStartNodeId] = useState<string | null>(null);
  const [locateTrigger, setLocateTrigger] = useState(0);
  const [gpsAutoDetected, setGpsAutoDetected] = useState(false);
  const [gpsPermissionStatus, setGpsPermissionStatus] = useState<"prompting" | "granted" | "denied" | "unsupported" | "idle">("idle");
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Default to using live Current Location unless user explicitly selects a manual fixed starting node
  const [useCurrentLocation, setUseCurrentLocation] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const fromParam = params.get("from") ?? params.get("source");
    return !fromParam || fromParam === "current-location" || fromParam === "gate";
  });

  const lastRerouteAt = useRef<number | undefined>(undefined);
  const lastProgressPersistedAt = useRef(0);
  const announcedVoiceWaypoints = useRef<Set<number>>(new Set());
  const announcedVoiceRouteKey = useRef<string | undefined>(undefined);
  const { user } = useAuth();
  const { language } = useLanguage();
  const assistantLaunchHandled = useRef(false);

  const destination = routeDestination(destinationId) ?? destinations[0];

  // Nearest campus node to the user's live GPS position
  const liveNearestNode = useMemo(() => {
    if (!position) return null;
    return campusNodes
      .filter((n) => !accessibleOnly || n.isAccessible)
      .reduce((closest, node) => {
        return haversineDistanceMeters(position, node) < haversineDistanceMeters(position, closest) ? node : closest;
      }, campusNodes[0]);
  }, [position, accessibleOnly]);

  const startNodeId = useMemo(() => {
    if (rerouteStartNodeId) return rerouteStartNodeId;
    if (useCurrentLocation && liveNearestNode) return liveNearestNode.id;
    if (sourceNodeId === "current-location") return liveNearestNode?.id ?? "gate";
    return sourceNodeId;
  }, [rerouteStartNodeId, useCurrentLocation, liveNearestNode, sourceNodeId]);

  const sourceNode = useMemo(() => {
    if (useCurrentLocation) {
      if (position) {
        const nearest = liveNearestNode ?? getNode(startNodeId) ?? campusNodes[0];
        return {
          ...nearest,
          name: `Current Location (${nearest.name})`,
          latitude: position.latitude,
          longitude: position.longitude,
        };
      }
      const refNode = getNode(startNodeId) ?? campusNodes[0];
      return {
        ...refNode,
        name: "Current Location",
      };
    }
    return getNode(startNodeId);
  }, [useCurrentLocation, position, liveNearestNode, startNodeId]);

  const route = useMemo(() => {
    if (startNodeId === destination.nodeId) {
      return {
        algorithm: "dijkstra" as const,
        nodeIds: [startNodeId],
        totalDistance: 0,
        estimatedTime: 0,
        visitedNodeCount: 1,
        executionTimeMs: 0,
      };
    }
    try {
      return calculateRoute(campusNodes, campusEdges, startNodeId, destination.nodeId, "auto", accessibleOnly);
    } catch {
      return null;
    }
  }, [destination.nodeId, accessibleOnly, startNodeId]);

  const routeNodes = useMemo(
    () => route?.nodeIds.map(getNode).filter((node): node is NonNullable<typeof node> => Boolean(node)) ?? [],
    [route]
  );

  const instructions = useMemo(() => (route ? createRouteInstructions(campusNodes, route.nodeIds) : []), [route]);
  const maneuvers = useMemo(() => (route ? deriveRouteManeuvers(campusNodes, route.nodeIds) : []), [route]);

  const routeError = !route
    ? "No walking route is currently available between these locations."
    : startNodeId === destination.nodeId
    ? "Starting point and destination are the same location."
    : undefined;

  const liveProgress = useMemo(
    () =>
      position
        ? deriveRouteProgress(position, routeNodes, currentStep)
        : {
            currentWaypointIndex: currentStep,
            totalWaypoints: routeNodes.length,
            remainingDistance: Math.max(
              0,
              Math.round((route?.totalDistance ?? 0) * (1 - currentStep / Math.max(1, routeNodes.length - 1)))
            ),
            progressPercent: Math.round((currentStep / Math.max(1, routeNodes.length - 1)) * 100),
            isComplete: false,
            distanceToCurrentWaypoint: 0,
            arrivalThreshold: 18,
          },
    [position, routeNodes, currentStep, route?.totalDistance]
  );

  const activeWaypointIndex = Math.max(currentStep, liveProgress.currentWaypointIndex);
  const activeManeuverIndex = Math.min(activeWaypointIndex, Math.max(0, maneuvers.length - 1));
  const currentInstruction =
    maneuvers[activeManeuverIndex]?.instruction ??
    instructions[Math.min(activeWaypointIndex, instructions.length - 1)] ??
    "Route ready.";

  const voiceLanguage = assistantLaunch?.language ?? language;
  const localizedVoiceInstructions = useMemo(
    () => createLocalizedVoiceGuidance(routeNodes.map((node) => node.name), voiceLanguage),
    [routeNodes, voiceLanguage]
  );
  const voiceRouteKey = route?.nodeIds.join("|") ?? "unavailable";
  const activeVoiceWaypointIndex = liveProgress.isComplete
    ? Math.max(0, localizedVoiceInstructions.length - 1)
    : Math.min(activeWaypointIndex, Math.max(0, localizedVoiceInstructions.length - 1));
  const currentVoiceInstruction = localizedVoiceInstructions[activeVoiceWaypointIndex] ?? currentInstruction;

  const startSession = trpc.routing.startSession.useMutation({
    onSuccess: (result) => setPersistedRouteId(result.routeId),
  });
  const completeSession = trpc.routing.completeSession.useMutation();
  const updateProgress = trpc.routing.updateProgress.useMutation();
  const recordDeviation = trpc.routing.recordDeviation.useMutation();
  const utils = trpc.useUtils();
  const favoriteRoutes = trpc.favorites.list.useQuery(undefined, { enabled: Boolean(user) });
  const saveFavorite = trpc.favorites.save.useMutation({ onSuccess: () => utils.favorites.list.invalidate() });
  const removeFavorite = trpc.favorites.remove.useMutation({ onSuccess: () => utils.favorites.list.invalidate() });
  const currentFavorite = favoriteRoutes.data?.find(
    (item) =>
      item.sourceNodeExternalId === sourceNodeId &&
      item.destinationExternalId === destinationId &&
      item.accessibleOnly === accessibleOnly
  );

  const applyGpsPosition = (next: LocationState) => {
    setPosition((previous) => {
      const assessment = assessLocationSample(previous, next);
      if (!assessment.accepted || !assessment.sample) {
        setLocationQuality(assessment.quality);
        setLocationMessage(
          assessment.reason === "implausible-jump"
            ? "GPS jump ignored. Waiting for a stable position."
            : assessment.reason === "low-accuracy"
            ? "GPS accuracy is too low for reliable route progress. Move outdoors."
            : "Waiting for a newer GPS position."
        );
        return previous;
      }
      setLocationQuality(assessment.quality);
      setLocationMessage(
        assessment.quality === "low-accuracy"
          ? `Live GPS connected, but accuracy is low (±${Math.round(assessment.sample.accuracy)} m). Move outdoors.`
          : `Live GPS connected • ±${Math.round(assessment.sample.accuracy)} m`
      );
      return assessment.sample;
    });
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationQuality("unavailable");
      setLocationMessage("Geolocation is not supported in this browser. Map guidance remains available.");
      return;
    }
    setLocationQuality("unavailable");
    setLocationMessage("Requesting live GPS permission…");
    navigator.geolocation.getCurrentPosition(
      (result) => {
        applyGpsPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
          heading: result.coords.heading ?? undefined,
          speed: result.coords.speed ?? undefined,
          timestamp: result.timestamp,
        });
      },
      (error) => {
        const messages: Record<number, string> = {
          1: "Location permission was denied. Map guidance remains available; no simulated position is shown.",
          2: "Location is currently unavailable. Try moving outdoors or use map guidance.",
          3: "Location request timed out. Please try again.",
        };
        setLocationQuality(error.code === 1 ? "unavailable" : "signal-lost");
        setLocationMessage(messages[error.code] ?? "Location could not be obtained.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );
  };

  // Continuous live GPS tracking on the map (always active)
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsPermissionStatus("unsupported");
      setLocationQuality("unavailable");
      setLocationMessage("Geolocation is not supported in this browser. Map guidance remains available.");
      return;
    }

    setGpsPermissionStatus("prompting");
    const watcher = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsPermissionStatus("granted");
        const fix: LocationState = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          timestamp: pos.timestamp,
        };
        applyGpsPosition(fix);

        // Snap to nearest campus node if using Current Location
        const nearestNode = campusNodes
          .filter((n) => !accessibleOnly || n.isAccessible)
          .reduce((closest, node) => {
            return haversineDistanceMeters(fix, node) < haversineDistanceMeters(fix, closest) ? node : closest;
          }, campusNodes[0]);

        setGpsAutoDetected(true);
        setLocationMessage(
          `Live location active • Near ${nearestNode.name} (±${Math.round(pos.coords.accuracy)} m)`
        );
      },
      (err) => {
        if (err.code === 1) {
          setGpsPermissionStatus("denied");
          setLocationQuality("unavailable");
          setLocationMessage("Location permission denied. Map preview shown from Main Gate.");
        } else {
          setLocationQuality("signal-lost");
          setLocationMessage("Waiting for GPS signal recovery…");
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watcher);
    };
  }, [accessibleOnly]);

  // Voice cues
  useEffect(() => {
    if (active && announcedVoiceRouteKey.current !== voiceRouteKey) {
      announcedVoiceWaypoints.current.clear();
      announcedVoiceRouteKey.current = voiceRouteKey;
      if (currentStep !== 0) {
        setCurrentStep(0);
        return;
      }
    }
    if (!voiceOn || !active || !currentVoiceInstruction || announcedVoiceWaypoints.current.has(activeVoiceWaypointIndex))
      return;
    announcedVoiceWaypoints.current.add(activeVoiceWaypointIndex);
    speakText(currentVoiceInstruction, voiceLanguage);
  }, [voiceOn, active, voiceRouteKey, currentStep, activeVoiceWaypointIndex, currentVoiceInstruction, voiceLanguage]);

  // Off-route detection and auto-recalculation
  useEffect(() => {
    if (!active || !position) return;
    const deviation = evaluateRouteDeviation(
      position,
      routeNodes,
      DEVIATION_THRESHOLD_METERS,
      lastRerouteAt.current,
      REROUTE_COOLDOWN_MS
    );
    if (deviation.shouldReroute) {
      const nearestSafeNode = campusNodes
        .filter((node) => node.isAccessible)
        .reduce((closest, node) =>
          haversineDistanceMeters(position, node) < haversineDistanceMeters(position, closest) ? node : closest,
          campusNodes[0]
        );
      setOffRoute(true);
      setRerouteStartNodeId(nearestSafeNode.id);
      setLocationMessage(`You're off the planned route. Rerouting from ${nearestSafeNode.name}.`);
      if (voiceOn) {
        speakText(`You're off route. Rerouting from ${nearestSafeNode.name}.`, voiceLanguage);
      }
      lastRerouteAt.current = Date.now();
      setDeviationCount((count) => count + 1);
      if (persistedRouteId) {
        recordDeviation.mutate({
          routeId: persistedRouteId,
          latitude: position.latitude,
          longitude: position.longitude,
          distanceFromRoute: deviation.distanceFromRoute,
          rerouted: true,
        });
      }
    } else if (!deviation.isOffRoute) {
      setOffRoute(false);
    }
  }, [active, position, routeNodes, persistedRouteId, voiceOn, voiceLanguage]);

  // Live GPS proximity auto-advancement
  useEffect(() => {
    if (!active || !position || routeNodes.length === 0) return;
    const targetWaypoint = routeNodes[Math.min(currentStep + 1, routeNodes.length - 1)];
    if (targetWaypoint && currentStep < routeNodes.length - 1) {
      if (isWaypointReached(position, targetWaypoint, 8)) {
        setCurrentStep((step) => Math.min(routeNodes.length - 1, step + 1));
      }
    }
  }, [active, position, currentStep, routeNodes]);

  // Sync snapshot
  useEffect(() => {
    if (!active || !position) {
      if (!active) clearLiveNavigationSnapshot();
      return;
    }
    writeLiveNavigationSnapshot({
      active: true,
      sourceNodeId: startNodeId,
      destinationId,
      currentWaypointIndex: activeWaypointIndex,
      totalWaypoints: liveProgress.totalWaypoints,
      progressPercent: liveProgress.progressPercent,
      remainingDistance: liveProgress.remainingDistance,
      currentInstruction,
      currentVoiceInstruction,
      isComplete: liveProgress.isComplete,
      positionSource: "gps",
      position: { ...position, accuracy: position.accuracy ?? 999 },
      updatedAt: Date.now(),
    });
  }, [
    active,
    position,
    startNodeId,
    destinationId,
    activeWaypointIndex,
    liveProgress.totalWaypoints,
    liveProgress.progressPercent,
    liveProgress.remainingDistance,
    currentInstruction,
    currentVoiceInstruction,
    liveProgress.isComplete,
  ]);

  // Persist session progress
  useEffect(() => {
    if (!active || !persistedRouteId || !user || !position || updateProgress.isPending) return;
    const now = Date.now();
    if (!liveProgress.isComplete && now - lastProgressPersistedAt.current < 5000) return;
    lastProgressPersistedAt.current = now;
    updateProgress.mutate({
      routeId: persistedRouteId,
      currentWaypointIndex: activeWaypointIndex,
      totalWaypoints: liveProgress.totalWaypoints,
      remainingDistance: liveProgress.remainingDistance,
      navigationState: liveProgress.isComplete ? "completed" : "active",
    });
  }, [
    active,
    persistedRouteId,
    user,
    position,
    activeWaypointIndex,
    liveProgress.totalWaypoints,
    liveProgress.remainingDistance,
    liveProgress.isComplete,
    updateProgress,
  ]);

  const startNavigation = () => {
    if (!route || routeError) return;
    announcedVoiceWaypoints.current.clear();
    announcedVoiceRouteKey.current = voiceRouteKey;
    setActive(true);
    setTracking(true);
    setCurrentStep(0);
    setDeviationCount(0);
    setRerouteStartNodeId(null);
    lastProgressPersistedAt.current = 0;
    setLocationQuality(position ? locationQuality : "unavailable");
    if (!position) {
      setLocationMessage(
        "Navigation started as a route preview. Tap Locate and grant GPS permission for live tracking."
      );
    }
    if (user) {
      startSession.mutate({
        algorithm: route.algorithm,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        startLatitude: position?.latitude,
        startLongitude: position?.longitude,
        waypoints: routeNodes.map((node, index) => ({
          latitude: node.latitude,
          longitude: node.longitude,
          instruction: instructions[index],
        })),
      });
    }
  };

  useEffect(() => {
    if (!mapLaunch.autoStart || assistantLaunchHandled.current) return;
    assistantLaunchHandled.current = true;
    clearAssistantRouteLaunch();
    startNavigation();
  }, [mapLaunch]);

  const finishNavigation = () => {
    setActive(false);
    setTracking(false);
    clearLiveNavigationSnapshot();
    if (persistedRouteId && user) {
      completeSession.mutate({
        routeId: persistedRouteId,
        completionStatus: liveProgress.isComplete || activeWaypointIndex >= instructions.length - 1 ? "completed" : "stopped",
        deviationCount,
        actualDistance: (route?.totalDistance ?? 0) - liveProgress.remainingDistance,
      });
    }
    setPersistedRouteId(null);
  };

  const toggleFavorite = () => {
    if (!route || routeError) return;
    if (!user) {
      setLocation("/account");
      return;
    }
    if (currentFavorite) {
      removeFavorite.mutate({ favoriteId: currentFavorite.id });
      return;
    }
    saveFavorite.mutate({
      label: `${sourceNode?.name ?? "Start"} → ${destination.name}`,
      sourceNodeExternalId: sourceNodeId,
      destinationExternalId: destinationId,
      accessibleOnly,
    });
  };

  const applySelection = (nextSourceNodeId: string, nextDestinationId: string) => {
    const next = writeRouteSelection({ sourceNodeId: nextSourceNodeId, destinationId: nextDestinationId }, sessionStorage);
    setRouteSelection(next);
    window.history.replaceState({}, "", `/map${routeSelectionSearch(next)}`);
    setRerouteStartNodeId(null);
    setOffRoute(false);
    setCurrentStep(0);
    clearLiveNavigationSnapshot();
  };

  const launchFavorite = (favorite: NonNullable<typeof favoriteRoutes.data>[number]) => {
    setAccessibleOnly(favorite.accessibleOnly);
    applySelection(favorite.sourceNodeExternalId, favorite.destinationExternalId);
  };

  const handleRecalculate = () => {
    if (!route) return;
    let fromNodeId = sourceNodeId;
    if (position) {
      const nearestSafe = campusNodes
        .filter((n) => !accessibleOnly || n.isAccessible)
        .reduce((closest, n) => {
          return haversineDistanceMeters(position, n) < haversineDistanceMeters(position, closest) ? n : closest;
        }, campusNodes[0]);
      fromNodeId = nearestSafe.id;
    }
    setRerouteStartNodeId(fromNodeId);
    setOffRoute(false);
    setCurrentStep(0);
    announcedVoiceWaypoints.current.clear();
    announcedVoiceRouteKey.current = undefined;
    const nodeName = getNode(fromNodeId)?.name ?? "current location";
    setLocationMessage(`Route recalculated from ${nodeName}.`);
    if (voiceOn) {
      speakText(`Route recalculated from ${nodeName}.`, voiceLanguage);
    }
  };

  const handleToggleVoice = () => {
    const next = !voiceOn;
    setVoiceOn(next);
    if (!next) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleLocateClick = () => {
    setLocateTrigger((prev) => prev + 1);
    requestLocation();
  };

  const handleOpenAR = () => {
    const effectiveStart =
      useCurrentLocation && liveNearestNode
        ? liveNearestNode.id
        : sourceNodeId === "current-location"
        ? liveNearestNode?.id ?? "current-location"
        : startNodeId;
    sessionStorage.setItem("aiet-source", effectiveStart);
    sessionStorage.setItem("pathfinder-destination", destinationId);
    writeLiveNavigationSnapshot({
      active: true,
      sourceNodeId: effectiveStart,
      destinationId,
      currentWaypointIndex: activeWaypointIndex,
      totalWaypoints: liveProgress.totalWaypoints,
      progressPercent: liveProgress.progressPercent,
      remainingDistance: liveProgress.remainingDistance,
      currentInstruction,
      currentVoiceInstruction,
      isComplete: liveProgress.isComplete,
      positionSource: "gps",
      position: {
        latitude: position?.latitude ?? 0,
        longitude: position?.longitude ?? 0,
        accuracy: position?.accuracy ?? 12,
        heading: position?.heading,
        speed: position?.speed,
      },
      updatedAt: Date.now(),
    });
    setLocation("/ar");
  };

  const speedDisplay =
    position?.speed !== undefined && position.speed > 0.1
      ? `${(position.speed * 3.6).toFixed(1)} km/h`
      : active
      ? "3.6 km/h"
      : "0 km/h";

  const totalDistanceMeters = active ? liveProgress.remainingDistance : (route?.totalDistance ?? 0);
  const totalMinutes = Math.max(1, Math.ceil((route?.estimatedTime ?? 60) / 60));

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <TopNav />

      {/* Main Full-Bleed Map View with Floating RVCE-Style Controls */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Full-Bleed Campus Map */}
        <CampusMap
          nodes={campusNodes}
          route={routeNodes}
          source={sourceNode}
          destination={getNode(destination.nodeId)}
          userPosition={position}
          onLocate={handleLocateClick}
          locateTrigger={locateTrigger}
          onLocationFound={(pos) => applyGpsPosition({ ...pos, accuracy: pos.accuracy ?? 12 })}
          isNavigating={active}
          className="h-full w-full"
        />

        {/* TOP FLOATING ROUTE BAR: Back Button + Starting Point + Destination + Status */}
        <div className="absolute left-4 right-4 top-4 z-[500] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {/* Back Button */}
            <Link
              href="/destinations"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-slate-200/90 bg-white/95 text-slate-700 shadow-md backdrop-blur-md transition hover:bg-slate-50"
              aria-label="Back to route planner"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>

            {/* Starting Point Selector */}
            <div className="flex items-center rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md text-xs font-semibold text-slate-700">
              <span className="mr-2 text-slate-400">From:</span>
              <select
                id="map-source-select"
                aria-label="Starting point"
                value={useCurrentLocation ? "current-location" : sourceNodeId}
                onChange={(e) => {
                  if (e.target.value === "current-location") {
                    setUseCurrentLocation(true);
                    setRerouteStartNodeId(null);
                    applySelection("current-location", destinationId);
                  } else {
                    setUseCurrentLocation(false);
                    setRerouteStartNodeId(null);
                    applySelection(e.target.value, destinationId);
                  }
                }}
                className="bg-transparent font-bold text-slate-900 outline-none max-w-[140px] sm:max-w-[200px] truncate"
              >
                <option value="current-location">
                  📍 Current Location {liveNearestNode ? `(${liveNearestNode.name})` : "(Auto-detecting…)"}
                </option>
                {routableSourceNodes().map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.name} • {node.buildingName} • {node.floorName}
                  </option>
                ))}
              </select>
            </div>

            <span className="hidden sm:inline font-bold text-slate-400">→</span>

            {/* Destination Selector with Quick Fuzzy Search */}
            <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200/90 bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-md text-xs font-semibold text-slate-700">
              <span className="text-slate-400">To:</span>
              <select
                id="map-destination-select"
                aria-label="Destination"
                value={destinationId}
                onChange={(e) => applySelection(sourceNodeId, e.target.value)}
                className="bg-transparent font-bold text-slate-900 outline-none max-w-[130px] sm:max-w-[170px] truncate"
              >
                {destinations
                  .filter((item) => item.isActive)
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
              <button
                type="button"
                onClick={() => setSearchModalOpen(true)}
                className="grid h-6 w-6 place-items-center rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition"
                title="Search destinations with fuzzy autocomplete"
                aria-label="Search campus destinations"
              >
                <Search className="h-3 w-3" />
              </button>
            </div>


            {/* Status Pill Badge */}
            <div
              className={`rounded-full px-3 py-1 text-xs font-bold shadow-md backdrop-blur-md ${
                active
                  ? "bg-emerald-500 text-white animate-pulse"
                  : "bg-blue-50/95 text-blue-700 border border-blue-200/60"
              }`}
            >
              {active ? "Navigation in progress" : "Route preview"}
            </div>
          </div>

          {/* Right Top Controls: Accessibility & Location Status */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setAccessibleOnly((val) => !val)}
              className={`h-9 rounded-2xl border-slate-200/90 bg-white/95 text-xs font-semibold shadow-md backdrop-blur-md ${
                accessibleOnly ? "border-cyan-400 bg-cyan-50 text-cyan-800 font-bold" : "text-slate-600"
              }`}
            >
              Accessible
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLocateClick}
              className="h-9 rounded-2xl border-slate-200/90 bg-white/95 px-3 text-slate-700 shadow-md backdrop-blur-md"
            >
              <LocateFixed className="mr-1.5 h-3.5 w-3.5" />
              Locate
            </Button>
          </div>
        </div>

        {/* Quick Search Modal Overlay */}
        {searchModalOpen && (
          <div className="absolute inset-0 z-[600] flex items-start justify-center p-4 pt-20 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-lg rounded-2xl border border-white/20 bg-slate-950/95 p-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Search Campus Destinations
                </h3>
                <button
                  type="button"
                  onClick={() => setSearchModalOpen(false)}
                  className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label="Close search"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <SearchComponent
                autoFocus
                variant="dark"
                placeholder="Type destination, cabin, lab, or department..."
                onSelect={(dest) => {
                  applySelection(sourceNodeId, dest.id);
                  setSearchModalOpen(false);
                }}
              />
            </div>
          </div>
        )}

        {/* LEFT FLOATING SECTION: Telemetry Card + Distance Pill + Step-by-Step Maneuver Card */}
        <div className="absolute left-4 top-20 z-[490] flex flex-col gap-2.5 max-w-[calc(100vw-2rem)] sm:max-w-xs pointer-events-none">
          {/* Telemetry Card */}
          <div className="flex flex-col gap-1.5 pointer-events-auto rounded-2xl border border-slate-200/90 bg-white/95 p-3 shadow-md backdrop-blur-md text-xs font-semibold text-slate-700 tabular-nums">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-900 font-bold">
                <Zap className="h-4 w-4 text-blue-600 fill-blue-600" />
                <span>{speedDisplay}</span>
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                <Radio className="h-3 w-3 text-emerald-500" />
                <span>Avg: {speedDisplay}</span>
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 pt-1 text-slate-500 text-[11px]">
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-blue-500" />
                <span>GPS: {position ? `+/-${Math.round(position.accuracy)}m` : "Acquiring…"}</span>
              </span>
              {route && (
                <span className="font-bold text-blue-700">
                  {totalDistanceMeters >= 1000
                    ? `${(totalDistanceMeters / 1000).toFixed(1)} km`
                    : `${totalDistanceMeters} m`}{" "}
                  • {totalMinutes} min
                </span>
              )}
            </div>
            {active && (
              <div
                role="progressbar"
                aria-label={`Route progress: ${liveProgress.progressPercent}%`}
                aria-valuenow={liveProgress.progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                className="mt-1 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden shadow-inner"
              >
                <div
                  className="h-full rounded-full bg-blue-600 transition-[width] duration-300"
                  style={{ width: `${liveProgress.progressPercent}%` }}
                />
              </div>
            )}
          </div>

          {/* Maneuver Panel */}
          <div className="pointer-events-auto">
            <StepByStepGuidancePanel
              maneuvers={maneuvers}
              activeStepIndex={activeManeuverIndex}
              position={position}
              isNavigating={active}
            />
          </div>
        </div>

        {/* RIGHT FLOATING SECTION: Destination Photo Landmark Card */}
        <div className="absolute right-4 top-20 z-[490] hidden sm:flex flex-col gap-2.5 pointer-events-none">
          <div className="pointer-events-auto w-64 rounded-2xl border border-slate-200/90 bg-white/95 p-2 shadow-xl backdrop-blur-md overflow-hidden">
            <div className="relative h-28 w-full overflow-hidden rounded-xl bg-slate-900">
              <img
                src="/central-library.jpg"
                alt={destination.name}
                className="h-full w-full object-cover transition duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-2.5">
                <span className="text-xs font-bold text-white drop-shadow-md">
                  📍 {destination.name}
                </span>
              </div>
            </div>
            <p className="mt-1.5 px-1 font-display text-sm font-bold text-slate-900 truncate">
              Campus Landmark: {destination.name}
            </p>
          </div>
        </div>

        {/* BOTTOM FLOATING ACTION BAR: [ Recalculate ] and [ AR View ] */}
        <div className="absolute bottom-5 left-4 right-4 z-[500] mx-auto max-w-xl flex flex-col gap-2.5 pointer-events-none">
          {/* Controls Ribbon */}
          <div className="flex items-center justify-between px-2 text-xs font-semibold pointer-events-auto">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleToggleVoice}
                className={`h-8 rounded-full border-slate-200/90 bg-white/90 px-3 shadow-md backdrop-blur-md ${
                  voiceOn ? "text-blue-700 font-bold" : "text-slate-500"
                }`}
              >
                {voiceOn ? <Volume2 className="mr-1.5 h-3.5 w-3.5" /> : <VolumeX className="mr-1.5 h-3.5 w-3.5" />}
                Voice {voiceOn ? "on" : "off"}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              {!active ? (
                <Button
                  size="sm"
                  onClick={startNavigation}
                  className="h-8 rounded-full bg-emerald-600 px-3.5 text-white shadow-md hover:bg-emerald-700"
                >
                  <Play className="mr-1.5 h-3.5 w-3.5 fill-current" />
                  Start navigation
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setCurrentStep((step) => Math.min(routeNodes.length - 1, step + 1))}
                    className="h-8 rounded-full bg-cyan-600 px-3 text-white shadow-md hover:bg-cyan-700"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Mark next waypoint reached
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={finishNavigation}
                    aria-label="Stop navigation"
                    className="h-8 rounded-full bg-rose-50 text-rose-600 shadow-md hover:bg-rose-100"
                  >
                    <Pause className="mr-1.5 h-3.5 w-3.5" />
                    Stop navigation
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Primary Dual Pill Buttons (RVCE Reference Design) */}
          <div className="grid grid-cols-2 gap-3 pointer-events-auto">
            <Button
              onClick={handleRecalculate}
              className="h-12 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 text-base"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Recalculate
            </Button>
            <Button
              onClick={handleOpenAR}
              aria-label="Open AR"
              className="h-12 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-blue-700 active:translate-y-0 text-base"
            >
              <Camera className="mr-2 h-5 w-5" />
              AR View
            </Button>
          </div>
        </div>

        {/* Off Route Warning Overlay */}
        {offRoute && (
          <div className="absolute left-4 right-4 top-20 z-[600] mx-auto max-w-md flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50/95 p-4 text-amber-950 shadow-xl backdrop-blur-md">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-bold">You're off the planned route.</p>
              <p className="mt-0.5 text-xs text-amber-800">
                Recalculating route from the closest safe campus node...
              </p>
            </div>
            <button onClick={() => setOffRoute(false)} className="ml-auto text-amber-700 hover:text-amber-950">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
