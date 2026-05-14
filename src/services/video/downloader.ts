import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import { runProc } from "./binaries";

const WORK_ROOT = process.env.VIDEO_WORK_DIR || path.join(os.tmpdir(), "creativeintel-video");

export interface DownloadResult {
  localPath: string;
  metadataPath: string;
  metadata: {
    id: string;
    title: string;
    description?: string;
    duration?: number;
    width?: number;
    height?: number;
    uploader?: string;
    upload_date?: string;
    view_count?: number;
    like_count?: number;
    platform?: string;
    webpage_url?: string;
    thumbnail?: string;
  };
}

export function detectPlatform(url: string): string {
  const u = url.toLowerCase();
  if (u.includes("tiktok.com")) return "tiktok";
  if (u.includes("douyin.com")) return "douyin";
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes("instagram.com")) return "instagram";
  if (u.includes("bilibili.com")) return "bilibili";
  return "other";
}

export async function ensureWorkDir(jobId: string): Promise<string> {
  const dir = path.join(WORK_ROOT, jobId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function downloadVideo(
  url: string,
  jobId: string,
  opts: { onLog?: (line: string) => void; maxDurationSec?: number } = {}
): Promise<DownloadResult> {
  const dir = await ensureWorkDir(jobId);
  const outputTemplate = path.join(dir, "video.%(ext)s");
  const metadataPath = path.join(dir, "info.json");

  const args = [
    "--no-warnings",
    "--no-playlist",
    "--write-info-json",
    "--restrict-filenames",
    "-f", "best[ext=mp4]/best",
    "-o", outputTemplate,
    url,
  ];

  if (opts.maxDurationSec) {
    args.unshift("--match-filter", `duration<${opts.maxDurationSec}`);
  }

  const { code, stderr } = await runProc("yt-dlp", args, {
    timeoutMs: 180_000,
    onLine: opts.onLog,
  });

  if (code !== 0) {
    throw new Error(`yt-dlp failed (${code}): ${stderr.slice(-400)}`);
  }

  const files = await fs.readdir(dir);
  const videoFile = files.find(
    (f) => /\.(mp4|webm|mkv|mov)$/i.test(f) && f.startsWith("video.")
  );
  const infoFile = files.find((f) => f.endsWith(".info.json"));
  if (!videoFile) throw new Error("Downloaded video file not found");
  if (!infoFile) throw new Error("Metadata file not found");

  const realMeta = path.join(dir, infoFile);
  await fs.rename(realMeta, metadataPath).catch(() => {});

  const meta = JSON.parse(await fs.readFile(metadataPath, "utf-8"));
  return {
    localPath: path.join(dir, videoFile),
    metadataPath,
    metadata: {
      id: meta.id,
      title: meta.title || "(untitled)",
      description: meta.description,
      duration: meta.duration,
      width: meta.width,
      height: meta.height,
      uploader: meta.uploader,
      upload_date: meta.upload_date,
      view_count: meta.view_count,
      like_count: meta.like_count,
      webpage_url: meta.webpage_url || url,
      thumbnail: meta.thumbnail,
      platform: detectPlatform(url),
    },
  };
}
