import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { crawlWebsite, type CrawlResult } from "@/services/research/website-crawler";
import { searchYouTubeVideos, type YouTubeVideo } from "@/services/research/youtube-service";
import { runAnalysisPipeline } from "@/services/ai/analysis-pipeline";

export const maxDuration = 60;

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

    // Mark as researching
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RESEARCHING" },
    });

    let brandCrawl: CrawlResult | null = null;
    const competitorCrawls = new Map<string, CrawlResult>();
    let brandVideos: YouTubeVideo[] = [];
    const competitorVideos = new Map<string, YouTubeVideo[]>();

    // Step 1: Crawl brand website
    if (project.brandUrl) {
      try {
        brandCrawl = await crawlWebsite(project.brandUrl);
      } catch (err) {
        console.error("Brand crawl failed:", err);
      }
    }

    // Step 2: Crawl competitor websites
    for (const comp of project.competitors) {
      if (!comp.url) continue;
      try {
        const crawl = await crawlWebsite(comp.url);
        competitorCrawls.set(comp.id, crawl);
      } catch (err) {
        console.error(`Competitor crawl failed for ${comp.name}:`, err);
      }
    }

    // Step 3: YouTube research
    try {
      brandVideos = await searchYouTubeVideos(`${project.brandName} review ad`);
      for (const comp of project.competitors) {
        const videos = await searchYouTubeVideos(`${comp.name} review ad`);
        competitorVideos.set(comp.id, videos);
      }
    } catch (err) {
      console.error("YouTube research failed:", err);
    }

    // Step 4: Web mentions from crawl data
    if (brandCrawl) {
      const mentions = brandCrawl.testimonials.slice(0, 3);
      for (const mention of mentions) {
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

    // Step 5: AI Analysis
    await runAnalysisPipeline(
      projectId,
      "", // no jobId needed for serverless
      brandCrawl,
      competitorCrawls,
      brandVideos,
      competitorVideos
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

    return NextResponse.json({
      success: true,
      project: result,
    });
  } catch (err) {
    console.error("Research pipeline error:", err);
    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ERROR" },
    }).catch(() => {});
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Research failed" },
      { status: 500 }
    );
  }
}
