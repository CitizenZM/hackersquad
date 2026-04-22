import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";

export const maxDuration = 60;

const scriptSchema = z.object({
  transcript: z.string(),
  summary: z.string(),
  keyMoments: z.array(z.object({
    timestamp: z.string(),
    description: z.string(),
  })),
});

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; assetId: string }> }
) {
  const { projectId, assetId } = await params;

  try {
    const asset = await prisma.contentAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset || asset.projectId !== projectId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const system = `You are a video content analyst. Given a video's title, description, and metadata, reconstruct what the video's script/narration likely contains.
Generate a realistic, detailed script transcript as if you watched the video.
Respond with valid JSON matching this structure:
{
  "transcript": "Full script/narration text of the video, paragraph by paragraph",
  "summary": "2-3 sentence summary of the video content",
  "keyMoments": [
    { "timestamp": "0:00", "description": "Opening hook" },
    { "timestamp": "0:15", "description": "..." }
  ]
}`;

    const user = `Reconstruct the likely script for this video:

Title: ${asset.title}
Platform: ${asset.platform || "YouTube"}
Description: ${asset.description || "No description available"}
Views: ${asset.viewCount?.toLocaleString() || "Unknown"}
Likes: ${asset.likeCount?.toLocaleString() || "Unknown"}
Narrative type: ${asset.narrativeType || "Unknown"}
Hook text: ${asset.hookText || "Unknown"}
Key messages: ${JSON.stringify(asset.keyMessages || [])}

Generate a realistic ~300 word script/transcript that this video likely contains.`;

    const result = await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: scriptSchema,
      maxTokens: 2048,
    });

    await prisma.contentAsset.update({
      where: { id: assetId },
      data: { transcript: result.transcript },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Script generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate script" },
      { status: 500 }
    );
  }
}
