import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { campusEdges, campusNodes, DEVIATION_THRESHOLD_METERS, SMALL_GRAPH_NODE_THRESHOLD } from "../shared/pathfinder";
import { calculateRoute, createRouteInstructions } from "../shared/routing";
import { completeNavigationSession, createCampusMedia, createFavoriteRouteShare, createFloorPlanMarker, createGraphEdge, createGraphNode, createIndoorLocation, createNavigationSession, deleteCampusMedia, deleteFloorPlanMarker, deleteFloorPlanOverlay, deleteGraphEdge, deleteGraphNode, deleteIndoorLocation, getActiveCampusMedia, getActiveFloorPlanMarkers, getActiveFloorPlanOverlays, getAdminAuditLogs, getCampusAnalytics, getCampusGraph, getCampusMediaForAdmin, getCampusStats, getDestinationList, getFavoriteRoutesForUser, getFloorPlanMarkersForAdmin, getFloorPlanOverlaysForAdmin, getIndoorLocationsForAdmin, getRecentNavigationForUser, getSharedFavoriteRoute, getVerifiedIndoorLocations, recordAdminAudit, recordRouteDeviation, removeFavoriteRoute, revokeFavoriteRouteShare, saveFavoriteRoute, saveFloorPlanOverlay, setGraphEdgeBlocked, updateCampusMedia, updateFloorPlanMarker, updateFloorPlanOverlay, updateFavoriteRouteAnnotations, updateGraphEdge, updateGraphNode, updateIndoorLocation, updateNavigationProgress } from "./db";
import { answerAssistantTurn, assistantChatRequestSchema, validateAssistantChatRequest } from "./assistant";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storageGetSignedUrl, storagePut } from "./storage";
import { hasImageMagic } from "./mediaValidation";
import { supportedLanguageCodes } from "../shared/i18n";

