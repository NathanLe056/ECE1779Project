import { WebSocketServer, WebSocket } from "ws";
import { IncomingMessage, Server } from "http";
import {
  wsConnectionsActive,
  wsConnectionsTotal,
  wsBroadcastsTotal,
  wsMessagesSentTotal,
} from "./metrics.js";

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

    wsConnectionsTotal.inc();
    wsConnectionsActive.inc();

    // Keep the connection alive with pings every 15 s
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    }, 15_000);

    ws.on("pong", () => {
      // client is still alive
    });

    ws.on("close", () => {
      clearInterval(pingInterval);
      wsConnectionsActive.dec();
      console.log(`[WS] Client disconnected (${ip})`);
    });

    ws.on("error", (err: Error) => {
      clearInterval(pingInterval);
      wsConnectionsActive.dec();
      console.error(`[WS] Client error (${ip}):`, err.message);
    });
  });

  wss.on("error", (err: Error) => {
    console.error("[WS] Server error:", err.message);
  });

  console.log("[WS] WebSocket server ready on path /ws");
}

/**
 * Internal helper — broadcast any typed message to all connected clients.
 */
function broadcast(type: string, payload: unknown): void {
  if (!wss) return;

  const message = JSON.stringify({ type, payload });

  let sent = 0;
  wss.clients.forEach((client: WebSocket) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
      sent++;
    }
  });

  wsBroadcastsTotal.inc();
  wsMessagesSentTotal.inc(sent);

  console.log(`[WS] Broadcasted ${type} to ${sent} client(s)`);
}

/** A tournament's scalar fields were updated (name, status, etc.). */
export function broadcastTournamentUpdate(tournament: object): void {
  broadcast("TOURNAMENT_UPDATED", tournament);
}

/** A tournament was deleted — clients viewing it should redirect away. */
export function broadcastTournamentDeleted(tournamentId: number): void {
  broadcast("TOURNAMENT_DELETED", { id: tournamentId });
}

/** A new member joined a tournament. */
export function broadcastMemberJoined(tournamentId: number, member: object): void {
  broadcast("TOURNAMENT_MEMBER_JOINED", { tournamentId, member });
}

/** A member's role or ranking was updated. */
export function broadcastMemberUpdated(tournamentId: number, member: object): void {
  broadcast("TOURNAMENT_MEMBER_UPDATED", { tournamentId, member });
}

/** A member was removed from a tournament. */
export function broadcastMemberRemoved(tournamentId: number, memberId: number): void {
  broadcast("TOURNAMENT_MEMBER_REMOVED", { tournamentId, memberId });
}

/** Match result / status updated — sends the full refreshed matches array. */
export function broadcastMatchUpdated(tournamentId: number, matches: object[]): void {
  broadcast("MATCH_UPDATED", { tournamentId, matches });
}

/** A single match row was deleted — sends the remaining matches array. */
export function broadcastMatchDeleted(tournamentId: number, matches: object[]): void {
  broadcast("MATCH_DELETED", { tournamentId, matches });
}

/** Bracket was generated for a tournament. */
export function broadcastBracketGenerated(tournamentId: number, matches: object[]): void {
  broadcast("BRACKET_GENERATED", { tournamentId, matches });
}
