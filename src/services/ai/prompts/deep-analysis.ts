export interface DeepAnalysisInput {
  brandName: string;
  category?: string;
  topContent: {
    title: string;
    platform: string;
    narrativeType: string;
    overallScore: number;
    hookStrength: number;
    ctaQuality: number;
    emotionalAppeal: number;
    pacing: number;
    storytellingArc: number;
    hookText: string;
    keyMessages: string[];
    viewCount: number;
    contentCategory?: string | null;
  }[];
}

export function buildDeepAnalysisPrompt(input: DeepAnalysisInput) {
  const system = `You are a senior creative strategist analyzing ad campaigns in depth.
Synthesize patterns across the scored content and produce actionable strategic insights.
Respond with valid JSON matching this exact structure:
{
  "videoStructure": {
    "openingPatterns": [
      { "pattern": "string - e.g. 'Product hero shot', 'Founder intro'", "frequency": number, "effectiveness": "high|medium|low", "example": "string - quote from content" }
    ],
    "hookDurationRange": "string - e.g. '3-5 seconds'",
    "productRevealTiming": "string - when product typically appears, e.g. 'Within first 5 seconds in 70% of top content'",
    "averageLength": "string - e.g. '30-60s for long-form, 15-20s for shorts'",
    "structuralInsights": ["array of 3-5 structural observations"]
  },
  "vibeAnalysis": {
    "dominantTones": [
      { "tone": "string - e.g. 'aspirational', 'playful', 'serious'", "frequency": number, "avgScore": number, "example": "string" }
    ],
    "emotionalTriggers": [
      { "trigger": "string - e.g. 'excitement', 'FOMO', 'trust'", "usage": "string - how it's deployed", "examples": ["array of content titles"] }
    ],
    "visualStyleNotes": "string - overall visual treatment observations",
    "pacingProfile": "string - e.g. 'Fast-paced with quick cuts' or 'Slow-burn narrative'",
    "vibeInsights": ["array of 3-5 vibe observations"]
  },
  "ctaAnalysis": {
    "commonCTAs": [
      { "cta": "string", "frequency": number, "type": "direct|soft|urgency|informational", "effectiveness": "high|medium|low" }
    ],
    "placement": "string - where CTAs typically appear",
    "urgencyLevel": "high|medium|low",
    "conversionDrivers": ["array of what's driving clicks"],
    "ctaInsights": ["array of 3-5 CTA observations"]
  },
  "sellingPointDeep": {
    "topPerformers": [
      { "point": "string", "whyItWorks": "string", "bestPlatforms": ["array"], "exampleContent": "string" }
    ],
    "underutilized": [
      { "point": "string", "opportunity": "string - how to leverage this" }
    ],
    "messagingInsights": ["array of 3-5 messaging observations"]
  },
  "competitiveGaps": [
    { "gap": "string - what the brand is missing", "recommendation": "string - how to close it", "priority": "high|medium|low" }
  ],
  "recommendations": [
    { "title": "string - action title", "description": "string - what to do", "impact": "high|medium|low", "effort": "high|medium|low", "category": "string - e.g. Content, Platform, Messaging" }
  ]
}

Focus on actionable, specific insights. Use actual examples from the content provided.`;

  const user = `Deep creative analysis for "${input.brandName}" ${input.category ? `(${input.category})` : ""}:

Scored Content:
${input.topContent
  .map(
    (c, i) => `[${i + 1}] "${c.title}" on ${c.platform}
  Narrative: ${c.narrativeType} | Category: ${c.contentCategory || "N/A"} | Score: ${c.overallScore}
  Sub-scores: Hook=${c.hookStrength} CTA=${c.ctaQuality} Emotion=${c.emotionalAppeal} Pacing=${c.pacing} Story=${c.storytellingArc}
  Views: ${c.viewCount.toLocaleString()}
  Hook text: "${c.hookText}"
  Key messages: ${c.keyMessages.join("; ")}`
  )
  .join("\n\n")}

Produce a deep strategic analysis covering video structure, vibe/emotion, CTA strategy, selling point effectiveness, competitive gaps, and prioritized recommendations. Reference specific content examples.`;

  return { system, user };
}
