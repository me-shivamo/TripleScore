"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChapterSelectorProps {
  testNumber: 1 | 2;
  suggestedSubject: string;
  suggestedChapter: string;
  availableChapters: string[];
  onConfirm: (subject: string, chapter: string) => void;
}

function subjectLabel(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase();
}

function subjectColor(s: string) {
  if (s === "PHYSICS") return "text-blue-600";
  if (s === "CHEMISTRY") return "text-green-600";
  if (s === "MATH") return "text-purple-600";
  return "text-foreground";
}

export function ChapterSelector({
  testNumber,
  suggestedSubject,
  suggestedChapter,
  availableChapters,
  onConfirm,
}: ChapterSelectorProps) {
  const [selected, setSelected] = useState(suggestedChapter);
  const [open, setOpen] = useState(false);

  const isStrong = testNumber === 1;
  const label = isStrong ? "strong" : "weak";
  const emoji = isStrong ? "💪" : "📚";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="mb-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-secondary px-3 py-1 rounded-full">
            <Sparkles className="w-3 h-3" />
            Test {testNumber} of 2
          </span>
        </div>

        <h1 className="text-2xl font-bold text-foreground mt-4 mb-2">
          {isStrong
            ? "Let's start with your strength"
            : "Now let's look at an area to improve"}
        </h1>

        <p className="text-muted-foreground mb-8">
          {emoji} I&apos;ve picked a chapter from your {label} subject —{" "}
          <span className={cn("font-semibold", subjectColor(suggestedSubject))}>
            {subjectLabel(suggestedSubject)}
          </span>
          . You can change it below.
        </p>

        {/* Chapter selector */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
            Selected chapter
          </label>

          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="w-full flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3.5 text-sm font-medium text-foreground hover:border-primary/50 transition-colors"
            >
              <span>{selected}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  open && "rotate-180"
                )}
              />
            </button>

            {open && (
              <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {availableChapters.map((ch) => (
                  <button
                    key={ch}
                    onClick={() => {
                      setSelected(ch);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-secondary transition-colors first:rounded-t-xl last:rounded-b-xl",
                      ch === selected
                        ? "text-primary font-medium bg-primary/5"
                        : "text-foreground"
                    )}
                  >
                    {ch}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selected !== suggestedChapter && (
            <button
              onClick={() => setSelected(suggestedChapter)}
              className="mt-2 text-xs text-primary hover:underline"
            >
              Reset to Nova&apos;s suggestion ({suggestedChapter})
            </button>
          )}
        </div>

        {/* Info */}
        <div className="bg-secondary rounded-xl px-4 py-3 mb-6 text-sm text-muted-foreground">
          12 questions · Mix of Easy, Medium &amp; Hard · ~8 minutes
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => onConfirm(suggestedSubject, selected)}
        >
          Start — {selected}
        </Button>
      </div>
    </div>
  );
}
