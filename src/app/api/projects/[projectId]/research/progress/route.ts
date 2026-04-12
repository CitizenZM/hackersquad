import { jobManager } from "@/services/job-manager";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");

  const job = jobId
    ? jobManager.getJob(jobId)
    : jobManager.getJobByProject(projectId);

  if (!job) {
    return new Response(
      JSON.stringify({ error: "No active job found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
      const initialEvent = `data: ${JSON.stringify({
        type: "progress",
        jobId: job.id,
        data: {
          status: job.status,
          progress: job.progress,
          currentStep: job.currentStep,
          steps: job.steps,
        },
      })}\n\n`;
      controller.enqueue(encoder.encode(initialEvent));

      if (job.status === "complete" || job.status === "error") {
        controller.close();
        return;
      }

      const unsubscribe = jobManager.subscribe(job.id, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
          if (event.type === "complete" || event.type === "error") {
            setTimeout(() => controller.close(), 100);
          }
        } catch {
          // Stream closed
        }
      });

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
