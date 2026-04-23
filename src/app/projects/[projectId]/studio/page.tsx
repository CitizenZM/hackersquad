"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import {
  Loader2,
  Image as ImageIcon,
  Palette,
  Download,
  Film,
  Copy,
  Check,
  Camera,
  Sparkles,
  Wand2,
} from "lucide-react";

interface Script {
  id: string;
  title: string;
  angle: string;
  format: string;
  duration: string;
  hookVariants: string[];
  body: string;
  ctaVariants: string[];
  targetEmotion: string;
}

interface Shot {
  shotNumber: number;
  duration: string;
  shotType: string;
  cameraAngle: string;
  cameraMovement: string;
  sceneDescription: string;
  action: string;
  dialogue: string;
  soundDesign: string;
  lighting: string;
  lensNotes: string;
  aiVideoPrompt: string;
}

interface VideoBrief {
  title: string;
  logline: string;
  totalDuration: string;
  visualStyle: string;
  colorPalette: string;
  musicDirection: string;
  castingNotes: string;
  locationNotes: string;
  shotList: Shot[];
  callToAction: string;
  brandGuidelines: string[];
}

interface Keyframe {
  id: string;
  imageUrl: string | null;
  prompt: string;
  style: string | null;
}

export default function StudioPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId as string;
  const scriptsParam = searchParams.get("scripts");

  const [scripts, setScripts] = useState<Script[]>([]);
  const [activeScriptId, setActiveScriptId] = useState<string | null>(null);
  const [brief, setBrief] = useState<VideoBrief | null>(null);
  const [keyframes, setKeyframes] = useState<Keyframe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingKeyframes, setLoadingKeyframes] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  // Load selected scripts
  useEffect(() => {
    async function loadScripts() {
      try {
        const res = await fetch(`/api/projects/${projectId}/creative/scripts`);
        const all = await res.json();
        if (!Array.isArray(all)) return;

        if (scriptsParam) {
          const ids = scriptsParam.split(",").filter(Boolean);
          const selected = all.filter((s: Script) => ids.includes(s.id));
          setScripts(selected);
          if (selected.length > 0) setActiveScriptId(selected[0].id);
        } else {
          setScripts(all);
          if (all.length > 0) setActiveScriptId(all[0].id);
        }
      } catch {
        /* ignore */
      }
    }
    loadScripts();
  }, [projectId, scriptsParam]);

  const activeScript = scripts.find((s) => s.id === activeScriptId);

  const generateBrief = useCallback(async (scriptId: string) => {
    setLoading(true);
    setBrief(null);
    setKeyframes([]);
    try {
      const res = await fetch(`/api/projects/${projectId}/studio/video-brief`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scriptId }),
      });
      const data = await res.json();
      if (!data.error) setBrief(data);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  async function generateKeyframes() {
    if (!brief?.shotList) return;
    setLoadingKeyframes(true);
    try {
      const prompts = brief.shotList.map((s) => s.aiVideoPrompt);
      const res = await fetch(`/api/projects/${projectId}/studio/storyboard-keyframes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompts, scriptId: activeScriptId }),
      });
      const data = await res.json();
      setKeyframes(data.keyframes || []);
    } finally {
      setLoadingKeyframes(false);
    }
  }

  function copyToClipboard(text: string, index: number) {
    navigator.clipboard.writeText(text);
    setCopied(index);
    setTimeout(() => setCopied(null), 2000);
  }

  function downloadBrief() {
    if (!brief) return;
    const text = formatBriefAsText(brief);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${brief.title.replace(/[^a-z0-9]/gi, "_")}_brief.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Preview Studio</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Synthesize a production-ready video brief + keyframe reel from your selected scripts
        </p>
      </div>

      {/* Script selector */}
      {scripts.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">
            Selected Scripts ({scripts.length})
          </p>
          <div className="flex gap-2 flex-wrap">
            {scripts.map((script) => (
              <button
                key={script.id}
                onClick={() => {
                  setActiveScriptId(script.id);
                  setBrief(null);
                  setKeyframes([]);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  activeScriptId === script.id
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {script.title}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active script preview */}
      {activeScript && (
        <div className="rounded-lg border border-border bg-card p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Film className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{activeScript.title}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                {activeScript.angle} · {activeScript.format} · {activeScript.duration} · {activeScript.targetEmotion}
              </p>
            </div>
            <Button
              onClick={() => generateBrief(activeScript.id)}
              disabled={loading}
              className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Synthesizing brief...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  {brief ? "Regenerate brief" : "Generate video brief"}
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Hook</p>
              <p className="text-sm">{activeScript.hookVariants[0]}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">CTA</p>
              <p className="text-sm">{activeScript.ctaVariants[0]}</p>
            </div>
          </div>
        </div>
      )}

      {/* Video Brief */}
      {brief && (
        <>
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-base font-semibold tracking-tight">{brief.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground italic">{brief.logline}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={downloadBrief} size="sm" variant="outline" className="h-8 rounded-md text-xs">
                  <Download className="mr-1.5 h-3 w-3" />
                  Download brief
                </Button>
                <Button
                  onClick={generateKeyframes}
                  disabled={loadingKeyframes || !brief.shotList?.length}
                  size="sm"
                  className="h-8 rounded-md text-xs bg-foreground text-background hover:bg-foreground/90"
                >
                  {loadingKeyframes ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Rendering...
                    </>
                  ) : (
                    <>
                      <Camera className="mr-1.5 h-3 w-3" />
                      Generate keyframe reel
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <InfoTile label="Duration" value={brief.totalDuration} />
              <InfoTile label="Visual Style" value={brief.visualStyle} />
              <InfoTile label="Color Palette" value={brief.colorPalette} />
              <InfoTile label="Music" value={brief.musicDirection} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-3 border-t border-border">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Casting</p>
                <p className="text-sm">{brief.castingNotes}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Locations</p>
                <p className="text-sm">{brief.locationNotes}</p>
              </div>
            </div>

            {brief.brandGuidelines?.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-2">Brand Guidelines</p>
                <ul className="space-y-1">
                  {brief.brandGuidelines.map((g, i) => (
                    <li key={i} className="flex gap-2 text-sm">
                      <span className="mt-1.5 h-1 w-1 rounded-full bg-foreground shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Shot List */}
          <div className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                Shot List ({brief.shotList.length} shots)
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each shot includes camera direction + AI video prompt ready for Runway/Luma/Sora
              </p>
            </div>

            <div className="space-y-3">
              {brief.shotList.map((shot, i) => {
                const keyframe = keyframes[i];
                return (
                  <div key={shot.shotNumber} className="rounded-lg border border-border overflow-hidden">
                    <div className="flex flex-col lg:flex-row">
                      {/* Keyframe image */}
                      <div className="lg:w-60 shrink-0 aspect-video lg:aspect-square bg-muted relative">
                        {keyframe?.imageUrl ? (
                          <img src={keyframe.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : loadingKeyframes ? (
                          <div className="w-full h-full flex items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
                          </div>
                        )}
                        <div className="absolute top-2 left-2 bg-foreground/80 text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                          SHOT {shot.shotNumber}
                        </div>
                        <div className="absolute top-2 right-2 bg-foreground/80 text-background text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {shot.duration}
                        </div>
                      </div>

                      {/* Shot details */}
                      <div className="flex-1 p-4 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Tag label="Shot" value={shot.shotType} />
                          <Tag label="Angle" value={shot.cameraAngle} />
                          <Tag label="Movement" value={shot.cameraMovement} />
                          <Tag label="Lighting" value={shot.lighting} />
                        </div>

                        <div>
                          <p className="text-sm font-medium">{shot.sceneDescription}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <span className="font-medium text-foreground">Action:</span> {shot.action}
                          </p>
                        </div>

                        {shot.dialogue && shot.dialogue !== "none" && (
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Dialogue/VO:</span> &ldquo;{shot.dialogue}&rdquo;
                          </p>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Sound:</span> {shot.soundDesign}
                          </p>
                          <p className="text-muted-foreground">
                            <span className="font-medium text-foreground">Lens:</span> {shot.lensNotes}
                          </p>
                        </div>

                        {/* AI Video Prompt */}
                        <div className="pt-2 border-t border-border">
                          <div className="flex items-center justify-between mb-1.5">
                            <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                              AI Video Prompt (Runway/Luma/Sora)
                            </p>
                            <button
                              onClick={() => copyToClipboard(shot.aiVideoPrompt, i)}
                              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground"
                            >
                              {copied === i ? (
                                <>
                                  <Check className="h-3 w-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3" /> Copy
                                </>
                              )}
                            </button>
                          </div>
                          <div className="rounded-md bg-muted p-2.5 text-xs font-mono leading-relaxed">
                            {shot.aiVideoPrompt}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Call to Action / closing */}
          {brief.callToAction && (
            <div className="rounded-lg border border-border bg-muted/30 p-5">
              <p className="text-[11px] uppercase tracking-wider font-medium text-muted-foreground mb-1.5">Closing Frame</p>
              <p className="text-sm font-medium">{brief.callToAction}</p>
            </div>
          )}
        </>
      )}

      {/* Empty state */}
      {scripts.length === 0 && (
        <div className="rounded-lg border border-border bg-card py-16 text-center">
          <Palette className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            No scripts selected. Head to the Creative tab to generate scripts first.
          </p>
        </div>
      )}
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3">
      <p className="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">{label}</p>
      <p className="text-xs font-medium mt-0.5 line-clamp-2">{value}</p>
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}

function formatBriefAsText(brief: VideoBrief): string {
  const lines: string[] = [];
  lines.push(`VIDEO BRIEF: ${brief.title}`);
  lines.push("=".repeat(60));
  lines.push(`Logline: ${brief.logline}`);
  lines.push(`Duration: ${brief.totalDuration}`);
  lines.push("");
  lines.push(`Visual Style: ${brief.visualStyle}`);
  lines.push(`Color Palette: ${brief.colorPalette}`);
  lines.push(`Music: ${brief.musicDirection}`);
  lines.push(`Casting: ${brief.castingNotes}`);
  lines.push(`Locations: ${brief.locationNotes}`);
  lines.push("");
  lines.push("BRAND GUIDELINES:");
  brief.brandGuidelines.forEach((g) => lines.push(`- ${g}`));
  lines.push("");
  lines.push("SHOT LIST");
  lines.push("=".repeat(60));
  brief.shotList.forEach((s) => {
    lines.push(`\nSHOT ${s.shotNumber} (${s.duration})`);
    lines.push(`  Type: ${s.shotType} | Angle: ${s.cameraAngle} | Movement: ${s.cameraMovement}`);
    lines.push(`  Lighting: ${s.lighting} | Lens: ${s.lensNotes}`);
    lines.push(`  Scene: ${s.sceneDescription}`);
    lines.push(`  Action: ${s.action}`);
    if (s.dialogue && s.dialogue !== "none") lines.push(`  Dialogue/VO: "${s.dialogue}"`);
    lines.push(`  Sound: ${s.soundDesign}`);
    lines.push(`  AI VIDEO PROMPT:\n    ${s.aiVideoPrompt}`);
  });
  lines.push("");
  lines.push(`CLOSING: ${brief.callToAction}`);
  return lines.join("\n");
}
