"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, Download, ExternalLink } from "lucide-react";

type Job = {
  id: string;
  kind: string;
  status: string;
  progress: number;
  currentStep?: string | null;
  error?: string | null;
  outputPath?: string | null;
  output?: Record<string, unknown> | null;
  createdAt: string;
};

export default function VideoStudioPage() {
  const params = useParams();
  const projectId = params.projectId as string;
  const [jobs, setJobs] = useState<Job[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [shortUrl, setShortUrl] = useState("");
  const [genScript, setGenScript] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<null | { ready: boolean; binaries: Record<string, { available: boolean; version?: string }>; moneyprinter: { configured: boolean } }>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}/video/jobs`);
    if (res.ok) {
      const data = await res.json();
      setJobs(data.jobs || []);
    }
  }, [projectId]);

  useEffect(() => {
    refresh();
    fetch(`/api/health/video`).then((r) => r.json()).then(setHealth).catch(() => {});
    const id = setInterval(refresh, 3000);
    return () => clearInterval(id);
  }, [refresh]);

  async function action(path: string, body: Record<string, unknown>, label: string) {
    setBusy(label);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/video/${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `${res.status}`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Video studio</h1>
        {health && (
          <span className={`text-xs rounded-full px-2 py-1 ${health.ready ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
            {health.ready ? "Ready" : "Local binaries missing"}
          </span>
        )}
      </header>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <Card title="Import reference">
          <p className="text-xs text-muted-foreground">
            Paste a TikTok / YouTube / Douyin URL. Downloads, transcribes, indexes.
          </p>
          <input
            type="url"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="https://www.tiktok.com/@user/video/..."
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <Button
            disabled={!importUrl || busy === "import"}
            onClick={() => action("import", { url: importUrl }, "import")}
            className="w-full"
          >
            {busy === "import" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Import"}
          </Button>
        </Card>

        <Card title="Shortsify long video">
          <p className="text-xs text-muted-foreground">
            Long YouTube → AI picks best 30s → 9:16 with burned subs.
          </p>
          <input
            type="url"
            value={shortUrl}
            onChange={(e) => setShortUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <Button
            disabled={!shortUrl || busy === "shortsify"}
            onClick={() => action("shortsify", { sourceUrl: shortUrl, targetDurationSec: 30 }, "shortsify")}
            className="w-full"
          >
            {busy === "shortsify" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Shortsify"}
          </Button>
        </Card>

        <Card title="Generate product video">
          <p className="text-xs text-muted-foreground">
            Script → TTS + stock B-roll + subtitles → mp4. Needs MoneyPrinterTurbo local.
          </p>
          <textarea
            value={genScript}
            onChange={(e) => setGenScript(e.target.value)}
            placeholder="Paste a 20-30s script…"
            rows={4}
            className="w-full rounded-md border border-border px-3 py-2 text-sm"
          />
          <Button
            disabled={!genScript || busy === "generate" || !health?.moneyprinter.configured}
            onClick={() => action("generate", { script: genScript }, "generate")}
            className="w-full"
            title={!health?.moneyprinter.configured ? "MONEYPRINTER_PATH not set" : ""}
          >
            {busy === "generate" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
          </Button>
        </Card>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Recent jobs
        </h2>
        <div className="rounded-lg border border-border divide-y divide-border">
          {jobs.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">No jobs yet.</div>
          )}
          {jobs.map((j) => (
            <div key={j.id} className="px-4 py-3 flex items-center gap-3">
              <span className={`inline-flex items-center justify-center rounded-md text-xs px-2 py-1 ${
                j.status === "complete" ? "bg-emerald-100 text-emerald-700" :
                j.status === "error" ? "bg-red-100 text-red-700" :
                "bg-sky-100 text-sky-700"
              }`}>
                {j.kind}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">
                  {j.currentStep || j.status} · {Math.round(j.progress)}%
                  {j.error && <span className="text-red-600"> · {j.error}</span>}
                </div>
                {j.output && typeof j.output === "object" && (
                  <div className="text-xs text-muted-foreground truncate">
                    {(j.output as { title?: string; hookText?: string; rationale?: string }).title ||
                      (j.output as { hookText?: string }).hookText ||
                      ""}
                  </div>
                )}
              </div>
              {j.outputPath && (
                <a
                  href={`/api/projects/${projectId}/video/jobs/${j.id}/file`}
                  className="text-xs underline inline-flex items-center gap-1"
                  target="_blank"
                  rel="noreferrer"
                >
                  <Download className="h-3 w-3" /> mp4
                </a>
              )}
              {j.kind === "import" && (j.output as { contentAssetId?: string })?.contentAssetId && (
                <a
                  href={`/projects/${projectId}/content`}
                  className="text-xs underline inline-flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" /> asset
                </a>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      {children}
    </div>
  );
}
