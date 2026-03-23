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

export function createTournament(
  payload: CreateTournamentPayload
): Promise<TournamentSummary> {
  return apiFetch<TournamentSummary>("tournaments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}