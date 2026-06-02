"use client";

import { useState, useEffect, useRef } from "react";
import {
  Loader2, Link, Package, RefreshCw, ExternalLink, Upload,
  CheckCircle2, AlertCircle, X, Plus, Pencil, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ProductImage {
  url: string;
  alt?: string;
  caption?: string;
}

interface ProductDefinitionData {
  productUrl: string | null;
  productName: string | null;
  productPageTitle: string | null;
  productPageImages: ProductImage[] | null;
  productPageText: string | null;
  userProductImages: ProductImage[] | null;
}

export function ProductDefinition({ projectId }: { projectId: string }) {
  const [data, setData] = useState<ProductDefinitionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [editingUrl, setEditingUrl] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/product`)
      .then(r => r.json())
      .then((d: ProductDefinitionData) => {
        setData(d);
        setUrlDraft(d.productUrl || "");
        setNameDraft(d.productName || "");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId]);

  async function scrapeUrl(url: string) {
    if (!url) return;
    setScraping(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productUrl: url }),
      });
      const result = await res.json();
      if (result.error) throw new Error(result.error);
      // Reload
      const updated = await fetch(`/api/projects/${projectId}/product`).then(r => r.json());
      setData(updated);
      setNameDraft(updated.productName || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to scrape product page");
    } finally {
      setScraping(false);
      setEditingUrl(false);
    }
  }

  async function saveName() {
    await fetch(`/api/projects/${projectId}/product`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productName: nameDraft }),
    });
    setData(prev => prev ? { ...prev, productName: nameDraft } : prev);
    setEditingName(false);
  }

  async function handleFileUpload(files: FileList) {
    setUploadingImages(true);
    try {
      // Convert images to data URIs (stored directly — no separate upload endpoint needed)
      const newImages: ProductImage[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newImages.push({ url: dataUri, caption: file.name, alt: file.name });
      }
      const existing = data?.userProductImages || [];
      const merged = [...existing, ...newImages].slice(0, 8);
      await fetch(`/api/projects/${projectId}/product`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userProductImages: merged }),
      });
      setData(prev => prev ? { ...prev, userProductImages: merged } : prev);
    } finally {
      setUploadingImages(false);
    }
  }

  async function removeUserImage(index: number) {
    const updated = (data?.userProductImages || []).filter((_, i) => i !== index);
    await fetch(`/api/projects/${projectId}/product`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userProductImages: updated }),
    });
    setData(prev => prev ? { ...prev, userProductImages: updated } : prev);
  }

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
      <Loader2 className="h-4 w-4 animate-spin" /> Loading product definition…
    </div>
  );

  const hasProduct = !!(data?.productUrl || data?.productPageImages?.length || data?.userProductImages?.length);
  const allImages = [
    ...(data?.productPageImages || []).slice(0, 4),
    ...(data?.userProductImages || []).slice(0, 4),
  ];

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <div className={cn(
        "rounded-xl border px-4 py-3 flex items-center gap-3",
        hasProduct ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
      )}>
        {hasProduct
          ? <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          : <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0" />}
        <div className="flex-1">
          <p className={cn("text-sm font-semibold", hasProduct ? "text-emerald-800" : "text-amber-800")}>
            {hasProduct
              ? `Product defined: ${data?.productPageTitle || data?.productName || "Product identified"}`
              : "No product defined — AI will guess which product to use"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {hasProduct
              ? `${allImages.length} images · ${data?.productPageText ? "Description available" : "No description"}`
              : "Add a product page URL or upload product photos below"}
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto"><X className="h-3 w-3" /></button>
        </div>
      )}

      {/* Product URL */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Link className="h-3.5 w-3.5" /> Product Page URL
          </p>
          {data?.productUrl && !editingUrl && (
            <button onClick={() => setEditingUrl(true)} className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )}
        </div>

        {editingUrl || !data?.productUrl ? (
          <div className="space-y-2">
            <Input
              type="url"
              value={urlDraft}
              onChange={e => setUrlDraft(e.target.value)}
              placeholder="https://www.sharkninja.com/shark-vacuums/... or https://amazon.com/dp/..."
              className="h-9 text-sm"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => scrapeUrl(urlDraft)}
                disabled={scraping || !urlDraft.trim()}
                className="h-7 text-xs gap-1.5"
              >
                {scraping ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                {scraping ? "Fetching product data…" : "Fetch Product Data"}
              </Button>
              {editingUrl && (
                <Button size="sm" variant="outline" onClick={() => setEditingUrl(false)} className="h-7 text-xs">
                  Cancel
                </Button>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Paste the specific product page URL. The AI will extract the exact product name, images, and description from this page.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <a href={data.productUrl} target="_blank" rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 truncate">
              <ExternalLink className="h-3 w-3 flex-shrink-0" />
              {data.productUrl}
            </a>
          </div>
        )}
      </div>

      {/* Product Name */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
            <Package className="h-3.5 w-3.5" /> Product Name
          </p>
        </div>
        {editingName ? (
          <div className="flex gap-2">
            <Input
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              className="h-8 text-sm flex-1"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
            />
            <button onClick={saveName} className="p-2 rounded hover:bg-muted"><Check className="h-3.5 w-3.5 text-emerald-600" /></button>
            <button onClick={() => { setNameDraft(data?.productName || ""); setEditingName(false); }} className="p-2 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => setEditingName(true)} className="text-sm text-left w-full hover:bg-muted/50 rounded px-2 py-1 transition-colors flex items-center gap-2 group">
            {data?.productPageTitle || data?.productName || <span className="text-muted-foreground italic">Click to add product name…</span>}
            <Pencil className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 ml-auto" />
          </button>
        )}
      </div>

      {/* Product Images — from product page + user uploads */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Product Images ({allImages.length})
          </p>
          <div className="flex gap-1.5">
            {data?.productUrl && (
              <Button
                size="sm" variant="outline"
                onClick={() => scrapeUrl(data.productUrl!)}
                disabled={scraping}
                className="h-6 text-[10px] gap-1 px-2"
              >
                {scraping ? <Loader2 className="h-2.5 w-2.5 animate-spin" /> : <RefreshCw className="h-2.5 w-2.5" />}
                Re-fetch
              </Button>
            )}
            <Button
              size="sm" variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImages}
              className="h-6 text-[10px] gap-1 px-2"
            >
              <Upload className="h-2.5 w-2.5" />
              Upload Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => e.target.files && handleFileUpload(e.target.files)}
            />
          </div>
        </div>

        {allImages.length > 0 ? (
          <div className="grid grid-cols-4 gap-2">
            {/* Product page images */}
            {(data?.productPageImages || []).slice(0, 4).map((img, i) => (
              <div key={`pp-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={img.url}
                  alt={img.alt || "Product"}
                  className="w-full h-full object-contain bg-white"
                  onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
                />
                <div className="absolute top-1 left-1">
                  <span className="text-[8px] bg-blue-600 text-white px-1 py-0.5 rounded font-semibold">Web</span>
                </div>
              </div>
            ))}
            {/* User-uploaded images */}
            {(data?.userProductImages || []).slice(0, 4).map((img, i) => (
              <div key={`up-${i}`} className="relative group aspect-square rounded-lg overflow-hidden border border-border bg-muted">
                <img
                  src={img.url}
                  alt={img.caption || img.alt || "Uploaded"}
                  className="w-full h-full object-contain bg-white"
                />
                <div className="absolute top-1 left-1">
                  <span className="text-[8px] bg-purple-600 text-white px-1 py-0.5 rounded font-semibold">Upload</span>
                </div>
                <button
                  onClick={() => removeUserImage(i)}
                  className="absolute top-1 right-1 p-0.5 rounded bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5" />
                </button>
              </div>
            ))}
            {/* Add more button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-lg border-2 border-dashed border-border flex items-center justify-center hover:border-foreground/40 transition-colors text-muted-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div
            className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-foreground/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">Upload product photos</p>
            <p className="text-xs text-muted-foreground mt-1">
              Or paste a product URL above to auto-import images.
              <br />Upload multiple angles: front, back, detail close-ups.
            </p>
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          <strong>Blue (Web)</strong> = fetched from product page · <strong>Purple (Upload)</strong> = your photos
          <br />These exact images are used as reference for all AI-generated content in this project.
        </p>
      </div>

      {/* Product description preview */}
      {data?.productPageText && (
        <div className="rounded-xl border border-border bg-card p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Product Description (from page)
          </p>
          <p className="text-xs text-foreground/80 leading-relaxed line-clamp-4">{data.productPageText}</p>
        </div>
      )}
    </div>
  );
}
