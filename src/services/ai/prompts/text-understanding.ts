import { z } from "zod";

export const textUnderstandingSchema = z.object({
  themes: z.array(z.string()),
  characters: z.array(z.object({ name: z.string(), role: z.string() })),
  keyEvents: z.array(z.string()),
  vocabularyLevel: z.enum(["simple", "intermediate", "advanced"]),
  tone: z.string(),
  summary: z.string(),
  suggestedTitle: z.string(),
  suitableAges: z.array(z.enum(["AGE_3_4", "AGE_5_6", "AGE_7_9"])),
  adaptationNotes: z.string(),
});

export type TextUnderstanding = z.infer<typeof textUnderstandingSchema>;

export function getTextUnderstandingPrompts(sourceText: string) {
  return {
    systemPrompt: `You are a children's literature analyst. Analyze the given text and extract key information that will help adapt it into a children's story. Respond with JSON only.`,
    userPrompt: `Analyze this source text for story adaptation. Extract themes, characters, key events, vocabulary level, tone, a brief summary, and suggest a child-friendly title.

SOURCE TEXT:
${sourceText.slice(0, 8000)}

Also assess:
- suitableAges: which age groups (AGE_3_4, AGE_5_6, AGE_7_9) can safely engage with this content?
- adaptationNotes: what specific modifications would be needed for the youngest age group (AGE_3_4)? Note any complex themes, long sentences, or difficult vocabulary that needs simplification.

Respond with a JSON object containing: themes (array of strings), characters (array of {name, role}), keyEvents (array of strings), vocabularyLevel ("simple"|"intermediate"|"advanced"), tone (string), summary (string), suggestedTitle (string), suitableAges (array of "AGE_3_4"|"AGE_5_6"|"AGE_7_9"), adaptationNotes (string with specific simplification guidance).`,
  };
}
