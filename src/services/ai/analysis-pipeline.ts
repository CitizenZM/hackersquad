import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "./claude-client";
import { buildBrandAnalysisPrompt } from "./prompts/brand-analysis";
import { buildContentScoringPrompt } from "./prompts/content-scoring";
import { buildPatternMiningPrompt } from "./prompts/pattern-mining";
import { buildCompetitorIntelPrompt } from "./prompts/competitor-intel";
import type { CrawlResult } from "@/services/research/website-crawler";
import type { YouTubeVideo } from "@/services/research/youtube-service";
import type { VideoResult } from "@/services/research/video-search";
import { NarrativeType, ContentType } from "@/generated/prisma/enums";

const brandAnalysisSchema = z.object({
  brandPromise: z.string(),
  valueProposition: z.string(),
  toneOfVoice: z.string(),
  targetAudience: z.string(),
  pricingTheme: z.string(),
  productFeatures: z.array(z.string()),
  ctaLanguage: z.array(z.string()),
  socialProof: z.array(z.string()),
});

const contentScoreSchema = z.object({
  scores: z.array(z.object({
    videoId: z.string(),
    overallScore: z.number(),
    hookStrength: z.number(),
    productVisibility: z.number(),
    storytellingArc: z.number(),
    ctaQuality: z.number(),
    emotionalAppeal: z.number(),
    pacing: z.number(),
    hookText: z.string(),
    narrativeType: z.string(),
    keyMessages: z.array(z.string()),
    analysis: z.string(),
    contentCategory: z.string(),
  })),
});

const patternSchema = z.object({
  patterns: z.array(z.object({
    type: z.string(), name: z.string(), description: z.string(),
    frequency: z.number(), avgPerformance: z.number(), bestPractices: z.array(z.string()),
  })),
  sellingPoints: z.array(z.object({
    point: z.string(), category: z.string(), strength: z.number(),
    frequency: z.number(), uniqueness: z.number(),
  })),
  topSignals: z.array(z.string()),
});

const competitorSchema = z.object({
  brandPromise: z.string(), valueProposition: z.string(), toneOfVoice: z.string(),
  pricingTheme: z.string(), productFeatures: z.array(z.string()),
  ctaLanguage: z.array(z.string()), strengths: z.array(z.string()),
  weaknesses: z.array(z.string()), opportunities: z.array(z.string()),
});

function validNarrativeType(val: string): NarrativeType {
  const valid: NarrativeType[] = [
    "PROBLEM_SOLUTION","TESTIMONIAL","DEMONSTRATION","LIFESTYLE",
    "EDUCATIONAL","COMPARISON","STORY_ARC","UGC_STYLE","TREND_RIDING","BEFORE_AFTER",
  ];
  return valid.includes(val as NarrativeType) ? (val as NarrativeType) : "DEMONSTRATION";
}

