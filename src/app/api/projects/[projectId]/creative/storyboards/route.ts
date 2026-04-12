import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildStoryboardPrompt } from "@/services/ai/prompts/storyboard";

const storyboardSchema = z.object({
  title: z.string(),
  style: z.string(),
  totalDuration: z.string(),
  frames: z.array(
    z.object({
      frameNumber: z.number(),
      duration: z.string(),
      scene: z.string(),
      visualDirection: z.string(),
      voiceover: z.string(),
      textOverlay: z.string(),
      cameraNotes: z.string(),
      imagePrompt: z.string(),
    })
  ),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { scriptId } = body;

  try {
    const script = await prisma.script.findUnique({ where: { id: scriptId } });
    if (!script || script.projectId !== projectId) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const hooks = script.hookVariants as string[];
    const ctas = script.ctaVariants as string[];

    const prompt = buildStoryboardPrompt({
      brandName: project.brandName,
      scriptTitle: script.title,
      scriptBody: script.body,
      hook: hooks[0] || "",
      cta: ctas[0] || "",
    });

    const result = await analyzeWithClaude({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      responseSchema: storyboardSchema,
      maxTokens: 4096,
    });

    const storyboard = await prisma.storyboard.create({
      data: {
        projectId,
        scriptId,
        title: result.title,
        frames: result.frames,
        totalDuration: result.totalDuration,
        style: result.style,
      },
    });

    return NextResponse.json(storyboard);
  } catch (err) {
    console.error("Storyboard generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate storyboard" },
      { status: 500 }
    );
  }
}
