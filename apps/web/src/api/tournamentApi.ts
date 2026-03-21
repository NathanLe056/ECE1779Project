import { TournamentWithDetails } from "../types/Tournament";
import { apiFetch } from "./apiClient";

export function getTournament(id: number): Promise<TournamentWithDetails> {
  return apiFetch<TournamentWithDetails>(`tournaments/${id}`);
}