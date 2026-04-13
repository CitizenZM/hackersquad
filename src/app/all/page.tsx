import Link from "next/link";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FolderPlus, ArrowRight } from "lucide-react";
import { DeleteButton } from "@/components/projects/delete-button";

export const dynamic = "force-dynamic";

const statusEmoji: Record<string, string> = {
  DRAFT: "📝",
  RESEARCHING: "🔍",
  ANALYZED: "✅",
  GENERATING: "🎨",
  COMPLETE: "🎉",
  ERROR: "😢",
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
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-background to-purple-50">
      <Header
        title="All Projects"
        emoji="📁"
        description={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
      />
      <div className="px-4 py-5 sm:px-6 max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <Link href="/projects/new">
            <Button className="rounded-2xl font-bold gradient-fun border-0 shadow-md active:scale-95">
              <FolderPlus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🚀</div>
            <p className="text-purple-400 font-bold">No projects yet. Create one!</p>
          </div>
        ) : (
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2">
            {projects.map((project) => (
              <Card key={project.id} className="group relative rounded-3xl border-2 border-purple-200 bg-white fun-shadow-sm hover:border-purple-400 transition-all active:scale-[0.98]">
                <Link href={`/projects/${project.id}/overview`}>
                  <CardContent className="pt-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{statusEmoji[project.status] || "📋"}</span>
                        <h3 className="text-base font-black text-purple-900">
                          {project.brandName}
                        </h3>
                      </div>
                    </div>
                    {project.category && (
                      <p className="text-xs text-purple-400 font-bold mb-2">{project.category}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {project.competitors.map((c) => (
                        <Badge key={c.name} variant="outline" className="rounded-full text-[10px] font-bold border-pink-200 text-pink-600">
                          vs {c.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-3 text-[10px] font-bold text-purple-400">
                      <span>🎬 {project._count.contentAssets}</span>
                      <span>💡 {project._count.insights}</span>
                      <span>📝 {project._count.scripts}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-xs font-bold text-purple-600">
                      Open <ArrowRight className="h-3 w-3" />
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
