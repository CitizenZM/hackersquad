import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildStoryboardCreateData } from "@/services/ai/storyboard-generator";

export const maxDuration = 60;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const storyboards = await prisma.storyboard.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(storyboards);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const { scriptId } = body;

  try {
    const script = await prisma.script.findUnique({ where: { id: scriptId } });
    if (!script || script.projectId !== projectId) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const campaignSel = await prisma.campaignSelection
      .findUnique({ where: { projectId } })
      .catch(() => null);

    const data = await buildStoryboardCreateData(projectId, script, project, campaignSel);
    const storyboard = await prisma.storyboard.create({ data });

    return NextResponse.json(storyboard);
  } catch (err) {
    console.error("Storyboard generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate storyboard" },
      { status: 500 }
    );
  }
}
