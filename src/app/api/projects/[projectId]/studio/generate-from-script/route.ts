/**
 * Direct script-to-video generation — no LLM for prompt building.
 * Constructs a cinematic TikTok prompt from script scenes deterministically,
 * bypassing the slow VEO prompt AI generation endpoint (which times out at 60s).
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

interface SceneRecord {
  sceneNumber?: number;
  startSec?: number;
  endSec?: number;
  segmentLabel?: string;
  shotType?: string;
  focalLength?: string;
  cameraMovement?: string;
  aperture?: string;
  location?: string;
  lighting?: string;
  actorAction?: string;
  productAction?: string;
  voiceover?: string;
}

function buildCinematicPrompt(
  productName: string,
  brandName: string,
  campaignGoal: string,
  totalSec: number,
  scenes: SceneRecord[],
  selectedActorDesc?: string,
  selectedEnvironment?: string
): string {
  const isShort = totalSec <= 10;
  const platform = isShort ? "TikTok" : "YouTube";

  // Build from scenes if available, otherwise use template
  if (scenes && scenes.length > 0) {
    const sceneDescs = scenes.slice(0, isShort ? 2 : 3).map((s, i) => {
      const start = s.startSec ?? i * Math.floor(totalSec / scenes.length);
      const end = s.endSec ?? (i + 1) * Math.floor(totalSec / scenes.length);
      const shot = s.shotType || (i === 0 ? "Extreme close-up" : "Medium shot");
      const cam = s.cameraMovement || "slow push-in";
      const lens = s.focalLength || "85mm";
      const light = s.lighting || "5200K natural window light from camera-left, 3:1 ratio";
      const actor = s.actorAction || "subject not looking at camera, absorbed in task";
      const product = s.productAction || `${productName} visible in frame`;
      const loc = s.location || selectedEnvironment || "modern home interior";
      return `${start}s–${end}s: ${shot}, ${lens}, ${cam}. ${loc}. ${actor}. ${product}. ${light}.`;
    }).join(" ");

    return `Shot on ARRI ALEXA Mini LF, 9:16 vertical, 24fps, ${totalSec}s ${platform} ad for ${brandName} Prime Day. PRODUCT: ${productName} — NOT a shark animal, NOT wildlife, consumer home product only. ${sceneDescs}${selectedActorDesc ? ` Actor: ${selectedActorDesc}.` : ""} Shallow depth of field f/1.8, product sharp. No text overlays, no logos except product, no distorted anatomy, no direct eye contact with lens.`;
  }

  // Fallback template by product category
  return `Shot on ARRI ALEXA Mini LF, 9:16 vertical, 24fps, ${totalSec}s ${platform} Prime Day ad. PRODUCT: ${productName} — consumer product, NOT an animal, NOT wildlife. 0–${Math.round(totalSec * 0.4)}s: Extreme close-up of ${productName}, product in right third of frame, 85mm lens, slow push-in, warm natural 5200K window light from camera-left. ${Math.round(totalSec * 0.4)}s–${totalSec}s: Product hero shot centered, shallow bokeh f/1.8, warm rim light, product label sharp. Campaign: ${campaignGoal}. No text, no logos except product, no animals.`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const { scriptId, model = "grok-imagine-video", aspectRatio = "9:16", resolution = "720p" } = body;

  if (!scriptId) return NextResponse.json({ error: "scriptId required" }, { status: 400 });

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: "FAL_KEY not configured" }, { status: 500 });

  const [project, script, campaignSel] = await Promise.all([
    prisma.project.findUnique({ where: { id: projectId }, include: { brand: true } }),
    prisma.script.findUnique({ where: { id: scriptId } }),
    prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
  ]);

  if (!project || !script) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const productName = project.productPageTitle || project.productName || project.brand?.valueProposition || project.brandName;
  const totalSec = (campaignSel?.totalDurationSec as number | null) || 5;
  const campaignGoal = project.campaignGoal || "conversion";
  const scenes = (script.scenes as SceneRecord[] | null) || [];
  const selectedActorDesc = (campaignSel?.selectedActorDesc as string | null) || undefined;
  const selectedEnvironment = (campaignSel?.selectedEnvironment as string | null) || undefined;

  const prompt = buildCinematicPrompt(
    productName, project.brandName, campaignGoal, totalSec, scenes, selectedActorDesc, selectedEnvironment
  );

  // Map model to fal endpoint
  const FAL_MODELS: Record<string, { endpoint: string; costPerSec: number }> = {
    "grok-imagine-video": { endpoint: "xai/grok-imagine-video/text-to-video", costPerSec: 0.07 },
    "wan-2.6":            { endpoint: "wan/v2.6/text-to-video",              costPerSec: 0.10 },
    "kling-v3-pro":       { endpoint: "fal-ai/kling-video/v3/pro/text-to-video", costPerSec: 0.112 },
  };
  const falModel = FAL_MODELS[model] || FAL_MODELS["grok-imagine-video"];

  const payload: Record<string, unknown> = { prompt, aspect_ratio: aspectRatio, resolution, duration: totalSec };

  const falRes = await fetch(`https://queue.fal.run/${falModel.endpoint}`, {
    method: "POST",
    headers: { Authorization: `Key ${falKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!falRes.ok) {
    const err = await falRes.text();
    return NextResponse.json({ error: `fal.ai error: ${falRes.status}`, details: err.slice(0, 200) }, { status: falRes.status });
  }

  const falData = await falRes.json();
  const falRequestId = falData.request_id;

  const job = await prisma.falVideoJob.create({
    data: {
      projectId,
      falRequestId,
      model,
      prompt,
      aspectRatio,
      resolution,
      duration: totalSec,
      scriptId,
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
    promptUsed: prompt.slice(0, 200) + "...",
  });
}
