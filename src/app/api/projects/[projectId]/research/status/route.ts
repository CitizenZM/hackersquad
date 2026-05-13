import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getActiveJobForProject,
  getJob,
} from "@/services/research/job-progress";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  const job =
    (jobId ? await getJob(jobId) : null) ??
    (await getActiveJobForProject(projectId)) ??
    (await prisma.researchJob.findFirst({
      where: { projectId },
      orderBy: { createdAt: "desc" },
    }));

  if (!job) {
    return NextResponse.json({ status: "idle" });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    currentStep: job.currentStep,
    steps: job.steps,
    error: job.error,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
  });
}
