"use client";

import { useState } from "react";
import { Loader2, ImageIcon } from "lucide-react";

interface LofiFrameProps {
  scene: string;
  imagePrompt: string;
  frameNumber: number;
  duration: string;
  projectId: string;
}

export function LofiFrame({
  scene,
  imagePrompt,
  frameNumber,
  duration,
  projectId,
}: LofiFrameProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  async function generateImage() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/studio/frames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: imagePrompt,
          style: "lo-fi storyboard sketch",
          dimensions: "256x256",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.imageUrl) setImageUrl(data.imageUrl);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  // Auto-generate on first render
  if (!autoTriggered && !imageUrl && !loading) {
    setAutoTriggered(true);
    generateImage();
  }

  return (
    <div className="aspect-[16/10] relative overflow-hidden rounded-t-lg bg-muted">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={scene}
          className="w-full h-full object-cover"
        />
      ) : loading ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Rendering frame {frameNumber}...</p>
        </div>
      ) : (
        <button
          onClick={generateImage}
          className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors"
        >
          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
          <p className="text-[10px] text-muted-foreground">Click to generate</p>
        </button>
      )}
      <div className="absolute top-2 left-2 bg-foreground/70 text-background text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
        {duration}
      </div>
      <div className="absolute top-2 right-2 bg-foreground/70 text-background text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm">
        #{frameNumber}
      </div>
    </div>
  );
}
