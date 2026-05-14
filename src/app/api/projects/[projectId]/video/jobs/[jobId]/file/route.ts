import { NextResponse } from "next/server";
import { createReadStream, statSync } from "node:fs";
import { ReadableStream } from "node:stream/web";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ projectId: string; jobId: string }> }
) {
  const { projectId, jobId } = await params;
  const job = await prisma.renderJob.findUnique({ where: { id: jobId } });
  if (!job || job.projectId !== projectId || !job.outputPath) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const stat = statSync(job.outputPath);
    const stream = createReadStream(job.outputPath);
    const webStream = new ReadableStream({
      start(controller) {
        stream.on("data", (chunk) => controller.enqueue(chunk));
        stream.on("end", () => controller.close());
        stream.on("error", (err) => controller.error(err));
      },
    });
    return new NextResponse(webStream as unknown as BodyInit, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(stat.size),
        "Content-Disposition": `inline; filename="${job.id}.mp4"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "File not accessible" }, { status: 410 });
  }
}
