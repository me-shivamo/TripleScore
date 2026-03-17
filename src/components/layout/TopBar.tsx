"use client";

import { useSession } from "next-auth/react";
import { Flame, Zap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { getXPProgressToNextLevel, getLevelFromXP } from "@/lib/utils";

export function TopBar() {
  const { data: session } = useSession();

  const { data: gamification } = useQuery({
    queryKey: ["gamification"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return null;
      const data = await res.json();
      return data.gamification;
    },
    enabled: !!session?.user,
  });

  const xp = gamification?.xp ?? 0;
  const streak = gamification?.currentStreak ?? 0;
  const level = getLevelFromXP(xp);
  const progress = getXPProgressToNextLevel(xp);

  return (
    <header className="h-13 border-b border-border bg-white flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      {/* Mobile logo */}
      <div className="md:hidden flex items-center gap-2">
        <span className="font-serif font-bold text-base text-foreground tracking-tight">
          %/° TripleScore
        </span>
      </div>

      <div className="hidden md:block" />

      {/* Right side: XP + Streak */}
      <div className="flex items-center gap-5">
        {/* Streak */}
        {streak > 0 && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-medium text-foreground">{streak}</span>
          </div>
        )}

        {/* XP + Level */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Lv {level}
            </span>
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-sm font-medium text-foreground">{xp} XP</span>
          </div>
          <div className="w-20 hidden sm:block">
            <Progress value={progress.percentage} className="h-1" />
          </div>
        </div>
      </div>
    </header>
  );
}
