import { prisma } from "@/lib/prisma";
import { XPReason, Difficulty } from "@prisma/client";
import { getLevelFromXP } from "@/lib/utils";

interface AwardXPResult {
  xpGained: number;
  newXP: number;
  oldLevel: number;
  newLevel: number;
  levelUp: boolean;
}

const XP_TABLE: Record<string, number> = {
  CORRECT_EASY: 5,
  CORRECT_MEDIUM: 10,
  CORRECT_HARD: 15,
  PRACTICE_SESSION: 20,
  MOCK_COMPLETED: 50,
  MISSION_COMPLETED: 0, // variable — set by mission.xpReward
  STREAK_BONUS: 10,
  ONBOARDING_COMPLETE: 100,
  DAILY_LOGIN: 5,
};

export function getXPForCorrectAnswer(difficulty: Difficulty): number {
  return XP_TABLE[`CORRECT_${difficulty}`] ?? 5;
}

export async function awardXP(
  userId: string,
  reason: XPReason,
  options?: {
    xpOverride?: number;
    referenceId?: string;
    accuracyBonus?: number;
  }
): Promise<AwardXPResult> {
  let amount = options?.xpOverride ?? XP_TABLE[reason] ?? 0;

  // Add accuracy bonus for session completion (up to 30 XP)
  if (reason === "PRACTICE_SESSION" && options?.accuracyBonus !== undefined) {
    amount += Math.round(options.accuracyBonus * 30);
  }

  // Double streak bonus at milestone days
  if (reason === "STREAK_BONUS") {
    const gamification = await prisma.gamification.findUnique({
      where: { userId },
    });
    const streak = gamification?.currentStreak ?? 0;
    if (streak >= 30) amount *= 4;
    else if (streak >= 14) amount *= 3;
    else if (streak >= 7) amount *= 2;
  }

  const gamification = await prisma.gamification.findUnique({
    where: { userId },
  });

  const oldXP = gamification?.xp ?? 0;
  const oldLevel = getLevelFromXP(oldXP);
  const newXP = oldXP + amount;
  const newLevel = getLevelFromXP(newXP);

  await prisma.gamification.update({
    where: { userId },
    data: {
      xp: newXP,
      level: newLevel,
      xpHistory: {
        create: {
          amount,
          reason,
          referenceId: options?.referenceId,
        },
      },
    },
  });

  // Update today's DailyStats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyStats.upsert({
    where: { userId_date: { userId, date: today } },
    update: { xpEarned: { increment: amount } },
    create: { userId, date: today, xpEarned: amount },
  });

  return {
    xpGained: amount,
    newXP,
    oldLevel,
    newLevel,
    levelUp: newLevel > oldLevel,
  };
}
