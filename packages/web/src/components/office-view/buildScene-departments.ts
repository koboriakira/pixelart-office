import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { DepartmentWithAgents } from "../../types";
import { DEPARTMENT_THEMES, type RoomTheme } from "./themes";
import { drawTiledFloor, drawWall, drawDesk, drawChair } from "./drawing-core";
import { slotPosition, SLOT_W, DESK_W, DESK_H } from "./model";
import type { RoomLayout } from "./buildScene";

const WALL_H = 12;
const SIGN_H = 24;

function getTheme(deptId: string, mode: "light" | "dark"): RoomTheme {
  const themeSet = DEPARTMENT_THEMES[deptId];
  if (themeSet) return themeSet[mode];
  // Fallback to dev theme
  return DEPARTMENT_THEMES.dev[mode];
}

export function drawDepartmentRoom(
  room: RoomLayout,
  mode: "light" | "dark",
): Container {
  const container = new Container();
  container.x = room.x;
  container.y = room.y;

  const theme = getTheme(room.department.id, mode);
  const g = new Graphics();

  // Wall
  drawWall(g, 0, 0, room.w, WALL_H, theme.wall);

  // Department sign
  drawWall(g, 0, WALL_H, room.w, SIGN_H, theme.accent);

  // Tiled floor
  drawTiledFloor(
    g,
    0,
    WALL_H + SIGN_H,
    room.w,
    room.h - WALL_H - SIGN_H,
    theme.floor1,
    theme.floor2,
  );

  container.addChild(g);

  // Department name text
  const label = new Text({
    text: room.department.name,
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: 12,
      fill: 0xffffff,
      fontWeight: "bold",
    }),
  });
  label.x = 8;
  label.y = WALL_H + 4;
  container.addChild(label);

  // Draw furniture for each agent slot
  drawFurniture(container, room.department, theme);

  return container;
}

function drawFurniture(
  container: Container,
  dept: DepartmentWithAgents,
  theme: RoomTheme,
): void {
  const g = new Graphics();
  const agentCount = Math.max(dept.agents.length, 1);

  for (let i = 0; i < agentCount; i++) {
    const pos = slotPosition(i, 0, WALL_H + SIGN_H);
    const deskX = pos.x + (SLOT_W - DESK_W) / 2;
    const deskY = pos.y + 50;

    drawDesk(g, deskX, deskY, theme.accent);
    drawChair(g, deskX + DESK_W / 2 - 8, deskY + DESK_H + 4);
  }

  container.addChild(g);
}
