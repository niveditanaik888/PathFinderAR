import { afterEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const shareHelpers = vi.hoisted(() => ({
  createFavoriteRouteShare: vi.fn(),
  revokeFavoriteRouteShare: vi.fn(),
  getSharedFavoriteRoute: vi.fn(),
}));

vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, ...shareHelpers };
});

import { materializeSharedFavoriteRoute } from "./db";
import { appRouter } from "./routers";

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 44,
      openId: "route-owner",
      email: "owner@example.com",
      name: "Route Owner",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

afterEach(() => vi.resetAllMocks());

describe("saved-route sharing privacy", () => {
  it("scopes create and revoke requests to the signed-in route owner", async () => {
    const caller = appRouter.createCaller(createUserContext());
    shareHelpers.createFavoriteRouteShare.mockResolvedValue(null);
    shareHelpers.revokeFavoriteRouteShare.mockResolvedValue(false);

    await expect(caller.favorites.createShare({ favoriteId: 9, includeAnnotations: true })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.favorites.revokeShare({ favoriteId: 9 })).rejects.toMatchObject({ code: "NOT_FOUND" });

    expect(shareHelpers.createFavoriteRouteShare).toHaveBeenCalledWith({ userId: 44, favoriteId: 9, includeAnnotations: true });
    expect(shareHelpers.revokeFavoriteRouteShare).toHaveBeenCalledWith({ userId: 44, favoriteId: 9 });
  });

  it("rejects a revoked share token and returns only the public route fields for a valid token", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const token = "a".repeat(32);
    shareHelpers.getSharedFavoriteRoute.mockResolvedValueOnce(null).mockResolvedValueOnce({
      label: "Main Gate → Central Library",
      sourceNodeExternalId: "gate",
      destinationExternalId: "d10",
      accessibleOnly: false,
    });

    await expect(caller.sharedRoutes.resolve({ token })).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(caller.sharedRoutes.resolve({ token })).resolves.toEqual({
      label: "Main Gate → Central Library",
      sourceNodeExternalId: "gate",
      destinationExternalId: "d10",
      accessibleOnly: false,
    });
  });

  it("omits saved annotations unless the share was created with explicit consent", () => {
    const input = { label: "Main Gate → Central Library", sourceNodeExternalId: "gate", destinationExternalId: "d10", accessibleOnly: true, note: "Use the accessible entrance.", includeAnnotations: false };

    expect(materializeSharedFavoriteRoute(input, ["study", "morning"])).toEqual({
      label: "Main Gate → Central Library",
      sourceNodeExternalId: "gate",
      destinationExternalId: "d10",
      accessibleOnly: true,
    });
    expect(materializeSharedFavoriteRoute({ ...input, includeAnnotations: true }, ["study", "morning"])).toEqual({
      label: "Main Gate → Central Library",
      sourceNodeExternalId: "gate",
      destinationExternalId: "d10",
      accessibleOnly: true,
      note: "Use the accessible entrance.",
      tags: ["study", "morning"],
    });
  });
});
