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

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "RESEARCHING" },
    });

    // Run crawls + YouTube in PARALLEL for speed
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

    // YouTube - single query for brand (competitors use mock data)
    const ytPromise = searchYouTubeVideos(project.brandName)
      .catch(() => [] as YouTubeVideo[]);

    const [crawlResults, brandVideos] = await Promise.all([
      Promise.all(crawlPromises),
      ytPromise,
    ]);

    // Organize crawl results
    let brandCrawl: CrawlResult | null = null;
    const competitorCrawls = new Map<string, CrawlResult>();
    for (const { id, result } of crawlResults) {
      if (!result) continue;
      if (id === "brand") brandCrawl = result;
      else competitorCrawls.set(id, result);
    }

    // Competitor YouTube mock data (one call per competitor)
    const competitorVideos = new Map<string, YouTubeVideo[]>();
    for (const comp of project.competitors) {
      competitorVideos.set(comp.id, await searchYouTubeVideos(comp.name));
    }

    // Web mentions from crawl
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

    // AI Analysis (uses gpt-4o-mini for speed)
    await runAnalysisPipeline(
      projectId,
      "",
      brandCrawl,
      competitorCrawls,
      brandVideos,
      competitorVideos
    );

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
