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
    <div className="min-h-screen">
      <Header
        title={project.brandName}
        status={project.status}
        description={
          [project.category, project.campaignGoal].filter(Boolean).join(" - ") ||
          undefined
        }
      />
      <TabNav projectId={projectId} />
      <div className="p-4 sm:p-6 md:p-8">{children}</div>
    </div>
  );
}
