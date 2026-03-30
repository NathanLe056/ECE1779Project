import { apiFetch } from "./apiClient";

interface JoinTournamentPayload {
  tournament_id: number;
  user_id: number;
  role: "player";
  ranking: number;
}

export function joinTournament(payload: JoinTournamentPayload) {
  return apiFetch("tournament-members", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
