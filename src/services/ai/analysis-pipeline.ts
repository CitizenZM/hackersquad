import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "./claude-client";
import { buildBrandAnalysisPrompt } from "./prompts/brand-analysis";
import { buildContentScoringPrompt } from "./prompts/content-scoring";
import { buildPatternMiningPrompt } from "./prompts/pattern-mining";
import { buildCompetitorIntelPrompt } from "./prompts/competitor-intel";
import type { CrawlResult } from "@/services/research/website-crawler";
import type { YouTubeVideo } from "@/services/research/youtube-service";
import { jobManager } from "@/services/job-manager";

function updateJob(jobId: string, fn: () => void) {
  if (jobId) { try { fn(); } catch { /* ignore in serverless */ } }
}
import { NarrativeType } from "@/generated/prisma/enums";

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
  scores: z.array(
    z.object({
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
    })
  ),
});

const patternSchema = z.object({
  patterns: z.array(
    z.object({
      type: z.string(),
      name: z.string(),
      description: z.string(),
      frequency: z.number(),
      avgPerformance: z.number(),
      bestPractices: z.array(z.string()),
    })
  ),
  sellingPoints: z.array(
    z.object({
      point: z.string(),
      category: z.string(),
      strength: z.number(),
      frequency: z.number(),
      uniqueness: z.number(),
    })
  ),
  topSignals: z.array(z.string()),
});

const competitorSchema = z.object({
  brandPromise: z.string(),
  valueProposition: z.string(),
  toneOfVoice: z.string(),
  pricingTheme: z.string(),
  productFeatures: z.array(z.string()),
  ctaLanguage: z.array(z.string()),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
});

function validNarrativeType(val: string): NarrativeType {
  const valid: NarrativeType[] = [
    "PROBLEM_SOLUTION", "TESTIMONIAL", "DEMONSTRATION", "LIFESTYLE",
    "EDUCATIONAL", "COMPARISON", "STORY_ARC", "UGC_STYLE",
    "TREND_RIDING", "BEFORE_AFTER",
  ];
  return valid.includes(val as NarrativeType) ? (val as NarrativeType) : "DEMONSTRATION";
}

