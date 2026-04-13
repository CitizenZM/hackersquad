import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { runStoryPipeline } from "@/services/ai/story-pipeline";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  const { parentId } = await getDefaultParent();

  const { storyPackId } = await params;
  const storyPack = await prisma.storyPack.findFirst({
    where: { id: storyPackId, parentId: parentId },
  });

  if (!storyPack) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (storyPack.status !== "DRAFT" && storyPack.status !== "ERROR") {
    return Response.json(
      { error: "Story pack is already processing or complete" },
      { status: 400 }
    );
  }

  // Create pipeline job record
  const pipelineJob = await prisma.pipelineJob.create({
    data: {
      storyPackId,
      status: "PENDING",
      startedAt: new Date(),
    },
  });

  // Fire and forget - pipeline runs in background
  runStoryPipeline(storyPackId, pipelineJob.id).catch((err) => {
    console.error("Pipeline failed:", err);
  });

  return Response.json({ jobId: pipelineJob.id, status: "started" });
}
