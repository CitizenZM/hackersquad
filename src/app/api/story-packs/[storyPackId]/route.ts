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
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  try {
    const { parentId } = await getDefaultParent();

    const { storyPackId } = await params;
    const body = await request.json();

    const storyPack = await prisma.storyPack.findFirst({
      where: { id: storyPackId, parentId },
    });

    if (!storyPack) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.storyPack.update({
      where: { id: storyPackId },
      data: { status: body.status },
    });

    return Response.json(updated);
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  try {
    const { parentId } = await getDefaultParent();

    const { storyPackId } = await params;
    const result = await prisma.storyPack.deleteMany({
      where: { id: storyPackId, parentId: parentId },
    });

    if (result.count === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
