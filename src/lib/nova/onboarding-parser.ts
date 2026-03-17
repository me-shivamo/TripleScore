import { getAIProvider } from "@/lib/ai/client";
import { prisma } from "@/lib/prisma";
import {
  buildWorkflowGenerationPrompt,
} from "./prompts";

interface OnboardingData {
  examDate?: string; // ISO date string
  strongSubjects?: string[];
  weakSubjects?: string[];
  dailyStudyHours?: number;
  previousScore?: number;
  confidenceLevel?: number;
  isComplete?: boolean;
}

/**
 * Uses AI to extract structured onboarding data from the latest user message.
 * Returns null if no new data was extracted.
 */
export async function extractOnboardingData(
  userMessage: string,
  currentStep: number
): Promise<OnboardingData | null> {
  const ai = getAIProvider();

  const extractionPrompts: Record<number, string> = {
    1: `Extract the JEE exam attempt date from this message. Return JSON: {"examDate": "YYYY-MM-DD"} or {"examDate": null} if not found.
Message: "${userMessage}"`,

    2: `Extract strong subjects from this message. Subjects can be: PHYSICS, CHEMISTRY, MATH.
Return JSON: {"strongSubjects": ["PHYSICS", "CHEMISTRY"]} or {"strongSubjects": []} if not found.
Message: "${userMessage}"`,

    3: `Extract weak subjects from this message. Subjects can be: PHYSICS, CHEMISTRY, MATH.
Return JSON: {"weakSubjects": ["MATH"]} or {"weakSubjects": []} if not found.
Message: "${userMessage}"`,

    4: `Extract daily study hours from this message. Return a number (can be decimal like 5.5).
Return JSON: {"dailyStudyHours": 5.5} or {"dailyStudyHours": null} if not found.
Message: "${userMessage}"`,

    5: `Extract either a previous mock/exam score (0-300) or confidence level (1-10) from this message.
Return JSON: {"previousScore": 145, "confidenceLevel": null} or {"previousScore": null, "confidenceLevel": 6} — include both fields.
Message: "${userMessage}"`,
  };

  const prompt = extractionPrompts[currentStep];
  if (!prompt) return null;

  try {
    const data = await ai.parseStructured<Record<string, unknown>>(prompt);
    return data as OnboardingData;
  } catch {
    return null;
  }
}

/**
 * Saves extracted onboarding data to the UserProfile and advances the step.
 * Returns the new step number.
 */
export async function saveOnboardingStep(
  userId: string,
  step: number,
  data: OnboardingData
): Promise<number> {
  const updateData: Record<string, unknown> = {
    onboardingStep: step + 1,
  };

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
  if (data.dailyStudyHours !== undefined && data.dailyStudyHours !== null) {
    updateData.dailyStudyHours = data.dailyStudyHours;
  }
  if (data.previousScore !== undefined && data.previousScore !== null) {
    updateData.previousScore = data.previousScore;
  }
  if (data.confidenceLevel !== undefined && data.confidenceLevel !== null) {
    updateData.confidenceLevel = data.confidenceLevel;
  }

  await prisma.userProfile.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      onboardingStep: step + 1,
    },
  });

  return step + 1;
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
  });

  let studyWorkflow: Record<string, unknown> = {};
  try {
    studyWorkflow = await ai.parseStructured<Record<string, unknown>>(prompt);
  } catch {
    // Fallback: basic workflow
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
