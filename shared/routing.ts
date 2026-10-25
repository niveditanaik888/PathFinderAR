import { CampusEdge, CampusNode, SMALL_GRAPH_NODE_THRESHOLD, WALKING_SPEED_METERS_PER_SECOND } from "./pathfinder";

export type RoutingAlgorithm = "dijkstra" | "astar";

export type RouteResult = {
  algorithm: RoutingAlgorithm;
  nodeIds: string[];
  totalDistance: number;
  estimatedTime: number;
  visitedNodeCount: number;
  executionTimeMs: number;
};

type QueueItem = { id: string; priority: number };

class MinHeap {
  private items: QueueItem[] = [];
  get size() { return this.items.length; }
  push(item: QueueItem) {
    this.items.push(item);
    let index = this.items.length - 1;
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.items[parent].priority <= this.items[index].priority) break;
      [this.items[parent], this.items[index]] = [this.items[index], this.items[parent]];
      index = parent;
    }
  }
  pop(): QueueItem | undefined {
    if (!this.items.length) return undefined;
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length && last) {
      this.items[0] = last;
      let index = 0;
      while (true) {
        const left = index * 2 + 1;
        const right = left + 1;
        let smallest = index;
        if (left < this.items.length && this.items[left].priority < this.items[smallest].priority) smallest = left;
        if (right < this.items.length && this.items[right].priority < this.items[smallest].priority) smallest = right;
        if (smallest === index) break;
        [this.items[index], this.items[smallest]] = [this.items[smallest], this.items[index]];
        index = smallest;
      }
    }
    return first;
  }
}

