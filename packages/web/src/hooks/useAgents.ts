import { useEffect, useState, useCallback } from "react";
import type { Agent, WsMessage } from "../types";

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    fetch("/api/agents")
      .then((res) => res.json())
      .then((data: { agents: Agent[] }) => {
        setAgents(data.agents);
      })
      .catch(() => {
        // fetch failed; agents stays empty
      });
  }, []);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type !== "agent_status") return;

    const update = msg.payload as Partial<Agent> & { id: string };
    setAgents((prev) => {
      const exists = prev.some((a) => a.id === update.id);
      if (exists) {
        return prev.map((agent) =>
          agent.id === update.id ? { ...agent, ...update } : agent,
        );
      }
      // New agent — add with defaults
      const newAgent: Agent = {
        name: update.id,
        provider: "other",
        status: "idle",
        current_task: null,
        department_id: null,
        sprite_number: 0,
        updated_at: Date.now(),
        ...update,
      };
      return [...prev, newAgent];
    });
  }, []);

  return { agents, handleWsMessage };
}
