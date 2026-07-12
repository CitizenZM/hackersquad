import { fetchWithRetry } from "./http";

export interface VimeoVideo {
  videoId: string;
  title: string;
  description: string;
  author: string;
  thumbnailUrl: string;
  duration: number;
  publishedAt: string;
  url: string;
}

export async function getVimeoMetadata(videoUrl: string): Promise<VimeoVideo | null> {
  try {
    const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(videoUrl)}`;
    const response = await fetchWithRetry(
      oembedUrl,
      { headers: { "User-Agent": "Mozilla/5.0" } },
      { timeoutMs: 5000 }
    );

    if (!response.ok) return null;
    const data = await response.json();

    const idMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
    const videoId = idMatch?.[1] || data.video_id?.toString() || "";

    return {
      videoId,
      title: data.title || "",
      description: data.description || "",
      author: data.author_name || "",
      thumbnailUrl: data.thumbnail_url || "",
      duration: data.duration || 0,
      publishedAt: data.upload_date || new Date().toISOString(),
      url: videoUrl,
    };
  } catch {
    return null;
  }
}
