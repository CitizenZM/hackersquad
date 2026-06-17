import Link from "next/link";
import { prisma } from "@/lib/db";
import { getDefaultParent } from "@/lib/default-parent";
import { ParentHeader } from "@/components/layout/parent-header";
import { WizardShell } from "@/components/parent/story-wizard/wizard-shell";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Users, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceId?: string }>;
}) {
  const { parentId } = await getDefaultParent();

  const resolvedParams = await searchParams;

  const [sources, children] = await Promise.all([
    prisma.storySource.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, wordCount: true },
    }),
    prisma.childProfile.findMany({
      where: { parentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, age: true, ageGroup: true },
    }),
  ]);

  const missingChildren = children.length === 0;
  const missingSources = sources.length === 0;

  return (
    <div>
      <ParentHeader
        title="Create Story Pack"
        description="Transform your content into personalized story episodes"
      />
      <div className="p-6">
        {missingChildren || missingSources ? (
          <Card className="max-w-lg">
            <CardContent className="pt-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Before creating a story pack you need to set up a couple of things first:
              </p>
              {missingChildren && (
                <Link
                  href="/children/new"
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-sm">Add a child profile first</div>
                      <div className="text-xs text-muted-foreground">
                        Stories are personalized to a specific child
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
              {missingSources && (
                <Link
                  href="/sources/new"
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-amber-500" />
                    <div>
                      <div className="font-medium text-sm">You need to upload content first</div>
                      <div className="text-xs text-muted-foreground">
                        Upload a PDF, document, or paste text to use as source material
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <WizardShell
            sources={sources}
            children={children}
            preSelectedSourceId={resolvedParams.sourceId}
          />
        )}
      </div>
    </div>
  );
}
