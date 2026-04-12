import { z } from "zod";

export const moderationResultSchema = z.object({
  safe: z.boolean(),
  issues: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      severity: z.enum(["low", "medium", "high"]),
    })
  ),
  ageSuitabilityScore: z.number().min(0).max(10),
});

export type ModerationResult = z.infer<typeof moderationResultSchema>;

export function getContentModerationPrompts(
  text: string,
  ageGroup: string
) {
  return {
    systemPrompt: `You are a child content safety reviewer. Your job is to ensure all content is appropriate for children aged 3-9. Be thorough but not overly restrictive. Flag genuine safety concerns, not normal story elements like mild conflict or challenges. Respond with JSON only.`,
    userPrompt: `Review this children's story content for safety and age-appropriateness. Target age group: ${ageGroup.replace("_", "-")}.

CHECK FOR:
- Violence or scary content
- Adult themes or language
- Discriminatory or harmful stereotypes
- Complex emotional trauma
- Inappropriate relationships
- Substances or dangerous behaviors
- Content that could cause nightmares

CONTENT TO REVIEW:
${text.slice(0, 8000)}

Rate the content's age suitability from 0 (completely inappropriate) to 10 (perfectly age-appropriate).

Respond with JSON: { "safe": boolean, "issues": [{ "type": "category", "description": "what the issue is", "severity": "low"|"medium"|"high" }], "ageSuitabilityScore": number }`,
  };
}
