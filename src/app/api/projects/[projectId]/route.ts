import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brand: true,
      competitors: true,
      _count: {
        select: {
          contentAssets: true,
          insights: true,
          scripts: true,
          storyboards: true,
          creativeVariants: true,
        },
      },
    },
  });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json(project);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const allowed = ["brandUrl", "productUrl", "productName", "campaignGoal", "briefingText", "category", "name"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }
  const project = await prisma.project.update({ where: { id: projectId }, data });
  return NextResponse.json(project);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  await prisma.project.delete({ where: { id: projectId } });
  return NextResponse.json({ success: true });
}
