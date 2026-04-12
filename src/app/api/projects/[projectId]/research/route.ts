import { NextResponse } from "next/server";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { startResearch, runPipeline } from "@/services/research/orchestrator";

export const maxDuration = 60;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const jobId = await startResearch(projectId);

    // Use after() to run the pipeline after the response is sent
    // This keeps the serverless function alive on Vercel
    after(async () => {
      try {
        await runPipeline(projectId, jobId);
      } catch (err) {
        console.error("Research pipeline error:", err);
        await prisma.project.update({
          where: { id: projectId },
          data: { status: "ERROR" },
        }).catch(() => {});
      }
    });

    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Failed to start research:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start research" },
      { status: 500 }
    );
  }
}
