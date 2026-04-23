import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { prompts, scriptId } = body as { prompts: string[]; scriptId?: string };

  if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
    return NextResponse.json({ error: "prompts array required" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI key not configured" }, { status: 500 });
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const noTextDirective = "CRITICAL: No text, no words, no letters, no typography, no captions, no logos, no signs. Pure cinematic visual only.";

    // Generate up to 8 frames in parallel
    const keyframes = await Promise.all(
      prompts.slice(0, 8).map(async (prompt, i) => {
        try {
          const response = await openai.images.generate({
            model: "dall-e-2",
            prompt: `Cinematic film still: ${prompt}. Photorealistic advertising cinematography. ${noTextDirective}`,
            n: 1,
            size: "512x512",
          });
          const imageUrl = response.data?.[0]?.url;
          if (!imageUrl) return null;

          const asset = await prisma.previewAsset.create({
            data: {
              projectId,
              prompt,
              style: `keyframe-${i + 1}${scriptId ? `-script-${scriptId}` : ""}`,
              dimensions: "512x512",
              imageUrl,
              status: "complete",
            },
          });
          return asset;
        } catch (err) {
          console.error(`Keyframe ${i} failed:`, err);
          return null;
        }
      })
    );

    return NextResponse.json({ keyframes: keyframes.filter((k) => k !== null) });
  } catch (err) {
    console.error("Keyframes generation failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
