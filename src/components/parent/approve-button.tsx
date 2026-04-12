"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export function ApproveButton({ storyPackId }: { storyPackId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/story-packs/${storyPackId}/approve`, {
        method: "POST",
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleApprove} disabled={loading}>
      <Check className="mr-2 h-4 w-4" />
      {loading ? "Publishing..." : "Approve & Publish"}
    </Button>
  );
}
