import { apiFetch } from "@/lib/api-client";
import { DashboardResponse } from "@/types/api";

export async function getDashboard(): Promise<DashboardResponse> {
  const res = await apiFetch("/dashboard");
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}
