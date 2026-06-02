import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const jobs = await prisma.falVideoJob.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json(jobs);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.falVideoJob.deleteMany({ where: { projectId } });
  return NextResponse.json({ ok: true });
}
