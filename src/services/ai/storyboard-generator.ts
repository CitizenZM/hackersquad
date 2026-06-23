import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildStoryboardPrompt } from "@/services/ai/prompts/storyboard";
import {
  computeWindows,
  repairFrames,
  type SceneLike,
} from "@/lib/storyboard-grid";

// Lenient schema — the LLM may omit or rename fields. We validate loosely here
// and then repair the frames onto the exact 3-second grid afterwards.
const frameSchema = z.object({
  frameNumber: z.coerce.number().optional(),
  duration: z.string().optional().default(""),
  scene: z.string().optional().default(""),
  visualDirection: z.string().optional().default(""),
  voiceover: z.string().optional().default(""),
  textOverlay: z.string().optional().default(""),
  cameraNotes: z.string().optional().default(""),
  imagePrompt: z.string().optional().default(""),
  startSec: z.coerce.number().optional(),
  endSec: z.coerce.number().optional(),
});

const storyboardSchema = z.object({
  title: z.string(),
  style: z.string(),
  totalDuration: z.string().optional().default(""),
  frames: z.array(frameSchema),
});

interface ScriptLike {
  id: string;
  title: string;
  body: string;
  hookVariants: unknown;
  ctaVariants: unknown;
  scenes?: unknown;
  totalDurationSec?: number | null;
}

interface ProjectLike {
  brandName: string;
  productPageTitle?: string | null;
  productName?: string | null;
}

interface CampaignLike {
  platform?: string | null;
  totalDurationSec?: number | null;
}

/**
 * Generate a 3-second-grid storyboard for one script and return Prisma create
 * data. Frame count, timing, and per-window scene grounding are all derived
 * from the script's duration and scene plan; token budget scales with frames.
 */
export async function buildStoryboardCreateData(
  projectId: string,
  script: ScriptLike,
  project: ProjectLike,
  campaignSel: CampaignLike | null
): Promise<Prisma.StoryboardUncheckedCreateInput> {
  const hooks = (script.hookVariants as string[] | null) ?? [];
  const ctas = (script.ctaVariants as string[] | null) ?? [];
  const scenes = (Array.isArray(script.scenes) ? script.scenes : []) as SceneLike[];

  const totalDurationSec =
    campaignSel?.totalDurationSec || script.totalDurationSec || 30;

  const windows = computeWindows(totalDurationSec);
  const frameCount = windows.length;

  const prompt = buildStoryboardPrompt({
    brandName: project.brandName,
    productName: project.productPageTitle || project.productName || undefined,
    scriptTitle: script.title,
    scriptBody: script.body,
    hook: hooks[0] || "",
    cta: ctas[0] || "",
    platform: campaignSel?.platform || "TikTok",
    totalDurationSec,
    scenes,
  });

  // Each rich frame costs ~600-700 tokens; scale with frame count, capped.
  const maxTokens = Math.min(8000, 2200 + frameCount * 650);

  const result = await analyzeWithClaude({
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
    responseSchema: storyboardSchema,
    maxTokens,
  });

  // Force the exact grid: correct count, timing, and gap-free windows.
  const frames = repairFrames(result.frames, windows, scenes);

  return {
    projectId,
    scriptId: script.id,
    title: result.title,
    frames: frames as unknown as Prisma.InputJsonValue,
    totalDuration: `${totalDurationSec}s`,
    style: result.style,
  };
}
