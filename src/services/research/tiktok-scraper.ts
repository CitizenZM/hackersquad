export interface TikTokVideo {
  videoId: string;
  title: string;
  description: string;
  author: string;
  authorHandle: string;
  thumbnailUrl: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  duration: number;
  publishedAt: string;
  url: string;
}

export async function scrapeTikTokVideo(videoUrl: string): Promise<TikTokVideo | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(videoUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Extract __UNIVERSAL_DATA_FOR_REHYDRATION__
    const match = html.match(
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>(.*?)<\/script>/
    );
    if (!match) return null;

    const data = JSON.parse(match[1]);
    const videoData =
      data?.__DEFAULT_SCOPE__?.["webapp.video-detail"]?.itemInfo?.itemStruct;
    if (!videoData) return null;

    const stats = videoData.stats || {};
    const author = videoData.author || {};

    return {
      videoId: videoData.id || "",
      title: videoData.desc || "",
      description: (videoData.desc || "").slice(0, 500),
      author: author.nickname || author.uniqueId || "",
      authorHandle: author.uniqueId || "",
      thumbnailUrl:
        videoData.video?.cover ||
        videoData.video?.dynamicCover ||
        "",
      viewCount: stats.playCount || 0,
      likeCount: stats.diggCount || 0,
      commentCount: stats.commentCount || 0,
      shareCount: stats.shareCount || 0,
      duration: videoData.video?.duration || 0,
      publishedAt: videoData.createTime
        ? new Date(parseInt(videoData.createTime) * 1000).toISOString()
        : new Date().toISOString(),
      url: videoUrl,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
