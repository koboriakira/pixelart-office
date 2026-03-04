import type { Agent } from "../types";
import type { Theme } from "../hooks/useTheme";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  agents: Agent[];
  theme: Theme;
  onToggleTheme: () => void;
}

export function Header({ agents, theme, onToggleTheme }: HeaderProps) {
  const working = agents.filter((a) => a.status === "working").length;
  const idle = agents.filter((a) => a.status === "idle").length;
  const offline = agents.filter((a) => a.status === "offline").length;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 16px",
        borderBottom: "2px solid",
        borderColor: theme === "dark" ? "#333" : "#ccc",
      }}
    >
      <h1 style={{ margin: 0, fontSize: 20, fontFamily: "monospace" }}>
        Pixel Art Office
      </h1>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontSize: 14, fontFamily: "monospace" }}>
          <StatusBadge label="working" count={working} color="#22c55e" />
          <StatusBadge label="idle" count={idle} color="#eab308" />
          <StatusBadge label="offline" count={offline} color="#6b7280" />
        </span>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
    </header>
  );
}

function StatusBadge({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <span style={{ marginRight: 12 }}>
      <span
        style={{
          display: "inline-block",
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
          marginRight: 4,
        }}
      />
      {label}: {count}
    </span>
  );
}
