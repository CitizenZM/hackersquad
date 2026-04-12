import { analyzeWithClaude } from "@/services/ai/claude-client";
import {
  getContentModerationPrompts,
  moderationResultSchema,
  type ModerationResult,
} from "@/services/ai/prompts/content-moderation";

export async function moderateContent(
  text: string,
  ageGroup: string
): Promise<ModerationResult> {
  if (process.env.MOCK_AI === "true") {
    return { safe: true, issues: [], ageSuitabilityScore: 9 };
  }

  const { systemPrompt, userPrompt } = getContentModerationPrompts(text, ageGroup);

  return analyzeWithClaude({
    systemPrompt,
    userPrompt,
    responseSchema: moderationResultSchema,
  });
}
