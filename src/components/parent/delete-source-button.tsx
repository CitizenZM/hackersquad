"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteSourceButton({ sourceId, hasStories }: { sourceId: string; hasStories: boolean }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const message = hasStories
      ? "This source has story packs linked to it. Deleting it will also delete those stories. Continue?"
      : "Delete this source content?";
    if (!confirm(message)) return;

    setDeleting(true);
    const res = await fetch(`/api/sources/${sourceId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/sources");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 rounded-lg border border-destructive/20 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? "Deleting..." : "Delete Source"}
    </button>
  );
}
