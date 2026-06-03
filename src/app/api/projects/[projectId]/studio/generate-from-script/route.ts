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
import { buildCinematicVideoPrompt } from "@/services/ai/prompts/cinematic-prompt-builder";

export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
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

  // Build the 1000-4000 word cinematic prompt from brand research
  const prompt = customPrompt || buildCinematicVideoPrompt({
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
      ...(
        (campaignSel?.selectedSellingPoints as { point: string }[] | null)
          ?.map(s => s.point) || []
      ),
    ].slice(0, 5),
    scenes: script ? (script.scenes as Array<{
      startSec?: number; endSec?: number; segmentLabel?: string;
      shotType?: string; location?: string; lighting?: string;
      actorAction?: string; productAction?: string; voiceover?: string;
    }> | null) || [] : [],
  });

  // Map model to fal.ai endpoint
  const FAL_MODELS: Record<string, { endpoint: string; costPerSec: number; supportsAudio: boolean }> = {
    "grok-imagine-video": {
      endpoint: "xai/grok-imagine-video/text-to-video",
      costPerSec: 0.07,
      supportsAudio: true,
    },
    "wan-2.6": {
      endpoint: "wan/v2.6/text-to-video",
      costPerSec: 0.10,
      supportsAudio: true,
    },
    "kling-v3-pro": {
      endpoint: "fal-ai/kling-video/v3/pro/text-to-video",
      costPerSec: 0.112,
      supportsAudio: false,
    },
    "wan-2.5": {
      endpoint: "fal-ai/wan-25-preview/text-to-video",
      costPerSec: 0.05,
      supportsAudio: false,
    },
  };

  const falModel = FAL_MODELS[model] || FAL_MODELS["grok-imagine-video"];

  const payload: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    resolution,
    duration: totalSec,
  };
  if (falModel.supportsAudio) payload.enable_audio = true;

  const falRes = await fetch(`https://queue.fal.run/${falModel.endpoint}`, {
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
      costUsd: falModel.costPerSec * totalSec,
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
