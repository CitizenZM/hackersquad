import { z } from "zod";

export const vocabularyExtractionSchema = z.object({
  words: z.array(
    z.object({
      word: z.string(),
      definition: z.string(),
      example: z.string(),
    })
  ),
});

export type VocabularyExtraction = z.infer<typeof vocabularyExtractionSchema>;

export function getVocabularyExtractionPrompts(
  scriptText: string,
  ageGroup: string
) {
  return {
    systemPrompt: `You are a children's vocabulary teacher. Extract important learning words from story text and provide child-friendly definitions. Respond with JSON only.`,
    userPrompt: `Extract 3-8 vocabulary words from this children's story episode that would be good for a child in the ${ageGroup.replace("_", "-")} age group to learn.

SELECTION CRITERIA:
- Words that appear in the story naturally
- Age-appropriate but slightly challenging
- Words with clear, concrete meanings
- Words useful in everyday life

EPISODE TEXT:
${scriptText.slice(0, 4000)}

For each word, provide:
- word: the vocabulary word
- definition: a simple, child-friendly definition (1 sentence)
- example: a fun example sentence using the word

Respond with JSON: { "words": [{ "word": "...", "definition": "...", "example": "..." }] }`,
  };
}
