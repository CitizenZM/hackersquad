import { z } from "zod";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import type { CrawlResult } from "./website-crawler";

const keywordSchema = z.object({
  brandKeywords: z.array(z.string()),
  productKeywords: z.array(z.string()),
  categoryKeywords: z.array(z.string()),
  adSearchQueries: z.array(z.string()),
});

export type SearchKeywords = z.infer<typeof keywordSchema>;

export async function extractSearchKeywords(
  brandName: string,
  crawlData: CrawlResult | null,
  competitors: string[]
): Promise<SearchKeywords> {
  // Fallback if no crawl data or AI fails
  const fallback: SearchKeywords = {
    brandKeywords: [brandName, `${brandName} brand`],
    productKeywords: [],
    categoryKeywords: [],
    adSearchQueries: [
      `${brandName} official ad commercial`,
      `${brandName} brand campaign`,
      `${brandName} advertisement`,
    ],
  };

  if (!crawlData) return fallback;

  try {
    const system = `You extract search keywords from brand website data for finding video ads across YouTube, TikTok, and Vimeo. Output JSON only.
Return a JSON object with:
- brandKeywords: brand name variations (2-4 items)
- productKeywords: specific product/service terms found on site (3-5 items)
- categoryKeywords: industry/category terms (2-3 items)
- adSearchQueries: 5 search queries optimized for finding this brand's video ADS and COMMERCIALS (not reviews or demos). Include words like "official", "ad", "commercial", "campaign", "brand film", "introducing".`;

    const user = `Brand: ${brandName}
Competitors: ${competitors.join(", ") || "none listed"}

Website title: ${crawlData.title}
Description: ${crawlData.metaDescription}
Headings: ${crawlData.headings.slice(0, 10).join(", ")}
Product features: ${crawlData.productFeatures.slice(0, 8).join(", ")}
CTAs: ${crawlData.ctaTexts.join(", ")}
Body excerpt: ${crawlData.bodyText.slice(0, 500)}

Generate search keywords and ad-specific search queries.`;

    return await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: keywordSchema,
      maxTokens: 500,
    });
  } catch {
    return fallback;
  }
}
