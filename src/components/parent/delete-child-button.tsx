"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

export function DeleteChildButton({ childId, childName }: { childId: string; childName: string }) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete ${childName}'s profile? This will also remove all their stories, progress, and listening history. This cannot be undone.`)) return;
    setDeleting(true);
    const res = await fetch(`/api/children/${childId}`, { method: "DELETE" });
    if (res.ok) {
      router.push("/children");
      router.refresh();
    } else {
      setDeleting(false);
      alert("Failed to delete profile");
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-1.5 text-sm text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
      {deleting ? "Deleting..." : `Delete ${childName}'s Profile`}
    </button>
  );
}
