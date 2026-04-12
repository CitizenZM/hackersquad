import { NextResponse } from "next/server";
import { crawlWebsite } from "@/services/research/website-crawler";
import { searchYouTubeVideos } from "@/services/research/youtube-service";
import OpenAI from "openai";

export const maxDuration = 30;

export async function GET() {
  const results: Record<string, unknown> = {
    env: {
      hasOpenAIKey: !!process.env.OPENAI_API_KEY,
      openAIKeyPrefix: process.env.OPENAI_API_KEY?.slice(0, 12) + "...",
      aiModel: process.env.AI_MODEL || "gpt-4o",
      hasYoutubeKey: !!process.env.YOUTUBE_API_KEY,
      mockCrawl: process.env.MOCK_CRAWL,
      mockAI: process.env.MOCK_AI,
    },
  };

  // Test crawl
  try {
    const crawl = await crawlWebsite("https://www.segway.com");
    results.crawl = {
      success: true,
      title: crawl.title,
      headings: crawl.headings.length,
      ctas: crawl.ctaTexts.length,
      features: crawl.productFeatures.length,
      bodyTextLength: crawl.bodyText.length,
    };
  } catch (err) {
    results.crawl = { success: false, error: String(err) };
  }

  // Test YouTube (mock)
  try {
    const videos = await searchYouTubeVideos("Segway review");
    results.youtube = {
      success: true,
      count: videos.length,
      first: videos[0]?.title,
    };
  } catch (err) {
    results.youtube = { success: false, error: String(err) };
  }

  // Test OpenAI
  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY || "" });
    const response = await client.chat.completions.create({
      model: process.env.AI_MODEL || "gpt-4o",
      max_tokens: 100,
      messages: [
        { role: "system", content: "Respond with JSON only." },
        { role: "user", content: 'Say {"status":"ok"} in JSON' },
      ],
      response_format: { type: "json_object" },
    });
    results.openai = {
      success: true,
      response: response.choices[0]?.message?.content,
      model: response.model,
    };
  } catch (err) {
    results.openai = { success: false, error: String(err) };
  }

  return NextResponse.json(results);
}
