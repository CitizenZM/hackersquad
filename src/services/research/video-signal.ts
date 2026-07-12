import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import ytdl from "@distube/ytdl-core";
import { cached } from "@/services/cache";
import { cloudDownload } from "@/services/video/cloud-downloader";
import { transcribeAudio } from "@/services/video/transcribe";

export interface VideoSignalInput {
  platform: string;
  url: string;
  videoId: string;
  thumbnailUrl?: string;
}

export type TranscriptSource = "groq" | "openai" | "none";

export interface VideoSignal {
  transcript?: string;
  transcriptSource: TranscriptSource;
  thumbnailUrl?: string;
}

const SIGNAL_TIME_BUDGET_MS = 45_000;
const MAX_DURATION_SEC = 5 * 60; // skip transcription for videos longer than 5 min
const CACHE_TTL_SEC = 7 * 24 * 60 * 60; // 7 days

/**
 * Collects real video signal (transcript when feasible, thumbnail otherwise)
 * for use in content scoring. This function must NEVER throw — any failure
 * degrades gracefully to a metadata-only signal (transcriptSource: "none").
 * Enforces a hard ~45s time budget per video so a single slow/stuck video
 * can't stall the whole scoring batch.
 */
export async function collectVideoSignal(video: VideoSignalInput): Promise<VideoSignal> {
  return cached<VideoSignal>(
    {
      kind: "video-signal",
      params: { platform: video.platform, videoId: video.videoId },
      ttlSec: CACHE_TTL_SEC,
      cacheEmpty: false,
    },
    () => collectVideoSignalUncached(video)
  );
}

async function collectVideoSignalUncached(video: VideoSignalInput): Promise<VideoSignal> {
  try {
    return await withTimeBudget(collectVideoSignalInner(video), SIGNAL_TIME_BUDGET_MS, {
      transcriptSource: "none",
      thumbnailUrl: video.thumbnailUrl,
    });
  } catch (err) {
    // Absolute safety net — collectVideoSignal must never throw.
    console.error(`collectVideoSignal failed for ${video.platform}:${video.videoId}:`, err);
    return { transcriptSource: "none", thumbnailUrl: video.thumbnailUrl };
  }
}

async function withTimeBudget<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}

async function collectVideoSignalInner(video: VideoSignalInput): Promise<VideoSignal> {
  if (video.platform !== "youtube" && video.platform !== "youtube_short") {
    // Non-YouTube platforms: thumbnail-only signal for now (no pure-JS
    // downloader available for TikTok/Douyin/Vimeo/etc in this context).
    return { transcriptSource: "none", thumbnailUrl: video.thumbnailUrl };
  }

  let tmpDir: string | undefined;
  try {
    const url = video.url || `https://youtube.com/watch?v=${video.videoId}`;

    // Cheap metadata check first — skip long videos before spending time
    // downloading audio.
    let durationSec: number | undefined;
    try {
      const info = await ytdl.getBasicInfo(url);
      durationSec = Number(info.videoDetails.lengthSeconds) || undefined;
    } catch (err) {
      console.error(`video-signal: metadata check failed for ${video.videoId}:`, err);
      // Proceed anyway — cloudDownload will surface a clearer error if the
      // video is genuinely unreachable.
    }

    if (durationSec && durationSec > MAX_DURATION_SEC) {
      return { transcriptSource: "none", thumbnailUrl: video.thumbnailUrl };
    }

    const cd = await cloudDownload(url);

    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-signal-"));
    const ext = cd.contentType === "video/webm" ? "webm" : "mp4";
    const localPath = path.join(tmpDir, `audio.${ext}`);
    await fs.writeFile(localPath, cd.buffer);

    const transcript = await transcribeAudio(localPath);
    if (!transcript.text) {
      return { transcriptSource: "none", thumbnailUrl: cd.metadata.thumbnail || video.thumbnailUrl };
    }

    return {
      transcript: transcript.text,
      transcriptSource: transcript.source,
      thumbnailUrl: cd.metadata.thumbnail || video.thumbnailUrl,
    };
  } catch (err) {
    console.error(`video-signal: collection failed for ${video.videoId}:`, err);
    return { transcriptSource: "none", thumbnailUrl: video.thumbnailUrl };
  } finally {
    if (tmpDir) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
    }
  }
}
