import { z } from "zod";
import { analyzeWithClaude } from "@/services/ai/claude-client";
import type { CrawlResult } from "./website-crawler";

const brandContextSchema = z.object({
  businessType: z.string(),
  industry: z.string(),
  disambiguationKeywords: z.array(z.string()),
  notRelatedTo: z.array(z.string()),
});

export type BrandContext = z.infer<typeof brandContextSchema>;

const keywordSchema = z.object({
  brandKeywords: z.array(z.string()),
  productKeywords: z.array(z.string()),
  categoryKeywords: z.array(z.string()),
  adSearchQueries: z.array(z.string()),
});

export type SearchKeywords = z.infer<typeof keywordSchema> & {
  brandContext?: BrandContext;
};

export async function quickBrandUnderstanding(
  brandName: string,
  crawlData: CrawlResult | null
): Promise<BrandContext> {
  const fallback: BrandContext = {
    businessType: "brand",
    industry: "general",
    disambiguationKeywords: [brandName],
    notRelatedTo: [],
  };

  if (!crawlData) return fallback;

  try {
    const system = `You identify what a brand/business IS based on its website data. This is critical for search disambiguation.
Output JSON only with:
- businessType: 1-3 word description (e.g. "fintech payments platform", "electric scooter brand", "fashion retailer")
- industry: the industry (e.g. "financial technology", "personal transportation", "fashion")
- disambiguationKeywords: 3-5 keywords that uniquely identify THIS business (not the brand name itself). Used to filter search results. E.g. for a fintech company named "Slash": ["fintech","payments","business card","expense management"]
- notRelatedTo: 3-5 terms that commonly confuse with this brand name but are UNRELATED. E.g. for "Slash" fintech: ["guitarist","musician","rock band","Guns N Roses"]. For "Apple" tech: ["fruit","recipe","orchard"]. Leave empty if brand name is unique.`;

    const user = `Brand name: "${brandName}"
Website title: ${crawlData.title}
Meta description: ${crawlData.metaDescription}
Headings: ${crawlData.headings.slice(0, 8).join(", ")}
Body excerpt: ${crawlData.bodyText.slice(0, 400)}

What does this business do? What could its name be confused with?`;

    return await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: brandContextSchema,
      maxTokens: 200,
    });
  } catch {
    return fallback;
  }
}

export async function extractSearchKeywords(
  brandName: string,
  crawlData: CrawlResult | null,
  competitors: string[],
  briefing?: string,
  brandContext?: BrandContext
): Promise<SearchKeywords> {
  const contextDesc = brandContext
    ? `${brandContext.businessType} in ${brandContext.industry}`
    : "brand";
  const disambig = brandContext?.disambiguationKeywords?.slice(0, 2).join(" ") || "";

  const fallback: SearchKeywords = {
    brandKeywords: [brandName, `${brandName} ${contextDesc}`],
    productKeywords: brandContext?.disambiguationKeywords || [],
    categoryKeywords: [brandContext?.industry || ""],
    adSearchQueries: [
      `${brandName} ${disambig} official ad commercial`,
      `${brandName} ${disambig} brand campaign`,
      `${brandName} ${disambig} advertisement`,
    ],
    brandContext,
  };

  if (!crawlData) return fallback;

  try {
    const system = `You extract search keywords from brand website data for finding video ads across YouTube, TikTok, and Vimeo. Output JSON only.
Return a JSON object with:
- brandKeywords: brand name variations (2-4 items)
- productKeywords: specific product/service terms found on site (3-5 items)
- categoryKeywords: industry/category terms (2-3 items)
- adSearchQueries: 5 search queries optimized for finding this brand's video ADS and COMMERCIALS (not reviews or demos). Include words like "official", "ad", "commercial", "campaign", "brand film", "introducing". Focus on English-language, US-market content.

CRITICAL: This brand is a ${contextDesc}. Include industry-specific terms in ALL search queries to avoid confusion with unrelated results.${brandContext?.notRelatedTo?.length ? ` DO NOT include anything related to: ${brandContext.notRelatedTo.join(", ")}` : ""}`;

    const user = `Brand: ${brandName} (${contextDesc})
Business context: ${disambig}
Competitors: ${competitors.join(", ") || "none listed"}

Website title: ${crawlData.title}
Description: ${crawlData.metaDescription}
Headings: ${crawlData.headings.slice(0, 10).join(", ")}
Product features: ${crawlData.productFeatures.slice(0, 8).join(", ")}
CTAs: ${crawlData.ctaTexts.join(", ")}
Body excerpt: ${crawlData.bodyText.slice(0, 500)}
${briefing ? `\nProject brief: ${briefing.slice(0, 800)}` : ""}

Generate search keywords and ad-specific search queries. Every query MUST include at least one industry keyword (${disambig}) alongside the brand name to avoid irrelevant results.`;

    const result = await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: keywordSchema,
      maxTokens: 500,
    });

    return { ...result, brandContext };
  } catch {
    return fallback;
  }
}
