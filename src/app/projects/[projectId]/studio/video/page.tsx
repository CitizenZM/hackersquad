"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Download,
  Trash2,
  RefreshCw,
  Play,
} from "lucide-react";

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
type Reference = {
  id: string;
  sourceUrl: string;
  platform: string;
  title: string;
  thumbnail: string | null;
  durationSec: number | null;
  language: string | null;
  transcriptPreview: string | null;
  createdAt: string;
};

type Aspect = "9:16" | "16:9" | "1:1";

export default function VideoStudioPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [importUrl, setImportUrl] = useState("");
  const [shortMode, setShortMode] = useState<"url" | "ref">("url");
  const [shortUrl, setShortUrl] = useState("");
  const [shortRef, setShortRef] = useState<string>("");
  const [targetDuration, setTargetDuration] = useState<number>(30);
  const [aspect, setAspect] = useState<Aspect>("9:16");
  const [genScript, setGenScript] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] =
    useState<null | {
      ready: boolean;
      mode?: "local" | "cloud" | "none";
      binaries: Record<string, { available: boolean; version?: string }>;
      cloudinary?: { configured: boolean };
      moneyprinter: { configured: boolean };
    }>(null);
  const [playJobId, setPlayJobId] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const hasInflightJob = useMemo(
    () => jobs.some((j) => j.status === "pending" || j.status === "running"),
    [jobs]
  );

  const refresh = useCallback(async () => {
    try {
      const [jr, rr] = await Promise.all([
        fetch(`/api/projects/${projectId}/video/jobs`),
        fetch(`/api/projects/${projectId}/video/references`),
      ]);
      if (jr.ok) {
        const data = await jr.json();
        setJobs(data.jobs || []);
      }
      if (rr.ok) {
        const data = await rr.json();
        setRefs(data.references || []);
      }
    } catch {
      // network blip — silent
    }
  }, [projectId]);

  // Initial load + health probe
  useEffect(() => {
    refresh();
    fetch(`/api/health/video`)
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, [refresh]);

  // Adaptive polling: 3s while a job is in flight, 30s when idle, stop when tab hidden
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      refresh();
    };
    const interval = hasInflightJob ? 3000 : 30000;
    pollIntervalRef.current = setInterval(tick, interval);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [hasInflightJob, refresh]);

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
      if (!res.ok) {
        const detail =
          (data?.details && JSON.stringify(data.details).slice(0, 200)) ||
          data?.error ||
          `${res.status}`;
        throw new Error(detail);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function deleteJob(id: string) {
    await fetch(`/api/projects/${projectId}/video/jobs/${id}`, { method: "DELETE" });
    refresh();
  }

  async function clearHistory() {
    if (!confirm("Remove all completed and failed jobs from history? Active jobs are kept.")) return;
    await fetch(`/api/projects/${projectId}/video/jobs/clear`, { method: "POST" });
    refresh();
  }

  function platformLabel(p?: string) {
    const map: Record<string, string> = {
      youtube: "YouTube",
      tiktok: "TikTok",
      douyin: "Douyin",
      vimeo: "Vimeo",
      instagram: "Instagram",
      bilibili: "Bilibili",
    };
    return map[p ?? ""] ?? p ?? "Other";
  }

  function fmtDur(sec: number | null | undefined) {
    if (!sec || sec <= 0) return "—";
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Video studio</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Download references, shortsify long videos, generate product videos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {health && (
            <span
              className={`text-xs rounded-full px-2 py-1 ${
                health.ready
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
              }`}
              title={`mode=${health.mode ?? "none"}`}
            >
              {health.ready
                ? health.mode === "cloud"
                  ? "Cloud renderer ready"
                  : "Local renderer ready"
                : "Renderer not configured"}
            </span>
          )}
          <button
            onClick={refresh}
            className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      </header>

      {!health?.ready && health && (
        <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 text-sm text-amber-900 dark:text-amber-200 space-y-2">
          <div>
            <strong>Rendering is not available on this server.</strong> Pick one:
          </div>
          <ul className="list-disc pl-5 text-xs space-y-0.5">
            <li>
              <strong>Cloud (Vercel/prod)</strong>: set{" "}
              <code>CLOUDINARY_CLOUD_NAME</code>,{" "}
              <code>CLOUDINARY_API_KEY</code>,{" "}
              <code>CLOUDINARY_API_SECRET</code>. Free tier supports YouTube import + 9:16 crop. Run{" "}
              <code>vercel env add</code> to install.
            </li>
            <li>
              <strong>Local</strong>: <code>brew install yt-dlp ffmpeg</code>, then{" "}
              <code>pnpm dev</code>. Supports TikTok, Douyin, Vimeo, etc.
            </li>
          </ul>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-300 bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-300">
          <div className="flex-1">{error}</div>
          <button
            onClick={() => setError(null)}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Three action cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {/* Import */}
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
            disabled={!importUrl || busy === "import" || !health?.ready}
            onClick={() => action("import", { url: importUrl }, "import").then(() => setImportUrl(""))}
            className="w-full"
          >
            {busy === "import" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Import"
            )}
          </Button>
        </Card>

        {/* Shortsify */}
        <Card title="Shortsify long video">
          <p className="text-xs text-muted-foreground">
            Long video → AI picks best clip → vertical with subtitles.
          </p>
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="shortMode"
                checked={shortMode === "url"}
                onChange={() => setShortMode("url")}
              />
              New URL
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="shortMode"
                checked={shortMode === "ref"}
                onChange={() => setShortMode("ref")}
                disabled={refs.length === 0}
              />
              From references
            </label>
          </div>
          {shortMode === "url" ? (
            <input
              type="url"
              value={shortUrl}
              onChange={(e) => setShortUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          ) : (
            <select
              value={shortRef}
              onChange={(e) => setShortRef(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">Pick a reference…</option>
              {refs.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title.slice(0, 50)} · {platformLabel(r.platform)} · {fmtDur(r.durationSec)}
                </option>
              ))}
            </select>
          )}
          <div className="flex items-center gap-2 text-xs">
            <label className="flex items-center gap-1">
              <span className="text-muted-foreground">Length</span>
              <select
                value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                className="rounded-md border border-border px-1.5 py-0.5"
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
              </select>
            </label>
            <label className="flex items-center gap-1">
              <span className="text-muted-foreground">Ratio</span>
              <select
                value={aspect}
                onChange={(e) => setAspect(e.target.value as Aspect)}
                className="rounded-md border border-border px-1.5 py-0.5"
              >
                <option value="9:16">9:16</option>
                <option value="16:9">16:9</option>
                <option value="1:1">1:1</option>
              </select>
            </label>
          </div>
          <Button
            disabled={
              busy === "shortsify" ||
              !health?.ready ||
              (shortMode === "url" ? !shortUrl : !shortRef)
            }
            onClick={() =>
              action(
                "shortsify",
                shortMode === "url"
                  ? { sourceUrl: shortUrl, targetDurationSec: targetDuration, aspectRatio: aspect }
                  : { videoReferenceId: shortRef, targetDurationSec: targetDuration, aspectRatio: aspect },
                "shortsify"
              ).then(() => {
                if (shortMode === "url") setShortUrl("");
              })
            }
            className="w-full"
          >
            {busy === "shortsify" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Shortsify"
            )}
          </Button>
        </Card>

        {/* Generate */}
        <Card title="Generate product video">
          <p className="text-xs text-muted-foreground">
            Script → TTS + stock B-roll + subtitles → mp4. Requires MoneyPrinterTurbo locally.
          </p>
          <textarea
            value={genScript}
            onChange={(e) => setGenScript(e.target.value)}
            placeholder="Paste a 20-30s script…"
            rows={4}
            className="w-full rounded-md border border-border px-3 py-2 text-sm font-mono"
            disabled={!health?.moneyprinter.configured}
          />
          <Button
            disabled={
              !genScript ||
              busy === "generate" ||
              !health?.moneyprinter.configured
            }
            onClick={() => action("generate", { script: genScript, aspectRatio: aspect }, "generate")}
            className="w-full"
            title={
              !health?.moneyprinter.configured
                ? "Set MONEYPRINTER_PATH env to enable. See docs."
                : ""
            }
          >
            {busy === "generate" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Generate"
            )}
          </Button>
        </Card>
      </div>

      {/* References panel */}
      {refs.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Reference library ({refs.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {refs.slice(0, 9).map((r) => (
              <div key={r.id} className="rounded-lg border border-border p-3 space-y-1 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {platformLabel(r.platform)} · {fmtDur(r.durationSec)} · {r.language || "—"}
                  </span>
                </div>
                <div className="font-medium truncate" title={r.title}>
                  {r.title}
                </div>
                {r.transcriptPreview && (
                  <div className="text-xs text-muted-foreground line-clamp-3">
                    {r.transcriptPreview}
                  </div>
                )}
                <a
                  href={r.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs underline text-muted-foreground"
                >
                  Source
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Jobs */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Recent jobs ({jobs.length})
          </h2>
          {jobs.some((j) => j.status === "complete" || j.status === "error") && (
            <button
              onClick={clearHistory}
              className="text-xs text-muted-foreground hover:text-red-600 underline"
            >
              Clear history
            </button>
          )}
        </div>
        <div className="rounded-lg border border-border divide-y divide-border">
          {jobs.length === 0 && (
            <div className="px-4 py-6 text-sm text-muted-foreground">
              No jobs yet. Try importing a reference above.
            </div>
          )}
          {jobs.map((j) => (
            <div key={j.id} className="px-4 py-3 space-y-2">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center justify-center rounded-md text-xs px-2 py-1 ${
                    j.status === "complete"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : j.status === "error"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                        : "bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300"
                  }`}
                >
                  {j.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm flex items-center gap-2">
                    <span className="truncate">
                      {j.currentStep || j.status}
                    </span>
                    {j.status !== "complete" && j.status !== "error" && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(j.progress)}%
                      </span>
                    )}
                  </div>
                  {j.output && typeof j.output === "object" && (
                    <div className="text-xs text-muted-foreground truncate">
                      {(j.output as { title?: string }).title ||
                        (j.output as { hookText?: string }).hookText ||
                        ""}
                    </div>
                  )}
                </div>
                {j.outputPath && j.status === "complete" && (
                  <button
                    onClick={() => setPlayJobId(playJobId === j.id ? null : j.id)}
                    className="text-xs underline inline-flex items-center gap-1"
                  >
                    <Play className="h-3 w-3" /> {playJobId === j.id ? "Hide" : "Play"}
                  </button>
                )}
                {j.outputPath && j.status === "complete" && (
                  <a
                    href={`/api/projects/${projectId}/video/jobs/${j.id}/file`}
                    className="text-xs underline inline-flex items-center gap-1"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Download className="h-3 w-3" /> mp4
                  </a>
                )}
                {(j.status === "complete" || j.status === "error") && (
                  <button
                    onClick={() => deleteJob(j.id)}
                    className="text-xs text-muted-foreground hover:text-red-600 inline-flex items-center gap-1"
                    title="Remove from history"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
              {j.error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 px-3 py-2 text-xs text-red-700 dark:text-red-300">
                  {j.error}
                </div>
              )}
              {playJobId === j.id && j.outputPath && j.status === "complete" && (
                <video
                  src={`/api/projects/${projectId}/video/jobs/${j.id}/file`}
                  controls
                  className="w-full max-w-md rounded-md border border-border"
                />
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
