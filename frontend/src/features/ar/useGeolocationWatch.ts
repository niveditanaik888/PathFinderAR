import { useEffect, useRef, useState, useCallback } from "react";
import type { LatLngAlt } from "./geoUtils";

export type GeolocationState = {
  position: LatLngAlt | null;
  accuracy: number | null; // meters
  speed: number | null; // m/s
  heading: number | null; // degrees from North (from GPS course)
  altitude: number | null;
  error: string | null;
  isWatching: boolean;
  lastFixTimestamp: number | null;
};

export function useGeolocationWatch(autoStart = true) {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    accuracy: null,
    speed: null,
    heading: null,
    altitude: null,
    error: null,
    isWatching: false,
    lastFixTimestamp: null,
  });

  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setState({
      position: {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        altitude: pos.coords.altitude ?? 0,
      },
      accuracy: pos.coords.accuracy,
      speed: pos.coords.speed,
      heading: pos.coords.heading,
      altitude: pos.coords.altitude,
      error: null,
      isWatching: true,
      lastFixTimestamp: pos.timestamp,
    });
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    let message = "Unable to retrieve location.";
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = "Location permission denied. Please allow location access for AR wayfinding.";
        break;
      case err.POSITION_UNAVAILABLE:
        message = "Live GPS signal temporarily unavailable. Waiting for recovery...";
        break;
      case err.TIMEOUT:
        message = "Location request timed out. Retrying GPS fix...";
        break;
    }
    setState((prev) => ({
      ...prev,
      error: message,
      isWatching: false,
    }));
  }, []);

  const startWatching = useCallback(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by your browser.",
      }));
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    // First request immediate position
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 2000,
    });

    // Start watching continuously
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleSuccess,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 1000,
      }
    );

    setState((prev) => ({ ...prev, isWatching: true, error: null }));
  }, [handleSuccess, handleError]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setState((prev) => ({ ...prev, isWatching: false }));
  }, []);

  useEffect(() => {
    if (autoStart) {
      startWatching();
    }
    return () => {
      stopWatching();
    };
  }, [autoStart, startWatching, stopWatching]);

  return {
    ...state,
    startWatching,
    stopWatching,
  };
}
