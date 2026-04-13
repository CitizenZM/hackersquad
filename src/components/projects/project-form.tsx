"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, CAMPAIGN_GOALS } from "@/lib/constants";
import { Plus, Trash2, Loader2, Rocket } from "lucide-react";

interface CompetitorField {
  name: string;
  url: string;
}

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [category, setCategory] = useState("");
  const [campaignGoal, setCampaignGoal] = useState("");
  const [competitors, setCompetitors] = useState<CompetitorField[]>([
    { name: "", url: "" },
  ]);

  function addCompetitor() {
    setCompetitors((prev) => [...prev, { name: "", url: "" }]);
  }

  function removeCompetitor(index: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== index));
  }

  function updateCompetitor(
    index: number,
    field: keyof CompetitorField,
    value: string
  ) {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const validCompetitors = competitors.filter((c) => c.name.trim());
    if (validCompetitors.length === 0) {
      setError("Add at least one competitor!");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandName: brandName.trim(),
          brandUrl: brandUrl.trim() || undefined,
          category: category || undefined,
          campaignGoal: campaignGoal || undefined,
          competitors: validCompetitors.map((c) => ({
            name: c.name.trim(),
            url: c.url.trim() || undefined,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Oops! Something went wrong.");
      }

      const project = await res.json();
      router.push(`/projects/${project.id}/research`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Brand */}
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-purple-700">🏷️ Brand Name</Label>
          <Input
            placeholder="e.g. Nike, Tesla, Segway..."
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
            className="rounded-2xl h-12 text-base border-2 border-purple-200 focus:border-purple-500 bg-purple-50/50 font-semibold"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-bold text-purple-700">🌐 Website</Label>
          <Input
            type="url"
            placeholder="https://www.brand.com"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            className="rounded-2xl h-12 text-base border-2 border-purple-200 focus:border-purple-500 bg-purple-50/50"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-purple-700">📂 Category</Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger className="rounded-2xl h-12 border-2 border-purple-200 bg-purple-50/50">
                <SelectValue placeholder="Pick one..." />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm font-bold text-purple-700">🎯 Goal</Label>
            <Select value={campaignGoal} onValueChange={(v) => setCampaignGoal(v ?? "")}>
              <SelectTrigger className="rounded-2xl h-12 border-2 border-purple-200 bg-purple-50/50">
                <SelectValue placeholder="Pick one..." />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_GOALS.map((goal) => (
                  <SelectItem key={goal} value={goal}>{goal}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Competitors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-bold text-purple-700">⚔️ Competitors</Label>
          <button
            type="button"
            onClick={addCompetitor}
            className="text-xs font-bold text-purple-500 hover:text-purple-700 flex items-center gap-1"
          >
            <Plus className="h-3.5 w-3.5" /> Add More
          </button>
        </div>
        {competitors.map((comp, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Competitor name"
              value={comp.name}
              onChange={(e) => updateCompetitor(i, "name", e.target.value)}
              className="rounded-2xl h-11 border-2 border-pink-200 focus:border-pink-500 bg-pink-50/50 font-semibold flex-1"
            />
            <Input
              type="url"
              placeholder="URL (optional)"
              value={comp.url}
              onChange={(e) => updateCompetitor(i, "url", e.target.value)}
              className="rounded-2xl h-11 border-2 border-pink-200 focus:border-pink-500 bg-pink-50/50 flex-1 hidden sm:block"
            />
            {competitors.length > 1 && (
              <button
                type="button"
                onClick={() => removeCompetitor(i)}
                className="text-pink-300 hover:text-pink-600 p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 border-2 border-red-200 p-3 text-sm text-red-600 font-bold text-center">
          😢 {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !brandName.trim()}
        className="w-full h-14 rounded-2xl text-lg font-black gradient-fun border-0 shadow-lg shadow-purple-400/30 hover:shadow-purple-400/50 transition-all active:scale-[0.98]"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Launching...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-5 w-5" />
            Launch Research!
          </>
        )}
      </Button>
    </form>
  );
}
