import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createStandardUserContext(): TrpcContext {
  return {
    user: {
      id: 44,
      openId: "standard-user",
      email: "standard@example.com",
      name: "Standard User",
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

describe("admin campus-management access", () => {
  it("rejects a standard user attempting to create a navigable campus node", async () => {
    const caller = appRouter.createCaller(createStandardUserContext());

    await expect(caller.admin.createNode({
      externalId: "test-node",
      name: "Test Node",
      nodeType: "junction",
      latitude: 13.022,
      longitude: 74.982,
      xCoordinate: 50,
      yCoordinate: 50,
      isAccessible: true,
      isActive: true,
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("rejects a standard user attempting to upload public campus imagery", async () => {
    const caller = appRouter.createCaller(createStandardUserContext());

    await expect(caller.admin.uploadMedia({
      slot: "hero",
      title: "Unauthorised image",
      altText: "A campus image that must not be uploaded by a standard user",
      sortOrder: 0,
      isActive: true,
      imageBase64: "dGVzdA==",
      mimeType: "image/png",
    })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
