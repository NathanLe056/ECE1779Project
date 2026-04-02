import {
  CreateTournamentPayload,
  TournamentSummary,
  TournamentWithDetails,
} from "../types/Tournament";
import { apiFetch } from "./apiClient";

export function getTournament(id: number): Promise<TournamentWithDetails> {
  return apiFetch<TournamentWithDetails>(`tournaments/${id}`);
}

export function getTournaments(): Promise<TournamentSummary[]> {
  return apiFetch<TournamentSummary[]>("tournaments");
}

export function getMyTournaments(): Promise<TournamentSummary[]> {
  return apiFetch<TournamentSummary[]>("tournaments/my-tournaments");
}

export function createTournament(
  payload: CreateTournamentPayload
): Promise<TournamentSummary> {
  return apiFetch<TournamentSummary>("tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function deleteTournament(id: number): Promise<void> {
  return apiFetch<void>(`tournaments/${id}`, {
    method: "DELETE",
  });
}

export function generateBracket(
  tournament_id: number
): Promise<{ success: boolean; message: string; matches: number }> {
  return apiFetch<{ success: boolean; message: string; matches: number }>(
    `matches/generate-bracket/${tournament_id}`,
    {
      method: "POST",
    }
  );
}