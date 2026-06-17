import { z } from "zod";

export const narrationScriptSchema = z.object({
  script: z.string(),
  estimatedDurationSeconds: z.number(),
  paceNotes: z.string(),
});

export type NarrationScript = z.infer<typeof narrationScriptSchema>;

export function getNarrationScriptPrompts(
  episodeText: string,
  storyGoal: string,
  ageGroup: string
) {
  return {
    systemPrompt: `You are a professional children's audiobook narrator preparing text for text-to-speech recording. Your goal is to make the text sound natural, warm, and engaging when read aloud by a TTS engine. Respond with JSON only.`,
    userPrompt: `Prepare this children's story episode for TTS narration.

STORY GOAL: ${storyGoal}
AGE GROUP: ${ageGroup.replace("_", "-")}

ORIGINAL EPISODE TEXT:
${episodeText}

INSTRUCTIONS:
- Add natural pause points with ellipses (...) where a storyteller would pause for effect
- Break very long sentences into shorter, breathable phrases
- Ensure dialogue is clearly attributed ("said the owl" before or after quotes)
- Add gentle emphasis markers: capitalize key emotional words sparingly (e.g., "VERY quietly")
- For BEDTIME: slow the pacing with more pauses, longer descriptive phrases, softer word choices
- For EDUCATE: ensure learning concepts are clearly enunciated with slight pauses before and after
- Remove any formatting artifacts (bullets, headers, numbering)
- The script should read naturally at approximately 150 words per minute
- Estimate the total duration in seconds

Respond with JSON: { "script": "the TTS-ready narration text", "estimatedDurationSeconds": number, "paceNotes": "brief notes about pacing choices" }`,
  };
}
