import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export const maxDuration = 60;

// Free image generation via Pollinations.ai — fetches the image server-side
// and returns a data URI so the browser doesn't need to hit Pollinations directly.
async function generateImageFree(prompt: string): Promise<string> {
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 999999);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
  // GET with a generous timeout — Pollinations generates on first request (~5-15s)
  const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`Pollinations error: ${res.status}`);
  const buffer = await res.arrayBuffer();
  const b64 = Buffer.from(buffer).toString("base64");
  const mime = res.headers.get("content-type") || "image/jpeg";
  return `data:${mime};base64,${b64}`;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { prompt, style, dimensions } = body;

  const isLofi = dimensions === "256x256" || style === "lo-fi storyboard sketch";

  try {
    const asset = await prisma.previewAsset.create({
      data: {
        projectId,
        prompt,
        style: style || "photorealistic product ad",
        dimensions: dimensions || "1024x1024",
        status: "generating",
      },
    });

    const noTextDirective = "Pure visual scene only. No text, no words, no typography, no logos, no signs.";
    const fullPrompt = isLofi
      ? `Cinematic storyboard frame for a video ad: ${prompt}. Style: clean commercial illustration, natural colors, advertising concept art. ${noTextDirective}`
      : `Professional advertising cinematography frame: ${prompt}. Style: ${style || "cinematic, commercial photography, natural lighting, photorealistic, high production value"}. ${noTextDirective}`;

    try {
      let imageUrl: string | null = null;

      // Primary: OpenAI gpt-image-1 (if key is valid)
      if (process.env.OPENAI_API_KEY) {
        try {
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
          const response = await openai.images.generate({
            model: "gpt-image-1",
            prompt: fullPrompt,
            n: 1,
            size: isLofi ? "1024x1024" : "1536x1024",
            quality: isLofi ? "low" : "medium",
          });
          const b64 = response.data?.[0]?.b64_json;
          if (b64) imageUrl = `data:image/png;base64,${b64}`;
          else imageUrl = response.data?.[0]?.url ?? null;
        } catch (openaiErr) {
          console.warn("OpenAI image failed, falling back to Pollinations:", openaiErr instanceof Error ? openaiErr.message : openaiErr);
        }
      }

      // Fallback: Pollinations.ai (free, no key required)
      if (!imageUrl) {
        imageUrl = await generateImageFree(fullPrompt);
      }

      if (imageUrl) {
        await prisma.previewAsset.update({
          where: { id: asset.id },
          data: { imageUrl, status: "complete" },
        });
        return NextResponse.json({ ...asset, imageUrl, status: "complete" });
      }
    } catch (err) {
      console.error("Image generation failed:", err);
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

    await prisma.previewAsset.update({
      where: { id: asset.id },
      data: { status: "complete" },
    });
    return NextResponse.json({ ...asset, status: "complete" });
  } catch (err) {
    console.error("Frame generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate frame" },
      { status: 500 }
    );
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
