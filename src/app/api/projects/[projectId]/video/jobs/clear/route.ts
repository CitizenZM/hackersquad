import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Bulk-delete terminal (complete | error) jobs for a project.
// Active jobs (pending | running) are preserved.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const result = await prisma.renderJob.deleteMany({
    where: { projectId, status: { in: ["complete", "error"] } },
  });
  return NextResponse.json({ deleted: result.count });
}
