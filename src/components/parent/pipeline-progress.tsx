"use client";

import { useSSE } from "@/lib/hooks/use-sse";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Loader2, AlertCircle, Clock } from "lucide-react";
import type { JobStep } from "@/services/job-manager";

interface PipelineProgressProps {
  storyPackId: string;
  onComplete?: () => void;
}

export function PipelineProgress({ storyPackId, onComplete }: PipelineProgressProps) {
  const { status, progress, steps, messages, error } = useSSE(
    `/api/story-packs/${storyPackId}/progress`
  );

  if (status === "complete" && onComplete) {
    onComplete();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {status === "running" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
          {status === "complete" && <Check className="h-5 w-5 text-green-500" />}
          {status === "error" && <AlertCircle className="h-5 w-5 text-destructive" />}
          Story Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={progress} className="h-2" />
        <p className="text-sm text-muted-foreground">
          {status === "complete"
            ? "Story pack is ready for review!"
            : status === "error"
            ? "An error occurred during generation"
            : `${progress}% complete`}
        </p>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          {steps.map((step: JobStep) => (
            <div
              key={step.name}
              className="flex items-center gap-3 text-sm"
            >
              {step.status === "complete" && <Check className="h-4 w-4 text-green-500 shrink-0" />}
              {step.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-primary shrink-0" />}
              {step.status === "error" && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
              {step.status === "pending" && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
              <span className={step.status === "pending" ? "text-muted-foreground" : ""}>
                {step.name}
              </span>
              {step.status === "running" && step.progress > 0 && (
                <span className="text-xs text-muted-foreground">({step.progress}%)</span>
              )}
            </div>
          ))}
        </div>

        {messages.length > 0 && (
          <div className="max-h-32 overflow-y-auto rounded-md bg-muted p-3 space-y-1">
            {messages.slice(-10).map((msg, i) => (
              <p key={i} className="text-xs text-muted-foreground">{msg}</p>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
