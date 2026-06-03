import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildStoryboardPrompt } from "@/services/ai/prompts/storyboard";

export const maxDuration = 60;

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
  const { scriptIds } = body as { scriptIds: string[] };

  if (!scriptIds || !Array.isArray(scriptIds) || scriptIds.length === 0) {
    return NextResponse.json({ error: "scriptIds array required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const scripts = await prisma.script.findMany({
      where: { id: { in: scriptIds }, projectId },
    });

    const promises = scripts.map(async (script) => {
      try {
        const hooks = script.hookVariants as string[];
        const ctas = script.ctaVariants as string[];
        const campaignSel = await prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null);
        const prompt = buildStoryboardPrompt({
          brandName: project.brandName,
          productName: project.productPageTitle || project.productName || undefined,
          scriptTitle: script.title,
          scriptBody: script.body,
          hook: hooks[0] || "",
          cta: ctas[0] || "",
          platform: (campaignSel?.platform as string | null) || "TikTok",
          totalDurationSec: (campaignSel?.totalDurationSec as number | null) || 30,
        });

        const result = await analyzeWithClaude({
          systemPrompt: prompt.system,
          userPrompt: prompt.user,
          responseSchema: storyboardSchema,
          maxTokens: 4096,
        });

        return await prisma.storyboard.create({
          data: {
            projectId,
            scriptId: script.id,
            title: result.title,
            frames: result.frames,
            totalDuration: result.totalDuration,
            style: result.style,
          },
        });
      } catch (err) {
        console.error("Storyboard failed for script:", script.id, err);
        return null;
      }
    });

    const storyboards = (await Promise.all(promises)).filter((s) => s !== null);
    return NextResponse.json({ storyboards });
  } catch (err) {
    console.error("Storyboards batch failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
