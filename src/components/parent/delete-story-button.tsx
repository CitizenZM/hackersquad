"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteStoryButton({ storyPackId }: { storyPackId: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Delete this story pack? This cannot be undone. All episodes, scenes, and vocabulary will be permanently removed.")) return;

    setDeleting(true);
    const res = await fetch(`/api/story-packs/${storyPackId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      router.push("/stories");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete story");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? "Deleting..." : "Delete"}
    </button>
  );
}
