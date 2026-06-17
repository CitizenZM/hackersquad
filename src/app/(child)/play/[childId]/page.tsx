import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StoryShelf } from "./story-shelf";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ childId: string }>;
}): Promise<Metadata> {
  const { childId } = await params;
  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { name: true },
  });
  return {
    title: child ? `${child.name}'s Stories | StoryNest Kids` : "StoryNest Kids",
  };
}

export default async function StoryShelfPage({
  params,
}: {
  params: Promise<{ childId: string }>;
}) {
  const { childId } = await params;

  const child = await prisma.childProfile.findUnique({
    where: { id: childId },
    select: { id: true, name: true },
  });
  if (!child) notFound();

  const storyPacks = await prisma.storyPack.findMany({
    where: { childProfileId: childId, status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { episodes: true } },
    },
  });

  // Get completed episode counts per story pack
  const completedCounts = await Promise.all(
    storyPacks.map(async (pack) => {
      const count = await prisma.sessionEvent.count({
        where: {
          childProfileId: childId,
          storyPackId: pack.id,
          eventType: "EPISODE_COMPLETE",
        },
      });
      return { storyPackId: pack.id, completed: count };
    })
  );

  const completedMap = Object.fromEntries(
    completedCounts.map((c) => [c.storyPackId, c.completed])
  );

  // Calculate listening streak (consecutive days)
  const allEvents = await prisma.sessionEvent.findMany({
    where: { childProfileId: childId },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  let streak = 0;
  if (allEvents.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const uniqueDays = new Set(
      allEvents.map((e) => {
        const d = new Date(e.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );
    const sortedDays = Array.from(uniqueDays).sort((a, b) => b - a);

    // Check if today or yesterday is included
    const todayMs = today.getTime();
    const yesterdayMs = todayMs - 86400000;
    if (sortedDays[0] === todayMs || sortedDays[0] === yesterdayMs) {
      streak = 1;
      for (let i = 1; i < sortedDays.length; i++) {
        if (sortedDays[i - 1] - sortedDays[i] === 86400000) {
          streak++;
        } else break;
      }
    }
  }

  // Fetch favorited story pack IDs
  const favoriteEvents = await prisma.sessionEvent.findMany({
    where: {
      childProfileId: childId,
      eventType: "PLAY_START",
    },
    select: { storyPackId: true, metadata: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const favoriteIds = new Set<string>();
  for (const event of favoriteEvents) {
    const meta = event.metadata as Record<string, unknown> | null;
    if (meta?.type === "favorite" && meta?.action === "add") {
      favoriteIds.add(event.storyPackId);
    }
  }

  // Continue listening
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

  return (
    <StoryShelf
      childId={child.id}
      childName={child.name}
      streak={streak}
      storyPacks={storyPacks.map((p) => ({
        id: p.id,
        title: p.title,
        coverImageUrl: p.coverImageUrl,
        episodeCount: p._count.episodes,
        completedEpisodes: completedMap[p.id] || 0,
        isFavorite: favoriteIds.has(p.id),
      }))}
      continueData={
        lastEvent?.storyPack && lastEvent?.episode
          ? {
              storyPackId: lastEvent.storyPack.id,
              storyTitle: lastEvent.storyPack.title,
              coverImageUrl: lastEvent.storyPack.coverImageUrl,
              episodeId: lastEvent.episode.id,
              episodeNumber: lastEvent.episode.episodeNumber,
              episodeTitle: lastEvent.episode.title,
            }
          : null
      }
    />
  );
}
