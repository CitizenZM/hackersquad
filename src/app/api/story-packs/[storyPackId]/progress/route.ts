import { getAuthParent, unauthorized } from "@/lib/auth-middleware";
import { jobManager } from "@/services/job-manager";
import { prisma } from "@/lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ storyPackId: string }> }
) {
  const auth = await getAuthParent(request);
  if (!auth) return unauthorized();

  const { storyPackId } = await params;

  // Find latest pipeline job for this story pack
  const pipelineJob = await prisma.pipelineJob.findFirst({
    where: { storyPackId },
    orderBy: { createdAt: "desc" },
  });

  if (!pipelineJob) {
    return Response.json({ error: "No pipeline job found" }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send current state immediately
      const currentJob = jobManager.getJob(pipelineJob.id);
      if (currentJob) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "progress",
              jobId: pipelineJob.id,
              data: {
                status: currentJob.status,
                progress: currentJob.progress,
                currentStep: currentJob.currentStep,
                steps: currentJob.steps,
              },
            })}\n\n`
          )
        );

        if (currentJob.status === "complete" || currentJob.status === "error") {
          controller.close();
          return;
        }
      }

      const unsubscribe = jobManager.subscribe(pipelineJob.id, (event) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
          if (event.type === "complete" || event.type === "error") {
            unsubscribe();
            controller.close();
          }
        } catch {
          unsubscribe();
        }
      });

      request.signal.addEventListener("abort", () => {
        unsubscribe();
        try { controller.close(); } catch { /* already closed */ }
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
