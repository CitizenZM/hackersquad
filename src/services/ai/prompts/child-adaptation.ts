import { z } from "zod";

export const childAdaptationSchema = z.object({
  adaptedText: z.string(),
  adaptedWordCount: z.number(),
});

export type ChildAdaptation = z.infer<typeof childAdaptationSchema>;

export function getChildAdaptationPrompts(
  sourceText: string,
  ageGroup: string,
  storyGoal: string,
  understanding: { themes: string[]; tone: string; summary: string }
) {
  const ageRules: Record<string, string> = {
    AGE_3_4: `- Use very short sentences (5-8 words).
- Use simple, familiar words only.
- Include lots of repetition and rhythm.
- Add sound words (whoosh, splash, meow).
- Focus on concrete, visible things.
- Use present tense when possible.
- Each paragraph should be 1-2 sentences.
- Minimize character dialogue; when present, use simple reactions ("Oh!", "Yes!", "Look!") not complex conversation.
- Name characters simply and repeat their name often for recognition.`,
    AGE_5_6: `- Use clear, moderate sentences (8-12 words).
- Introduce new vocabulary with context clues.
- Create a clear beginning, middle, and end.
- Include one simple problem and solution.
- Use repeated key phrases for learning.
- Add dialogue between characters.`,
    AGE_7_9: `- Use richer, more varied sentences.
- Include cause-and-effect relationships.
- Develop characters with motivations.
- Can include educational concepts.
- Use slightly advanced vocabulary with natural context.
- Create stronger narrative arcs with tension.`,
  };

  return {
    systemPrompt: `You are an expert children's story writer who adapts complex content for young children. Your writing is warm, engaging, and age-appropriate. Always maintain the core meaning while making it accessible and fun. Respond with JSON only.`,
    userPrompt: `Adapt the following text for a child in the ${ageGroup.replace("_", "-")} age group. The story goal is: ${storyGoal}.

ORIGINAL THEMES: ${understanding.themes.join(", ")}
ORIGINAL TONE: ${understanding.tone}
SUMMARY: ${understanding.summary}

AGE ADAPTATION RULES:
${ageRules[ageGroup] || ageRules.AGE_5_6}

STORY GOAL GUIDELINES:
${getGoalGuidelines(storyGoal)}

SOURCE TEXT:
${sourceText.slice(0, 12000)}

Rewrite the entire text in a child-friendly way. Preserve the core narrative and meaning. The adapted text should be engaging and appropriate for the target age group.

Respond with JSON: { "adaptedText": "the full adapted text", "adaptedWordCount": number }`,
  };
}

function getGoalGuidelines(goal: string): string {
  const guidelines: Record<string, string> = {
    ENTERTAIN: "Focus on fun, adventure, humor, and engaging storylines.",
    EDUCATE: "Weave educational facts naturally into the narrative. Explain concepts through story.",
    MORAL_LESSON: "Build toward a clear but not preachy moral lesson. Show, don't tell.",
    VOCABULARY: "Introduce and naturally repeat target vocabulary words. Define them through context.",
    BEDTIME: "Use a calm, soothing tone with sensory comfort words (soft, warm, cozy, gentle). Slower pacing with longer descriptive passages. End with the protagonist safe, secure, and happy. No cliffhangers or unresolved conflicts. Avoid sudden loud events or scary surprises. Include winding-down cues (yawning, snuggling, closing eyes).",
  };
  return guidelines[goal] || guidelines.ENTERTAIN;
}
