import { apiFetch } from "./apiClient";

export interface UpdateMatchPayload {
  match_status?: string;
  winner_id?: number | null;
  player1_id?: number;
  player2_id?: number;
}

export interface MatchDto {
  id: number;
  tournament_id: number;
  player1_id: number;
  player2_id: number;
  winner_id: number | null;
  round_number: number;
  match_order: number;
  match_status: string;
  created_at: string;
}

export interface UpdateMatchResponse {
  message: string;
  match: MatchDto;
  matches: MatchDto[];
}

export function updateMatch(id: number, payload: UpdateMatchPayload) {
  return apiFetch<UpdateMatchResponse>(`matches/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
