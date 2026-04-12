import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { ParentHeader } from "@/components/layout/parent-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { STORY_PACK_STATUS_LABELS, STORY_GOAL_LABELS } from "@/lib/constants";
import { Plus, BookOpen } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StoriesPage() {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/login");

  const storyPacks = await prisma.storyPack.findMany({
    where: { parentId: auth.parentId },
    orderBy: { createdAt: "desc" },
    include: {
      childProfile: { select: { name: true } },
      source: { select: { title: true } },
      _count: { select: { episodes: true } },
    },
  });

  function statusVariant(status: string) {
    switch (status) {
      case "PUBLISHED": return "default" as const;
      case "REVIEW_READY": return "secondary" as const;
      case "PROCESSING": return "outline" as const;
      case "ERROR": return "destructive" as const;
      default: return "outline" as const;
    }
  }

  return (
    <div>
      <ParentHeader
        title="Stories"
        description="Your story packs"
        action={
          <Link href="/stories/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Create Story</Button>
          </Link>
        }
      />
      <div className="p-6">
        {storyPacks.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No stories yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first story pack from uploaded content
            </p>
            <Link href="/stories/new">
              <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Create Story</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {storyPacks.map((pack) => (
              <Link key={pack.id} href={`/stories/${pack.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-4">
                      {pack.coverImageUrl ? (
                        <img
                          src={pack.coverImageUrl}
                          alt={pack.title}
                          className="h-14 w-14 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10">
                          <BookOpen className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold">{pack.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          For {pack.childProfile.name} &middot;{" "}
                          {pack._count.episodes} episodes &middot;{" "}
                          {STORY_GOAL_LABELS[pack.storyGoal]}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusVariant(pack.status)}>
                      {STORY_PACK_STATUS_LABELS[pack.status]}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
