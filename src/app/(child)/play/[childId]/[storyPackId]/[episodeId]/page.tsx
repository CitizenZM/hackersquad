import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { StoryPlayer } from "@/components/child/story-player";
import type { StorytellerTone } from "@/lib/hooks/use-voice-guide";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ childId: string; storyPackId: string; episodeId: string }>;
}): Promise<Metadata> {
  const { episodeId, storyPackId } = await params;
  const episode = await prisma.episode.findFirst({
    where: { id: episodeId, storyPackId },
    select: { title: true, episodeNumber: true, storyPack: { select: { title: true } } },
  });
  if (!episode) return { title: "StoryNest Kids" };
  return {
    title: `${episode.title} - ${episode.storyPack.title} | StoryNest Kids`,
    description: `Listen to Episode ${episode.episodeNumber}: ${episode.title}`,
  };
}

// Map story goal → default storyteller tone
function toneForStoryGoal(goal: string): StorytellerTone {
  switch (goal) {
    case "BEDTIME":
      return "bedtime";
    case "ENTERTAIN":
    case "MORAL_LESSON":
      return "playful";
    case "EDUCATE":
    case "VOCABULARY":
    default:
      return "gentle";
  }
}

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
          storyGoal: true,
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
      defaultTone={toneForStoryGoal(episode.storyPack.storyGoal)}
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
