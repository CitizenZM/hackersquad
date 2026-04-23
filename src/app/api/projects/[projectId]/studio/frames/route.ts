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

        // CRITICAL: prevent text/typography artifacts in DALL-E output
        const noTextDirective = "IMPORTANT: Pure visual scene only. NO text, NO words, NO letters, NO typography, NO captions, NO logos, NO signs with readable text, NO brand names written in the image.";

        if (isLofi) {
          // DALL-E 2 at 256x256 (cheapest option)
          const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: `Cinematic storyboard frame: ${prompt}. Clean minimal illustration, flat colors, advertising concept art. ${noTextDirective}`,
            n: 1,
            size: "256x256",
          });
          imageUrl = response.data?.[0]?.url;
        } else {
          // Full quality: DALL-E 3 at 1024x1024
          const response = await openai.images.generate({
            model: "dall-e-3",
            prompt: `Professional advertising cinematography frame: ${prompt}. Style: ${style || "cinematic, commercial photography, natural lighting, photorealistic"}. ${noTextDirective}`,
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
