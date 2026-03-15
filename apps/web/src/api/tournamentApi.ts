import { TournamentWithDetails } from "../types/Tournament";
import { apiFetch } from "./apiClient";

// Makes an API call to get a tournament by id
export function getTournament(id: number): Promise<TournamentWithDetails> {
  return apiFetch<TournamentWithDetails>(`tournaments/${id}`);
}