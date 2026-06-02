import { searchYouTubeVideos, type YouTubeVideo } from "./youtube-service";
import { searchDuckDuckGo } from "./duckduckgo";
import { scrapeTikTokVideo, type TikTokVideo } from "./tiktok-scraper";
import { getVimeoMetadata, type VimeoVideo } from "./vimeo-service";
import type { SearchKeywords } from "./keyword-extractor";

export interface VideoResult {
  platform: "youtube" | "youtube_short" | "tiktok" | "vimeo";
  videoId: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  channelTitle: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
}

export async function searchAllPlatforms(
  brandName: string,
  keywords: SearchKeywords,
  strategy: "short_social" | "tvc" | "mixed" = "mixed"
): Promise<VideoResult[]> {
  const allResults: VideoResult[] = [];

  if (strategy === "short_social") {
    // TikTok + YouTube Shorts only
    const [ytShorts, vimeoResults] = await Promise.all([
      searchYouTubeShorts(brandName, keywords),
      searchVimeoContent(brandName, keywords),
    ]);
    allResults.push(...ytShorts, ...vimeoResults);
  } else if (strategy === "tvc") {
    // YouTube long-form + Vimeo
    const [ytLong, vimeoResults] = await Promise.all([
      searchYouTubeLong(brandName, keywords),
      searchVimeoContent(brandName, keywords),
    ]);
    allResults.push(...ytLong, ...vimeoResults);
  } else {
    // Mixed: all platforms
    const [ytLong, ytShorts, socialResults, vimeoResults] = await Promise.all([
      searchYouTubeLong(brandName, keywords),
      searchYouTubeShorts(brandName, keywords),
      searchSocialPlatforms(brandName, keywords),
      searchVimeoContent(brandName, keywords),
    ]);
    allResults.push(...ytLong, ...ytShorts, ...socialResults, ...vimeoResults);
  }

  // Deduplicate by videoId
  const seen = new Set<string>();
  return allResults.filter((v) => {
    const key = `${v.platform}:${v.videoId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchVimeoContent(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const query = `site:vimeo.com "${brandName}" ${keywords.adSearchQueries[0] || "ad commercial"}`;
  try {
    const results = await searchDuckDuckGo(query, 5);
    return results
      .filter((r) => r.url.includes("vimeo.com"))
      .map((r) => {
        const idMatch = r.url.match(/vimeo\.com\/(\d+)/);
        const videoId = idMatch?.[1] || Math.random().toString(36).slice(2);
        return {
          platform: "vimeo" as const,
          videoId,
          title: r.title || `${brandName} Vimeo Video`,
          description: r.snippet || "",
          url: r.url,
          thumbnailUrl: `https://vumbnail.com/${videoId}.jpg`,
          channelTitle: "Vimeo",
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          publishedAt: new Date().toISOString(),
        };
      });
  } catch {
    return [];
  }
}

async function searchYouTubeLong(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const queries = keywords.adSearchQueries.slice(0, 2);
  if (queries.length === 0) {
    const disambig = keywords.brandContext?.disambiguationKeywords?.[0] || "";
    queries.push(`${brandName} ${disambig} official ad commercial`);
  }

  const mc = keywords.brandContext?.disambiguationKeywords;
  const mnc = keywords.brandContext?.notRelatedTo;

  const results: VideoResult[] = [];
  for (const query of queries) {
    try {
      const videos = await searchYouTubeVideos(query, 5, undefined, brandName, mc, mnc);
      results.push(...videos.map((v) => youtubeToResult(v, "youtube")));
    } catch {
      // continue
    }
  }
  return results;
}

async function searchYouTubeShorts(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const disambig = keywords.brandContext?.disambiguationKeywords?.[0] || "";
  const query = `${brandName} ${disambig} ad short`;
  const mc = keywords.brandContext?.disambiguationKeywords;
  const mnc = keywords.brandContext?.notRelatedTo;
  try {
    const videos = await searchYouTubeVideos(query, 5, "EgIQCQ%3D%3D", brandName, mc, mnc);
    return videos.map((v) => youtubeToResult(v, "youtube_short"));
  } catch {
    return [];
  }
}

