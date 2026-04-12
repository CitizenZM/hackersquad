import { prisma } from "@/lib/db";
import { getAuthParent, unauthorized } from "@/lib/auth-middleware";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const { storyPackId } = await params;
  const storyPack = await prisma.storyPack.findFirst({
    where: { id: storyPackId, parentId: auth.parentId },
    include: {
      source: { select: { title: true, wordCount: true, sourceType: true } },
      childProfile: { select: { name: true, age: true, ageGroup: true } },
      episodes: {
        orderBy: { episodeNumber: "asc" },
        include: {
          flashcardScenes: { orderBy: { sceneOrder: "asc" } },
          vocabularyCards: true,
        },
      },
      pipelineJobs: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!storyPack) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(storyPack);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const { storyPackId } = await params;
  const result = await prisma.storyPack.deleteMany({
    where: { id: storyPackId, parentId: auth.parentId },
  });

  if (result.count === 0) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
