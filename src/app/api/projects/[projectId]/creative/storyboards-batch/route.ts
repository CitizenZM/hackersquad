import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildStoryboardCreateData } from "@/services/ai/storyboard-generator";

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { scriptIds } = body as { scriptIds: string[] };

  if (!scriptIds || !Array.isArray(scriptIds) || scriptIds.length === 0) {
    return NextResponse.json({ error: "scriptIds array required" }, { status: 400 });
  }

  try {
    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const [scripts, campaignSel] = await Promise.all([
      prisma.script.findMany({ where: { id: { in: scriptIds }, projectId } }),
      prisma.campaignSelection.findUnique({ where: { projectId } }).catch(() => null),
    ]);

    const promises = scripts.map(async (script) => {
      try {
        const data = await buildStoryboardCreateData(projectId, script, project, campaignSel);
        return await prisma.storyboard.create({ data });
      } catch (err) {
        console.error("Storyboard failed for script:", script.id, err);
        return null;
      }
    });

    const storyboards = (await Promise.all(promises)).filter((s) => s !== null);
    return NextResponse.json({ storyboards });
  } catch (err) {
    console.error("Storyboards batch failed:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
