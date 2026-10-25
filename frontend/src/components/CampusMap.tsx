import { CampusNode } from "@shared/pathfinder";
import { Compass, LocateFixed } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from "react-leaflet";
import { useEffect, useRef } from "react";


export type MapPosition = { latitude: number; longitude: number; accuracy?: number; heading?: number; speed?: number };

const marker = (label: string, className: string, heading?: number) =>
  L.divIcon({
    className: "",
    html: `<div class="map-pin ${className}" style="${heading !== undefined ? `transform: rotate(${Math.round(heading)}deg);` : ""}"><span>${label}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });

function Recenter({
  position,
  active,
  locateTrigger,
}: {
  position?: MapPosition;
  active?: boolean;
  locateTrigger?: number;
}) {
  const map = useMap();
  const isUserInteractingRef = useRef(false);
  const pauseTimerRef = useRef<number | undefined>(undefined);
  const lastLocateRef = useRef(locateTrigger);

  useEffect(() => {
    const handleDragStart = () => {
      isUserInteractingRef.current = true;
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
      // Pause auto-follow for 8 seconds after manual user interaction
      pauseTimerRef.current = window.setTimeout(() => {
        isUserInteractingRef.current = false;
      }, 8000);
    };

    map.on("dragstart", handleDragStart);
    return () => {
      map.off("dragstart", handleDragStart);
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
    };
  }, [map]);

  useEffect(() => {
    if (!position) return;
    const isManualLocate = locateTrigger !== undefined && locateTrigger !== lastLocateRef.current;
    if (isManualLocate) {
      lastLocateRef.current = locateTrigger;
      isUserInteractingRef.current = false;
      if (pauseTimerRef.current) window.clearTimeout(pauseTimerRef.current);
      map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 17), { duration: 0.65 });
      return;
    }

    // If auto-following is active and user has not recently dragged, center smoothly
    if (active && !isUserInteractingRef.current) {
      map.flyTo([position.latitude, position.longitude], Math.max(map.getZoom(), 17), { duration: 0.5 });
    }
  }, [map, position, active, locateTrigger]);

  return null;
}

function RouteViewport({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  const signature = positions.map(([latitude, longitude]) => `${latitude},${longitude}`).join("|");
  useEffect(() => {
    if (positions.length < 2) return;
    map.fitBounds(positions, { padding: [42, 42], maxZoom: 18, animate: false });
  }, [map, signature]);
  return null;
}

function LocateButton({ onLocate }: { onLocate?: () => void }) {
  const map = useMap();
  return (
    <button
      className="leaflet-locate"
      onClick={() => {
        onLocate?.();
        map.locate({ setView: true, maxZoom: 18 });
      }}
      aria-label="Locate me"
    >
      <LocateFixed className="h-4 w-4" />
    </button>
  );
}

function LocationListener({ onLocationFound }: { onLocationFound?: (pos: MapPosition) => void }) {
  const map = useMap();
  useEffect(() => {
    if (!onLocationFound) return;
    const handleFound = (e: L.LocationEvent) => {
      onLocationFound({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
        accuracy: e.accuracy,
        heading: e.heading,
        speed: e.speed,
      });
    };
    map.on("locationfound", handleFound);
    return () => {
      map.off("locationfound", handleFound);
    };
  }, [map, onLocationFound]);
  return null;
}

export function CampusMap({
  nodes,
  route,
  destination,
  source,
  userPosition,
  onLocate,
  locateTrigger,
  isNavigating = false,
  className = "",
  compact = false,
  onLocationFound,
}: {
  nodes: CampusNode[];
  route?: CampusNode[];
  destination?: CampusNode;
  source?: CampusNode;
  userPosition?: MapPosition;
  onLocate?: () => void;
  locateTrigger?: number;
  isNavigating?: boolean;
  className?: string;
  compact?: boolean;
  onLocationFound?: (pos: MapPosition) => void;
}) {
  const center: [number, number] = [13.02192, 74.98168];
  const routeLine = route?.map((node) => [node.latitude, node.longitude] as [number, number]) ?? [];

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 ${className}`}>
      <MapContainer center={center} zoom={17} scrollWheelZoom={!compact} className="h-full min-h-[330px] w-full" zoomControl={!compact}>
        <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <LocationListener onLocationFound={onLocationFound} />
        {nodes
          .filter((node) => node.nodeType === "entrance" || node.nodeType === "gate" || node.nodeType === "facility")
          .map((node) => (
            <Marker key={node.id} position={[node.latitude, node.longitude]} icon={marker(node.nodeType === "gate" ? "G" : "•", node.nodeType === "gate" ? "map-pin-gate" : "map-pin-building")}>
              <Tooltip direction="top" offset={[0, -16]}>
                {node.name}
              </Tooltip>
            </Marker>
          ))}
        {routeLine.length > 1 && (
          <>
            <RouteViewport positions={routeLine} />
            <Polyline key={`route-shadow-${routeLine.map(([latitude, longitude]) => `${latitude},${longitude}`).join("|")}`} positions={routeLine} pathOptions={{ color: "#fbbf24", weight: 12, opacity: 0.25, lineCap: "round", lineJoin: "round" }} />
            <Polyline key={`route-line-${routeLine.map(([latitude, longitude]) => `${latitude},${longitude}`).join("|")}`} positions={routeLine} pathOptions={{ color: "#06b6d4", weight: 6, opacity: 0.95, lineCap: "round", lineJoin: "round" }} />
          </>
        )}
        {route?.slice(1, -1).map((node, index) => (
          <CircleMarker key={node.id} center={[node.latitude, node.longitude]} radius={6} pathOptions={{ color: "#ffffff", weight: 2, fillColor: "#0e7490", fillOpacity: 1 }}>
            <Tooltip>{`Waypoint ${index + 1}: ${node.name}`}</Tooltip>
          </CircleMarker>
        ))}
        {source && (
          <Marker position={[source.latitude, source.longitude]} icon={marker("S", "map-pin-source")}>
            <Tooltip permanent direction="top">
              Start • {source.name}
            </Tooltip>
          </Marker>
        )}
        {destination && (
          <Marker position={[destination.latitude, destination.longitude]} icon={marker("D", "map-pin-destination")}>
            <Tooltip permanent direction="top">
              Destination • {destination.name}
            </Tooltip>
          </Marker>
        )}
        {userPosition && (
          <>
            <CircleMarker center={[userPosition.latitude, userPosition.longitude]} radius={userPosition.accuracy ? Math.max(10, Math.min(80, userPosition.accuracy)) : 18} pathOptions={{ color: "#0ea5e9", weight: 1, fillColor: "#38bdf8", fillOpacity: 0.12 }} />
            <Marker position={[userPosition.latitude, userPosition.longitude]} icon={marker("▲", "map-pin-user", userPosition.heading)}>
              <Tooltip direction="top">
                You {userPosition.accuracy ? `• ±${Math.round(userPosition.accuracy)} m` : ""} {userPosition.speed ? `• ${(userPosition.speed * 3.6).toFixed(1)} km/h` : ""}
              </Tooltip>
            </Marker>
            <Recenter position={userPosition} active={isNavigating} locateTrigger={locateTrigger} />
          </>
        )}
        <LocateButton onLocate={onLocate} />
      </MapContainer>
      {!compact && (
        <div className="absolute bottom-3 left-3 z-[500] rounded-xl border border-white/10 bg-slate-950/90 px-3 py-2 text-xs font-medium text-white shadow-lg">
          <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-amber-300 to-cyan-300 text-slate-950">
            <Compass className="h-3 w-3" />
          </span>
          AIET PathFinder • {isNavigating ? "Live GPS navigation" : "route preview"}
        </div>
      )}
    </div>
  );
}
