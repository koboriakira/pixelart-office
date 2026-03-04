import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import http from "node:http";
import { initDb } from "./db.js";
import { agentsRoute } from "./routes/agents.js";
import { departmentsRoute } from "./routes/departments.js";
import { createHub } from "./ws/hub.js";

initDb();

const app = new Hono();

app.use("*", cors());

app.get("/", (c) => c.json({ status: "ok" }));
app.route("/api/agents", agentsRoute);
app.route("/api/departments", departmentsRoute);

const port = 3100;
console.log(`Server running on http://localhost:${port}`);
const server = serve({ fetch: app.fetch, port }) as unknown as http.Server;

const hub = createHub(server);
export { hub };

export default app;
