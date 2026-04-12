import { ParentHeader } from "@/components/layout/parent-header";
import { SourceUploadForm } from "@/components/parent/source-upload-form";

export default function NewSourcePage() {
  return (
    <div>
      <ParentHeader title="Upload Content" description="Add text, PDF, or document for story creation" />
      <div className="p-6">
        <SourceUploadForm />
      </div>
    </div>
  );
}
