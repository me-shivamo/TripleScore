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
import { LayoutDashboard } from "lucide-react";

interface TestResult {
  subject: string;
  chapter: string;
  masteryScore: number;
  correctCount: number;
  totalCount: number;
}

interface FinalSummaryProps {
  test1: TestResult;
  test2: TestResult;
  onDashboard: () => void;
}

function SubjectRow({ result }: { result: TestResult }) {
  const label = getMasteryLabel(result.masteryScore);
  const color = getMasteryColor(label);
  const bg = getMasteryBg(label);
  const pct = Math.round(result.masteryScore * 100);

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground mb-0.5">
          {result.subject.charAt(0) + result.subject.slice(1).toLowerCase()}
        </p>
        <p className="text-sm font-semibold text-foreground truncate">{result.chapter}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {result.correctCount}/{result.totalCount} correct
        </p>
      </div>
      <div className={cn("flex flex-col items-center shrink-0 rounded-xl border px-3 py-2", bg)}>
        <span className={cn("text-lg font-bold", color)}>{pct}%</span>
        <span className={cn("text-xs font-medium", color)}>{label}</span>
      </div>
    </div>
  );
}

export function FinalSummary({ test1, test2, onDashboard }: FinalSummaryProps) {
  const label1 = getMasteryLabel(test1.masteryScore);
  const label2 = getMasteryLabel(test2.masteryScore);

  const gap = Math.round((test1.masteryScore - test2.masteryScore) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full mb-4">
            Diagnostic Complete
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Your baseline is ready
          </h1>
          <p className="text-muted-foreground text-sm">
            Your personalized study plan is now set up based on this.
          </p>
        </div>

        {/* Results */}
        <div className="space-y-3 mb-6">
          <SubjectRow result={test1} />
          <SubjectRow result={test2} />
        </div>

        {/* Nova summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
          <p className="text-xs font-medium text-primary mb-1">Nova&apos;s take</p>
          {gap > 20 ? (
            <p className="text-sm text-foreground leading-relaxed">
              You&apos;re <span className="font-medium">{label1}</span> in{" "}
              {test1.chapter} but <span className="font-medium">{label2}</span> in{" "}
              {test2.chapter} — a {gap}% gap to close. Your study plan prioritizes{" "}
              {test2.subject.charAt(0) + test2.subject.slice(1).toLowerCase()} practice
              while keeping your {test1.subject.charAt(0) + test1.subject.slice(1).toLowerCase()} edge sharp.
            </p>
          ) : (
            <p className="text-sm text-foreground leading-relaxed">
              You&apos;re well-balanced! Both areas are at a similar level. The plan will
              push you forward on all fronts with targeted practice.
            </p>
          )}
        </div>

        <Button size="lg" className="w-full" onClick={onDashboard}>
          <LayoutDashboard className="w-4 h-4 mr-2" />
          Go to Dashboard
        </Button>
      </div>
    </div>
  );
}
