import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { childId } = await params;

    // Get all vocabulary cards from published stories for this child
    const vocabCards = await prisma.vocabularyCard.findMany({
      where: {
        episode: {
          storyPack: {
            childProfileId: childId,
            status: "PUBLISHED",
          },
        },
      },
      include: {
        episode: {
          select: {
            title: true,
            storyPack: { select: { title: true } },
          },
        },
      },
      take: 50,
    });

    return Response.json(vocabCards);
  } catch (error) {
    console.error("Vocab error:", error);
    return Response.json([], { status: 500 });
  }
}
