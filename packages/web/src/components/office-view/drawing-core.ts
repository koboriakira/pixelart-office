import { Graphics } from "pixi.js";
import { TILE, DESK_W, DESK_H } from "./model";

export function drawTiledFloor(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color1: number,
  color2: number,
): void {
  for (let ty = 0; ty < h; ty += TILE) {
    for (let tx = 0; tx < w; tx += TILE) {
      const isEven = ((tx / TILE + ty / TILE) % 2) === 0;
      g.rect(x + tx, y + ty, TILE, TILE).fill(isEven ? color1 : color2);
    }
  }
}

export function drawWall(
  g: Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  color: number,
): void {
  g.rect(x, y, w, h).fill(color);
}

export function drawDesk(
  g: Graphics,
  x: number,
  y: number,
  color: number = 0x8b6914,
): void {
  g.rect(x, y, DESK_W, DESK_H).fill(color);
  // Desk border
  g.rect(x, y, DESK_W, DESK_H).stroke({ width: 1, color: 0x5c4a0a });
}

export function drawChair(
  g: Graphics,
  x: number,
  y: number,
  color: number = 0x444444,
): void {
  const size = 16;
  g.rect(x, y, size, size).fill(color);
  g.rect(x, y, size, size).stroke({ width: 1, color: 0x333333 });
}

export function drawPlant(
  g: Graphics,
  x: number,
  y: number,
): void {
  // Pot
  g.rect(x, y + 10, 12, 8).fill(0x8b4513);
  // Leaves
  g.circle(x + 6, y + 6, 8).fill(0x228b22);
}
