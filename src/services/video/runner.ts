import path from "node:path";
import { prisma } from "@/lib/db";
import { downloadVideo, ensureWorkDir, detectPlatform } from "./downloader";
import { transcribeAudio } from "./transcribe";
import { selectHighlights } from "./highlight";
import { shortsifyClip } from "./shortsify";
import { generateProductVideo } from "./moneyprinter";

type Updater = (patch: { status?: string; progress?: number; step?: string; error?: string; output?: unknown; outputPath?: string }) => Promise<void>;

function makeUpdater(jobId: string): Updater {
  return async (patch) => {
    await prisma.renderJob
      .update({
        where: { id: jobId },
        data: {
          status: patch.status,
          progress: patch.progress,
          currentStep: patch.step,
          error: patch.error,
          output: patch.output as never,
          outputPath: patch.outputPath,
        },
      })
      .catch(() => {});
  };
}

export async function runImport(jobId: string, projectId: string, input: { url: string }) {
  const update = makeUpdater(jobId);
  await update({ status: "running", progress: 5, step: "Downloading" });
  try {
    const dl = await downloadVideo(input.url, jobId);
    await update({ progress: 50, step: "Transcribing" });
    const tx = await transcribeAudio(dl.localPath);

    await update({ progress: 85, step: "Persisting" });
    const refData = {
      platform: dl.metadata.platform || detectPlatform(input.url),
      localPath: dl.localPath,
      durationSec: dl.metadata.duration ?? null,
      width: dl.metadata.width ?? null,
      height: dl.metadata.height ?? null,
      transcript: tx.text || null,
      language: tx.language ?? null,
      metadata: dl.metadata as never,
    };
    const vr = await prisma.videoReference.upsert({
      where: { projectId_sourceUrl: { projectId, sourceUrl: input.url } },
      create: { projectId, sourceUrl: input.url, ...refData },
      update: refData,
    });

    const ca = await prisma.contentAsset.upsert({
      where: { projectId_url: { projectId, url: input.url } },
      create: {
        projectId,
        type: vr.platform === "youtube" ? "YOUTUBE_VIDEO" : vr.platform === "tiktok" ? "TIKTOK_VIDEO" : "WEB_MENTION",
        title: dl.metadata.title,
        url: input.url,
        description: dl.metadata.description?.slice(0, 1000) || null,
        thumbnailUrl: dl.metadata.thumbnail ?? null,
        platform: vr.platform,
        publishedAt: dl.metadata.upload_date ? parseDate(dl.metadata.upload_date) : null,
        viewCount: dl.metadata.view_count ?? null,
        likeCount: dl.metadata.like_count ?? null,
        transcript: tx.text || null,
        dataSource: "PUBLIC_WEB",
        rawData: dl.metadata as never,
      },
      update: {
        title: dl.metadata.title,
        description: dl.metadata.description?.slice(0, 1000) || null,
        thumbnailUrl: dl.metadata.thumbnail ?? null,
        viewCount: dl.metadata.view_count ?? null,
        likeCount: dl.metadata.like_count ?? null,
        transcript: tx.text || null,
        rawData: dl.metadata as never,
      },
    });

    await prisma.videoReference.update({
      where: { id: vr.id },
      data: { contentAssetId: ca.id },
    });

    await update({
      status: "complete",
      progress: 100,
      step: "Done",
      output: {
        videoReferenceId: vr.id,
        contentAssetId: ca.id,
        title: dl.metadata.title,
        durationSec: dl.metadata.duration,
        transcriptLength: tx.text.length,
        language: tx.language,
        platform: vr.platform,
      },
      outputPath: dl.localPath,
    });
  } catch (err) {
    await update({ status: "error", error: err instanceof Error ? err.message : "Import failed" });
  }
}

