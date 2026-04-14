import { ReactNode } from "react";

interface HeaderProps {
  title: string;
  status?: string;
  description?: string;
  actions?: ReactNode;
}

const statusStyles: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  RESEARCHING: "bg-[var(--status-ai-bg)] text-[var(--status-ai-fg)]",
  ANALYZED: "bg-[var(--status-healthy-bg)] text-[var(--status-healthy-fg)]",
  GENERATING: "bg-[var(--status-ai-bg)] text-[var(--status-ai-fg)]",
  COMPLETE: "bg-[var(--status-healthy-bg)] text-[var(--status-healthy-fg)]",
  ERROR: "bg-[var(--status-urgent-bg)] text-[var(--status-urgent-fg)]",
};

export function Header({ title, status, description, actions }: HeaderProps) {
  return (
    <div className="border-b border-border bg-background">
      <div className="px-4 py-5 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight truncate">
                {title}
              </h1>
              {status && (
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status] || "bg-muted text-muted-foreground"}`}
                >
                  {status.charAt(0) + status.slice(1).toLowerCase()}
                </span>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
