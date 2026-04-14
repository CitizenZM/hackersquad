"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { NARRATIVE_TYPE_LABELS } from "@/lib/constants";
import {
  Loader2,
  Wand2,
  FileText,
  Layout,
  Grid3X3,
  Check,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreBar, StatusBadge } from "@/components/dashboard/status-badge";

interface Angle {
  id: number;
  title: string;
  description: string;
  targetEmotion: string;
  narrativeType: string;
  predictedScore: number;
  rationale: string;
  targetAudience: string;
  platform: string;
}

interface Script {
  id: string;
  title: string;
  angle: string;
  format: string;
  duration: string;
  hookVariants: string[];
  body: string;
  ctaVariants: string[];
  narrativeType: string;
  targetEmotion: string;
  predictedScore: number;
}

interface Storyboard {
  id: string;
  title: string;
  style: string;
  totalDuration: string;
  frames: {
    frameNumber: number;
    duration: string;
    scene: string;
    visualDirection: string;
    voiceover: string;
    textOverlay: string;
    cameraNotes: string;
    imagePrompt: string;
  }[];
}

interface TestVariant {
  hookVariant: string;
  narrativeType: string;
  ctaVariant: string;
  format: string;
  predictedScore: number;
  rationale: string;
  scriptOutline: string;
}

type Stage = { num: number; name: string; icon: typeof Wand2; done: boolean };

