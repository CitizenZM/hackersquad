"use client";

import type { WizardData } from "./wizard-shell";
import { NARRATION_MODE_LABELS } from "@/lib/constants";
import { Volume2, Mic, Check } from "lucide-react";

const MODE_DETAILS: Record<string, { icon: React.ReactNode; description: string }> = {
  DEFAULT_TTS: {
    icon: <Volume2 className="h-5 w-5" />,
    description: "High-quality AI narrator voice — warm and friendly",
  },
  PARENT_VOICE: {
    icon: <Mic className="h-5 w-5" />,
    description: "Use your recorded voice clone (requires Voice Studio setup)",
  },
};

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}

export function StepNarration({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Narration Style</h2>
        <p className="text-sm text-muted-foreground">
          Choose who tells the story
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(NARRATION_MODE_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onChange({ narrationMode: value })}
            className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
              data.narrationMode === value
                ? "border-primary bg-primary/5"
                : "hover:bg-accent/50"
            }`}
          >
            <div className="text-primary">{MODE_DETAILS[value]?.icon}</div>
            <div className="flex-1">
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">
                {MODE_DETAILS[value]?.description}
              </div>
            </div>
            {data.narrationMode === value && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
