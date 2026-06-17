import { z } from "zod";

export const storySummarySchema = z.object({
  shortSummary: z.string(),
  coverDescription: z.string(),
  mainCharacter: z.string(),
  setting: z.string(),
  mood: z.string(),
});

export type StorySummary = z.infer<typeof storySummarySchema>;

export function getStorySummaryPrompts(
  storyTitle: string,
  episodeTexts: string[],
  storyGoal: string
) {
  const allText = episodeTexts.join("\n\n").slice(0, 6000);

  return {
    systemPrompt: `You are a children's book cataloger. Create brief, appealing summaries for a story library. Write for parents browsing stories for their children. Respond with JSON only.`,
    userPrompt: `Create metadata for this children's story:

TITLE: "${storyTitle}"
GOAL: ${storyGoal}
STORY TEXT:
${allText}

Generate:
- shortSummary: 1-2 sentence parent-facing summary (what the story is about, max 100 characters)
- coverDescription: A visual description for the story cover illustration (30-50 words)
- mainCharacter: The protagonist's name and brief description (e.g., "Milo, a curious bear cub")
- setting: Where the story takes place (e.g., "A moonlit forest")
- mood: The emotional tone (e.g., "warm and adventurous" or "calm and soothing")

Respond with JSON: { "shortSummary": "...", "coverDescription": "...", "mainCharacter": "...", "setting": "...", "mood": "..." }`,
  };
}
