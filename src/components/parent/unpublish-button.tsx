"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EyeOff } from "lucide-react";

export function UnpublishButton({ storyPackId }: { storyPackId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleUnpublish() {
    if (!confirm("Unpublish this story? Your child won't see it until you publish it again.")) return;
    setLoading(true);
    const res = await fetch(`/api/story-packs/${storyPackId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleUnpublish}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
    >
      <EyeOff className="h-4 w-4" />
      {loading ? "..." : "Unpublish"}
    </button>
  );
}
