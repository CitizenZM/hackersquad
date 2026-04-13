import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 via-background to-purple-50">
      <Header
        title="New Project"
        emoji="🔍"
        description="Let's discover what makes a brand tick!"
      />
      <div className="px-4 py-5 sm:px-6 max-w-lg mx-auto">
        <div className="bg-white rounded-3xl p-5 fun-shadow">
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}
