import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export const maxDuration = 30;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { prompt, style, dimensions } = body;

  // Determine if this is a lo-fi storyboard frame or a full studio render
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

    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        let imageUrl: string | undefined;

        if (isLofi) {
          // DALL-E 2 at 256x256 = $0.016 per image (cheapest option)
          const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: `Simple storyboard frame illustration: ${prompt}. Style: clean minimal sketch, flat colors, advertising concept art`,
            n: 1,
            size: "256x256",
          });
          imageUrl = response.data?.[0]?.url;
        } else {
          // Full quality: DALL-E 3 at 1024x1024
          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Professional advertising concept frame: ${prompt}. Style: ${style || "clean, modern, commercial photography"}`,
            n: 1,
            size: "1024x1024",
            quality: "standard",
          });
          imageUrl = response.data?.[0]?.url;
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
