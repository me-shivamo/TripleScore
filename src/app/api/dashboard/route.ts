import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateReadinessScore } from "@/lib/analytics/readiness-calculator";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [gamification, todayStats, profile, missions] = await Promise.all([
    prisma.gamification.findUnique({ where: { userId } }),
    prisma.dailyStats.findFirst({
      where: {
        userId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.userMission.findMany({
      where: {
        userId,
        expiresAt: { gte: new Date() },
      },
      include: { mission: true },
      orderBy: { assignedAt: "desc" },
      take: 5,
    }),
  ]);

  // Calculate readiness score (lazy — calculate if not done today)
  let readinessScore = todayStats?.readinessScore;
  if (readinessScore === undefined || readinessScore === null) {
    readinessScore = await calculateReadinessScore(userId);
  }

  // Days until exam
  let daysUntilExam: number | null = null;
  if (profile?.examAttemptDate) {
    const exam = new Date(profile.examAttemptDate);
    const today = new Date();
    daysUntilExam = Math.ceil(
      (exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
  }

  return NextResponse.json({
    readinessScore,
    daysUntilExam,
    gamification: {
      xp: gamification?.xp ?? 0,
      level: gamification?.level ?? 1,
      currentStreak: gamification?.currentStreak ?? 0,
      longestStreak: gamification?.longestStreak ?? 0,
    },
    todayStats: {
      questionsAttempted: todayStats?.questionsAttempted ?? 0,
      questionsCorrect: todayStats?.questionsCorrect ?? 0,
      studyMinutes: todayStats?.studyMinutes ?? 0,
      xpEarned: todayStats?.xpEarned ?? 0,
    },
    missions: missions.map((um) => ({
      id: um.id,
      title: um.mission.title,
      description: um.mission.description,
      xpReward: um.mission.xpReward,
      progress: um.progress,
      target: um.mission.target,
      completed: um.completed,
      type: um.mission.type,
    })),
    profile: {
      onboardingCompleted: profile?.onboardingCompleted ?? false,
      strongSubjects: profile?.strongSubjects ?? [],
      weakSubjects: profile?.weakSubjects ?? [],
    },
  });
}