export async function runAnalysisPipeline(
  projectId: string, _jobId: string,
  brandCrawl: CrawlResult | null,
  competitorCrawls: Map<string, CrawlResult>,
  brandVideos: (YouTubeVideo & { _platform?: string })[],
  competitorVideos: Map<string, (YouTubeVideo & { _platform?: string })[]>,
  allVideoResults?: VideoResult[]
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }, include: { brand: true, competitors: true },
  });
  if (!project) throw new Error("Project not found");

  const allVideos = [...brandVideos];
  const videoCompetitorMap = new Map<string, string | null>();
  brandVideos.forEach((v) => videoCompetitorMap.set(v.videoId, null));
  for (const [compId, videos] of competitorVideos) {
    allVideos.push(...videos);
    videos.forEach((v) => videoCompetitorMap.set(v.videoId, compId));
  }

  // PARALLEL: brand + competitors + content scoring all at once
  const tasks: Promise<void>[] = [];

  if (brandCrawl && project.brand) {
    tasks.push((async () => {
      try {
        const p = buildBrandAnalysisPrompt(project.brandName, brandCrawl!);
        const a = await analyzeWithClaude({ systemPrompt: p.system, userPrompt: p.user, responseSchema: brandAnalysisSchema });
        await prisma.brand.update({ where: { id: project.brand!.id }, data: {
          brandPromise: a.brandPromise, valueProposition: a.valueProposition,
          toneOfVoice: a.toneOfVoice, targetAudience: a.targetAudience,
          pricingTheme: a.pricingTheme, productFeatures: a.productFeatures,
          ctaLanguage: a.ctaLanguage, socialProof: a.socialProof,
          dataSource: "AI_INFERRED", rawCrawlData: brandCrawl satisfies object as object,
        }});
      } catch (e) { console.error("Brand analysis failed:", e); }
    })());
  }

  for (const comp of project.competitors) {
    const crawl = competitorCrawls.get(comp.id);
    if (!crawl) continue;
    tasks.push((async () => {
      try {
        const p = buildCompetitorIntelPrompt(project.brandName, brandCrawl, comp.name, crawl);
        const a = await analyzeWithClaude({ systemPrompt: p.system, userPrompt: p.user, responseSchema: competitorSchema });
        await prisma.competitor.update({ where: { id: comp.id }, data: {
          brandPromise: a.brandPromise, valueProposition: a.valueProposition,
          toneOfVoice: a.toneOfVoice, pricingTheme: a.pricingTheme,
          productFeatures: a.productFeatures, ctaLanguage: a.ctaLanguage,
          strengths: a.strengths, weaknesses: a.weaknesses,
          rawCrawlData: crawl satisfies object as object, dataSource: "AI_INFERRED",
        }});
        for (const opp of a.opportunities) {
          await prisma.insight.create({ data: {
            projectId, category: "gap", title: `Opportunity vs ${comp.name}`,
            description: opp, importance: 70, dataSource: "AI_INFERRED",
          }});
        }
      } catch (e) { console.error(`Competitor analysis failed for ${comp.name}:`, e); }
    })());
  }

  if (allVideos.length > 0) {
    tasks.push((async () => {
      try {
        const p = buildContentScoringPrompt(project.brandName, allVideos.slice(0, 10));
        const r = await analyzeWithClaude({ systemPrompt: p.system, userPrompt: p.user, responseSchema: contentScoreSchema, maxTokens: 8192 });
        for (const score of r.scores) {
          const video = allVideos.find((v) => v.videoId === score.videoId);
          if (!video) continue;

          // Determine platform from VideoResult data
          const vr = allVideoResults?.find((x) => x.videoId === video.videoId);
          const platform = (video as YouTubeVideo & { _platform?: string })._platform || vr?.platform || "youtube";
          const platformMap: Record<string, ContentType> = {
            youtube: "YOUTUBE_VIDEO", youtube_short: "YOUTUBE_SHORT",
            tiktok: "TIKTOK_VIDEO", vimeo: "VIMEO_VIDEO",
          };
          const platformLabels: Record<string, string> = {
            youtube: "YouTube", youtube_short: "YouTube Shorts",
            tiktok: "TikTok", vimeo: "Vimeo",
          };
          const contentType = platformMap[platform] || "YOUTUBE_VIDEO";
          const videoUrl = vr?.url || `https://youtube.com/watch?v=${video.videoId}`;

          await prisma.contentAsset.create({ data: {
            projectId, competitorId: videoCompetitorMap.get(score.videoId) || null,
            type: contentType, title: video.title,
            url: videoUrl,
            thumbnailUrl: video.thumbnailUrl, description: video.description,
            publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
            platform: platformLabels[platform] || "YouTube",
            viewCount: video.viewCount,
            likeCount: video.likeCount, commentCount: video.commentCount,
            engagementRate: video.viewCount > 0 ? ((video.likeCount + video.commentCount) / video.viewCount) * 100 : 0,
            metricsSource: "PUBLIC_WEB", overallScore: score.overallScore,
            hookStrength: score.hookStrength, productVisibility: score.productVisibility,
            storytellingArc: score.storytellingArc, ctaQuality: score.ctaQuality,
            emotionalAppeal: score.emotionalAppeal, pacing: score.pacing,
            hookText: score.hookText, narrativeType: validNarrativeType(score.narrativeType),
            keyMessages: score.keyMessages,
            contentCategory: score.contentCategory || null,
            isBrandOwned: !videoCompetitorMap.get(score.videoId),
            dataSource: "PUBLIC_WEB",
          }});
        }
      } catch (e) { console.error("Content scoring failed:", e); }
    })());
  }

  await Promise.all(tasks);

  // Pattern mining (needs scored content, runs after)
  const scoredAssets = await prisma.contentAsset.findMany({ where: { projectId }, orderBy: { overallScore: "desc" } });
  if (scoredAssets.length > 0) {
    try {
      const p = buildPatternMiningPrompt(project.brandName, scoredAssets.map((a) => ({
        title: a.title, narrativeType: a.narrativeType || "DEMONSTRATION",
        overallScore: a.overallScore || 0, hookText: a.hookText || "",
        keyMessages: (a.keyMessages as string[]) || [],
      })));
      const r = await analyzeWithClaude({ systemPrompt: p.system, userPrompt: p.user, responseSchema: patternSchema, maxTokens: 4096 });

      for (const pat of r.patterns) {
        await prisma.narrativePattern.upsert({
          where: { projectId_type: { projectId, type: validNarrativeType(pat.type) } },
          create: { projectId, type: validNarrativeType(pat.type), name: pat.name, description: pat.description, frequency: pat.frequency, avgPerformance: pat.avgPerformance, bestPractices: pat.bestPractices },
          update: { name: pat.name, description: pat.description, frequency: pat.frequency, avgPerformance: pat.avgPerformance, bestPractices: pat.bestPractices },
        });
      }
      for (const sp of r.sellingPoints) {
        await prisma.sellingPoint.create({ data: { projectId, point: sp.point, category: sp.category, strength: sp.strength, frequency: sp.frequency, uniqueness: sp.uniqueness } });
      }

      const avgScore = scoredAssets.reduce((s, a) => s + (a.overallScore || 0), 0) / scoredAssets.length;
      await prisma.project.update({ where: { id: projectId }, data: {
        brandHealthScore: Math.round(avgScore),
        opportunityScore: Math.round(r.sellingPoints.reduce((s, p) => s + (p.uniqueness || 0), 0) / Math.max(r.sellingPoints.length, 1)),
        topSignals: r.topSignals,
      }});
    } catch (e) { console.error("Pattern mining failed:", e); }
  }
}
