import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const [childCount, storyCount, episodeCount] = await Promise.all([
      prisma.childProfile.count(),
      prisma.storyPack.count({ where: { status: "PUBLISHED" } }),
      prisma.episode.count(),
    ]);

    return Response.json({
      status: "ok",
      app: "StoryNest Kids",
      version: "1.0.0",
      stats: {
        children: childCount,
        publishedStories: storyCount,
        episodes: episodeCount,
      },
      timestamp: new Date().toISOString(),
    });
  } catch {
    return Response.json({
      status: "ok",
      app: "StoryNest Kids",
      version: "1.0.0",
      db: "unreachable",
      timestamp: new Date().toISOString(),
    });
  }
}
