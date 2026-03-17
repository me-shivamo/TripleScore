import { cn } from "@/lib/utils";
import { NovaAvatar } from "./NovaAvatar";
import { TypingIndicator } from "./TypingIndicator";
import type { Message } from "@/hooks/useNovaChat";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const isEmpty = !message.content && message.isStreaming;

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {!isUser && (
        <NovaAvatar size="sm" isThinking={!!message.isStreaming} />
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-secondary text-foreground rounded-tl-sm"
        )}
      >
        {isEmpty ? (
          <TypingIndicator />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
          U
        </div>
      )}
    </div>
  );
}
