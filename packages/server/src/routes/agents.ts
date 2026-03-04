import { Hono } from "hono";
import { getAgents } from "../db.js";
import type { AgentsResponse } from "shared";

export const agentsRoute = new Hono();

agentsRoute.get("/", (c) => {
  const agents = getAgents();
  return c.json({ agents } satisfies AgentsResponse);
});
