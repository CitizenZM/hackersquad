"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ArrowRight,
  Play,
  Globe,
  Video,
  MessageSquare,
  Brain,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { name: "Crawling websites", icon: Globe },
  { name: "YouTube research", icon: Video },
  { name: "Collecting mentions", icon: MessageSquare },
  { name: "AI analysis", icon: Brain },
  { name: "Scoring content", icon: BarChart3 },
];

type Status = "idle" | "running" | "complete" | "error";

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.status === "ANALYZED" || data.status === "COMPLETE") {
        setStatus("complete");
        setProgress(100);
      } else if (data.status === "ERROR") {
        setStatus("error");
        setError("Research failed. Try again.");
      }
    } catch {
      /* ignore */
    }
  }, [projectId]);

  async function startResearch() {
    setStatus("running");
    setProgress(0);
    setError(null);

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 1000);

    try {
      const res = await fetch(`/api/projects/${projectId}/research`, { method: "POST" });
      clearInterval(progressInterval);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Research failed");
      }
      setProgress(100);
      setStatus("complete");
    } catch (err) {
      clearInterval(progressInterval);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  useEffect(() => {
    checkStatus().then(() => {
      fetch(`/api/projects/${projectId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.status === "DRAFT") startResearch();
          else if (d.status === "ANALYZED" || d.status === "COMPLETE") {
            setStatus("complete");
            setProgress(100);
          }
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-xl mx-auto">
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold tracking-tight">Research Pipeline</h2>
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                status === "complete" && "bg-[var(--status-healthy-bg)] text-[var(--status-healthy-fg)]",
                status === "error" && "bg-[var(--status-urgent-bg)] text-[var(--status-urgent-fg)]",
                (status === "running" || status === "idle") && "bg-[var(--status-ai-bg)] text-[var(--status-ai-fg)]"
              )}
            >
              {status === "complete"
                ? "Complete"
                : status === "error"
                  ? "Error"
                  : status === "running"
                    ? "Running"
                    : "Starting"}
            </span>
          </div>
        </div>

        <div className="px-5 py-5 space-y-5">
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground font-medium">Overall progress</span>
              <span className="num font-medium">{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full rounded-full bg-foreground transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-1">
            {STEPS.map((step, i) => {
              const stepProgress = (progress / 100) * STEPS.length;
              const isComplete = stepProgress > i + 1;
              const isRunning = stepProgress > i && stepProgress <= i + 1;
              const Icon = step.icon;

              return (
                <div
                  key={step.name}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="shrink-0">
                    {isComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-[var(--status-healthy-fg)]" />
                    ) : isRunning ? (
                      <Loader2 className="h-4 w-4 text-[var(--status-ai-fg)] animate-spin" />
                    ) : status === "error" && i === Math.floor(stepProgress) ? (
                      <XCircle className="h-4 w-4 text-[var(--status-urgent-fg)]" />
                    ) : (
                      <Circle className="h-4 w-4 text-muted-foreground/40" />
                    )}
                  </div>
                  <Icon className={cn(
                    "h-4 w-4 shrink-0",
                    isComplete || isRunning ? "text-foreground" : "text-muted-foreground/60"
                  )} />
                  <span className={cn(
                    "text-sm font-medium",
                    isComplete
                      ? "text-foreground"
                      : isRunning
                        ? "text-foreground"
                        : "text-muted-foreground"
                  )}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>

          {status === "running" && (
            <p className="text-xs text-muted-foreground">
              Crawling websites, searching YouTube, and running AI analysis. This takes ~30–60 seconds.
            </p>
          )}
        </div>
      </div>

      {status === "complete" && (
        <Button
          onClick={() => router.push(`/projects/${projectId}/overview`)}
          className="w-full mt-4 h-10 rounded-md bg-foreground text-background hover:bg-foreground/90"
        >
          View dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}

      {status === "error" && (
        <div className="mt-4 space-y-3">
          {error && (
            <div className="rounded-md border border-[var(--status-urgent)] bg-[var(--status-urgent-bg)] p-3 text-sm text-[var(--status-urgent-fg)]">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <Button
              onClick={startResearch}
              variant="outline"
              className="flex-1 h-10 rounded-md"
            >
              <Play className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              onClick={() => router.push(`/projects/${projectId}/overview`)}
              variant="secondary"
              className="flex-1 h-10 rounded-md"
            >
              View partial results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
