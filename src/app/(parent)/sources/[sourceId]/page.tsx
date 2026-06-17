import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { notFound } from "next/navigation";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { SOURCE_TYPE_LABELS, estimateEpisodeCount } from "@/lib/constants";
import { BookOpen, FileText } from "lucide-react";
import { SourceTextPreview } from "./source-text-preview";

export const dynamic = "force-dynamic";

export default async function SourceDetailPage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { sourceId } = await params;
  const { parentId } = await getDefaultParent();

  const source = await prisma.storySource.findFirst({
    where: { id: sourceId, parentId },
    include: {
      storyPacks: {
        select: { id: true, title: true, status: true, episodeCount: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!source) {
    notFound();
  }

  const episodeEstimate = estimateEpisodeCount(source.wordCount);

  return (
    <div>
      <ParentHeader
        title={source.title}
        description={SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType}
        action={
          <Link href={`/stories/new?sourceId=${source.id}`}>
            <Button>
              <BookOpen className="mr-2 h-4 w-4" />
              Create Story from This
            </Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6">
        {/* Source metadata */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Type</dt>
                <dd className="font-medium">
                  {SOURCE_TYPE_LABELS[source.sourceType] ?? source.sourceType}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Words</dt>
                <dd className="font-medium">{source.wordCount.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Language</dt>
                <dd className="font-medium uppercase">{source.language}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground mb-0.5">Episodes</dt>
                <dd className="flex items-center gap-1 font-medium">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  ~{episodeEstimate}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Raw text preview */}
        {source.rawText && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Content Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SourceTextPreview text={source.rawText} />
            </CardContent>
          </Card>
        )}

        {/* Story packs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Story Packs</CardTitle>
          </CardHeader>
          <CardContent>
            {source.storyPacks.length === 0 ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                No story packs yet.{" "}
                <Link
                  href={`/stories/new?sourceId=${source.id}`}
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Create one now.
                </Link>
              </div>
            ) : (
              <ul className="divide-y">
                {source.storyPacks.map((pack) => (
                  <li key={pack.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium text-sm">{pack.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {pack.episodeCount}{" "}
                        {pack.episodeCount === 1 ? "episode" : "episodes"} &middot;{" "}
                        {pack.status}
                      </p>
                    </div>
                    <Link href={`/stories/${pack.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
