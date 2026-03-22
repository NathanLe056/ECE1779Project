import { User } from "../types/User";
import { apiFetch } from "./apiClient";

export function login(email: string, password: string): Promise<User> {
  return apiFetch<User>("users/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function signUp(username: string, email: string, password: string): Promise<User> {
  return apiFetch<User>("users", {
    method: "POST",
    body: JSON.stringify({ username, email, password }),
  });
}