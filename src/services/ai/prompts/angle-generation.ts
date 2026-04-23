export interface AngleInput {
  brandName: string;
  category?: string;
  campaignGoal?: string;
  brandPromise?: string;
  valueProposition?: string;
  topSellingPoints: string[];
  topPatterns: string[];
  topSignals: string[];
  audienceSegments?: string[];
  painPoints?: string[];
  platformPreferences?: string[];
  briefing?: string;
}

export function buildAngleGenerationPrompt(input: AngleInput) {
  const system = `You are an elite creative director at a top advertising agency.
Generate 10 distinct ad angles based on brand intelligence and content analysis.
Each angle should be production-ready and based on proven content patterns.
Respond with ONLY a JSON object:
{
  "angles": [
    {
      "id": number,
      "title": "string - short angle name",
      "description": "string - 2-3 sentence description of the ad concept",
      "targetEmotion": "string - primary emotion to evoke",
      "narrativeType": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
      "predictedScore": number,
      "rationale": "string - why this angle will work based on the data",
      "targetAudience": "string - who this angle speaks to",
      "platform": "string - best platform for this angle"
    }
  ]
}`;

  const user = `Generate 10 ad angles for "${input.brandName}":

Category: ${input.category || "General"}
Campaign Goal: ${input.campaignGoal || "Brand awareness & conversion"}
Brand Promise: ${input.brandPromise || "N/A"}
Value Proposition: ${input.valueProposition || "N/A"}

Top Selling Points:
${input.topSellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Top Content Patterns:
${input.topPatterns.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Key Market Signals:
${input.topSignals.map((s, i) => `${i + 1}. ${s}`).join("\n")}
${input.audienceSegments?.length ? `
Target Audience Segments:
${input.audienceSegments.map((s, i) => `${i + 1}. ${s}`).join("\n")}` : ""}
${input.painPoints?.length ? `
Audience Pain Points:
${input.painPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}` : ""}
${input.platformPreferences?.length ? `
Best Platforms: ${input.platformPreferences.join(", ")}` : ""}
${input.briefing ? `
Project Brief:
${input.briefing.slice(0, 1500)}` : ""}

Generate 10 diverse, data-backed ad angles. Each angle should target a specific audience segment and address a real pain point. Assign each angle to the platform where it will perform best.`;

  return { system, user };
}
