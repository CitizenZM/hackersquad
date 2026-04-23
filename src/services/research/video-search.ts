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
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const allResults: VideoResult[] = [];

  // Run all platform searches in parallel
  const [ytLong, ytShorts, tiktokResults, vimeoResults] = await Promise.all([
    searchYouTubeLong(brandName, keywords),
    searchYouTubeShorts(brandName, keywords),
    searchTikTok(brandName, keywords),
    searchVimeo(brandName, keywords),
  ]);

  allResults.push(...ytLong, ...ytShorts, ...tiktokResults, ...vimeoResults);

  // Deduplicate by videoId
  const seen = new Set<string>();
  return allResults.filter((v) => {
    const key = `${v.platform}:${v.videoId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function searchYouTubeLong(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  // Use the top 2 ad-specific queries
  const queries = keywords.adSearchQueries.slice(0, 2);
  if (queries.length === 0) {
    queries.push(`${brandName} official ad commercial`);
  }

  const results: VideoResult[] = [];
  for (const query of queries) {
    try {
      const videos = await searchYouTubeVideos(query, 5);
      results.push(
        ...videos.map((v) => youtubeToResult(v, "youtube"))
      );
    } catch {
      // continue with next query
    }
  }
  return results;
}

async function searchYouTubeShorts(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const query = `${brandName} ad short`;
  try {
    const videos = await searchYouTubeVideos(query, 5, "EgIQCQ%3D%3D");
    return videos.map((v) => youtubeToResult(v, "youtube_short"));
  } catch {
    return [];
  }
}

async function searchTikTok(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];

  // Search via DuckDuckGo
  const queries = [
    `site:tiktok.com "${brandName}" ad commercial`,
    `site:tiktok.com "${brandName}" ${keywords.productKeywords[0] || ""}`,
  ];

  for (const query of queries) {
    try {
      const ddgResults = await searchDuckDuckGo(query, 5);
      const tiktokUrls = ddgResults
        .filter((r) => r.url.includes("tiktok.com") && r.url.includes("/video/"))
        .slice(0, 3);

      // Scrape each TikTok video for full metadata (parallel)
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
  }

  return results;
}

async function searchVimeo(
  brandName: string,
  keywords: SearchKeywords
): Promise<VideoResult[]> {
  const results: VideoResult[] = [];

  try {
    const ddgResults = await searchDuckDuckGo(
      `site:vimeo.com "${brandName}" commercial ad`,
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
