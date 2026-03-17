"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Square } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (message: string) => void;
  onStop: () => void;
  isLoading: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
  placeholder = "Message Nova...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!value.trim() || isLoading) return;
    onSend(value.trim());
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
  };

  return (
    <div className="flex items-end gap-2 p-4 border-t border-border bg-card/50 backdrop-blur-sm">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl border border-input bg-secondary/50 px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition-colors min-h-[44px] max-h-40",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {isLoading ? (
        <Button
          onClick={onStop}
          variant="outline"
          size="icon"
          className="shrink-0 rounded-xl h-11 w-11"
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      ) : (
        <Button
          onClick={handleSend}
          disabled={!value.trim() || disabled}
          variant="gradient"
          size="icon"
          className="shrink-0 rounded-xl h-11 w-11"
        >
          <SendHorizonal className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
