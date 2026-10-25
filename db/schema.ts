import { boolean, decimal, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  phone: varchar("phone", { length: 32 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export const buildings = mysqlTable("buildings", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  address: text("address"),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const floors = mysqlTable("floors", {
  id: int("id").autoincrement().primaryKey(),
  buildingId: int("buildingId").notNull().references(() => buildings.id, { onDelete: "cascade" }),
  floorNumber: int("floorNumber").notNull(),
  floorName: varchar("floorName", { length: 80 }).notNull(),
  mapImageUrl: text("mapImageUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const graphNodes = mysqlTable("graph_nodes", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique(),
  buildingId: int("buildingId").references(() => buildings.id, { onDelete: "set null" }),
  floorId: int("floorId").references(() => floors.id, { onDelete: "set null" }),
  name: varchar("name", { length: 160 }).notNull(),
  nodeType: varchar("nodeType", { length: 40 }).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  xCoordinate: decimal("xCoordinate", { precision: 10, scale: 2 }).notNull(),
  yCoordinate: decimal("yCoordinate", { precision: 10, scale: 2 }).notNull(),
  isAccessible: boolean("isAccessible").default(true).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const graphEdges = mysqlTable("graph_edges", {
  id: int("id").autoincrement().primaryKey(),
  sourceNodeId: int("sourceNodeId").notNull().references(() => graphNodes.id, { onDelete: "cascade" }),
  destinationNodeId: int("destinationNodeId").notNull().references(() => graphNodes.id, { onDelete: "cascade" }),
  distance: decimal("distance", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: int("estimatedTime").notNull(),
  isBidirectional: boolean("isBidirectional").default(true).notNull(),
  isBlocked: boolean("isBlocked").default(false).notNull(),
  isAccessible: boolean("isAccessible").default(true).notNull(),
  edgeType: varchar("edgeType", { length: 40 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const destinations = mysqlTable("destinations", {
  id: int("id").autoincrement().primaryKey(),
  externalId: varchar("externalId", { length: 64 }).notNull().unique(),
  buildingId: int("buildingId").references(() => buildings.id, { onDelete: "set null" }),
  floorId: int("floorId").references(() => floors.id, { onDelete: "set null" }),
  nodeId: int("nodeId").notNull().references(() => graphNodes.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  description: text("description"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  roomNumber: varchar("roomNumber", { length: 40 }),
  accessibilityInfo: text("accessibilityInfo"),
  imageUrl: text("imageUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export const routes = mysqlTable("routes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  destinationId: int("destinationId").references(() => destinations.id, { onDelete: "set null" }),
  startLatitude: decimal("startLatitude", { precision: 10, scale: 7 }),
  startLongitude: decimal("startLongitude", { precision: 10, scale: 7 }),
  algorithm: varchar("algorithm", { length: 20 }).notNull(),
  totalDistance: decimal("totalDistance", { precision: 10, scale: 2 }).notNull(),
  estimatedTime: int("estimatedTime").notNull(),
  routeStatus: mysqlEnum("routeStatus", ["planned", "active", "completed", "stopped", "rerouted"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const routeWaypoints = mysqlTable("route_waypoints", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull().references(() => routes.id, { onDelete: "cascade" }),
  nodeId: int("nodeId").references(() => graphNodes.id, { onDelete: "set null" }),
  sequenceNumber: int("sequenceNumber").notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  instruction: text("instruction"),
});

export const navigationHistory = mysqlTable("navigation_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  routeId: int("routeId").notNull().references(() => routes.id, { onDelete: "cascade" }),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
  completionStatus: mysqlEnum("completionStatus", ["completed", "stopped", "abandoned"]).notNull(),
  deviationCount: int("deviationCount").default(0).notNull(),
  actualDistance: decimal("actualDistance", { precision: 10, scale: 2 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const routeDeviations = mysqlTable("route_deviations", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull().references(() => routes.id, { onDelete: "cascade" }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  detectedAt: timestamp("detectedAt").defaultNow().notNull(),
  distanceFromRoute: decimal("distanceFromRoute", { precision: 10, scale: 2 }).notNull(),
  rerouted: boolean("rerouted").default(false).notNull(),
});

/** A resumable, privacy-minimising progress snapshot for an active route session. */
export const routeProgress = mysqlTable("route_progress", {
  id: int("id").autoincrement().primaryKey(),
  routeId: int("routeId").notNull().references(() => routes.id, { onDelete: "cascade" }).unique(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  currentWaypointIndex: int("currentWaypointIndex").default(0).notNull(),
  totalWaypoints: int("totalWaypoints").notNull(),
  remainingDistance: decimal("remainingDistance", { precision: 10, scale: 2 }).notNull(),
  navigationState: mysqlEnum("navigationState", ["active", "completed", "stopped"]).default("active").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Saved route shortcuts; all location identifiers are configured campus external IDs. */
export const favoriteRoutes = mysqlTable("favorite_routes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 100 }).notNull(),
  note: varchar("note", { length: 600 }),
  sourceNodeExternalId: varchar("sourceNodeExternalId", { length: 64 }).notNull(),
  destinationExternalId: varchar("destinationExternalId", { length: 64 }).notNull(),
  accessibleOnly: boolean("accessibleOnly").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  uniqueConfiguredRoute: uniqueIndex("favorite_route_unique").on(table.userId, table.sourceNodeExternalId, table.destinationExternalId, table.accessibleOnly),
}));

/** User-owned normalized tags for organising saved route shortcuts. */
export const favoriteRouteTags = mysqlTable("favorite_route_tags", {
  id: int("id").autoincrement().primaryKey(),
  favoriteRouteId: int("favoriteRouteId").notNull().references(() => favoriteRoutes.id, { onDelete: "cascade" }),
  tag: varchar("tag", { length: 24 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, table => ({
  uniqueFavoriteTag: uniqueIndex("favorite_route_tag_unique").on(table.favoriteRouteId, table.tag),
}));

/** Revocable public links for a saved route. Raw tokens are never stored. */
export const favoriteRouteShares = mysqlTable("favorite_route_shares", {
  id: int("id").autoincrement().primaryKey(),
  favoriteRouteId: int("favoriteRouteId").notNull().references(() => favoriteRoutes.id, { onDelete: "cascade" }),
  tokenHash: varchar("tokenHash", { length: 64 }).notNull().unique(),
  includeAnnotations: boolean("includeAnnotations").default(false).notNull(),
  revokedAt: timestamp("revokedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Public-facing campus imagery uploaded and controlled by administrators. */
export const campusMedia = mysqlTable("campus_media", {
  id: int("id").autoincrement().primaryKey(),
  slot: mysqlEnum("slot", ["hero", "showcase", "building", "destination"]).default("showcase").notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  mediaUrl: text("mediaUrl").notNull(),
  mediaKey: text("mediaKey"),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  altText: varchar("altText", { length: 300 }).notNull(),
  caption: text("caption"),
  sortOrder: int("sortOrder").default(0).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Security/audit trail for administrator-controlled campus content mutations. */
export const adminAuditLogs = mysqlTable("admin_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorUserId: int("actorUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 80 }).notNull(),
  entityType: varchar("entityType", { length: 80 }).notNull(),
  entityId: varchar("entityId", { length: 80 }),
  metadata: text("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

/** Source-controlled indoor destination details. Only active verified entries are exposed publicly. */
export const indoorLocations = mysqlTable("indoor_locations", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: varchar("zoneId", { length: 64 }).notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  buildingLabel: varchar("buildingLabel", { length: 160 }).notNull(),
  floorLabel: varchar("floorLabel", { length: 80 }).notNull(),
  roomLabel: varchar("roomLabel", { length: 80 }).notNull(),
  roomType: mysqlEnum("roomType", ["room", "lab", "office", "facility", "entrance", "staircase"]).default("room").notNull(),
  routeNodeExternalId: varchar("routeNodeExternalId", { length: 64 }),
  searchAliases: text("searchAliases"),
  commonSearchTerms: text("commonSearchTerms"),
  description: text("description"),
  accessibilityInfo: text("accessibilityInfo"),
  verificationSource: varchar("verificationSource", { length: 500 }).notNull(),
  verificationStatus: mysqlEnum("verificationStatus", ["draft", "verified", "archived"]).default("draft").notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  verifiedAt: timestamp("verifiedAt"),
  verifiedByUserId: int("verifiedByUserId").references(() => users.id, { onDelete: "set null" }),
  createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

/** Campus-office floor-plan images. Only active approved overlays are exposed publicly. */
export const floorPlanOverlays = mysqlTable("floor_plan_overlays", {
  id: int("id").autoincrement().primaryKey(),
  zoneId: varchar("zoneId", { length: 64 }).notNull(),
  buildingLabel: varchar("buildingLabel", { length: 160 }).notNull(),
  floorLabel: varchar("floorLabel", { length: 80 }).notNull(),
  title: varchar("title", { length: 160 }).notNull(),
  overlayUrl: text("overlayUrl").notNull(),
  overlayKey: text("overlayKey"),
  mimeType: varchar("mimeType", { length: 120 }).notNull(),
  fileName: varchar("fileName", { length: 255 }),
  fileSizeBytes: int("fileSizeBytes"),
  isPriorityOffice: boolean("isPriorityOffice").default(false).notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["draft", "approved", "retired"]).default("draft").notNull(),
  sourceReference: varchar("sourceReference", { length: 500 }).notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  oneOverlayPerFloor: uniqueIndex("floor_plan_overlay_floor_unique").on(table.zoneId, table.buildingLabel, table.floorLabel),
}));

/** Marker positions are administrator-authored and become public only through an active approved overlay. */
export const floorPlanMarkers = mysqlTable("floor_plan_markers", {
  id: int("id").autoincrement().primaryKey(),
  overlayId: int("overlayId").notNull().references(() => floorPlanOverlays.id, { onDelete: "cascade" }),
  indoorLocationId: int("indoorLocationId").references(() => indoorLocations.id, { onDelete: "set null" }),
  label: varchar("label", { length: 160 }).notNull(),
  xPercent: int("xPercent").notNull(),
  yPercent: int("yPercent").notNull(),
  routeNodeExternalId: varchar("routeNodeExternalId", { length: 64 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdByUserId: int("createdByUserId").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, table => ({
  markerLabelPerOverlay: uniqueIndex("floor_plan_marker_label_unique").on(table.overlayId, table.label),
}));

export const blockedPaths = mysqlTable("blocked_paths", {
  id: int("id").autoincrement().primaryKey(),
  edgeId: int("edgeId").notNull().references(() => graphEdges.id, { onDelete: "cascade" }),
  reason: text("reason").notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  isActive: boolean("isActive").default(true).notNull(),
});

export const destinationSearches = mysqlTable("destination_searches", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").references(() => users.id, { onDelete: "set null" }),
  destinationId: int("destinationId").notNull().references(() => destinations.id, { onDelete: "cascade" }),
  searchedAt: timestamp("searchedAt").defaultNow().notNull(),
});
