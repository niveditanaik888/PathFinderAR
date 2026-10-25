import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const updateNodeSpy = vi.hoisted(() => vi.fn());
const invalidateSpy = vi.hoisted(() => vi.fn());

vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/components/CampusMap", () => ({ CampusMap: () => <div data-testid="campus-map" /> }));
vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ admin: { graph: { invalidate: invalidateSpy } } }),
    admin: {
      graph: { useQuery: () => ({ data: { nodes: [{ id: 101, externalId: "gate", isAccessible: true, isActive: true }], edges: [] }, isLoading: false, error: null }) },
      setEdgeBlocked: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createNode: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateNode: { useMutation: () => ({ mutate: updateNodeSpy, isPending: false }) },
      deleteNode: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      createEdge: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      updateEdge: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      deleteEdge: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
  },
}));

import GraphEditor from "./GraphEditor";

afterEach(() => {
  cleanup();
  updateNodeSpy.mockReset();
  invalidateSpy.mockReset();
});

describe("GraphEditor location metadata", () => {
  it("lets an administrator set active and accessible routing metadata before saving a node", async () => {
    const user = userEvent.setup();
    render(<GraphEditor />);

    expect(screen.getByText("live routing: active")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Edit node" }));
    await user.click(screen.getByRole("checkbox", { name: "Active in live routing" }));
    await user.click(screen.getByRole("checkbox", { name: "Accessible route waypoint" }));
    await user.click(screen.getByRole("button", { name: "Save node" }));

    expect(updateNodeSpy).toHaveBeenCalledWith(expect.objectContaining({
      nodeId: 101,
      isActive: false,
      isAccessible: false,
    }));
  });
});
