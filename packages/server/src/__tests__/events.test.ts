import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";
import { initDb, getAgents } from "../db.js";
import { createEventsRoute } from "../routes/events.js";
import type { WsMessage } from "shared";

describe("POST /api/events", () => {
  let app: Hono;
  const broadcastMock = vi.fn<(msg: WsMessage) => void>();

  beforeEach(() => {
    initDb(":memory:");
    broadcastMock.mockClear();
    app = new Hono();
    app.route("/api/events", createEventsRoute(broadcastMock));
  });

  function postEvent(body: unknown) {
    return app.request("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  it("should create agent on session_start and set status to idle", async () => {
    const res = await postEvent({
      agent_id: "agent-1",
      event: "session_start",
    });
    expect(res.status).toBe(200);

    const agents = getAgents();
    expect(agents).toHaveLength(1);
    expect(agents[0].id).toBe("agent-1");
    expect(agents[0].status).toBe("idle");
  });

  it("should set status to working on tool_use_start", async () => {
    await postEvent({ agent_id: "agent-1", event: "session_start" });
    const res = await postEvent({
      agent_id: "agent-1",
      event: "tool_use_start",
      tool: "Read",
    });
    expect(res.status).toBe(200);

    const agents = getAgents();
    expect(agents[0].status).toBe("working");
  });

  it("should set status to idle on tool_use_end", async () => {
    await postEvent({ agent_id: "agent-1", event: "session_start" });
    await postEvent({ agent_id: "agent-1", event: "tool_use_start" });
    const res = await postEvent({
      agent_id: "agent-1",
      event: "tool_use_end",
    });
    expect(res.status).toBe(200);

    const agents = getAgents();
    expect(agents[0].status).toBe("idle");
  });

  it("should set status to offline on session_stop", async () => {
    await postEvent({ agent_id: "agent-1", event: "session_start" });
    const res = await postEvent({
      agent_id: "agent-1",
      event: "session_stop",
    });
    expect(res.status).toBe(200);

    const agents = getAgents();
    expect(agents[0].status).toBe("offline");
  });

  it("should only update updated_at on heartbeat", async () => {
    await postEvent({ agent_id: "agent-1", event: "session_start" });
    await postEvent({
      agent_id: "agent-1",
      event: "tool_use_start",
    });

    const agentsBefore = getAgents();
    expect(agentsBefore[0].status).toBe("working");

    const res = await postEvent({
      agent_id: "agent-1",
      event: "heartbeat",
    });
    expect(res.status).toBe(200);

    const agentsAfter = getAgents();
    expect(agentsAfter[0].status).toBe("working");
  });

  it("should call broadcast on event", async () => {
    await postEvent({ agent_id: "agent-1", event: "session_start" });
    expect(broadcastMock).toHaveBeenCalled();
    const call = broadcastMock.mock.calls[0][0];
    expect(call.type).toBe("agent_event");
  });

  it("should return 400 for missing agent_id", async () => {
    const res = await postEvent({ event: "session_start" });
    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid event type", async () => {
    const res = await postEvent({
      agent_id: "agent-1",
      event: "invalid_event",
    });
    expect(res.status).toBe(400);
  });

  it("should store task from payload", async () => {
    await postEvent({
      agent_id: "agent-1",
      event: "session_start",
      task: "Fix login bug",
    });
    const agents = getAgents();
    expect(agents[0].current_task).toBe("Fix login bug");
  });
});
