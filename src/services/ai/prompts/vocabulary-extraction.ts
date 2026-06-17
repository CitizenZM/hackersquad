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
    userPrompt: `Extract vocabulary words from this children's story episode for a child in the ${ageGroup.replace("_", "-")} age group.

AGE-SPECIFIC RULES:
${getAgeVocabRules(ageGroup)}

SELECTION CRITERIA:
- Words that appear in the story naturally (prefer words used 2+ times for reinforcement)
- Age-appropriate but slightly challenging for the target age band
- Words with clear, concrete meanings children can visualize
- Prioritize action verbs, descriptive adjectives, and naming words

EPISODE TEXT:
${scriptText.slice(0, 4000)}

For each word, provide:
- word: the vocabulary word
- definition: a simple, child-friendly definition (1 sentence)
- example: a fun example sentence using the word, ideally referencing the story context

Respond with JSON: { "words": [{ "word": "...", "definition": "...", "example": "..." }] }`,
  };
}

function getAgeVocabRules(ageGroup: string): string {
  switch (ageGroup) {
    case "AGE_3_4":
      return `- Extract only 2-3 words
- Pick highly concrete words (animals, objects, simple actions like "splash", "tiptoe")
- Definitions must be under 8 words
- Examples should use the word in a very short sentence (5-8 words)`;
    case "AGE_5_6":
      return `- Extract 4-6 words
- Include descriptive words (colors, textures, emotions) and action verbs
- Definitions should be one clear sentence
- Examples should use the word in a fun, relatable context`;
    case "AGE_7_9":
      return `- Extract 6-8 words
- Can include slightly abstract concepts (brave, curious, shimmer)
- Definitions can be more detailed (1-2 sentences)
- Examples can include cause-and-effect or emotional context`;
    default:
      return `- Extract 4-6 words appropriate for the age group`;
  }
}