export default function CreativePage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [angles, setAngles] = useState<Angle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [testMatrix, setTestMatrix] = useState<TestVariant[]>([]);

  const [loadingAngles, setLoadingAngles] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);

  const stages: Stage[] = [
    { num: 1, name: "Angles", icon: Wand2, done: angles.length > 0 },
    { num: 2, name: "Scripts", icon: FileText, done: scripts.length > 0 },
    { num: 3, name: "Storyboard", icon: Layout, done: !!storyboard },
    { num: 4, name: "Test Matrix", icon: Grid3X3, done: testMatrix.length > 0 },
  ];

  async function generateAngles() {
    setLoadingAngles(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/angles`, {
        method: "POST",
      });
      const data = await res.json();
      setAngles(data.angles || []);
    } finally {
      setLoadingAngles(false);
    }
  }

  async function generateScript(angle: Angle) {
    setLoadingScript(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angle }),
      });
      const data = await res.json();
      setScripts((prev) => [...prev, data]);
    } finally {
      setLoadingScript(false);
    }
  }

  async function generateStoryboard(script: Script) {
    setLoadingStoryboard(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/storyboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: script.id }),
      });
      const data = await res.json();
      setStoryboard(data);
    } finally {
      setLoadingStoryboard(false);
    }
  }

  async function generateTestMatrix() {
    setLoadingMatrix(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/test-matrix`, {
        method: "POST",
      });
      const data = await res.json();
      setTestMatrix(data.variants || []);
    } finally {
      setLoadingMatrix(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Creative Generator</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate production-ready ad concepts from brand intelligence
        </p>
      </div>

      {/* Stepper */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto">
          {stages.map((stage, i) => (
            <div key={stage.num} className="flex items-center gap-2 flex-1 min-w-max">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                    stage.done
                      ? "bg-foreground border-foreground text-background"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {stage.done ? <Check className="h-3.5 w-3.5" /> : stage.num}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  stage.done ? "text-foreground" : "text-muted-foreground"
                )}>
                  {stage.name}
                </span>
              </div>
              {i < stages.length - 1 && (
                <div className="h-px bg-border flex-1 mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Angles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Step 1 · Ad Angles
          </h3>
          <Button
            onClick={generateAngles}
            disabled={loadingAngles}
            size="sm"
            className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {loadingAngles ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-3.5 w-3.5" />
            )}
            Generate 10 angles
          </Button>
        </div>

        {angles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {angles.map((angle) => (
              <button
                key={angle.id}
                onClick={() => setSelectedAngle(angle)}
                className={cn(
                  "text-left rounded-lg border bg-card p-4 transition-all",
                  selectedAngle?.id === angle.id
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-semibold">{angle.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-semibold num">{angle.predictedScore}</span>
                    {selectedAngle?.id === angle.id && (
                      <Check className="h-4 w-4" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {angle.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge level="neutral">
                    {NARRATIVE_TYPE_LABELS[angle.narrativeType] || angle.narrativeType}
                  </StatusBadge>
                  <StatusBadge level="neutral">{angle.targetEmotion}</StatusBadge>
                  <StatusBadge level="neutral">{angle.platform}</StatusBadge>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedAngle && (
          <Button
            onClick={() => generateScript(selectedAngle)}
            disabled={loadingScript}
            variant="outline"
            className="h-9 rounded-md"
          >
            {loadingScript ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-2 h-3.5 w-3.5" />
            )}
            Generate script for &ldquo;{selectedAngle.title}&rdquo;
          </Button>
        )}
      </section>

      {/* Step 2: Scripts */}
      {scripts.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Step 2 · Scripts
          </h3>
          <div className="space-y-3">
            {scripts.map((script) => (
              <button
                key={script.id}
                onClick={() => setSelectedScript(script)}
                className={cn(
                  "w-full text-left rounded-lg border bg-card p-5 transition-all",
                  selectedScript?.id === script.id
                    ? "border-foreground ring-2 ring-foreground/10"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-sm font-semibold">{script.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {script.format} · {script.duration}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">Predicted</span>
                    <span className="text-sm font-semibold num">{script.predictedScore}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Hook variants</p>
                    <ol className="space-y-1 text-sm list-decimal list-inside">
                      {script.hookVariants.map((h, i) => (
                        <li key={i} className="text-foreground">{h}</li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">CTA variants</p>
                    <ol className="space-y-1 text-sm list-decimal list-inside">
                      {script.ctaVariants.map((c, i) => (
                        <li key={i} className="text-foreground">{c}</li>
                      ))}
                    </ol>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Script body</p>
                  <div className="rounded-md bg-muted p-3 text-sm whitespace-pre-wrap">
                    {script.body}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {selectedScript && (
            <Button
              onClick={() => generateStoryboard(selectedScript)}
              disabled={loadingStoryboard}
              variant="outline"
              className="h-9 rounded-md"
            >
              {loadingStoryboard ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Layout className="mr-2 h-3.5 w-3.5" />
              )}
              Generate storyboard
            </Button>
          )}
        </section>
      )}

      {/* Step 3: Storyboard */}
      {storyboard && (
        <section className="space-y-3 pt-4 border-t border-border">
          <div>
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <Layout className="h-4 w-4" />
              Step 3 · Storyboard: {storyboard.title}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {storyboard.style} · {storyboard.totalDuration}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {storyboard.frames.map((frame) => (
              <div key={frame.frameNumber} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-video bg-muted p-4 flex items-center justify-center">
                  <p className="text-xs text-muted-foreground text-center line-clamp-4">
                    {frame.imagePrompt}
                  </p>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Frame {frame.frameNumber}</span>
                    <span className="num text-muted-foreground">{frame.duration}</span>
                  </div>
                  <p className="text-sm font-medium">{frame.scene}</p>
                  <p className="text-xs text-muted-foreground">{frame.voiceover}</p>
                  {frame.textOverlay && (
                    <p className="text-xs font-medium">Text: {frame.textOverlay}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Step 4: Test Matrix */}
      <section className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" />
            Step 4 · Test Matrix
          </h3>
          <Button
            onClick={generateTestMatrix}
            disabled={loadingMatrix}
            size="sm"
            className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {loadingMatrix ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Grid3X3 className="mr-2 h-3.5 w-3.5" />
            )}
            Generate matrix
          </Button>
        </div>

        {testMatrix.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
                    <th className="text-left font-medium px-3 py-2.5">Hook</th>
                    <th className="text-left font-medium px-3 py-2.5">Narrative</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">CTA</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden lg:table-cell">Format</th>
                    <th className="text-left font-medium px-3 py-2.5">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {testMatrix
                    .sort((a, b) => b.predictedScore - a.predictedScore)
                    .map((v, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="px-4 py-3 text-xs text-muted-foreground num">{i + 1}</td>
                        <td className="px-3 py-3">
                          <p className="text-xs line-clamp-2 max-w-xs">{v.hookVariant}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground">
                          {NARRATIVE_TYPE_LABELS[v.narrativeType] || v.narrativeType}
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                          <p className="line-clamp-1 max-w-xs">{v.ctaVariant}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                          {v.format}
                        </td>
                        <td className="px-3 py-3"><ScoreBar score={v.predictedScore} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
