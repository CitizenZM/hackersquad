"use client";

import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw, ShieldCheck, Package, Users, MapPin, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProductImage {
  url: string;
  caption: string;
  type: "product" | "environment";
  environmentName: string;
}

interface UseEnvironment {
  name: string;
  description: string;
  typicalUser: string;
  imagePrompt: string;
}

interface ActorSetting {
  role: string;
  ageRange: string;
  scenario: string;
  visualDescription: string;
  painPoint: string;
  productInteraction: string;
}

interface DisplayGuideline {
  rule: string;
  example: string;
  antiExample: string;
}

interface ProductIntelligenceData {
  productCategory: string | null;
  productDescription: string | null;
  productVerified: boolean;
  productImages: ProductImage[] | null;
  useEnvironments: UseEnvironment[] | null;
  actorSettings: ActorSetting[] | null;
  displayGuidelines: DisplayGuideline[] | null;
}

export function ProductIntelligence({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProductIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<"product" | "environments" | "actors" | "guidelines">("product");

  useEffect(() => {
    fetch(`/api/projects/${projectId}/brand/understand`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function generateImages() {
    setGenerating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/brand/understand`, { method: "POST" });
      const result = await res.json();
      setData(prev => prev ? { ...prev, productImages: result.productImages } : prev);
    } finally {
      setGenerating(false);
    }
  }

  async function verifyUnderstanding() {
    setVerifying(true);
    try {
      await fetch(`/api/projects/${projectId}/brand/understand`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productVerified: true }),
      });
      setData(prev => prev ? { ...prev, productVerified: true } : prev);
    } finally {
      setVerifying(false);
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading product intelligence…
    </div>
  );

  if (!data?.productCategory && !data?.productDescription) return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 flex items-start gap-2">
      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div>
        <p className="font-semibold">Product intelligence not yet generated</p>
        <p className="text-xs mt-1">Run research first to populate brand understanding.</p>
      </div>
    </div>
  );

  const tabs = [
    { id: "product" as const, label: "Product", icon: Package },
    { id: "environments" as const, label: "Environments", icon: MapPin },
    { id: "actors" as const, label: "Actors", icon: Users },
    { id: "guidelines" as const, label: "Display Rules", icon: Eye },
  ];

  return (
    <div className="space-y-4">
      {/* Verification banner */}
      <div className={cn(
        "rounded-xl border px-4 py-3 flex items-center justify-between gap-4",
        data.productVerified
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      )}>
        <div className="flex items-center gap-2">
          {data.productVerified
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <AlertCircle className="h-4 w-4 text-amber-600" />}
          <div>
            <p className={cn("text-sm font-semibold", data.productVerified ? "text-emerald-800" : "text-amber-800")}>
              {data.productVerified ? "Product understanding verified ✓" : "Pending product verification"}
            </p>
            <p className="text-xs text-muted-foreground">{data.productCategory || "Category unknown"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={generateImages} disabled={generating} className="h-7 text-xs gap-1">
            {generating ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            {data.productImages?.length ? "Regenerate" : "Generate Images"}
          </Button>
          {!data.productVerified && (
            <Button size="sm" onClick={verifyUnderstanding} disabled={verifying} className="h-7 text-xs gap-1">
              {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />}
              Approve & Proceed
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 transition-colors",
              activeTab === tab.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-3.5 w-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product tab */}
      {activeTab === "product" && (
        <div className="space-y-4">
          {/* Product description */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">AI Product Understanding</p>
            <p className="text-sm leading-relaxed">{data.productDescription || "No description generated yet."}</p>
          </div>

          {/* Product images */}
          {data.productImages && data.productImages.length > 0 ? (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Verification Images</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.productImages.map((img, i) => (
                  <div key={i} className="rounded-lg overflow-hidden border border-border bg-muted aspect-video relative group">
                    <img
                      src={img.url}
                      alt={img.caption}
                      className="w-full h-full object-cover"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-2 py-1 text-[10px] text-white">
                      {img.caption}
                      <span className="ml-1 opacity-60">({img.type})</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Review these images — do they show the correct product? If the AI generated something wrong (e.g. a shark instead of a vacuum), do not proceed. Edit the product description and regenerate.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-muted-foreground">
              <Package className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No verification images yet</p>
              <p className="text-xs mt-1">Click &quot;Generate Images&quot; to create product reference visuals</p>
            </div>
          )}
        </div>
      )}

      {/* Environments tab */}
      {activeTab === "environments" && (
        <div className="space-y-3">
          {(data.useEnvironments || []).map((env, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{env.name}</p>
                  <p className="text-xs text-muted-foreground">{env.typicalUser}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Env {i+1}</span>
              </div>
              <p className="text-xs text-foreground/80 leading-relaxed">{env.description}</p>
              <div className="rounded-lg bg-muted/50 border border-border px-3 py-2">
                <p className="text-[10px] font-semibold text-muted-foreground mb-1">Image Generation Prompt</p>
                <p className="text-[10px] text-foreground/70 font-mono leading-relaxed">{env.imagePrompt}</p>
              </div>
            </div>
          ))}
          {(!data.useEnvironments || data.useEnvironments.length === 0) && (
            <p className="text-sm text-muted-foreground text-center py-4">No environments defined. Run research to generate.</p>
          )}
        </div>
      )}

      {/* Actors tab */}
      {activeTab === "actors" && (
        <div className="space-y-3">
          {(data.actorSettings || []).map((actor, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold">{actor.role}</p>
                  <p className="text-xs text-muted-foreground">{actor.ageRange} · {actor.scenario}</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Role {i+1}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Appearance</p>
                  <p className="text-xs text-foreground/80">{actor.visualDescription}</p>
                </div>
                <div className="rounded-lg bg-muted/50 border border-border p-3">
                  <p className="text-[10px] font-semibold text-muted-foreground mb-1">Pain Point</p>
                  <p className="text-xs text-foreground/80">{actor.painPoint}</p>
                </div>
              </div>
              <div className="rounded-lg bg-blue-50 border border-blue-200 px-3 py-2">
                <p className="text-[10px] font-semibold text-blue-800 mb-1">Product Interaction</p>
                <p className="text-xs text-blue-700">{actor.productInteraction}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Display Guidelines tab */}
      {activeTab === "guidelines" && (
        <div className="space-y-3">
          {(data.displayGuidelines || []).map((guide, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <p className="text-sm font-semibold">{guide.rule}</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2">
                  <p className="text-[10px] font-semibold text-emerald-700 mb-1">✓ Correct</p>
                  <p className="text-xs text-emerald-800">{guide.example}</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-200 p-2">
                  <p className="text-[10px] font-semibold text-red-700 mb-1">✗ Avoid</p>
                  <p className="text-xs text-red-800">{guide.antiExample}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
