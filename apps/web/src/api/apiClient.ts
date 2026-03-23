const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/"; //first one is for fly.io. also adding .env in web folder to define viteapiurl

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