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
- Violence, weapons, or physically scary content (monsters, loud threats)
- Adult themes, innuendo, or inappropriate language
- Discriminatory, racist, or harmful stereotypes
- Death, abandonment, or betrayal themes inappropriate for the age
- Inappropriate relationships or power dynamics
- Substances, dangerous behaviors, or risky imitation scenarios
- Imagery or scenarios likely to cause nightmares or anxiety
- Characters in genuine distress without resolution or comfort

AGE-SPECIFIC THRESHOLDS:
- For AGE_3_4: Only approve if score is 8 or higher. No conflict beyond minor inconvenience. No separation anxiety triggers.
- For AGE_5_6: Approve if score is 7 or higher. Mild problems with clear resolution are fine. No lasting fear.
- For AGE_7_9: Approve if score is 6 or higher. Moderate challenges with character growth are appropriate.

CONTENT TO REVIEW:
${text.slice(0, 8000)}

Rate the content's age suitability from 0 (completely inappropriate) to 10 (perfectly age-appropriate). Mark "safe" as false if the score falls below the threshold for the target age group.

Respond with JSON: { "safe": boolean, "issues": [{ "type": "category", "description": "what the issue is", "severity": "low"|"medium"|"high" }], "ageSuitabilityScore": number }`,
  };
}
