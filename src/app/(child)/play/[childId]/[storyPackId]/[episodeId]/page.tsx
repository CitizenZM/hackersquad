import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StoryPlayer } from "@/components/child/story-player";

export default async function EpisodePlayerPage({
  params,
}: {
  params: Promise<{ childId: string; storyPackId: string; episodeId: string }>;
}) {
  const { childId, storyPackId, episodeId } = await params;

  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, storyPackId },
    include: {
      flashcardScenes: { orderBy: { sceneOrder: "asc" } },
      vocabularyCards: true,
      storyPack: {
        select: {
          id: true,
          title: true,
          childProfileId: true,
          episodes: {
            orderBy: { episodeNumber: "asc" },
            select: { id: true, episodeNumber: true },
          },
        },
      },
    },
  });

  if (!episode || episode.storyPack.childProfileId !== childId) {
    notFound();
  }

  const allEpisodes = episode.storyPack.episodes;
  const currentIdx = allEpisodes.findIndex((e) => e.id === episodeId);
  const nextEpisode = currentIdx < allEpisodes.length - 1
    ? allEpisodes[currentIdx + 1]
    : undefined;

  return (
    <StoryPlayer
      childId={childId}
      storyPackId={storyPackId}
      episodeId={episodeId}
      episodeTitle={episode.title}
      episodeNumber={episode.episodeNumber}
      audioUrl={episode.audioUrl}
      scenes={episode.flashcardScenes}
      vocabWords={episode.vocabularyCards}
      nextEpisodeId={nextEpisode?.id}
      totalEpisodes={allEpisodes.length}
    />
  );
}
