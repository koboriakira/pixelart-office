import { useWebSocket } from "./hooks/useWebSocket";
import { useAgents } from "./hooks/useAgents";
import { useDepartments } from "./hooks/useDepartments";
import { useTheme } from "./hooks/useTheme";
import { Header } from "./components/Header";
import { OfficeView } from "./components/office-view/OfficeView";

const themeStyles = {
  light: { background: "#f5f5f5", color: "#333" },
  dark: { background: "#1a1a2e", color: "#e0e0e0" },
} as const;

export default function App() {
  const { agents, handleWsMessage } = useAgents();
  const { departments } = useDepartments();
  const wsStatus = useWebSocket(handleWsMessage);
  const { theme, toggleTheme } = useTheme();
  const style = themeStyles[theme];

  return (
    <div
      style={{
        ...style,
        minHeight: "100vh",
        fontFamily: "monospace",
      }}
    >
      <Header agents={agents} theme={theme} onToggleTheme={toggleTheme} />
      {wsStatus === "disconnected" && (
        <div
          style={{
            background: "#ff4444",
            color: "white",
            padding: "4px 16px",
            fontSize: 12,
            textAlign: "center",
          }}
        >
          WebSocket disconnected — reconnecting...
        </div>
      )}
      <OfficeView agents={agents} departments={departments} theme={theme} />
    </div>
  );
}
