import { prisma } from "@/lib/prisma";
import { awardXP } from "./xp-engine";

/**
 * Updates the user's streak based on their last active date.
 * Call this whenever a qualifying activity is completed (practice session, mock test).
 */
export async function updateStreak(userId: string): Promise<{
  currentStreak: number;
  longestStreak: number;
  streakMaintained: boolean;
  streakBroken: boolean;
}> {
  const gamification = await prisma.gamification.findUnique({
    where: { userId },
  });

  if (!gamification) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      streakMaintained: false,
      streakBroken: false,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const lastActive = gamification.lastActiveDate
    ? new Date(gamification.lastActiveDate)
    : null;

  if (lastActive) {
    lastActive.setHours(0, 0, 0, 0);
  }

  let newStreak = gamification.currentStreak;
  let streakMaintained = false;
  let streakBroken = false;

  if (!lastActive) {
    // First activity
    newStreak = 1;
  } else if (lastActive.getTime() === today.getTime()) {
    // Already active today — no change
    streakMaintained = true;
    return {
      currentStreak: gamification.currentStreak,
      longestStreak: gamification.longestStreak,
      streakMaintained: true,
      streakBroken: false,
    };
  } else if (lastActive.getTime() === yesterday.getTime()) {
    // Consecutive day
    newStreak = gamification.currentStreak + 1;
    streakMaintained = true;
  } else {
    // Streak broken
    newStreak = 1;
    streakBroken = true;
  }

  const newLongest = Math.max(newStreak, gamification.longestStreak);

  await prisma.gamification.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
    },
  });

  // Award streak bonus XP (only when maintaining/starting streak, not first day)
  if (streakMaintained || newStreak > 1) {
    await awardXP(userId, "STREAK_BONUS");
  }

  return {
    currentStreak: newStreak,
    longestStreak: newLongest,
    streakMaintained,
    streakBroken,
  };
}
