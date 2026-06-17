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
    return Response.json(
      { error: "Story pack not found or you don't have access" },
      { status: 404 }
    );
  }

  if (storyPack.status === "PROCESSING") {
    return Response.json(
      { error: "This story is already being generated. Check the progress page." },
      { status: 400 }
    );
  }

  if (storyPack.status === "REVIEW_READY" || storyPack.status === "PUBLISHED") {
    return Response.json(
      { error: "This story has already been generated. Use Regenerate to create a new version." },
      { status: 400 }
    );
  }

  if (storyPack.status !== "DRAFT" && storyPack.status !== "ERROR") {
    return Response.json(
      { error: "Story pack cannot be generated in its current state." },
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
