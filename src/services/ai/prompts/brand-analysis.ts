import type { CrawlResult } from "@/services/research/website-crawler";

export function buildBrandAnalysisPrompt(brandName: string, crawlData: CrawlResult) {
  const system = `You are a senior brand strategist with deep product knowledge.

CRITICAL FIRST STEP — PRODUCT IDENTIFICATION:
Before analyzing anything else, determine what physical product(s) this brand actually makes.
DO NOT infer from the brand name — analyze the website content.
Example: "SharkNinja" sounds like it could be about sharks or ninjas, but it actually makes VACUUM CLEANERS and KITCHEN APPLIANCES.
Always describe the physical object: what it looks like, what it does, how it is used.

Return ONLY a JSON object with this exact structure:
{
  "productCategory": "precise product category, e.g. 'Home Appliances - Vacuum Cleaners'",
  "productDescription": "200-word precise description of what the physical product IS: its form factor, appearance, size, how users interact with it, what problem it solves. No marketing language. Pure factual product description.",
  "brandPromise": "core brand promise",
  "valueProposition": "primary value proposition",
  "toneOfVoice": "brand communication tone",
  "targetAudience": "inferred target audience",
  "pricingTheme": "pricing positioning",
  "productFeatures": ["key product features"],
  "ctaLanguage": ["CTA phrases"],
  "socialProof": ["social proof elements"],
  "useEnvironments": [
    {
      "name": "environment name, e.g. 'Living Room with Pets'",
      "description": "specific scene description for video production",
      "imagePrompt": "detailed Pollinations.ai prompt to generate a reference photo of this product in this environment — must describe the actual physical product correctly, specific location, lighting, no humans",
      "typicalUser": "who uses product here"
    }
  ],
  "actorSettings": [
    {
      "role": "actor role name, e.g. 'Busy Pet Owner'",
      "ageRange": "28-45",
      "scenario": "specific scenario description",
      "visualDescription": "what they look like and wear in this context",
      "painPoint": "what problem they face",
      "productInteraction": "exactly how they physically interact with the product"
    }
  ],
  "displayGuidelines": [
    {
      "rule": "product display rule",
      "example": "correct way to show it",
      "antiExample": "wrong way that must be avoided"
    }
  ]
}`;

  const user = `Identify and analyze the brand "${brandName}".

WEBSITE DATA:
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

Page Content:
${crawlData.bodyText.slice(0, 3000)}

Remember: Start by identifying what physical product this company makes based on the content, NOT the brand name.`;

  return { system, user };
}
