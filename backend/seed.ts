import { buildings, destinations, floors, graphEdges, graphNodes } from "../db/schema";
import { campusBuildings, campusEdges, campusFloors, campusNodes, destinations as seedDestinations } from "../shared/pathfinder";
import { getDb } from "./db";

/**
 * Seed only the replaceable demonstration campus. Never run against a production campus
 * unless the graph was deliberately reviewed and updated with surveyed coordinates.
 */
export async function seedPathfinderSmartCampus() {
  const db = await getDb();
  if (!db) throw new Error("DATABASE_URL is unavailable; cannot seed PathFinder Smart Campus.");
  const existing = await db.select({ id: buildings.id }).from(buildings).limit(1);
  if (existing.length) return { inserted: false, reason: "Campus data already exists." };
  await db.insert(buildings).values(campusBuildings.map((building, index) => ({
    id: index + 1,
    name: building.name,
    description: building.description,
    latitude: campusNodes.find(node => node.buildingId === building.id)?.latitude?.toFixed(7) ?? null,
    longitude: campusNodes.find(node => node.buildingId === building.id)?.longitude?.toFixed(7) ?? null,
    address: "PathFinder Smart Campus — DEMO DATA",
    imageUrl: null,
    isActive: true,
  })));
  const buildingId = new Map(campusBuildings.map((building, index) => [building.id, index + 1]));
  await db.insert(floors).values(campusFloors.map((floor, index) => ({ id: index + 1, buildingId: buildingId.get(floor.buildingId)!, floorNumber: floor.number, floorName: floor.name, mapImageUrl: null })));
  const floorId = new Map(campusFloors.map((floor, index) => [floor.id, index + 1]));
  await db.insert(graphNodes).values(campusNodes.map((node, index) => ({ id: index + 1, buildingId: node.buildingId ? buildingId.get(node.buildingId) ?? null : null, floorId: node.floorId ? floorId.get(node.floorId) ?? null : null, externalId: node.id, name: node.name, nodeType: node.nodeType, latitude: node.latitude.toFixed(7), longitude: node.longitude.toFixed(7), xCoordinate: node.xCoordinate.toFixed(2), yCoordinate: node.yCoordinate.toFixed(2), isAccessible: node.isAccessible, isActive: node.isActive })));
  const nodeId = new Map(campusNodes.map((node, index) => [node.id, index + 1]));
  await db.insert(graphEdges).values(campusEdges.map((edge, index) => ({ id: index + 1, sourceNodeId: nodeId.get(edge.sourceNodeId)!, destinationNodeId: nodeId.get(edge.destinationNodeId)!, distance: edge.distance.toFixed(2), estimatedTime: edge.estimatedTime, isBidirectional: edge.isBidirectional, isBlocked: edge.isBlocked, isAccessible: edge.isAccessible, edgeType: edge.edgeType })));
  await db.insert(destinations).values(seedDestinations.map((destination, index) => ({ id: index + 1, externalId: destination.id, buildingId: destination.buildingId ? buildingId.get(destination.buildingId) ?? null : null, floorId: campusNodes.find(node => node.id === destination.nodeId)?.floorId ? floorId.get(campusNodes.find(node => node.id === destination.nodeId)!.floorId!) ?? null : null, nodeId: nodeId.get(destination.nodeId)!, name: destination.name, category: destination.category, description: destination.description, latitude: campusNodes.find(node => node.id === destination.nodeId)!.latitude.toFixed(7), longitude: campusNodes.find(node => node.id === destination.nodeId)!.longitude.toFixed(7), roomNumber: destination.roomNumber ?? null, accessibilityInfo: destination.accessibilityInfo, imageUrl: destination.imageUrl ?? null, isActive: destination.isActive })));
  return { inserted: true, buildings: campusBuildings.length, floors: campusFloors.length, nodes: campusNodes.length, edges: campusEdges.length, destinations: seedDestinations.length };
}
