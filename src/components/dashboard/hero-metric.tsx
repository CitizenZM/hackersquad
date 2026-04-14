import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroMetricProps {
  label: string;
  value: string | number | null | undefined;
  suffix?: string;
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  icon?: ReactNode;
}

export function HeroMetric({
  label,
  value,
  suffix,
  delta,
  deltaLabel,
  hint,
  icon,
}: HeroMetricProps) {
  const hasDelta = typeof delta === "number";
  const positive = hasDelta && delta! > 0;
  const negative = hasDelta && delta! < 0;

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wider font-medium text-muted-foreground">
          {label}
        </p>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tracking-tight num">
          {value ?? "—"}
        </span>
        {suffix && (
          <span className="text-sm text-muted-foreground">{suffix}</span>
        )}
      </div>
      {(hasDelta || hint) && (
        <div className="mt-2 flex items-center gap-2 text-xs">
          {hasDelta && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                positive && "text-[var(--status-healthy-fg)]",
                negative && "text-[var(--status-urgent-fg)]",
                !positive && !negative && "text-muted-foreground"
              )}
            >
              {positive ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : negative ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : (
                <Minus className="h-3 w-3" />
              )}
              {Math.abs(delta!).toFixed(1)}%
            </span>
          )}
          {deltaLabel && (
            <span className="text-muted-foreground">{deltaLabel}</span>
          )}
          {hint && !hasDelta && (
            <span className="text-muted-foreground">{hint}</span>
          )}
        </div>
      )}
    </div>
  );
}
