import { useWebSocket } from "./hooks/useWebSocket";
import { useAgents } from "./hooks/useAgents";
import { useTheme } from "./hooks/useTheme";
import { Header } from "./components/Header";

const themeStyles = {
  light: { background: "#f5f5f5", color: "#333" },
  dark: { background: "#1a1a2e", color: "#e0e0e0" },
} as const;

export default function App() {
  const { agents, handleWsMessage } = useAgents();
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
      <main style={{ padding: 16 }}>
        <p>WebSocket: {wsStatus}</p>
        <p>Agents: {agents.length}</p>
      </main>
    </div>
  );
}
