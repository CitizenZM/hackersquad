import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "./claude-client";
import { buildBrandAnalysisPrompt } from "./prompts/brand-analysis";
import { buildContentScoringPrompt } from "./prompts/content-scoring";
import { buildPatternMiningPrompt } from "./prompts/pattern-mining";
import { buildCompetitorIntelPrompt } from "./prompts/competitor-intel";
import { buildAudienceResearchPrompt } from "./prompts/audience-research";
import { buildDeepAnalysisPrompt } from "./prompts/deep-analysis";
import type { CrawlResult } from "@/services/research/website-crawler";
import type { YouTubeVideo } from "@/services/research/youtube-service";
import type { VideoResult } from "@/services/research/video-search";
import { NarrativeType, ContentType } from "@/generated/prisma/enums";

const brandAnalysisSchema = z.object({
  productCategory: z.string().optional(),
  productDescription: z.string().optional(),
  brandPromise: z.string(),
  valueProposition: z.string(),
  toneOfVoice: z.string(),
  targetAudience: z.string(),
  pricingTheme: z.string(),
  productFeatures: z.array(z.string()),
  ctaLanguage: z.array(z.string()),
  socialProof: z.array(z.string()),
  useEnvironments: z.array(z.object({
    name: z.string(),
    description: z.string(),
    imagePrompt: z.string(),
    typicalUser: z.string(),
  })).optional(),
  actorSettings: z.array(z.object({
    role: z.string(),
    ageRange: z.string(),
    scenario: z.string(),
    visualDescription: z.string(),
    painPoint: z.string(),
    productInteraction: z.string(),
  })).optional(),
  displayGuidelines: z.array(z.object({
    rule: z.string(),
    example: z.string(),
    antiExample: z.string(),
  })).optional(),
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
        // Pass product page context as primary source of truth
        const productContext = {
          productUrl: project.productUrl || undefined,
          productName: project.productName || undefined,
          productPageTitle: project.productPageTitle || undefined,
          productPageText: project.productPageText || undefined,
          productPageImages: (project.productPageImages as { url: string; alt: string }[] | null) || undefined,
        };
        const p = buildBrandAnalysisPrompt(project.brandName, brandCrawl!, productContext);
        const a = await analyzeWithClaude({ systemPrompt: p.system, userPrompt: p.user, responseSchema: brandAnalysisSchema });
        await prisma.brand.update({ where: { id: project.brand!.id }, data: {
          brandPromise: a.brandPromise, valueProposition: a.valueProposition,
          toneOfVoice: a.toneOfVoice, targetAudience: a.targetAudience,
          pricingTheme: a.pricingTheme, productFeatures: a.productFeatures,
          ctaLanguage: a.ctaLanguage, socialProof: a.socialProof,
          productCategory: a.productCategory,
          productDescription: a.productDescription,
          useEnvironments: a.useEnvironments as never,
          actorSettings: a.actorSettings as never,
          displayGuidelines: a.displayGuidelines as never,
          dataSource: "AI_INFERRED", rawCrawlData: brandCrawl satisfies object as object,
        }});

        // Generate 3-5 strategic insights grounded in the brand analysis so
        // Insight table is never empty even when competitor crawls fail.
        try {
          const insightSchema = z.object({
            insights: z.array(z.object({
              category: z.string(),
              title: z.string(),
              description: z.string(),
              importance: z.number(),
              recommendation: z.string(),
            })).min(3),
          });
          const sys = `You are a creative strategist. Given a brand's analyzed positioning, produce 3-5 actionable strategic insights for ad creative. Each insight must be SPECIFIC to this brand (reference real features/audience/promise). No generic marketing platitudes.

Respond with ONLY JSON:
{"insights":[{"category":"positioning|audience|messaging|differentiation|opportunity","title":"...","description":"why this matters (2-3 sentences with specifics)","importance":1-100,"recommendation":"concrete next-step for ad creative (1 sentence)"}]}`;
          const usr = `Brand: ${project.brandName}
Promise: ${a.brandPromise}
Value prop: ${a.valueProposition}
Tone: ${a.toneOfVoice}
Target audience: ${a.targetAudience}
Pricing theme: ${a.pricingTheme}
Top features: ${(a.productFeatures || []).slice(0, 6).join(", ")}
CTAs on site: ${(a.ctaLanguage || []).slice(0, 6).join(", ")}
Social proof: ${(a.socialProof || []).slice(0, 4).join(" / ")}`;
          const ai = await analyzeWithClaude({ systemPrompt: sys, userPrompt: usr, responseSchema: insightSchema, maxTokens: 1500 });
          for (const ins of ai.insights) {
            await prisma.insight.create({ data: {
              projectId, category: ins.category, title: ins.title,
              description: ins.description, importance: ins.importance,
              recommendation: ins.recommendation, dataSource: "AI_INFERRED",
            }}).catch(() => {});
          }
        } catch (e) { console.error("Strategic-insight generation failed:", e); }
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

          await prisma.contentAsset.upsert({
            where: { projectId_url: { projectId, url: videoUrl } },
            create: {
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
            },
            update: {
              title: video.title, thumbnailUrl: video.thumbnailUrl, description: video.description,
              viewCount: video.viewCount, likeCount: video.likeCount, commentCount: video.commentCount,
              overallScore: score.overallScore, hookStrength: score.hookStrength,
              productVisibility: score.productVisibility, storytellingArc: score.storytellingArc,
              ctaQuality: score.ctaQuality, emotionalAppeal: score.emotionalAppeal, pacing: score.pacing,
              hookText: score.hookText, narrativeType: validNarrativeType(score.narrativeType),
              keyMessages: score.keyMessages, contentCategory: score.contentCategory || null,
            },
          });
        }
      } catch (e) { console.error("Content scoring failed:", e); }
    })());
  }

  await Promise.all(tasks);

  // Pattern mining + Audience research — run BOTH in parallel
  const scoredAssets = await prisma.contentAsset.findMany({ where: { projectId }, orderBy: { overallScore: "desc" } });

  const postTasks: Promise<void>[] = [];

  // Pattern mining
  if (scoredAssets.length > 0) {
    postTasks.push((async () => {
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
    })());
  }

  // Audience research (parallel with pattern mining)
  postTasks.push((async () => {
    try {
      const brand = await prisma.brand.findUnique({ where: { projectId } });
      const updatedProject = await prisma.project.findUnique({ where: { id: projectId } });

      const audienceSchema = z.object({
        segments: z.array(z.object({ name: z.string(), ageRange: z.string(), description: z.string(), size: z.string() })),
        psychographics: z.array(z.object({ trait: z.string(), description: z.string() })),
        painPoints: z.array(z.object({ point: z.string(), severity: z.string() })),
        interests: z.array(z.string()),
        platforms: z.array(z.object({ platform: z.string(), usage: z.string(), adReceptivity: z.string() })),
        buyingBehavior: z.string(),
        incomeLevel: z.string(),
        geoMarkets: z.array(z.string()),
      });

      const topContent = scoredAssets.slice(0, 5).map((a) => ({
        title: a.title, viewCount: a.viewCount || 0, narrativeType: a.narrativeType || "DEMONSTRATION",
      }));

      const prompt = buildAudienceResearchPrompt({
        brandName: project.brandName,
        brandPromise: brand?.brandPromise || undefined,
        valueProposition: brand?.valueProposition || undefined,
        targetAudience: brand?.targetAudience || undefined,
        toneOfVoice: brand?.toneOfVoice || undefined,
        pricingTheme: brand?.pricingTheme || undefined,
        productFeatures: (brand?.productFeatures as string[]) || undefined,
        category: updatedProject?.category || undefined,
      topSignals: (updatedProject?.topSignals as string[]) || undefined,
      topContent,
    });

    const audience = await analyzeWithClaude({
      systemPrompt: prompt.system, userPrompt: prompt.user,
      responseSchema: audienceSchema, maxTokens: 2048,
    });

    await prisma.audienceProfile.upsert({
      where: { projectId },
      create: { projectId, ...audience, dataSource: "AI_INFERRED" },
      update: { ...audience },
    });
    } catch (e) { console.error("Audience research failed:", e); }
  })());

  // Deep analysis (runs in parallel with pattern mining + audience)
  if (scoredAssets.length > 0) {
    postTasks.push((async () => {
      try {
        const strOpt = z.string().optional().default("");
        const numOpt = z.coerce.number().optional().default(0);
        const arrStr = z.array(z.string()).optional().default([]);
        const deepSchema = z.object({
          videoStructure: z.object({
            openingPatterns: z.array(z.object({ pattern: strOpt, frequency: numOpt, effectiveness: strOpt, example: strOpt })).optional().default([]),
            hookDurationRange: strOpt,
            productRevealTiming: strOpt,
            averageLength: strOpt,
            structuralInsights: arrStr,
          }).optional(),
          vibeAnalysis: z.object({
            dominantTones: z.array(z.object({ tone: strOpt, frequency: numOpt, avgScore: numOpt, example: strOpt })).optional().default([]),
            emotionalTriggers: z.array(z.object({ trigger: strOpt, usage: strOpt, examples: arrStr })).optional().default([]),
            visualStyleNotes: strOpt,
            pacingProfile: strOpt,
            vibeInsights: arrStr,
          }).optional(),
          ctaAnalysis: z.object({
            commonCTAs: z.array(z.object({ cta: strOpt, frequency: numOpt, type: strOpt, effectiveness: strOpt })).optional().default([]),
            placement: strOpt,
            urgencyLevel: strOpt,
            conversionDrivers: arrStr,
            ctaInsights: arrStr,
          }).optional(),
          sellingPointDeep: z.object({
            topPerformers: z.array(z.object({ point: strOpt, whyItWorks: strOpt, bestPlatforms: arrStr, exampleContent: strOpt })).optional().default([]),
            underutilized: z.array(z.object({ point: strOpt, opportunity: strOpt })).optional().default([]),
            messagingInsights: arrStr,
          }).optional(),
          competitiveGaps: z.array(z.object({ gap: strOpt, recommendation: strOpt, priority: strOpt })).optional().default([]),
          recommendations: z.array(z.object({ title: strOpt, description: strOpt, impact: strOpt, effort: strOpt, category: strOpt })).optional().default([]),
          environmentAnalysis: z.array(z.object({
            environment: z.string().optional().default(""),
            frequency: z.coerce.number().optional().default(1),
            description: z.string().optional().default(""),
            lightingNotes: z.string().optional().default(""),
            bestFor: z.string().optional().default(""),
            examples: z.array(z.string()).optional().default([]),
          })).optional().default([]),
          cameraAngles: z.array(z.object({
            shot: z.string().optional().default(""),
            movement: z.string().optional().default(""),
            frequency: z.coerce.number().optional().default(1),
            whenToUse: z.string().optional().default(""),
            adEffect: z.string().optional().default(""),
            apertureSuggestion: z.string().optional().default(""),
            examples: z.array(z.string()).optional().default([]),
          })).optional().default([]),
          hookFormulas: z.array(z.object({
            type: z.string().optional().default(""),
            formula: z.string().optional().default(""),
            openingLine: z.string().optional().default(""),
            visualDescription: z.string().optional().default(""),
            why: z.string().optional().default(""),
            platformFit: z.array(z.string()).optional().default([]),
            scoreImpact: z.string().optional().default("medium"),
            examples: z.array(z.string()).optional().default([]),
          })).optional().default([]),
          platformInsights: z.array(z.object({
            platform: z.string().optional().default(""),
            contentStyle: z.string().optional().default(""),
            topFormats: z.array(z.string()).optional().default([]),
            avgEngagement: z.string().optional().default(""),
            bestPractices: z.array(z.string()).optional().default([]),
            avoidPatterns: z.array(z.string()).optional().default([]),
          })).optional().default([]),
          sellingPointVisuals: z.array(z.object({
            point: z.string().optional().default(""),
            visualTreatment: z.string().optional().default(""),
            screenTime: z.string().optional().default(""),
            placement: z.string().optional().default(""),
            cameraRecommendation: z.string().optional().default(""),
            examples: z.array(z.string()).optional().default([]),
          })).optional().default([]),
          videoTimeline: z.object({
            recommendedDurationSec: z.coerce.number().optional().default(30),
            platform: z.string().optional().default(""),
            segments: z.array(z.object({
              segment: z.string().optional().default(""),
              startSec: z.coerce.number().optional().default(0),
              endSec: z.coerce.number().optional().default(0),
              label: z.string().optional().default(""),
              description: z.string().optional().default(""),
              cameraNote: z.string().optional().default(""),
              voiceover: z.string().optional().default(""),
              purpose: z.string().optional().default(""),
            })).optional().default([]),
            rationale: z.string().optional().default(""),
          }).optional(),
        });

        const [updatedProject, campaignSel, audienceData] = await Promise.all([
          prisma.project.findUnique({ where: { id: projectId } }),
          prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
          prisma.audienceProfile.findUnique({ where: { projectId } }).catch(() => null),
        ]);
        const prompt = buildDeepAnalysisPrompt({
          brandName: project.brandName,
          category: updatedProject?.category || undefined,
          productDescription: project.productPageText?.slice(0, 400) || undefined,
          productName: project.productPageTitle || project.productName || undefined,
          campaignGoal: project.campaignGoal || undefined,
          selectedEnvironment: (campaignSel?.selectedEnvironment as string | null) || undefined,
          selectedActorRole: (campaignSel?.selectedActorRole as string | null) || undefined,
          selectedSellingPoints:
            (campaignSel?.selectedSellingPoints as { point: string }[] | null)?.map((s) => s.point) || undefined,
          audienceSummary: audienceData
            ? `${(audienceData.segments as { name: string }[] | null)?.[0]?.name || ""}, pain points: ${(audienceData.painPoints as { point: string }[] | null)?.slice(0, 3).map((p) => p.point).join(", ") || ""}`
            : undefined,
          topContent: scoredAssets.slice(0, 8).map((a) => ({
            title: a.title,
            platform: a.platform || "YouTube",
            narrativeType: a.narrativeType || "DEMONSTRATION",
            overallScore: a.overallScore || 0,
            hookStrength: a.hookStrength || 0,
            ctaQuality: a.ctaQuality || 0,
            emotionalAppeal: a.emotionalAppeal || 0,
            pacing: a.pacing || 0,
            storytellingArc: a.storytellingArc || 0,
            hookText: a.hookText || "",
            keyMessages: (a.keyMessages as string[]) || [],
            viewCount: a.viewCount || 0,
            contentCategory: a.contentCategory,
            url: a.url || undefined,
            thumbnailUrl: a.thumbnailUrl || undefined,
          })),
        });

        const deep = await analyzeWithClaude({
          systemPrompt: prompt.system,
          userPrompt: prompt.user,
          responseSchema: deepSchema,
          maxTokens: 4096,
        });

        await prisma.deepAnalysis.upsert({
          where: { projectId },
          create: {
            projectId, ...deep, dataSource: "AI_INFERRED",
            environmentAnalysis: deep.environmentAnalysis as never,
            cameraAngles: deep.cameraAngles as never,
            hookFormulas: deep.hookFormulas as never,
            platformInsights: deep.platformInsights as never,
            sellingPointVisuals: deep.sellingPointVisuals as never,
            videoTimeline: deep.videoTimeline as never,
          },
          update: {
            ...deep,
            environmentAnalysis: deep.environmentAnalysis as never,
            cameraAngles: deep.cameraAngles as never,
            hookFormulas: deep.hookFormulas as never,
            platformInsights: deep.platformInsights as never,
            sellingPointVisuals: deep.sellingPointVisuals as never,
            videoTimeline: deep.videoTimeline as never,
          },
        });
      } catch (e) { console.error("Deep analysis failed:", e); }
    })());
  }

  await Promise.all(postTasks);
}
