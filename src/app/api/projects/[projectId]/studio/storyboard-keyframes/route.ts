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

    // Generate keyframes using GPT Image 1 — sequential to avoid rate limits
    const keyframes = [];
    for (let i = 0; i < Math.min(prompts.length, 8); i++) {
      try {
        const response = await openai.images.generate({
          model: "gpt-image-1",
          prompt: `Cinematic film still for a video ad: ${prompts[i]}. Photorealistic advertising cinematography, natural lighting, commercial production quality. ${noTextDirective}`,
          n: 1,
          size: "1024x1024",
          quality: "low",
        });

        const b64 = response.data?.[0]?.b64_json;
        const imageUrl = b64
          ? `data:image/png;base64,${b64}`
          : response.data?.[0]?.url;

        if (!imageUrl) { keyframes.push(null); continue; }

        const asset = await prisma.previewAsset.create({
          data: {
            projectId,
            prompt: prompts[i],
            style: `keyframe-${i + 1}${scriptId ? `-script-${scriptId}` : ""}`,
            dimensions: "1024x1024",
            imageUrl,
            status: "complete",
          },
        });
        keyframes.push(asset);
      } catch (err) {
        console.error(`Keyframe ${i} failed:`, err);
        keyframes.push(null);
      }
    }

    return NextResponse.json({ keyframes: keyframes.filter((k) => k !== null) });
  } catch (err) {
    console.error("Keyframes generation failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
