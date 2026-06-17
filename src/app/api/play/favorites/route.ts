import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const { storyPackId, childId, favorite } = await request.json();

    if (favorite) {
      // Create a favorite event
      await prisma.sessionEvent.create({
        data: {
          childProfileId: childId,
          storyPackId,
          eventType: "PLAY_START",
          metadata: JSON.parse(JSON.stringify({ type: "favorite", action: "add" })),
        },
      });
    }
    // We track favorites via metadata on events for now

    return Response.json({ success: true, favorite });
  } catch (error) {
    console.error("Favorite error:", error);
    return Response.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const childId = url.searchParams.get("childId");
    if (!childId) return Response.json([]);

    const favorites = await prisma.sessionEvent.findMany({
      where: {
        childProfileId: childId,
        eventType: "PLAY_START",
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    // Extract story pack IDs that have "favorite" metadata
    const favoriteIds = new Set<string>();
    for (const event of favorites) {
      const meta = event.metadata as Record<string, unknown> | null;
      if (meta?.type === "favorite" && meta?.action === "add") {
        favoriteIds.add(event.storyPackId);
      }
    }

    return Response.json(Array.from(favoriteIds));
  } catch (error) {
    console.error("Get favorites error:", error);
    return Response.json([], { status: 500 });
  }
}
