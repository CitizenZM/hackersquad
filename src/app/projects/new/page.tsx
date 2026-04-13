import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="New Project"
        description="Set up a brand intelligence workspace"
      />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto">
          <ProjectForm />
        </div>
      </div>
    </div>
  );
}
