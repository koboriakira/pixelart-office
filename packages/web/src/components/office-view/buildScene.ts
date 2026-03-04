import type { DepartmentWithAgents } from "../../types";
import { roomSize, ROOM_PAD } from "./model";

export interface RoomLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  department: DepartmentWithAgents;
}

export function layoutRooms(
  departments: DepartmentWithAgents[],
  canvasWidth: number,
): RoomLayout[] {
  const rooms: RoomLayout[] = [];
  let cursorX = ROOM_PAD;
  let cursorY = ROOM_PAD;
  let rowMaxH = 0;

  for (const dept of departments) {
    const size = roomSize(dept.agents.length);

    // Wrap to next row if this room doesn't fit
    if (cursorX + size.w + ROOM_PAD > canvasWidth && cursorX > ROOM_PAD) {
      cursorX = ROOM_PAD;
      cursorY += rowMaxH + ROOM_PAD;
      rowMaxH = 0;
    }

    rooms.push({
      x: cursorX,
      y: cursorY,
      w: size.w,
      h: size.h,
      department: dept,
    });

    cursorX += size.w + ROOM_PAD;
    rowMaxH = Math.max(rowMaxH, size.h);
  }

  return rooms;
}
