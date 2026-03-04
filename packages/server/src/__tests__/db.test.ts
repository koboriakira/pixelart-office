import { describe, it, expect, beforeEach } from "vitest";
import {
  initDb,
  upsertAgent,
  getAgents,
  getDepartmentsWithAgents,
  insertActivityLog,
} from "../db.js";

describe("db", () => {
  beforeEach(() => {
    initDb(":memory:");
  });

  describe("initDb", () => {
    it("should seed default departments", () => {
      const departments = getDepartmentsWithAgents();
      expect(departments).toHaveLength(5);
      const names = departments.map((d) => d.name);
      expect(names).toContain("dev");
      expect(names).toContain("design");
      expect(names).toContain("planning");
      expect(names).toContain("operations");
      expect(names).toContain("qa");
    });

    it("should return departments sorted by sort_order", () => {
      const departments = getDepartmentsWithAgents();
      for (let i = 1; i < departments.length; i++) {
        expect(departments[i].sort_order).toBeGreaterThanOrEqual(
          departments[i - 1].sort_order
        );
      }
    });
  });

  describe("upsertAgent", () => {
    it("should insert a new agent", () => {
      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "idle",
        current_task: null,
        department_id: "dev",
        sprite_number: 1,
      });

      const agents = getAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].id).toBe("agent-1");
      expect(agents[0].name).toBe("Agent 1");
      expect(agents[0].provider).toBe("claude");
      expect(agents[0].status).toBe("idle");
    });

    it("should update an existing agent", () => {
      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "idle",
        current_task: null,
        department_id: "dev",
        sprite_number: 1,
      });

      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "working",
        current_task: "fixing bug",
        department_id: "dev",
        sprite_number: 1,
      });

      const agents = getAgents();
      expect(agents).toHaveLength(1);
      expect(agents[0].status).toBe("working");
      expect(agents[0].current_task).toBe("fixing bug");
    });
  });

  describe("getAgents", () => {
    it("should return empty array when no agents exist", () => {
      const agents = getAgents();
      expect(agents).toEqual([]);
    });
  });

  describe("getDepartmentsWithAgents", () => {
    it("should include agents in their departments", () => {
      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "idle",
        current_task: null,
        department_id: "dev",
        sprite_number: 1,
      });

      const departments = getDepartmentsWithAgents();
      const dev = departments.find((d) => d.id === "dev");
      expect(dev).toBeDefined();
      expect(dev!.agents).toHaveLength(1);
      expect(dev!.agents[0].id).toBe("agent-1");
      expect(dev!.agents[0].status).toBe("idle");
    });

    it("should return empty agents array for departments with no agents", () => {
      const departments = getDepartmentsWithAgents();
      for (const dept of departments) {
        expect(dept.agents).toEqual([]);
      }
    });
  });

  describe("insertActivityLog", () => {
    it("should insert an activity log entry", () => {
      upsertAgent({
        id: "agent-1",
        name: "Agent 1",
        provider: "claude",
        status: "idle",
        current_task: null,
        department_id: "dev",
        sprite_number: 1,
      });

      // Should not throw
      insertActivityLog({
        agent_id: "agent-1",
        event: "session_start",
      });
    });
  });
});
