import { prisma } from "@/lib/prisma";

/**
 * JEE Readiness Score (0-100):
 * = 0.35 × AccuracyScore
 * + 0.20 × SpeedScore (benchmark: 180 sec/question)
 * + 0.30 × SyllabusCoverage (topics with mastery > 0.5)
 * + 0.15 × ConsistencyScore (active days in last 14 + streak bonus)
 */
export async function calculateReadinessScore(
  userId: string
): Promise<number> {
  const [topicProgress, recentStats, gamification] = await Promise.all([
    prisma.topicProgress.findMany({ where: { userId } }),
    prisma.dailyStats.findMany({
      where: {
        userId,
        date: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.gamification.findUnique({ where: { userId } }),
  ]);

  // 1. Accuracy Score (0-100)
  let accuracyScore = 0;
  const topicsWithAttempts = topicProgress.filter((t) => t.totalAttempted > 0);
  if (topicsWithAttempts.length > 0) {
    const totalCorrect = topicsWithAttempts.reduce(
      (sum, t) => sum + t.totalCorrect,
      0
    );
    const totalAttempted = topicsWithAttempts.reduce(
      (sum, t) => sum + t.totalAttempted,
      0
    );
    accuracyScore = totalAttempted > 0 ? (totalCorrect / totalAttempted) * 100 : 0;
  }

  // 2. Speed Score (0-100) — benchmark: 180 sec/question
  let speedScore = 0;
  const topicsWithTime = topicProgress.filter((t) => t.avgTimeSecs > 0);
  if (topicsWithTime.length > 0) {
    const avgTime =
      topicsWithTime.reduce((sum, t) => sum + t.avgTimeSecs, 0) /
      topicsWithTime.length;
    speedScore = Math.min((180 / avgTime) * 100, 100);
  }

  // 3. Syllabus Coverage (0-100)
  // Total JEE topics across all 3 subjects (approximate: 90 topics)
  const TOTAL_JEE_TOPICS = 90;
  const masteredTopics = topicProgress.filter((t) => t.masteryScore >= 0.5).length;
  const syllabusCoverage = (masteredTopics / TOTAL_JEE_TOPICS) * 100;

  // 4. Consistency Score (0-100)
  const activeDays = recentStats.filter((s) => s.questionsAttempted > 0).length;
  let consistencyScore = (activeDays / 14) * 100;

  // Streak bonus (up to 10 extra points)
  const streak = gamification?.currentStreak ?? 0;
  const streakBonus = Math.min(streak / 3, 10);
  consistencyScore = Math.min(consistencyScore + streakBonus, 100);

  // Weighted final score
  const readinessScore = Math.round(
    0.35 * accuracyScore +
      0.2 * speedScore +
      0.3 * syllabusCoverage +
      0.15 * consistencyScore
  );

  // Save to today's DailyStats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.dailyStats.upsert({
    where: { userId_date: { userId, date: today } },
    update: { readinessScore },
    create: { userId, date: today, readinessScore },
  });

  return readinessScore;
}
