"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function RegenerateButton({ storyPackId }: { storyPackId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRegenerate() {
    if (
      !confirm(
        "Regenerate this story? This will delete existing episodes and create new ones from the source content."
      )
    )
      return;

    setLoading(true);

    // Reset status to DRAFT first
    await fetch(`/api/story-packs/${storyPackId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DRAFT" }),
    });

    // Trigger generation
    const res = await fetch(`/api/story-packs/${storyPackId}/generate`, {
      method: "POST",
    });

    if (res.ok) {
      router.push(`/stories/${storyPackId}/progress`);
    } else {
      setLoading(false);
      alert("Failed to start regeneration");
    }
  }

  return (
    <button
      onClick={handleRegenerate}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      {loading ? "Regenerating..." : "Regenerate"}
    </button>
  );
}
