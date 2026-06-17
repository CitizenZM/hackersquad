import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BookOpen, Clock, Award, Star, Users } from "lucide-react";
import { AGE_GROUP_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function ProgressPage() {
  const { parentId } = await getDefaultParent();

  const children = await prisma.childProfile.findMany({
    where: { parentId },
    orderBy: { createdAt: "asc" },
  });

  const childStats = await Promise.all(
    children.map(async (child) => {
      const [
        episodeCompletes,
        episodeStarts,
        playComplete,
        flashcardViews,
        vocabTaps,
        recentEvents,
      ] = await Promise.all([
        prisma.sessionEvent.count({
          where: { childProfileId: child.id, eventType: "EPISODE_COMPLETE" },
        }),
        prisma.sessionEvent.count({
          where: { childProfileId: child.id, eventType: "EPISODE_START" },
        }),
        prisma.sessionEvent.count({
          where: { childProfileId: child.id, eventType: "PLAY_COMPLETE" },
        }),
        prisma.sessionEvent.count({
          where: { childProfileId: child.id, eventType: "FLASHCARD_VIEW" },
        }),
        prisma.sessionEvent.count({
          where: { childProfileId: child.id, eventType: "VOCABULARY_TAP" },
        }),
        prisma.sessionEvent.findMany({
          where: {
            childProfileId: child.id,
            eventType: { in: ["EPISODE_START", "EPISODE_COMPLETE"] },
          },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            storyPack: { select: { title: true } },
            episode: { select: { episodeNumber: true, title: true } },
          },
        }),
      ]);

      // Calculate streak (consecutive days with activity)
      const allDays = await prisma.sessionEvent.findMany({
        where: { childProfileId: child.id },
        select: { createdAt: true },
        orderBy: { createdAt: "desc" },
      });
      const dayStrings = new Set(
        allDays.map((e) => e.createdAt.toISOString().slice(0, 10))
      );
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (dayStrings.has(d.toISOString().slice(0, 10))) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      const completionRate =
        episodeStarts > 0 ? Math.round((episodeCompletes / episodeStarts) * 100) : 0;

      // Top replayed stories
      const storyReplays = await prisma.sessionEvent.groupBy({
        by: ["storyPackId"],
        where: {
          childProfileId: child.id,
          eventType: "EPISODE_START",
        },
        _count: { storyPackId: true },
        orderBy: { _count: { storyPackId: "desc" } },
        take: 3,
      });
      const topStoryIds = storyReplays.map((s) => s.storyPackId);
      const topStories = topStoryIds.length > 0
        ? await prisma.storyPack.findMany({
            where: { id: { in: topStoryIds } },
            select: { id: true, title: true, storyGoal: true },
          })
        : [];
      const topStoriesWithCount = topStories.map((s) => ({
        ...s,
        plays: storyReplays.find((r) => r.storyPackId === s.id)?._count.storyPackId || 0,
      })).sort((a, b) => b.plays - a.plays);

      return {
        child,
        episodeCompletes,
        episodeStarts,
        playComplete,
        flashcardViews,
        vocabTaps,
        recentEvents,
        streak,
        completionRate,
        topStories: topStoriesWithCount,
      };
    })
  );

  return (
    <div>
      <ParentHeader
        title="Kid Progress"
        description="See how your children are engaging with stories"
      />
      <div className="p-6 space-y-6">
        {children.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No children yet</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a child profile first to start tracking progress
              </p>
            </CardContent>
          </Card>
        ) : (
          childStats.map((stats) => (
            <Card key={stats.child.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                    {stats.child.name[0].toUpperCase()}
                  </div>
                  <div>
                    <CardTitle>{stats.child.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Age {stats.child.age} &middot; {AGE_GROUP_LABELS[stats.child.ageGroup]}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Stat grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <StatBox
                    icon={<BookOpen className="h-4 w-4" />}
                    label="Episodes Done"
                    value={stats.episodeCompletes}
                    color="text-blue-600 bg-blue-50"
                  />
                  <StatBox
                    icon={<TrendingUp className="h-4 w-4" />}
                    label="Completion Rate"
                    value={`${stats.completionRate}%`}
                    color="text-green-600 bg-green-50"
                  />
                  <StatBox
                    icon={<Clock className="h-4 w-4" />}
                    label="Day Streak"
                    value={stats.streak}
                    color="text-orange-600 bg-orange-50"
                  />
                  <StatBox
                    icon={<Star className="h-4 w-4" />}
                    label="Words Tapped"
                    value={stats.vocabTaps}
                    color="text-purple-600 bg-purple-50"
                  />
                </div>

                {/* Activity rows */}
                <div>
                  <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    Recent Activity
                  </h4>
                  {stats.recentEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No activity yet. Publish a story to get started!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {stats.recentEvents.map((event) => (
                        <div
                          key={event.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={
                                event.eventType === "EPISODE_COMPLETE"
                                  ? "text-green-600"
                                  : "text-blue-600"
                              }
                            >
                              {event.eventType === "EPISODE_COMPLETE" ? "✓" : "▶"}
                            </span>
                            <span className="font-medium">
                              {event.storyPack?.title || "Unknown story"}
                            </span>
                            {event.episode && (
                              <span className="text-muted-foreground text-xs">
                                &middot; Ep {event.episode.episodeNumber}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(event.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top Stories */}
                {stats.topStories.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      Most Played Stories
                    </h4>
                    <div className="space-y-2">
                      {stats.topStories.map((story, i) => (
                        <div
                          key={story.id}
                          className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{["🥇", "🥈", "🥉"][i] || "📖"}</span>
                            <span className="font-medium">{story.title}</span>
                            <span className="text-xs text-muted-foreground">{story.storyGoal.toLowerCase()}</span>
                          </div>
                          <span className="text-xs font-semibold text-primary">
                            {story.plays} {story.plays === 1 ? "play" : "plays"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3 text-center text-xs text-muted-foreground pt-3 border-t">
                  <div>
                    <span className="block text-foreground font-semibold text-sm">
                      {stats.episodeStarts}
                    </span>
                    Episodes started
                  </div>
                  <div>
                    <span className="block text-foreground font-semibold text-sm">
                      {stats.flashcardViews}
                    </span>
                    Scenes viewed
                  </div>
                  <div>
                    <span className="block text-foreground font-semibold text-sm">
                      {stats.playComplete}
                    </span>
                    Full plays
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function StatBox({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md mb-2 ${color}`}
      >
        {icon}
      </div>
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}
