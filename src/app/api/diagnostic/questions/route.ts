import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Subject } from "@prisma/client";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { subject, chapter, count = 12 } = await req.json();

  if (!subject || !chapter) {
    return NextResponse.json(
      { error: "subject and chapter are required" },
      { status: 400 }
    );
  }

  // Validate subject
  if (!Object.values(Subject).includes(subject)) {
    return NextResponse.json({ error: "Invalid subject" }, { status: 400 });
  }

  const questions = await prisma.question.findMany({
    where: { subject, chapter },
    select: {
      id: true,
      subject: true,
      chapter: true,
      topic: true,
      content: true,
      questionType: true,
      options: true,
      difficulty: true,
      // correctOption and explanation are intentionally excluded
    },
  });

  if (!questions.length) {
    return NextResponse.json(
      { error: "No questions found for this chapter" },
      { status: 404 }
    );
  }

  // Shuffle and limit to requested count
  const selected = shuffle(questions).slice(0, count);

  // Shuffle options for each MCQ question to prevent ordering bias
  const result = selected.map((q) => ({
    ...q,
    options:
      Array.isArray(q.options) && q.options.length > 0
        ? shuffle(q.options as { label: string; text: string }[])
        : [],
  }));

  return NextResponse.json({ questions: result });
}
