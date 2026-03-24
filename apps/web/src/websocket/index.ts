export { tournamentSocket } from './socket';
export type {
  TournamentEvent,
  MatchUpdatedPayload,
  WinnerPayload,
  ParticipantAddedPayload,
  TournamentCreatedPayload,
  ConnectionStatus,
} from './socket';

export {
  useTournamentSocket,
  useMatchUpdates,
  useTournamentWinner,
} from './useTournamentSocket';
