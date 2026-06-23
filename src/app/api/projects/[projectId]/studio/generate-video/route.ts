import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 60;

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

const VEO_MODELS: Record<string, string> = {
  "veo-3.1-fast": "veo-3.1-fast-generate-preview",
  "veo-3.1-standard": "veo-3.1-generate-preview",
};

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const {
    prompt,
    model = "grok-imagine-video",
    aspectRatio = "9:16",
    resolution = "720p",
    duration = 5,
    scriptId,
    shotIndex,
  } = body as {
    prompt: string;
    model?: string;
    aspectRatio?: string;
    resolution?: string;
    duration?: number;
    scriptId?: string;
    shotIndex?: number;
  };

  if (!prompt) return NextResponse.json({ error: "prompt required" }, { status: 400 });

  const falKey = process.env.FAL_KEY;
  const falModel = FAL_MODELS[model];

  // Use fal.ai if key present and model known
  if (falKey && falModel) {
    try {
      const payload: Record<string, unknown> = {
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        duration,
      };
      if (falModel.supportsAudio) payload.enable_audio = true;

      const res = await fetch(`https://queue.fal.run/${falModel.endpoint}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${falKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`fal.ai ${res.status}: ${err.slice(0, 200)}`);
      }

      const data = await res.json();
      const falRequestId = data.request_id;
      if (!falRequestId) {
        // falRequestId is a required @unique column — never persist undefined.
        throw new Error("fal.ai response missing request_id");
      }

      // Persist to DB
      const job = await prisma.falVideoJob.create({
        data: {
          projectId,
          falRequestId,
          model,
          prompt,
          aspectRatio,
          resolution,
          duration,
          scriptId,
          shotIndex,
          costUsd: falModel.costPerSec * duration,
          status: "queued",
        },
      });

      return NextResponse.json({
        jobId: job.id,
        falRequestId,
        model,
        engine: "fal",
        statusUrl: data.status_url,
        status: "queued",
      });
    } catch (err) {
      console.error("fal.ai generation failed:", err);
      // Fall through to Veo fallback
    }
  }

  // Fallback: Veo
  const googleKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!googleKey) {
    return NextResponse.json({ error: "No video generation API key configured (FAL_KEY or GOOGLE_API_KEY)" }, { status: 500 });
  }

  const veoModelId = VEO_MODELS[model] || VEO_MODELS["veo-3.1-fast"];
  const veoRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${veoModelId}:predictLongRunning`,
    {
      method: "POST",
      headers: { "x-goog-api-key": googleKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { aspectRatio, resolution, durationSeconds: duration },
      }),
    }
  );

  if (!veoRes.ok) {
    const err = await veoRes.text();
    return NextResponse.json({ error: `Veo error: ${veoRes.status}`, details: err }, { status: veoRes.status });
  }

  const veoData = await veoRes.json();
  return NextResponse.json({
    operationId: veoData.name,
    model: veoModelId,
    engine: "veo",
    projectId,
    status: "generating",
  });
}
