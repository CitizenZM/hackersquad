"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ClearHistoryButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleClear() {
    if (!confirm("Delete all listening history? This cannot be undone.")) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/settings/clear-history", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setResult(`Deleted ${data.deleted} session event${data.deleted !== 1 ? "s" : ""}.`);
      } else {
        setResult("Failed to clear history. Please try again.");
      }
    } catch {
      setResult("Failed to clear history. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button variant="destructive" size="sm" onClick={handleClear} disabled={loading}>
        <Trash2 className="h-4 w-4 mr-2" />
        {loading ? "Clearing…" : "Clear Listening History"}
      </Button>
      {result && (
        <p className="text-xs text-muted-foreground">{result}</p>
      )}
    </div>
  );
}