export async function runShortsify(
  jobId: string,
  projectId: string,
  input: { videoReferenceId?: string; sourceUrl?: string; targetDurationSec?: number; aspectRatio?: "9:16" | "16:9" | "1:1" }
) {
  const update = makeUpdater(jobId);
  try {
    let ref = input.videoReferenceId
      ? await prisma.videoReference.findUnique({ where: { id: input.videoReferenceId } })
      : null;

    // If no existing reference, perform an inline import first.
    if (!ref) {
      if (!input.sourceUrl) throw new Error("sourceUrl or videoReferenceId required");
      await update({ status: "running", progress: 5, step: "Downloading source" });
      const dl = await downloadVideo(input.sourceUrl, jobId);
      await update({ progress: 30, step: "Transcribing source" });
      const tx = await transcribeAudio(dl.localPath);
      const refData = {
        platform: dl.metadata.platform || detectPlatform(input.sourceUrl),
        localPath: dl.localPath,
        durationSec: dl.metadata.duration ?? null,
        width: dl.metadata.width ?? null,
        height: dl.metadata.height ?? null,
        transcript: tx.text || null,
        language: tx.language ?? null,
        metadata: dl.metadata as never,
      };
      ref = await prisma.videoReference.upsert({
        where: { projectId_sourceUrl: { projectId, sourceUrl: input.sourceUrl } },
        create: { projectId, sourceUrl: input.sourceUrl, ...refData },
        update: refData,
      });
    }

    if (!ref.localPath) throw new Error("Reference has no local video file");

    await update({ status: "running", progress: 55, step: "Selecting highlight" });
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { brand: true },
    });

    // Re-fetch transcript segments via a fresh whisper run if not stored as JSON.
    // (Persisting segments would balloon the row; cheap to redo on the same file.)
    const tx = await transcribeAudio(ref.localPath);
    const highlights = await selectHighlights(tx.segments, {
      targetDurationSec: input.targetDurationSec ?? 30,
      brandContext: project?.brand?.targetAudience || project?.brandName,
      maxHighlights: 1,
    });
    if (highlights.length === 0) throw new Error("No highlight could be selected");
    const h = highlights[0];

    await update({ progress: 75, step: "Rendering clip" });
    const outDir = await ensureWorkDir(jobId);
    const result = await shortsifyClip({
      videoPath: ref.localPath,
      start: h.start,
      end: h.end,
      outputDir: outDir,
      outputName: `short-${ref.id}.mp4`,
      segments: tx.segments,
      hookText: h.hookText,
      aspectRatio: input.aspectRatio ?? "9:16",
    });

    await update({
      status: "complete",
      progress: 100,
      step: "Done",
      output: {
        videoReferenceId: ref.id,
        clipPath: result.outputPath,
        durationSec: result.durationSec,
        width: result.width,
        height: result.height,
        hookText: h.hookText,
        rationale: h.reason,
        score: h.score,
      },
      outputPath: result.outputPath,
    });
  } catch (err) {
    await update({ status: "error", error: err instanceof Error ? err.message : "Shortsify failed" });
  }
}

export async function runGenerate(
  jobId: string,
  projectId: string,
  input: { scriptId?: string; script?: string; aspectRatio?: "9:16" | "16:9" | "1:1" }
) {
  const update = makeUpdater(jobId);
  try {
    let scriptText = input.script;
    if (!scriptText && input.scriptId) {
      const s = await prisma.script.findUnique({ where: { id: input.scriptId } });
      if (!s) throw new Error("Script not found");
      const hook = ((s.hookVariants as string[]) || [])[0] || "";
      const cta = ((s.ctaVariants as string[]) || [])[0] || "";
      scriptText = [hook, s.body, cta].filter(Boolean).join("\n\n");
    }
    if (!scriptText) throw new Error("script or scriptId required");

    await update({ status: "running", progress: 10, step: "Rendering" });
    const outDir = await ensureWorkDir(jobId);
    const result = await generateProductVideo({
      script: scriptText,
      outputDir: outDir,
      aspectRatio: input.aspectRatio ?? "9:16",
    });

    await update({
      status: "complete",
      progress: 100,
      step: "Done",
      output: { mp4: result.outputPath },
      outputPath: result.outputPath,
    });
  } catch (err) {
    await update({ status: "error", error: err instanceof Error ? err.message : "Generation failed" });
  }
}

function parseDate(yyyymmdd: string): Date | null {
  if (!/^\d{8}$/.test(yyyymmdd)) return null;
  return new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`);
}

export async function createRenderJob(
  projectId: string,
  kind: "import" | "shortsify" | "generate",
  input: unknown
): Promise<string> {
  const job = await prisma.renderJob.create({
    data: {
      projectId,
      kind,
      status: "pending",
      input: input as never,
      startedAt: new Date(),
    },
  });
  return job.id;
}
