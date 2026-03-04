import { useEffect, useRef, useState } from "react";
import { Application, Container } from "pixi.js";
import type { Agent, DepartmentWithAgents } from "../types";
import type { Theme } from "./useTheme";
import { layoutRooms } from "../components/office-view/buildScene";
import { drawDepartmentRoom } from "../components/office-view/buildScene-departments";
import {
  buildAgentSprite,
  tickAgentSprite,
  type AgentSprite,
} from "../components/office-view/buildScene-department-agent";
import { slotPosition } from "../components/office-view/model";

const WALL_H = 12;
const SIGN_H = 24;

export function useOfficePixiRuntime(
  containerRef: React.RefObject<HTMLDivElement | null>,
  agents: Agent[],
  departments: DepartmentWithAgents[],
  theme: Theme,
) {
  const appRef = useRef<Application | null>(null);
  const sceneRef = useRef<Container | null>(null);
  const spritesRef = useRef<Map<string, AgentSprite>>(new Map());
  const [ready, setReady] = useState(false);

  // Initialize PixiJS Application
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const app = new Application();
    appRef.current = app;

    let cancelled = false;

    app
      .init({
        background: theme === "dark" ? 0x1a1a2e : 0xe8e8e8,
        resizeTo: container,
        antialias: false,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })
      .then(() => {
        if (cancelled) {
          app.destroy(true);
          return;
        }
        container.appendChild(app.canvas as HTMLCanvasElement);
        setReady(true);
      });

    return () => {
      cancelled = true;
      setReady(false);
      spritesRef.current.clear();
      sceneRef.current = null;
      if (appRef.current) {
        appRef.current.destroy(true);
        appRef.current = null;
      }
    };
  }, [containerRef, theme]);

  // Draw scene when departments/agents/theme change
  useEffect(() => {
    const app = appRef.current;
    if (!app || !ready) return;

    // Remove old scene
    if (sceneRef.current) {
      app.stage.removeChild(sceneRef.current);
      sceneRef.current.destroy({ children: true });
    }
    spritesRef.current.clear();

    const scene = new Container();
    sceneRef.current = scene;
    app.stage.addChild(scene);

    // Merge agents into departments for display
    const deptsWithAgents = mergeDepartmentsAndAgents(departments, agents);

    if (deptsWithAgents.length === 0) {
      // No departments — show a default room with all agents
      const defaultDept: DepartmentWithAgents = {
        id: "dev",
        name: "Office",
        theme_color: "#4285f4",
        sort_order: 0,
        agents: agents.map((a) => ({ id: a.id, name: a.name, status: a.status })),
      };
      deptsWithAgents.push(defaultDept);
    }

    const canvasWidth = app.screen.width || 800;
    const rooms = layoutRooms(deptsWithAgents, canvasWidth);

    for (const room of rooms) {
      const roomContainer = drawDepartmentRoom(room, theme);
      scene.addChild(roomContainer);

      // Draw agent sprites in slots
      for (let i = 0; i < room.department.agents.length; i++) {
        const deptAgent = room.department.agents[i];
        const fullAgent = agents.find((a) => a.id === deptAgent.id);
        if (!fullAgent) continue;

        const sprite = buildAgentSprite(fullAgent);
        const pos = slotPosition(i, 0, WALL_H + SIGN_H);
        sprite.container.x = pos.x + 38;
        sprite.container.y = pos.y + 8;
        roomContainer.addChild(sprite.container);
        spritesRef.current.set(fullAgent.id, sprite);
      }
    }
  }, [departments, agents, theme, ready]);

  // Animation ticker for working particles
  useEffect(() => {
    const app = appRef.current;
    if (!app || !ready) return;

    const tickFn = () => {
      for (const sprite of spritesRef.current.values()) {
        tickAgentSprite(sprite);
      }
    };

    app.ticker.add(tickFn);
    return () => {
      app.ticker.remove(tickFn);
    };
  }, [ready]);

  return { app: appRef.current, ready };
}

/** Merge agent data into department structures */
function mergeDepartmentsAndAgents(
  departments: DepartmentWithAgents[],
  agents: Agent[],
): DepartmentWithAgents[] {
  if (departments.length === 0) return [];

  return departments.map((dept) => {
    // Find agents belonging to this department
    const deptAgents = agents
      .filter((a) => a.department_id === dept.id)
      .map((a) => ({ id: a.id, name: a.name, status: a.status }));

    // Also include agents already listed in dept.agents but not in agents list
    const existingIds = new Set(deptAgents.map((a) => a.id));
    for (const a of dept.agents) {
      if (!existingIds.has(a.id)) {
        deptAgents.push(a);
      }
    }

    return { ...dept, agents: deptAgents };
  });
}
