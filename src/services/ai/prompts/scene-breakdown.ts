import { z } from "zod";

export const sceneBreakdownSchema = z.object({
  scenes: z.array(
    z.object({
      sceneOrder: z.number(),
      textSnippet: z.string(),
      sceneDescription: z.string(),
    })
  ),
});

export type SceneBreakdown = z.infer<typeof sceneBreakdownSchema>;

export function getSceneBreakdownPrompts(
  episodeTitle: string,
  scriptText: string,
  visualStyle: string
) {
  return {
    systemPrompt: `You are a children's storyboard artist who breaks stories into visual scenes. Each scene should have a clear visual moment that a child can see as a flashcard illustration. Respond with JSON only.`,
    userPrompt: `Break this episode into 6-10 flashcard scenes. Each scene should represent a key visual moment in the story.

EPISODE: "${episodeTitle}"
VISUAL STYLE: ${visualStyle}

EPISODE TEXT:
${scriptText}

For each scene:
- textSnippet: The narration text for this scene (roughly 100-160 words, or 3-5 sentences). This text will be read aloud during the scene.
- sceneDescription: A vivid description of what the illustration should show. Focus on the most visually interesting moment.

BALANCE RULES:
- Each scene's textSnippet should be roughly similar in length (100-160 words each). Avoid one scene having 50 words and another having 250.
- The scenes should cover the entire episode text sequentially. Every word of the episode should belong to exactly one scene.
- Start each scene at a natural narrative beat (new setting, new character, new action).

Respond with JSON: { "scenes": [{ "sceneOrder": 1, "textSnippet": "...", "sceneDescription": "..." }] }`,
  };
}
