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
    <div className="min-h-screen bg-gradient-to-b from-purple-100 via-pink-50 to-amber-50">
      <div className="px-4 py-8 sm:px-6 max-w-lg mx-auto">
        <div className="text-center mb-8 bounce-in">
          <div className="text-6xl mb-3">🧠</div>
          <h1 className="text-3xl font-black text-purple-900 mb-2">
            CreativeIntel OS
          </h1>
          <p className="text-purple-400 font-bold text-sm">
            Your AI brand detective! Enter a brand and let the magic begin.
          </p>
        </div>
        <div className="bg-white rounded-3xl p-5 fun-shadow">
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}
