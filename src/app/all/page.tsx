import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, ArrowRight, Trash2 } from "lucide-react";
import { DeleteButton } from "@/components/projects/delete-button";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  RESEARCHING: "bg-blue-100 text-blue-700",
  ANALYZED: "bg-green-100 text-green-700",
  GENERATING: "bg-purple-100 text-purple-700",
  COMPLETE: "bg-emerald-100 text-emerald-700",
  ERROR: "bg-red-100 text-red-700",
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
    <div className="min-h-screen">
      <Header
        title="All Projects"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
      />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="flex justify-end mb-6">
          <Link href="/projects/new">
            <Button>
              <FolderPlus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">
            No projects yet. Create one to get started.
          </p>
        ) : (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Card key={project.id} className="group relative hover:border-primary/50 transition-colors">
                <Link href={`/projects/${project.id}/overview`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base sm:text-lg">
                        {project.brandName}
                      </CardTitle>
                      <Badge
                        className={statusColors[project.status] || ""}
                        variant="secondary"
                      >
                        {project.status.charAt(0) +
                          project.status.slice(1).toLowerCase()}
                      </Badge>
                    </div>
                    {project.category && (
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {project.category}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.competitors.map((c) => (
                        <Badge key={c.name} variant="outline" className="text-xs">
                          vs {c.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>{project._count.contentAssets} content</span>
                      <span>{project._count.insights} insights</span>
                      <span>{project._count.scripts} scripts</span>
                    </div>
                    <div className="flex items-center gap-1 mt-3 text-xs text-primary">
                      View dashboard <ArrowRight className="h-3 w-3" />
                    </div>
                  </CardContent>
                </Link>
                <DeleteButton projectId={project.id} />
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
