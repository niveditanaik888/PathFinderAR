import { useEffect, useRef, useState, useCallback } from "react";
import { normalizeAngleDiff } from "./geoUtils";

export type HeadingSource = "compass" | "gps" | "none";
export type OrientationPermission = "prompt" | "granted" | "denied" | "unsupported";

type OrientationEventWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

type CompassEvent = DeviceOrientationEvent & {
  webkitCompassHeading?: number;
};

/**
 * Custom hook to monitor device compass heading with smoothing,
 * iOS 13+ permission support, and blending with GPS course.
 */
export function useDeviceOrientation(gpsHeading: number | null = null, gpsSpeed: number | null = null) {
  const [heading, setHeading] = useState<number | null>(null);
  const [source, setSource] = useState<HeadingSource>("none");
  const [permissionStatus, setPermissionStatus] = useState<OrientationPermission>("prompt");
  const smoothedHeadingRef = useRef<number | null>(null);
  const consecutiveStationaryCountRef = useRef(0);

  // Check if device orientation is supported
  const isSupported = typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setPermissionStatus("unsupported");
      return false;
    }

    try {
      const eventWithPerm = DeviceOrientationEvent as OrientationEventWithPermission;
      if (typeof eventWithPerm.requestPermission === "function") {
        const response = await eventWithPerm.requestPermission();
        if (response === "granted") {
          setPermissionStatus("granted");
          return true;
        } else {
          setPermissionStatus("denied");
          return false;
        }
      } else {
        // Android / non-iOS 13+ does not require explicit requestPermission call
        setPermissionStatus("granted");
        return true;
      }
    } catch (e) {
      console.warn("DeviceOrientation permission request error:", e);
      setPermissionStatus("denied");
      return false;
    }
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) {
      setPermissionStatus("unsupported");
      return;
    }

    const eventWithPerm = DeviceOrientationEvent as OrientationEventWithPermission;
    if (typeof eventWithPerm.requestPermission !== "function") {
      // Permission is automatically granted on standard Android browsers
      setPermissionStatus("granted");
    }

    const handleOrientation = (e: CompassEvent) => {
      let rawCompass: number | null = null;

      if (typeof e.webkitCompassHeading === "number" && !isNaN(e.webkitCompassHeading)) {
        // iOS provides webkitCompassHeading directly (0° = North, clockwise)
        rawCompass = e.webkitCompassHeading;
      } else if (e.alpha !== null && !isNaN(e.alpha)) {
        // Standard Android / Web orientation
        // For screen-aligned heading, 360 - alpha is typical when device is upright
        rawCompass = (360 - e.alpha) % 360;
      }

      if (rawCompass !== null) {
        // Blend compass with GPS course if user is moving at walking speed (> 1.2 m/s)
        let targetHeading = rawCompass;
        let activeSource: HeadingSource = "compass";

        if (gpsSpeed !== null && gpsSpeed > 1.2 && gpsHeading !== null && !isNaN(gpsHeading)) {
          // Weight GPS course 70% and compass 30% when walking forward briskly
          const angleDiff = normalizeAngleDiff(gpsHeading - rawCompass);
          targetHeading = (rawCompass + angleDiff * 0.7 + 360) % 360;
          activeSource = "gps";
        }

        // Apply low-pass circular filter to eliminate hand tremors / sensor noise
        if (smoothedHeadingRef.current === null) {
          smoothedHeadingRef.current = targetHeading;
        } else {
          const diff = normalizeAngleDiff(targetHeading - smoothedHeadingRef.current);
          const smoothingFactor = 0.15; // smooth transition factor
          smoothedHeadingRef.current = (smoothedHeadingRef.current + diff * smoothingFactor + 360) % 360;
        }

        setHeading(Math.round(smoothedHeadingRef.current * 10) / 10);
        setSource(activeSource);
      } else if (gpsHeading !== null && !isNaN(gpsHeading)) {
        // Fallback to GPS course if orientation sensors are unavailable
        setHeading(gpsHeading);
        setSource("gps");
      }
    };

    // Use absolute orientation where available
    const eventName = "ondeviceorientationabsolute" in window ? "deviceorientationabsolute" : "deviceorientation";
    window.addEventListener(eventName as any, handleOrientation as any, true);

    return () => {
      window.removeEventListener(eventName as any, handleOrientation as any, true);
    };
  }, [isSupported, gpsHeading, gpsSpeed]);

  return {
    heading,
    source,
    permissionStatus,
    requestPermission,
    isSupported,
  };
}
