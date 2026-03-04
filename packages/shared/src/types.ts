// === Enums / Constants ===

export const PROVIDERS = ["claude", "copilot", "other"] as const;
export type Provider = (typeof PROVIDERS)[number];

export const STATUSES = ["idle", "working", "offline"] as const;
export type Status = (typeof STATUSES)[number];

export const EVENT_TYPES = [
  "tool_use_start",
  "tool_use_end",
  "session_start",
  "session_stop",
  "heartbeat",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

// === API Types ===

export interface EventPayload {
  agent_id: string;
  event: EventType;
  tool?: string;
  task?: string;
  metadata?: Record<string, unknown>;
}

export interface Agent {
  id: string;
  name: string;
  provider: Provider;
  status: Status;
  current_task: string | null;
  department_id: string | null;
  sprite_number: number;
  updated_at: number;
}

export interface Department {
  id: string;
  name: string;
  theme_color: string;
  sort_order: number;
}

export interface DepartmentWithAgents extends Department {
  agents: Array<{ id: string; name: string; status: Status }>;
}

export interface AgentsResponse {
  agents: Agent[];
}

export interface DepartmentsResponse {
  departments: DepartmentWithAgents[];
}

// === WebSocket ===

export interface WsMessage {
  type: "agent_status" | "agent_event";
  payload: unknown;
  ts: number;
}
