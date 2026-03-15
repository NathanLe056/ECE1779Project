export interface TournamentWithDetails {
  id: number;
  name: string;
  description: string | null;
  created_by: number;
  bracket_size: number;
  status: string;
  created_at: string;
  creator: {
    id: number;
    username: string;
    email: string;
  };
  members: Array<{
    id: number;
    tournament_id: number;
    user_id: number;
    role: string;
    ranking: number | null;
    user: {
      id: number;
      username: string;
      email: string;
    };
  }>;
  matches: Array<{
    id: number;
    tournament_id: number;
    player1_id: number;
    player2_id: number;
    winner_id: number | null;
    round_number: number;
    match_order: number;
    match_status: string;
    created_at: string;
  }>;
}