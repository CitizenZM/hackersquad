import { ParentHeader } from "@/components/layout/parent-header";
import { ChildProfileForm } from "@/components/parent/child-profile-form";

export default function NewChildPage() {
  return (
    <div>
      <ParentHeader title="Add Child" description="Create a new child profile" />
      <div className="p-6">
        <ChildProfileForm />
      </div>
    </div>
  );
}
