import type { Server } from "node:http";

import { WebSocketServer, WebSocket } from "ws";

type TournamentMatchesUpdatedPayload = {
  type: "tournament.matches.updated";
  tournamentId: number;
  matches: unknown[];
};

type BroadcastPayload = TournamentMatchesUpdatedPayload;

let webSocketServer: WebSocketServer | null = null;

export function attachWebSocketServer(server: Server) {
  if (webSocketServer) {
    return webSocketServer;
  }

  webSocketServer = new WebSocketServer({ server, path: "/ws" });

  webSocketServer.on("connection", (socket) => {
    console.log("WebSocket client connected");

    socket.on("close", () => {
      console.log("WebSocket client disconnected");
    });
  });

  return webSocketServer;
}

function broadcast(payload: BroadcastPayload) {
  if (!webSocketServer) {
    return;
  }

  const message = JSON.stringify(payload);

  webSocketServer.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

export function broadcastTournamentMatchesUpdated(
  tournamentId: number,
  matches: unknown[]
) {
  broadcast({
    type: "tournament.matches.updated",
    tournamentId,
    matches,
  });
}