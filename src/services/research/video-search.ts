import { searchYouTubeVideos, type YouTubeVideo } from "./youtube-service";
import { searchDuckDuckGo } from "./duckduckgo";
import { scrapeTikTokVideo } from "./tiktok-scraper";
import { getVimeoMetadata } from "./vimeo-service";
import type { SearchKeywords } from "./keyword-extractor";
import {
  selectRelevantVideos,
  type RelevanceContext,
  type ScoredVideo,
  type SelectOptions,
} from "./video-relevance";

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

// ─── Verified search loop ─────────────────────────────────────────────────────

/**
 * Broaden the search keywords for a given retry round by surfacing fresh
 * ad/category query variants to the FRONT (YouTube long-form only reads the
 * first two adSearchQueries, so order matters).
 */
function broadenKeywords(
  kw: SearchKeywords,
  round: number,
  brandName: string
): SearchKeywords {
  if (round <= 0) return kw;
  const cat =
    kw.categoryKeywords?.[0] || kw.brandContext?.industry || "product";
  const byRound: string[][] = [
    [],
    [`${brandName} ${cat} ad commercial`, `${brandName} official ad`, `${brandName} ${cat} review`],
    [`${brandName} viral ad`, `best ${cat} ads`, `${brandName} unboxing`],
  ];
  const extra = byRound[Math.min(round, byRound.length - 1)] ?? [];
  return { ...kw, adSearchQueries: [...extra, ...(kw.adSearchQueries ?? [])] };
}

export interface VerifiedSearchOptions {
  productName?: string;
  targetCount?: number;
  maxRounds?: number;
  select?: SelectOptions;
  /**
   * Restrict results to these VideoResult platforms (e.g. ["tiktok"] when the
   * campaign platform is TikTok). When omitted, all platforms are kept.
   */
  allowedPlatforms?: VideoResult["platform"][];
}

/**
 * Search across platforms and KEEP SEARCHING (broadening queries each round)
 * until we have `targetCount` videos that are both verified-relevant and
 * high-engagement, or `maxRounds` is exhausted. Candidates accumulate and
 * de-duplicate across rounds; the best-scored selection is always returned.
 */
export async function searchVerifiedVideos(
  brandName: string,
  keywords: SearchKeywords,
  strategy: "short_social" | "tvc" | "mixed" = "mixed",
  opts: VerifiedSearchOptions = {}
): Promise<ScoredVideo[]> {
  const targetCount = opts.targetCount ?? 6;
  const maxRounds = opts.maxRounds ?? 3;
  const ctx: RelevanceContext = {
    brandName,
    productName: opts.productName,
    keywords,
  };

  const allowed = opts.allowedPlatforms?.length
    ? new Set(opts.allowedPlatforms)
    : null;

  const pool = new Map<string, VideoResult>();
  let best: ScoredVideo[] = [];

  for (let round = 0; round < maxRounds; round++) {
    const roundKeywords = broadenKeywords(keywords, round, brandName);
    try {
      const found = await searchAllPlatforms(brandName, roundKeywords, strategy);
      for (const v of found) {
        // Keep results consistent with the chosen campaign platform.
        if (allowed && !allowed.has(v.platform)) continue;
        pool.set(`${v.platform}:${v.videoId}`, v);
      }
    } catch {
      // keep whatever we have; try next round
    }

    best = await selectRelevantVideos([...pool.values()], ctx, {
      targetCount,
      ...opts.select,
    });

    if (best.length >= targetCount) break;
  }

  return best;
}
