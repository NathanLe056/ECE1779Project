export type TournamentEvent =
  | { type: 'match:updated';      payload: MatchUpdatedPayload }
  | { type: 'tournament:winner';  payload: WinnerPayload }
  | { type: 'bracket:reset';      payload: { tournament_id: number } }
  | { type: 'participant:added';  payload: ParticipantAddedPayload }
  | { type: 'tournament:created'; payload: TournamentCreatedPayload };

export interface MatchUpdatedPayload {
  tournament_id: number;
  match_id:      number;
  winner_id:     number | null;
  player1_id:    number;
  player2_id:    number;
  round_number:  number;
  match_order:   number;
  match_status:  'pending' | 'completed';
}

export interface WinnerPayload {
  tournament_id:   number;
  winner_id:       number;
  winner_username: string;
}

export interface ParticipantAddedPayload {
  tournament_id: number;
  user_id:       number;
  username:      string;
  ranking:       number;
}

export interface TournamentCreatedPayload {
  tournament_id: number;
  name:          string;
  bracket_size:  number;
}

// Internal handler types

type MessageHandler = (event: TournamentEvent) => void;
type StatusHandler  = (status: ConnectionStatus) => void;
export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

interface SocketOptions {
  // Defaults to wss://<VITE_API_URL host>/ws or ws://localhost:3000/ws
  url?: string;
  // JWT for authenticated users appended as ?token= — optional, but required for any tournament updates that require auth (e.g. match result reporting)
  token?: string;
  // 0 = retry forever
  maxRetries?: number;
}

// Client class

class TournamentSocket {
  private ws: WebSocket | null = null;
  private messageHandlers   = new Set<MessageHandler>();
  private statusHandlers    = new Set<StatusHandler>();
  private retryCount        = 0;
  private retryTimer:     ReturnType<typeof setTimeout>  | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private subscribedRooms = new Set<number>();
  private opts: Required<SocketOptions>;

  constructor(opts: SocketOptions = {}) {
    this.opts = {
      url:        opts.url        ?? this.deriveUrl(),
      token:      opts.token      ?? '',
      maxRetries: opts.maxRetries ?? 0,
    };
  }

  // Public API

  connect(): void {
    if (this.ws && this.ws.readyState <= WebSocket.OPEN) return;
    this.openSocket();
  }

  disconnect(): void {
    this.clearTimers();
    this.ws?.close(1000, 'client disconnect');
    this.ws = null;
    this.retryCount = 0;
  }

  // Subscribe to live events for a tournament.
  subscribe(tournamentId: number): void {
    this.subscribedRooms.add(tournamentId);
    this.send({ type: 'subscribe', payload: { tournamentId } });
  }

  // Unsubscribe from a tournament's events.
  unsubscribe(tournamentId: number): void {
    this.subscribedRooms.delete(tournamentId);
    this.send({ type: 'unsubscribe', payload: { tournamentId } });
  }

  // Register a handler for incoming tournament events. Returns a cleanup fn.
  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.add(handler);
    return () => this.messageHandlers.delete(handler);
  }

  // Register a handler for connection status changes. Returns a cleanup fn.
  onStatus(handler: StatusHandler): () => void {
    this.statusHandlers.add(handler);
    return () => this.statusHandlers.delete(handler);
  }

  // Private

  private openSocket(): void {
    const url = this.opts.token
      ? `${this.opts.url}?token=${encodeURIComponent(this.opts.token)}`
      : this.opts.url;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.retryCount = 0;
      this.emitStatus('connected');
      this.startHeartbeat();
      // Re-subscribe to all rooms after a reconnect
      for (const id of this.subscribedRooms) {
        this.send({ type: 'subscribe', payload: { tournamentId: id } });
      }
    };

    this.ws.onclose = (ev) => {
      this.clearTimers();
      if (ev.code !== 1000) {
        this.emitStatus('disconnected');
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onerror is always followed by onclose — reconnect is handled there
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);
        if (msg.type === 'pong' || msg.type === 'connected' ||
            msg.type === 'subscribed' || msg.type === 'unsubscribed') return;
        for (const h of this.messageHandlers) h(msg as TournamentEvent);
      } catch {
        console.warn('[WS] unparseable message', ev.data);
      }
    };
  }

  private send(data: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => this.send({ type: 'ping' }), 25_000);
  }

  private scheduleReconnect(): void {
    if (this.opts.maxRetries > 0 && this.retryCount >= this.opts.maxRetries) {
      console.warn('[WS] max retries reached');
      return;
    }
    const delay = Math.min(1000 * 2 ** this.retryCount, 30_000);
    this.retryCount++;
    this.emitStatus('reconnecting');
    this.retryTimer = setTimeout(() => this.openSocket(), delay);
  }

  private clearTimers(): void {
    if (this.retryTimer)     clearTimeout(this.retryTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.retryTimer     = null;
    this.heartbeatTimer = null;
  }

  private emitStatus(s: ConnectionStatus): void {
    for (const h of this.statusHandlers) h(s);
  }

  private deriveUrl(): string {
    const proto   = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const apiHost = import.meta.env.VITE_API_URL
      ? new URL(import.meta.env.VITE_API_URL as string).host
      : 'localhost:3000';
    return `${proto}://${apiHost}/ws`;
  }
}

// Singleton import this wherever websocket access is needed
export const tournamentSocket = new TournamentSocket();
