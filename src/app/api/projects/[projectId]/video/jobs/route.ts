import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  if (jobId) {
    const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
    if (!job || job.projectId !== projectId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(job);
  }

  const jobs = await prisma.renderJob.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return NextResponse.json({ jobs });
}
