import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { createStoryPackSchema } from "@/lib/validations";
import { estimateEpisodeCount } from "@/lib/constants";

export async function GET(request: Request) {
  const { parentId } = await getDefaultParent();

  const storyPacks = await prisma.storyPack.findMany({
    where: { parentId: parentId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      childProfile: { select: { name: true, ageGroup: true } },
      source: { select: { title: true, wordCount: true } },
      _count: { select: { episodes: true } },
    },
  });

  return Response.json(storyPacks);
}

export async function POST(request: Request) {
  const { parentId } = await getDefaultParent();

  try {
    const body = await request.json();
    const data = createStoryPackSchema.parse(body);

    // Verify source and child belong to this parent
    const [source, child] = await Promise.all([
      prisma.storySource.findFirst({
        where: { id: data.sourceId, parentId: parentId },
      }),
      prisma.childProfile.findFirst({
        where: { id: data.childProfileId, parentId: parentId },
      }),
    ]);

    if (!source) {
      return Response.json({ error: "Source not found" }, { status: 404 });
    }
    if (!child) {
      return Response.json({ error: "Child profile not found" }, { status: 404 });
    }

    const storyPack = await prisma.storyPack.create({
      data: {
        sourceId: data.sourceId,
        childProfileId: data.childProfileId,
        parentId: parentId,
        title: data.title,
        storyGoal: data.storyGoal,
        narrationMode: data.narrationMode,
        visualStyle: data.visualStyle,
        episodeCount: estimateEpisodeCount(source.wordCount),
        metadata: { description: data.description || "" },
      },
    });

    return Response.json(
      { ...storyPack, source: { wordCount: source.wordCount } },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return Response.json({ error: "Invalid input", details: error }, { status: 400 });
    }
    console.error("Create story pack error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
