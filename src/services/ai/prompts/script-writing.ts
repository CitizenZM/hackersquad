export interface ScriptInput {
  brandName: string;
  angle: {
    title: string;
    description: string;
    targetEmotion: string;
    narrativeType: string;
  };
  sellingPoints: string[];
  campaignGoal?: string;
  briefing?: string;
}

export function buildScriptWritingPrompt(input: ScriptInput) {
  const system = `You are a world-class ad copywriter specializing in video scripts.
Write a complete ad script with multiple hook and CTA variants.
Respond with ONLY a JSON object:
{
  "title": "string - script title",
  "angle": "string - the angle this script is based on",
  "format": "short_form|long_form|ugc|testimonial",
  "duration": "15s|30s|60s",
  "hookVariants": ["3 different opening hooks"],
  "body": "string - the main script body with stage directions in [brackets]",
  "ctaVariants": ["3 different closing CTAs"],
  "narrativeType": "PROBLEM_SOLUTION|TESTIMONIAL|DEMONSTRATION|LIFESTYLE|EDUCATIONAL|COMPARISON|STORY_ARC|UGC_STYLE|TREND_RIDING|BEFORE_AFTER",
  "targetEmotion": "string",
  "predictedScore": number
}`;

  const user = `Write an ad script for "${input.brandName}":

Angle: ${input.angle.title}
Description: ${input.angle.description}
Target Emotion: ${input.angle.targetEmotion}
Narrative Type: ${input.angle.narrativeType}
Campaign Goal: ${input.campaignGoal || "Conversion"}

Key Selling Points to Weave In:
${input.sellingPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

${input.briefing ? `\nProject Brief:\n${input.briefing.slice(0, 1000)}` : ""}

Write a compelling 30-second video ad script. Include:
- 3 different hook variants (the first 3 seconds)
- Full script body with visual/stage directions
- 3 different CTA variants`;

  return { system, user };
}
