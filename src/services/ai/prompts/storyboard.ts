export interface StoryboardInput {
  brandName: string;
  productName?: string;
  scriptTitle: string;
  scriptBody: string;
  hook: string;
  cta: string;
  style?: string;
  platform?: string;
  totalDurationSec?: number;
}

export function buildStoryboardPrompt(input: StoryboardInput) {
  const dur = input.totalDurationSec || 30;
  const platform = input.platform || "TikTok";

  const system = `You are a senior creative director and cinematographer creating a detailed visual storyboard for a ${platform} video ad.

Break the script into 5-7 frames. Each frame must have:
1. A RICH imagePrompt — this is the most important field. It must be 80-150 words describing:
   - Camera: lens, angle, movement (e.g. "85mm f/1.8, low-angle tracking shot, slow dolly-in")
   - Subject: who/what is in frame, exact position, expression, action (NOT looking at camera)
   - Environment: specific location details, surfaces, materials
   - Lighting: key light source, color temperature (Kelvin), quality (hard/soft)
   - Mood/color: overall feel, color palette
   - Negative: what NOT to show (e.g. "no text overlays, no logo")
   Style: "cinematic storyboard concept art, 16:9, photorealistic commercial photography"

2. cameraNotes — specific camera movement AND the transition INTO the NEXT frame from this one.
   Include one of these transition types: cut / cut-on-motion / cross-dissolve / whip-pan / match-cut / speed-ramp / dip-to-black / j-cut / l-cut / smash-cut

Respond with ONLY valid JSON:
{
  "title": "string",
  "style": "string — overall visual style (e.g. 'Warm lifestyle, golden hour, UGC-authentic')",
  "totalDuration": "string — e.g. '30s'",
  "frames": [
    {
      "frameNumber": 1,
      "duration": "string — e.g. '0s-3s'",
      "scene": "string — one concise sentence describing the action",
      "visualDirection": "string — composition, rule of thirds, depth of field, color, mood",
      "voiceover": "string — exact VO text or empty string",
      "textOverlay": "string — on-screen text if any, or empty string",
      "cameraNotes": "string — camera movement + transition to next frame. Format: '[camera action]. Transition: [type] — [why it works]'",
      "imagePrompt": "string — 80-150 word cinematic image generation prompt with camera spec, subject, environment, lighting, negative"
    }
  ]
}`;

  const user = `Create a ${platform} storyboard for "${input.brandName}"${input.productName ? ` — product: ${input.productName}` : ""}:

Script Title: ${input.scriptTitle}
Hook (0-3s): ${input.hook}
Body: ${input.scriptBody}
CTA: ${input.cta}
Total Duration: ${dur}s
Visual Style: ${input.style || "Cinematic, warm, authentic — NOT polished studio aesthetic"}

IMPORTANT for imagePrompt:
- NEVER show text overlays in the image (those are separate)
- ALWAYS specify camera (lens + aperture + movement)
- ALWAYS describe who is in frame and what they are doing
- ALWAYS name exact lighting (e.g. "5600K window light from camera-left")
- Include "cinematic storyboard concept art, ${platform} video ad" at the end of every imagePrompt
- The product "${input.productName || input.brandName}" must appear in at least 3 frames

For cameraNotes, end EVERY frame with "Transition: [type] — [reason]" to link frames together.`;

  return { system, user };
}
