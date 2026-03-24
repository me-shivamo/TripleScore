"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { NovaAvatar } from "./NovaAvatar";
import type { Message } from "@/hooks/useNovaChat";
import type { NovaMode } from "@/hooks/useNovaChat";

interface ChatWindowProps {
  messages: Message[];
  isLoading: boolean;
  mode: NovaMode;
  onSend: (message: string) => void;
  onStop: () => void;
  showWelcome?: boolean;
}

export function ChatWindow({
  messages,
  isLoading,
  mode,
  onSend,
  onStop,
  showWelcome = false,
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty && showWelcome && (
          <div className="flex flex-col items-center justify-center h-full py-16 text-center space-y-4 animate-fade-in">
            <NovaAvatar size="lg" />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">
                Hi there! 👋 I&apos;m Nova
              </h2>
              <p className="text-muted-foreground text-sm max-w-xs">
                I&apos;ll help you score better, stay accountable, and avoid
                mistakes in your exam. Let&apos;s get started!
              </p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        onSend={onSend}
        onStop={onStop}
        isLoading={isLoading}
        placeholder={
          mode === "ONBOARDING"
            ? "Tell Nova about yourself..."
            : "Ask Nova anything..."
        }
      />
    </div>
  );
}
