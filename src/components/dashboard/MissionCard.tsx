"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap, CheckCircle2 } from "lucide-react";
import { MissionData } from "@/types/api";

interface MissionCardProps {
  mission: MissionData;
}

export function MissionCard({ mission }: MissionCardProps) {
  const percentage = Math.min(
    Math.round((mission.progress / mission.target) * 100),
    100
  );

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-3 rounded-lg border transition-colors",
        mission.completed
          ? "border-emerald-100 bg-emerald-50/60"
          : "border-border bg-secondary/40"
      )}
    >
      {/* Status icon */}
      <div className="mt-0.5 shrink-0">
        {mission.completed ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 flex items-center justify-center">
            <span className="text-[8px] font-bold text-muted-foreground">
              {mission.type === "DAILY" ? "D" : "W"}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              mission.completed
                ? "text-muted-foreground line-through"
                : "text-foreground"
            )}
          >
            {mission.title}
          </p>
          <Badge variant="gold" className="shrink-0 text-[10px] py-0 px-1.5">
            <Zap className="w-2.5 h-2.5 mr-0.5" />
            {mission.xp_reward}
          </Badge>
        </div>

        {!mission.completed && (
          <>
            <p className="text-xs text-muted-foreground">{mission.description}</p>
            <div className="flex items-center gap-2">
              <Progress value={percentage} className="flex-1 h-1.5" />
              <span className="text-xs text-muted-foreground shrink-0">
                {mission.progress}/{mission.target}
              </span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
