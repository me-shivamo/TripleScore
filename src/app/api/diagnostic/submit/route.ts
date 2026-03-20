import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { awardXP } from "@/lib/gamification/xp-engine";
import {
  calculateMasteryScore,
  AttemptSummary,
  PRIOR_MASTERY,
} from "@/lib/diagnostic/mastery-calculator";
import { JEE_CHAPTERS } from "@/lib/diagnostic/chapter-suggestions";
import { Subject, Difficulty } from "@prisma/client";

interface SubmitAttempt {
  questionId: string;
  selectedOption: string | null; // null = skipped
  timeTakenSecs: number;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const {
    testNumber, // 1 or 2
    subject,
    chapter,
    attempts,
  }: {
    testNumber: 1 | 2;
    subject: string;
    chapter: string;
    attempts: SubmitAttempt[];
  } = await req.json();

  if (!testNumber || !subject || !chapter || !Array.isArray(attempts)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  // Fetch full question data for correctness checking
  const questionIds = attempts.map((a) => a.questionId);
  const questions = await prisma.question.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      topic: true,
      correctOption: true,
      difficulty: true,
    },
  });

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // Grade attempts
  const graded = attempts.map((attempt) => {
    const q = questionMap.get(attempt.questionId);
    const isCorrect =
      attempt.selectedOption !== null &&
      q?.correctOption === attempt.selectedOption;
    return {
      ...attempt,
      isCorrect,
      topic: q?.topic ?? "Unknown",
      difficulty: (q?.difficulty ?? "MEDIUM") as Difficulty,
    };
  });

  const correctCount = graded.filter((a) => a.isCorrect).length;
  const totalAttempted = graded.filter((a) => a.selectedOption !== null).length;

  // Create PracticeSession
  const practiceSession = await prisma.practiceSession.create({
    data: {
      userId,
      subject: subject as Subject,
      chapter,
      mode: "ADAPTIVE",
      totalQuestions: attempts.length,
      completedAt: new Date(),
      durationSecs: graded.reduce((sum, a) => sum + a.timeTakenSecs, 0),
      xpEarned: 50 + correctCount * 3,
    },
  });

  // Save QuestionAttempts
  await prisma.questionAttempt.createMany({
    data: graded.map((a) => ({
      userId,
      sessionId: practiceSession.id,
      questionId: a.questionId,
      selectedOption: a.selectedOption ?? undefined,
      isCorrect: a.isCorrect,
      timeTakenSecs: a.timeTakenSecs,
    })),
  });

  // Calculate mastery score for this chapter
  const attemptSummaries: AttemptSummary[] = graded
    .filter((a) => a.selectedOption !== null)
    .map((a) => ({
      isCorrect: a.isCorrect,
      timeTakenSecs: a.timeTakenSecs,
      difficulty: a.difficulty,
    }));

  const masteryScore =
    attemptSummaries.length > 0
      ? calculateMasteryScore(attemptSummaries)
      : 0;

  // Update TopicProgress for the tested chapter
  const avgTimeSecs =
    attemptSummaries.length > 0
      ? attemptSummaries.reduce((s, a) => s + a.timeTakenSecs, 0) /
        attemptSummaries.length
      : 0;

  await prisma.topicProgress.upsert({
    where: {
      userId_subject_chapter_topic: {
        userId,
        subject: subject as Subject,
        chapter,
        topic: chapter, // chapter-level topic
      },
    },
    update: {
      masteryScore,
      totalAttempted,
      totalCorrect: correctCount,
      avgTimeSecs,
      lastAttempted: new Date(),
      isUnlocked: true,
    },
    create: {
      userId,
      subject: subject as Subject,
      chapter,
      topic: chapter,
      masteryScore,
      totalAttempted,
      totalCorrect: correctCount,
      avgTimeSecs,
      lastAttempted: new Date(),
      isUnlocked: true,
    },
  });

  // Update DiagnosticSession
  const diagnosticSession = await prisma.diagnosticSession.findUnique({
    where: { userId },
  });

  if (diagnosticSession) {
    const updateData =
      testNumber === 1
        ? {
            test1SessionId: practiceSession.id,
            test1Subject: subject,
            test1Chapter: chapter,
            status: "TEST1_COMPLETE" as const,
          }
        : {
            test2SessionId: practiceSession.id,
            test2Subject: subject,
            test2Chapter: chapter,
            status: "COMPLETED" as const,
            completedAt: new Date(),
          };

    await prisma.diagnosticSession.update({
      where: { userId },
      data: updateData,
    });
  }

  // Award XP for this test
  await awardXP(userId, "DIAGNOSTIC_COMPLETE", {
    xpOverride: 50 + correctCount * 3,
    referenceId: practiceSession.id,
  });

  // If test 2 completed, write prior estimates for all untested chapters
  if (testNumber === 2) {
    const profile = await prisma.userProfile.findUnique({ where: { userId } });
    const strongSubjects = (profile?.strongSubjects ?? []) as Subject[];
    const weakSubjects = (profile?.weakSubjects ?? []) as Subject[];

    const testedChapters = new Set<string>();
    if (diagnosticSession?.test1Chapter)
      testedChapters.add(diagnosticSession.test1Chapter);
    testedChapters.add(chapter);

    // Write prior estimates for all other chapters
    const priorEntries: {
      userId: string;
      subject: Subject;
      chapter: string;
      topic: string;
      masteryScore: number;
      totalAttempted: number;
      totalCorrect: number;
      avgTimeSecs: number;
      isUnlocked: boolean;
    }[] = [];

    for (const [subj, chapters] of Object.entries(JEE_CHAPTERS)) {
      for (const ch of chapters as string[]) {
        if (testedChapters.has(ch)) continue;

        let priorScore: number = PRIOR_MASTERY.UNKNOWN;
        if (strongSubjects.includes(subj as Subject)) {
          priorScore = PRIOR_MASTERY.STRONG_SUBJECT;
        } else if (weakSubjects.includes(subj as Subject)) {
          priorScore = PRIOR_MASTERY.WEAK_SUBJECT;
        }

        priorEntries.push({
          userId,
          subject: subj as Subject,
          chapter: ch,
          topic: ch,
          masteryScore: priorScore,
          totalAttempted: 0,
          totalCorrect: 0,
          avgTimeSecs: 0,
          isUnlocked: false,
        });
      }
    }

    // Upsert in batches to avoid hitting DB limits
    for (let i = 0; i < priorEntries.length; i += 20) {
      const batch = priorEntries.slice(i, i + 20);
      await Promise.all(
        batch.map((entry) =>
          prisma.topicProgress.upsert({
            where: {
              userId_subject_chapter_topic: {
                userId: entry.userId,
                subject: entry.subject,
                chapter: entry.chapter,
                topic: entry.topic,
              },
            },
            update: {}, // don't overwrite if already has real data
            create: entry,
          })
        )
      );
    }
  }

  return NextResponse.json({
    score: { correct: correctCount, total: attempts.length },
    masteryScore,
    sessionId: practiceSession.id,
  });
}
