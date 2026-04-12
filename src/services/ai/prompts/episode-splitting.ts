import { z } from "zod";

export const episodeSplitSchema = z.object({
  episodes: z.array(
    z.object({
      episodeNumber: z.number(),
      title: z.string(),
      scriptText: z.string(),
      wordBudget: z.number(),
    })
  ),
});

export type EpisodeSplit = z.infer<typeof episodeSplitSchema>;

export function getEpisodeSplittingPrompts(
  adaptedText: string,
  episodeCount: number,
  storyGoal: string
) {
  return {
    systemPrompt: `You are a children's story editor who structures narratives into engaging episodes. Each episode must feel complete yet leave the listener wanting more. Respond with JSON only.`,
    userPrompt: `Split the following adapted children's story into exactly ${episodeCount} episode(s). Each episode should target approximately 1000 words and under 5 minutes of narration.

RULES:
- Each episode must have a clear hook at the start
- Each episode must have a satisfying mini-conclusion
- The last few sentences of each episode (except the final) should tease the next episode
- Include a brief recap opener for episodes after the first
- Episode titles should be fun and descriptive
- The story goal is: ${storyGoal}

ADAPTED TEXT:
${adaptedText}

Respond with JSON: { "episodes": [{ "episodeNumber": 1, "title": "Episode Title", "scriptText": "full episode text...", "wordBudget": number_of_words }] }`,
  };
}
