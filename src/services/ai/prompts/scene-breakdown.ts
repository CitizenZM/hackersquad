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
- textSnippet: The narration text for this scene (a few sentences from the episode)
- sceneDescription: A vivid description of what the illustration should show

The scenes should cover the entire episode text sequentially. Every word of the episode should belong to exactly one scene.

Respond with JSON: { "scenes": [{ "sceneOrder": 1, "textSnippet": "...", "sceneDescription": "..." }] }`,
  };
}
