import { useWebSocket } from "./hooks/useWebSocket";
import { useAgents } from "./hooks/useAgents";

export default function App() {
  const { agents, handleWsMessage } = useAgents();
  const wsStatus = useWebSocket(handleWsMessage);

  return (
    <div>
      <h1>Pixel Art Office</h1>
      <p>WebSocket: {wsStatus}</p>
      <p>Agents: {agents.length}</p>
    </div>
  );
}
