import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, ArrowRight, Brain } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      competitors: { select: { name: true } },
      _count: { select: { contentAssets: true, insights: true, scripts: true } },
    },
  });

  const statusColors: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    RESEARCHING: "bg-blue-100 text-blue-700",
    ANALYZED: "bg-green-100 text-green-700",
    GENERATING: "bg-purple-100 text-purple-700",
    COMPLETE: "bg-emerald-100 text-emerald-700",
    ERROR: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen">
      <Header
        title="Projects"
        description="Your brand intelligence workspaces"
      />
      <div className="p-8">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-primary/10 p-6 mb-6">
              <Brain className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No projects yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md">
              Create your first project to start analyzing brands, competitors,
              and generating creative strategies.
            </p>
            <Link href="/projects/new">
              <Button size="lg">
                <FolderPlus className="mr-2 h-5 w-5" />
                Create First Project
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </p>
              <Link href="/projects/new">
                <Button>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}/overview`}
                >
                  <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
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
                        <p className="text-sm text-muted-foreground">
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
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
