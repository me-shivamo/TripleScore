import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getSuggestedStrongChapter,
  getSuggestedWeakChapter,
  JEE_CHAPTERS,
} from "@/lib/diagnostic/chapter-suggestions";
import { Subject } from "@prisma/client";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // Check if a diagnostic session already exists
  const existing = await prisma.diagnosticSession.findUnique({
    where: { userId },
  });

  if (existing?.status === "COMPLETED" || existing?.status === "SKIPPED") {
    return NextResponse.json({ alreadyDone: true });
  }

  // Fetch student profile for subject preferences
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const strongSubjects = profile?.strongSubjects ?? [];
  const weakSubjects = profile?.weakSubjects ?? [];

  const strongSuggestion = getSuggestedStrongChapter(strongSubjects);
  const weakSuggestion = getSuggestedWeakChapter(weakSubjects);

  // Build chapter list per subject for dropdowns
  const chaptersBySubject = {
    PHYSICS: JEE_CHAPTERS[Subject.PHYSICS],
    CHEMISTRY: JEE_CHAPTERS[Subject.CHEMISTRY],
    MATH: JEE_CHAPTERS[Subject.MATH],
  };

  // Create or return existing IN_PROGRESS session
  if (!existing) {
    await prisma.diagnosticSession.create({
      data: { userId },
    });
  }

  return NextResponse.json({
    alreadyDone: false,
    profile: {
      name: session.user.name,
      examAttemptDate: profile?.examAttemptDate,
      strongSubjects,
      weakSubjects,
      previousScore: profile?.previousScore,
      dailyStudyHours: profile?.dailyStudyHours,
    },
    strongSuggestion,
    weakSuggestion,
    chaptersBySubject,
  });
}
