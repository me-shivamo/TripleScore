import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRIOR_MASTERY } from "@/lib/diagnostic/mastery-calculator";
import { JEE_CHAPTERS } from "@/lib/diagnostic/chapter-suggestions";
import { Subject } from "@prisma/client";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const strongSubjects = (profile?.strongSubjects ?? []) as Subject[];
  const weakSubjects = (profile?.weakSubjects ?? []) as Subject[];

  // Mark diagnostic session as skipped
  await prisma.diagnosticSession.upsert({
    where: { userId },
    update: { status: "SKIPPED", skipped: true },
    create: { userId, status: "SKIPPED", skipped: true },
  });

  // Write prior estimates for all chapters
  for (const [subj, chapters] of Object.entries(JEE_CHAPTERS)) {
    const batchEntries = (chapters as string[]).map((ch) => {
      let priorScore: number = PRIOR_MASTERY.UNKNOWN;
      if (strongSubjects.includes(subj as Subject)) {
        priorScore = PRIOR_MASTERY.STRONG_SUBJECT;
      } else if (weakSubjects.includes(subj as Subject)) {
        priorScore = PRIOR_MASTERY.WEAK_SUBJECT;
      }

      return {
        userId,
        subject: subj as Subject,
        chapter: ch,
        topic: ch,
        masteryScore: priorScore,
        totalAttempted: 0,
        totalCorrect: 0,
        avgTimeSecs: 0,
        isUnlocked: false,
      };
    });

    await Promise.all(
      batchEntries.map((entry) =>
        prisma.topicProgress.upsert({
          where: {
            userId_subject_chapter_topic: {
              userId: entry.userId,
              subject: entry.subject,
              chapter: entry.chapter,
              topic: entry.topic,
            },
          },
          update: {},
          create: entry,
        })
      )
    );
  }

  return NextResponse.json({ ok: true });
}
