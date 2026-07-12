/**
 * Direct script-to-video — uses the model-aware prompt compiler to build
 * broadcast-quality cinematic prompts. No LLM inference step — deterministic
 * prompt building from brand research database via prompt-compiler.ts.
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
import { getVideoModel } from "@/services/video-gen/models";
import {
  compileForModel,
  toShotSpec,
  type BrandContext,
  type ScriptSceneLike,
} from "@/services/video-gen/prompt-compiler";

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

  // Map model to fal.ai endpoint via the shared registry (single source of
  // truth shared with generate-video and fal-status routes).
  const falModel = getVideoModel(model) ?? getVideoModel("grok-imagine-video")!;

  const brand: BrandContext = {
    brandName: project.brandName,
    productName,
    productCategory: project.brand?.productCategory || project.category || "",
    keySellingPoints: [
      ...sellingPoints.map(sp => sp.point),
      ...(Array.isArray(campaignSel?.selectedSellingPoints)
        ? (campaignSel.selectedSellingPoints as { point: string }[]).map(s => s.point)
        : []),
    ].slice(0, 5),
    mustNotAppear: [],
  };

  const scenes: ScriptSceneLike[] = Array.isArray(script?.scenes)
    ? (script.scenes as ScriptSceneLike[])
    : [];

  // Adapt scenes JSON into ShotSpec[]. When there are no scenes yet, fall back
  // to a single synthetic shot covering the full campaign duration so the
  // compiler always has at least one shot to work with.
  const shotSpecs = scenes.length
    ? scenes.map((scene, i) =>
        toShotSpec(scene, { title: script?.title || "", body: script?.body || "", totalDurationSec: totalSec }, brand, i)
      )
    : [
        toShotSpec(
          {
            location: (campaignSel?.selectedEnvironment as string | null) || undefined,
            lighting: (campaignSel?.selectedEnvNotes as string | null) || undefined,
            actorAction: (campaignSel?.selectedActorDesc as string | null) || undefined,
          },
          { title: script?.title || "", body: script?.body || "", totalDurationSec: totalSec },
          brand,
          0
        ),
      ];

  // compileForModel returns ONE payload PER SHOT (multi-shot honesty — no
  // inline [0-3s][3-6s] timeline markers baked into a single prompt). This
  // route currently only submits shot 0 to fal.ai; a separate per-shot
  // generation route is being built to submit the rest.
  const compiled = compileForModel(shotSpecs, brand, falModel.key, { aspectRatio, resolution });
  const shotPayload = compiled[0];

  const prompt = customPrompt || shotPayload.prompt;
  const negativePrompt = customPrompt ? undefined : shotPayload.negativePrompt;

  const payload: Record<string, unknown> = {
    prompt,
    ...(falModel.supportedParams.includes("aspect_ratio") ? { aspect_ratio: aspectRatio } : {}),
    ...(falModel.supportedParams.includes("resolution") ? { resolution } : {}),
    ...(falModel.supportedParams.includes("duration") ? { duration: totalSec } : {}),
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