export function haversineDistanceMeters(a: Pick<CampusNode, "latitude" | "longitude">, b: Pick<CampusNode, "latitude" | "longitude">) {
  const earthRadius = 6371000;
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const deltaLatitude = toRadians(b.latitude - a.latitude);
  const deltaLongitude = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(deltaLatitude / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLongitude / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function bearingDegrees(a: Pick<CampusNode, "latitude" | "longitude">, b: Pick<CampusNode, "latitude" | "longitude">) {
  const toRadians = (degrees: number) => degrees * Math.PI / 180;
  const toDegrees = (radians: number) => radians * 180 / Math.PI;
  const deltaLongitude = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const y = Math.sin(deltaLongitude) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(deltaLongitude);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function normalizeRelativeBearing(targetBearing: number, deviceHeading: number) {
  // Required AR anchoring formula: targetBearing − deviceHeading.
  return ((targetBearing - deviceHeading + 540) % 360) - 180;
}

function buildAdjacency(nodes: CampusNode[], edges: CampusEdge[], accessibleOnly = false) {
  const adjacency = new Map<string, { neighborId: string; edge: CampusEdge }[]>();
  nodes.forEach(node => adjacency.set(node.id, []));
  edges.filter(edge => !edge.isBlocked && (!accessibleOnly || edge.isAccessible)).forEach(edge => {
    adjacency.get(edge.sourceNodeId)?.push({ neighborId: edge.destinationNodeId, edge });
    if (edge.isBidirectional) adjacency.get(edge.destinationNodeId)?.push({ neighborId: edge.sourceNodeId, edge });
  });
  return adjacency;
}

function reconstructPath(previous: Map<string, string>, startNodeId: string, destinationNodeId: string) {
  const path = [destinationNodeId];
  let current = destinationNodeId;
  while (current !== startNodeId) {
    const parent = previous.get(current);
    if (!parent) return [];
    path.unshift(parent);
    current = parent;
  }
  return path;
}

export function dijkstra(nodes: CampusNode[], edges: CampusEdge[], startNodeId: string, destinationNodeId: string, accessibleOnly = false): RouteResult {
  const startedAt = performance.now();
  const adjacency = buildAdjacency(nodes, edges, accessibleOnly);
  if (!adjacency.has(startNodeId) || !adjacency.has(destinationNodeId)) throw new Error("Source or destination node is invalid.");
  const distance = new Map(nodes.map(node => [node.id, Infinity]));
  const previous = new Map<string, string>();
  const visited = new Set<string>();
  const queue = new MinHeap();
  distance.set(startNodeId, 0);
  queue.push({ id: startNodeId, priority: 0 });
  while (queue.size) {
    const current = queue.pop()!;
    if (visited.has(current.id)) continue;
    visited.add(current.id);
    if (current.id === destinationNodeId) break;
    adjacency.get(current.id)?.forEach(({ neighborId, edge }) => {
      const candidate = (distance.get(current.id) ?? Infinity) + edge.distance;
      if (candidate < (distance.get(neighborId) ?? Infinity)) {
        distance.set(neighborId, candidate);
        previous.set(neighborId, current.id);
        queue.push({ id: neighborId, priority: candidate });
      }
    });
  }
  const nodeIds = reconstructPath(previous, startNodeId, destinationNodeId);
  if (!nodeIds.length) throw new Error("No route is available between the selected locations.");
  const totalDistance = Math.round(distance.get(destinationNodeId) ?? 0);
  return { algorithm: "dijkstra", nodeIds, totalDistance, estimatedTime: Math.ceil(totalDistance / WALKING_SPEED_METERS_PER_SECOND), visitedNodeCount: visited.size, executionTimeMs: performance.now() - startedAt };
}

export function aStar(nodes: CampusNode[], edges: CampusEdge[], startNodeId: string, destinationNodeId: string, accessibleOnly = false): RouteResult {
  const startedAt = performance.now();
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const start = nodeById.get(startNodeId);
  const destination = nodeById.get(destinationNodeId);
  if (!start || !destination) throw new Error("Source or destination node is invalid.");
  const adjacency = buildAdjacency(nodes, edges, accessibleOnly);
  const open = new MinHeap();
  const closed = new Set<string>();
  const previous = new Map<string, string>();
  const gScore = new Map(nodes.map(node => [node.id, Infinity]));
  gScore.set(startNodeId, 0);
  open.push({ id: startNodeId, priority: haversineDistanceMeters(start, destination) });
  while (open.size) {
    const current = open.pop()!;
    if (closed.has(current.id)) continue;
    closed.add(current.id);
    if (current.id === destinationNodeId) break;
    adjacency.get(current.id)?.forEach(({ neighborId, edge }) => {
      if (closed.has(neighborId)) return;
      const candidate = (gScore.get(current.id) ?? Infinity) + edge.distance;
      if (candidate < (gScore.get(neighborId) ?? Infinity)) {
        previous.set(neighborId, current.id);
        gScore.set(neighborId, candidate);
        const neighbor = nodeById.get(neighborId)!;
        open.push({ id: neighborId, priority: candidate + haversineDistanceMeters(neighbor, destination) });
      }
    });
  }
  const nodeIds = reconstructPath(previous, startNodeId, destinationNodeId);
  if (!nodeIds.length) throw new Error("No route is available between the selected locations.");
  const totalDistance = Math.round(gScore.get(destinationNodeId) ?? 0);
  return { algorithm: "astar", nodeIds, totalDistance, estimatedTime: Math.ceil(totalDistance / WALKING_SPEED_METERS_PER_SECOND), visitedNodeCount: closed.size, executionTimeMs: performance.now() - startedAt };
}

export function calculateRoute(nodes: CampusNode[], edges: CampusEdge[], startNodeId: string, destinationNodeId: string, algorithm: "auto" | RoutingAlgorithm = "auto", accessibleOnly = false) {
  const selected = algorithm === "auto" ? (nodes.length <= SMALL_GRAPH_NODE_THRESHOLD ? "dijkstra" : "astar") : algorithm;
  return selected === "dijkstra" ? dijkstra(nodes, edges, startNodeId, destinationNodeId, accessibleOnly) : aStar(nodes, edges, startNodeId, destinationNodeId, accessibleOnly);
}

export function createRouteInstructions(nodes: CampusNode[], nodeIds: string[]) {
  const nodeById = new Map(nodes.map(node => [node.id, node]));
  const path = nodeIds.map(id => nodeById.get(id)).filter((node): node is CampusNode => Boolean(node));
  if (!path.length) return [];
  const instructions = [`Start from ${path[0].name}.`];
  for (let index = 1; index < path.length; index += 1) {
    const previous = path[index - 1];
    const current = path[index];
    const distance = Math.round(haversineDistanceMeters(previous, current));
    if (current.nodeType === "staircase") instructions.push(`Take the staircase near ${current.name}.`);
    else if (previous.floorId !== current.floorId && previous.floorId && current.floorId) instructions.push(`Continue to ${current.floorName}.`);
    else if (index < path.length - 1) instructions.push(`Continue toward ${current.name} for ${distance} m.`);
  }
  if (path.length > 1) instructions.push(`You have reached ${path[path.length - 1].name}.`);
  return instructions;
}

export function distanceToNearestRouteWaypoint(position: Pick<CampusNode, "latitude" | "longitude">, routeNodes: CampusNode[]) {
  if (!routeNodes.length) return Infinity;
  return Math.min(...routeNodes.map(node => haversineDistanceMeters(position, node)));
}

export function evaluateRouteDeviation(position: Pick<CampusNode, "latitude" | "longitude">, routeNodes: CampusNode[], thresholdMeters: number, lastRerouteAt?: number, cooldownMs = 15000) {
  const distanceFromRoute = distanceToNearestRouteWaypoint(position, routeNodes);
  const isOffRoute = distanceFromRoute > thresholdMeters;
  const cooldownActive = Boolean(lastRerouteAt && Date.now() - lastRerouteAt < cooldownMs);
  return { distanceFromRoute, isOffRoute, cooldownActive, shouldReroute: isOffRoute && !cooldownActive };
}

export * from "./maneuvers";

