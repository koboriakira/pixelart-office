import { describe, it, expect } from "vitest";
import {
  TILE,
  SLOT_W,
  SLOT_H,
  COLS_PER_ROW,
  ROOM_PAD,
  TARGET_CHAR_H,
  DESK_W,
  DESK_H,
  slotPosition,
  roomSize,
} from "../components/office-view/model";

describe("office-view model constants", () => {
  it("has correct tile size", () => {
    expect(TILE).toBe(20);
  });

  it("has correct slot dimensions", () => {
    expect(SLOT_W).toBe(100);
    expect(SLOT_H).toBe(120);
  });

  it("has correct layout constants", () => {
    expect(COLS_PER_ROW).toBe(3);
    expect(ROOM_PAD).toBe(16);
    expect(TARGET_CHAR_H).toBe(52);
    expect(DESK_W).toBe(48);
    expect(DESK_H).toBe(26);
  });
});

describe("slotPosition", () => {
  it("calculates first slot at room origin + padding", () => {
    const pos = slotPosition(0, 0, 0);
    expect(pos.x).toBe(ROOM_PAD);
    expect(pos.y).toBe(ROOM_PAD);
  });

  it("calculates second slot in same row", () => {
    const pos = slotPosition(1, 0, 0);
    expect(pos.x).toBe(ROOM_PAD + SLOT_W);
    expect(pos.y).toBe(ROOM_PAD);
  });

  it("wraps to next row after COLS_PER_ROW", () => {
    const pos = slotPosition(COLS_PER_ROW, 0, 0);
    expect(pos.x).toBe(ROOM_PAD);
    expect(pos.y).toBe(ROOM_PAD + SLOT_H);
  });

  it("offsets by room position", () => {
    const pos = slotPosition(0, 100, 200);
    expect(pos.x).toBe(100 + ROOM_PAD);
    expect(pos.y).toBe(200 + ROOM_PAD);
  });
});

describe("roomSize", () => {
  it("calculates room size for 1 agent (width is always COLS_PER_ROW)", () => {
    const size = roomSize(1);
    expect(size.w).toBe(COLS_PER_ROW * SLOT_W + 2 * ROOM_PAD);
    expect(size.h).toBe(1 * SLOT_H + 2 * ROOM_PAD);
  });

  it("calculates room size for COLS_PER_ROW agents (single row)", () => {
    const size = roomSize(COLS_PER_ROW);
    expect(size.w).toBe(COLS_PER_ROW * SLOT_W + 2 * ROOM_PAD);
    expect(size.h).toBe(1 * SLOT_H + 2 * ROOM_PAD);
  });

  it("calculates room size for COLS_PER_ROW+1 agents (two rows)", () => {
    const size = roomSize(COLS_PER_ROW + 1);
    expect(size.w).toBe(COLS_PER_ROW * SLOT_W + 2 * ROOM_PAD);
    expect(size.h).toBe(2 * SLOT_H + 2 * ROOM_PAD);
  });

  it("handles 0 agents with minimum size", () => {
    const size = roomSize(0);
    expect(size.w).toBe(COLS_PER_ROW * SLOT_W + 2 * ROOM_PAD);
    expect(size.h).toBe(1 * SLOT_H + 2 * ROOM_PAD);
  });
});
