import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAIProvider } from "@/lib/ai/client";
import { buildSystemPrompt } from "@/lib/nova/prompts";
import { buildNovaContext } from "@/lib/nova/context-builder";
import {
  extractOnboardingData,
  saveOnboardingStep,
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

  // Get user profile for onboarding step
  const profile = await prisma.userProfile.findUnique({ where: { userId } });
  const currentStep = profile?.onboardingStep ?? 0;
  const isOnboarding = mode === "ONBOARDING" && !profile?.onboardingCompleted;

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
            metadata: { mode, onboardingStep: currentStep },
          },
        });

        // Handle onboarding parsing
        if (isOnboarding && currentStep >= 1 && currentStep <= 5) {
          try {
            const extracted = await extractOnboardingData(message, currentStep);
            if (extracted) {
              const newStep = await saveOnboardingStep(
                userId,
                currentStep,
                extracted
              );
              // If step 5 complete, generate workflow
              if (newStep >= 5) {
                await completeOnboarding(userId);
              }
            }
          } catch (err) {
            console.error("Onboarding parsing error:", err);
          }
        } else if (isOnboarding && currentStep === 0) {
          // Advance past intro step
          await prisma.userProfile.upsert({
            where: { userId },
            update: { onboardingStep: 1 },
            create: { userId, onboardingStep: 1 },
          });
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
