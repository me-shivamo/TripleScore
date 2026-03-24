"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { apiStream } from "@/lib/api-client";
import { getHistory } from "@/services/nova";

export type NovaMode = "ONBOARDING" | "COMPANION" | "MOCK_ANALYSIS";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

// Module-level flag so history is only fetched once per page lifecycle,
// even across React Strict Mode double-invocations or hook re-initializations.
let historyFetchDone = false;

export function useNovaChat(initialMode: NovaMode = "COMPANION") {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(!historyFetchDone);
  const [mode, setMode] = useState<NovaMode>(initialMode);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Keep mode in sync if the parent re-derives it after session loads
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  // Load conversation history from backend on mount (once per page lifecycle)
  useEffect(() => {
    if (historyFetchDone) {
      setIsHistoryLoading(false);
      return;
    }
    historyFetchDone = true;

    getHistory()
      .then(({ messages: history }) => {
        const filtered = history
          .filter(
            (m) =>
              m.content !== "__NOVA_INIT__" &&
              !m.content.includes("__NOVA_ONBOARDING_COMPLETE__")
          )
          .map((m) => ({
            id: m.id,
            role: m.role as "user" | "assistant",
            content: m.content,
          }));
        setMessages(filtered);
      })
      .catch(() => {})
      .finally(() => setIsHistoryLoading(false));
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
      };

      const assistantId = `assistant-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      // Don't add the __NOVA_INIT__ sentinel to visible messages
      if (content.trim() !== "__NOVA_INIT__") {
        setMessages((prev) => [...prev, userMessage, assistantMessage]);
      } else {
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setIsLoading(true);

      abortControllerRef.current = new AbortController();

      try {
        const response = await apiStream("/nova/chat", { message: content.trim(), mode });

        if (!response.ok || !response.body) {
          throw new Error("Failed to get response from Nova");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;

          // Strip completion sentinel from displayed content
          const displayContent = accumulated
            .replace("__NOVA_ONBOARDING_COMPLETE__", "")
            .trim();

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: displayContent, isStreaming: true }
                : m
            )
          );
        }

        // Mark streaming as complete, final sentinel strip
        const finalContent = accumulated
          .replace("__NOVA_ONBOARDING_COMPLETE__", "")
          .trim();

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: finalContent, isStreaming: false }
              : m
          )
        );
      } catch (err: any) {
        if (err.name === "AbortError") return;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: "Sorry, I couldn't respond right now. Please try again.",
                  isStreaming: false,
                }
              : m
          )
        );
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [isLoading, mode]
  );

  const stopStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    isLoading,
    isHistoryLoading,
    mode,
    setMode,
    sendMessage,
    stopStreaming,
    clearMessages,
  };
}
