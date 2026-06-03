import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

/**
 * Generate a storyboard frame image via fal.ai Flux Schnell.
 * Fast (~3s), returns a CDN URL, no base64 encoding needed.
 * Falls back to Pollinations if FAL_KEY is not set.
 */
async function generateFrameImage(prompt: string, aspectRatio: "landscape_16_9" | "square" = "landscape_16_9"): Promise<string> {
  const falKey = process.env.FAL_KEY;

  if (falKey) {
    // fal.ai flux/schnell — fast, high quality, ~$0.003/image
    const res = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Authorization": `Key ${falKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        image_size: aspectRatio,
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: false,
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      throw new Error(`fal.ai flux error ${res.status}: ${err.slice(0, 100)}`);
    }

    const data = await res.json();
    const url = data?.images?.[0]?.url;
    if (!url) throw new Error("fal.ai returned no image URL");
    return url;
  }

  // Fallback: Pollinations (no key needed but rate-limited)
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  const width = aspectRatio === "landscape_16_9" ? 1024 : 512;
  const height = aspectRatio === "landscape_16_9" ? 576 : 512;
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${seed}&nologo=true&model=flux&nofeed=true`;
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
  return url; // return URL directly (browser fetches lazily)
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { prompt, style, dimensions } = body;

  const isSquare = dimensions === "256x256" || dimensions === "512x512";
  const aspectRatio = isSquare ? "square" as const : "landscape_16_9" as const;

  const noText = "No text overlays, no typography, no logos, no watermarks. Pure visual scene only.";
  const fullPrompt = `Cinematic storyboard frame for a video ad: ${prompt}. ${style || "Commercial photography, natural lighting, photorealistic"}. ${noText}`;

  try {
    const asset = await prisma.previewAsset.create({
      data: {
        projectId,
        prompt: fullPrompt,
        style: style || "cinematic",
        dimensions: dimensions || "landscape_16_9",
        status: "generating",
      },
    });

    try {
      const imageUrl = await generateFrameImage(fullPrompt, aspectRatio);

      await prisma.previewAsset.update({
        where: { id: asset.id },
        data: { imageUrl, status: "complete" },
      });
      return NextResponse.json({ ...asset, imageUrl, status: "complete" });
    } catch (err) {
      console.error("Frame image generation failed:", err);
      await prisma.previewAsset.update({
        where: { id: asset.id },
        data: { status: "error" },
      });
      return NextResponse.json({
        ...asset,
        status: "error",
        error: err instanceof Error ? err.message : "Generation failed",
      });
    }
  } catch (err) {
    console.error("Frame DB create failed:", err);
    return NextResponse.json({ error: "Failed to generate frame" }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const assets = await prisma.previewAsset.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(assets);
}
