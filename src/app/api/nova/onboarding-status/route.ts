import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { userId: session.user.id },
    select: { onboardingCompleted: true, onboardingStep: true },
  });

  return NextResponse.json({
    completed: profile?.onboardingCompleted ?? false,
    step: profile?.onboardingStep ?? 0,
  });
}
