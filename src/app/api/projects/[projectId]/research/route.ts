import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crawlWebsite, type CrawlResult } from "@/services/research/website-crawler";
import { extractSearchKeywords } from "@/services/research/keyword-extractor";
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

    // STEP 2: Extract smart keywords from brand crawl
    const keywords = await extractSearchKeywords(
      project.brandName,
      brandCrawl,
      project.competitors.map((c) => c.name)
    );

    // STEP 3: Multi-platform video search (YouTube + Shorts + TikTok + Vimeo)
    const brandVideos = await searchAllPlatforms(project.brandName, keywords);

    // Also search for each competitor
    const competitorVideoMap = new Map<string, VideoResult[]>();
    for (const comp of project.competitors) {
      const compKeywords = {
        ...keywords,
        adSearchQueries: [
          `${comp.name} official ad commercial`,
          `${comp.name} brand campaign advertisement`,
        ],
      };
      const videos = await searchAllPlatforms(comp.name, compKeywords);
      competitorVideoMap.set(comp.id, videos);
    }

    // STEP 4: Store all videos as ContentAssets
    const allVideosForScoring: VideoResult[] = [...brandVideos];
    const videoOwnerMap = new Map<string, string | null>();
    brandVideos.forEach((v) => videoOwnerMap.set(`${v.platform}:${v.videoId}`, null));

    for (const [compId, videos] of competitorVideoMap) {
      allVideosForScoring.push(...videos);
      videos.forEach((v) => videoOwnerMap.set(`${v.platform}:${v.videoId}`, compId));
    }

    // Web mentions from crawl data
    if (brandCrawl) {
      for (const mention of brandCrawl.testimonials.slice(0, 3)) {
        await prisma.contentAsset.create({
          data: {
            projectId,
            type: "WEB_MENTION",
            title: `Website mention: ${mention.slice(0, 60)}...`,
            url: project.brandUrl || "",
            description: mention,
            platform: "Website",
            dataSource: "PUBLIC_WEB",
          },
        });
      }
    }

    // STEP 5: AI Analysis - convert VideoResults to the format the pipeline expects
    const youtubeFormatBrand = brandVideos.map(videoResultToYouTube);
    const youtubeFormatCompetitors = new Map<string, ReturnType<typeof videoResultToYouTube>[]>();
    for (const [compId, videos] of competitorVideoMap) {
      youtubeFormatCompetitors.set(compId, videos.map(videoResultToYouTube));
    }

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
