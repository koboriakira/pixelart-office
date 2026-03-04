import { describe, it, expect } from "vitest";
import { layoutRooms } from "../components/office-view/buildScene";
import type { DepartmentWithAgents } from "../types";
import { roomSize, ROOM_PAD } from "../components/office-view/model";

const makeDept = (
  id: string,
  name: string,
  agentCount: number,
  sortOrder: number,
): DepartmentWithAgents => ({
  id,
  name,
  theme_color: id,
  sort_order: sortOrder,
  agents: Array.from({ length: agentCount }, (_, i) => ({
    id: `${id}-a${i}`,
    name: `Agent ${i}`,
    status: "idle" as const,
  })),
});

describe("layoutRooms", () => {
  it("positions a single department at origin", () => {
    const departments = [makeDept("dev", "Development", 2, 0)];
    const rooms = layoutRooms(departments, 800);
    expect(rooms).toHaveLength(1);
    expect(rooms[0].x).toBe(ROOM_PAD);
    expect(rooms[0].y).toBe(ROOM_PAD);
  });

  it("places two departments side by side if they fit", () => {
    const departments = [
      makeDept("dev", "Development", 2, 0),
      makeDept("design", "Design", 2, 1),
    ];
    const size = roomSize(2);
    const canvasWidth = size.w * 2 + ROOM_PAD * 4;
    const rooms = layoutRooms(departments, canvasWidth);

    expect(rooms).toHaveLength(2);
    expect(rooms[0].y).toBe(ROOM_PAD);
    expect(rooms[1].y).toBe(ROOM_PAD);
    expect(rooms[1].x).toBeGreaterThan(rooms[0].x);
  });

  it("wraps to next row when width exceeded", () => {
    const departments = [
      makeDept("dev", "Development", 3, 0),
      makeDept("design", "Design", 3, 1),
    ];
    const size = roomSize(3);
    // Only room for one department
    const canvasWidth = size.w + ROOM_PAD * 2;
    const rooms = layoutRooms(departments, canvasWidth);

    expect(rooms).toHaveLength(2);
    expect(rooms[1].y).toBeGreaterThan(rooms[0].y);
  });

  it("returns department data with each room", () => {
    const departments = [makeDept("dev", "Development", 1, 0)];
    const rooms = layoutRooms(departments, 800);
    expect(rooms[0].department.id).toBe("dev");
    expect(rooms[0].department.name).toBe("Development");
  });
});
