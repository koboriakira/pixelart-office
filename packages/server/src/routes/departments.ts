import { Hono } from "hono";
import { getDepartmentsWithAgents } from "../db.js";
import type { DepartmentsResponse } from "shared";

export const departmentsRoute = new Hono();

departmentsRoute.get("/", (c) => {
  const departments = getDepartmentsWithAgents();
  return c.json({ departments } satisfies DepartmentsResponse);
});
