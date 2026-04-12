"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSSE } from "@/lib/hooks/use-sse";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Circle,
  ArrowRight,
  Play,
} from "lucide-react";

export default function ResearchPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const [jobId, setJobId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);

  const sseUrl = jobId
    ? `/api/projects/${projectId}/research/progress?jobId=${jobId}`
    : null;
  const { status, progress, steps, messages } = useSSE(sseUrl);

  async function startResearch() {
    setStarting(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/research`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.jobId) {
        setJobId(data.jobId);
        setStarted(true);
      }
    } catch (err) {
      console.error("Failed to start research:", err);
    } finally {
      setStarting(false);
    }
  }

  useEffect(() => {
    // Auto-start research on mount
    if (!started && !starting) {
      startResearch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isComplete = status === "complete";
  const isError = status === "error";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Research Progress</CardTitle>
            <Badge
              variant={isComplete ? "default" : isError ? "destructive" : "secondary"}
            >
              {isComplete
                ? "Complete"
                : isError
                  ? "Error"
                  : status === "running"
                    ? "Running"
                    : "Starting..."}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="space-y-3">
            {steps.map((step) => (
              <div
                key={step.name}
                className="flex items-center gap-3 rounded-lg border p-3"
              >
                {step.status === "complete" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                ) : step.status === "error" ? (
                  <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                ) : step.status === "running" ? (
                  <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
                ) : (
                  <Circle className="h-5 w-5 text-muted-foreground shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{step.name}</p>
                  {step.log.length > 0 && (
                    <p className="text-xs text-muted-foreground truncate">
                      {step.log[step.log.length - 1]}
                    </p>
                  )}
                </div>
                {step.status === "running" && (
                  <span className="text-xs text-muted-foreground">
                    {step.progress}%
                  </span>
                )}
              </div>
            ))}
          </div>

          {messages.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg bg-muted p-3 space-y-1">
              {messages.slice(-10).map((msg, i) => (
                <p key={i} className="text-xs text-muted-foreground font-mono">
                  {msg}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isComplete && (
        <div className="flex gap-3">
          <Button
            onClick={() => router.push(`/projects/${projectId}/overview`)}
            size="lg"
            className="flex-1"
          >
            View Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {isError && (
        <div className="flex gap-3">
          <Button onClick={startResearch} variant="outline" disabled={starting}>
            {starting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Retry Research
          </Button>
          <Button
            variant="secondary"
            onClick={() => router.push(`/projects/${projectId}/overview`)}
          >
            View Partial Results
          </Button>
        </div>
      )}
    </div>
  );
}
