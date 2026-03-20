import { Difficulty } from "@prisma/client";

const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  EASY: 0.8,
  MEDIUM: 1.0,
  HARD: 1.3,
};

const BENCHMARK_TIME_SECS = 90; // expected time per question

export interface AttemptSummary {
  isCorrect: boolean;
  timeTakenSecs: number;
  difficulty: Difficulty;
}

/**
 * Calculate a mastery score (0.0 – 1.0) for a chapter based on quiz attempts.
 *
 * Formula:
 *   base         = correctCount / totalAttempted
 *   speedFactor  = clamp(BENCHMARK_TIME / avgTimeSecs, 0.5, 1.5)
 *   diffMult     = average difficulty multiplier across attempts
 *   masteryScore = clamp(base × speedFactor × diffMult, 0, 1)
 */
export function calculateMasteryScore(attempts: AttemptSummary[]): number {
  if (!attempts.length) return 0;

  const totalAttempted = attempts.length;
  const correctCount = attempts.filter((a) => a.isCorrect).length;
  const totalTimeSecs = attempts.reduce((sum, a) => sum + a.timeTakenSecs, 0);
  const avgTimeSecs = totalTimeSecs / totalAttempted;

  const base = correctCount / totalAttempted;
  const speedFactor = Math.min(
    1.5,
    Math.max(0.5, BENCHMARK_TIME_SECS / Math.max(avgTimeSecs, 1))
  );
  const avgDiffMult =
    attempts.reduce((sum, a) => sum + DIFFICULTY_MULTIPLIER[a.difficulty], 0) /
    totalAttempted;

  return Math.min(1.0, Math.max(0.0, base * speedFactor * avgDiffMult));
}

export type MasteryLabel = "Beginner" | "Developing" | "Proficient" | "Strong";

export function getMasteryLabel(score: number): MasteryLabel {
  if (score >= 0.76) return "Strong";
  if (score >= 0.51) return "Proficient";
  if (score >= 0.26) return "Developing";
  return "Beginner";
}

export function getMasteryColor(label: MasteryLabel): string {
  switch (label) {
    case "Strong":
      return "text-emerald-400";
    case "Proficient":
      return "text-blue-400";
    case "Developing":
      return "text-amber-400";
    case "Beginner":
      return "text-red-400";
  }
}

export function getMasteryBg(label: MasteryLabel): string {
  switch (label) {
    case "Strong":
      return "bg-emerald-400/10 border-emerald-400/30";
    case "Proficient":
      return "bg-blue-400/10 border-blue-400/30";
    case "Developing":
      return "bg-amber-400/10 border-amber-400/30";
    case "Beginner":
      return "bg-red-400/10 border-red-400/30";
  }
}

/**
 * Prior estimate scores for topics not tested in the diagnostic.
 * These are rough starting values until the student actually practices.
 */
export const PRIOR_MASTERY = {
  STRONG_SUBJECT: 0.55,
  WEAK_SUBJECT: 0.25,
  UNKNOWN: 0.30,
} as const;
