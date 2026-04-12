import { Header } from "@/components/layout/header";
import { ProjectForm } from "@/components/projects/project-form";

export default function NewProjectPage() {
  return (
    <div className="min-h-screen">
      <Header
        title="New Project"
        description="Set up a brand intelligence workspace"
      />
      <div className="p-8">
        <ProjectForm />
      </div>
    </div>
  );
}
