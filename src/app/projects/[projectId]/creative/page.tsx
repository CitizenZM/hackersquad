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
  CheckSquare,
  Square,
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
  scriptId: string | null;
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
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptIds, setSelectedScriptIds] = useState<Set<string>>(new Set());
  const [storyboards, setStoryboards] = useState<Storyboard[]>([]);
  const [testMatrix, setTestMatrix] = useState<TestVariant[]>([]);
  const [expandedScript, setExpandedScript] = useState<string | null>(null);

  const [loadingAngles, setLoadingAngles] = useState(false);
  const [loadingScripts, setLoadingScripts] = useState(false);
  const [loadingStoryboards, setLoadingStoryboards] = useState(false);
  const [loadingMatrix, setLoadingMatrix] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [allProgress, setAllProgress] = useState("");
  const [loaded, setLoaded] = useState(false);

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
          // auto-select all saved scripts
          setSelectedScriptIds(new Set(savedScripts.map((s: Script) => s.id)));
          setExpandedScript(savedScripts[0].id);
        }
        if (Array.isArray(savedStoryboards) && savedStoryboards.length > 0) {
          setStoryboards(savedStoryboards);
        }
        if (savedMatrix?.variants?.length > 0) {
          setTestMatrix(savedMatrix.variants);
        }
      } catch {
        /* ignore */
      }
      setLoaded(true);
    }
    loadSaved();
  }, [projectId, loaded]);

  const stages = [
    { num: 1, name: "Angles", icon: Wand2, done: angles.length > 0, active: loadingAngles },
    { num: 2, name: "Scripts", icon: FileText, done: scripts.length > 0, active: loadingScripts },
    { num: 3, name: "Storyboards", icon: Layout, done: storyboards.length > 0, active: loadingStoryboards },
    { num: 4, name: "Test Matrix", icon: Grid3X3, done: testMatrix.length > 0, active: loadingMatrix },
  ];

  async function generateAngles(): Promise<Angle[]> {
    setLoadingAngles(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/angles`, { method: "POST" });
      const data = await res.json();
      const result = data.angles || [];
      setAngles(result);
      return result;
    } finally {
      setLoadingAngles(false);
    }
  }

  async function generateTop3Scripts(fromAngles?: Angle[]): Promise<Script[]> {
    const sourceAngles = fromAngles || angles;
    if (sourceAngles.length === 0) return [];

    // Take top 3 by predictedScore
    const top3 = [...sourceAngles]
      .sort((a, b) => b.predictedScore - a.predictedScore)
      .slice(0, 3);

    setLoadingScripts(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/scripts-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ angles: top3 }),
      });
      const data = await res.json();
      const newScripts: Script[] = data.scripts || [];
      setScripts((prev) => [...prev, ...newScripts]);
      // Auto-select all new scripts
      setSelectedScriptIds((prev) => {
        const next = new Set(prev);
        newScripts.forEach((s) => next.add(s.id));
        return next;
      });
      if (newScripts.length > 0) setExpandedScript(newScripts[0].id);
      return newScripts;
    } finally {
      setLoadingScripts(false);
    }
  }

  async function generateStoryboardsForSelected(): Promise<Storyboard[]> {
    if (selectedScriptIds.size === 0) return [];
    setLoadingStoryboards(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/storyboards-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptIds: Array.from(selectedScriptIds) }),
      });
      const data = await res.json();
      const newBoards: Storyboard[] = data.storyboards || [];
      setStoryboards((prev) => [...prev, ...newBoards]);
      return newBoards;
    } finally {
      setLoadingStoryboards(false);
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

      setAllProgress("Writing 3 scripts in parallel...");
      const newScripts = await generateTop3Scripts(newAngles);
      if (newScripts.length === 0) return;

      setAllProgress("Creating storyboards for all scripts...");
      // auto-select and generate storyboards for all 3
      setSelectedScriptIds(new Set(newScripts.map((s) => s.id)));
      const res = await fetch(`/api/projects/${projectId}/creative/storyboards-batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptIds: newScripts.map((s) => s.id) }),
      });
      const data = await res.json();
      const newBoards: Storyboard[] = data.storyboards || [];
      setStoryboards((prev) => [...prev, ...newBoards]);

      setAllProgress("Building test matrix...");
      await generateTestMatrix();

      setAllProgress("Done!");
    } finally {
      setLoadingAll(false);
      setAllProgress("");
    }
  }

  function toggleScript(id: string) {
    setSelectedScriptIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function goToStudio() {
    const selectedIds = Array.from(selectedScriptIds).join(",");
    router.push(`/projects/${projectId}/studio?scripts=${selectedIds}`);
  }

  const nothingGenerated = angles.length === 0 && scripts.length === 0 && storyboards.length === 0 && testMatrix.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-base font-semibold tracking-tight">Creative Generator</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Top 3 angles → 3 scripts → multi-select storyboards → Studio
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
            {angles.map((angle, i) => {
              const isTop3 = i < 3; // first 3 (assumes sorted by score)
              return (
                <div
                  key={angle.id}
                  className={cn(
                    "rounded-lg border bg-card p-3.5",
                    isTop3 ? "border-foreground/40 ring-1 ring-foreground/10" : "border-border"
                  )}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-semibold">{angle.title}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      {isTop3 && <StatusBadge level="ai">TOP {i + 1}</StatusBadge>}
                      <span className="text-sm font-semibold num">{angle.predictedScore}</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{angle.description}</p>
                  <div className="flex flex-wrap gap-1">
                    <StatusBadge level="neutral">{NARRATIVE_TYPE_LABELS[angle.narrativeType] || angle.narrativeType}</StatusBadge>
                    <StatusBadge level="neutral">{angle.platform}</StatusBadge>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {angles.length > 0 && !loadingAll && (
          <Button onClick={() => generateTop3Scripts()} disabled={loadingScripts} variant="outline" className="h-9 rounded-md">
            {loadingScripts ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <FileText className="mr-2 h-3.5 w-3.5" />}
            Generate 3 scripts from top angles
          </Button>
        )}
      </section>

      {/* STEP 2: Scripts — Multi-select */}
      {scripts.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <FileText className="h-4 w-4" /> 2. Scripts ({scripts.length}) — Select one or more
            </h3>
            <div className="flex gap-2 items-center">
              <span className="text-xs text-muted-foreground">
                {selectedScriptIds.size} selected
              </span>
              <button
                onClick={() => setSelectedScriptIds(new Set(scripts.map(s => s.id)))}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Select all
              </button>
              <span className="text-xs text-muted-foreground">·</span>
              <button
                onClick={() => setSelectedScriptIds(new Set())}
                className="text-xs font-medium text-muted-foreground hover:text-foreground"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="space-y-2">
            {scripts.map((script) => {
              const isExpanded = expandedScript === script.id;
              const isSelected = selectedScriptIds.has(script.id);
              return (
                <div key={script.id} className={cn(
                  "rounded-lg border bg-card transition-all",
                  isSelected ? "border-foreground" : "border-border"
                )}>
                  <div className="w-full p-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleScript(script.id)}
                      className="shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-foreground" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <button
                      onClick={() => setExpandedScript(isExpanded ? null : script.id)}
                      className="flex-1 text-left flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{script.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          <span className="font-medium text-foreground">{script.angle.slice(0, 50)}</span>
                          <span className="mx-1">·</span>
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
                  </div>

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

          {selectedScriptIds.size > 0 && !loadingAll && (
            <div className="flex gap-2 flex-wrap">
              <Button onClick={generateStoryboardsForSelected} disabled={loadingStoryboards} variant="outline" className="h-9 rounded-md">
                {loadingStoryboards ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Layout className="mr-2 h-3.5 w-3.5" />}
                Generate storyboards ({selectedScriptIds.size})
              </Button>
              <Button onClick={goToStudio} variant="outline" className="h-9 rounded-md">
                <Palette className="mr-2 h-3.5 w-3.5" />
                Send to Studio ({selectedScriptIds.size})
                <ArrowRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </section>
      )}

      {/* STEP 3: Storyboards */}
      {storyboards.length > 0 && (
        <section className="space-y-3 pt-4 border-t border-border">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
              <Layout className="h-4 w-4" /> 3. Storyboards ({storyboards.length})
            </h3>
            <Button
              onClick={goToStudio}
              variant="outline"
              size="sm"
              className="h-8 rounded-md text-xs"
              disabled={selectedScriptIds.size === 0}
            >
              <Palette className="mr-1.5 h-3 w-3" />
              Open in Studio
            </Button>
          </div>

          {storyboards.map((storyboard) => {
            const linkedScript = scripts.find((s) => s.id === storyboard.scriptId);
            return (
              <div key={storyboard.id} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{storyboard.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {linkedScript && <>From: <span className="font-medium">{linkedScript.title}</span> · </>}
                      {storyboard.style} · {storyboard.totalDuration} · {storyboard.frames.length} frames
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {storyboard.frames.map((frame) => (
                    <div key={frame.frameNumber} className="rounded-lg border border-border bg-card overflow-hidden">
                      <LofiFrame
                        scene={frame.scene}
                        imagePrompt={frame.imagePrompt}
                        frameNumber={frame.frameNumber}
                        duration={frame.duration}
                        projectId={projectId}
                      />
                      <div className="p-3 space-y-1.5">
                        <p className="text-sm font-medium leading-snug">{frame.scene}</p>
                        {frame.voiceover && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">VO:</span> {frame.voiceover}
                          </p>
                        )}
                        {frame.cameraNotes && (
                          <p className="text-[11px] text-muted-foreground italic">{frame.cameraNotes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
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

      {/* Footer CTA */}
      {scripts.length > 0 && (
        <div className="rounded-lg border border-border bg-muted/30 p-5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
          <div className="flex-1">
            <p className="text-sm font-semibold">
              Ready to build the video?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send {selectedScriptIds.size} selected script{selectedScriptIds.size !== 1 ? "s" : ""} to Studio for a detailed video brief and keyframe reel.
            </p>
          </div>
          <Button
            onClick={goToStudio}
            disabled={selectedScriptIds.size === 0}
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
