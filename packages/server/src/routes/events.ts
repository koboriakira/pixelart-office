import { Hono } from "hono";
import { upsertAgent, getAgents, insertActivityLog } from "../db.js";
import { EVENT_TYPES } from "shared";
import type { EventPayload, EventType, Status, WsMessage } from "shared";

const eventToStatus: Record<EventType, Status | null> = {
  session_start: "idle",
  tool_use_start: "working",
  tool_use_end: "idle",
  session_stop: "offline",
  heartbeat: null, // only update updated_at
};

export function createEventsRoute(
  broadcast: (msg: WsMessage) => void
): Hono {
  const route = new Hono();

  route.post("/", async (c) => {
    const body = await c.req.json<EventPayload>();

    if (!body.agent_id || typeof body.agent_id !== "string") {
      return c.json({ error: "agent_id is required" }, 400);
    }

    if (!body.event || !EVENT_TYPES.includes(body.event as EventType)) {
      return c.json({ error: "invalid event type" }, 400);
    }

    const newStatus = eventToStatus[body.event];

    // Find existing agent or create defaults
    const existing = getAgents().find((a) => a.id === body.agent_id);

    const agent = {
      id: body.agent_id,
      name: existing?.name ?? body.agent_id,
      provider: body.provider ?? existing?.provider ?? "other",
      status: newStatus ?? existing?.status ?? "idle",
      current_task: body.task ?? existing?.current_task ?? null,
      department_id: existing?.department_id ?? null,
      sprite_number: existing?.sprite_number ?? 0,
    };

    upsertAgent(agent);

    insertActivityLog({
      agent_id: body.agent_id,
      event: body.event,
      tool: body.tool,
      task: body.task,
      metadata: body.metadata,
    });

    broadcast({
      type: "agent_event",
      payload: { ...body, status: agent.status },
      ts: Date.now(),
    });

    return c.json({ ok: true });
  });

  return route;
}
