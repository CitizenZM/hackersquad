import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/projects/project-form";
import { Brain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Auto-redirect to the latest project's dashboard
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

  // No projects exist - show inline quick-start
  return (
    <div className="min-h-screen">
      <Header
        title="Welcome to CreativeIntel OS"
        description="AI-powered brand intelligence and creative strategy"
      />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="rounded-full bg-primary/10 p-5 mb-4">
              <Brain className="h-10 w-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold mb-1">
              Start your first brand analysis
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Enter a brand and its competitors. We&apos;ll crawl their websites,
              analyze content, and generate creative strategies.
            </p>
          </div>
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}