export async function runAnalysisPipeline(
  projectId: string,
  jobId: string,
  brandCrawl: CrawlResult | null,
  competitorCrawls: Map<string, CrawlResult>,
  brandVideos: YouTubeVideo[],
  competitorVideos: Map<string, YouTubeVideo[]>
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brand: true, competitors: true },
  });
  if (!project) throw new Error("Project not found");

  const stepName = "AI Analysis";
  updateJob(jobId, () => jobManager.startStep(jobId, stepName));

  // Step 1: Brand analysis
  updateJob(jobId, () => jobManager.updateStepProgress(jobId, stepName, 10, "Analyzing brand attributes..."));
  if (brandCrawl && project.brand) {
    try {
      const prompt = buildBrandAnalysisPrompt(project.brandName, brandCrawl);
      const analysis = await analyzeWithClaude({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        responseSchema: brandAnalysisSchema,
      });

      await prisma.brand.update({
        where: { id: project.brand.id },
        data: {
          brandPromise: analysis.brandPromise,
          valueProposition: analysis.valueProposition,
          toneOfVoice: analysis.toneOfVoice,
          targetAudience: analysis.targetAudience,
          pricingTheme: analysis.pricingTheme,
          productFeatures: analysis.productFeatures,
          ctaLanguage: analysis.ctaLanguage,
          socialProof: analysis.socialProof,
          dataSource: "AI_INFERRED",
          rawCrawlData: brandCrawl satisfies object as object,
        },
      });
    } catch (err) {
      console.error("Brand analysis failed:", err);
    }
  }

  // Step 2: Competitor analysis
  updateJob(jobId, () => jobManager.updateStepProgress(jobId, stepName, 25, "Analyzing competitors..."));
  for (const comp of project.competitors) {
    const crawl = competitorCrawls.get(comp.id);
    if (!crawl) continue;
    try {
      const prompt = buildCompetitorIntelPrompt(
        project.brandName,
        brandCrawl,
        comp.name,
        crawl
      );
      const analysis = await analyzeWithClaude({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        responseSchema: competitorSchema,
      });

      await prisma.competitor.update({
        where: { id: comp.id },
        data: {
          brandPromise: analysis.brandPromise,
          valueProposition: analysis.valueProposition,
          toneOfVoice: analysis.toneOfVoice,
          pricingTheme: analysis.pricingTheme,
          productFeatures: analysis.productFeatures,
          ctaLanguage: analysis.ctaLanguage,
          strengths: analysis.strengths,
          weaknesses: analysis.weaknesses,
          rawCrawlData: crawl satisfies object as object,
          dataSource: "AI_INFERRED",
        },
      });

      // Store opportunities as insights
      for (const opp of analysis.opportunities) {
        await prisma.insight.create({
          data: {
            projectId,
            category: "gap",
            title: `Opportunity vs ${comp.name}`,
            description: opp,
            importance: 70,
            dataSource: "AI_INFERRED",
          },
        });
      }
    } catch (err) {
      console.error(`Competitor analysis failed for ${comp.name}:`, err);
    }
  }

  // Step 3: Content scoring
  updateJob(jobId, () => jobManager.updateStepProgress(jobId, stepName, 45, "Scoring content assets..."));
  const allVideos = [...brandVideos];
  const videoCompetitorMap = new Map<string, string | null>();
  brandVideos.forEach((v) => videoCompetitorMap.set(v.videoId, null));

  for (const [compId, videos] of competitorVideos) {
    allVideos.push(...videos);
    videos.forEach((v) => videoCompetitorMap.set(v.videoId, compId));
  }

  if (allVideos.length > 0) {
    try {
      const prompt = buildContentScoringPrompt(project.brandName, allVideos);
      const result = await analyzeWithClaude({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        responseSchema: contentScoreSchema,
        maxTokens: 8192,
      });

      for (const score of result.scores) {
        const video = allVideos.find((v) => v.videoId === score.videoId);
        if (!video) continue;

        await prisma.contentAsset.create({
          data: {
            projectId,
            competitorId: videoCompetitorMap.get(score.videoId) || null,
            type: "YOUTUBE_VIDEO",
            title: video.title,
            url: `https://youtube.com/watch?v=${video.videoId}`,
            thumbnailUrl: video.thumbnailUrl,
            description: video.description,
            publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
            platform: "YouTube",
            viewCount: video.viewCount,
            likeCount: video.likeCount,
            commentCount: video.commentCount,
            engagementRate:
              video.viewCount > 0
                ? ((video.likeCount + video.commentCount) / video.viewCount) * 100
                : 0,
            metricsSource: "OFFICIAL_API",
            overallScore: score.overallScore,
            hookStrength: score.hookStrength,
            productVisibility: score.productVisibility,
            storytellingArc: score.storytellingArc,
            ctaQuality: score.ctaQuality,
            emotionalAppeal: score.emotionalAppeal,
            pacing: score.pacing,
            hookText: score.hookText,
            narrativeType: validNarrativeType(score.narrativeType),
            keyMessages: score.keyMessages,
            isBrandOwned: !videoCompetitorMap.get(score.videoId),
            dataSource: "OFFICIAL_API",
          },
        });
      }
    } catch (err) {
      console.error("Content scoring failed:", err);
    }
  }

  // Step 4: Pattern mining
  updateJob(jobId, () => jobManager.updateStepProgress(jobId, stepName, 70, "Mining narrative patterns..."));
  const scoredAssets = await prisma.contentAsset.findMany({
    where: { projectId },
    orderBy: { overallScore: "desc" },
  });

  if (scoredAssets.length > 0) {
    try {
      const prompt = buildPatternMiningPrompt(
        project.brandName,
        scoredAssets.map((a) => ({
          title: a.title,
          narrativeType: a.narrativeType || "DEMONSTRATION",
          overallScore: a.overallScore || 0,
          hookText: a.hookText || "",
          keyMessages: (a.keyMessages as string[]) || [],
        }))
      );
      const result = await analyzeWithClaude({
        systemPrompt: prompt.system,
        userPrompt: prompt.user,
        responseSchema: patternSchema,
        maxTokens: 4096,
      });

      // Save patterns
      for (const pattern of result.patterns) {
        await prisma.narrativePattern.upsert({
          where: {
            projectId_type: {
              projectId,
              type: validNarrativeType(pattern.type),
            },
          },
          create: {
            projectId,
            type: validNarrativeType(pattern.type),
            name: pattern.name,
            description: pattern.description,
            frequency: pattern.frequency,
            avgPerformance: pattern.avgPerformance,
            bestPractices: pattern.bestPractices,
          },
          update: {
            name: pattern.name,
            description: pattern.description,
            frequency: pattern.frequency,
            avgPerformance: pattern.avgPerformance,
            bestPractices: pattern.bestPractices,
          },
        });
      }

      // Save selling points
      for (const sp of result.sellingPoints) {
        await prisma.sellingPoint.create({
          data: {
            projectId,
            point: sp.point,
            category: sp.category,
            strength: sp.strength,
            frequency: sp.frequency,
            uniqueness: sp.uniqueness,
          },
        });
      }

      // Update project with computed scores and signals
      const avgScore =
        scoredAssets.reduce((sum, a) => sum + (a.overallScore || 0), 0) /
        scoredAssets.length;

      await prisma.project.update({
        where: { id: projectId },
        data: {
          brandHealthScore: Math.round(avgScore),
          opportunityScore: Math.round(
            result.sellingPoints.reduce((s, p) => s + (p.uniqueness || 0), 0) /
              Math.max(result.sellingPoints.length, 1)
          ),
          topSignals: result.topSignals,
        },
      });
    } catch (err) {
      console.error("Pattern mining failed:", err);
    }
  }

  updateJob(jobId, () => jobManager.updateStepProgress(jobId, stepName, 100, "Analysis complete"));
  updateJob(jobId, () => jobManager.completeStep(jobId, stepName));
}
