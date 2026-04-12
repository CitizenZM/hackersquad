"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CATEGORIES, CAMPAIGN_GOALS } from "@/lib/constants";
import { Plus, Trash2, Loader2 } from "lucide-react";

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
      setError("Add at least one competitor");
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
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brandName">Brand Name *</Label>
            <Input
              id="brandName"
              placeholder="e.g. Nike"
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="brandUrl">Website URL</Label>
            <Input
              id="brandUrl"
              type="url"
              placeholder="https://www.nike.com"
              value={brandUrl}
              onChange={(e) => setBrandUrl(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(v) => setCategory(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Campaign Goal</Label>
              <Select value={campaignGoal} onValueChange={(v) => setCampaignGoal(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select goal" />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_GOALS.map((goal) => (
                    <SelectItem key={goal} value={goal}>
                      {goal}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Competitors</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={addCompetitor}>
              <Plus className="mr-1 h-4 w-4" />
              Add Competitor
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {competitors.map((comp, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Competitor name"
                  value={comp.name}
                  onChange={(e) => updateCompetitor(i, "name", e.target.value)}
                />
              </div>
              <div className="flex-1 space-y-2">
                <Input
                  type="url"
                  placeholder="https://competitor.com"
                  value={comp.url}
                  onChange={(e) => updateCompetitor(i, "url", e.target.value)}
                />
              </div>
              {competitors.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeCompetitor(i)}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <Button type="submit" size="lg" disabled={loading || !brandName.trim()}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Project...
          </>
        ) : (
          "Create Project & Start Research"
        )}
      </Button>
    </form>
  );
}
