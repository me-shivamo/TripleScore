import { auth } from "@/lib/firebase";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers as Record<string, string> | undefined),
    },
  });
}

export async function apiStream(path: string, body: unknown): Promise<Response> {
  const token = await getAuthToken();
  return fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
}
