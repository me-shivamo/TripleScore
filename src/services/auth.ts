import { apiFetch } from "@/lib/api-client";
import { UserResponse } from "@/types/api";

export async function login(): Promise<UserResponse> {
  const res = await apiFetch("/auth/login", { method: "POST" });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}
