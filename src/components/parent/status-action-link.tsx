"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface StatusActionLinkProps {
  storyPackId: string;
  status: string;
}

export function StatusActionLink({ storyPackId, status }: StatusActionLinkProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(newStatus: string, confirmMsg?: string) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setLoading(true);
    const res = await fetch(`/api/story-packs/${storyPackId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) router.refresh();
    setLoading(false);
  }

  if (status === "PUBLISHED") {
    return (
      <button
        onClick={() =>
          handleStatusChange(
            "APPROVED",
            "Unpublish this story? Your child won't see it until you publish it again."
          )
        }
        disabled={loading}
        className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {loading ? "..." : "Unpublish"}
      </button>
    );
  }

  if (status === "REVIEW_READY") {
    return (
      <Link
        href={`/stories/${storyPackId}`}
        className="text-xs text-primary hover:underline"
      >
        Review
      </Link>
    );
  }

  if (status === "APPROVED") {
    return (
      <button
        onClick={() => handleStatusChange("PUBLISHED")}
        disabled={loading}
        className="text-xs text-primary hover:underline disabled:opacity-50"
      >
        {loading ? "..." : "Publish"}
      </button>
    );
  }

  return null;
}
