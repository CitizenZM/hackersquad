"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Palette,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScoreBar, StatusBadge } from "@/components/dashboard/status-badge";
import { LofiFrame } from "@/components/creative/lofi-frame";

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

interface StoryboardFrame {
  frameNumber: number;
  duration: string;
  scene: string;
  visualDirection: string;
  voiceover: string;
  textOverlay: string;
  cameraNotes: string;
  imagePrompt: string;
}

interface Storyboard {
  id: string;
  title: string;
  style: string;
  totalDuration: string;
  frames: StoryboardFrame[];
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

export default function CreativePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [angles, setAngles] = useState<Angle[]>([]);
  const [selectedAngle, setSelectedAngle] = useState<Angle | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [storyboard, setStoryboard] = useState<Storyboard | null>(null);
  const [testMatrix, setTestMatrix] = useState<TestVariant[]>([]);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);

  const [loadingAngles, setLoadingAngles] = useState(false);
  const [loadingScript, setLoadingScript] = useState(false);
  const [loadingStoryboard, setLoadingStoryboard] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allProgress, setAllProgress] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Load previously saved data from DB on mount
  useEffect(() => {
    if (loaded) return;
    async function loadSaved() {
      try {
        const [scriptsRes, storyboardsRes, matrixRes] = await Promise.all([
          fetch(`/api/projects/${projectId}/creative/scripts`),
          fetch(`/api/projects/${projectId}/creative/storyboards`),
          fetch(`/api/projects/${projectId}/creative/test-matrix`),
        ]);
        const savedScripts = await scriptsRes.json();
        const savedStoryboards = await storyboardsRes.json();
        const savedMatrix = await matrixRes.json();

        if (Array.isArray(savedScripts) && savedScripts.length > 0) {
          setScripts(savedScripts);
          setSelectedScript(savedScripts[0]);
          setExpandedScript(savedScripts[0].id);
        }
        if (Array.isArray(savedStoryboards) && savedStoryboards.length > 0) {
          setStoryboard(savedStoryboards[0]);
        }
        if (savedMatrix?.variants?.length > 0) {
          setTestMatrix(savedMatrix.variants);
        }
      } catch {
        // ignore load errors
      }
      setLoaded(true);
    }
    loadSaved();
  }, [projectId, loaded]);

  const stages = [
    { num: 1, name: "Angles", icon: Wand2, done: angles.length > 0, active: loadingAngles },
    { num: 2, name: "Scripts", icon: FileText, done: scripts.length > 0, active: loadingScript },
    { num: 3, name: "Storyboard", icon: Layout, done: !!storyboard, active: loadingStoryboard },
    { num: 4, name: "Test Matrix", icon: Grid3X3, done: testMatrix.length > 0, active: loadingMatrix },
  ];

  async function generateAngles(): Promise<Angle[]> {
    setLoadingAngles(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/angles`, { method: "POST" });
      const data = await res.json();
      const result = data.angles || [];
      setAngles(result);
      if (result.length > 0) setSelectedAngle(result[0]);
      return result;
    } finally {
      setLoadingAngles(false);
    }
  }

  async function generateScript(angle: Angle): Promise<Script | null> {
    setLoadingScript(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/scripts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angle }),
      });
      const data = await res.json();
      if (data.error) return null;
      setScripts((prev) => [...prev, data]);
      setSelectedScript(data);
      setExpandedScript(data.id);
      return data;
    } finally {
      setLoadingScript(false);
    }
  }

  async function generateStoryboard(script: Script): Promise<Storyboard | null> {
    setLoadingStoryboard(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/storyboards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId: script.id }),
      });
      const data = await res.json();
      if (data.error) return null;
      setStoryboard(data);
      return data;
    } finally {
      setLoadingStoryboard(false);
    }
  }

  async function generateTestMatrix() {
    setLoadingMatrix(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/test-matrix`, { method: "POST" });
      const data = await res.json();
      setTestMatrix(data.variants || []);
    } finally {
      setLoadingMatrix(false);
    }
  }

  async function generateAll() {
    setLoadingAll(true);
    try {
      setAllProgress("Generating 10 ad angles...");
      const newAngles = await generateAngles();
      if (newAngles.length === 0) return;

      const topAngle = newAngles[0];
      setAllProgress(`Writing script for "${topAngle.title}"...`);
      const script = await generateScript(topAngle);
      if (!script) return;

      setAllProgress("Creating visual storyboard...");
      await generateStoryboard(script);

      setAllProgress("Building test matrix...");
      await generateTestMatrix();

      setAllProgress("Done!");
    } finally {
      setLoadingAll(false);
      setAllProgress("");
    }
  }

  const nothingGenerated = angles.length === 0 && scripts.length === 0 && !storyboard && testMatrix.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Creative Generator</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate production-ready ad concepts from brand intelligence
          </p>
        </div>
        {nothingGenerated && (
          <Button
            onClick={generateAll}
            disabled={loadingAll}
            className="h-10 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {loadingAll ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {allProgress || "Generating..."}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Generate full pipeline
              </>
            )}
          </Button>
        )}
      </div>

      {/* Stepper */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          {stages.map((stage, i) => (
            <div key={stage.num} className="flex items-center gap-2 flex-1 min-w-max">
              <div className="flex items-center gap-2.5">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold transition-all",
                    stage.done
                      ? "bg-foreground border-foreground text-background"
                      : stage.active
                        ? "bg-[var(--status-ai-bg)] border-[var(--status-ai)] text-[var(--status-ai-fg)] animate-pulse"
                        : "border-border text-muted-foreground"
                  )}
                >
                  {stage.done ? <Check className="h-3.5 w-3.5" /> : stage.active ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : stage.num}
                </div>
                <span className={cn("text-sm font-medium", stage.done || stage.active ? "text-foreground" : "text-muted-foreground")}>
                  {stage.name}
                </span>
              </div>
              {i < stages.length - 1 && <div className="h-px bg-border flex-1 mx-2 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Loading overlay for "Generate All" */}
      {loadingAll && allProgress && (
        <div className="rounded-lg border border-[var(--status-ai)] bg-[var(--status-ai-bg)] p-4 text-center">
          <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2 text-[var(--status-ai-fg)]" />
          <p className="text-sm font-medium text-[var(--status-ai-fg)]">{allProgress}</p>
        </div>
      )}

      {/* STEP 1: Angles */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> 1. Ad Angles
          </h3>
          {!loadingAll && (
            <Button onClick={() => generateAngles()} disabled={loadingAngles} size="sm" variant="outline" className="h-8 rounded-md text-xs">
              {loadingAngles ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Sparkles className="mr-1.5 h-3 w-3" />}
              {angles.length > 0 ? "Regenerate" : "Generate 10 angles"}
            </Button>
          )}
        </div>

        {angles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {angles.map((angle) => (
              <button
                key={angle.id}
                onClick={() => setSelectedAngle(angle)}
                className={cn(
                  "text-left rounded-lg border bg-card p-3.5 transition-all",
                  selectedAngle?.id === angle.id ? "border-foreground ring-1 ring-foreground/10" : "border-border hover:border-foreground/30"
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <p className="text-sm font-semibold">{angle.title}</p>
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-sm font-semibold num">{angle.predictedScore}</span>
                    {selectedAngle?.id === angle.id && <Check className="h-3.5 w-3.5" />}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{angle.description}</p>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge level="neutral">{NARRATIVE_TYPE_LABELS[angle.narrativeType] || angle.narrativeType}</StatusBadge>
                  <StatusBadge level="neutral">{angle.platform}</StatusBadge>
                </div>
              </button>
            ))}
          </div>
        )}

        {selectedAngle && !loadingAll && (
          <Button onClick={() => generateScript(selectedAngle)} disabled={loadingScript} variant="outline" className="h-9 rounded-md">
            {loadingScript ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}
            Generate script for &ldquo;{selectedAngle.title}&rdquo;
          </Button>
        )}
      </section>

      {/* STEP 2: Scripts */}
      {scripts.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-border">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <FileText className="h-4 w-4" /> 2. Scripts ({scripts.length})
          </h3>
          <div className="space-y-2">
            {scripts.map((script) => {
              const isExpanded = expandedScript === script.id;
              return (
                <div key={script.id} className={cn(
                  "rounded-lg border bg-card transition-all",
                  selectedScript?.id === script.id ? "border-foreground" : "border-border"
                )}>
                  {/* Header - always visible */}
                  <button
                    onClick={() => { setSelectedScript(script); setExpandedScript(isExpanded ? null : script.id); }}
                    className="w-full text-left p-4 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">{script.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {script.format} · {script.duration} · {script.targetEmotion}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-lg font-semibold num">{script.predictedScore}</span>
                        <p className="text-[10px] text-muted-foreground">predicted</p>
                      </div>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Hook variants</p>
                          <ol className="space-y-1.5">
                            {script.hookVariants.map((h, i) => (
                              <li key={i} className="text-sm flex gap-2">
                                <span className="text-muted-foreground shrink-0 num w-4">{i + 1}.</span>
                                <span>{h}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">CTA variants</p>
                          <ol className="space-y-1.5">
                            {script.ctaVariants.map((c, i) => (
                              <li key={i} className="text-sm flex gap-2">
                                <span className="text-muted-foreground shrink-0 num w-4">{i + 1}.</span>
                                <span>{c}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Script body</p>
                        <div className="rounded-md bg-muted p-4 text-sm whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                          {script.body}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {selectedScript && !loadingAll && (
            <Button onClick={() => generateStoryboard(selectedScript)} disabled={loadingStoryboard} variant="outline" className="h-9 rounded-md">
              {loadingStoryboard ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Layout className="mr-2 h-3.5 w-3.5" />}
              Generate storyboard for &ldquo;{selectedScript.title}&rdquo;
            </Button>
          )}
        </section>
      )}

      {/* STEP 3: Storyboard */}
      {storyboard && (
        <section className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <Layout className="h-4 w-4" /> 3. Storyboard: {storyboard.title}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {storyboard.style} · {storyboard.totalDuration} · {storyboard.frames.length} frames
              </p>
            </div>
            <Button
              onClick={() => router.push(`/projects/${projectId}/studio`)}
              variant="outline"
              size="sm"
              className="h-8 rounded-md text-xs"
            >
              <Palette className="mr-1.5 h-3 w-3" />
              Generate frames in Studio
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {storyboard.frames.map((frame) => (
              <div key={frame.frameNumber} className="rounded-lg border border-border bg-card overflow-hidden">
                <LofiFrame
                  scene={frame.scene}
                  imagePrompt={frame.imagePrompt}
                  frameNumber={frame.frameNumber}
                  duration={frame.duration}
                />
                <div className="p-3 space-y-1.5">
                  <p className="text-sm font-medium leading-snug">{frame.scene}</p>
                  <div className="space-y-1">
                    {frame.voiceover && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">VO:</span> {frame.voiceover}
                      </p>
                    )}
                    {frame.textOverlay && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">Text:</span> {frame.textOverlay}
                      </p>
                    )}
                    {frame.cameraNotes && (
                      <p className="text-[11px] text-muted-foreground italic">{frame.cameraNotes}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* STEP 4: Test Matrix */}
      <section className="space-y-3 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Grid3X3 className="h-4 w-4" /> 4. Test Matrix
          </h3>
          {!loadingAll && (
            <Button onClick={generateTestMatrix} disabled={loadingMatrix} size="sm" variant="outline" className="h-8 rounded-md text-xs">
              {loadingMatrix ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <Grid3X3 className="mr-1.5 h-3 w-3" />}
              {testMatrix.length > 0 ? "Regenerate" : "Generate matrix"}
            </Button>
          )}
        </div>

        {testMatrix.length > 0 && (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2.5 w-10">#</th>
                    <th className="text-left font-medium px-3 py-2.5">Hook</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Narrative</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden lg:table-cell">CTA</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden sm:table-cell">Format</th>
                    <th className="text-left font-medium px-3 py-2.5 w-28">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {testMatrix
                    .sort((a, b) => b.predictedScore - a.predictedScore)
                    .map((v, i) => (
                      <tr key={i} className="hover:bg-muted/40">
                        <td className="px-4 py-2.5 text-xs text-muted-foreground num">{i + 1}</td>
                        <td className="px-3 py-2.5 text-xs max-w-xs"><p className="line-clamp-1">{v.hookVariant}</p></td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden md:table-cell">
                          {NARRATIVE_TYPE_LABELS[v.narrativeType] || v.narrativeType}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden lg:table-cell">
                          <p className="line-clamp-1 max-w-xs">{v.ctaVariant}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-muted-foreground hidden sm:table-cell">{v.format}</td>
                        <td className="px-3 py-2.5"><ScoreBar score={v.predictedScore} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Summary CTA */}
      {storyboard && (
        <div className="rounded-lg border border-border bg-muted/30 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex-1">
            <p className="text-sm font-semibold">Ready to visualize?</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Take your storyboard frames to the Studio to generate AI concept images.
            </p>
          </div>
          <Button
            onClick={() => router.push(`/projects/${projectId}/studio`)}
            className="h-10 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium shrink-0"
          >
            <Palette className="mr-2 h-4 w-4" />
            Open Studio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
