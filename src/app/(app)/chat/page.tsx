"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ChatWindow } from "@/components/nova/ChatWindow";
import { OnboardingChat } from "@/components/nova/OnboardingChat";
import { useNovaChat } from "@/hooks/useNovaChat";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { status: sessionStatus } = useSession();
  const onboardingCompleted = session?.user.onboardingCompleted ?? false;
  // Don't derive mode until session is resolved — prevents hook from getting wrong initial mode
  const mode = sessionStatus === "loading"
    ? "ONBOARDING"
    : onboardingCompleted ? "COMPANION" : "ONBOARDING";

  const { messages, isLoading, isHistoryLoading, sendMessage, stopStreaming } =
    useNovaChat(mode);

  const redirectPendingRef = useRef(false);
  // Track whether we have started polling so we don't restart when onboardingCompleted flips
  const pollingStartedRef = useRef(false);

  // Fire Nova's greeting only after session + history both loaded and no prior messages
  useEffect(() => {
    if (sessionStatus === "loading" || isHistoryLoading) return;
    if (messages.length === 0 && !onboardingCompleted) {
      const timer = setTimeout(() => {
        sendMessage("__NOVA_INIT__");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sessionStatus, isHistoryLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll for onboarding completion every 5s — starts once session is loaded, runs until complete
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (onboardingCompleted || redirectPendingRef.current) return;
    if (pollingStartedRef.current) return; // already polling — don't restart
    pollingStartedRef.current = true;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/nova/onboarding-status");
        if (!res.ok) return;
        const { completed } = await res.json();
        if (completed && !redirectPendingRef.current) {
          redirectPendingRef.current = true;
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ["session"] });
          setTimeout(() => {
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            router.push("/diagnostic");
          }, 3000);
        }
      } catch {
        // ignore poll errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionStatus]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = async (message: string) => {
    await sendMessage(message);
  };

  if (mode === "ONBOARDING") {
    return (
      <OnboardingChat
        messages={messages}
        isLoading={isLoading}
        onSend={handleSend}
        onStop={stopStreaming}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-foreground">Nova</h1>
          <p className="text-xs text-muted-foreground">Your study companion</p>
        </div>
      </div>

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        mode={mode}
        onSend={handleSend}
        onStop={stopStreaming}
        showWelcome={messages.length === 0}
      />
    </div>
  );
}
