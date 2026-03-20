import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const messages = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    take: 50,
    select: { id: true, role: true, content: true },
  });

  return NextResponse.json({
    messages: messages.map((m) => ({
      id: m.id,
      role: m.role.toLowerCase() as "user" | "assistant",
      content: m.content,
    })),
  });
}
