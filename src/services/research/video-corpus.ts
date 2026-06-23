import { prisma } from "@/lib/db";
import type { VideoResult } from "./video-search";
import type { ScoredVideo } from "./video-relevance";

// The cross-project learning corpus. Every video any search surfaces is
// accumulated here, deduplicated by (platform, videoId) and NEVER cleared.
// Refresh/regenerate upserts into this growing store: prior discoveries and
// their best scores are retained, brand attributions are merged, and a
// seenCount tracks how often a video resurfaces. This is additive on purpose.

type CorpusVideo = VideoResult & Partial<ScoredVideo>;

// Only store the BEST videos in the corpus — top-ranked and high quality
// (high views/likes/engagement). A video qualifies if it was LLM-verified, or
// it carries a strong combined score, or its raw engagement is clearly high.
// Anything weaker is intentionally NOT persisted.
const MIN_COMBINED_SCORE = 0.5;
const HIGH_VIEW_COUNT = 50_000;
const HIGH_ENGAGEMENT_RATE = 0.03; // (likes + comments) / views

function isHighQuality(v: CorpusVideo): boolean {
  if (v.verified) return true;
  if ((v.combinedScore ?? 0) >= MIN_COMBINED_SCORE) return true;
  const views = v.viewCount || 0;
  if (views >= HIGH_VIEW_COUNT) return true;
  if (views > 0) {
    const eng = ((v.likeCount || 0) + (v.commentCount || 0)) / views;
    if (eng >= HIGH_ENGAGEMENT_RATE) return true;
  }
  return false;
}

function mergeBrands(existing: unknown, brandName?: string): string[] {
  const set = new Set<string>();
  if (Array.isArray(existing)) {
    for (const b of existing) if (typeof b === "string") set.add(b);
  }
  if (brandName) set.add(brandName);
  return [...set];
}

function maxScore(a: number | null | undefined, b: number | null | undefined): number | null {
  const an = typeof a === "number" ? a : null;
  const bn = typeof b === "number" ? b : null;
  if (an === null) return bn;
  if (bn === null) return an;
  return Math.max(an, bn);
}

/**
 * Accumulate the given videos into the DiscoveredVideo corpus. Existing rows are
 * updated (metrics refreshed, lastSeenAt bumped, seenCount incremented, brands
 * merged, best scores kept); new rows are created. Nothing is ever deleted.
 *
 * Errors are swallowed per-video so corpus persistence never breaks research.
 */
export async function recordDiscoveredVideos(
  videos: CorpusVideo[],
  opts: { brandName?: string; workspaceId?: string | null } = {}
): Promise<number> {
  // Keep only top-ranked, high-quality videos out of whatever was passed in.
  const qualified = videos.filter(isHighQuality);
  if (!qualified.length) return 0;
  const now = new Date();
  let saved = 0;

  await Promise.all(
    qualified.map(async (v) => {
      if (!v.videoId || !v.platform) return;
      try {
        const existing = await prisma.discoveredVideo.findUnique({
          where: { platform_videoId: { platform: v.platform, videoId: v.videoId } },
          select: { brands: true, relevanceScore: true, qualityScore: true, combinedScore: true },
        });
        const brands = mergeBrands(existing?.brands, opts.brandName);

        await prisma.discoveredVideo.upsert({
          where: { platform_videoId: { platform: v.platform, videoId: v.videoId } },
          create: {
            platform: v.platform,
            videoId: v.videoId,
            url: v.url,
            title: v.title,
            description: v.description || null,
            channelTitle: v.channelTitle || null,
            thumbnailUrl: v.thumbnailUrl || null,
            publishedAt: v.publishedAt ? new Date(v.publishedAt) : null,
            viewCount: v.viewCount ?? null,
            likeCount: v.likeCount ?? null,
            commentCount: v.commentCount ?? null,
            relevanceScore: v.relevanceScore ?? null,
            qualityScore: v.qualityScore ?? null,
            combinedScore: v.combinedScore ?? null,
            verified: v.verified ?? false,
            brands,
            workspaceId: opts.workspaceId ?? null,
            seenCount: 1,
            firstSeenAt: now,
            lastSeenAt: now,
          },
          update: {
            // Refresh metrics + metadata; keep the BEST scores ever seen.
            title: v.title,
            thumbnailUrl: v.thumbnailUrl || null,
            description: v.description || undefined,
            viewCount: v.viewCount ?? undefined,
            likeCount: v.likeCount ?? undefined,
            commentCount: v.commentCount ?? undefined,
            relevanceScore: maxScore(existing?.relevanceScore, v.relevanceScore),
            qualityScore: maxScore(existing?.qualityScore, v.qualityScore),
            combinedScore: maxScore(existing?.combinedScore, v.combinedScore),
            verified: v.verified || undefined,
            brands,
            lastSeenAt: now,
            seenCount: { increment: 1 },
          },
        });
        saved++;
      } catch {
        // Corpus persistence must never break the research run.
      }
    })
  );

  return saved;
}
