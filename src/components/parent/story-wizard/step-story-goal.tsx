"use client";

import type { WizardData } from "./wizard-shell";
import { STORY_GOAL_LABELS, STORY_GOAL_DESCRIPTIONS } from "@/lib/constants";
import { Sparkles, GraduationCap, Heart, BookOpen, Moon, Check } from "lucide-react";

const GOAL_ICONS: Record<string, React.ReactNode> = {
  ENTERTAIN: <Sparkles className="h-5 w-5" />,
  EDUCATE: <GraduationCap className="h-5 w-5" />,
  MORAL_LESSON: <Heart className="h-5 w-5" />,
  VOCABULARY: <BookOpen className="h-5 w-5" />,
  BEDTIME: <Moon className="h-5 w-5" />,
};

interface Props {
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}

export function StepStoryGoal({ data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Story Goal</h2>
        <p className="text-sm text-muted-foreground">
          What should this story focus on?
        </p>
      </div>

      <div className="space-y-2">
        {Object.entries(STORY_GOAL_LABELS).map(([value, label]) => (
          <button
            key={value}
            onClick={() => onChange({ storyGoal: value })}
            className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
              data.storyGoal === value
                ? "border-primary bg-primary/5"
                : "hover:bg-accent/50"
            }`}
          >
            <div className="text-primary">{GOAL_ICONS[value]}</div>
            <div className="flex-1">
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">
                {STORY_GOAL_DESCRIPTIONS[value]}
              </div>
            </div>
            {data.storyGoal === value && (
              <Check className="h-5 w-5 text-primary" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
