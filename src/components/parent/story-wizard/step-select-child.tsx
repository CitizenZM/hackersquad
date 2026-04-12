"use client";

import type { WizardData } from "./wizard-shell";
import { AGE_GROUP_LABELS } from "@/lib/constants";
import { Check } from "lucide-react";

interface Props {
  children: Array<{ id: string; name: string; age: number; ageGroup: string }>;
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}

export function StepSelectChild({ children, data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Select Child</h2>
        <p className="text-sm text-muted-foreground">
          Choose which child this story is for — the content will be adapted for their age
        </p>
      </div>

      {children.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No child profiles yet.</p>
          <p className="text-xs">Create a child profile first.</p>
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() =>
                onChange({ childProfileId: child.id, childName: child.name })
              }
              className={`flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                data.childProfileId === child.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                {child.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-medium">{child.name}</div>
                <div className="text-xs text-muted-foreground">
                  Age {child.age} &middot; {AGE_GROUP_LABELS[child.ageGroup]}
                </div>
              </div>
              {data.childProfileId === child.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
