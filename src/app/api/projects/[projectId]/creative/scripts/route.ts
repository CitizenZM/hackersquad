import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildScriptWritingPrompt } from "@/services/ai/prompts/script-writing";
import { NarrativeType } from "@/generated/prisma/enums";

const scriptSchema = z.object({
  title: z.string(),
  angle: z.string(),
  format: z.string(),
  duration: z.string(),
  platform: z.string().optional().default(""),
  totalDurationSec: z.coerce.number().optional().default(30),
  hookVariants: z.array(z.string()),
  body: z.string(),
  ctaVariants: z.array(z.string()),
  narrativeType: z.string(),
  targetEmotion: z.string(),
  predictedScore: z.number(),
  platformTechniques: z.array(z.string()).optional().default([]),
  scenes: z.array(z.object({
    sceneNumber: z.coerce.number().optional().default(1),
    startSec: z.coerce.number().optional().default(0),
    endSec: z.coerce.number().optional().default(5),
    segmentLabel: z.string().optional().default(""),
    shotType: z.string().optional().default(""),
    focalLength: z.string().optional().default(""),
    cameraMovement: z.string().optional().default(""),
    aperture: z.string().optional().default(""),
    location: z.string().optional().default(""),
    lighting: z.string().optional().default(""),
    actorAction: z.string().optional().default(""),
    productAction: z.string().optional().default(""),
    voiceover: z.string().optional().default(""),
    textOverlay: z.string().optional().default(""),
    transition: z.string().optional().default(""),
  })).optional().default([]),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const scripts = await prisma.script.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(scripts);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const { angle } = body;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [sellingPoints, campaignSel, deepAnal, audienceData] = await Promise.all([
      prisma.sellingPoint.findMany({
        where: { projectId },
        orderBy: { strength: "desc" },
        take: 5,
      }),
      prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
      prisma.deepAnalysis.findUnique({ where: { projectId } }).catch(() => null),
      prisma.audienceProfile.findUnique({ where: { projectId } }).catch(() => null),
    ]);

    const platformId = (campaignSel?.platform as string | null) || undefined;

    // Close the loop with research: surface DeepAnalysis.platformInsights (+ top patterns)
    // as a "what's working in this niche" summary, truncated to stay lightweight.
    let nicheResearch: string | undefined;
    if (deepAnal?.platformInsights) {
      const insights = deepAnal.platformInsights as Array<{
        platform: string;
        contentStyle?: string;
        bestPractices?: string[];
        avoidPatterns?: string[];
      }>;
      const relevant = platformId
        ? insights.filter((i) => i.platform?.toLowerCase() === platformId.toLowerCase())
        : insights;
      const chosen = (relevant.length ? relevant : insights).slice(0, 2);
      const lines: string[] = [];
      for (const i of chosen) {
        if (i.contentStyle) lines.push(`[${i.platform}] ${i.contentStyle}`);
        if (i.bestPractices?.length) lines.push(`Best practices: ${i.bestPractices.slice(0, 3).join("; ")}`);
        if (i.avoidPatterns?.length) lines.push(`Avoid: ${i.avoidPatterns.slice(0, 2).join("; ")}`);
      }
      if (lines.length) nicheResearch = lines.join("\n").slice(0, 1500);
    }

    const prompt = buildScriptWritingPrompt({
      brandName: project.brandName,
      productName: project.productPageTitle || project.productName || undefined,
      productDescription: project.productPageText?.slice(0, 500) || undefined,
      angle,
      sellingPoints: sellingPoints.map((sp) => sp.point),
      campaignGoal: project.campaignGoal || undefined,
      platform: platformId,
      platformId,
      totalDurationSec: (campaignSel?.totalDurationSec as number | null) || 30,
      selectedEnvironment: (campaignSel?.selectedEnvironment as string | null) || undefined,
      selectedActorRole: (campaignSel?.selectedActorRole as string | null) || undefined,
      selectedActorDesc: (campaignSel?.selectedActorDesc as string | null) || undefined,
      videoTimeline: (campaignSel?.videoTimeline as Array<{segment:string;startSec:number;endSec:number;label:string;description:string}> | null) || undefined,
      hookFormulas: (deepAnal?.hookFormulas as Array<{type:string;formula:string;openingLine:string;visualDescription:string}> | null)?.slice(0, 3) || undefined,
      cameraAngles: (deepAnal?.cameraAngles as Array<{shot:string;movement:string;whenToUse:string}> | null)?.slice(0, 5) || undefined,
      briefing: project.briefingText || undefined,
      audienceSummary: audienceData
        ? `Audience: ${(audienceData.segments as {name:string}[] | null)?.[0]?.name || "general"}, pain: ${(audienceData.painPoints as string[] | null)?.slice(0, 2).join(", ") || ""}`
        : undefined,
      nicheResearch,
    });

    const result = await analyzeWithClaude({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      responseSchema: scriptSchema,
      maxTokens: 6000,
    });

    const validTypes: NarrativeType[] = [
      "PROBLEM_SOLUTION", "TESTIMONIAL", "DEMONSTRATION", "LIFESTYLE",
      "EDUCATIONAL", "COMPARISON", "STORY_ARC", "UGC_STYLE",
      "TREND_RIDING", "BEFORE_AFTER",
    ];
    const narrativeType = validTypes.includes(result.narrativeType as NarrativeType)
      ? (result.narrativeType as NarrativeType)
      : "DEMONSTRATION";

    const script = await prisma.script.create({
      data: {
        projectId,
        title: result.title,
        angle: result.angle,
        format: result.format,
        duration: result.duration,
        platform: result.platform || undefined,
        totalDurationSec: result.totalDurationSec || 30,
        hookVariants: result.hookVariants,
        body: result.body,
        ctaVariants: result.ctaVariants,
        narrativeType,
        targetEmotion: result.targetEmotion,
        predictedScore: result.predictedScore,
        scenes: result.scenes as never,
        platformTechniques: result.platformTechniques as never,
      },
    });

    return NextResponse.json(script);
  } catch (err) {
    console.error("Script generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate script" },
      { status: 500 }
    );
  }
}
