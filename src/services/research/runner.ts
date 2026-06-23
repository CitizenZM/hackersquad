import { prisma } from "@/lib/db";
import { pMapSettled } from "@/lib/parallel";
import { crawlWebsite, type CrawlResult } from "./website-crawler";
import {
  quickBrandUnderstanding,
  extractSearchKeywords,
} from "./keyword-extractor";
import { searchVerifiedVideos, type VideoResult } from "./video-search";
import { getCampaignPlatform } from "@/lib/campaign-platform";
import { searchTikTokTopAds } from "./tiktok-creative-center";
import { runAnalysisPipeline } from "@/services/ai/analysis-pipeline";
import {
  startStep,
  updateStep,
  completeStep,
  failJob,
  completeJob,
  type JobStep,
} from "./job-progress";
import type { YouTubeVideo } from "./youtube-service";

const CONCURRENCY = Number(process.env.RESEARCH_CONCURRENCY ?? 5);

export const STEP_NAMES = [
  "Crawl websites",
  "Brand understanding",
  "Video search",
  "Paid media discovery",
  "AI analysis",
] as const;

export async function runResearch(projectId: string, jobId: string): Promise<void> {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { brand: true, competitors: true },
    });
    if (!project) throw new Error("Project not found");

    // Step 1: parallel website crawls
    await startStep(jobId, "Crawl websites");
    const crawlTargets: { id: string; url: string }[] = [];
    if (project.brandUrl) crawlTargets.push({ id: "brand", url: project.brandUrl });
    for (const comp of project.competitors) {
      if (comp.url) crawlTargets.push({ id: comp.id, url: comp.url });
    }

    const crawlResults = await pMapSettled(
      crawlTargets,
      async (t, i) => {
        const result = await crawlWebsite(t.url);
        await updateStep(
          jobId,
          "Crawl websites",
          Math.round(((i + 1) / Math.max(crawlTargets.length, 1)) * 100),
          `Crawled ${t.url}`
        );
        return { id: t.id, result };
      },
      { concurrency: CONCURRENCY }
    );

    let brandCrawl: CrawlResult | null = null;
    const competitorCrawls = new Map<string, CrawlResult>();
    crawlResults.forEach((r, i) => {
      if (r.status !== "fulfilled") return;
      if (r.value.id === "brand") brandCrawl = r.value.result;
      else competitorCrawls.set(crawlTargets[i].id, r.value.result);
    });
    await completeStep(jobId, "Crawl websites");

    // Step 2: brand understanding + keywords (sequential, cheap)
    await startStep(jobId, "Brand understanding");
    const briefing = [project.briefingText, project.briefingParsed]
      .filter(Boolean)
      .join("\n\n") || undefined;
    const brandContext = await quickBrandUnderstanding(project.brandName, brandCrawl);
    const keywords = await extractSearchKeywords(
      project.brandName,
      brandCrawl,
      project.competitors.map((c) => c.name),
      briefing,
      brandContext
    );
    await completeStep(jobId, "Brand understanding");

    // Step 3: parallel video search across brand + competitors
    await startStep(jobId, "Video search");

    // Search strategy + platform constraint come from the user's selected
    // campaign platform when available; otherwise fall back to a campaign-goal
    // heuristic. This keeps search consistent with "Platform & Duration".
    const campaignSelection = await prisma.campaignSelection
      .findUnique({ where: { projectId }, select: { platform: true } })
      .catch(() => null);
    const campaignPlatform = getCampaignPlatform(campaignSelection?.platform);

    let searchStrategy: "short_social" | "tvc" | "mixed";
    let allowedPlatforms: VideoResult["platform"][] | undefined;

    if (campaignPlatform) {
      searchStrategy = campaignPlatform.searchStrategy;
      allowedPlatforms = campaignPlatform.videoPlatforms;
    } else {
      const goal = (project.campaignGoal || "").toLowerCase();
      const isShortFormSocial =
        goal.includes("tiktok") || goal.includes("instagram") ||
        goal.includes("shop") || goal.includes("social") ||
        goal.includes("creator") || goal.includes("affiliate");
      const isTVC =
        goal.includes("tvc") || goal.includes("television") ||
        goal.includes("brand awareness") || goal.includes("hero") ||
        goal.includes("landing page");
      searchStrategy = isShortFormSocial ? "short_social" : isTVC ? "tvc" : "mixed";
    }

    const brandProductName =
      project.productPageTitle || project.productName || undefined;
    const videoTargets = [
      { name: project.brandName, ownerId: null as string | null, productName: brandProductName },
      ...project.competitors.map((c) => ({
        name: c.name,
        ownerId: c.id,
        productName: undefined as string | undefined,
      })),
    ];
    const videoResults = await pMapSettled(
      videoTargets,
      async (t, i) => {
        // Search → score → LLM-verify → loop, keeping only videos that are
        // relevant AND high-engagement (or exhausting the retry rounds).
        const videos = await searchVerifiedVideos(t.name, keywords, searchStrategy, {
          productName: t.productName,
          targetCount: 6,
          maxRounds: 3,
          allowedPlatforms,
        });
        const verifiedCount = videos.filter((v) => v.verified).length;
        await updateStep(
          jobId,
          "Video search",
          Math.round(((i + 1) / Math.max(videoTargets.length, 1)) * 100),
          `${verifiedCount} verified videos for ${t.name}`
        );
        return { ownerId: t.ownerId, videos };
      },
      { concurrency: Math.min(CONCURRENCY, 3) }
    );

    const allVideos: VideoResult[] = [];
    const brandVideos: VideoResult[] = [];
    const competitorVideosMap = new Map<string, VideoResult[]>();
    videoResults.forEach((r) => {
      if (r.status !== "fulfilled") return;
      allVideos.push(...r.value.videos);
      if (r.value.ownerId === null) brandVideos.push(...r.value.videos);
      else competitorVideosMap.set(r.value.ownerId, r.value.videos);
    });
    await completeStep(jobId, "Video search");

    // Step 4: paid media (TikTok Creative Center)
    await startStep(jobId, "Paid media discovery");
    try {
      const tiktokAds = await searchTikTokTopAds({
        limit: 20,
        industry: project.category ?? undefined,
      });
      let saved = 0;
      for (const ad of tiktokAds) {
        if (!ad.adId) continue;
        const adUrl =
          ad.videoUrl ||
          `https://ads.tiktok.com/business/creativecenter/inspiration/popular/pc/en?material_id=${ad.adId}`;
        await prisma.contentAsset
          .upsert({
            where: { projectId_url: { projectId, url: adUrl } },
            create: {
              projectId,
              type: "TIKTOK_VIDEO",
              title: ad.title,
              url: adUrl,
              thumbnailUrl: ad.thumbnailUrl ?? null,
              description: ad.brand
                ? `Top TikTok ad by ${ad.brand}`
                : "TikTok Creative Center top ad",
              platform: "TikTok Ads",
              isPaidMedia: true,
              adSpendEstimate: {
                impressions: ad.impressions ?? null,
                ctr: ad.ctr ?? null,
                cvr: ad.cvr ?? null,
                firstSeen: ad.firstSeenAt ?? null,
                lastSeen: ad.lastSeenAt ?? null,
              } as never,
              dataSource: "PUBLIC_WEB",
              rawData: ad.rawData as never,
            },
            update: {
              title: ad.title,
              thumbnailUrl: ad.thumbnailUrl ?? null,
              adSpendEstimate: {
                impressions: ad.impressions ?? null,
                ctr: ad.ctr ?? null,
                cvr: ad.cvr ?? null,
                firstSeen: ad.firstSeenAt ?? null,
                lastSeen: ad.lastSeenAt ?? null,
              } as never,
            },
          })
          .then(() => {
            saved++;
          })
          .catch(() => {});
      }
      await updateStep(
        jobId,
        "Paid media discovery",
        100,
        `${saved} TikTok paid ads saved`
      );
    } catch (err) {
      await updateStep(
        jobId,
        "Paid media discovery",
        100,
        `Paid media skipped: ${err instanceof Error ? err.message : "unknown"}`
      );
    }
    await completeStep(jobId, "Paid media discovery");

    // Step 5: AI analysis
    await startStep(jobId, "AI analysis");
    const ytBrand: YouTubeVideo[] = brandVideos.map(videoResultToYouTube);
    const ytComp = new Map<string, YouTubeVideo[]>();
    for (const [k, v] of competitorVideosMap.entries()) {
      ytComp.set(k, v.map(videoResultToYouTube));
    }
    await runAnalysisPipeline(
      projectId,
      jobId,
      brandCrawl,
      competitorCrawls,
      ytBrand,
      ytComp,
      allVideos
    );
    await completeStep(jobId, "AI analysis");

    await prisma.project.update({
      where: { id: projectId },
      data: { status: "ANALYZED" },
    });
    await completeJob(jobId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Research failed";
    await failJob(jobId, msg).catch(() => {});
    await prisma.project
      .update({ where: { id: projectId }, data: { status: "ERROR" } })
      .catch(() => {});
  }
}

function videoResultToYouTube(v: VideoResult): YouTubeVideo & { _platform?: string } {
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

export type { JobStep };
