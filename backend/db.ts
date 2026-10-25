import { and, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { inArray, isNull, isNotNull } from "drizzle-orm";
import { adminAuditLogs, blockedPaths, buildings, campusMedia, destinations, destinationSearches, favoriteRouteShares, favoriteRouteTags, favoriteRoutes, floorPlanMarkers, floorPlanOverlays, graphEdges, graphNodes, indoorLocations, InsertUser, navigationHistory, routeDeviations, routeProgress, routes, routeWaypoints, users } from "../db/schema";
import { createHash, randomBytes } from "node:crypto";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function recordAdminAudit(input: { actorUserId: number; action: string; entityType: string; entityId?: string | number; metadata?: Record<string, unknown> }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(adminAuditLogs).values({ actorUserId: input.actorUserId, action: input.action, entityType: input.entityType, entityId: input.entityId === undefined ? undefined : String(input.entityId), metadata: input.metadata ? JSON.stringify(input.metadata) : undefined });
}

export async function getAdminAuditLogs(input: { from?: Date; to?: Date; action?: string; entityType?: string; limit: number }) {
  const db = await getDb();
  if (!db) return [];
  const filters = [];
  if (input.from) filters.push(gte(adminAuditLogs.createdAt, input.from));
  if (input.to) filters.push(lte(adminAuditLogs.createdAt, input.to));
  if (input.action) filters.push(eq(adminAuditLogs.action, input.action));
  if (input.entityType) filters.push(eq(adminAuditLogs.entityType, input.entityType));
  return db.select().from(adminAuditLogs).where(filters.length ? and(...filters) : undefined).orderBy(desc(adminAuditLogs.createdAt)).limit(input.limit);
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getCampusStats() {
  const db = await getDb();
  if (!db) return null;
  const [[userCount], [buildingCount], [destinationCount], [nodeCount], [routeCount], [completedCount], [blockedCount]] = await Promise.all([
    db.select({ value: count() }).from(users), db.select({ value: count() }).from(buildings), db.select({ value: count() }).from(destinations), db.select({ value: count() }).from(graphNodes), db.select({ value: count() }).from(routes), db.select({ value: count() }).from(navigationHistory).where(eq(navigationHistory.completionStatus, "completed")), db.select({ value: count() }).from(blockedPaths).where(eq(blockedPaths.isActive, true)),
  ]);
  return { users: userCount.value, buildings: buildingCount.value, destinations: destinationCount.value, nodes: nodeCount.value, routes: routeCount.value, completedNavigations: completedCount.value, activeBlockedPaths: blockedCount.value };
}

export async function getCampusGraph() {
  const db = await getDb();
  if (!db) return null;
  const [nodes, edges] = await Promise.all([db.select().from(graphNodes).where(eq(graphNodes.isActive, true)), db.select().from(graphEdges)]);
  return { nodes, edges };
}

export async function getDestinationList(query?: string) {
  const db = await getDb();
  if (!db) return null;
  if (!query) return db.select().from(destinations).where(eq(destinations.isActive, true));
  return db.select().from(destinations).where(sql`${destinations.isActive} = 1 AND (${destinations.name} LIKE ${`%${query}%`} OR ${destinations.category} LIKE ${`%${query}%`})`);
}

export async function getRecentNavigationForUser(userId: number) {
  const db = await getDb();
  if (!db) return null;
  return db.select({ id: navigationHistory.id, routeId: navigationHistory.routeId, startedAt: navigationHistory.startedAt, completedAt: navigationHistory.completedAt, completionStatus: navigationHistory.completionStatus, deviationCount: navigationHistory.deviationCount, actualDistance: navigationHistory.actualDistance, algorithm: routes.algorithm, estimatedTime: routes.estimatedTime, totalDistance: routes.totalDistance }).from(navigationHistory).innerJoin(routes, eq(navigationHistory.routeId, routes.id)).where(eq(navigationHistory.userId, userId)).orderBy(desc(navigationHistory.createdAt)).limit(30);
}

export async function setGraphEdgeBlocked(edgeId: number, isBlocked: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(graphEdges).set({ isBlocked }).where(eq(graphEdges.id, edgeId));
}

export async function createGraphNode(input: { externalId: string; name: string; nodeType: string; latitude: number; longitude: number; xCoordinate: number; yCoordinate: number; isAccessible: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(graphNodes).values({ ...input, latitude: input.latitude.toFixed(7), longitude: input.longitude.toFixed(7), xCoordinate: input.xCoordinate.toFixed(2), yCoordinate: input.yCoordinate.toFixed(2), isActive: true, buildingId: null, floorId: null });
}

export async function updateGraphNode(nodeId: number, input: { name: string; nodeType: string; latitude: number; longitude: number; xCoordinate: number; yCoordinate: number; isAccessible: boolean; isActive: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(graphNodes).set({ ...input, latitude: input.latitude.toFixed(7), longitude: input.longitude.toFixed(7), xCoordinate: input.xCoordinate.toFixed(2), yCoordinate: input.yCoordinate.toFixed(2) }).where(eq(graphNodes.id, nodeId));
}

export async function deleteGraphNode(nodeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(graphNodes).where(eq(graphNodes.id, nodeId));
}

export async function createGraphEdge(input: { sourceNodeId: number; destinationNodeId: number; distance: number; estimatedTime: number; isBidirectional: boolean; isAccessible: boolean; edgeType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(graphEdges).values({ ...input, distance: input.distance.toFixed(2), isBlocked: false });
}

export async function updateGraphEdge(edgeId: number, input: { distance: number; estimatedTime: number; isBidirectional: boolean; isBlocked: boolean; isAccessible: boolean; edgeType: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(graphEdges).set({ ...input, distance: input.distance.toFixed(2) }).where(eq(graphEdges.id, edgeId));
}

export async function deleteGraphEdge(edgeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(graphEdges).where(eq(graphEdges.id, edgeId));
}

export async function createNavigationSession(input: { userId: number; algorithm: string; totalDistance: number; estimatedTime: number; startLatitude?: number; startLongitude?: number; waypoints: Array<{ latitude: number; longitude: number; instruction?: string }> }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const result = await db.insert(routes).values({ userId: input.userId, algorithm: input.algorithm, totalDistance: input.totalDistance.toFixed(2), estimatedTime: input.estimatedTime, startLatitude: input.startLatitude?.toFixed(7), startLongitude: input.startLongitude?.toFixed(7), routeStatus: "active", destinationId: null });
  const header = Array.isArray(result) ? result[0] : result;
  const routeId = Number((header as { insertId?: number }).insertId);
  if (!routeId) throw new Error("The navigation route could not be saved.");
  if (input.waypoints.length) await db.insert(routeWaypoints).values(input.waypoints.map((waypoint, index) => ({ routeId, nodeId: null, sequenceNumber: index, latitude: waypoint.latitude.toFixed(7), longitude: waypoint.longitude.toFixed(7), instruction: waypoint.instruction ?? null })));
  await db.insert(routeProgress).values({ routeId, userId: input.userId, currentWaypointIndex: 0, totalWaypoints: input.waypoints.length, remainingDistance: input.totalDistance.toFixed(2), navigationState: "active" });
  return routeId;
}

export async function updateNavigationProgress(input: { routeId: number; userId: number; currentWaypointIndex: number; totalWaypoints: number; remainingDistance: number; navigationState: "active" | "completed" | "stopped" }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(routeProgress).set({ currentWaypointIndex: input.currentWaypointIndex, totalWaypoints: input.totalWaypoints, remainingDistance: input.remainingDistance.toFixed(2), navigationState: input.navigationState }).where(and(eq(routeProgress.routeId, input.routeId), eq(routeProgress.userId, input.userId)));
}

export async function completeNavigationSession(input: { routeId: number; userId: number; completionStatus: "completed" | "stopped" | "abandoned"; deviationCount: number; actualDistance?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(routes).set({ routeStatus: input.completionStatus === "completed" ? "completed" : "stopped" }).where(eq(routes.id, input.routeId));
  await db.update(routeProgress).set({ navigationState: input.completionStatus === "completed" ? "completed" : "stopped" }).where(and(eq(routeProgress.routeId, input.routeId), eq(routeProgress.userId, input.userId)));
  await db.insert(navigationHistory).values({ userId: input.userId, routeId: input.routeId, completionStatus: input.completionStatus, deviationCount: input.deviationCount, actualDistance: input.actualDistance?.toFixed(2), completedAt: new Date() });
}

export async function recordRouteDeviation(input: { routeId: number; latitude: number; longitude: number; distanceFromRoute: number; rerouted: boolean }) {
  const db = await getDb();
  if (!db) return;
  await db.insert(routeDeviations).values({ routeId: input.routeId, latitude: input.latitude.toFixed(7), longitude: input.longitude.toFixed(7), distanceFromRoute: input.distanceFromRoute.toFixed(2), rerouted: input.rerouted });
}

export async function getFavoriteRoutesForUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  const routesForUser = await db.select().from(favoriteRoutes).where(eq(favoriteRoutes.userId, userId)).orderBy(desc(favoriteRoutes.updatedAt));
  if (!routesForUser.length) return [];
  const routeIds = routesForUser.map((route) => route.id);
  const [tags, shares] = await Promise.all([
    db.select().from(favoriteRouteTags).where(inArray(favoriteRouteTags.favoriteRouteId, routeIds)),
    db.select({ id: favoriteRouteShares.id, favoriteRouteId: favoriteRouteShares.favoriteRouteId, includeAnnotations: favoriteRouteShares.includeAnnotations }).from(favoriteRouteShares).where(and(inArray(favoriteRouteShares.favoriteRouteId, routeIds), isNull(favoriteRouteShares.revokedAt))),
  ]);
  return routesForUser.map((route) => ({
    ...route,
    tags: tags.filter((tag) => tag.favoriteRouteId === route.id).map((tag) => tag.tag),
    activeShare: shares.find((share) => share.favoriteRouteId === route.id) ?? null,
  }));
}

export async function saveFavoriteRoute(input: { userId: number; label: string; sourceNodeExternalId: string; destinationExternalId: string; accessibleOnly: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(favoriteRoutes).values(input).onDuplicateKeyUpdate({ set: { label: input.label, updatedAt: new Date() } });
}

export async function removeFavoriteRoute(userId: number, favoriteId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(favoriteRoutes).where(and(eq(favoriteRoutes.id, favoriteId), eq(favoriteRoutes.userId, userId)));
}

export async function updateFavoriteRouteAnnotations(input: { userId: number; favoriteId: number; note?: string; tags: string[] }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [favorite] = await db.select({ id: favoriteRoutes.id }).from(favoriteRoutes).where(and(eq(favoriteRoutes.id, input.favoriteId), eq(favoriteRoutes.userId, input.userId)));
  if (!favorite) return false;
  await db.update(favoriteRoutes).set({ note: input.note || null, updatedAt: new Date() }).where(eq(favoriteRoutes.id, favorite.id));
  await db.delete(favoriteRouteTags).where(eq(favoriteRouteTags.favoriteRouteId, favorite.id));
  if (input.tags.length) await db.insert(favoriteRouteTags).values(input.tags.map((tag) => ({ favoriteRouteId: favorite.id, tag })));
  return true;
}

function hashShareToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createFavoriteRouteShare(input: { userId: number; favoriteId: number; includeAnnotations: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [favorite] = await db.select({ id: favoriteRoutes.id }).from(favoriteRoutes).where(and(eq(favoriteRoutes.id, input.favoriteId), eq(favoriteRoutes.userId, input.userId)));
  if (!favorite) return null;
  await db.update(favoriteRouteShares).set({ revokedAt: new Date() }).where(and(eq(favoriteRouteShares.favoriteRouteId, favorite.id), isNull(favoriteRouteShares.revokedAt)));
  const token = randomBytes(24).toString("base64url");
  await db.insert(favoriteRouteShares).values({ favoriteRouteId: favorite.id, tokenHash: hashShareToken(token), includeAnnotations: input.includeAnnotations });
  return { token };
}

export async function revokeFavoriteRouteShare(input: { userId: number; favoriteId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  const [favorite] = await db.select({ id: favoriteRoutes.id }).from(favoriteRoutes).where(and(eq(favoriteRoutes.id, input.favoriteId), eq(favoriteRoutes.userId, input.userId)));
  if (!favorite) return false;
  await db.update(favoriteRouteShares).set({ revokedAt: new Date() }).where(and(eq(favoriteRouteShares.favoriteRouteId, favorite.id), isNull(favoriteRouteShares.revokedAt)));
  return true;
}

export type SharedFavoriteRoute = {
  label: string;
  sourceNodeExternalId: string;
  destinationExternalId: string;
  accessibleOnly: boolean;
  note?: string | null;
  tags?: string[];
};

export function materializeSharedFavoriteRoute(input: { label: string; sourceNodeExternalId: string; destinationExternalId: string; accessibleOnly: boolean; note: string | null; includeAnnotations: boolean }, tags: string[]): SharedFavoriteRoute {
  const route = {
    label: input.label,
    sourceNodeExternalId: input.sourceNodeExternalId,
    destinationExternalId: input.destinationExternalId,
    accessibleOnly: input.accessibleOnly,
  };
  return input.includeAnnotations ? { ...route, note: input.note, tags } : route;
}

export async function getSharedFavoriteRoute(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [shared] = await db.select({
    favoriteId: favoriteRoutes.id,
    label: favoriteRoutes.label,
    sourceNodeExternalId: favoriteRoutes.sourceNodeExternalId,
    destinationExternalId: favoriteRoutes.destinationExternalId,
    accessibleOnly: favoriteRoutes.accessibleOnly,
    note: favoriteRoutes.note,
    includeAnnotations: favoriteRouteShares.includeAnnotations,
  }).from(favoriteRouteShares).innerJoin(favoriteRoutes, eq(favoriteRouteShares.favoriteRouteId, favoriteRoutes.id)).where(and(eq(favoriteRouteShares.tokenHash, hashShareToken(token)), isNull(favoriteRouteShares.revokedAt)));
  if (!shared) return null;
  const tags = shared.includeAnnotations
    ? await db.select({ tag: favoriteRouteTags.tag }).from(favoriteRouteTags).where(eq(favoriteRouteTags.favoriteRouteId, shared.favoriteId))
    : [];
  return materializeSharedFavoriteRoute(shared, tags.map((tag) => tag.tag));
}

export async function getActiveCampusMedia(slot?: "hero" | "showcase" | "building" | "destination") {
  const db = await getDb();
  if (!db) return [];
  return slot ? db.select().from(campusMedia).where(and(eq(campusMedia.isActive, true), eq(campusMedia.slot, slot))).orderBy(campusMedia.sortOrder) : db.select().from(campusMedia).where(eq(campusMedia.isActive, true)).orderBy(campusMedia.sortOrder);
}

export async function getCampusMediaForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(campusMedia).orderBy(desc(campusMedia.updatedAt));
}

export async function createCampusMedia(input: { slot: "hero" | "showcase" | "building" | "destination"; title: string; mediaUrl: string; mediaKey: string; mimeType: string; altText: string; caption?: string; sortOrder: number; isActive: boolean; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(campusMedia).values(input);
}

export async function updateCampusMedia(mediaId: number, input: { slot: "hero" | "showcase" | "building" | "destination"; title: string; altText: string; caption?: string; sortOrder: number; isActive: boolean }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(campusMedia).set(input).where(eq(campusMedia.id, mediaId));
}

export async function deleteCampusMedia(mediaId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(campusMedia).where(eq(campusMedia.id, mediaId));
}

export async function getVerifiedIndoorLocations(zoneId?: string) {
  const db = await getDb();
  if (!db) return [];
  const criteria = [eq(indoorLocations.isActive, true), eq(indoorLocations.verificationStatus, "verified")];
  if (zoneId) criteria.push(eq(indoorLocations.zoneId, zoneId));
  return db.select().from(indoorLocations).where(and(...criteria)).orderBy(indoorLocations.floorLabel, indoorLocations.roomLabel);
}

export async function getIndoorLocationsForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(indoorLocations).orderBy(desc(indoorLocations.updatedAt));
}

export type IndoorLocationInput = {
  zoneId: string; name: string; buildingLabel: string; floorLabel: string; roomLabel: string;
  roomType: "room" | "lab" | "office" | "facility" | "entrance" | "staircase";
  routeNodeExternalId?: string; searchAliases?: string; commonSearchTerms?: string; description?: string; accessibilityInfo?: string;
  verificationSource: string; verificationStatus: "draft" | "verified" | "archived"; isActive: boolean;
};

export async function createIndoorLocation(input: IndoorLocationInput & { createdByUserId: number; verifiedByUserId?: number; verifiedAt?: Date }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(indoorLocations).values(input);
}

export async function updateIndoorLocation(locationId: number, input: IndoorLocationInput & { verifiedByUserId?: number; verifiedAt?: Date | null }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(indoorLocations).set(input).where(eq(indoorLocations.id, locationId));
}

export async function deleteIndoorLocation(locationId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(indoorLocations).where(eq(indoorLocations.id, locationId));
}

export async function getActiveFloorPlanOverlays(zoneId?: string) {
  const db = await getDb();
  if (!db) return [];
  const criteria = [eq(floorPlanOverlays.isActive, true), eq(floorPlanOverlays.approvalStatus, "approved")];
  if (zoneId) criteria.push(eq(floorPlanOverlays.zoneId, zoneId));
  return db.select().from(floorPlanOverlays).where(and(...criteria)).orderBy(floorPlanOverlays.buildingLabel, floorPlanOverlays.floorLabel);
}

export async function getFloorPlanOverlaysForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(floorPlanOverlays).orderBy(desc(floorPlanOverlays.updatedAt));
}

export type FloorPlanOverlayInput = {
  zoneId: string; buildingLabel: string; floorLabel: string; title: string;
  isPriorityOffice: boolean; approvalStatus: "draft" | "approved" | "retired"; sourceReference: string; isActive: boolean;
};

export async function saveFloorPlanOverlay(input: FloorPlanOverlayInput & { overlayUrl: string; overlayKey: string; mimeType: string; fileName?: string; fileSizeBytes: number; createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(floorPlanOverlays).values(input).onDuplicateKeyUpdate({
    set: { title: input.title, overlayUrl: input.overlayUrl, overlayKey: input.overlayKey, mimeType: input.mimeType, fileName: input.fileName, fileSizeBytes: input.fileSizeBytes, isPriorityOffice: input.isPriorityOffice, approvalStatus: input.approvalStatus, sourceReference: input.sourceReference, isActive: input.isActive, createdByUserId: input.createdByUserId, updatedAt: new Date() },
  });
}

export async function updateFloorPlanOverlay(overlayId: number, input: Omit<FloorPlanOverlayInput, "zoneId" | "buildingLabel" | "floorLabel">) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(floorPlanOverlays).set(input).where(eq(floorPlanOverlays.id, overlayId));
}

export async function deleteFloorPlanOverlay(overlayId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(floorPlanOverlays).where(eq(floorPlanOverlays.id, overlayId));
}

export type FloorPlanMarkerInput = {
  overlayId: number; indoorLocationId: number; label: string; xPercent: number; yPercent: number;
  routeNodeExternalId: string; isActive: boolean;
};

export async function getActiveFloorPlanMarkers(overlayId?: number) {
  const db = await getDb();
  if (!db) return [];
  const criteria = [
    eq(floorPlanMarkers.isActive, true),
    eq(floorPlanOverlays.isActive, true),
    eq(floorPlanOverlays.approvalStatus, "approved"),
    eq(indoorLocations.isActive, true),
    eq(indoorLocations.verificationStatus, "verified"),
    isNotNull(floorPlanMarkers.routeNodeExternalId),
  ];
  if (overlayId) criteria.push(eq(floorPlanMarkers.overlayId, overlayId));
  return db.select({
    id: floorPlanMarkers.id,
    overlayId: floorPlanMarkers.overlayId,
    indoorLocationId: floorPlanMarkers.indoorLocationId,
    label: floorPlanMarkers.label,
    xPercent: floorPlanMarkers.xPercent,
    yPercent: floorPlanMarkers.yPercent,
    routeNodeExternalId: floorPlanMarkers.routeNodeExternalId,
    locationName: indoorLocations.name,
    floorLabel: indoorLocations.floorLabel,
    roomLabel: indoorLocations.roomLabel,
  }).from(floorPlanMarkers)
    .innerJoin(floorPlanOverlays, eq(floorPlanMarkers.overlayId, floorPlanOverlays.id))
    .innerJoin(indoorLocations, eq(floorPlanMarkers.indoorLocationId, indoorLocations.id))
    .where(and(...criteria))
    .orderBy(floorPlanMarkers.label);
}

export async function getFloorPlanMarkersForAdmin() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(floorPlanMarkers).orderBy(desc(floorPlanMarkers.updatedAt));
}

export async function createFloorPlanMarker(input: FloorPlanMarkerInput & { createdByUserId: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.insert(floorPlanMarkers).values(input);
}

export async function updateFloorPlanMarker(markerId: number, input: Omit<FloorPlanMarkerInput, "overlayId" | "indoorLocationId" | "routeNodeExternalId">) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.update(floorPlanMarkers).set(input).where(eq(floorPlanMarkers.id, markerId));
}

export async function deleteFloorPlanMarker(markerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection is unavailable.");
  await db.delete(floorPlanMarkers).where(eq(floorPlanMarkers.id, markerId));
}

export async function getCampusAnalytics() {
  const db = await getDb();
  if (!db) return null;
  const day = sql<string>`DATE(startedAt)`;
  const [navigationOverTime, algorithmUsage, destinationDemand, deviationSummary] = await Promise.all([
    db.select({ day, count: count() }).from(navigationHistory).groupBy(day).orderBy(day),
    db.select({ algorithm: routes.algorithm, count: count() }).from(routes).groupBy(routes.algorithm),
    db.select({ name: destinations.name, count: count() }).from(destinationSearches).innerJoin(destinations, eq(destinationSearches.destinationId, destinations.id)).groupBy(destinations.name).orderBy(desc(count())).limit(8),
    db.select({ count: count() }).from(routeDeviations),
  ]);
  const [completed, total] = await Promise.all([
    db.select({ count: count() }).from(navigationHistory).where(eq(navigationHistory.completionStatus, "completed")),
    db.select({ count: count() }).from(navigationHistory),
  ]);
  return { navigationOverTime, algorithmUsage, destinationDemand, routeSuccessRate: total[0].count ? Math.round((completed[0].count / total[0].count) * 100) : null, deviationCount: deviationSummary[0].count };
}
