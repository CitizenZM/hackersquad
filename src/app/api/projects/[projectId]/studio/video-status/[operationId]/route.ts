import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; operationId: string }> }
) {
  const { operationId } = await params;

  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Google API key not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${operationId}`,
      {
        headers: { "x-goog-api-key": apiKey },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err, done: false }, { status: res.status });
    }

    const data = await res.json();

    if (data.done) {
      // Extract video URL
      const videos = data.response?.generateVideoResponse?.generatedSamples || [];
      const videoUrl = videos[0]?.video?.uri || null;

      // Persist to the FalVideoJob row created by generate-video's Veo
      // fallback (keyed by falRequestId === operationId). Without this,
      // completed Veo videos were never recorded anywhere (data loss).
      try {
        await prisma.falVideoJob.updateMany({
          where: { falRequestId: operationId },
          data: {
            status: videoUrl ? "completed" : "failed",
            videoUrl: videoUrl ?? null,
            completedAt: new Date(),
            error: videoUrl ? null : "Veo reported done but no video URL was returned",
          },
        });
      } catch (err) {
        console.error("Failed to persist Veo completion to FalVideoJob:", err);
      }

      return NextResponse.json({
        done: true,
        videoUrl,
        operationId,
      });
    }

    return NextResponse.json({
      done: false,
      operationId,
      metadata: data.metadata || null,
    });
  } catch (err) {
    console.error("Video status check failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed", done: false },
      { status: 500 }
    );
  }
}
