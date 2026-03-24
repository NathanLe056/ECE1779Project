import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { URL } from 'url';
import jwt from 'jsonwebtoken';
import { wsManager } from './wsManager';
import { redisAdapter } from './redisAdapter';

export interface AuthenticatedClient extends WebSocket {
  userId?: string;
  tournamentIds: Set<string>;
  isAlive: boolean;
}

/**
 * Attaches a WebSocket server to an existing HTTP server.
 * Call this after your Express app is created but before app.listen().
 *
 * Usage in src/index.ts:
 *   import { createWsServer } from './websocket/wsServer';
 *   const httpServer = app.listen(PORT, ...);
 *   createWsServer(httpServer);
 */
export function createWsServer(httpServer: Server): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  // Connection handler
  wss.on('connection', (rawWs: WebSocket, req: IncomingMessage) => {
    const ws = rawWs as AuthenticatedClient;
    ws.tournamentIds = new Set();
    ws.isAlive = true;

    // Optional JWT auth via ?token= query param
    try {
      const url = new URL(req.url ?? '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');
      if (token) {
        const secret = process.env.JWT_SECRET ?? 'changeme';
        const payload = jwt.verify(token, secret) as { userId: string };
        ws.userId = payload.userId;
      }
    } catch {
      // Unauthenticated viewer — still allowed for read-only bracket watching
    }
    // Message router
    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString());
        handleMessage(ws, msg);
      } catch {
        sendError(ws, 'INVALID_JSON', 'Message must be valid JSON');
      }
    });

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('close', () => {
      wsManager.removeClient(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] client error', err.message);
      wsManager.removeClient(ws);
    });

    sendToClient(ws, { type: 'connected', payload: { userId: ws.userId ?? null } });
  });

  // Heartbeat drop dead connections every 30 seconds
  const heartbeat = setInterval(() => {
    wss.clients.forEach((rawWs) => {
      const ws = rawWs as AuthenticatedClient;
      if (!ws.isAlive) { ws.terminate(); return; }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30_000);

  wss.on('close', () => clearInterval(heartbeat));

  // Redis inbound broadcast to local clients
  redisAdapter.onMessage((channel, event) => {
    const tournamentId = channel.replace('tournament:', '');
    wsManager.broadcastToTournament(tournamentId, event, /* skipRedis */ true);
  });

  console.log('[WS] WebSocket server attached at /ws');
  return wss;
}

// Message handlers
type WsMessage = { type: string; payload?: Record<string, unknown> };

function handleMessage(ws: AuthenticatedClient, msg: WsMessage): void {
  switch (msg.type) {
    case 'subscribe':
      handleSubscribe(ws, msg.payload);
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, msg.payload);
      break;
    case 'ping':
      sendToClient(ws, { type: 'pong' });
      break;
    default:
      sendError(ws, 'UNKNOWN_TYPE', `Unknown message type: ${msg.type}`);
  }
}

function handleSubscribe(ws: AuthenticatedClient, payload?: Record<string, unknown>): void {
  const tournamentId = payload?.tournamentId as string | undefined;
  if (!tournamentId) {
    sendError(ws, 'MISSING_FIELD', 'payload.tournamentId is required');
    return;
  }
  wsManager.addClientToTournament(ws, tournamentId);
  sendToClient(ws, { type: 'subscribed', payload: { tournamentId } });
}

function handleUnsubscribe(ws: AuthenticatedClient, payload?: Record<string, unknown>): void {
  const tournamentId = payload?.tournamentId as string | undefined;
  if (!tournamentId) {
    sendError(ws, 'MISSING_FIELD', 'payload.tournamentId is required');
    return;
  }
  wsManager.removeClientFromTournament(ws, tournamentId);
  sendToClient(ws, { type: 'unsubscribed', payload: { tournamentId } });
}

// Helper function

export function sendToClient(ws: WebSocket, data: unknown): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

function sendError(ws: WebSocket, code: string, message: string): void {
  sendToClient(ws, { type: 'error', payload: { code, message } });
}
