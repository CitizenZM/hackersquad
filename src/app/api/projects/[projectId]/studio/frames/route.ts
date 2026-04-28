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

        const noTextDirective = "IMPORTANT: Pure visual scene only. NO text, NO words, NO letters, NO typography, NO captions, NO logos, NO signs with readable text in the image.";

        const fullPrompt = isLofi
          ? `Cinematic storyboard frame for a video ad: ${prompt}. Style: clean commercial illustration, natural colors, advertising concept art. ${noTextDirective}`
          : `Professional advertising cinematography frame: ${prompt}. Style: ${style || "cinematic, commercial photography, natural lighting, photorealistic, high production value"}. ${noTextDirective}`;

        // Use GPT Image 1 (OpenAI's latest image model)
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: fullPrompt,
          n: 1,
          size: isLofi ? "1024x1024" : "1536x1024",
          quality: isLofi ? "low" : "medium",
        });

        const b64 = response.data?.[0]?.b64_json;
        if (b64) {
          const imageUrl = `data:image/png;base64,${b64}`;
          await prisma.previewAsset.update({
            where: { id: asset.id },
            data: { imageUrl, status: "complete" },
          });
          return NextResponse.json({ ...asset, imageUrl, status: "complete" });
        }

        // Fallback: check for URL format
        const urlResult = response.data?.[0]?.url;
        if (urlResult) {
          await prisma.previewAsset.update({
            where: { id: asset.id },
            data: { imageUrl: urlResult, status: "complete" },
          });
          return NextResponse.json({ ...asset, imageUrl: urlResult, status: "complete" });
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
