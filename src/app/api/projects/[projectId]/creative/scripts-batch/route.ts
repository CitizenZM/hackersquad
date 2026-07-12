import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildScriptWritingPrompt } from "@/services/ai/prompts/script-writing";
import { NarrativeType } from "@/generated/prisma/enums";

export const maxDuration = 60;

const scriptSchema = z.object({
  title: z.string(),
  angle: z.string(),
  format: z.string(),
  duration: z.string(),
  hookVariants: z.array(z.string()),
  body: z.string(),
  ctaVariants: z.array(z.string()),
  narrativeType: z.string(),
  targetEmotion: z.string(),
  predictedScore: z.number(),
  platformTechniques: z.array(z.string()).optional().default([]),
});

const validTypes: NarrativeType[] = [
  "PROBLEM_SOLUTION", "TESTIMONIAL", "DEMONSTRATION", "LIFESTYLE",
  "EDUCATIONAL", "COMPARISON", "STORY_ARC", "UGC_STYLE",
  "TREND_RIDING", "BEFORE_AFTER",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const { angles } = body as {
    angles: Array<{
      title: string;
      description: string;
      targetEmotion: string;
      narrativeType: string;
    }>;
  };

  if (!angles || !Array.isArray(angles) || angles.length === 0) {
    return NextResponse.json({ error: "angles array required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [sellingPoints, campaignSel, deepAnal] = await Promise.all([
      prisma.sellingPoint.findMany({
        where: { projectId },
        orderBy: { strength: "desc" },
        take: 5,
      }),
      prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
      prisma.deepAnalysis.findUnique({ where: { projectId } }).catch(() => null),
    ]);
    const spStrings = sellingPoints.map((sp) => sp.point);
    const platformId = (campaignSel?.platform as string | null) || undefined;

    // Close the loop with research: surface DeepAnalysis.platformInsights as a
    // lightweight "what's working in this niche" summary, truncated to ~1500 chars.
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

    // Generate scripts for all angles in parallel
    const scriptPromises = angles.slice(0, 3).map(async (angle) => {
      try {
        const prompt = buildScriptWritingPrompt({
          brandName: project.brandName,
          angle,
          sellingPoints: spStrings,
          campaignGoal: project.campaignGoal || undefined,
          platform: platformId,
          platformId,
          nicheResearch,
        });

        const result = await analyzeWithClaude({
          systemPrompt: prompt.system,
          userPrompt: prompt.user,
          responseSchema: scriptSchema,
          maxTokens: 4096,
        });

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
            hookVariants: result.hookVariants,
            body: result.body,
            ctaVariants: result.ctaVariants,
            narrativeType,
            targetEmotion: result.targetEmotion,
            predictedScore: result.predictedScore,
            platformTechniques: result.platformTechniques as never,
          },
        });
        return script;
      } catch (err) {
        console.error("Script generation failed for angle:", angle.title, err);
        return null;
      }
    });

    const scripts = (await Promise.all(scriptPromises)).filter((s) => s !== null);
    return NextResponse.json({ scripts });
  } catch (err) {
    console.error("Scripts batch failed:", err);
    return NextResponse.json({ error: "Failed to generate scripts" }, { status: 500 });
  }
}
