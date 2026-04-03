import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";

let wss: WebSocketServer | null = null;

/**
 * Attach a WebSocket server to an existing HTTP server.
 * All connections are accepted; messages from clients are ignored
 * (this is a server-push-only channel).
 */
export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws: WebSocket, req: IncomingMessage) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    console.log(`[WS] Client connected from ${ip}`);

    // Keep the connection alive with pings every 30 s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 30_000);

    ws.on("pong", () => {
      // client is still alive — nothing extra needed
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      console.log(`[WS] Client disconnected (${ip})`);
    });

    ws.on("error", (err: Error) => {
      clearInterval(pingInterval);
      console.error(`[WS] Client error (${ip}):`, err.message);
    });
  });

  wss.on("error", (err: Error) => {
    console.error("[WS] Server error:", err.message);
  });

  console.log("[WS] WebSocket server ready on path /ws");
}

/**
 * Broadcast a TOURNAMENT_UPDATED event to every connected client.
 * Safe to call before the server is initialized (no-op in that case).
 */
export function broadcastTournamentUpdate(tournament: object): void {
  if (!wss) return;

  const message = JSON.stringify({
    type: "TOURNAMENT_UPDATED",
    payload: tournament,
  });

  let sent = 0;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });

  console.log(`[WS] Broadcasted TOURNAMENT_UPDATED to ${sent} client(s)`);
}
