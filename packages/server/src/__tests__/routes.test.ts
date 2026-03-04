import { describe, it, expect, beforeEach } from "vitest";
import { Hono } from "hono";
import { initDb, upsertAgent } from "../db.js";
import { agentsRoute } from "../routes/agents.js";
import { departmentsRoute } from "../routes/departments.js";

describe("routes", () => {
  let app: Hono;

  beforeEach(() => {
    initDb(":memory:");
    app = new Hono();
    app.route("/api/agents", agentsRoute);
    app.route("/api/departments", departmentsRoute);
  });

  describe("GET /api/agents", () => {
    it("should return empty agents array when no agents exist", async () => {
      const res = await app.request("/api/agents");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ agents: [] });
    });

    it("should return all agents", async () => {
      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "idle",
        current_task: null,
        department_id: "dev",
        sprite_number: 1,
      });

      const res = await app.request("/api/agents");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.agents).toHaveLength(1);
      expect(body.agents[0].id).toBe("agent-1");
    });
  });

  describe("GET /api/departments", () => {
    it("should return departments sorted by sort_order", async () => {
      const res = await app.request("/api/departments");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.departments).toHaveLength(5);
      expect(body.departments[0].id).toBe("dev");
      expect(body.departments[4].id).toBe("qa");
    });

    it("should include agents in departments", async () => {
      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "working",
        current_task: "task-1",
        department_id: "design",
        sprite_number: 2,
      });

      const res = await app.request("/api/departments");
      const body = await res.json();
      const design = body.departments.find(
        (d: { id: string }) => d.id === "design"
      );
      expect(design.agents).toHaveLength(1);
      expect(design.agents[0].id).toBe("agent-1");
      expect(design.agents[0].status).toBe("working");
    });
  });
});
