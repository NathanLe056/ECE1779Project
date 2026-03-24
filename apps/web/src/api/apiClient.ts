const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api/"; //first one is for fly.io. also adding .env in web folder to define viteapiurl

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem("token");

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let message = "API request failed";
    try {
      const errorData = await response.json();
      if (errorData?.message && typeof errorData.message === "string") {
        message = errorData.message;
      }
    } catch {
      message = "API request failed";
    }
    throw new Error(message);
  } else {
    return response.json();   
  }
}