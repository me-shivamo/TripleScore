import { Flame, Zap, BookOpen, Target } from "lucide-react";

interface QuickStatsProps {
  streak: number;
  xpToday: number;
  questionsToday: number;
  accuracyToday: number;
}

export function QuickStats({
  streak,
  xpToday,
  questionsToday,
  accuracyToday,
}: QuickStatsProps) {
  const stats = [
    {
      label: "Streak",
      value: `${streak}d`,
      icon: Flame,
      color: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-100",
    },
    {
      label: "XP Today",
      value: `+${xpToday}`,
      icon: Zap,
      color: "text-amber-600",
      bg: "bg-amber-50",
      border: "border-amber-100",
    },
    {
      label: "Questions",
      value: questionsToday,
      icon: BookOpen,
      color: "text-blue-600",
      bg: "bg-blue-50",
      border: "border-blue-100",
    },
    {
      label: "Accuracy",
      value: `${accuracyToday}%`,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-100",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-3">
      {stats.map(({ label, value, icon: Icon, color, bg, border }) => (
        <div
          key={label}
          className={`flex flex-col items-center gap-2 p-3 rounded-xl border ${border} ${bg}`}
        >
          <div className="flex items-center justify-center">
            <Icon className={`w-4 h-4 ${color}`} />
          </div>
          <span className="text-base font-serif font-bold text-foreground">{value}</span>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{label}</span>
        </div>
      ))}
    </div>
  );
}
