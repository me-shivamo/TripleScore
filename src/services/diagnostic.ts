import { apiFetch } from "@/lib/api-client";
import {
  DiagnosticStartResponse,
  QuestionsResponse,
  SubmitAttempt,
  SubmitResult,
} from "@/types/api";

export async function startDiagnostic(): Promise<DiagnosticStartResponse> {
  const res = await apiFetch("/diagnostic/start", { method: "POST" });
  if (!res.ok) throw new Error("Failed to start diagnostic");
  return res.json();
}

export async function getQuestions(
  subject: string,
  chapter: string,
  count: number
): Promise<QuestionsResponse> {
  const res = await apiFetch("/diagnostic/questions", {
    method: "POST",
    body: JSON.stringify({ subject, chapter, count }),
  });
  if (!res.ok) throw new Error("Failed to load questions");
  return res.json();
}

export async function submitDiagnostic(
  testNumber: 1 | 2,
  subject: string,
  chapter: string,
  attempts: SubmitAttempt[]
): Promise<SubmitResult> {
  const res = await apiFetch("/diagnostic/submit", {
    method: "POST",
    body: JSON.stringify({ test_number: testNumber, subject, chapter, attempts }),
  });
  if (!res.ok) throw new Error("Failed to submit diagnostic");
  return res.json();
}

export async function skipDiagnostic(): Promise<void> {
  await apiFetch("/diagnostic/skip", { method: "POST" });
}
