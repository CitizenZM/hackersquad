import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * PATCH /api/projects/{projectId}/creative/storyboards/{storyboardId}/frames
 * Updates a single frame within a storyboard's frames JSON array.
 * Body: { frameNumber: number, imageUrl?, transitionEffect?, approved?, feedback? }
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string; storyboardId: string }> }
) {
  const { projectId, storyboardId } = await params;
  const body = await request.json().catch(() => ({}));
  const { frameNumber, ...updates } = body;

  if (typeof frameNumber !== "number") {
    return NextResponse.json({ error: "frameNumber required" }, { status: 400 });
  }

  const storyboard = await prisma.storyboard.findFirst({
    where: { id: storyboardId, projectId },
  });

  if (!storyboard) {
    return NextResponse.json({ error: "Storyboard not found" }, { status: 404 });
  }

  // Merge updates into the specific frame
  const frames = (storyboard.frames as Array<Record<string, unknown>>).map(frame => {
    if (frame.frameNumber === frameNumber) {
      return { ...frame, ...updates };
    }
    return frame;
  });

  const updated = await prisma.storyboard.update({
    where: { id: storyboardId },
    data: { frames: frames as never },
  });

  return NextResponse.json({ ok: true, frames: updated.frames });
}
