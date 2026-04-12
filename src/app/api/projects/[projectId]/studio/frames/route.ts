import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { prompt, style, dimensions } = body;

  try {
    // Create the preview asset record
    const asset = await prisma.previewAsset.create({
      data: {
        projectId,
        prompt,
        style: style || "photorealistic product ad",
        dimensions: dimensions || "1024x1024",
        status: "generating",
      },
    });

    // Try OpenAI image generation if key is available
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.images.generate({
          model: "dall-e-3",
          prompt: `Professional advertising concept frame: ${prompt}. Style: ${style || "clean, modern, commercial photography"}`,
          n: 1,
          size: "1024x1024",
          quality: "standard",
        });

        const imageUrl = response.data?.[0]?.url;
        if (imageUrl) {
          await prisma.previewAsset.update({
            where: { id: asset.id },
            data: { imageUrl, status: "complete" },
          });
          return NextResponse.json({ ...asset, imageUrl, status: "complete" });
        }
      } catch (err) {
        console.error("OpenAI image generation failed:", err);
      }
    }

    // Fallback: return the asset with prompt only (no generated image)
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
