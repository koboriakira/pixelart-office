// Layout constants
export const TILE = 20;
export const SLOT_W = 100;
export const SLOT_H = 120;
export const COLS_PER_ROW = 3;
export const ROOM_PAD = 16;
export const TARGET_CHAR_H = 52;
export const DESK_W = 48;
export const DESK_H = 26;

export function slotPosition(
  index: number,
  roomX: number,
  roomY: number,
): { x: number; y: number } {
  const col = index % COLS_PER_ROW;
  const row = Math.floor(index / COLS_PER_ROW);
  return {
    x: roomX + ROOM_PAD + col * SLOT_W,
    y: roomY + ROOM_PAD + row * SLOT_H,
  };
}

export function roomSize(agentCount: number): { w: number; h: number } {
  const cols = COLS_PER_ROW;
  const rows = Math.max(1, Math.ceil(agentCount / COLS_PER_ROW));
  return {
    w: cols * SLOT_W + 2 * ROOM_PAD,
    h: rows * SLOT_H + 2 * ROOM_PAD,
  };
}
