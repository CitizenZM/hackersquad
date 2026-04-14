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
import { Plus, Trash2, Loader2, ArrowRight } from "lucide-react";

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
      setError("Add at least one competitor.");
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
        throw new Error(data.error || "Failed to create project");
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
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="brandName" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Brand name
          </Label>
          <Input
            id="brandName"
            placeholder="e.g. Segway, Nike, Tesla"
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            required
            className="h-10 rounded-md"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brandUrl" className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Website URL
          </Label>
          <Input
            id="brandUrl"
            type="url"
            placeholder="https://www.brand.com"
            value={brandUrl}
            onChange={(e) => setBrandUrl(e.target.value)}
            className="h-10 rounded-md"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Category
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
              <SelectTrigger className="h-10 rounded-md">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Campaign goal
            </Label>
            <Select value={campaignGoal} onValueChange={(v) => setCampaignGoal(v ?? "")}>
              <SelectTrigger className="h-10 rounded-md">
                <SelectValue placeholder="Select goal" />
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

      <div className="space-y-3 pt-2 border-t border-border">
        <div className="flex items-center justify-between pt-3">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Competitors
          </Label>
          <button
            type="button"
            onClick={addCompetitor}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        </div>
        {competitors.map((comp, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input
              placeholder="Competitor name"
              value={comp.name}
              onChange={(e) => updateCompetitor(i, "name", e.target.value)}
              className="h-10 rounded-md flex-1"
            />
            <Input
              type="url"
              placeholder="URL (optional)"
              value={comp.url}
              onChange={(e) => updateCompetitor(i, "url", e.target.value)}
              className="h-10 rounded-md flex-1 hidden sm:block"
            />
            {competitors.length > 1 && (
              <button
                type="button"
                onClick={() => removeCompetitor(i)}
                className="text-muted-foreground hover:text-foreground p-2 transition-colors"
                aria-label="Remove competitor"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md border border-[var(--status-urgent)] bg-[var(--status-urgent-bg)] px-3 py-2 text-xs text-[var(--status-urgent-fg)]">
          {error}
        </div>
      )}

      <Button
        type="submit"
        disabled={loading || !brandName.trim()}
        className="w-full h-10 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating project...
          </>
        ) : (
          <>
            Launch research
            <ArrowRight className="ml-2 h-4 w-4" />
          </>
        )}
      </Button>
    </form>
  );
}
