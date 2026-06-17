"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface ProgressSummary {
  childName: string;
  episodesCompleted: number;
  completionRate: number;
  streak: number;
  vocabWords: number;
}

export function CopyProgressButton({ summary }: { summary: ProgressSummary }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = `📊 ${summary.childName}'s StoryNest Progress
✅ ${summary.episodesCompleted} episodes completed
📈 ${summary.completionRate}% completion rate
🔥 ${summary.streak} day streak
📚 ${summary.vocabWords} vocabulary words
— Shared from StoryNest Kids`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : "Copy Summary"}
    </button>
  );
}
