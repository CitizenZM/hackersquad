import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  STORY_PACK_STATUS_LABELS,
  STORY_GOAL_LABELS,
  VISUAL_STYLE_LABELS,
} from "@/lib/constants";
import { BookOpen, Play, Check } from "lucide-react";
import { ApproveButton } from "@/components/parent/approve-button";
import { FlagButton } from "@/components/parent/flag-button";

export default async function StoryPackDetailPage({
  params,
}: {
  params: Promise<{ storyPackId: string }>;
}) {
  const { parentId } = await getDefaultParent();

  const { storyPackId } = await params;
  const storyPack = await prisma.storyPack.findFirst({
    where: { id: storyPackId, parentId },
    include: {
      source: { select: { title: true, wordCount: true } },
      childProfile: { select: { id: true, name: true, age: true } },
      episodes: {
        orderBy: { episodeNumber: "asc" },
        select: {
          id: true,
          episodeNumber: true,
          title: true,
          wordBudget: true,
          durationTarget: true,
          audioUrl: true,
          scriptText: true,
          flashcardScenes: { orderBy: { sceneOrder: "asc" }, take: 1 },
          _count: { select: { flashcardScenes: true, vocabularyCards: true } },
        },
      },
    },
  });

  if (!storyPack) notFound();

  const isProcessing = storyPack.status === "PROCESSING";
  const needsReview = storyPack.status === "REVIEW_READY";
  const isPublished = storyPack.status === "PUBLISHED";

  return (
    <div>
      <ParentHeader
        title={storyPack.title}
        description={`For ${storyPack.childProfile.name} (age ${storyPack.childProfile.age})`}
        action={
          <div className="flex gap-2">
            {isProcessing && (
              <Link href={`/stories/${storyPackId}/progress`}>
                <Button variant="outline">View Progress</Button>
              </Link>
            )}
            {needsReview && (
              <ApproveButton storyPackId={storyPackId} />
            )}
            {isPublished && (
              <Link href={`/play/${storyPack.childProfile.id}`}>
                <Button><Play className="mr-2 h-4 w-4" /> Open Player</Button>
              </Link>
            )}
          </div>
        }
      />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Status</div>
              <Badge className="mt-1">{STORY_PACK_STATUS_LABELS[storyPack.status]}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Episodes</div>
              <div className="text-xl font-bold mt-1">{storyPack.episodes.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Goal</div>
              <div className="font-medium mt-1">{STORY_GOAL_LABELS[storyPack.storyGoal]}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm text-muted-foreground">Visual Style</div>
              <div className="font-medium mt-1">{VISUAL_STYLE_LABELS[storyPack.visualStyle]}</div>
            </CardContent>
          </Card>
        </div>

        {storyPack.episodes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Episodes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {storyPack.episodes.map((ep) => (
                  <div
                    key={ep.id}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    {ep.flashcardScenes[0]?.imageUrl ? (
                      <img
                        src={ep.flashcardScenes[0].imageUrl}
                        alt={ep.title}
                        className="h-16 w-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                        <BookOpen className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">
                        Episode {ep.episodeNumber}: {ep.title}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {ep.wordBudget} words &middot;{" "}
                        ~{Math.ceil(ep.durationTarget / 60)} min &middot;{" "}
                        {ep._count.flashcardScenes} scenes &middot;{" "}
                        {ep._count.vocabularyCards} vocab words
                      </div>
                      {ep.audioUrl && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                          <Check className="h-3 w-3" /> Audio ready
                        </div>
                      )}
                      {ep.scriptText && (
                        <details className="mt-2">
                          <summary className="text-xs text-primary cursor-pointer hover:underline">
                            Preview story text
                          </summary>
                          <p className="mt-1 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                            {ep.scriptText.slice(0, 500)}...
                          </p>
                        </details>
                      )}
                      {isPublished && (
                        <div className="mt-2">
                          <FlagButton storyPackId={storyPackId} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
