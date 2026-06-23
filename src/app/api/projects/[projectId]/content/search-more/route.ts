import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { searchYouTubeVideos } from "@/services/research/youtube-service";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import { buildContentScoringPrompt } from "@/services/ai/prompts/content-scoring";
import { NarrativeType } from "@/generated/prisma/enums";

export const maxDuration = 60;

const contentScoreSchema = z.object({
  scores: z.array(z.object({
    videoId: z.string(),
    overallScore: z.number(),
    hookStrength: z.number(),
    productVisibility: z.number(),
    storytellingArc: z.number(),
    ctaQuality: z.number(),
    emotionalAppeal: z.number(),
    pacing: z.number(),
    hookText: z.string(),
    narrativeType: z.string(),
    keyMessages: z.array(z.string()),
    analysis: z.string(),
    contentCategory: z.string(),
  })),
});

const QUERY_VARIATIONS = [
  (brand: string) => `${brand} official commercial english`,
  (brand: string) => `${brand} US ad campaign 2024`,
  (brand: string) => `${brand} brand video english official`,
  (brand: string) => `${brand} product launch ad english`,
  (brand: string) => `${brand} TV commercial spot`,
  (brand: string) => `${brand} marketing ad campaign official`,
];

function validNarrativeType(val: string): NarrativeType {
  const valid: NarrativeType[] = [
    "PROBLEM_SOLUTION","TESTIMONIAL","DEMONSTRATION","LIFESTYLE",
    "EDUCATIONAL","COMPARISON","STORY_ARC","UGC_STYLE","TREND_RIDING","BEFORE_AFTER",
  ];
  return valid.includes(val as NarrativeType) ? (val as NarrativeType) : "DEMONSTRATION";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json().catch(() => ({}));
  const offset = body.offset || 0;

  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Get existing video IDs to avoid duplicates
    const existing = await prisma.contentAsset.findMany({
      where: { projectId },
      select: { url: true },
    });
    const existingUrls = new Set(existing.map((a) => a.url));

    // Pick a query variation based on offset
    const queryIdx = Math.floor(offset / 10) % QUERY_VARIATIONS.length;
    const query = QUERY_VARIATIONS[queryIdx](project.brandName);

    // Search YouTube with the varied query (US/English filtered)
    const videos = await searchYouTubeVideos(query, 10, undefined, project.brandName);

    // Filter out duplicates
    const newVideos = videos.filter(
      (v) => !existingUrls.has(`https://youtube.com/watch?v=${v.videoId}`)
    );

    if (newVideos.length === 0) {
      return NextResponse.json({ added: 0, message: "No new videos found" });
    }

    // AI-score the new videos
    const prompt = buildContentScoringPrompt(project.brandName, newVideos);
    const result = await analyzeWithClaude({
      systemPrompt: prompt.system,
      userPrompt: prompt.user,
      responseSchema: contentScoreSchema,
      maxTokens: 4096,
    });

    let added = 0;
    for (const score of result.scores) {
      const video = newVideos.find((v) => v.videoId === score.videoId);
      if (!video) continue;

      const ytUrl = `https://youtube.com/watch?v=${video.videoId}`;
      const res = await prisma.contentAsset.upsert({
        where: { projectId_url: { projectId, url: ytUrl } },
        create: {
          projectId,
          type: "YOUTUBE_VIDEO",
          title: video.title,
          url: ytUrl,
          thumbnailUrl: video.thumbnailUrl,
          description: video.description,
          publishedAt: video.publishedAt ? new Date(video.publishedAt) : null,
          platform: "YouTube",
          viewCount: video.viewCount,
          likeCount: video.likeCount,
          commentCount: video.commentCount,
          engagementRate: video.viewCount > 0
            ? ((video.likeCount + video.commentCount) / video.viewCount) * 100
            : 0,
          metricsSource: "PUBLIC_WEB",
          overallScore: score.overallScore,
          hookStrength: score.hookStrength,
          productVisibility: score.productVisibility,
          storytellingArc: score.storytellingArc,
          ctaQuality: score.ctaQuality,
          emotionalAppeal: score.emotionalAppeal,
          pacing: score.pacing,
          hookText: score.hookText,
          narrativeType: validNarrativeType(score.narrativeType),
          keyMessages: score.keyMessages,
          contentCategory: score.contentCategory || null,
          dataSource: "PUBLIC_WEB",
        },
        update: {
          title: video.title, thumbnailUrl: video.thumbnailUrl, description: video.description,
          viewCount: video.viewCount, likeCount: video.likeCount, commentCount: video.commentCount,
          overallScore: score.overallScore, hookStrength: score.hookStrength,
          productVisibility: score.productVisibility, storytellingArc: score.storytellingArc,
          ctaQuality: score.ctaQuality, emotionalAppeal: score.emotionalAppeal, pacing: score.pacing,
          hookText: score.hookText, narrativeType: validNarrativeType(score.narrativeType),
          keyMessages: score.keyMessages, contentCategory: score.contentCategory || null,
        },
      });
      void res;
      added++;
    }

    return NextResponse.json({ added });
  } catch (err) {
    console.error("Search-more failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed" },
      { status: 500 }
    );
  }
}
