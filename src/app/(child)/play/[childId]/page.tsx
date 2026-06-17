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
      storyPacks={storyPacks.map((p) => ({
        id: p.id,
        title: p.title,
        coverImageUrl: p.coverImageUrl,
        episodeCount: p._count.episodes,
        completedEpisodes: completedMap[p.id] || 0,
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
