import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  try {
    const { parentId } = await getDefaultParent();
    const { storyPackId } = await params;

    const original = await prisma.storyPack.findFirst({
      where: { id: storyPackId, parentId },
      include: {
        episodes: {
          include: {
            flashcardScenes: true,
            vocabularyCards: true,
          },
        },
      },
    });

    if (!original) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const copy = await prisma.storyPack.create({
      data: {
        sourceId: original.sourceId,
        childProfileId: original.childProfileId,
        parentId,
        title: `${original.title} (Copy)`,
        storyGoal: original.storyGoal,
        narrationMode: original.narrationMode,
        visualStyle: original.visualStyle,
        status: "PUBLISHED",
        episodeCount: original.episodeCount,
        coverImageUrl: original.coverImageUrl,
        metadata: original.metadata ?? undefined,
      },
    });

    for (const ep of original.episodes) {
      const newEp = await prisma.episode.create({
        data: {
          storyPackId: copy.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          scriptText: ep.scriptText,
          sourceExcerpt: ep.sourceExcerpt,
          wordBudget: ep.wordBudget,
          durationTarget: ep.durationTarget,
          audioUrl: ep.audioUrl,
        },
      });

      for (const scene of ep.flashcardScenes) {
        await prisma.flashcardScene.create({
          data: {
            episodeId: newEp.id,
            sceneOrder: scene.sceneOrder,
            prompt: scene.prompt,
            imageUrl: scene.imageUrl,
            textSnippet: scene.textSnippet,
            duration: scene.duration,
          },
        });
      }

      for (const vocab of ep.vocabularyCards) {
        await prisma.vocabularyCard.create({
          data: {
            episodeId: newEp.id,
            word: vocab.word,
            definition: vocab.definition,
            example: vocab.example,
            imageUrl: vocab.imageUrl,
          },
        });
      }
    }

    return Response.json({ id: copy.id, title: copy.title });
  } catch (error) {
    console.error("Duplicate error:", error);
    return Response.json({ error: "Failed to duplicate" }, { status: 500 });
  }
}
