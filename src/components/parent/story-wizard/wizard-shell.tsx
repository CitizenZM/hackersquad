"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StepSelectSource } from "./step-select-source";
import { StepSelectChild } from "./step-select-child";
import { StepStoryGoal } from "./step-story-goal";
import { StepNarration } from "./step-narration";
import { StepVisualStyle } from "./step-visual-style";
import { StepReviewConfirm } from "./step-review-confirm";

export interface WizardData {
  sourceId: string;
  sourceName: string;
  sourceWordCount: number;
  childProfileId: string;
  childName: string;
  title: string;
  description: string;
  storyGoal: string;
  narrationMode: string;
  visualStyle: string;
}

interface WizardShellProps {
  sources: Array<{ id: string; title: string; wordCount: number }>;
  children: Array<{ id: string; name: string; age: number; ageGroup: string }>;
  preSelectedSourceId?: string;
}

const STEPS = [
  "Select Source",
  "Select Child",
  "Story Goal",
  "Narration",
  "Visual Style",
  "Review & Create",
];

export function WizardShell({ sources, children, preSelectedSourceId }: WizardShellProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const preSource = preSelectedSourceId
    ? sources.find((s) => s.id === preSelectedSourceId)
    : undefined;

  const [data, setData] = useState<WizardData>({
    sourceId: preSource?.id || "",
    sourceName: preSource?.title || "",
    sourceWordCount: preSource?.wordCount || 0,
    childProfileId: "",
    childName: "",
    title: "",
    description: "",
    storyGoal: "ENTERTAIN",
    narrationMode: "DEFAULT_TTS",
    visualStyle: "CARTOON",
  });

  function updateData(partial: Partial<WizardData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  function canProceed(): boolean {
    switch (step) {
      case 0: return !!data.sourceId;
      case 1: return !!data.childProfileId;
      case 2: return !!data.storyGoal;
      case 3: return !!data.narrationMode;
      case 4: return !!data.visualStyle;
      case 5: return !!data.title;
      default: return false;
    }
  }

  async function handleCreate() {
    setLoading(true);
    setError("");

    try {
      // Create story pack
      const createRes = await fetch("/api/story-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceId: data.sourceId,
          childProfileId: data.childProfileId,
          title: data.title,
          description: data.description,
          storyGoal: data.storyGoal,
          narrationMode: data.narrationMode,
          visualStyle: data.visualStyle,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        setError(err.error || "Failed to create story pack");
        return;
      }

      const storyPack = await createRes.json();

      // Start generation
      await fetch(`/api/story-packs/${storyPack.id}/generate`, { method: "POST" });

      router.push(`/stories/${storyPack.id}/progress`);
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* Step indicator */}
      <div className="flex gap-1">
        {STEPS.map((label, i) => (
          <div key={label} className="flex-1">
            <div
              className={`h-1.5 rounded-full transition-colors ${
                i <= step ? "bg-primary" : "bg-muted"
              }`}
            />
            <p className={`mt-1 text-xs ${i === step ? "font-medium text-primary" : "text-muted-foreground"}`}>
              {label}
            </p>
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {step === 0 && <StepSelectSource sources={sources} data={data} onChange={updateData} />}
          {step === 1 && <StepSelectChild children={children} data={data} onChange={updateData} />}
          {step === 2 && <StepStoryGoal data={data} onChange={updateData} />}
          {step === 3 && <StepNarration data={data} onChange={updateData} />}
          {step === 4 && <StepVisualStyle data={data} onChange={updateData} />}
          {step === 5 && <StepReviewConfirm data={data} onChange={updateData} />}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep(step - 1) : router.back()}
        >
          {step === 0 ? "Cancel" : "Back"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
            Next
          </Button>
        ) : (
          <Button onClick={handleCreate} disabled={loading || !canProceed()}>
            {loading ? "Creating..." : "Generate Story Pack"}
          </Button>
        )}
      </div>
    </div>
  );
}
