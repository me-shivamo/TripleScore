export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1 px-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-muted-foreground"
          style={{
            animation: "typing-dot 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
