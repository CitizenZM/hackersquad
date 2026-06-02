import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const sel = await prisma.campaignSelection.findUnique({ where: { projectId } });
  return NextResponse.json(sel || {});
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));

  const sel = await prisma.campaignSelection.upsert({
    where: { projectId },
    create: { projectId, ...body },
    update: body,
  });
  return NextResponse.json(sel);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));

  // Handle confirm action
  if (body.action === "confirm") {
    const sel = await prisma.campaignSelection.upsert({
      where: { projectId },
      create: { projectId, confirmed: true, confirmedAt: new Date() },
      update: { confirmed: true, confirmedAt: new Date() },
    });
    return NextResponse.json(sel);
  }

  const sel = await prisma.campaignSelection.upsert({
    where: { projectId },
    create: { projectId, ...body },
    update: body,
  });
  return NextResponse.json(sel);
}
