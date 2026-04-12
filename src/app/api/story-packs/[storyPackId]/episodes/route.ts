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
  });
  if (!storyPack) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const episodes = await prisma.episode.findMany({
    where: { storyPackId },
    orderBy: { episodeNumber: "asc" },
    include: {
      flashcardScenes: { orderBy: { sceneOrder: "asc" } },
      vocabularyCards: true,
    },
  });

  return Response.json(episodes);
}