async function searchSocialPlatforms(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  // Single DuckDuckGo query for TikTok + IG + Vimeo combined
  const disambig = keywords.brandContext?.disambiguationKeywords?.[0] || "";
  const results: VideoResult[] = [];

  try {
    const ddgResults = await searchDuckDuckGo(
      `"${brandName}" ${disambig} tiktok OR instagram OR vimeo video ad`,
      10
    );

    for (const r of ddgResults) {
      if (r.url.includes("tiktok.com") && r.url.includes("/video/")) {
        // Try to scrape TikTok metadata
        const video = await scrapeTikTokVideo(r.url).catch(() => null);
        if (video) {
          results.push({
            platform: "tiktok",
            videoId: video.videoId,
            title: video.title || video.description.slice(0, 80),
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            channelTitle: video.author || video.authorHandle,
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            commentCount: video.commentCount,
            publishedAt: video.publishedAt,
          });
        }
      } else if (r.url.includes("instagram.com") && (r.url.includes("/reel/") || r.url.includes("/p/"))) {
        results.push({
          platform: "tiktok",
          videoId: `ig_${r.url.split("/").filter(Boolean).pop() || ""}`,
          title: r.title || `${brandName} Instagram Reel`,
          description: r.snippet || "",
          url: r.url,
          thumbnailUrl: "",
          channelTitle: "Instagram",
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          publishedAt: new Date().toISOString(),
        });
      } else if (r.url.includes("vimeo.com")) {
        const video = await getVimeoMetadata(r.url).catch(() => null);
        if (video) {
          results.push({
            platform: "vimeo",
            videoId: video.videoId,
            title: video.title,
            description: video.description,
            url: video.url,
            thumbnailUrl: video.thumbnailUrl,
            channelTitle: video.author,
            viewCount: 0,
            likeCount: 0,
            commentCount: 0,
            publishedAt: video.publishedAt,
          });
        }
      }
    }
  } catch {
    // fall through
  }

  // If combined search found nothing, try individual TikTok search
  if (results.length === 0) {
    const ttResults = await searchTikTok(brandName, keywords);
    results.push(...ttResults);
  }

  return results;
}

async function searchTikTok(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];
  const disambig = keywords.brandContext?.disambiguationKeywords?.[0] || "";

  // Better queries: avoid overly restrictive "site:" filter
  // DuckDuckGo returns more TikTok results with natural queries
  const queries = [
    `"${brandName}" ${disambig} tiktok video`,
    `"${brandName}" tiktok viral ad`,
    `site:tiktok.com "${brandName}" ${disambig}`,
  ];

  for (const query of queries) {
    try {
      const ddgResults = await searchDuckDuckGo(query, 8);
      const tiktokUrls = ddgResults
        .filter((r) => r.url.includes("tiktok.com") && r.url.includes("/video/"))
        .slice(0, 3);

      const scraped = await Promise.all(
        tiktokUrls.map((r) => scrapeTikTokVideo(r.url))
      );

      for (const video of scraped) {
        if (!video) continue;
        results.push({
          platform: "tiktok",
          videoId: video.videoId,
          title: video.title || video.description.slice(0, 80),
          description: video.description,
          url: video.url,
          thumbnailUrl: video.thumbnailUrl,
          channelTitle: video.author || video.authorHandle,
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          publishedAt: video.publishedAt,
        });
      }
    } catch {
      // continue
    }
    if (results.length >= 5) break;
  }

  return results;
}

async function searchInstagram(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];
  const disambig = keywords.brandContext?.disambiguationKeywords?.[0] || "";

  // Search for Instagram Reels via DuckDuckGo
  const queries = [
    `"${brandName}" ${disambig} instagram reel`,
    `"${brandName}" instagram video ad`,
  ];

  for (const query of queries) {
    try {
      const ddgResults = await searchDuckDuckGo(query, 8);
      const igUrls = ddgResults
        .filter((r) =>
          r.url.includes("instagram.com") &&
          (r.url.includes("/reel/") || r.url.includes("/p/"))
        )
        .slice(0, 3);

      for (const igResult of igUrls) {
        results.push({
          platform: "tiktok", // stored as social post but displayed as IG
          videoId: `ig_${igResult.url.split("/").filter(Boolean).pop() || ""}`,
          title: igResult.title || `${brandName} Instagram Reel`,
          description: igResult.snippet || "",
          url: igResult.url,
          thumbnailUrl: "",
          channelTitle: "Instagram",
          viewCount: 0,
          likeCount: 0,
          commentCount: 0,
          publishedAt: new Date().toISOString(),
        });
      }
    } catch {
      // continue
    }
    if (results.length >= 3) break;
  }

  return results;
}

async function searchVimeo(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];
  const disambig = keywords.brandContext?.disambiguationKeywords?.[0] || "";

  try {
    const ddgResults = await searchDuckDuckGo(
      `site:vimeo.com "${brandName}" ${disambig} commercial ad`,
      5
    );
    const vimeoUrls = ddgResults
      .filter((r) => r.url.includes("vimeo.com"))
      .slice(0, 3);

    const scraped = await Promise.all(
      vimeoUrls.map((r) => getVimeoMetadata(r.url))
    );

    for (const video of scraped) {
      if (!video) continue;
      results.push({
        platform: "vimeo",
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        url: video.url,
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: video.author,
        viewCount: 0, // Vimeo oEmbed doesn't provide view counts
        likeCount: 0,
        commentCount: 0,
        publishedAt: video.publishedAt,
      });
    }
  } catch {
    // continue
  }

  return results;
}

function youtubeToResult(
  v: YouTubeVideo,
  platform: "youtube" | "youtube_short"
): VideoResult {
  return {
    platform,
    videoId: v.videoId,
    title: v.title,
    description: v.description,
    url: `https://youtube.com/watch?v=${v.videoId}`,
    thumbnailUrl: v.thumbnailUrl,
    channelTitle: v.channelTitle,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    commentCount: v.commentCount,
    publishedAt: v.publishedAt,
  };
}
