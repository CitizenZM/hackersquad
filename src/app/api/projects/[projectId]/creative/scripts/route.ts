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
  hookVariants: z.array(z.string()),
  body: z.string(),
  ctaVariants: z.array(z.string()),
  narrativeType: z.string(),
  targetEmotion: z.string(),
  predictedScore: z.number(),
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
  const body = await request.json();
  const { angle } = body;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sellingPoints = await prisma.sellingPoint.findMany({
      where: { projectId },
      orderBy: { strength: "desc" },
      take: 5,
    });

    const prompt = buildScriptWritingPrompt({
      brandName: project.brandName,
      angle,
      sellingPoints: sellingPoints.map((sp) => sp.point),
      campaignGoal: project.campaignGoal || undefined,
    });

    const result = await analyzeWithClaude({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      responseSchema: scriptSchema,
      maxTokens: 4096,
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
        hookVariants: result.hookVariants,
        body: result.body,
        ctaVariants: result.ctaVariants,
        narrativeType,
        targetEmotion: result.targetEmotion,
        predictedScore: result.predictedScore,
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
