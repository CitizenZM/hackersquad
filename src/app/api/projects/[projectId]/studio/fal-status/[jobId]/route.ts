import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getVideoModel } from "@/services/video-gen/models";

export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.falVideoJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  // generate-shots (i2v jobs) prefixes job.prompt with a recoverable
  // "[[endpoint:<submitEndpoint>]]" marker (see below) — strip it before ever
  // returning the job to a client.
  const stripEndpointMarker = (p: string) => p.replace(/^\[\[endpoint:[^\]]+\]\]/, "");

  // Already completed or failed
  if (job.status === "completed" || job.status === "failed") {
    return NextResponse.json({ ...job, prompt: stripEndpointMarker(job.prompt) });
  }

  const falKey = process.env.FAL_KEY;
  if (!falKey) return NextResponse.json({ error: "FAL_KEY not set" }, { status: 500 });

  // Get model endpoint from stored model name via the shared registry.
  // IMPORTANT: Kling v3 requires /text-to-video in the path for status polling.
  // Unknown models must error clearly rather than silently defaulting to
  // grok's endpoint (which previously returned wrong/misleading status data).
  const modelDef = getVideoModel(job.model);
  if (!modelDef || modelDef.provider !== "fal") {
    return NextResponse.json(
      { error: `Unknown or non-fal video model "${job.model}" for job ${jobId}` },
      { status: 422 }
    );
  }

  // Per-shot i2v jobs (studio/generate-shots) submit against modelDef.i2vEndpoint
  // instead of submitEndpoint. FalVideoJob has no dedicated "mode"/endpoint
  // column, so generate-shots prefixes job.prompt with a recoverable
  // "[[endpoint:<submitEndpoint>]]" marker. fal.ai's queue status/result paths
  // are scoped to the submit endpoint (not just the base model path), so i2v
  // jobs must poll using that same endpoint rather than modelDef.statusEndpoint.
  const endpointMarkerMatch = /^\[\[endpoint:([^\]]+)\]\]/.exec(job.prompt);
  const endpoint = endpointMarkerMatch ? endpointMarkerMatch[1] : modelDef.statusEndpoint;

  // Poll fal.ai status
  const statusRes = await fetch(
    `https://queue.fal.run/${endpoint}/requests/${job.falRequestId}/status`,
    { headers: { Authorization: `Key ${falKey}` } }
  );

  if (!statusRes.ok) {
    return NextResponse.json({
      ...job,
      prompt: stripEndpointMarker(job.prompt),
      error: `fal status ${statusRes.status}`,
    });
  }

  const statusData = await statusRes.json();
  const falStatus: string = statusData.status;

  if (falStatus === "COMPLETED") {
    // Fetch result with retry on auth failure
    let video: Record<string, unknown> | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resultRes = await fetch(
          `https://queue.fal.run/${endpoint}/requests/${job.falRequestId}`,
          { headers: { Authorization: `Key ${falKey}` }, signal: AbortSignal.timeout(10000) }
        );
        if (!resultRes.ok) {
          console.warn(`fal result fetch attempt ${attempt + 1} failed: ${resultRes.status}`);
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
          continue;
        }
        const result = await resultRes.json();
        video = result.video ?? null;
        break;
      } catch (e) {
        console.warn(`fal result fetch attempt ${attempt + 1} error:`, e);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }
    }

    const updated = await prisma.falVideoJob.update({
      where: { id: jobId },
      data: {
        status: video?.url ? "completed" : "failed",
        videoUrl: (video?.url as string | undefined) ?? null,
        fileSizeBytes: (video?.file_size as number | undefined) ?? null,
        widthPx: (video?.width as number | undefined) ?? null,
        heightPx: (video?.height as number | undefined) ?? null,
        fpS: (video?.fps as number | undefined) ?? null,
        durationSec: (video?.duration as number | undefined) ?? null,
        completedAt: new Date(),
        error: video?.url ? null : "Video URL not retrieved from fal.ai after 3 attempts",
      },
    });
    return NextResponse.json({ ...updated, prompt: stripEndpointMarker(updated.prompt) });
  }

  if (falStatus === "FAILED") {
    const updated = await prisma.falVideoJob.update({
      where: { id: jobId },
      data: { status: "failed", error: statusData.error || "Generation failed" },
    });
    return NextResponse.json({ ...updated, prompt: stripEndpointMarker(updated.prompt) });
  }

  // Still processing
  await prisma.falVideoJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });
  return NextResponse.json({ ...job, prompt: stripEndpointMarker(job.prompt), status: "processing" });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { jobId } = await params;
  await prisma.falVideoJob.delete({ where: { id: jobId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
