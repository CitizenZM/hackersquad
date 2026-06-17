"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FlagButton({ storyPackId }: { storyPackId: string }) {
  const router = useRouter();
  const [flagged, setFlagged] = useState(false);

  async function handleFlag() {
    if (!confirm("Flag this story for review? It will be unpublished until re-approved.")) return;

    const res = await fetch(`/api/story-packs/${storyPackId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVIEW_READY" }),
    });

    if (res.ok) {
      setFlagged(true);
      router.refresh();
    }
  }

  if (flagged) return <span className="text-xs text-amber-600">Flagged for review</span>;

  return (
    <button
      onClick={handleFlag}
      className="text-xs text-muted-foreground hover:text-amber-600 transition-colors"
    >
      Flag for review
    </button>
  );
}
