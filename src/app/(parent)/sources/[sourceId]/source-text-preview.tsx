"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const PREVIEW_LENGTH = 2000;

export function SourceTextPreview({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = text.length > PREVIEW_LENGTH;
  const displayText = expanded || !needsTruncation ? text : text.slice(0, PREVIEW_LENGTH);

  return (
    <div className="space-y-2">
      <pre className="whitespace-pre-wrap break-words text-sm text-muted-foreground font-sans leading-relaxed">
        {displayText}
        {!expanded && needsTruncation && "…"}
      </pre>
      {needsTruncation && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="text-primary"
        >
          {expanded ? "Show less" : `Show more (${text.length.toLocaleString()} chars total)`}
        </Button>
      )}
    </div>
  );
}
