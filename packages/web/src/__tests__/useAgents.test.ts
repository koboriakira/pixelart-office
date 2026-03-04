import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useAgents } from "../hooks/useAgents";
import type { Agent } from "../types";

const mockAgents: Agent[] = [
  {
    id: "a1",
    name: "Claude-1",
    provider: "claude",
    status: "idle",
    current_task: null,
    department_id: "dev",
    sprite_number: 1,
    updated_at: 1000,
  },
  {
    id: "a2",
    name: "Copilot-1",
    provider: "copilot",
    status: "working",
    current_task: "Fix bug",
    department_id: "design",
    sprite_number: 2,
    updated_at: 2000,
  },
];

describe("useAgents", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ agents: mockAgents }),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches agents on mount", async () => {
    const { result } = renderHook(() => useAgents());

    await waitFor(() => {
      expect(result.current.agents).toHaveLength(2);
    });

    expect(result.current.agents[0].name).toBe("Claude-1");
    expect(fetch).toHaveBeenCalledWith("/api/agents");
  });

  it("returns empty array initially", () => {
    const { result } = renderHook(() => useAgents());
    expect(result.current.agents).toEqual([]);
  });

  it("updates agent on handleWsMessage with agent_status", async () => {
    const { result } = renderHook(() => useAgents());

    await waitFor(() => {
      expect(result.current.agents).toHaveLength(2);
    });

    act(() => {
      result.current.handleWsMessage({
        type: "agent_status",
        payload: { id: "a1", status: "working", current_task: "Deploy" },
        ts: 3000,
      });
    });

    const updated = result.current.agents.find((a) => a.id === "a1");
    expect(updated?.status).toBe("working");
    expect(updated?.current_task).toBe("Deploy");
  });

  it("ignores non-agent_status messages", async () => {
    const { result } = renderHook(() => useAgents());

    await waitFor(() => {
      expect(result.current.agents).toHaveLength(2);
    });

    act(() => {
      result.current.handleWsMessage({
        type: "agent_event",
        payload: { id: "a1", event: "tool_use_start" },
        ts: 3000,
      });
    });

    // Should remain unchanged
    const agent = result.current.agents.find((a) => a.id === "a1");
    expect(agent?.status).toBe("idle");
  });
});
