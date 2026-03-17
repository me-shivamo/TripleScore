"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReadinessScore } from "@/components/dashboard/ReadinessScore";
import { MissionCard } from "@/components/dashboard/MissionCard";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, BookOpen, ClipboardList, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session && !session.user.onboardingCompleted) {
      router.push("/chat");
    }
  }, [session, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard");
      return res.json();
    },
    enabled: !!session?.user,
    refetchInterval: 60_000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const accuracyToday =
    data.todayStats.questionsAttempted > 0
      ? Math.round(
          (data.todayStats.questionsCorrect / data.todayStats.questionsAttempted) * 100
        )
      : 0;

  const completedMissions = data.missions.filter((m: any) => m.completed).length;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-2xl mx-auto">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">
          Welcome back, {session?.user.name?.split(" ")[0] ?? "there"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {completedMissions} of {data.missions.length} missions completed today
        </p>
      </div>

      {/* Readiness Score */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <ReadinessScore
              score={data.readinessScore ?? 0}
              daysUntilExam={data.daysUntilExam}
            />
            <div className="flex-1 w-full space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                  JEE Readiness
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Based on your accuracy, speed, syllabus coverage, and consistency.
                </p>
              </div>
              {data.profile.weakSubjects.length > 0 && (
                <div className="text-xs bg-red-50 text-red-600 border border-red-100 rounded-lg px-3 py-2">
                  Focus area: {data.profile.weakSubjects.join(", ")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <QuickStats
        streak={data.gamification.currentStreak}
        xpToday={data.todayStats.xpEarned}
        questionsToday={data.todayStats.questionsAttempted}
        accuracyToday={accuracyToday}
      />

      {/* Today's Missions */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Today&apos;s Missions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.missions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              No missions assigned yet. Start practicing to unlock missions.
            </p>
          ) : (
            data.missions.map((mission: any) => (
              <MissionCard key={mission.id} mission={mission} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <Link href="/practice">
          <Button
            variant="outline"
            className="w-full h-auto flex flex-col gap-2 py-5 rounded-xl hover:border-primary/40 hover:bg-primary/4"
          >
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Practice</span>
          </Button>
        </Link>
        <Link href="/mocks">
          <Button
            variant="outline"
            className="w-full h-auto flex flex-col gap-2 py-5 rounded-xl hover:border-primary/40 hover:bg-primary/4"
          >
            <ClipboardList className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Mock Test</span>
          </Button>
        </Link>
        <Link href="/chat">
          <Button
            variant="outline"
            className="w-full h-auto flex flex-col gap-2 py-5 rounded-xl hover:border-primary/40 hover:bg-primary/4"
          >
            <MessageCircle className="w-5 h-5 text-primary" />
            <span className="text-xs font-medium">Ask Nova</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
