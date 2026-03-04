import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { WebSocket } from "ws";
import { createHub, type Hub } from "./hub.js";
import type { WsMessage } from "shared";
import http from "node:http";

function waitForOpen(ws: WebSocket): Promise<void> {
  return new Promise((resolve) => {
    if (ws.readyState === WebSocket.OPEN) return resolve();
    ws.on("open", resolve);
  });
}

function waitForMessage(ws: WebSocket): Promise<WsMessage> {
  return new Promise((resolve) => {
    ws.on("message", (data) => {
      resolve(JSON.parse(data.toString()));
    });
  });
}

describe("WebSocket Hub", () => {
  let server: http.Server;
  let hub: Hub;
  let port: number;

  beforeEach(async () => {
    server = http.createServer();
    hub = createHub(server);
    await new Promise<void>((resolve) => {
      server.listen(0, resolve);
    });
    const addr = server.address();
    port = typeof addr === "object" && addr ? addr.port : 0;
  });

  afterEach(async () => {
    hub.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it("should accept a connection and track it", async () => {
    const client = new WebSocket(`ws://localhost:${port}/ws`);
    await waitForOpen(client);

    expect(hub.clientCount()).toBe(1);

    client.close();
    await new Promise((r) => setTimeout(r, 50));
    expect(hub.clientCount()).toBe(0);
  });

  it("should broadcast a message to all connected clients", async () => {
    const client1 = new WebSocket(`ws://localhost:${port}/ws`);
    const client2 = new WebSocket(`ws://localhost:${port}/ws`);
    await Promise.all([waitForOpen(client1), waitForOpen(client2)]);

    const msg: WsMessage = {
      type: "agent_status",
      payload: { id: "agent-1", status: "working" },
      ts: Date.now(),
    };

    const p1 = waitForMessage(client1);
    const p2 = waitForMessage(client2);

    hub.broadcast(msg);

    const [received1, received2] = await Promise.all([p1, p2]);
    expect(received1).toEqual(msg);
    expect(received2).toEqual(msg);

    client1.close();
    client2.close();
  });

  it("should remove client on disconnect", async () => {
    const client = new WebSocket(`ws://localhost:${port}/ws`);
    await waitForOpen(client);
    expect(hub.clientCount()).toBe(1);

    client.close();
    await new Promise((r) => setTimeout(r, 50));
    expect(hub.clientCount()).toBe(0);
  });

  it("should not accept connections on non /ws paths", async () => {
    const client = new WebSocket(`ws://localhost:${port}/other`);
    await new Promise<void>((resolve) => {
      client.on("error", () => resolve());
      client.on("close", () => resolve());
    });
    expect(hub.clientCount()).toBe(0);
  });
});
