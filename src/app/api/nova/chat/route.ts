import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/nova/prompts";
import { buildNovaContext } from "@/lib/nova/context-builder";
import {
  detectOnboardingComplete,
  extractHolisticOnboardingData,
  saveHolisticOnboardingData,
  completeOnboarding,
} from "@/lib/nova/onboarding-parser";
import type { NovaMode } from "@/lib/nova/prompts";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { message, mode = "COMPANION" } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  // Fetch conversation history (last 20 messages)
  const history = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const messages = history
    .reverse()
    .map((m) => ({ role: m.role.toLowerCase() as "user" | "assistant", content: m.content }));

  // Add the new user message
  messages.push({ role: "user", content: message });

  // Save user message
  await prisma.chatMessage.create({
    data: {
      userId,
      role: "USER",
      content: message,
    },
  });

  // Build context
  const context = await buildNovaContext(userId);
  const systemPrompt = buildSystemPrompt(mode as NovaMode, context);

  const ai = getAIProvider();
  let fullResponse = "";

  // Check if onboarding is still active
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const isOnboarding = mode === "ONBOARDING" && !profile?.onboardingCompleted;

  // Count real onboarding messages (exclude sentinels) for fallback completion
  const realMessageCount = history.filter(
    (m) =>
      m.content !== "__NOVA_INIT__" &&
      !m.content.includes("__NOVA_ONBOARDING_COMPLETE__")
  ).length;

  try {
    const stream = await ai.streamChat(messages, systemPrompt);

    // Collect the full response for post-processing
    const [streamForClient, streamForCapture] = stream.tee();

    // Process capture stream in background
    (async () => {
      const reader = streamForCapture.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      } finally {
        reader.releaseLock();

        // Save assistant message
        await prisma.chatMessage.create({
          data: {
            userId,
            role: "ASSISTANT",
            content: fullResponse,
            metadata: { mode },
          },
        });

        // Handle onboarding completion via sentinel detection or message count fallback
        const shouldComplete =
          isOnboarding &&
          (detectOnboardingComplete(fullResponse) || realMessageCount >= 14);

        if (shouldComplete) {
          // Fetch full conversation transcript for holistic extraction
          const fullHistory = await prisma.chatMessage.findMany({
            where: { userId },
            orderBy: { createdAt: "asc" },
            select: { role: true, content: true },
          });
          const transcript = fullHistory.map((m) => ({
            role: m.role.toLowerCase() as "user" | "assistant",
            content: m.content,
          }));

          try {
            const extracted = await extractHolisticOnboardingData(transcript);
            await saveHolisticOnboardingData(userId, extracted);
          } catch (err) {
            console.error("Holistic onboarding extraction failed:", err);
          }

          // Always complete onboarding even if extraction partially fails
          await completeOnboarding(userId);
        }
      }
    })();

    return new Response(streamForClient, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "X-Nova-Mode": mode,
      },
    });
  } catch (err) {
    console.error("Nova chat error:", err);
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 503 }
    );
  }
}
