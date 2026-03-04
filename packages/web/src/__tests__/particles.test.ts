import { describe, it, expect } from "vitest";
import { ParticleSystem } from "../components/office-view/particles";

describe("ParticleSystem", () => {
  it("starts with no particles", () => {
    const ps = new ParticleSystem();
    expect(ps.particles).toHaveLength(0);
  });

  it("adds a particle with emit()", () => {
    const ps = new ParticleSystem();
    ps.emit({ x: 10, y: 20, vx: 0, vy: -1, color: 0xffffff, life: 35, maxLife: 35 });
    expect(ps.particles).toHaveLength(1);
    expect(ps.particles[0].x).toBe(10);
  });

  it("updates particle position on tick", () => {
    const ps = new ParticleSystem();
    ps.emit({ x: 0, y: 0, vx: 1, vy: -2, color: 0xffffff, life: 35, maxLife: 35 });
    ps.tick();
    expect(ps.particles[0].x).toBe(1);
    expect(ps.particles[0].y).toBe(-2);
    expect(ps.particles[0].life).toBe(34);
  });

  it("removes particles when life reaches 0", () => {
    const ps = new ParticleSystem();
    ps.emit({ x: 0, y: 0, vx: 0, vy: 0, color: 0xffffff, life: 1, maxLife: 1 });
    ps.tick();
    expect(ps.particles).toHaveLength(0);
  });

  it("handles multiple particles independently", () => {
    const ps = new ParticleSystem();
    ps.emit({ x: 0, y: 0, vx: 0, vy: 0, color: 0xff0000, life: 2, maxLife: 2 });
    ps.emit({ x: 10, y: 10, vx: 0, vy: 0, color: 0x00ff00, life: 5, maxLife: 5 });
    ps.tick();
    expect(ps.particles).toHaveLength(2);
    ps.tick();
    expect(ps.particles).toHaveLength(1);
    expect(ps.particles[0].color).toBe(0x00ff00);
  });

  it("clear() removes all particles", () => {
    const ps = new ParticleSystem();
    ps.emit({ x: 0, y: 0, vx: 0, vy: 0, color: 0xff0000, life: 10, maxLife: 10 });
    ps.emit({ x: 0, y: 0, vx: 0, vy: 0, color: 0x00ff00, life: 10, maxLife: 10 });
    ps.clear();
    expect(ps.particles).toHaveLength(0);
  });
});
