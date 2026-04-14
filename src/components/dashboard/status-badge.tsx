import { cn } from "@/lib/utils";

export type StatusLevel = "healthy" | "attention" | "urgent" | "ai" | "neutral";

const levelStyles: Record<StatusLevel, string> = {
  healthy: "bg-[var(--status-healthy-bg)] text-[var(--status-healthy-fg)]",
  attention: "bg-[var(--status-attention-bg)] text-[var(--status-attention-fg)]",
  urgent: "bg-[var(--status-urgent-bg)] text-[var(--status-urgent-fg)]",
  ai: "bg-[var(--status-ai-bg)] text-[var(--status-ai-fg)]",
  neutral: "bg-muted text-muted-foreground",
};

interface StatusBadgeProps {
  level: StatusLevel;
  children: React.ReactNode;
  className?: string;
}

export function StatusBadge({ level, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        levelStyles[level],
        className
      )}
    >
      {children}
    </span>
  );
}

export function scoreLevel(score: number | null | undefined): StatusLevel {
  if (score == null) return "neutral";
  if (score >= 70) return "healthy";
  if (score >= 40) return "attention";
  return "urgent";
}

export function ScoreBar({ score, showValue = true }: { score: number | null | undefined; showValue?: boolean }) {
  const level = scoreLevel(score);
  const colorVar =
    level === "healthy"
      ? "var(--status-healthy)"
      : level === "attention"
        ? "var(--status-attention)"
        : level === "urgent"
          ? "var(--status-urgent)"
          : "var(--muted-foreground)";

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${score ?? 0}%`, background: colorVar }}
        />
      </div>
      {showValue && (
        <span className="num text-xs font-medium text-foreground w-7 text-right">
          {score ?? "—"}
        </span>
      )}
    </div>
  );
}
