import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectForm } from "@/components/projects/project-form";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const latestProject = await prisma.project.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { id: true, status: true },
  });

  if (latestProject) {
    const dest =
      latestProject.status === "DRAFT"
        ? `/projects/${latestProject.id}/research`
        : `/projects/${latestProject.id}/overview`;
    redirect(dest);
  }

  return (
    <div>
      <div className="border-b border-border">
        <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight">CreativeIntel OS</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Turn brand and competitor intelligence into production-ready creative.
          </p>
        </div>
      </div>
      <div className="px-4 py-8 sm:px-6 lg:px-8 max-w-2xl mx-auto">
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-base font-semibold tracking-tight">Start a new analysis</h2>
          <p className="text-xs text-muted-foreground mt-1 mb-5">
            Enter a brand and its competitors. We&apos;ll crawl, analyze, and generate creative strategies.
          </p>
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}
