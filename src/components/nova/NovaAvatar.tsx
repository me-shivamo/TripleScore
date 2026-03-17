import { cn } from "@/lib/utils";

interface NovaAvatarProps {
  size?: "sm" | "md" | "lg";
  isThinking?: boolean;
  className?: string;
}

export function NovaAvatar({
  size = "md",
  isThinking = false,
  className,
}: NovaAvatarProps) {
  const sizes = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base",
    lg: "w-14 h-14 text-2xl",
  };

  return (
    <div
      className={cn(
        "rounded-full gradient-purple flex items-center justify-center shrink-0 select-none font-bold",
        isThinking && "animate-pulse-glow",
        sizes[size],
        className
      )}
    >
      ✦
    </div>
  );
}
