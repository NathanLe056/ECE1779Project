import { WebSocket } from 'ws';
import { AuthenticatedClient } from './wsServer';
import { redisAdapter } from './redisAdapter';

class WsManager {

  private rooms = new Map<string, Set<AuthenticatedClient>>();

  addClientToTournament(ws: AuthenticatedClient, tournamentId: string): void {
    if (!this.rooms.has(tournamentId)) {
      this.rooms.set(tournamentId, new Set());
    }
    this.rooms.get(tournamentId)!.add(ws);
    ws.tournamentIds.add(tournamentId);

    console.log(
      `[WS] client${ws.userId ? ` (${ws.userId})` : ''} subscribed to tournament ${tournamentId}` +
      ` — room size: ${this.rooms.get(tournamentId)!.size}`,
    );
  }

  removeClientFromTournament(ws: AuthenticatedClient, tournamentId: string): void {
    const room = this.rooms.get(tournamentId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) this.rooms.delete(tournamentId);
    }
    ws.tournamentIds.delete(tournamentId);
  }

  /** Called on socket close — unsubscribes client from all rooms. */
  removeClient(ws: AuthenticatedClient): void {
    for (const tournamentId of ws.tournamentIds) {
      this.removeClientFromTournament(ws, tournamentId);
    }
  }

  // ------------------------------------------------------------------
  // Broadcasting
  // ------------------------------------------------------------------

  /**
   * Broadcast an event to every client watching `tournamentId`.
   *
   @param skipRedis  Pass `true` when the call is already coming FROM
   *                   Redis to avoid re-publishing in an infinite loop.
   */
  broadcastToTournament(
    tournamentId: string,
    event: TournamentEvent,
    skipRedis = false,
  ): void {
    // Publish to Redis first so other pods also receive the event
    if (!skipRedis) {
      redisAdapter.publish(tournamentId, event);
    }

    const room = this.rooms.get(tournamentId);
    if (!room || room.size === 0) return;

    const payload = JSON.stringify(event);
    let delivered = 0;

    for (const client of room) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
        delivered++;
      } else {
        // Clean up stale connections opportunistically
        this.removeClientFromTournament(client, tournamentId);
      }
    }

    console.log(
      `[WS] broadcast "${event.type}" → tournament ${tournamentId} (${delivered} client(s))`,
    );
  }

// Monitoring utilities (for /health/ws endpoint)

  getRoomSizes(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [id, room] of this.rooms) {
      result[id] = room.size;
    }
    return result;
  }

  totalConnections(): number {
    let total = 0;
    for (const room of this.rooms.values()) total += room.size;
    return total;
  }
}

// Event type definitions — keep in sync with the frontend types

export type TournamentEvent =
  | MatchUpdatedEvent
  | TournamentWinnerEvent
  | ParticipantAddedEvent
  | BracketResetEvent
  | TournamentCreatedEvent;

export interface MatchUpdatedEvent {
  type: 'match:updated';
  payload: {
    tournamentId: string;
    matchId: string;
    winnerId: string | null;
    participant1: MatchParticipant;
    participant2: MatchParticipant;
    round: number;
    nextMatchId: string | null;
  };
}

export interface TournamentWinnerEvent {
  type: 'tournament:winner';
  payload: {
    tournamentId: string;
    winnerId: string;
    winnerName: string;
  };
}

export interface ParticipantAddedEvent {
  type: 'participant:added';
  payload: {
    tournamentId: string;
    participantId: string;
    name: string;
    ranking: number;
  };
}

export interface BracketResetEvent {
  type: 'bracket:reset';
  payload: { tournamentId: string };
}

export interface TournamentCreatedEvent {
  type: 'tournament:created';
  payload: { tournamentId: string; name: string; format: string };
}

interface MatchParticipant {
  id: string;
  name: string;
  score: number | null;
}

// Singleton exported for use throughout the API
export const wsManager = new WsManager();
