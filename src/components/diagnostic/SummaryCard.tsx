"use client";

import { Button } from "@/components/ui/button";
import { Zap, Calendar, BookOpen, Target, Clock } from "lucide-react";

interface ProfileData {
  name?: string | null;
  examAttemptDate?: string | null;
  strongSubjects?: string[];
  weakSubjects?: string[];
  previousScore?: number | null;
  dailyStudyHours?: number | null;
}

interface SummaryCardProps {
  profile: ProfileData;
  onStart: () => void;
  onSkip: () => void;
  isSkipping: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function subjectLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

export function SummaryCard({ profile, onStart, onSkip, isSkipping }: SummaryCardProps) {
  const name = profile.name?.split(" ")[0] ?? "there";
  const days = profile.examAttemptDate ? daysUntil(profile.examAttemptDate) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        {/* Nova avatar + greeting */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Nova</p>
            <p className="text-xs text-muted-foreground">Your study companion</p>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">
          Great talking with you, {name}!
        </h1>
        <p className="text-muted-foreground mb-6">
          Here&apos;s what I understand about you so far.
        </p>

        {/* Profile summary card */}
        <div className="bg-card border border-border rounded-2xl p-5 mb-6 space-y-3">
          {profile.examAttemptDate && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <span className="text-sm text-foreground font-medium">
                  {formatDate(profile.examAttemptDate)}
                </span>
                {days !== null && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({days} days left)
                  </span>
                )}
              </div>
            </div>
          )}

          {profile.strongSubjects && profile.strongSubjects.length > 0 && (
            <div className="flex items-start gap-3">
              <Target className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground">Strong in </span>
                <span className="text-sm font-medium text-emerald-600">
                  {profile.strongSubjects.map(subjectLabel).join(", ")}
                </span>
              </div>
            </div>
          )}

          {profile.weakSubjects && profile.weakSubjects.length > 0 && (
            <div className="flex items-start gap-3">
              <BookOpen className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground">Working on </span>
                <span className="text-sm font-medium text-amber-600">
                  {profile.weakSubjects.map(subjectLabel).join(", ")}
                </span>
              </div>
            </div>
          )}

          {profile.previousScore !== null && profile.previousScore !== undefined && (
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-blue-500 shrink-0" />
              <span className="text-sm text-foreground">
                Previous score:{" "}
                <span className="font-medium">{profile.previousScore}/300</span>
              </span>
            </div>
          )}

          {profile.dailyStudyHours && (
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground">
                <span className="font-medium">{profile.dailyStudyHours}h</span> daily study time
              </span>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-foreground mb-1">
            Let&apos;s verify this with a quick test
          </p>
          <p className="text-sm text-muted-foreground">
            12 questions from your strong subject · ~8 minutes · No pressure
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button size="lg" className="w-full" onClick={onStart}>
            Start Quick Test
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onSkip}
            disabled={isSkipping}
          >
            {isSkipping ? "Setting up dashboard..." : "Skip, go to dashboard"}
          </Button>
        </div>
      </div>
    </div>
  );
}
