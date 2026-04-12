import { z } from "zod";

export const imagePromptsSchema = z.object({
  prompts: z.array(
    z.object({
      sceneOrder: z.number(),
      imagePrompt: z.string(),
    })
  ),
});

export type ImagePrompts = z.infer<typeof imagePromptsSchema>;

const STYLE_PREFIXES: Record<string, string> = {
  CARTOON: "Cute cartoon illustration, bright colors, soft rounded shapes, child-friendly",
  WATERCOLOR: "Soft watercolor painting, gentle pastel colors, dreamy atmosphere, child-friendly",
  STORYBOOK: "Classic storybook illustration, warm colors, detailed but friendly, child-friendly",
  PIXEL_ART: "Cute pixel art style, colorful, retro game aesthetic, child-friendly",
};

export function getImagePromptsForScenes(
  scenes: Array<{ sceneOrder: number; sceneDescription: string }>,
  visualStyle: string,
  storyTitle: string
) {
  const stylePrefix = STYLE_PREFIXES[visualStyle] || STYLE_PREFIXES.CARTOON;

  return {
    systemPrompt: `You are an expert at writing image generation prompts for children's book illustrations. Your prompts produce safe, warm, engaging illustrations suitable for ages 3-9. Never include scary, violent, or inappropriate elements. Respond with JSON only.`,
    userPrompt: `Create DALL-E image generation prompts for these story scenes. The story is "${storyTitle}".

VISUAL STYLE PREFIX (include at the start of each prompt): "${stylePrefix}"

SAFETY RULES:
- All scenes must be safe for ages 3-9
- No violence, fear, or scary imagery
- Characters should look friendly and approachable
- Use warm, inviting colors
- Keep backgrounds simple and clear

SCENES:
${scenes.map((s) => `Scene ${s.sceneOrder}: ${s.sceneDescription}`).join("\n")}

For each scene, create a detailed DALL-E prompt that starts with the style prefix. Keep main character appearance consistent across scenes.

Respond with JSON: { "prompts": [{ "sceneOrder": 1, "imagePrompt": "..." }] }`,
  };
}
