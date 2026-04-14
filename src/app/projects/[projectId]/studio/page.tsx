"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Loader2, Image as ImageIcon, Palette, Download } from "lucide-react";

interface PreviewAsset {
  id: string;
  prompt: string;
  imageUrl: string | null;
  style: string | null;
  dimensions: string | null;
  status: string;
  createdAt: string;
}

export default function StudioPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("clean, modern, commercial photography");
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<PreviewAsset[]>([]);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/studio/frames`)
      .then((res) => res.json())
      .then(setAssets)
      .catch(console.error);
  }, [projectId]);

  async function generateFrame() {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/studio/frames`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style }),
      });
      const data = await res.json();
      setAssets((prev) => [data, ...prev]);
      setPrompt("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold tracking-tight">Preview Studio</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Generate AI concept frames for ads and storyboards
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prompt panel */}
        <div className="lg:col-span-1 rounded-lg border border-border bg-card p-5 space-y-4 lg:sticky lg:top-20 self-start">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <h3 className="text-sm font-semibold tracking-tight">Generate frame</h3>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Image prompt
            </Label>
            <Textarea
              placeholder="e.g. A young woman in a modern kitchen holding the product, warm natural lighting, lifestyle photography"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={5}
              className="rounded-md text-sm"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Visual style
            </Label>
            <Input
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="h-9 rounded-md text-sm"
            />
          </div>
          <Button
            onClick={generateFrame}
            disabled={loading || !prompt.trim()}
            className="w-full h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <ImageIcon className="mr-2 h-4 w-4" />
                Generate
              </>
            )}
          </Button>
        </div>

        {/* Gallery */}
        <div className="lg:col-span-2">
          {assets.length === 0 && !loading ? (
            <div className="rounded-lg border border-border bg-card py-16 text-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No frames generated yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-lg border border-border bg-card overflow-hidden"
                >
                  {asset.imageUrl ? (
                    <div className="aspect-square bg-muted">
                      <img
                        src={asset.imageUrl}
                        alt={asset.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-muted flex items-center justify-center p-6">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                        <p className="text-[11px] text-muted-foreground line-clamp-4">
                          {asset.prompt}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {asset.prompt}
                    </p>
                    <div className="flex items-center justify-between">
                      <StatusBadge level={asset.status === "complete" ? "healthy" : "ai"}>
                        {asset.status}
                      </StatusBadge>
                      {asset.imageUrl && (
                        <a
                          href={asset.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
