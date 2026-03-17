"use client";

interface ReadinessScoreProps {
  score: number;
  daysUntilExam?: number | null;
}

export function ReadinessScore({ score, daysUntilExam }: ReadinessScoreProps) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 70) return "hsl(142, 69%, 38%)";
    if (score >= 40) return "hsl(43, 96%, 40%)";
    return "hsl(0, 72%, 51%)";
  };

  const getLabel = () => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    if (score >= 40) return "Building";
    return "Starting";
  };

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          {/* Track */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke="hsl(220, 13%, 91%)"
            strokeWidth="8"
          />
          {/* Progress */}
          <circle
            cx="64"
            cy="64"
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            style={{ transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>

        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-serif font-bold text-foreground">{score}</span>
          <span className="text-xs text-muted-foreground">/ 100</span>
        </div>
      </div>

      <div className="text-center">
        <p
          className="text-sm font-semibold"
          style={{ color: getColor() }}
        >
          {getLabel()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">JEE Readiness</p>
        {daysUntilExam !== null && daysUntilExam !== undefined && (
          <p className="text-xs text-muted-foreground mt-1">
            {daysUntilExam > 0
              ? `${daysUntilExam} days to exam`
              : "Exam day!"}
          </p>
        )}
      </div>
    </div>
  );
}
