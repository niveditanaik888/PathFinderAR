import type { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";
import { z } from "zod";
import { campusEdges, campusNodes, destinations } from "../shared/pathfinder";
import { calculateRoute, createRouteInstructions } from "../shared/routing";

const calculateSchema = z.object({
  startNodeId: z.string().min(1),
  destinationNodeId: z.string().min(1),
  algorithm: z.enum(["auto", "dijkstra", "astar"]).default("auto"),
  accessibleOnly: z.boolean().optional().default(false),
});

/**
 * REST compatibility layer retained for engineering-review interoperability.
 * The application UI uses typed tRPC procedures; this endpoint fulfils the published API contract.
 */
export function registerPathfinderRestRoutes(app: Express) {
  app.post("/api/routes/calculate", (req: Request, res: Response) => {
    const parsed = calculateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid route request", details: parsed.error.flatten() });
    try {
      const route = calculateRoute(campusNodes, campusEdges, parsed.data.startNodeId, parsed.data.destinationNodeId, parsed.data.algorithm, parsed.data.accessibleOnly);
      const waypoints = route.nodeIds.map(id => campusNodes.find(node => node.id === id)).filter(Boolean);
      return res.status(200).json({
        routeId: `demo-${Date.now()}`,
        algorithm: route.algorithm === "astar" ? "A*" : "Dijkstra",
        waypoints,
        totalDistance: route.totalDistance,
        estimatedTime: route.estimatedTime,
        instructions: createRouteInstructions(campusNodes, route.nodeIds),
        processing: { visitedNodeCount: route.visitedNodeCount, executionTimeMs: route.executionTimeMs },
        source: "PathFinder Smart Campus demo graph",
      });
    } catch (error) {
      return res.status(422).json({ error: error instanceof Error ? error.message : "No route is available." });
    }
  });

  app.get("/api/destinations", (req: Request, res: Response) => {
    const query = typeof req.query.query === "string" ? req.query.query.trim().toLowerCase() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const results = destinations.filter(d => {
      if (!d.isActive) return false;
      if (category && category !== "All" && d.category.toLowerCase() !== category.toLowerCase()) return false;
      if (query) {
        const match = `${d.name} ${d.description} ${d.category} ${d.buildingName} ${d.floorName} ${d.roomNumber ?? ""}`.toLowerCase();
        if (!match.includes(query)) return false;
      }
      return true;
    });
    return res.status(200).json({
      total: results.length,
      destinations: results,
      source: "PathFinder Smart Campus repository dataset",
    });
  });

  app.get("/api/video-proxy", (_req: Request, res: Response) => {
    const videoFile = path.resolve(import.meta.dirname, "../frontend/public/aiet-campus-hero.webm");
    const mp4File = path.resolve(import.meta.dirname, "../frontend/public/aiet-campus-hero.mp4");
    const targetFile = fs.existsSync(videoFile) ? videoFile : mp4File;
    if (fs.existsSync(targetFile)) {
      res.set("Cache-Control", "public, max-age=86400");
      res.sendFile(targetFile);
    } else {
      res.redirect(307, "https://new.aiet.org.in/api/video-proxy?url=https%3A%2F%2Fdrive.google.com%2Fuc%3Fexport%3Ddownload%26id%3D1RwenhclEcyMvlnPCW7mRYlT0RnBWOXRc");
    }
  });
}
