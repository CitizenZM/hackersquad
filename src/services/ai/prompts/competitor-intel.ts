import type { CrawlResult } from "@/services/research/website-crawler";

export function buildCompetitorIntelPrompt(
  brandName: string,
  brandCrawl: CrawlResult | null,
  competitorName: string,
  competitorCrawl: CrawlResult
) {
  const system = `You are a competitive intelligence analyst.
Compare the brand against a competitor and identify strengths, weaknesses, and opportunities.
Respond with ONLY a JSON object:
{
  "brandPromise": "string",
  "valueProposition": "string",
  "toneOfVoice": "string",
  "pricingTheme": "string",
  "productFeatures": ["array"],
  "ctaLanguage": ["array"],
  "strengths": ["array of competitor strengths vs the brand"],
  "weaknesses": ["array of competitor weaknesses vs the brand"],
  "opportunities": ["array of opportunities for the brand based on competitor gaps"]
}`;

  const brandSection = brandCrawl
    ? `Brand "${brandName}" Website:
Title: ${brandCrawl.title}
Description: ${brandCrawl.metaDescription}
Headings: ${brandCrawl.headings.slice(0, 10).join(", ")}
CTAs: ${brandCrawl.ctaTexts.join(", ")}
Features: ${brandCrawl.productFeatures.slice(0, 10).join(", ")}
Content: ${brandCrawl.bodyText.slice(0, 1000)}`
    : `Brand "${brandName}" (no website data available)`;

  const user = `Compare "${brandName}" against competitor "${competitorName}":

${brandSection}

---

Competitor "${competitorName}" Website:
Title: ${competitorCrawl.title}
Description: ${competitorCrawl.metaDescription}
Headings: ${competitorCrawl.headings.slice(0, 10).join(", ")}
CTAs: ${competitorCrawl.ctaTexts.join(", ")}
Features: ${competitorCrawl.productFeatures.slice(0, 10).join(", ")}
Content: ${competitorCrawl.bodyText.slice(0, 1000)}`;

  return { system, user };
}
