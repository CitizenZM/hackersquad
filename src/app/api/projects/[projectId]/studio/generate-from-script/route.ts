/**
 * Direct script-to-video — uses 1000-4000 word broadcast-quality cinematic prompts.
 * No LLM inference step — deterministic prompt building from brand research database.
 * Bypasses the veo-prompt endpoint (which times out at 60s with free models).
 *
 * Prompt quality targets SharkNinja commercial standard:
 * - Camera body + lens specified (color science trigger)
 * - Full lighting rig described (3-point + practicals)
 * - SSS skin/fur physics specified
 * - Material-specific specular types
 * - Motion hierarchy (subject > camera > secondary)
 * - Negative block suppressing AI defaults
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildDenseCinematicPrompt, buildWan26Prompt } from "@/services/ai/prompts/cinematic-prompt-builder";
import { getVideoModel, splitNegativePrompt, fitPromptForModel } from "@/services/video-gen/models";

export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    return await handlePost(request, params);
  } catch (err) {
    console.error("generate-from-script failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error generating video from script" },
      { status: 500 }
    );
  }
}

async function handlePost(
  request: Request,
  paramsPromise: Promise<{ projectId: string }>
) {
  const { projectId } = await paramsPromise;
  const body = await request.json().catch(() => ({}));
  const {
    scriptId,
    model = "grok-imagine-video",
    aspectRatio = "9:16",
    resolution = "720p",
    customPrompt, // optional override
  } = body;

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });

  const [project, script, campaignSel, sellingPoints] = await Promise.all([
    prisma.project.findUnique({
      where: { id: projectId },
      include: { brand: true },
    }),
    scriptId ? prisma.script.findUnique({ where: { id: scriptId } }) : Promise.resolve(null),
    prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
    prisma.sellingPoint.findMany({
      where: { projectId },
      orderBy: { strength: "desc" },
      take: 5,
    }),
  ]);

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const productName = project.productPageTitle || project.productName
    || project.brand?.valueProposition || project.brandName;
  const totalSec = (campaignSel?.totalDurationSec as number | null) || 5;
  const platform = (campaignSel?.platform as string | null) || "tiktok";

  // Use model-specific prompt builder — Wan 2.6 needs global style + shot separation
  const promptBuilder = model === "wan-2.6" ? buildWan26Prompt : buildDenseCinematicPrompt;
  const prompt = customPrompt || promptBuilder({
    brandName: project.brandName,
    productName,
    productDescription: project.productPageText?.slice(0, 400)
      || project.brand?.productDescription?.slice(0, 400),
    category: project.category || undefined,
    campaignGoal: project.campaignGoal || undefined,
    platform,
    totalDurationSec: totalSec,
    selectedActorRole: (campaignSel?.selectedActorRole as string | null) || undefined,
    selectedActorDesc: (campaignSel?.selectedActorDesc as string | null) || undefined,
    selectedEnvironment: (campaignSel?.selectedEnvironment as string | null) || undefined,
    environmentNotes: (campaignSel?.selectedEnvNotes as string | null) || undefined,
    sellingPoints: [
      ...sellingPoints.map(sp => sp.point),
      ...(Array.isArray(campaignSel?.selectedSellingPoints)
        ? (campaignSel.selectedSellingPoints as { point: string }[]).map(s => s.point)
        : []),
    ].slice(0, 5),
    scenes: Array.isArray(script?.scenes)
      ? (script.scenes as Array<{
          startSec?: number; endSec?: number; segmentLabel?: string;
          shotType?: string; location?: string; lighting?: string;
          actorAction?: string; productAction?: string; voiceover?: string;
        }>)
      : [],
  });

  // Map model to fal.ai endpoint via the shared registry (single source of
  // truth shared with generate-video and fal-status routes).
  const falModel = getVideoModel(model) ?? getVideoModel("grok-imagine-video")!;

  // Split out the negative/brand-safety block (built by cinematic-prompt-builder,
  // marked with "negative:") BEFORE trimming, so it is never the part that gets
  // truncated. fitPromptForModel trims only the positive prompt at a sentence
  // boundary and reserves space for the negative block (or routes it to the
  // dedicated negative_prompt field when the model supports one).
  const { positive, negative } = splitNegativePrompt(prompt);
  const { prompt: finalPrompt, negativePrompt } = fitPromptForModel(positive, negative, falModel);

  const payload: Record<string, unknown> = {
    prompt: finalPrompt,
    aspect_ratio: aspectRatio,
    resolution,
    duration: totalSec,
  };
  if (falModel.supportsAudio) payload.enable_audio = true;
  if (negativePrompt) payload.negative_prompt = negativePrompt;

  const falRes = await fetch(`https://queue.fal.run/${falModel.submitEndpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${falKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(20000),
  });

  if (!falRes.ok) {
    const err = await falRes.text().catch(() => "unknown");
    return NextResponse.json(
      { error: `fal.ai error ${falRes.status}`, details: err.slice(0, 300) },
      { status: falRes.status }
    );
  }

  const falData = await falRes.json();
  const falRequestId = falData.request_id;
  if (!falRequestId) {
    return NextResponse.json({ error: "No request_id from fal.ai", raw: falData }, { status: 500 });
  }

  // Persist job record
  const job = await prisma.falVideoJob.create({
    data: {
      projectId,
      falRequestId,
      model,
      prompt: prompt.slice(0, 10000), // DB stores up to 10K chars of the prompt
      aspectRatio,
      resolution,
      duration: totalSec,
      scriptId: scriptId || null,
      costUsd: falModel.costPerSecond * totalSec,
      status: "queued",
    },
  });

  return NextResponse.json({
    jobId: job.id,
    falRequestId,
    model,
    engine: "fal",
    status: "queued",
    promptWordCount: prompt.split(/\s+/).length,
    promptPreview: prompt.slice(0, 300) + "…",
  });
}
