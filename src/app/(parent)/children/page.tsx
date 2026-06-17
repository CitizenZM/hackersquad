import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AGE_GROUP_LABELS } from "@/lib/constants";
import { Plus, User } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const { parentId } = await getDefaultParent();

  const children = await prisma.childProfile.findMany({
    where: { parentId },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { storyPacks: true } } },
  });

  return (
    <div>
      <ParentHeader
        title="Children"
        description="Manage your children's profiles"
        action={
          <Link href="/children/new">
            <Button><Plus className="mr-2 h-4 w-4" /> Add Child</Button>
          </Link>
        }
      />
      <div className="p-6">
        {children.length === 0 ? (
          <div className="text-center py-12">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No children yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add a child profile to start creating personalized stories
            </p>
            <Link href="/children/new">
              <Button className="mt-4"><Plus className="mr-2 h-4 w-4" /> Add Child</Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => (
              <Link key={child.id} href={`/children/${child.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-lg font-bold">
                        {child.name[0].toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold">{child.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Age {child.age} &middot; {AGE_GROUP_LABELS[child.ageGroup]}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(child.interests as string[]).length > 0
                            ? (child.interests as string[]).join(", ")
                            : "No interests set"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {child._count.storyPacks}{" "}
                          {child._count.storyPacks === 1 ? "story" : "stories"}
                        </p>
                      </div>
                    </div>
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
