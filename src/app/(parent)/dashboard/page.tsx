import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Users, FileText, Mic, Play } from "lucide-react";
import { DemoSeedButton } from "@/components/parent/demo-seed-button";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { parentId } = await getDefaultParent();

  const [childCount, sourceCount, storyCount, publishedCount] = await Promise.all([
    prisma.childProfile.count({ where: { parentId } }),
    prisma.storySource.count({ where: { parentId } }),
    prisma.storyPack.count({ where: { parentId } }),
    prisma.storyPack.count({ where: { parentId, status: "PUBLISHED" } }),
  ]);

  const recentStories = await prisma.storyPack.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { childProfile: { select: { id: true, name: true } } },
  });

  return (
    <div>
      <ParentHeader
        title="Dashboard"
        description="Welcome to StoryNest Kids"
        action={storyCount === 0 ? <DemoSeedButton /> : undefined}
      />
      <div className="p-6 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/children">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Children</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{childCount}</div>
                <p className="text-xs text-muted-foreground">Profiles created</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/sources">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Sources</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sourceCount}</div>
                <p className="text-xs text-muted-foreground">Uploaded content</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/stories">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Stories</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{storyCount}</div>
                <p className="text-xs text-muted-foreground">{publishedCount} published</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/voices">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Voices</CardTitle>
                <Mic className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">-</div>
                <p className="text-xs text-muted-foreground">Voice profiles</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Get started with common tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link
                href="/sources/new"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-sm">Upload Content</div>
                  <div className="text-xs text-muted-foreground">
                    Add text, PDF, or document for story creation
                  </div>
                </div>
              </Link>
              <Link
                href="/stories/new"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <BookOpen className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-sm">Create Story Pack</div>
                  <div className="text-xs text-muted-foreground">
                    Transform content into story episodes
                  </div>
                </div>
              </Link>
              <Link
                href="/children/new"
                className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
              >
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium text-sm">Add Child Profile</div>
                  <div className="text-xs text-muted-foreground">
                    Set up a profile for your child
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Stories</CardTitle>
              <CardDescription>Your latest story packs</CardDescription>
            </CardHeader>
            <CardContent>
              {recentStories.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No stories yet. Upload content to get started!
                </p>
              ) : (
                <div className="space-y-3">
                  {recentStories.map((story) => (
                    <div
                      key={story.id}
                      className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent/50 transition-colors"
                    >
                      <Link href={`/stories/${story.id}`} className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{story.title}</div>
                        <div className="text-xs text-muted-foreground">
                          For {story.childProfile.name} &middot; {story.episodeCount} episodes
                        </div>
                      </Link>
                      <div className="flex items-center gap-2 ml-2 shrink-0">
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs">
                          {story.status.replace("_", " ")}
                        </span>
                        {story.status === "PUBLISHED" && (
                          <Link
                            href={`/play/${story.childProfile.id}`}
                            className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Play className="h-3 w-3" />
                            Play
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
