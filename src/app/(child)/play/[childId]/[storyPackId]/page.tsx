import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { EpisodePickerView } from "./episode-picker-view";

export default async function EpisodePickerPage({
  params,
}: {
  params: Promise<{ childId: string; storyPackId: string }>;
}) {
  const { childId, storyPackId } = await params;

  const storyPack = await prisma.storyPack.findFirst({
    where: { id: storyPackId, childProfileId: childId, status: "PUBLISHED" },
    include: {
      episodes: {
        orderBy: { episodeNumber: "asc" },
        include: {
          flashcardScenes: { orderBy: { sceneOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  if (!storyPack) notFound();

  // Get completed episodes
  const completedEvents = await prisma.sessionEvent.findMany({
    where: {
      childProfileId: childId,
      storyPackId,
      eventType: "EPISODE_COMPLETE",
    },
    select: { episodeId: true },
    distinct: ["episodeId"],
  });

  const completedSet = new Set(
    completedEvents.map((e) => e.episodeId).filter(Boolean)
  );

  // Find the first unplayed episode
  const nextEpisode = storyPack.episodes.find(
    (ep) => !completedSet.has(ep.id)
  );

  return (
    <EpisodePickerView
      childId={childId}
      storyPackId={storyPackId}
      title={storyPack.title}
      coverImageUrl={storyPack.coverImageUrl}
      episodes={storyPack.episodes.map((ep) => {
        const firstSentenceMatch = ep.scriptText?.match(/[^.!?]*[.!?]/);
        const teaser = firstSentenceMatch
          ? firstSentenceMatch[0].trim()
          : undefined;
        return {
          id: ep.id,
          episodeNumber: ep.episodeNumber,
          title: ep.title,
          teaser,
          thumbnailUrl: ep.flashcardScenes[0]?.imageUrl || null,
          state: completedSet.has(ep.id)
            ? ("completed" as const)
            : ep.id === nextEpisode?.id
            ? ("current" as const)
            : ("future" as const),
        };
      })}
      nextEpisodeId={nextEpisode?.id}
    />
  );
}
