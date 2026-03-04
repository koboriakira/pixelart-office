import { WebSocketServer, WebSocket } from "ws";
import type { WsMessage } from "shared";
import type http from "node:http";

export interface Hub {
  broadcast(message: WsMessage): void;
  clientCount(): number;
  close(): void;
}

export function createHub(server: http.Server): Hub {
  const wss = new WebSocketServer({ noServer: true });
  const clients = new Set<WebSocket>();

  server.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url ?? "/", `http://${request.headers.host}`);

    if (pathname !== "/ws") {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("error", () => {
      clients.delete(ws);
    });
  });

  function broadcast(message: WsMessage): void {
    const data = JSON.stringify(message);
    for (const client of clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  function clientCount(): number {
    return clients.size;
  }

  function close(): void {
    for (const client of clients) {
      client.close();
    }
    clients.clear();
    wss.close();
  }

  return { broadcast, clientCount, close };
}
