import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/header";
import { TabNav } from "@/components/layout/tab-nav";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });

  if (!project) notFound();

  return (
    <div>
      <Header
        title={project.brandName}
        status={project.status}
        description={
          [project.category, project.campaignGoal].filter(Boolean).join(" · ") ||
          undefined
        }
      />
      <TabNav projectId={projectId} />
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {children}
      </div>
    </div>
  );
}
