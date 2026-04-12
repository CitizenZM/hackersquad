import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen, Home } from "lucide-react";

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

  // Check for continue point
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
    <div className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Hi, {child.name}!</h1>
            <p className="text-lg text-muted-foreground">What story shall we read today?</p>
          </div>
          <Link
            href="/play"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-child-surface shadow-md hover:shadow-lg transition-shadow"
          >
            <Home className="h-6 w-6" />
          </Link>
        </div>

        {/* Continue Banner */}
        {lastEvent?.storyPack && lastEvent?.episode && (
          <Link
            href={`/play/${childId}/${lastEvent.storyPack.id}/${lastEvent.episode.id}`}
            className="mb-8 block rounded-2xl bg-primary/10 p-6 hover:bg-primary/15 transition-colors"
          >
            <p className="text-sm font-medium text-primary mb-1">Continue Listening</p>
            <p className="text-xl font-bold">{lastEvent.storyPack.title}</p>
            <p className="text-sm text-muted-foreground">
              Episode {lastEvent.episode.episodeNumber}: {lastEvent.episode.title}
            </p>
          </Link>
        )}

        {/* Story Shelf */}
        {storyPacks.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-xl text-muted-foreground">
              No stories yet!
            </p>
            <p className="text-muted-foreground">
              Ask a parent to create a story for you.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {storyPacks.map((pack) => (
              <Link
                key={pack.id}
                href={`/play/${childId}/${pack.id}`}
                className="group overflow-hidden rounded-2xl bg-child-surface shadow-md hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="aspect-square relative">
                  {pack.coverImageUrl ? (
                    <img
                      src={pack.coverImageUrl}
                      alt={pack.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10">
                      <BookOpen className="h-16 w-16 text-primary/40" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-bold leading-tight">{pack.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {pack._count.episodes} episode{pack._count.episodes !== 1 ? "s" : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
