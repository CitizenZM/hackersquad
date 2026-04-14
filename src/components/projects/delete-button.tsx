"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this project and all its data?")) return;
    setLoading(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={handleDelete}
      className="p-1.5 rounded-md text-muted-foreground hover:text-[var(--status-urgent-fg)] hover:bg-[var(--status-urgent-bg)] transition-colors"
      title="Delete project"
      aria-label="Delete project"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Trash2 className="h-4 w-4" />
      )}
    </button>
  );
}
