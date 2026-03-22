const API_BASE = "http://localhost:3000/api/";

export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {

  const response = await fetch(`${API_BASE}${endpoint}`, {headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options});

  if (!response.ok) {
    throw new Error("API request failed");
  }

  return response.json();
}