import { apiFetch } from "@/lib/api-client";
import { OnboardingStatusResponse, HistoryResponse } from "@/types/api";

export async function getOnboardingStatus(): Promise<OnboardingStatusResponse> {
  const res = await apiFetch("/nova/onboarding-status");
  if (!res.ok) throw new Error("Failed to fetch onboarding status");
  return res.json();
}

export async function getHistory(): Promise<HistoryResponse> {
  const res = await apiFetch("/nova/history");
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}
