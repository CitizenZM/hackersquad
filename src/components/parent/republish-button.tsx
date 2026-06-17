"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

export function RepublishButton({ storyPackId }: { storyPackId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleRepublish() {
    setLoading(true);
    try {
      const res = await fetch(`/api/story-packs/${storyPackId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PUBLISHED" }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleRepublish} disabled={loading}>
      <Eye className="mr-2 h-4 w-4" />
      {loading ? "Publishing..." : "Publish"}
    </Button>
  );
}
