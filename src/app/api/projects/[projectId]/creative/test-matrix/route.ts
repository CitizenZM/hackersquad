import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildTestMatrixPrompt } from "@/services/ai/prompts/test-matrix";
import { NarrativeType } from "@/generated/prisma/enums";

const matrixSchema = z.object({
  variants: z.array(
    z.object({
      hookVariant: z.string(),
      narrativeType: z.string(),
      ctaVariant: z.string(),
      format: z.string(),
      predictedScore: z.number(),
      rationale: z.string(),
      scriptOutline: z.string(),
    })
  ),
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const scripts = await prisma.script.findMany({
      where: { projectId },
      take: 5,
    });

    const hooks = scripts.flatMap((s) => (s.hookVariants as string[]).slice(0, 2));
    const ctas = scripts.flatMap((s) => (s.ctaVariants as string[]).slice(0, 2));
    const narrativeTypes = [
      "PROBLEM_SOLUTION", "TESTIMONIAL", "DEMONSTRATION",
      "UGC_STYLE", "BEFORE_AFTER",
    ];
    const formats = ["video_15s", "video_30s", "static", "carousel"];

    const prompt = buildTestMatrixPrompt({
      brandName: project.brandName,
      hooks: hooks.length > 0 ? hooks : ["Bold claim hook", "Pain point hook", "Curiosity hook"],
      narrativeTypes,
      ctas: ctas.length > 0 ? ctas : ["Shop Now", "Learn More", "Try It Today"],
      formats,
    });

    const result = await analyzeWithClaude({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      responseSchema: matrixSchema,
      maxTokens: 8192,
    });

    const validTypes: NarrativeType[] = [
      "PROBLEM_SOLUTION", "TESTIMONIAL", "DEMONSTRATION", "LIFESTYLE",
      "EDUCATIONAL", "COMPARISON", "STORY_ARC", "UGC_STYLE",
      "TREND_RIDING", "BEFORE_AFTER",
    ];

    // Save variants
    for (const variant of result.variants) {
      await prisma.creativeVariant.create({
        data: {
          projectId,
          hookVariant: variant.hookVariant,
          narrativeType: validTypes.includes(variant.narrativeType as NarrativeType)
            ? (variant.narrativeType as NarrativeType)
            : "DEMONSTRATION",
          ctaVariant: variant.ctaVariant,
          format: variant.format,
          predictedScore: variant.predictedScore,
          rationale: variant.rationale,
          scriptOutline: variant.scriptOutline,
        },
      });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Test matrix generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate test matrix" },
      { status: 500 }
    );
  }
}
