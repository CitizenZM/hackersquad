"use client";

import type { WizardData } from "./wizard-shell";
import { VISUAL_STYLE_LABELS } from "@/lib/constants";
import { Palette, Check } from "lucide-react";

const STYLE_DETAILS: Record<string, { color: string; description: string }> = {
  CARTOON: {
    color: "bg-blue-100 text-blue-600",
    description: "Bright, colorful cartoon illustrations with soft rounded shapes",
  },
  WATERCOLOR: {
    color: "bg-purple-100 text-purple-600",
    description: "Gentle watercolor paintings with dreamy pastel colors",
  },
  STORYBOOK: {
    color: "bg-amber-100 text-amber-600",
    description: "Classic storybook illustrations with warm, detailed art",
  },
  PIXEL_ART: {
    color: "bg-green-100 text-green-600",
    description: "Fun pixel art with a retro game feel",
  },
};

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}

export function StepVisualStyle({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Visual Style</h2>
        <p className="text-sm text-muted-foreground">
          Choose the illustration style for flashcard scenes
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {Object.entries(VISUAL_STYLE_LABELS).map(([value, label]) => {
          const detail = STYLE_DETAILS[value];
          return (
            <button
              key={value}
              onClick={() => onChange({ visualStyle: value })}
              className={`flex flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors ${
                data.visualStyle === value
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <div className={`rounded-md p-2 ${detail?.color}`}>
                  <Palette className="h-4 w-4" />
                </div>
                {data.visualStyle === value && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">
                {detail?.description}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
