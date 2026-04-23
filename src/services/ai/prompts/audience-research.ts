export interface AudienceInput {
  brandName: string;
  brandPromise?: string;
  valueProposition?: string;
  targetAudience?: string;
  toneOfVoice?: string;
  pricingTheme?: string;
  productFeatures?: string[];
  category?: string;
  topSignals?: string[];
  topContent?: { title: string; viewCount: number; narrativeType: string }[];
}

export function buildAudienceResearchPrompt(input: AudienceInput) {
  const system = `You are a market research analyst specializing in consumer demographics and psychographics.
Analyze the brand data and infer detailed audience profiles.
Respond with valid JSON matching this structure:
{
  "segments": [
    { "name": "string", "ageRange": "string", "description": "string", "size": "large|medium|small" }
  ],
  "psychographics": [
    { "trait": "string", "description": "string" }
  ],
  "painPoints": [
    { "point": "string", "severity": "high|medium|low" }
  ],
  "interests": ["string array of interests/hobbies"],
  "platforms": [
    { "platform": "string", "usage": "high|medium|low", "adReceptivity": "high|medium|low" }
  ],
  "buyingBehavior": "string - how this audience researches and buys",
  "incomeLevel": "string - income bracket description",
  "geoMarkets": ["string array of key geographic markets"]
}

Generate 2-4 audience segments, 3-5 psychographic traits, 3-5 pain points, 5-8 interests, 4-6 platform preferences, and 3-5 geo markets.`;

  const features = input.productFeatures?.slice(0, 5).join(", ") || "N/A";
  const signals = input.topSignals?.slice(0, 5).join(", ") || "N/A";
  const contentSummary = input.topContent
    ?.slice(0, 5)
    .map((c) => `"${c.title}" (${c.viewCount.toLocaleString()} views, ${c.narrativeType})`)
    .join("\n  ") || "N/A";

  const user = `Analyze audience demographics for "${input.brandName}":

Brand Promise: ${input.brandPromise || "N/A"}
Value Proposition: ${input.valueProposition || "N/A"}
Current Target Audience: ${input.targetAudience || "N/A"}
Tone of Voice: ${input.toneOfVoice || "N/A"}
Pricing: ${input.pricingTheme || "N/A"}
Category: ${input.category || "N/A"}
Product Features: ${features}
Market Signals: ${signals}

Top Performing Content:
  ${contentSummary}

Based on the brand positioning, pricing, product features, content performance, and market signals, generate detailed audience demographics and psychographics.`;

  return { system, user };
}
