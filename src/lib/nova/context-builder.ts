import { prisma } from "@/lib/prisma";
import type { NovaContext } from "./prompts";

export async function buildNovaContext(
  userId: string
): Promise<NovaContext> {
  const [user, gamification, recentStats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    }),
    prisma.gamification.findUnique({
      where: { userId },
    }),
    prisma.dailyStats.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 7,
    }),
  ]);

  if (!user) return {};

  const context: NovaContext = {
    userName: user.name ?? undefined,
  };

  if (user.profile?.examAttemptDate) {
    const examDate = new Date(user.profile.examAttemptDate);
    const today = new Date();
    const daysUntilExam = Math.ceil(
      (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    context.examDate = examDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    context.daysUntilExam = daysUntilExam;
    context.strongSubjects = user.profile.strongSubjects;
    context.weakSubjects = user.profile.weakSubjects;
  }

  if (gamification) {
    context.currentStreak = gamification.currentStreak;
  }

  // Calculate recent accuracy per subject from last 7 days of attempts
  if (recentStats.length > 0) {
    const totals = { correct: 0, attempted: 0 };
    recentStats.forEach((s) => {
      totals.correct += s.questionsCorrect;
      totals.attempted += s.questionsAttempted;
    });

    if (totals.attempted > 0) {
      const overallAccuracy = Math.round(
        (totals.correct / totals.attempted) * 100
      );
      context.readinessScore = overallAccuracy;
    }
  }

  // Get last mock score
  const lastMock = await prisma.mockTest.findFirst({
    where: { userId },
    orderBy: { attemptDate: "desc" },
  });

  if (lastMock?.totalMarks) {
    context.lastMockScore = lastMock.totalMarks;
  }

  // Today's mission progress
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [completedMissions, totalMissions] = await Promise.all([
    prisma.userMission.count({
      where: { userId, completed: true, expiresAt: { gte: today } },
    }),
    prisma.userMission.count({
      where: { userId, expiresAt: { gte: today, lt: tomorrow } },
    }),
  ]);

  context.missionsCompleted = completedMissions;
  context.totalMissions = totalMissions;

  return context;
}
