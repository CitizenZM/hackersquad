"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";

interface DuplicateStoryButtonProps {
  storyPackId: string;
  currentChildId: string;
}

export function DuplicateStoryButton({ storyPackId, currentChildId }: DuplicateStoryButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDuplicate() {
    if (!confirm("Create a copy of this story for the same child? The copy will be set to Published.")) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/story-packs/${storyPackId}/duplicate`, {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        router.push(`/stories/${data.id}`);
        router.refresh();
      } else {
        alert("Failed to duplicate story");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleDuplicate}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <Copy className="h-4 w-4" />
      {loading ? "Copying..." : "Duplicate"}
    </button>
  );
}
