import { Container, Graphics, Text, TextStyle } from "pixi.js";
import type { Agent, Provider } from "../../types";
import { PROVIDER_COLORS } from "./themes";
import { TARGET_CHAR_H } from "./model";
import { ParticleSystem } from "./particles";

// --- Constants ---

export const WORKING_PARTICLE_COLORS = [
  0x55aaff, 0x55ff88, 0xffaa33, 0xff5577, 0xaa77ff,
];
export const PARTICLE_SPAWN_INTERVAL = 10;
export const PARTICLE_LIFETIME = 35;

// --- Helpers ---

export function providerAccentColor(provider: Provider): number {
  return PROVIDER_COLORS[provider];
}

export function truncateTask(task: string | null): string {
  if (!task) return "";
  if (task.length <= 16) return task;
  return task.slice(0, 16) + "...";
}

// --- Character drawing ---

const CHAR_W = 24;
const CHAR_HEAD_R = 8;
const CHAR_BODY_W = 16;
const CHAR_BODY_H = 20;

function drawPixelCharacter(g: Graphics, x: number, y: number): void {
  // Head (circle)
  g.circle(x + CHAR_W / 2, y + CHAR_HEAD_R, CHAR_HEAD_R).fill(0xffcc99);
  // Body (rectangle)
  const bodyX = x + (CHAR_W - CHAR_BODY_W) / 2;
  const bodyY = y + CHAR_HEAD_R * 2 + 2;
  g.rect(bodyX, bodyY, CHAR_BODY_W, CHAR_BODY_H).fill(0x4488cc);
  // Legs
  g.rect(bodyX + 2, bodyY + CHAR_BODY_H, 5, 10).fill(0x335577);
  g.rect(bodyX + CHAR_BODY_W - 7, bodyY + CHAR_BODY_H, 5, 10).fill(0x335577);
}

// --- Name tag ---

function createNameTag(
  name: string,
  provider: Provider,
): Container {
  const container = new Container();
  const accent = providerAccentColor(provider);

  const style = new TextStyle({
    fontFamily: "monospace",
    fontSize: 9,
    fill: 0xffffff,
  });
  const text = new Text({ text: name, style });
  const padX = 4;
  const padY = 2;

  const bg = new Graphics();
  bg.roundRect(0, 0, text.width + padX * 2, text.height + padY * 2, 2).fill(0x222222);
  bg.roundRect(0, 0, text.width + padX * 2, text.height + padY * 2, 2).stroke({
    width: 1,
    color: accent,
  });

  text.x = padX;
  text.y = padY;

  container.addChild(bg, text);
  return container;
}

// --- Task bubble ---

function createTaskBubble(
  task: string,
  provider: Provider,
): Container {
  const container = new Container();
  const accent = providerAccentColor(provider);
  const displayText = truncateTask(task);

  const style = new TextStyle({
    fontFamily: "monospace",
    fontSize: 8,
    fill: 0x333333,
  });
  const text = new Text({ text: displayText, style });
  const padX = 4;
  const padY = 2;

  const bg = new Graphics();
  bg.roundRect(0, 0, text.width + padX * 2, text.height + padY * 2, 3).fill(0xffffff);
  bg.roundRect(0, 0, text.width + padX * 2, text.height + padY * 2, 3).stroke({
    width: 1,
    color: accent,
  });

  text.x = padX;
  text.y = padY;

  container.addChild(bg, text);
  return container;
}

// --- Offline zzz ---

function createSleepText(): Text {
  const style = new TextStyle({
    fontFamily: "monospace",
    fontSize: 12,
    fill: 0x8888aa,
  });
  return new Text({ text: "zzz", style });
}

// --- Star particle shape ---

function drawStarParticle(
  g: Graphics,
  x: number,
  y: number,
  color: number,
  alpha: number,
): void {
  const size = 3;
  g.star(x, y, 4, size, size * 0.4).fill({ color, alpha });
}

// --- Main build function ---

export interface AgentSprite {
  container: Container;
  particleSystem: ParticleSystem;
  particleGraphics: Graphics;
  tickCounter: number;
  agent: Agent;
}

export function buildAgentSprite(agent: Agent): AgentSprite {
  const container = new Container();
  const particleSystem = new ParticleSystem();
  const particleGraphics = new Graphics();

  // Character body
  const charGraphics = new Graphics();
  drawPixelCharacter(charGraphics, 0, 0);
  container.addChild(charGraphics);

  // Apply status effects
  if (agent.status === "offline") {
    container.alpha = 0.3;
    charGraphics.tint = 0x888899;
    const zzz = createSleepText();
    zzz.x = CHAR_W + 2;
    zzz.y = -4;
    container.addChild(zzz);
  }

  // Name tag below character
  const nameTag = createNameTag(agent.name, agent.provider);
  nameTag.x = (CHAR_W - nameTag.width) / 2;
  nameTag.y = TARGET_CHAR_H + 4;
  container.addChild(nameTag);

  // Task bubble above character (only when working)
  if (agent.status === "working" && agent.current_task) {
    const bubble = createTaskBubble(agent.current_task, agent.provider);
    bubble.x = (CHAR_W - bubble.width) / 2;
    bubble.y = -bubble.height - 4;
    container.addChild(bubble);
  }

  // Particle layer for working status
  container.addChild(particleGraphics);

  return {
    container,
    particleSystem,
    particleGraphics,
    tickCounter: 0,
    agent,
  };
}

export function tickAgentSprite(sprite: AgentSprite): void {
  if (sprite.agent.status !== "working") return;

  sprite.tickCounter += 1;

  // Spawn particle every PARTICLE_SPAWN_INTERVAL ticks
  if (sprite.tickCounter % PARTICLE_SPAWN_INTERVAL === 0) {
    const color =
      WORKING_PARTICLE_COLORS[
        Math.floor(Math.random() * WORKING_PARTICLE_COLORS.length)
      ];
    sprite.particleSystem.emit({
      x: CHAR_W / 2 + (Math.random() - 0.5) * 16,
      y: 0,
      vx: (Math.random() - 0.5) * 0.5,
      vy: -0.5 - Math.random() * 0.5,
      color,
      life: PARTICLE_LIFETIME,
      maxLife: PARTICLE_LIFETIME,
    });
  }

  // Update particles
  sprite.particleSystem.tick();

  // Redraw particles
  sprite.particleGraphics.clear();
  for (const p of sprite.particleSystem.particles) {
    const alpha = p.life / p.maxLife;
    drawStarParticle(sprite.particleGraphics, p.x, p.y, p.color, alpha);
  }
}
