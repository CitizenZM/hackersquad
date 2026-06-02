import type { CrawlResult } from "@/services/research/website-crawler";

export interface ProductPageContext {
  productUrl?: string;
  productName?: string;
  productPageTitle?: string;
  productPageText?: string;
  productPageImages?: { url: string; alt: string }[];
}

export function buildBrandAnalysisPrompt(
  brandName: string,
  crawlData: CrawlResult,
  productContext?: ProductPageContext
) {
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

  // Build product context block — this is the AUTHORITATIVE source when provided
  const productBlock = productContext?.productPageTitle
    ? `
=== USER-SPECIFIED PRODUCT (AUTHORITATIVE — this overrides everything else) ===
Product Name: ${productContext.productName || productContext.productPageTitle}
Product Page URL: ${productContext.productUrl || ""}
Product Page Title: ${productContext.productPageTitle}

Product Description (scraped from product page):
${productContext.productPageText?.slice(0, 1500) || ""}

Product Images Available: ${productContext.productPageImages?.length || 0} images
${productContext.productPageImages?.slice(0, 4).map((img, i) => `  Image ${i+1}: ${img.alt || "product image"} — ${img.url}`).join("\n") || ""}

IMPORTANT: The product described above is EXACTLY what this campaign is about.
Use this product definition as the foundation for ALL analysis below.
The useEnvironments, actorSettings, and displayGuidelines must all be tailored to THIS specific product.
=== END AUTHORITATIVE PRODUCT DATA ===
`
    : `
⚠️  No product URL was provided. Infer product type from brand website content ONLY.
`;

  const user = `Identify and analyze the brand "${brandName}".
${productBlock}
BRAND WEBSITE DATA (secondary — for brand positioning, tone, competitive context):
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
${crawlData.bodyText.slice(0, 2000)}

Remember: If authoritative product data is provided above, use it as the foundation. The useEnvironments and displayGuidelines must describe exactly how to shoot THIS specific product in video ads.`;

  return { system, user };
}
