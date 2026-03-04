import { describe, it, expect } from "vitest";
import {
  providerAccentColor,
  truncateTask,
  WORKING_PARTICLE_COLORS,
  PARTICLE_SPAWN_INTERVAL,
  PARTICLE_LIFETIME,
} from "../components/office-view/buildScene-department-agent";

describe("providerAccentColor", () => {
  it("returns orange for claude", () => {
    expect(providerAccentColor("claude")).toBe(0xd97706);
  });

  it("returns green for copilot", () => {
    expect(providerAccentColor("copilot")).toBe(0x16a34a);
  });

  it("returns gray for other", () => {
    expect(providerAccentColor("other")).toBe(0x6b7280);
  });
});

describe("truncateTask", () => {
  it("returns short text as-is", () => {
    expect(truncateTask("hello")).toBe("hello");
  });

  it("truncates text longer than 16 chars", () => {
    const long = "This is a very long task name";
    expect(truncateTask(long)).toBe("This is a very l...");
    expect(truncateTask(long).length).toBe(19);
  });

  it("returns exact 16 char text as-is", () => {
    const exact = "1234567890123456";
    expect(truncateTask(exact)).toBe(exact);
  });

  it("returns empty string for null", () => {
    expect(truncateTask(null)).toBe("");
  });
});

describe("constants", () => {
  it("has 5 particle colors", () => {
    expect(WORKING_PARTICLE_COLORS).toHaveLength(5);
  });

  it("spawns every 10 ticks", () => {
    expect(PARTICLE_SPAWN_INTERVAL).toBe(10);
  });

  it("particles live 35 ticks", () => {
    expect(PARTICLE_LIFETIME).toBe(35);
  });
});
