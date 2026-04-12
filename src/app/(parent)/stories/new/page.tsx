import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getAuthFromCookies } from "@/lib/auth";
import { ParentHeader } from "@/components/layout/parent-header";
import { WizardShell } from "@/components/parent/story-wizard/wizard-shell";

export default async function NewStoryPage({
  searchParams,
}: {
  searchParams: Promise<{ sourceId?: string }>;
}) {
  const auth = await getAuthFromCookies();
  if (!auth) redirect("/login");

  const resolvedParams = await searchParams;

  const [sources, children] = await Promise.all([
    prisma.storySource.findMany({
      where: { parentId: auth.parentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, wordCount: true },
    }),
    prisma.childProfile.findMany({
      where: { parentId: auth.parentId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, age: true, ageGroup: true },
    }),
  ]);

  return (
    <div>
      <ParentHeader
        title="Create Story Pack"
        description="Transform your content into personalized story episodes"
      />
      <div className="p-6">
        <WizardShell
          sources={sources}
          children={children}
          preSelectedSourceId={resolvedParams.sourceId}
        />
      </div>
    </div>
  );
}
