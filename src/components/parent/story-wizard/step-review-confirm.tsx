"use client";

import type { WizardData } from "./wizard-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  STORY_GOAL_LABELS,
  NARRATION_MODE_LABELS,
  VISUAL_STYLE_LABELS,
  estimateEpisodeCount,
} from "@/lib/constants";

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}

export function StepReviewConfirm({ data, onChange }: Props) {
  const episodeCount = estimateEpisodeCount(data.sourceWordCount);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Review & Create</h2>
        <p className="text-sm text-muted-foreground">
          Give your story a title and review your selections
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Story Title</Label>
        <Input
          id="title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Enter a title for this story pack"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="A short description to help parents and children know what this story is about"
          rows={2}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground text-right">
          {data.description.length}/200
        </p>
      </div>

      <div className="rounded-lg border divide-y">
        <SummaryRow label="Source" value={data.sourceName} />
        <SummaryRow label="Word Count" value={`${data.sourceWordCount.toLocaleString()} words`} />
        <SummaryRow label="Episodes" value={`${episodeCount} (each ~5 min)`} />
        <SummaryRow label="For" value={data.childName} />
        <SummaryRow label="Goal" value={STORY_GOAL_LABELS[data.storyGoal] || data.storyGoal} />
        <SummaryRow label="Narration" value={NARRATION_MODE_LABELS[data.narrationMode] || data.narrationMode} />
        <SummaryRow label="Visual Style" value={VISUAL_STYLE_LABELS[data.visualStyle] || data.visualStyle} />
      </div>

      {/* What you'll get */}
      <div className="rounded-lg bg-primary/5 p-4 space-y-3">
        <p className="text-sm font-semibold text-primary">What the AI will create:</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span>📖</span>
            <span>{episodeCount} episode{episodeCount !== 1 ? "s" : ""} (~5 min each)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🎨</span>
            <span>6-10 illustrated scenes per episode</span>
          </div>
          <div className="flex items-center gap-2">
            <span>🔊</span>
            <span>AI narration audio</span>
          </div>
          <div className="flex items-center gap-2">
            <span>📝</span>
            <span>Vocabulary cards per episode</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Estimated processing time: ~{Math.max(2, episodeCount * 3)} minutes.
          You can review everything before publishing to your child.
        </p>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