const campusZoneIds = ["academic-areas", "learning-library", "student-facilities", "visitor-services"] as const;
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Administrator access is required." });
  return next();
});
const nodeInput = z.object({ name: z.string().trim().min(2).max(160), nodeType: z.string().trim().min(2).max(40), latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180), xCoordinate: z.number(), yCoordinate: z.number(), isAccessible: z.boolean(), isActive: z.boolean().optional() });
const edgeInput = z.object({ sourceNodeId: z.number().int().positive(), destinationNodeId: z.number().int().positive(), distance: z.number().positive(), estimatedTime: z.number().int().positive(), isBidirectional: z.boolean(), isAccessible: z.boolean(), edgeType: z.string().trim().min(2).max(40), isBlocked: z.boolean().optional() });
const routeProgressInput = z.object({ routeId: z.number().int().positive(), currentWaypointIndex: z.number().int().nonnegative(), totalWaypoints: z.number().int().positive(), remainingDistance: z.number().nonnegative(), navigationState: z.enum(["active", "completed", "stopped"]) });
const favoriteRouteInput = z.object({ label: z.string().trim().min(2).max(100), sourceNodeExternalId: z.string().trim().min(1).max(64), destinationExternalId: z.string().trim().min(1).max(64), accessibleOnly: z.boolean().default(false) });
const favoriteTagsInput = z.array(z.string().trim().min(1).max(24)).max(6).transform((tags) => Array.from(new Set(tags.map((tag) => tag.toLocaleLowerCase()))));
const favoriteAnnotationsInput = z.object({ favoriteId: z.number().int().positive(), note: z.string().trim().max(600).optional(), tags: favoriteTagsInput });
const favoriteShareInput = z.object({ favoriteId: z.number().int().positive(), includeAnnotations: z.boolean().default(false) });
const campusMediaInput = z.object({ slot: z.enum(["hero", "showcase", "building", "destination"]), title: z.string().trim().min(2).max(160), altText: z.string().trim().min(4).max(300), caption: z.string().trim().max(1000).optional(), sortOrder: z.number().int().min(0).max(999), isActive: z.boolean() });
const campusMediaUploadInput = campusMediaInput.extend({ imageBase64: z.string().min(4).max(7_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) });
const imageExtension: Record<z.infer<typeof campusMediaUploadInput>["mimeType"], string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const indoorLocationInput = z.object({ zoneId: z.enum(campusZoneIds), name: z.string().trim().min(2).max(160), buildingLabel: z.string().trim().min(2).max(160), floorLabel: z.string().trim().min(1).max(80), roomLabel: z.string().trim().min(1).max(80), roomType: z.enum(["room", "lab", "office", "facility", "entrance", "staircase"]), routeNodeExternalId: z.string().trim().min(1).max(64).optional(), searchAliases: z.string().trim().max(800).optional(), commonSearchTerms: z.string().trim().max(800).optional(), description: z.string().trim().max(1200).optional(), accessibilityInfo: z.string().trim().max(800).optional(), verificationSource: z.string().trim().min(4).max(500), verificationStatus: z.enum(["draft", "verified", "archived"]), isActive: z.boolean() });
const floorPlanOverlayInput = z.object({ zoneId: z.enum(campusZoneIds), buildingLabel: z.string().trim().min(2).max(160), floorLabel: z.string().trim().min(1).max(80), title: z.string().trim().min(2).max(160), isPriorityOffice: z.boolean().default(false), approvalStatus: z.enum(["draft", "approved", "retired"]), sourceReference: z.string().trim().min(4).max(500), isActive: z.boolean() });
const floorPlanOverlayUploadInput = floorPlanOverlayInput.extend({ fileName: z.string().trim().min(1).max(255).regex(/^[^/\\]+\.(png|jpe?g|webp)$/i), imageBase64: z.string().min(4).max(12_000_000).regex(/^[A-Za-z0-9+/]+={0,2}$/), mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]) });
const floorPlanImageExtension: Record<z.infer<typeof floorPlanOverlayUploadInput>["mimeType"], string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
const floorPlanMarkerInput = z.object({ overlayId: z.number().int().positive(), indoorLocationId: z.number().int().positive(), label: z.string().trim().min(2).max(160), xPercent: z.number().int().min(0).max(100), yPercent: z.number().int().min(0).max(100), isActive: z.boolean() });
const voiceTranscriptionInput = z.object({
  audioBase64: z.string().min(4).max(11_500_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
  mimeType: z.enum(["audio/webm", "audio/ogg", "audio/wav", "audio/mpeg", "audio/mp4"]),
  language: z.enum(supportedLanguageCodes),
});
const voiceExtension: Record<z.infer<typeof voiceTranscriptionInput>["mimeType"], string> = { "audio/webm": "webm", "audio/ogg": "ogg", "audio/wav": "wav", "audio/mpeg": "mp3", "audio/mp4": "m4a" };

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  campus: router({
    config: publicProcedure.query(() => ({ smallGraphNodeThreshold: SMALL_GRAPH_NODE_THRESHOLD, deviationThresholdMeters: DEVIATION_THRESHOLD_METERS, walkingSpeedMetersPerSecond: 1.4 })),
    graph: publicProcedure.query(async () => (await getCampusGraph()) ?? { source: "demo", nodes: campusNodes, edges: campusEdges }),
    destinations: publicProcedure.input(z.object({ query: z.string().trim().max(120).optional() }).optional()).query(async ({ input }) => (await getDestinationList(input?.query)) ?? { source: "demo" }),
    media: publicProcedure.input(z.object({ slot: z.enum(["hero", "showcase", "building", "destination"]).optional() }).optional()).query(async ({ input }) => await getActiveCampusMedia(input?.slot)),
    indoorLocations: publicProcedure.input(z.object({ zoneId: z.enum(campusZoneIds).optional() }).optional()).query(async ({ input }) => await getVerifiedIndoorLocations(input?.zoneId)),
    floorPlanOverlays: publicProcedure.input(z.object({ zoneId: z.enum(campusZoneIds).optional() }).optional()).query(async ({ input }) => await getActiveFloorPlanOverlays(input?.zoneId)),
    floorPlanMarkers: publicProcedure.input(z.object({ overlayId: z.number().int().positive().optional() }).optional()).query(async ({ input }) => await getActiveFloorPlanMarkers(input?.overlayId)),
  }),
  routing: router({
    calculate: publicProcedure.input(z.object({ startNodeId: z.string().min(1), destinationNodeId: z.string().min(1), algorithm: z.enum(["auto", "dijkstra", "astar"]).default("auto"), accessibleOnly: z.boolean().default(false) })).mutation(({ input }) => {
      const result = calculateRoute(campusNodes, campusEdges, input.startNodeId, input.destinationNodeId, input.algorithm, input.accessibleOnly);
      return { ...result, instructions: createRouteInstructions(campusNodes, result.nodeIds), waypoints: result.nodeIds.map(id => campusNodes.find(node => node.id === id)).filter(Boolean) };
    }),
    history: protectedProcedure.query(async ({ ctx }) => (await getRecentNavigationForUser(ctx.user.id)) ?? []),
    startSession: protectedProcedure.input(z.object({ algorithm: z.enum(["dijkstra", "astar"]), totalDistance: z.number().nonnegative(), estimatedTime: z.number().int().nonnegative(), startLatitude: z.number().gte(-90).lte(90).optional(), startLongitude: z.number().gte(-180).lte(180).optional(), waypoints: z.array(z.object({ latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180), instruction: z.string().max(500).optional() })).min(1) })).mutation(async ({ ctx, input }) => ({ routeId: await createNavigationSession({ ...input, userId: ctx.user.id }) })),
    completeSession: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), completionStatus: z.enum(["completed", "stopped", "abandoned"]), deviationCount: z.number().int().nonnegative(), actualDistance: z.number().nonnegative().optional() })).mutation(async ({ ctx, input }) => { await completeNavigationSession({ ...input, userId: ctx.user.id }); return { success: true }; }),
    updateProgress: protectedProcedure.input(routeProgressInput).mutation(async ({ ctx, input }) => { await updateNavigationProgress({ ...input, userId: ctx.user.id }); return { success: true }; }),
    recordDeviation: protectedProcedure.input(z.object({ routeId: z.number().int().positive(), latitude: z.number().gte(-90).lte(90), longitude: z.number().gte(-180).lte(180), distanceFromRoute: z.number().nonnegative(), rerouted: z.boolean() })).mutation(async ({ input }) => { await recordRouteDeviation(input); return { success: true }; }),
  }),
  favorites: router({
    list: protectedProcedure.query(async ({ ctx }) => await getFavoriteRoutesForUser(ctx.user.id)),
    save: protectedProcedure.input(favoriteRouteInput).mutation(async ({ ctx, input }) => { await saveFavoriteRoute({ ...input, userId: ctx.user.id }); return { success: true }; }),
    update: protectedProcedure.input(favoriteAnnotationsInput).mutation(async ({ ctx, input }) => {
      const updated = await updateFavoriteRouteAnnotations({ ...input, userId: ctx.user.id });
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Saved route not found." });
      return { success: true };
    }),
    remove: protectedProcedure.input(z.object({ favoriteId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await removeFavoriteRoute(ctx.user.id, input.favoriteId); return { success: true }; }),
    createShare: protectedProcedure.input(favoriteShareInput).mutation(async ({ ctx, input }) => {
      const share = await createFavoriteRouteShare({ ...input, userId: ctx.user.id });
      if (!share) throw new TRPCError({ code: "NOT_FOUND", message: "Saved route not found." });
      return share;
    }),
    revokeShare: protectedProcedure.input(z.object({ favoriteId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const revoked = await revokeFavoriteRouteShare({ ...input, userId: ctx.user.id });
      if (!revoked) throw new TRPCError({ code: "NOT_FOUND", message: "Saved route not found." });
      return { success: true };
    }),
  }),
  sharedRoutes: router({
    resolve: publicProcedure.input(z.object({ token: z.string().trim().regex(/^[A-Za-z0-9_-]{24,80}$/) })).query(async ({ input }) => {
      const shared = await getSharedFavoriteRoute(input.token);
      if (!shared) throw new TRPCError({ code: "NOT_FOUND", message: "This shared route is unavailable or has been revoked." });
      return shared;
    }),
  }),
  assistant: router({
    chat: publicProcedure.input(assistantChatRequestSchema).mutation(async ({ input }) => {
      const validation = validateAssistantChatRequest(input);
      if (!validation.success) {
        throw new TRPCError({
          code: validation.errorCode,
          message: validation.errorCode === "PRECONDITION_FAILED" ? "The selected language is not supported for AI replies." : "Please provide a valid assistant request.",
        });
      }
      try {
        return await answerAssistantTurn(validation.data);
      } catch (error) {
        console.error("[Campus assistant] Unable to answer request", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "PathFinder could not answer right now. Please try again." });
      }
    }),
    transcribe: publicProcedure.input(voiceTranscriptionInput).mutation(async ({ input }) => {
      const audio = Buffer.from(input.audioBase64, "base64");
      if (!audio.length || audio.length > 8 * 1024 * 1024) {
        throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "The voice recording is too large. Please keep it under one minute." });
      }
      try {
        const { key } = await storagePut(`assistant-voice/${Date.now()}.${voiceExtension[input.mimeType]}`, audio, input.mimeType);
        const audioUrl = await storageGetSignedUrl(key);
        const result = await transcribeAudio({
          audioUrl,
          language: input.language === "tcy" ? "kn" : input.language,
          prompt: "Transcribe this short AIET campus navigation request faithfully in the user's selected Indian language. Return only the spoken words.",
        });
        if ("error" in result || !result.text.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "The recording could not be transcribed. Please try again or type your request." });
        }
        return { text: result.text.trim(), language: result.language };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[Assistant voice] Unable to transcribe recorded audio", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The recording could not be transcribed. Please try again or type your request." });
      }
    }),
  }),
  admin: router({
    auditLogs: adminProcedure.input(z.object({ from: z.string().datetime().optional(), to: z.string().datetime().optional(), action: z.string().trim().max(80).optional(), entityType: z.string().trim().max(80).optional(), limit: z.number().int().min(1).max(500).default(200) }).optional()).query(async ({ input }) => await getAdminAuditLogs({ from: input?.from ? new Date(input.from) : undefined, to: input?.to ? new Date(input.to) : undefined, action: input?.action || undefined, entityType: input?.entityType || undefined, limit: input?.limit ?? 200 })),
    stats: adminProcedure.query(async () => await getCampusStats()),
    analytics: adminProcedure.query(async () => await getCampusAnalytics()),
    graph: adminProcedure.query(async () => await getCampusGraph()),
    setEdgeBlocked: adminProcedure.input(z.object({ edgeId: z.number().int().positive(), isBlocked: z.boolean() })).mutation(async ({ input }) => { await setGraphEdgeBlocked(input.edgeId, input.isBlocked); return { success: true }; }),
    createNode: adminProcedure.input(nodeInput.extend({ externalId: z.string().trim().min(2).max(64) })).mutation(async ({ input }) => { await createGraphNode(input); return { success: true }; }),
    updateNode: adminProcedure.input(nodeInput.extend({ nodeId: z.number().int().positive(), isActive: z.boolean() })).mutation(async ({ input }) => { const { nodeId, ...rest } = input; await updateGraphNode(nodeId, rest); return { success: true }; }),
    deleteNode: adminProcedure.input(z.object({ nodeId: z.number().int().positive() })).mutation(async ({ input }) => { await deleteGraphNode(input.nodeId); return { success: true }; }),
    createEdge: adminProcedure.input(edgeInput).mutation(async ({ input }) => { await createGraphEdge(input); return { success: true }; }),
    updateEdge: adminProcedure.input(edgeInput.extend({ edgeId: z.number().int().positive(), isBlocked: z.boolean() })).mutation(async ({ input }) => { const { edgeId, ...rest } = input; await updateGraphEdge(edgeId, rest); return { success: true }; }),
    deleteEdge: adminProcedure.input(z.object({ edgeId: z.number().int().positive() })).mutation(async ({ input }) => { await deleteGraphEdge(input.edgeId); return { success: true }; }),
    media: adminProcedure.query(async () => await getCampusMediaForAdmin()),
    uploadMedia: adminProcedure.input(campusMediaUploadInput).mutation(async ({ ctx, input }) => {
      const image = Buffer.from(input.imageBase64, "base64");
      if (!image.length || image.length > 5 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Campus imagery must be 5 MB or smaller." });
      if (!hasImageMagic(image, input.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The image bytes do not match the selected image type." });
      const { key, url } = await storagePut(`campus-media/${ctx.user.id}/${Date.now()}.${imageExtension[input.mimeType]}`, image, input.mimeType);
      const { imageBase64: _imageBase64, mimeType: _mimeType, ...mediaMetadata } = input;
      await createCampusMedia({ ...mediaMetadata, mimeType: input.mimeType, mediaUrl: url, mediaKey: key, createdByUserId: ctx.user.id });
      await recordAdminAudit({ actorUserId: ctx.user.id, action: "upload", entityType: "campus-media", metadata: { title: input.title, bytes: image.length, mimeType: input.mimeType } });
      return { success: true, url };
    }),
    updateMedia: adminProcedure.input(campusMediaInput.extend({ mediaId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const { mediaId, ...rest } = input; await updateCampusMedia(mediaId, rest); await recordAdminAudit({ actorUserId: ctx.user.id, action: rest.isActive ? "activate" : "update", entityType: "campus-media", entityId: mediaId, metadata: { slot: rest.slot, isActive: rest.isActive } }); return { success: true }; }),
    deleteMedia: adminProcedure.input(z.object({ mediaId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await deleteCampusMedia(input.mediaId); await recordAdminAudit({ actorUserId: ctx.user.id, action: "delete", entityType: "campus-media", entityId: input.mediaId }); return { success: true }; }),
    indoorLocations: adminProcedure.query(async () => await getIndoorLocationsForAdmin()),
    createIndoorLocation: adminProcedure.input(indoorLocationInput).mutation(async ({ ctx, input }) => {
      const verified = input.verificationStatus === "verified";
      await createIndoorLocation({ ...input, createdByUserId: ctx.user.id, verifiedByUserId: verified ? ctx.user.id : undefined, verifiedAt: verified ? new Date() : undefined });
      return { success: true };
    }),
    updateIndoorLocation: adminProcedure.input(indoorLocationInput.extend({ locationId: z.number().int().positive() })).mutation(async ({ ctx, input }) => {
      const { locationId, ...rest } = input;
      const verified = rest.verificationStatus === "verified";
      await updateIndoorLocation(locationId, { ...rest, verifiedByUserId: verified ? ctx.user.id : undefined, verifiedAt: verified ? new Date() : null });
      return { success: true };
    }),
    deleteIndoorLocation: adminProcedure.input(z.object({ locationId: z.number().int().positive() })).mutation(async ({ input }) => { await deleteIndoorLocation(input.locationId); return { success: true }; }),
    floorPlanOverlays: adminProcedure.query(async () => await getFloorPlanOverlaysForAdmin()),
    uploadFloorPlanOverlay: adminProcedure.input(floorPlanOverlayUploadInput).mutation(async ({ ctx, input }) => {
      const { imageBase64, mimeType, fileName, approvalStatus: _approvalStatus, isActive: _isActive, ...metadata } = input;
      const image = Buffer.from(imageBase64, "base64");
      if (!image.length || image.length > 8 * 1024 * 1024) throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "Floor-plan overlays must be 8 MB or smaller." });
      if (!hasImageMagic(image, mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The floor-plan bytes do not match the selected image type." });
      const { key, url } = await storagePut(`campus-floor-plans/${ctx.user.id}/${metadata.zoneId}-${Date.now()}.${floorPlanImageExtension[mimeType]}`, image, mimeType);
      await saveFloorPlanOverlay({ ...metadata, overlayUrl: url, overlayKey: key, mimeType, fileName, fileSizeBytes: image.length, approvalStatus: "draft", isActive: false, createdByUserId: ctx.user.id });
      await recordAdminAudit({ actorUserId: ctx.user.id, action: "upload", entityType: "floor-plan-overlay", entityId: metadata.zoneId, metadata: { fileName, bytes: image.length, mimeType, approvalStatus: "draft" } });
      return { success: true, url };
    }),
    updateFloorPlanOverlay: adminProcedure.input(floorPlanOverlayInput.omit({ zoneId: true, buildingLabel: true, floorLabel: true }).extend({ overlayId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { const { overlayId, ...rest } = input; await updateFloorPlanOverlay(overlayId, rest); await recordAdminAudit({ actorUserId: ctx.user.id, action: rest.approvalStatus === "approved" ? "approve" : "update", entityType: "floor-plan-overlay", entityId: overlayId, metadata: { approvalStatus: rest.approvalStatus, isActive: rest.isActive } }); return { success: true }; }),
    deleteFloorPlanOverlay: adminProcedure.input(z.object({ overlayId: z.number().int().positive() })).mutation(async ({ ctx, input }) => { await deleteFloorPlanOverlay(input.overlayId); await recordAdminAudit({ actorUserId: ctx.user.id, action: "delete", entityType: "floor-plan-overlay", entityId: input.overlayId }); return { success: true }; }),
    floorPlanMarkers: adminProcedure.query(async () => await getFloorPlanMarkersForAdmin()),
    createFloorPlanMarker: adminProcedure.input(floorPlanMarkerInput).mutation(async ({ ctx, input }) => {
      const indoorLocation = (await getIndoorLocationsForAdmin()).find((location) => location.id === input.indoorLocationId);
      if (!indoorLocation || !indoorLocation.isActive || indoorLocation.verificationStatus !== "verified" || !indoorLocation.routeNodeExternalId) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Markers require an active, verified indoor location with a configured route step." });
      }
      await createFloorPlanMarker({ ...input, routeNodeExternalId: indoorLocation.routeNodeExternalId, createdByUserId: ctx.user.id });
      return { success: true };
    }),
    updateFloorPlanMarker: adminProcedure.input(floorPlanMarkerInput.pick({ label: true, xPercent: true, yPercent: true, isActive: true }).extend({ markerId: z.number().int().positive() })).mutation(async ({ input }) => { const { markerId, ...rest } = input; await updateFloorPlanMarker(markerId, rest); return { success: true }; }),
    deleteFloorPlanMarker: adminProcedure.input(z.object({ markerId: z.number().int().positive() })).mutation(async ({ input }) => { await deleteFloorPlanMarker(input.markerId); return { success: true }; }),
  }),
});

export type AppRouter = typeof appRouter;
