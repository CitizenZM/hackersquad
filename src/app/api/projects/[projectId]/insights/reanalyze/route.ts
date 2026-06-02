import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildDeepAnalysisPrompt } from "@/services/ai/prompts/deep-analysis";
import { z } from "zod";

export const maxDuration = 60;

const deepSchema = z.object({
  videoStructure: z.object({
    openingPatterns: z.array(z.object({
      pattern: z.string(),
      frequency: z.number(),
      effectiveness: z.string(),
      example: z.string(),
    })).optional().default([]),
    hookDurationRange: z.string().optional().default(""),
    productRevealTiming: z.string().optional().default(""),
    averageLength: z.string().optional().default(""),
    structuralInsights: z.array(z.string()).optional().default([]),
  }).optional(),
  vibeAnalysis: z.object({
    dominantTones: z.array(z.object({
      tone: z.string(),
      frequency: z.number(),
      avgScore: z.number(),
      example: z.string(),
    })).optional().default([]),
    emotionalTriggers: z.array(z.object({
      trigger: z.string(),
      usage: z.string(),
      examples: z.array(z.string()),
    })).optional().default([]),
    visualStyleNotes: z.string().optional().default(""),
    pacingProfile: z.string().optional().default(""),
    vibeInsights: z.array(z.string()).optional().default([]),
  }).optional(),
  ctaAnalysis: z.object({
    commonCTAs: z.array(z.object({
      cta: z.string(),
      frequency: z.number(),
      type: z.string(),
      effectiveness: z.string(),
    })).optional().default([]),
    placement: z.string().optional().default(""),
    urgencyLevel: z.string().optional().default(""),
    conversionDrivers: z.array(z.string()).optional().default([]),
    ctaInsights: z.array(z.string()).optional().default([]),
  }).optional(),
  sellingPointDeep: z.object({
    topPerformers: z.array(z.object({
      point: z.string(),
      whyItWorks: z.string(),
      bestPlatforms: z.array(z.string()),
      exampleContent: z.string(),
    })).optional().default([]),
    underutilized: z.array(z.object({
      point: z.string(),
      opportunity: z.string(),
    })).optional().default([]),
    messagingInsights: z.array(z.string()).optional().default([]),
  }).optional(),
  competitiveGaps: z.array(z.object({
    gap: z.string(),
    recommendation: z.string(),
    priority: z.string(),
  })).optional().default([]),
  recommendations: z.array(z.object({
    title: z.string(),
    description: z.string(),
    impact: z.string(),
    effort: z.string(),
    category: z.string(),
  })).optional().default([]),
  environmentAnalysis: z.array(z.object({
    environment: z.string(),
    frequency: z.number(),
    description: z.string(),
    lightingNotes: z.string().optional().default(""),
    bestFor: z.string().optional().default(""),
    examples: z.array(z.string()).optional().default([]),
  })).optional().default([]),
  cameraAngles: z.array(z.object({
    shot: z.string(),
    movement: z.string().optional().default(""),
    frequency: z.number(),
    whenToUse: z.string().optional().default(""),
    adEffect: z.string().optional().default(""),
    apertureSuggestion: z.string().optional().default(""),
    examples: z.array(z.string()).optional().default([]),
  })).optional().default([]),
  hookFormulas: z.array(z.object({
    type: z.string(),
    formula: z.string(),
    openingLine: z.string().optional().default(""),
    visualDescription: z.string().optional().default(""),
    why: z.string().optional().default(""),
    platformFit: z.array(z.string()).optional().default([]),
    scoreImpact: z.string().optional().default("medium"),
    examples: z.array(z.string()).optional().default([]),
  })).optional().default([]),
  platformInsights: z.array(z.object({
    platform: z.string(),
    contentStyle: z.string().optional().default(""),
    topFormats: z.array(z.string()).optional().default([]),
    avgEngagement: z.string().optional().default(""),
    bestPractices: z.array(z.string()).optional().default([]),
    avoidPatterns: z.array(z.string()).optional().default([]),
  })).optional().default([]),
  sellingPointVisuals: z.array(z.object({
    point: z.string(),
    visualTreatment: z.string().optional().default(""),
    screenTime: z.string().optional().default(""),
    placement: z.string().optional().default(""),
    cameraRecommendation: z.string().optional().default(""),
    examples: z.array(z.string()).optional().default([]),
  })).optional().default([]),
});

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  try {
    // Only process content that has already been scored
    const assets = await prisma.contentAsset.findMany({
      where: { projectId, overallScore: { not: null } },
      orderBy: { overallScore: "desc" },
      take: 12,
    });

    if (assets.length === 0) {
      return NextResponse.json(
        { error: "No scored content yet. Run research first." },
        { status: 400 }
      );
    }

    const [project, campaignSel, audienceData] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId } }),
      prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
      prisma.audienceProfile.findUnique({ where: { projectId } }).catch(() => null),
    ]);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const prompt = buildDeepAnalysisPrompt({
      brandName: project.brandName,
      category: project.category || undefined,
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
      topContent: assets.slice(0, 8).map((a) => ({
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
      create: { projectId, ...deep, dataSource: "AI_INFERRED" },
      update: { ...deep },
    });

    return NextResponse.json({ ok: true, assetsAnalyzed: assets.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
