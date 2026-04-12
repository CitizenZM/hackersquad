"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Image, Palette, Download } from "lucide-react";

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Generation form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            AI Preview Studio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Image Prompt</Label>
            <Textarea
              placeholder="Describe the ad concept frame you want to generate. E.g., 'A young woman in a modern kitchen, holding the product with natural lighting, smiling, lifestyle photography feel, warm color palette'"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label>Visual Style</Label>
            <Input
              placeholder="e.g., cinematic, lifestyle photography, flat lay, product hero"
              value={style}
              onChange={(e) => setStyle(e.target.value)}
            />
          </div>
          <Button onClick={generateFrame} disabled={loading || !prompt.trim()}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Image className="mr-2 h-4 w-4" />
            )}
            Generate Concept Frame
          </Button>
        </CardContent>
      </Card>

      {/* Generated frames gallery */}
      {assets.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Generated Frames</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assets.map((asset) => (
              <Card key={asset.id}>
                <CardContent className="pt-4 space-y-3">
                  {asset.imageUrl ? (
                    <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                      <img
                        src={asset.imageUrl}
                        alt={asset.prompt}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center p-6">
                      <div className="text-center space-y-2">
                        <Image className="h-8 w-8 text-muted-foreground mx-auto" />
                        <p className="text-xs text-muted-foreground">
                          {asset.prompt.slice(0, 150)}
                          {asset.prompt.length > 150 ? "..." : ""}
                        </p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {asset.prompt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {asset.style && (
                        <Badge variant="outline" className="text-[10px]">
                          {asset.style}
                        </Badge>
                      )}
                      <Badge
                        variant={
                          asset.status === "complete" ? "secondary" : "outline"
                        }
                        className="text-[10px]"
                      >
                        {asset.status}
                      </Badge>
                    </div>
                    {asset.imageUrl && (
                      <a
                        href={asset.imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="ghost" size="sm">
                          <Download className="h-3 w-3" />
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No concept frames generated yet.</p>
          <p className="text-sm mt-1">
            Use the form above to describe an ad concept frame, or generate a
            storyboard first in the Creative tab.
          </p>
        </div>
      )}
    </div>
  );
}
