import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.falVideoJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // Already completed or failed
  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json(job);
  }

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: "FAL_KEY not set" }, { status: 500 });

  // Get model endpoint from stored model name
  const MODEL_ENDPOINTS: Record<string, string> = {
    "grok-imagine-video": "xai/grok-imagine-video",
    "wan-2.6": "wan/v2.6",
    "kling-v3-pro": "fal-ai/kling-video/v3/pro",
    "wan-2.5": "fal-ai/wan-25-preview",
  };
  const endpoint = MODEL_ENDPOINTS[job.model] || "xai/grok-imagine-video";

  // Poll fal.ai status
  const statusRes = await fetch(
    `https://queue.fal.run/${endpoint}/requests/${job.falRequestId}/status`,
    { headers: { Authorization: `Key ${falKey}` } }
  );

  if (!statusRes.ok) {
    return NextResponse.json({ ...job, error: `fal status ${statusRes.status}` });
  }

  const statusData = await statusRes.json();
  const falStatus: string = statusData.status;

  if (falStatus === "COMPLETED") {
    // Fetch result
    const resultRes = await fetch(
      `https://queue.fal.run/${endpoint}/requests/${job.falRequestId}`,
      { headers: { Authorization: `Key ${falKey}` } }
    );
    const result = await resultRes.json();
    const video = result.video;

    const updated = await prisma.falVideoJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        videoUrl: video?.url,
        fileSizeBytes: video?.file_size,
        widthPx: video?.width,
        heightPx: video?.height,
        fpS: video?.fps,
        durationSec: video?.duration,
        completedAt: new Date(),
      },
    });
    return NextResponse.json(updated);
  }

  if (falStatus === "FAILED") {
    const updated = await prisma.falVideoJob.update({
      where: { id: jobId },
      data: { status: "failed", error: statusData.error || "Generation failed" },
    });
    return NextResponse.json(updated);
  }

  // Still processing
  await prisma.falVideoJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });
  return NextResponse.json({ ...job, status: "processing" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { jobId } = await params;
  await prisma.falVideoJob.delete({ where: { id: jobId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
