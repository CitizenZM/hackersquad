export interface ScoredContent {
  title: string;
  narrativeType: string;
  overallScore: number;
  hookText: string;
  keyMessages: string[];
}

export function buildPatternMiningPrompt(
  brandName: string,
  contents: ScoredContent[]
) {
  const system = `You are a creative strategist identifying content patterns and narrative trends.
Analyze the scored content and identify recurring narrative patterns.
Respond with ONLY a JSON object:
{
  "patterns": [
    {
      "type": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
      "name": "string - human-readable pattern name",
      "description": "string - what this pattern involves",
      "frequency": number,
      "avgPerformance": number,
      "bestPractices": ["array of tips for using this pattern effectively"]
    }
  ],
  "sellingPoints": [
    {
      "point": "string - the selling point",
      "category": "feature|benefit|emotional|social_proof|urgency",
      "strength": number,
      "frequency": number,
      "uniqueness": number
    }
  ],
  "topSignals": ["array of 5-8 key market signals or trends observed"]
}`;

  const user = `Analyze content patterns for "${brandName}":

Scored Content:
${contents
  .map(
    (c, i) => `[${i + 1}] "${c.title}"
  Type: ${c.narrativeType} | Score: ${c.overallScore}
  Hook: ${c.hookText}
  Messages: ${c.keyMessages.join(", ")}`
  )
  .join("\n\n")}

Identify:
1. Which narrative patterns appear most and perform best
2. Recurring selling points and claims
3. Key market signals and trends`;

  return { system, user };
}
