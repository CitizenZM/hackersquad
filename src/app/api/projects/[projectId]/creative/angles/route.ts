import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildAngleGenerationPrompt } from "@/services/ai/prompts/angle-generation";

const anglesSchema = z.object({
  angles: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      description: z.string(),
      targetEmotion: z.string(),
      narrativeType: z.string(),
      predictedScore: z.number(),
      rationale: z.string(),
      targetAudience: z.string(),
      platform: z.string(),
    })
  ),
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { brand: true },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const sellingPoints = await prisma.sellingPoint.findMany({
      where: { projectId },
      orderBy: { strength: "desc" },
      take: 10,
    });

    const patterns = await prisma.narrativePattern.findMany({
      where: { projectId },
      orderBy: { avgPerformance: "desc" },
    });

    // Get audience data
    const audience = await prisma.audienceProfile.findUnique({ where: { projectId } });
    const segments = (audience?.segments as { name: string; ageRange: string; description: string }[]) || [];
    const painPoints = (audience?.painPoints as { point: string }[]) || [];
    const platforms = (audience?.platforms as { platform: string; adReceptivity: string }[]) || [];

    const prompt = buildAngleGenerationPrompt({
      brandName: project.brandName,
      category: project.category || undefined,
      campaignGoal: project.campaignGoal || undefined,
      brandPromise: project.brand?.brandPromise || undefined,
      valueProposition: project.brand?.valueProposition || undefined,
      topSellingPoints: sellingPoints.map((sp) => `${sp.point} (${sp.category})`),
      topPatterns: patterns.map((p) => `${p.name}: ${p.description.slice(0, 100)}`),
      topSignals: (project.topSignals as string[]) || [],
      audienceSegments: segments.map((s) => `${s.name} (${s.ageRange}): ${s.description}`),
      painPoints: painPoints.map((p) => p.point),
      platformPreferences: platforms.filter((p) => p.adReceptivity === "high").map((p) => p.platform),
      briefing: [project.briefingText, project.briefingParsed].filter(Boolean).join("\n\n") || undefined,
    });

    const result = await analyzeWithClaude({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      responseSchema: anglesSchema,
      maxTokens: 4096,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Angle generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate angles" },
      { status: 500 }
    );
  }
}
