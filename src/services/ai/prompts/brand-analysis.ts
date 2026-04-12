import type { CrawlResult } from "@/services/research/website-crawler";

export function buildBrandAnalysisPrompt(brandName: string, crawlData: CrawlResult) {
  const system = `You are a senior brand strategist analyzing a brand's online presence.
Analyze the crawled website data and extract key brand attributes.
Respond with ONLY a JSON object matching this exact structure:
{
  "brandPromise": "string - the core brand promise/mission",
  "valueProposition": "string - primary value proposition",
  "toneOfVoice": "string - brand's communication tone (e.g., playful, authoritative, luxurious)",
  "targetAudience": "string - inferred target audience",
  "pricingTheme": "string - pricing positioning (budget, mid-range, premium, luxury)",
  "productFeatures": ["array of key product features/benefits"],
  "ctaLanguage": ["array of CTA phrases used"],
  "socialProof": ["array of social proof elements found"]
}`;

  const user = `Analyze the brand "${brandName}" based on this website data:

Title: ${crawlData.title}
Description: ${crawlData.metaDescription}

Key Headings:
${crawlData.headings.join("\n")}

CTAs Found:
${crawlData.ctaTexts.join(", ")}

Product Features:
${crawlData.productFeatures.slice(0, 15).join("\n")}

Testimonials:
${crawlData.testimonials.join("\n")}

Pricing Mentions:
${crawlData.pricingMentions.join(", ")}

Social Proof:
${crawlData.socialProof.join("\n")}

Page Content (excerpt):
${crawlData.bodyText.slice(0, 2000)}`;

  return { system, user };
}
