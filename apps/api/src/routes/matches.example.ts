import { Router, Request, Response } from 'express';
import { wsManager, MatchUpdatedEvent, TournamentWinnerEvent } from '../websocket';

const router = Router();

router.patch('/:matchId', /* requireAuth, */ async (req: Request, res: Response) => {
  const { matchId } = req.params;
  const { winnerId, participant1Score, participant2Score } = req.body as {
    winnerId: string;
    participant1Score: number;
    participant2Score: number;
  };

  try {
    const match = {
      id: matchId,
      tournamentId: req.body.tournamentId as string,  // include from DB in real impl
      round: req.body.round as number,
      nextMatchId: req.body.nextMatchId as string | null,
      winnerId,
      participant1: { id: 'p1', name: 'Player 1', score: participant1Score },
      participant2: { id: 'p2', name: 'Player 2', score: participant2Score },
    };

    const matchEvent: MatchUpdatedEvent = {
      type: 'match:updated',
      payload: {
        tournamentId:  match.tournamentId,
        matchId:       match.id,
        winnerId:      match.winnerId,
        participant1:  match.participant1,
        participant2:  match.participant2,
        round:         match.round,
        nextMatchId:   match.nextMatchId,
      },
    };
    wsManager.broadcastToTournament(match.tournamentId, matchEvent);

    res.json({ success: true, match });
  } catch (err) {
    console.error('[PATCH /matches/:matchId]', err);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

export default router;
