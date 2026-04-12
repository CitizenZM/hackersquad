import { z } from "zod";

export const textUnderstandingSchema = z.object({
  themes: z.array(z.string()),
  characters: z.array(z.object({ name: z.string(), role: z.string() })),
  keyEvents: z.array(z.string()),
  vocabularyLevel: z.enum(["simple", "intermediate", "advanced"]),
  tone: z.string(),
  summary: z.string(),
  suggestedTitle: z.string(),
});

export type TextUnderstanding = z.infer<typeof textUnderstandingSchema>;

export function getTextUnderstandingPrompts(sourceText: string) {
  return {
    systemPrompt: `You are a children's literature analyst. Analyze the given text and extract key information that will help adapt it into a children's story. Respond with JSON only.`,
    userPrompt: `Analyze this source text for story adaptation. Extract themes, characters, key events, vocabulary level, tone, a brief summary, and suggest a child-friendly title.

SOURCE TEXT:
${sourceText.slice(0, 8000)}

Respond with a JSON object containing: themes (array of strings), characters (array of {name, role}), keyEvents (array of strings), vocabularyLevel ("simple"|"intermediate"|"advanced"), tone (string), summary (string), suggestedTitle (string).`,
  };
}
