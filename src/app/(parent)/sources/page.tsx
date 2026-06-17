import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SOURCE_TYPE_LABELS, estimateEpisodeCount } from "@/lib/constants";
import { Plus, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  const { parentId } = await getDefaultParent();

  const sources = await prisma.storySource.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      sourceType: true,
      title: true,
      wordCount: true,
      language: true,
      createdAt: true,
      _count: { select: { storyPacks: true } },
    },
  });

  return (
    <div>
      <ParentHeader
        title="Sources"
        description="Your uploaded content for story creation"
        action={
          <Link href="/sources/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Upload Content</Button>
          </Link>
        }
      />
      <div className="p-6">
        {sources.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No sources yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload text, PDFs, or documents to create stories from
            </p>
            <Link href="/sources/new">
              <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Upload Content</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <Card key={source.id} className="transition-colors hover:bg-accent/50">
                <CardContent className="flex items-center justify-between py-4">
                  <Link
                    href={`/sources/${source.id}`}
                    className="flex flex-1 items-center gap-4 min-w-0"
                  >
                    <FileText className="h-8 w-8 shrink-0 text-primary/60" />
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{source.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {SOURCE_TYPE_LABELS[source.sourceType]} &middot;{" "}
                        {source.wordCount.toLocaleString()} words &middot;{" "}
                        ~{estimateEpisodeCount(source.wordCount)} episodes &middot;{" "}
                        {source._count.storyPacks} story packs
                      </p>
                    </div>
                  </Link>
                  <Link href={`/stories/new?sourceId=${source.id}`} className="ml-4 shrink-0">
                    <Button variant="outline" size="sm">Create Story</Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
