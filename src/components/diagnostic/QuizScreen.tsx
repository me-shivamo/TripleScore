"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronRight, SkipForward } from "lucide-react";

interface QuestionOption {
  label: string;
  text: string;
}

export interface DiagnosticQuestion {
  id: string;
  subject: string;
  chapter: string;
  topic: string;
  content: string;
  questionType: "MCQ" | "INTEGER";
  options: QuestionOption[];
  difficulty: "EASY" | "MEDIUM" | "HARD";
}

export interface QuestionResult {
  questionId: string;
  selectedOption: string | null;
  timeTakenSecs: number;
}

interface QuizScreenProps {
  questions: DiagnosticQuestion[];
  subject: string;
  chapter: string;
  onComplete: (results: QuestionResult[]) => void;
}

const DIFFICULTY_COLOR = {
  EASY: "text-emerald-600 bg-emerald-50",
  MEDIUM: "text-amber-600 bg-amber-50",
  HARD: "text-red-600 bg-red-50",
};

type AnswerState = "idle" | "selected" | "confirmed";

export function QuizScreen({ questions, subject, chapter, onComplete }: QuizScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>("idle");
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [flashCorrect, setFlashCorrect] = useState<boolean | null>(null);
  const [integerInput, setIntegerInput] = useState("");
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [elapsedSecs, setElapsedSecs] = useState(0);
  const questionStartRef = useRef(Date.now());

  const current = questions[currentIndex];
  const progress = (currentIndex / questions.length) * 100;

  // Timer per question
  useEffect(() => {
    setElapsedSecs(0);
    questionStartRef.current = Date.now();
    const interval = setInterval(() => {
      setElapsedSecs(Math.floor((Date.now() - questionStartRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  // Reset state on question change
  useEffect(() => {
    setAnswerState("idle");
    setSelectedOption(null);
    setIntegerInput("");
    setFlashCorrect(null);
  }, [currentIndex]);

  const handleSelect = (option: string) => {
    if (answerState !== "idle") return;
    setSelectedOption(option);
    setAnswerState("selected");
  };

  const handleConfirm = () => {
    if (answerState !== "selected") return;
    const timeTaken = Math.floor((Date.now() - questionStartRef.current) / 1000);
    const answer =
      current.questionType === "INTEGER" ? integerInput || null : selectedOption;

    setAnswerState("confirmed");

    // Brief flash (300ms) then advance
    setTimeout(() => {
      const newResult: QuestionResult = {
        questionId: current.id,
        selectedOption: answer,
        timeTakenSecs: timeTaken,
      };
      const newResults = [...results, newResult];
      setResults(newResults);

      if (currentIndex + 1 >= questions.length) {
        onComplete(newResults);
      } else {
        setCurrentIndex(currentIndex + 1);
      }
    }, 350);
  };

  const handleSkip = () => {
    const timeTaken = Math.floor((Date.now() - questionStartRef.current) / 1000);
    const newResult: QuestionResult = {
      questionId: current.id,
      selectedOption: null,
      timeTakenSecs: timeTaken,
    };
    const newResults = [...results, newResult];
    setResults(newResults);

    if (currentIndex + 1 >= questions.length) {
      onComplete(newResults);
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}:${sec.toString().padStart(2, "0")}` : `${sec}s`;
  };

  const isIntegerSelected = current.questionType === "INTEGER" && integerInput.trim() !== "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top bar */}
      <div className="px-4 pt-4 pb-3 border-b border-border">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-medium text-muted-foreground">{subject} · {chapter}</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", DIFFICULTY_COLOR[current.difficulty])}>
                {current.difficulty}
              </span>
              <span className="font-mono">{formatTime(elapsedSecs)}</span>
              <span className="font-medium text-foreground">
                {currentIndex + 1}/{questions.length}
              </span>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-start justify-center px-4 pt-8 pb-4">
        <div className="w-full max-w-lg">
          <div className="mb-2">
            <span className="text-xs text-muted-foreground">Topic: {current.topic}</span>
          </div>

          <p className="text-base font-medium text-foreground leading-relaxed mb-8">
            {current.content}
          </p>

          {current.questionType === "MCQ" ? (
            <div className="space-y-3">
              {current.options.map((opt) => {
                const isSelected = selectedOption === opt.label;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(opt.label)}
                    disabled={answerState === "confirmed"}
                    className={cn(
                      "w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border transition-all text-sm",
                      answerState === "idle" || answerState === "selected"
                        ? isSelected
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card hover:border-primary/40 text-foreground"
                        : isSelected
                          ? "border-primary bg-primary/5 text-foreground opacity-60"
                          : "border-border bg-card text-foreground opacity-40"
                    )}
                  >
                    <span
                      className={cn(
                        "shrink-0 w-6 h-6 rounded-full border text-xs font-semibold flex items-center justify-center mt-0.5",
                        isSelected
                          ? "border-primary bg-primary text-white"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="leading-relaxed">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-sm text-muted-foreground">Enter your answer (integer):</label>
              <input
                type="number"
                value={integerInput}
                onChange={(e) => {
                  setIntegerInput(e.target.value);
                  if (e.target.value.trim()) setAnswerState("selected");
                  else setAnswerState("idle");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isIntegerSelected) handleConfirm();
                }}
                className="w-full bg-card border border-border rounded-xl px-4 py-3.5 text-lg font-mono text-foreground focus:outline-none focus:border-primary"
                placeholder="Type integer answer..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Bottom actions */}
      <div className="px-4 pb-6 pt-3 border-t border-border">
        <div className="max-w-lg mx-auto flex gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={answerState === "confirmed"}
            className="text-muted-foreground"
          >
            <SkipForward className="w-4 h-4 mr-1.5" />
            Skip
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
            disabled={answerState === "idle" || answerState === "confirmed"}
          >
            {answerState === "confirmed" ? (
              "Loading..."
            ) : currentIndex + 1 >= questions.length ? (
              <>Finish <ChevronRight className="w-4 h-4 ml-1" /></>
            ) : (
              <>Confirm <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
