import { prisma } from "@/lib/db";
import { jobManager } from "@/services/job-manager";
import { crawlWebsite, type CrawlResult } from "./website-crawler";
import { searchYouTubeVideos, type YouTubeVideo } from "./youtube-service";
import { runAnalysisPipeline } from "@/services/ai/analysis-pipeline";

const STEPS = [
  "Crawl Brand Website",
  "Crawl Competitor Websites",
  "YouTube Research",
  "Web Mentions",
  "AI Analysis",
];

export async function startResearch(projectId: string): Promise<string> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brand: true, competitors: true },
  });

  if (!project) throw new Error("Project not found");

  // Create job
  const jobRecord = await prisma.researchJob.create({
    data: {
      projectId,
      status: "running",
      startedAt: new Date(),
      steps: STEPS.map((name) => ({ name, status: "pending" })),
    },
  });

  const jobId = jobRecord.id;
  jobManager.createJob(jobId, projectId, STEPS);
  jobManager.startJob(jobId);

  // Update project status
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "RESEARCHING" },
  });

  return jobId;
}

export async function runPipeline(projectId: string, jobId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brand: true, competitors: true },
  });
  if (!project) throw new Error("Project not found");

  let brandCrawl: CrawlResult | null = null;
  const competitorCrawls = new Map<string, CrawlResult>();
  let brandVideos: YouTubeVideo[] = [];
  const competitorVideos = new Map<string, YouTubeVideo[]>();

  // Step 1: Crawl brand website
  jobManager.startStep(jobId, "Crawl Brand Website");
  if (project.brandUrl) {
    try {
      jobManager.updateStepProgress(jobId, "Crawl Brand Website", 30, `Crawling ${project.brandUrl}...`);
      brandCrawl = await crawlWebsite(project.brandUrl);
      jobManager.updateStepProgress(jobId, "Crawl Brand Website", 100, `Crawled successfully: found ${brandCrawl.headings.length} headings, ${brandCrawl.ctaTexts.length} CTAs`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      jobManager.failStep(jobId, "Crawl Brand Website", msg);
    }
  } else {
    jobManager.updateStepProgress(jobId, "Crawl Brand Website", 100, "No brand URL provided, skipping");
  }
  jobManager.completeStep(jobId, "Crawl Brand Website");

  // Step 2: Crawl competitor websites
  jobManager.startStep(jobId, "Crawl Competitor Websites");
  for (let i = 0; i < project.competitors.length; i++) {
    const comp = project.competitors[i];
    if (!comp.url) continue;
    try {
      const progress = Math.round(((i + 1) / project.competitors.length) * 100);
      jobManager.updateStepProgress(jobId, "Crawl Competitor Websites", progress, `Crawling ${comp.name}...`);
      const crawl = await crawlWebsite(comp.url);
      competitorCrawls.set(comp.id, crawl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      jobManager.updateStepProgress(jobId, "Crawl Competitor Websites", 0, `Failed to crawl ${comp.name}: ${msg}`);
    }
  }
  jobManager.completeStep(jobId, "Crawl Competitor Websites");

  // Step 3: YouTube research
  jobManager.startStep(jobId, "YouTube Research");
  try {
    jobManager.updateStepProgress(jobId, "YouTube Research", 20, `Searching YouTube for ${project.brandName}...`);
    brandVideos = await searchYouTubeVideos(`${project.brandName} review ad`);
    jobManager.updateStepProgress(jobId, "YouTube Research", 50, `Found ${brandVideos.length} brand videos`);

    for (let i = 0; i < project.competitors.length; i++) {
      const comp = project.competitors[i];
      const videos = await searchYouTubeVideos(`${comp.name} review ad`);
      competitorVideos.set(comp.id, videos);
      jobManager.updateStepProgress(
        jobId,
        "YouTube Research",
        50 + Math.round(((i + 1) / project.competitors.length) * 50),
        `Found ${videos.length} videos for ${comp.name}`
      );
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    jobManager.failStep(jobId, "YouTube Research", msg);
  }
  jobManager.completeStep(jobId, "YouTube Research");

  // Step 4: Web mentions (simplified for MVP)
  jobManager.startStep(jobId, "Web Mentions");
  jobManager.updateStepProgress(jobId, "Web Mentions", 50, "Collecting web mentions...");

  // Create some mention-type content assets from crawl data
  if (brandCrawl) {
    const mentions = brandCrawl.testimonials.slice(0, 3);
    for (const mention of mentions) {
      await prisma.contentAsset.create({
        data: {
          projectId,
          type: "WEB_MENTION",
          title: `Website mention: ${mention.slice(0, 60)}...`,
          url: project.brandUrl || "",
          description: mention,
          platform: "Website",
          dataSource: "PUBLIC_WEB",
        },
      });
    }
  }
  jobManager.updateStepProgress(jobId, "Web Mentions", 100, "Web mentions collected");
  jobManager.completeStep(jobId, "Web Mentions");

  // Step 5: AI Analysis
  await runAnalysisPipeline(
    projectId,
    jobId,
    brandCrawl,
    competitorCrawls,
    brandVideos,
    competitorVideos
  );

  // Finalize
  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ANALYZED" },
  });

  await prisma.researchJob.update({
    where: { id: jobId },
    data: {
      status: "complete",
      progress: 100,
      completedAt: new Date(),
    },
  });

  jobManager.completeJob(jobId);
}
