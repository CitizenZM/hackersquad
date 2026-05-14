import ytdl from "@distube/ytdl-core";
import { detectPlatform } from "./downloader";

export interface CloudDownloadResult {
  buffer: Buffer;
  contentType: string;
  metadata: {
    id: string;
    title: string;
    description?: string;
    duration?: number;
    width?: number;
    height?: number;
    uploader?: string;
    view_count?: number;
    like_count?: number;
    thumbnail?: string;
    platform: string;
    webpage_url: string;
  };
}

// Pure-JS downloader that works in any Node runtime (including Vercel
// serverless functions). Currently supports YouTube via @distube/ytdl-core.
// TikTok / Douyin / Vimeo would need their own pure-JS clients; we throw a
// helpful error to fall back to local rendering for those.
export async function cloudDownload(url: string): Promise<CloudDownloadResult> {
  const platform = detectPlatform(url);

  if (platform === "youtube") {
    return downloadYouTube(url);
  }

  throw new Error(
    `Cloud download for ${platform} is not implemented. Use a YouTube URL, or run locally for TikTok/Douyin/Vimeo support.`
  );
}

async function downloadYouTube(url: string): Promise<CloudDownloadResult> {
  let info;
  try {
    info = await ytdl.getInfo(url);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ytdl failed";
    if (/Status code: 410/i.test(msg)) {
      throw new Error("YouTube returned 410 — this URL may be region-blocked from our server. Try a different video.");
    }
    if (/private video/i.test(msg)) {
      throw new Error("This YouTube video is private.");
    }
    if (/Sign in to confirm/i.test(msg)) {
      throw new Error("This video is age-restricted and requires sign-in. Try a public video.");
    }
    throw new Error(`YouTube fetch failed: ${msg.slice(0, 200)}`);
  }

  const d = info.videoDetails;
  // Pick a lower-quality format to keep payloads small (under Vercel 4.5MB limit per response,
  // we work with chunks/streams so this is just for the format pick).
  const format = ytdl.chooseFormat(info.formats, {
    quality: "lowest",
    filter: (f) => Boolean(f.hasVideo && f.hasAudio && (f.container === "mp4" || f.container === "webm")),
  });

  // Stream into a buffer (capped at 30 MB to avoid OOM on serverless)
  const MAX_BYTES = 30 * 1024 * 1024;
  const chunks: Buffer[] = [];
  let total = 0;
  const stream = ytdl.downloadFromInfo(info, { format });
  await new Promise<void>((resolve, reject) => {
    stream.on("data", (chunk: Buffer) => {
      total += chunk.length;
      if (total > MAX_BYTES) {
        stream.destroy();
        return reject(new Error(`Video too large to download in serverless (>${Math.round(MAX_BYTES / 1024 / 1024)} MB). Try a shorter clip or run locally.`));
      }
      chunks.push(chunk);
    });
    stream.on("end", () => resolve());
    stream.on("error", (err: Error) => reject(err));
  });

  return {
    buffer: Buffer.concat(chunks),
    contentType: format.container === "mp4" ? "video/mp4" : "video/webm",
    metadata: {
      id: d.videoId,
      title: d.title,
      description: d.description ?? undefined,
      duration: Number(d.lengthSeconds) || undefined,
      width: format.width,
      height: format.height,
      uploader: d.author?.name,
      view_count: Number(d.viewCount) || undefined,
      like_count: d.likes ?? undefined,
      thumbnail: d.thumbnails?.[d.thumbnails.length - 1]?.url,
      platform: "youtube",
      webpage_url: url,
    },
  };
}
