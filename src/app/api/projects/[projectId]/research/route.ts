import { NextResponse } from "next/server";
import { startResearch } from "@/services/research/orchestrator";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  try {
    const jobId = await startResearch(projectId);
    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("Failed to start research:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start research" },
      { status: 500 }
    );
  }
}
