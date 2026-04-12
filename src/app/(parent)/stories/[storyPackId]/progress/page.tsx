"use client";

import { useParams, useRouter } from "next/navigation";
import { ParentHeader } from "@/components/layout/parent-header";
import { PipelineProgress } from "@/components/parent/pipeline-progress";
import { Button } from "@/components/ui/button";

export default function StoryProgressPage() {
  const params = useParams<{ storyPackId: string }>();
  const router = useRouter();

  return (
    <div>
      <ParentHeader
        title="Generating Story Pack"
        description="Your story is being created with AI"
      />
      <div className="p-6 max-w-2xl">
        <PipelineProgress
          storyPackId={params.storyPackId}
          onComplete={() => {
            // Auto-redirect after a short delay
            setTimeout(() => {
              router.push(`/stories/${params.storyPackId}`);
              router.refresh();
            }, 2000);
          }}
        />
        <div className="mt-4">
          <Button variant="outline" onClick={() => router.push("/stories")}>
            Back to Stories
          </Button>
        </div>
      </div>
    </div>
  );
}
