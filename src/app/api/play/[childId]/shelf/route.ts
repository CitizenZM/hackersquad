import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  const { childId } = await params;

  const storyPacks = await prisma.storyPack.findMany({
    where: {
      childProfileId: childId,
      status: "PUBLISHED",
    },
    orderBy: { createdAt: "desc" },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        select: { id: true, episodeNumber: true, title: true },
      },
      _count: { select: { episodes: true } },
    },
  });

  return Response.json(storyPacks);
}
