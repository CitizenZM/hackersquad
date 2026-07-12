import { NextResponse } from "next/server";
import { pollVeoOperation, PollError } from "@/services/video-gen/poll";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; operationId: string }> }
) {
  const { operationId } = await params;

  try {
    const result = await pollVeoOperation(operationId);

    if (result.done) {
      return NextResponse.json({
        done: true,
        videoUrl: result.videoUrl ?? null,
        operationId,
      });
    }

    return NextResponse.json({
      done: false,
      operationId,
      metadata: result.metadata || null,
    });
  } catch (err) {
    if (err instanceof PollError) {
      return NextResponse.json({ error: err.message, done: false }, { status: err.status });
    }
    console.error("Video status check failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed", done: false },
      { status: 500 }
    );
  }
}
