import { google } from "googleapis";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  description: string;
  publishedAt: string;
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}

const youtube = google.youtube("v3");

export async function searchYouTubeVideos(
  query: string,
  maxResults = 10
): Promise<YouTubeVideo[]> {
  if (process.env.MOCK_CRAWL === "true" || !process.env.YOUTUBE_API_KEY) {
    return getMockYouTubeResults(query);
  }

  try {
    const searchResponse = await youtube.search.list({
      key: process.env.YOUTUBE_API_KEY,
      q: query,
      part: ["snippet"],
      type: ["video"],
      maxResults,
      order: "relevance",
    });

    const videoIds = (searchResponse.data.items || [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => !!id);

    if (videoIds.length === 0) return [];

    const statsResponse = await youtube.videos.list({
      key: process.env.YOUTUBE_API_KEY,
      id: videoIds,
      part: ["statistics", "snippet"],
    });

    return (statsResponse.data.items || []).map((item) => ({
      videoId: item.id || "",
      title: item.snippet?.title || "",
      description: (item.snippet?.description || "").slice(0, 1000),
      publishedAt: item.snippet?.publishedAt || "",
      thumbnailUrl:
        item.snippet?.thumbnails?.high?.url ||
        item.snippet?.thumbnails?.default?.url ||
        "",
      channelTitle: item.snippet?.channelTitle || "",
      viewCount: parseInt(item.statistics?.viewCount || "0", 10),
      likeCount: parseInt(item.statistics?.likeCount || "0", 10),
      commentCount: parseInt(item.statistics?.commentCount || "0", 10),
    }));
  } catch (error) {
    console.error("YouTube API error:", error);
    return getMockYouTubeResults(query);
  }
}

function getMockYouTubeResults(query: string): YouTubeVideo[] {
  const templates = [
    { title: `${query} - Full Product Review`, views: 125000, likes: 4200 },
    { title: `Why ${query} is Changing the Game`, views: 89000, likes: 3100 },
    { title: `${query} vs The Competition - Honest Comparison`, views: 210000, likes: 7800 },
    { title: `I Tried ${query} for 30 Days - Here's What Happened`, views: 340000, likes: 12000 },
    { title: `${query} Unboxing + First Impressions`, views: 67000, likes: 2300 },
  ];

  return templates.map((t, i) => ({
    videoId: `mock_${i}_${Date.now()}`,
    title: t.title,
    description: `An in-depth look at ${query} products and brand experience. This video covers features, quality, pricing, and overall value.`,
    publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: "",
    channelTitle: `Creator${i + 1}`,
    viewCount: t.views,
    likeCount: t.likes,
    commentCount: Math.round(t.likes * 0.15),
  }));
}
