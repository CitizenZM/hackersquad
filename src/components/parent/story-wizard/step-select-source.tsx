"use client";

import type { WizardData } from "./wizard-shell";
import { estimateEpisodeCount } from "@/lib/constants";
import { FileText, Check } from "lucide-react";

interface Props {
  sources: Array<{ id: string; title: string; wordCount: number }>;
  data: WizardData;
  onChange: (d: Partial<WizardData>) => void;
}

export function StepSelectSource({ sources, data, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Select Source Content</h2>
        <p className="text-sm text-muted-foreground">
          Choose the content you want to transform into a story
        </p>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FileText className="mx-auto h-8 w-8 mb-2" />
          <p>No sources uploaded yet.</p>
          <p className="text-xs">Upload content first from the Sources page.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sources.map((source) => (
            <button
              key={source.id}
              onClick={() =>
                onChange({
                  sourceId: source.id,
                  sourceName: source.title,
                  sourceWordCount: source.wordCount,
                  title: data.title || source.title,
                })
              }
              className={`w-full flex items-center gap-3 rounded-lg border p-4 text-left transition-colors ${
                data.sourceId === source.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/50"
              }`}
            >
              <FileText className="h-5 w-5 shrink-0 text-primary/60" />
              <div className="flex-1">
                <div className="font-medium">{source.title}</div>
                <div className="text-xs text-muted-foreground">
                  {source.wordCount.toLocaleString()} words &middot;{" "}
                  ~{estimateEpisodeCount(source.wordCount)} episodes
                </div>
              </div>
              {data.sourceId === source.id && (
                <Check className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
