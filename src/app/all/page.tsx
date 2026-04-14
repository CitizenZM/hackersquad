import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { DeleteButton } from "@/components/projects/delete-button";
import { StatusBadge, StatusLevel } from "@/components/dashboard/status-badge";

export const dynamic = "force-dynamic";

const statusLevelMap: Record<string, StatusLevel> = {
  DRAFT: "neutral",
  RESEARCHING: "ai",
  ANALYZED: "healthy",
  GENERATING: "ai",
  COMPLETE: "healthy",
  ERROR: "urgent",
};

export default async function AllProjectsPage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      competitors: { select: { name: true } },
      _count: { select: { contentAssets: true, insights: true, scripts: true } },
    },
  });

  return (
    <div>
      <Header
        title="Projects"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/projects/new">
            <Button className="h-9 rounded-md bg-foreground text-background hover:bg-foreground/90 font-medium">
              <Plus className="mr-1.5 h-4 w-4" />
              New project
            </Button>
          </Link>
        }
      />
      <div className="px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {projects.length === 0 ? (
          <div className="rounded-lg border border-border bg-card py-16 text-center">
            <p className="text-sm text-muted-foreground">No projects yet.</p>
            <Link
              href="/projects/new"
              className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-foreground hover:underline"
            >
              Create your first project <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="text-left font-medium px-4 py-2.5">Brand</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden sm:table-cell">Status</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden md:table-cell">Category</th>
                    <th className="text-left font-medium px-3 py-2.5 hidden lg:table-cell">Competitors</th>
                    <th className="text-right font-medium px-3 py-2.5 hidden sm:table-cell">Content</th>
                    <th className="text-right font-medium px-3 py-2.5 hidden md:table-cell">Insights</th>
                    <th className="w-10"></th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {projects.map((project) => (
                    <tr key={project.id} className="group hover:bg-muted/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/projects/${project.id}/overview`} className="block">
                          <p className="font-medium">{project.brandName}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                            {project.category} · {project._count.contentAssets} content
                          </p>
                        </Link>
                      </td>
                      <td className="px-3 py-3 hidden sm:table-cell">
                        <StatusBadge level={statusLevelMap[project.status] || "neutral"}>
                          {project.status.charAt(0) + project.status.slice(1).toLowerCase()}
                        </StatusBadge>
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {project.category || "—"}
                      </td>
                      <td className="px-3 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                        {project.competitors.map(c => c.name).join(", ") || "—"}
                      </td>
                      <td className="px-3 py-3 text-right num text-muted-foreground hidden sm:table-cell">
                        {project._count.contentAssets}
                      </td>
                      <td className="px-3 py-3 text-right num text-muted-foreground hidden md:table-cell">
                        {project._count.insights}
                      </td>
                      <td className="px-2 py-3">
                        <DeleteButton projectId={project.id} />
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/projects/${project.id}/overview`}
                          className="text-muted-foreground group-hover:text-foreground"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
