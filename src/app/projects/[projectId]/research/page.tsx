"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Play,
  Brain,
  Globe,
  Video,
  BarChart3,
  MessageSquare,
} from "lucide-react";

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
        setError("Research failed. Please try again.");
      } else if (data.status === "RESEARCHING") {
        setStatus("running");
      }
    } catch {
      // ignore polling errors
    }
  }, [projectId]);

  async function startResearch() {
    setStatus("running");
    setProgress(0);
    setError(null);

    // Animate progress while waiting
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 2, 90));
    }, 1000);

    try {
      const res = await fetch(`/api/projects/${projectId}/research`, {
        method: "POST",
      });
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

  // Auto-start on mount
  useEffect(() => {
    checkStatus().then(() => {
      // Only auto-start if project is in DRAFT
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
    <div className="max-w-lg mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Research Progress</CardTitle>
            <Badge
              variant={
                status === "complete"
                  ? "default"
                  : status === "error"
                    ? "destructive"
                    : "secondary"
              }
            >
              {status === "complete"
                ? "Complete"
                : status === "error"
                  ? "Error"
                  : status === "running"
                    ? "Running..."
                    : "Ready"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const stepProgress = (progress / 100) * STEPS.length;
              const isComplete = stepProgress > i + 1;
              const isRunning = stepProgress > i && stepProgress <= i + 1;
              const isError = status === "error" && isRunning;

              return (
                <div
                  key={step.name}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isError ? (
                    <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                  ) : isRunning ? (
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                  <span
                    className={`text-sm font-medium ${
                      isComplete
                        ? "text-green-700"
                        : isRunning
                          ? "text-blue-700"
                          : "text-muted-foreground"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>

          {status === "running" && (
            <p className="text-xs text-muted-foreground text-center animate-pulse">
              Crawling websites, searching YouTube, and running AI analysis...
            </p>
          )}
        </CardContent>
      </Card>

      {status === "complete" && (
        <Button
          onClick={() => router.push(`/projects/${projectId}/overview`)}
          size="lg"
          className="w-full"
        >
          View Dashboard
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}

      {status === "error" && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
          <div className="flex gap-3">
            <Button onClick={startResearch} variant="outline" className="flex-1">
              <Play className="mr-2 h-4 w-4" />
              Retry
            </Button>
            <Button
              variant="secondary"
              onClick={() => router.push(`/projects/${projectId}/overview`)}
              className="flex-1"
            >
              View Partial Results
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
