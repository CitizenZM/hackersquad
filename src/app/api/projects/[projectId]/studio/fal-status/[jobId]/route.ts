import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { pollJob, stripEndpointMarker, PollError } from "@/services/video-gen/poll";

export const maxDuration = 30;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { jobId } = await params;

  const job = await prisma.falVideoJob.findUnique({ where: { id: jobId } });
  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  try {
    const outcome = await pollJob(job);
    return NextResponse.json({
      ...outcome.job,
      prompt: stripEndpointMarker(outcome.job.prompt),
      status: outcome.status,
    });
  } catch (e) {
    if (e instanceof PollError) {
      return NextResponse.json({ error: e.message }, { status: e.status });
    }
    throw e;
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { jobId } = await params;
  await prisma.falVideoJob.delete({ where: { id: jobId } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
