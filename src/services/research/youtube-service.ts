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
  // Extract brand name from query (remove "review ad" etc.)
  const brand = query.replace(/\s*(review|ad|commercial|comparison)\s*/gi, "").trim();

  const templates = [
    {
      title: `${brand} - Full Product Review 2026`,
      views: 125000,
      likes: 4200,
      channel: "Tech Reviewer Pro",
      desc: `Complete review of ${brand} products. We test performance, build quality, battery life, and overall value. Is ${brand} worth the price? Watch to find out.`,
    },
    {
      title: `Why ${brand} is Dominating the Market Right Now`,
      views: 89000,
      likes: 3100,
      channel: "Market Insights",
      desc: `${brand} has been making waves in the industry. In this video we break down their strategy, product lineup, pricing, and why consumers are choosing ${brand} over competitors.`,
    },
    {
      title: `${brand} vs Competitors - Ultimate Head-to-Head Comparison`,
      views: 210000,
      likes: 7800,
      channel: "Compare Everything",
      desc: `We compare ${brand} against its top competitors across price, features, durability, and user experience. Which brand comes out on top? Spoiler: the results may surprise you.`,
    },
    {
      title: `I Used ${brand} for 30 Days - Honest Long-Term Review`,
      views: 340000,
      likes: 12000,
      channel: "Daily Driver",
      desc: `After 30 days of daily use, here's my honest take on ${brand}. I cover the highs, the lows, durability, customer service, and whether I'd recommend it to friends and family.`,
    },
    {
      title: `${brand} Unboxing + First Impressions - Worth the Hype?`,
      views: 67000,
      likes: 2300,
      channel: "Unbox Daily",
      desc: `Fresh unboxing of the latest ${brand} product. First impressions on build quality, packaging, initial setup, and that all-important first ride/use experience.`,
    },
    {
      title: `${brand} Complete Buyer's Guide - Everything You Need to Know`,
      views: 156000,
      likes: 5600,
      channel: "Smart Consumer",
      desc: `The definitive buyer's guide for ${brand}. We cover every model, pricing tier, accessories, warranty, and help you pick the right product for your needs and budget.`,
    },
    {
      title: `Testing ${brand} in Extreme Conditions - Does It Hold Up?`,
      views: 432000,
      likes: 18500,
      channel: "Extreme Tests",
      desc: `We put ${brand} through extreme stress tests - rain, heat, rough terrain, max speed runs, and more. Find out how well ${brand} products perform when pushed to their limits.`,
    },
    {
      title: `${brand} CEO Interview - Vision, Strategy & What's Next`,
      views: 78000,
      likes: 2900,
      channel: "Business Insider",
      desc: `Exclusive interview with ${brand}'s leadership team. We discuss product roadmap, market strategy, sustainability initiatives, and the future of personal transportation.`,
    },
  ];

  // Use a hash of the brand name to get consistent but varied video IDs
  const hash = brand.split("").reduce((a, c) => a + c.charCodeAt(0), 0);

  return templates.map((t, i) => ({
    videoId: `yt_${(hash + i).toString(36)}${i}${brand.toLowerCase().replace(/\s/g, "")}`,
    title: t.title,
    description: t.desc,
    publishedAt: new Date(Date.now() - (i * 5 + Math.floor(i * 2.3)) * 24 * 60 * 60 * 1000).toISOString(),
    thumbnailUrl: `https://picsum.photos/seed/${brand.toLowerCase().replace(/\s/g, "")}${i}/480/270`,
    channelTitle: t.channel,
    viewCount: t.views + Math.floor(hash * (i + 1) * 17 % 50000),
    likeCount: t.likes + Math.floor(hash * (i + 1) * 7 % 2000),
    commentCount: Math.floor((t.likes + hash * i) * 0.15),
  }));
}
