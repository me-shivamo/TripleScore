"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SummaryCard } from "@/components/diagnostic/SummaryCard";
import { ChapterSelector } from "@/components/diagnostic/ChapterSelector";
import { QuizScreen, QuestionResult, DiagnosticQuestion } from "@/components/diagnostic/QuizScreen";
import { TestResults } from "@/components/diagnostic/TestResults";
import { FinalSummary } from "@/components/diagnostic/FinalSummary";

type Screen =
  | "loading"
  | "summary"
  | "test1-select"
  | "test1-quiz"
  | "test1-results"
  | "test2-select"
  | "test2-quiz"
  | "final-results";

interface StartData {
  alreadyDone: boolean;
  profile: {
    name?: string | null;
    examAttemptDate?: string | null;
    strongSubjects?: string[];
    weakSubjects?: string[];
    previousScore?: number | null;
    dailyStudyHours?: number | null;
  };
  strongSuggestion: { subject: string; chapter: string } | null;
  weakSuggestion: { subject: string; chapter: string } | null;
  chaptersBySubject: Record<string, string[]>;
}

interface SubmitResult {
  score: { correct: number; total: number };
  masteryScore: number;
}

export default function DiagnosticPage() {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>("loading");
  const [startData, setStartData] = useState<StartData | null>(null);

  // Test 1 state
  const [test1Subject, setTest1Subject] = useState("");
  const [test1Chapter, setTest1Chapter] = useState("");
  const [test1Questions, setTest1Questions] = useState<DiagnosticQuestion[]>([]);
  const [test1Result, setTest1Result] = useState<SubmitResult | null>(null);

  // Test 2 state
  const [test2Subject, setTest2Subject] = useState("");
  const [test2Chapter, setTest2Chapter] = useState("");
  const [test2Questions, setTest2Questions] = useState<DiagnosticQuestion[]>([]);
  const [test2Result, setTest2Result] = useState<SubmitResult | null>(null);

  const [isSkipping, setIsSkipping] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load diagnostic session on mount
  useEffect(() => {
    fetch("/api/diagnostic/start", { method: "POST" })
      .then((r) => r.json())
      .then((data: StartData) => {
        if (data.alreadyDone) {
          router.replace("/dashboard");
          return;
        }
        setStartData(data);
        setScreen("summary");

        // Pre-set suggestions
        if (data.strongSuggestion) {
          setTest1Subject(data.strongSuggestion.subject);
          setTest1Chapter(data.strongSuggestion.chapter);
        }
        if (data.weakSuggestion) {
          setTest2Subject(data.weakSuggestion.subject);
          setTest2Chapter(data.weakSuggestion.chapter);
        }
      })
      .catch(() => router.replace("/dashboard"));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSkip = async () => {
    setIsSkipping(true);
    await fetch("/api/diagnostic/skip", { method: "POST" });
    router.push("/dashboard");
  };

  const loadQuestions = async (subject: string, chapter: string) => {
    const res = await fetch("/api/diagnostic/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, chapter, count: 12 }),
    });
    const data = await res.json();
    return data.questions as DiagnosticQuestion[];
  };

  // ── Test 1 ──────────────────────────────────────────────────────────────────

  const handleTest1ChapterConfirm = async (subject: string, chapter: string) => {
    setTest1Subject(subject);
    setTest1Chapter(chapter);
    const qs = await loadQuestions(subject, chapter);
    setTest1Questions(qs);
    setScreen("test1-quiz");
  };

  const handleTest1Complete = async (results: QuestionResult[]) => {
    setIsSubmitting(true);
    const res = await fetch("/api/diagnostic/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testNumber: 1,
        subject: test1Subject,
        chapter: test1Chapter,
        attempts: results,
      }),
    });
    const data: SubmitResult = await res.json();
    setTest1Result(data);
    setIsSubmitting(false);
    setScreen("test1-results");
  };

  // ── Test 2 ──────────────────────────────────────────────────────────────────

  const handleTest2ChapterConfirm = async (subject: string, chapter: string) => {
    setTest2Subject(subject);
    setTest2Chapter(chapter);
    const qs = await loadQuestions(subject, chapter);
    setTest2Questions(qs);
    setScreen("test2-quiz");
  };

  const handleTest2Complete = async (results: QuestionResult[]) => {
    setIsSubmitting(true);
    const res = await fetch("/api/diagnostic/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testNumber: 2,
        subject: test2Subject,
        chapter: test2Chapter,
        attempts: results,
      }),
    });
    const data: SubmitResult = await res.json();
    setTest2Result(data);
    setIsSubmitting(false);
    setScreen("final-results");
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  if (screen === "loading" || !startData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm">Setting up your diagnostic...</p>
        </div>
      </div>
    );
  }

  if (screen === "summary") {
    return (
      <SummaryCard
        profile={startData.profile}
        onStart={() => setScreen("test1-select")}
        onSkip={handleSkip}
        isSkipping={isSkipping}
      />
    );
  }

  if (screen === "test1-select") {
    if (!startData.strongSuggestion) {
      // No strong subject — skip directly to test2
      setScreen("test2-select");
      return null;
    }
    return (
      <ChapterSelector
        testNumber={1}
        suggestedSubject={startData.strongSuggestion.subject}
        suggestedChapter={startData.strongSuggestion.chapter}
        availableChapters={
          startData.chaptersBySubject[startData.strongSuggestion.subject] ?? []
        }
        onConfirm={handleTest1ChapterConfirm}
      />
    );
  }

  if (screen === "test1-quiz") {
    return (
      <QuizScreen
        questions={test1Questions}
        subject={test1Subject}
        chapter={test1Chapter}
        onComplete={handleTest1Complete}
      />
    );
  }

  if (screen === "test1-results" && test1Result) {
    return (
      <TestResults
        testNumber={1}
        subject={test1Subject}
        chapter={test1Chapter}
        correctCount={test1Result.score.correct}
        totalCount={test1Result.score.total}
        masteryScore={test1Result.masteryScore}
        onContinue={() =>
          startData.weakSuggestion
            ? setScreen("test2-select")
            : setScreen("final-results")
        }
        onSkip={handleSkip}
        continueLabel={
          startData.weakSuggestion
            ? "Test My Weak Area"
            : "Go to Dashboard"
        }
        isLoading={isSubmitting}
      />
    );
  }

  if (screen === "test2-select") {
    if (!startData.weakSuggestion) {
      router.push("/dashboard");
      return null;
    }
    return (
      <ChapterSelector
        testNumber={2}
        suggestedSubject={startData.weakSuggestion.subject}
        suggestedChapter={startData.weakSuggestion.chapter}
        availableChapters={
          startData.chaptersBySubject[startData.weakSuggestion.subject] ?? []
        }
        onConfirm={handleTest2ChapterConfirm}
      />
    );
  }

  if (screen === "test2-quiz") {
    return (
      <QuizScreen
        questions={test2Questions}
        subject={test2Subject}
        chapter={test2Chapter}
        onComplete={handleTest2Complete}
      />
    );
  }

  if (screen === "final-results" && test1Result) {
    return (
      <FinalSummary
        test1={{
          subject: test1Subject,
          chapter: test1Chapter,
          masteryScore: test1Result.masteryScore,
          correctCount: test1Result.score.correct,
          totalCount: test1Result.score.total,
        }}
        test2={
          test2Result
            ? {
                subject: test2Subject,
                chapter: test2Chapter,
                masteryScore: test2Result.masteryScore,
                correctCount: test2Result.score.correct,
                totalCount: test2Result.score.total,
              }
            : {
                subject: test1Subject,
                chapter: test1Chapter,
                masteryScore: test1Result.masteryScore,
                correctCount: test1Result.score.correct,
                totalCount: test1Result.score.total,
              }
        }
        onDashboard={() => router.push("/dashboard")}
      />
    );
  }

  // Fallback
  router.push("/dashboard");
  return null;
}
