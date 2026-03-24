import { useEffect, useRef, useState, useCallback } from 'react';
import { tournamentSocket, TournamentEvent, ConnectionStatus } from './socket';

interface UseTournamentSocketReturn {
  // Most recently received event, or null before the first one arrives.
  lastEvent: TournamentEvent | null;
  // Current WebSocket connection status.
  status: ConnectionStatus;
}

export function useTournamentSocket(
  // Numeric tournament id — matches the `id` field in TournamentWithDetails.
  tournamentId: number | null | undefined,
  onEvent?: (event: TournamentEvent) => void,
): UseTournamentSocketReturn {
  const [lastEvent, setLastEvent] = useState<TournamentEvent | null>(null);
  const [status, setStatus]       = useState<ConnectionStatus>('disconnected');

  // Stable ref so we don't re-register the handler on every render
  const onEventRef = useRef(onEvent);
  useEffect(() => { onEventRef.current = onEvent; }, [onEvent]);

  useEffect(() => {
    if (!tournamentId) return;

    // Connect (no-op if already open)
    tournamentSocket.connect();

    const unsubMessage = tournamentSocket.onMessage((event) => {
      // Filter to events belonging to this tournament
      const payload = event.payload as { tournament_id?: number };
      if (payload?.tournament_id !== undefined && payload.tournament_id !== tournamentId) return;

      setLastEvent(event);
      onEventRef.current?.(event);
    });

    const unsubStatus = tournamentSocket.onStatus(setStatus);

    tournamentSocket.subscribe(tournamentId);

    return () => {
      tournamentSocket.unsubscribe(tournamentId);
      unsubMessage();
      unsubStatus();
    };
  }, [tournamentId]);

  return { lastEvent, status };
}

// Convenience typed variants

/**
 * Fires a callback each time a match result is recorded for the tournament.
 * Returns the current connection status.
 */
export function useMatchUpdates(
  tournamentId: number | null | undefined,
  onMatchUpdated: (
    payload: Extract<TournamentEvent, { type: 'match:updated' }>['payload']
  ) => void,
): ConnectionStatus {
  const cb = useCallback(
    (event: TournamentEvent) => {
      if (event.type === 'match:updated') onMatchUpdated(event.payload);
    },
    [onMatchUpdated],
  );
  const { status } = useTournamentSocket(tournamentId, cb);
  return status;
}

/**
 * Returns the winner payload once the tournament bracket is complete.
 * Null until the server emits the tournament:winner event.
 */
export function useTournamentWinner(
  tournamentId: number | null | undefined,
): Extract<TournamentEvent, { type: 'tournament:winner' }>['payload'] | null {
  const [winner, setWinner] = useState<
    Extract<TournamentEvent, { type: 'tournament:winner' }>['payload'] | null
  >(null);

  useTournamentSocket(tournamentId, (event) => {
    if (event.type === 'tournament:winner') setWinner(event.payload);
  });

  return winner;
}
