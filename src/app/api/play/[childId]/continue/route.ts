import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ childId: string }> }
) {
  try {
    const { childId } = await params;

    const lastEvent = await prisma.sessionEvent.findFirst({
      where: {
        childProfileId: childId,
        eventType: { in: ["EPISODE_START", "PLAY_PAUSE"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        storyPack: { select: { id: true, title: true, coverImageUrl: true } },
        episode: { select: { id: true, episodeNumber: true, title: true } },
      },
    });

    return Response.json(lastEvent);
  } catch (error) {
    console.error("Route error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
