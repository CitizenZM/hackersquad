import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Play } from "lucide-react";

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

  return (
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-4">
          <Link
            href={`/play/${childId}`}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-child-surface shadow-md"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{storyPack.title}</h1>
            <p className="text-muted-foreground">
              {storyPack.episodes.length} episode{storyPack.episodes.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {storyPack.episodes.map((ep) => (
            <Link
              key={ep.id}
              href={`/play/${childId}/${storyPackId}/${ep.id}`}
              className="group flex items-center gap-4 rounded-2xl bg-child-surface p-4 shadow-md hover:shadow-xl transition-all"
            >
              <div className="relative">
                {ep.flashcardScenes[0]?.imageUrl ? (
                  <img
                    src={ep.flashcardScenes[0].imageUrl}
                    alt={ep.title}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary">
                    {ep.episodeNumber}
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Play className="h-8 w-8 text-white" fill="white" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-primary">
                  Episode {ep.episodeNumber}
                </p>
                <h3 className="text-lg font-bold">{ep.title}</h3>
                <p className="text-sm text-muted-foreground">
                  ~{Math.ceil(ep.durationTarget / 60)} minutes
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
