import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crawlWebsite, type CrawlResult } from "@/services/research/website-crawler";
import { quickBrandUnderstanding, extractSearchKeywords } from "@/services/research/keyword-extractor";
import { searchAllPlatforms, type VideoResult } from "@/services/research/video-search";
import { runAnalysisPipeline } from "@/services/ai/analysis-pipeline";

export const maxDuration = 60;

const CONTENT_TYPE_MAP: Record<string, string> = {
  youtube: "YOUTUBE_VIDEO",
  youtube_short: "YOUTUBE_SHORT",
  tiktok: "TIKTOK_VIDEO",
  vimeo: "VIMEO_VIDEO",
};

const PLATFORM_LABELS: Record<string, string> = {
  youtube: "YouTube",
  youtube_short: "YouTube Shorts",
  tiktok: "TikTok",
  vimeo: "Vimeo",
};

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { brand: true, competitors: true },
    });
    if (!project) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RESEARCHING" },
    });

    // STEP 1: Crawl websites in parallel
    const crawlPromises: Promise<{ id: string; result: CrawlResult | null }>[] = [];

    if (project.brandUrl) {
      crawlPromises.push(
        crawlWebsite(project.brandUrl)
          .then((result) => ({ id: "brand", result }))
          .catch(() => ({ id: "brand", result: null }))
      );
    }
    for (const comp of project.competitors) {
      if (!comp.url) continue;
      crawlPromises.push(
        crawlWebsite(comp.url)
          .then((result) => ({ id: comp.id, result }))
          .catch(() => ({ id: comp.id, result: null }))
      );
    }

    const crawlResults = await Promise.all(crawlPromises);

    let brandCrawl: CrawlResult | null = null;
    const competitorCrawls = new Map<string, CrawlResult>();
    for (const { id, result } of crawlResults) {
      if (!result) continue;
      if (id === "brand") brandCrawl = result;
      else competitorCrawls.set(id, result);
    }

    // STEP 2: Brand understanding + keyword extraction (COMBINED into one AI call for speed)
    const briefing = [project.briefingText, project.briefingParsed].filter(Boolean).join("\n\n") || undefined;
    const brandContext = await quickBrandUnderstanding(project.brandName, brandCrawl);
    const keywords = await extractSearchKeywords(
      project.brandName,
      brandCrawl,
      project.competitors.map((c) => c.name),
      briefing,
      brandContext
    );

    // STEP 3: Video search — brand only (skip competitor to stay under 60s)
    const brandVideos = await searchAllPlatforms(project.brandName, keywords);

    // STEP 4: Store all videos as ContentAssets
    const allVideosForScoring: VideoResult[] = [...brandVideos];
    const videoOwnerMap = new Map<string, string | null>();
    brandVideos.forEach((v) => videoOwnerMap.set(`${v.platform}:${v.videoId}`, null));

    // STEP 5: AI Analysis
    const youtubeFormatBrand = brandVideos.map(videoResultToYouTube);
    const youtubeFormatCompetitors = new Map<string, ReturnType<typeof videoResultToYouTube>[]>();

    await runAnalysisPipeline(
      projectId,
      "",
      brandCrawl,
      competitorCrawls,
      youtubeFormatBrand,
      youtubeFormatCompetitors,
      allVideosForScoring
    );

    // Finalize
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ANALYZED" },
    });

    const result = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        brand: true,
        _count: { select: { contentAssets: true, insights: true } },
      },
    });

    return NextResponse.json({ success: true, project: result });
  } catch (err) {
    console.error("Research pipeline error:", err);
    await prisma.project
      .update({ where: { id: projectId }, data: { status: "ERROR" } })
      .catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}

function videoResultToYouTube(v: VideoResult) {
  return {
    videoId: v.videoId,
    title: v.title,
    description: v.description,
    publishedAt: v.publishedAt,
    thumbnailUrl: v.thumbnailUrl,
    channelTitle: v.channelTitle,
    viewCount: v.viewCount,
    likeCount: v.likeCount,
    commentCount: v.commentCount,
    _platform: v.platform,
  };
}
