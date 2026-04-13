"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  Play,
} from "lucide-react";

const STEPS = [
  { name: "Crawling websites", emoji: "🌐" },
  { name: "YouTube research", emoji: "📺" },
  { name: "Collecting mentions", emoji: "💬" },
  { name: "AI analysis", emoji: "🧠" },
  { name: "Scoring content", emoji: "⭐" },
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
        setError("Something went wrong. Try again!");
      }
    } catch { /* ignore */ }
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
    <div className="max-w-md mx-auto space-y-5">
      <Card className="rounded-3xl border-2 border-purple-200 bg-white fun-shadow overflow-hidden">
        <CardContent className="pt-5 pb-5 space-y-5">
          <div className="text-center">
            <div className="text-5xl mb-2">
              {status === "complete" ? "🎉" : status === "error" ? "😢" : "🔬"}
            </div>
            <h2 className="text-xl font-black text-purple-900">
              {status === "complete"
                ? "Research Complete!"
                : status === "error"
                  ? "Oops!"
                  : status === "running"
                    ? "Researching..."
                    : "Ready to Launch"}
            </h2>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-purple-500">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-4 rounded-full bg-purple-100 overflow-hidden">
              <div
                className="h-full rounded-full gradient-fun transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            {STEPS.map((step, i) => {
              const stepProgress = (progress / 100) * STEPS.length;
              const isComplete = stepProgress > i + 1;
              const isRunning = stepProgress > i && stepProgress <= i + 1;

              return (
                <div
                  key={step.name}
                  className={`flex items-center gap-3 rounded-2xl p-3 transition-all ${
                    isComplete
                      ? "bg-green-50 border-2 border-green-200"
                      : isRunning
                        ? "bg-purple-50 border-2 border-purple-300"
                        : "bg-gray-50 border-2 border-gray-100"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                  ) : isRunning ? (
                    <Loader2 className="h-5 w-5 text-purple-500 animate-spin shrink-0" />
                  ) : (
                    <span className="text-xl shrink-0">{step.emoji}</span>
                  )}
                  <span className={`text-sm font-bold ${
                    isComplete ? "text-green-700" : isRunning ? "text-purple-700" : "text-gray-400"
                  }`}>
                    {step.name}
                  </span>
                </div>
              );
            })}
          </div>

          {status === "running" && (
            <p className="text-xs text-purple-400 text-center font-bold animate-pulse">
              Hang tight! Our AI is working its magic... ✨
            </p>
          )}
        </CardContent>
      </Card>

      {status === "complete" && (
        <Button
          onClick={() => router.push(`/projects/${projectId}/overview`)}
          className="w-full h-14 rounded-2xl text-lg font-black gradient-fun border-0 shadow-lg shadow-purple-400/30 active:scale-[0.98] transition-all"
        >
          See Results! 🎉
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      )}

      {status === "error" && (
        <div className="space-y-3">
          {error && (
            <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-3 text-sm text-red-600 font-bold text-center">
              😢 {error}
            </div>
          )}
          <Button
            onClick={startResearch}
            className="w-full h-12 rounded-2xl font-bold bg-purple-100 text-purple-700 hover:bg-purple-200 active:scale-[0.98]"
          >
            <Play className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </div>
      )}
    </div>
  );
}
