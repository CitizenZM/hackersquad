"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { NARRATIVE_TYPE_LABELS } from "@/lib/constants";
import { Loader2, Wand2, FileText, Layout, Grid3X3, Check } from "lucide-react";

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

  async function generateAngles() {
    setLoadingAngles(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/creative/angles`, {
        method: "POST",
      });
      const data = await res.json();
      setAngles(data.angles || []);
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMatrix(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Generate Angles */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wand2 className="h-5 w-5" /> Ad Angles
            </h2>
            <p className="text-sm text-muted-foreground">
              Generate data-backed ad angles from your brand intelligence
            </p>
          </div>
          <Button onClick={generateAngles} disabled={loadingAngles}>
            {loadingAngles ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Generate 10 Angles
          </Button>
        </div>

        {angles.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {angles.map((angle) => (
              <Card
                key={angle.id}
                className={`cursor-pointer transition-colors ${
                  selectedAngle?.id === angle.id
                    ? "border-primary ring-1 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => setSelectedAngle(angle)}
              >
                <CardContent className="pt-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <h3 className="text-sm font-medium">{angle.title}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {angle.predictedScore}
                      </Badge>
                      {selectedAngle?.id === angle.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {angle.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-[10px]">
                      {NARRATIVE_TYPE_LABELS[angle.narrativeType] || angle.narrativeType}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {angle.targetEmotion}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {angle.platform}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic">
                    {angle.rationale}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    AI Predicted Score
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedAngle && (
          <Button
            onClick={() => generateScript(selectedAngle)}
            disabled={loadingScript}
            variant="secondary"
          >
            {loadingScript ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            Generate Script for &ldquo;{selectedAngle.title}&rdquo;
          </Button>
        )}
      </section>

      {/* Section 2: Scripts */}
      {scripts.length > 0 && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" /> Scripts
            </h2>
            <div className="space-y-4">
              {scripts.map((script) => (
                <Card
                  key={script.id}
                  className={`cursor-pointer transition-colors ${
                    selectedScript?.id === script.id
                      ? "border-primary ring-1 ring-primary"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedScript(script)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm">{script.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="secondary">{script.duration}</Badge>
                        <Badge variant="outline">Score: {script.predictedScore}</Badge>
                        <Badge variant="outline" className="text-[10px]">AI Predicted</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Hook Variants
                      </p>
                      <div className="space-y-1 mt-1">
                        {script.hookVariants.map((hook, i) => (
                          <p key={i} className="text-sm">
                            {i + 1}. {hook}
                          </p>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        Script Body
                      </p>
                      <p className="text-sm mt-1 whitespace-pre-wrap bg-muted p-3 rounded">
                        {script.body}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase">
                        CTA Variants
                      </p>
                      <div className="space-y-1 mt-1">
                        {script.ctaVariants.map((cta, i) => (
                          <p key={i} className="text-sm">
                            {i + 1}. {cta}
                          </p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedScript && (
              <Button
                onClick={() => generateStoryboard(selectedScript)}
                disabled={loadingStoryboard}
                variant="secondary"
              >
                {loadingStoryboard ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Layout className="mr-2 h-4 w-4" />
                )}
                Generate Storyboard for &ldquo;{selectedScript.title}&rdquo;
              </Button>
            )}
          </section>
        </>
      )}

      {/* Section 3: Storyboard */}
      {storyboard && (
        <>
          <Separator />
          <section className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layout className="h-5 w-5" /> Storyboard: {storyboard.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {storyboard.style} - {storyboard.totalDuration}
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {storyboard.frames.map((frame) => (
                <Card key={frame.frameNumber}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="aspect-video rounded bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center p-3">
                      <p className="text-xs text-muted-foreground text-center">
                        {frame.imagePrompt.slice(0, 120)}...
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">Frame {frame.frameNumber}</Badge>
                      <span className="text-xs text-muted-foreground">{frame.duration}</span>
                    </div>
                    <p className="text-sm font-medium">{frame.scene}</p>
                    <p className="text-xs text-muted-foreground">{frame.voiceover}</p>
                    {frame.textOverlay && (
                      <p className="text-xs font-medium">Text: {frame.textOverlay}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground italic">
                      {frame.cameraNotes}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </>
      )}

      {/* Section 4: Test Matrix */}
      <Separator />
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Grid3X3 className="h-5 w-5" /> Creative Test Matrix
            </h2>
            <p className="text-sm text-muted-foreground">
              Auto-generated variants with predictive scoring
            </p>
          </div>
          <Button onClick={generateTestMatrix} disabled={loadingMatrix}>
            {loadingMatrix ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Grid3X3 className="mr-2 h-4 w-4" />
            )}
            Generate Test Matrix
          </Button>
        </div>

        {testMatrix.length > 0 && (
          <div className="space-y-2">
            {testMatrix
              .sort((a, b) => b.predictedScore - a.predictedScore)
              .map((variant, i) => (
                <Card key={i}>
                  <CardContent className="py-3">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-muted-foreground w-8">
                        #{i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <Badge variant="secondary" className="text-xs">
                            {variant.hookVariant.slice(0, 40)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {NARRATIVE_TYPE_LABELS[variant.narrativeType] || variant.narrativeType}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {variant.ctaVariant}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {variant.format}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {variant.scriptOutline}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-bold">{variant.predictedScore}</span>
                        <p className="text-[10px] text-muted-foreground">AI Predicted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}
