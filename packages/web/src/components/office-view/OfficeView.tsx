import { useRef } from "react";
import type { Agent, DepartmentWithAgents } from "../../types";
import type { Theme } from "../../hooks/useTheme";
import { useOfficePixiRuntime } from "../../hooks/useOfficePixiRuntime";

export interface OfficeViewProps {
  agents: Agent[];
  departments: DepartmentWithAgents[];
  theme: Theme;
}

export function OfficeView({ agents, departments, theme }: OfficeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { ready } = useOfficePixiRuntime(containerRef, agents, departments, theme);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "calc(100vh - 60px)",
        position: "relative",
      }}
    >
      {!ready && (
        <p style={{ padding: 16, color: "#888" }}>Loading office...</p>
      )}
    </div>
  );
}
