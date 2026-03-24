"use client";

import { Button } from "@/components/ui/button";
function getMasteryLabel(score: number) {
  if (score >= 0.76) return "Strong";
  if (score >= 0.51) return "Proficient";
  if (score >= 0.26) return "Developing";
  return "Needs Work";
}
function getMasteryColor(label: string) {
  if (label === "Strong") return "text-emerald-600";
  if (label === "Proficient") return "text-blue-600";
  if (label === "Developing") return "text-amber-600";
  return "text-red-600";
}
function getMasteryBg(label: string) {
  if (label === "Strong") return "border-emerald-200 bg-emerald-50";
  if (label === "Proficient") return "border-blue-200 bg-blue-50";
  if (label === "Developing") return "border-amber-200 bg-amber-50";
  return "border-red-200 bg-red-50";
}
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, ChevronRight, ArrowRight } from "lucide-react";

interface TestResultsProps {
  testNumber: 1 | 2;
  subject: string;
  chapter: string;
  correctCount: number;
  totalCount: number;
  masteryScore: number;
  onContinue: () => void;
  onSkip?: () => void;
  continueLabel: string;
  isLoading: boolean;
}

function getNovaInsight(
  subject: string,
  chapter: string,
  masteryScore: number,
  correctCount: number,
  total: number
): string {
  const label = getMasteryLabel(masteryScore);
  const pct = Math.round((correctCount / total) * 100);

  if (label === "Strong") {
    return `Excellent work on ${chapter}! Your ${pct}% accuracy confirms this is a genuine strength. Keep it sharp — JEE questions in this area can be tricky at the HARD level.`;
  }
  if (label === "Proficient") {
    return `Solid understanding of ${chapter}. You're getting most concepts right. A focused revision of the harder topics here will take you from good to excellent.`;
  }
  if (label === "Developing") {
    return `You have a foundation in ${chapter}, but there are gaps to address. Your study plan will include targeted practice for the weaker areas within this chapter.`;
  }
  return `${chapter} needs focused attention. Don't worry — this is exactly what the study plan is built for. We'll tackle it systematically.`;
}

export function TestResults({
  testNumber,
  subject,
  chapter,
  correctCount,
  totalCount,
  masteryScore,
  onContinue,
  onSkip,
  continueLabel,
  isLoading,
}: TestResultsProps) {
  const label = getMasteryLabel(masteryScore);
  const color = getMasteryColor(label);
  const bg = getMasteryBg(label);
  const pct = Math.round(masteryScore * 100);
  const insight = getNovaInsight(subject, chapter, masteryScore, correctCount, totalCount);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full mb-4">
            Test {testNumber} Complete
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">{chapter}</h1>
          <p className="text-sm text-muted-foreground">{subject.charAt(0) + subject.slice(1).toLowerCase()}</p>
        </div>

        {/* Score ring */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--secondary))" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke={masteryScore >= 0.76 ? "#10b981" : masteryScore >= 0.51 ? "#60a5fa" : masteryScore >= 0.26 ? "#fbbf24" : "#f87171"}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 42 * masteryScore} ${2 * Math.PI * 42 * (1 - masteryScore)}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">{pct}%</span>
              <span className={cn("text-xs font-medium", color)}>{label}</span>
            </div>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-foreground font-medium">{correctCount} correct</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2 text-sm">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-foreground font-medium">{totalCount - correctCount} incorrect / skipped</span>
          </div>
        </div>

        {/* Mastery badge */}
        <div className={cn("rounded-xl border px-4 py-3 mb-4 text-center", bg)}>
          <span className={cn("text-sm font-semibold", color)}>
            {chapter}: {label}
          </span>
        </div>

        {/* Nova insight */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8">
          <p className="text-xs font-medium text-muted-foreground mb-1">Nova&apos;s insight</p>
          <p className="text-sm text-foreground leading-relaxed">{insight}</p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Button
            size="lg"
            className="w-full"
            onClick={onContinue}
            disabled={isLoading}
          >
            {continueLabel}
            {testNumber === 1 ? (
              <ArrowRight className="w-4 h-4 ml-1.5" />
            ) : (
              <ChevronRight className="w-4 h-4 ml-1.5" />
            )}
          </Button>
          {onSkip && (
            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={onSkip}
              disabled={isLoading}
            >
              Skip to Dashboard
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
