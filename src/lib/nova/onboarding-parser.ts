import { getAIProvider } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";
import { buildWorkflowGenerationPrompt } from "./prompts";

export interface HolisticOnboardingData {
  examDate?: string; // "YYYY-MM-DD"
  strongSubjects?: string[];
  weakSubjects?: string[];
  dailyStudyHours?: number;
  previousScore?: number; // 0-300
  confidenceLevel?: number; // 1-10
  studyStruggles?: string[];
  motivationalState?: string;
}

/**
 * Checks if an assistant message contains the onboarding completion sentinel.
 * Pure string check — zero AI cost.
 */
export function detectOnboardingComplete(assistantMessage: string): boolean {
  return assistantMessage.includes("__NOVA_ONBOARDING_COMPLETE__");
}

/**
 * Extracts all structured onboarding data from the full conversation transcript
 * in a single AI call. Called once when onboarding completes.
 */
export async function extractHolisticOnboardingData(
  transcript: Array<{ role: "user" | "assistant"; content: string }>
): Promise<HolisticOnboardingData> {
  const ai = getAIProvider();

  const transcriptText = transcript
    .filter(
      (m) =>
        m.content !== "__NOVA_INIT__" &&
        !m.content.includes("__NOVA_ONBOARDING_COMPLETE__")
    )
    .map((m) => `${m.role === "user" ? "Student" : "Nova"}: ${m.content}`)
    .join("\n\n");

  const prompt = `Extract structured data from this JEE student onboarding conversation.

CONVERSATION:
${transcriptText}

Return ONLY valid JSON with no extra text:
{
  "examDate": "YYYY-MM-DD or null",
  "strongSubjects": ["PHYSICS", "CHEMISTRY", "MATH"],
  "weakSubjects": ["PHYSICS", "CHEMISTRY", "MATH"],
  "dailyStudyHours": number or null,
  "previousScore": number 0-300 or null,
  "confidenceLevel": number 1-10 or null,
  "studyStruggles": ["short phrase per struggle the student mentioned"],
  "motivationalState": "one sentence describing their emotional or motivational state, or null"
}

Rules:
- examDate: convert "April 2025" or "JEE 2026" to YYYY-MM-DD using the 1st of the month
- subjects: only include what the student explicitly stated, not Nova's inferences
- studyStruggles: use the student's own words closely, keep each entry brief
- Set null or empty array [] for any field that cannot be determined from the conversation`;

  return ai.parseStructured<HolisticOnboardingData>(prompt);
}

/**
 * Saves holistic onboarding data to UserProfile.
 */
export async function saveHolisticOnboardingData(
  userId: string,
  data: HolisticOnboardingData
): Promise<void> {
  const updateData: Record<string, unknown> = {};

  if (data.examDate) {
    const parsed = new Date(data.examDate);
    if (!isNaN(parsed.getTime())) {
      updateData.examAttemptDate = parsed;
    }
  }
  if (data.strongSubjects?.length) {
    updateData.strongSubjects = data.strongSubjects;
  }
  if (data.weakSubjects?.length) {
    updateData.weakSubjects = data.weakSubjects;
  }
  if (data.dailyStudyHours != null) {
    updateData.dailyStudyHours = data.dailyStudyHours;
  }
  if (data.previousScore != null) {
    updateData.previousScore = data.previousScore;
  }
  if (data.confidenceLevel != null) {
    updateData.confidenceLevel = data.confidenceLevel;
  }
  if (data.studyStruggles?.length) {
    updateData.studyStruggles = data.studyStruggles;
  }
  if (data.motivationalState) {
    updateData.motivationalState = data.motivationalState;
  }

  await prisma.userProfile.upsert({
    where: { userId },
    update: updateData,
    create: { userId, ...updateData },
  });
}

/**
 * Generates the personalized study workflow and marks onboarding as complete.
 */
export async function completeOnboarding(userId: string): Promise<void> {
  const ai = getAIProvider();

  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  if (!profile) return;

  const prompt = buildWorkflowGenerationPrompt({
    examDate: profile.examAttemptDate?.toISOString().split("T")[0] ?? "unknown",
    strongSubjects: profile.strongSubjects,
    weakSubjects: profile.weakSubjects,
    dailyHours: profile.dailyStudyHours ?? 4,
    previousScore: profile.previousScore ?? undefined,
    confidenceLevel: profile.confidenceLevel ?? undefined,
    studyStruggles: profile.studyStruggles,
    motivationalState: profile.motivationalState ?? undefined,
  });

  let studyWorkflow: Record<string, unknown> = {};
  try {
    studyWorkflow = await ai.parseStructured<Record<string, unknown>>(prompt);
  } catch {
    studyWorkflow = {
      summary: "Focus on your weak subjects daily with consistent practice.",
    };
  }

  await prisma.userProfile.update({
    where: { userId },
    data: {
      studyWorkflow: studyWorkflow as any,
      onboardingCompleted: true,
      onboardingStep: 6,
    },
  });

  // Award onboarding XP
  const gamification = await prisma.gamification.findUnique({
    where: { userId },
  });

  if (gamification) {
    await prisma.gamification.update({
      where: { userId },
      data: {
        xp: { increment: 100 },
        xpHistory: {
          create: {
            amount: 100,
            reason: "ONBOARDING_COMPLETE",
          },
        },
      },
    });
  }
}
