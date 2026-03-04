import Database from "better-sqlite3";
import type { Agent, DepartmentWithAgents, EventPayload } from "shared";

let db: Database.Database;

export function initDb(path: string = "pixelart-office.db"): void {
  db = new Database(path);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.exec(`
    CREATE TABLE IF NOT EXISTS departments (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      theme_color TEXT NOT NULL DEFAULT '#888888',
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL DEFAULT 'other',
      status TEXT NOT NULL DEFAULT 'offline',
      current_task TEXT,
      department_id TEXT REFERENCES departments(id),
      sprite_number INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT (unixepoch())
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      event TEXT NOT NULL,
      tool TEXT,
      task TEXT,
      metadata TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    );
  `);

  seedDepartments();
}

function seedDepartments(): void {
  const defaults = [
    { id: "dev", name: "dev", theme_color: "#4A90D9", sort_order: 0 },
    { id: "design", name: "design", theme_color: "#E91E63", sort_order: 1 },
    { id: "planning", name: "planning", theme_color: "#FF9800", sort_order: 2 },
    { id: "operations", name: "operations", theme_color: "#4CAF50", sort_order: 3 },
    { id: "qa", name: "qa", theme_color: "#9C27B0", sort_order: 4 },
  ];

  const stmt = db.prepare(
    "INSERT OR IGNORE INTO departments (id, name, theme_color, sort_order) VALUES (?, ?, ?, ?)"
  );

  for (const dept of defaults) {
    stmt.run(dept.id, dept.name, dept.theme_color, dept.sort_order);
  }
}

interface UpsertAgentParams {
  id: string;
  name: string;
  provider: string;
  status: string;
  current_task: string | null;
  department_id: string | null;
  sprite_number: number;
}

export function upsertAgent(params: UpsertAgentParams): void {
  db.prepare(
    `INSERT INTO agents (id, name, provider, status, current_task, department_id, sprite_number, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, unixepoch())
     ON CONFLICT(id) DO UPDATE SET
       name = excluded.name,
       provider = excluded.provider,
       status = excluded.status,
       current_task = excluded.current_task,
       department_id = excluded.department_id,
       sprite_number = excluded.sprite_number,
       updated_at = unixepoch()`
  ).run(
    params.id,
    params.name,
    params.provider,
    params.status,
    params.current_task,
    params.department_id,
    params.sprite_number
  );
}

export function getAgents(): Agent[] {
  return db.prepare("SELECT * FROM agents").all() as Agent[];
}

export function getDepartmentsWithAgents(): DepartmentWithAgents[] {
  const departments = db
    .prepare("SELECT * FROM departments ORDER BY sort_order")
    .all() as DepartmentWithAgents[];

  const agents = db
    .prepare("SELECT id, name, status, department_id FROM agents")
    .all() as Array<{ id: string; name: string; status: string; department_id: string | null }>;

  for (const dept of departments) {
    dept.agents = agents
      .filter((a) => a.department_id === dept.id)
      .map(({ id, name, status }) => ({ id, name, status: status as Agent["status"] }));
  }

  return departments;
}

export function insertActivityLog(payload: Pick<EventPayload, "agent_id" | "event" | "tool" | "task" | "metadata">): void {
  db.prepare(
    `INSERT INTO activity_log (agent_id, event, tool, task, metadata)
     VALUES (?, ?, ?, ?, ?)`
  ).run(
    payload.agent_id,
    payload.event,
    payload.tool ?? null,
    payload.task ?? null,
    payload.metadata ? JSON.stringify(payload.metadata) : null
  );
}

export function getDb(): Database.Database {
  return db;
}
