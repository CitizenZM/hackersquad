import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  try {
    const { parentId } = await getDefaultParent();

    const { storyPackId } = await params;

    const storyPack = await prisma.storyPack.findFirst({
      where: { id: storyPackId, parentId: parentId },
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
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
