export interface TestMatrixInput {
  brandName: string;
  hooks: string[];
  narrativeTypes: string[];
  ctas: string[];
  formats: string[];
}

export function buildTestMatrixPrompt(input: TestMatrixInput) {
  const system = `You are a performance marketing strategist creating a creative test matrix.
Generate the top 20 most promising creative variants with predictive scoring.
Respond with ONLY a JSON object:
{
  "variants": [
    {
      "hookVariant": "string",
      "narrativeType": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
      "ctaVariant": "string",
      "format": "string",
      "predictedScore": number,
      "rationale": "string - why this combination should work",
      "scriptOutline": "string - brief 2-sentence script concept"
    }
  ]
}

Score criteria (0-100):
- Predicted engagement based on hook + narrative combination
- Conversion likelihood based on CTA + format fit
- Platform suitability
Present scores as AI PREDICTIONS, not guarantees.`;

  const user = `Create a creative test matrix for "${input.brandName}":

Available Hooks:
${input.hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Narrative Types:
${input.narrativeTypes.join(", ")}

CTA Options:
${input.ctas.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Formats:
${input.formats.join(", ")}

Generate the top 20 most promising combinations with predictive scores and rationale.`;

  return { system, user };
}
