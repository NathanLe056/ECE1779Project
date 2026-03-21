import { AuthResponse, User } from "../types/User";
import { apiFetch } from "./apiClient";

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(
  username: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("auth/signup", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}

export function getCurrentUser(): Promise<User> {
  return apiFetch<User>("auth/me");
}