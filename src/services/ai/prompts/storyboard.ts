import {
  computeWindows,
  sceneForWindow,
  sceneDigest,
  type SceneLike,
} from "@/lib/storyboard-grid";

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
  /** Per-scene cinematography plan from the script, used to ground each frame. */
  scenes?: SceneLike[];
}

export function buildStoryboardPrompt(input: StoryboardInput) {
  const dur = input.totalDurationSec || 30;
  const platform = input.platform || "TikTok";
  const scenes = input.scenes ?? [];

  // One keyframe per 3 seconds (capped). The grid is authoritative — the model
  // fills each pre-assigned window, it does not choose how many frames exist.
  const windows = computeWindows(dur);
  const frameCount = windows.length;

  // Build the windowed shot list, grounding each window in the script's scene.
  const windowPlan = windows
    .map((w) => {
      const scene = sceneForWindow(scenes, w);
      return `Frame ${w.frameNumber} — ${w.duration}\n  Script plan: ${sceneDigest(scene)}`;
    })
    .join("\n");

  const system = `You are a senior creative director and cinematographer creating a shot-by-shot storyboard for a ${platform} video ad.

This storyboard uses a FIXED 3-SECOND GRID: you must output EXACTLY ${frameCount} frames, one for every 3-second window of the ${dur}s video. Do not merge, split, add, or skip frames. Frame N covers its assigned time window — fill it.

FIRST, lock a STYLE BIBLE that every frame must obey (this keeps independently-generated images consistent):
- The same single human actor (exact age, ethnicity, hair, wardrobe) in every frame they appear
- One consistent location and set dressing
- One consistent lighting setup and color palette
- The product's exact appearance

Then, for EACH of the ${frameCount} frames, write:
1. imagePrompt — THE most important field, 80–150 words. It MUST re-state the locked style-bible details (actor appearance, wardrobe, location, lighting, product look) every time, because each image is generated independently with no memory of the others. Include:
   - Camera: lens + aperture + angle + movement (e.g. "50mm f/2.0, eye-level, slow push-in")
   - Subject: exact position, expression, action (subject NOT looking at camera)
   - Environment: specific surfaces, materials, props
   - Lighting: named source + color temp in Kelvin + quality
   - Color/mood palette
   - End with: "cinematic storyboard concept art, ${platform} video ad, photorealistic, 16:9"
   - Never depict on-screen text/UI/logos in the image.
2. cameraNotes — camera movement for this frame + the transition INTO the next frame. Format: "[camera action]. Transition: [type] — [why]". Transition types: cut / cut-on-motion / cross-dissolve / whip-pan / match-cut / speed-ramp / dip-to-black / j-cut / l-cut / smash-cut.

Honor each frame's "Script plan" cinematography when provided — match its shot type, lens, lighting, action, and voiceover.

Respond with ONLY valid JSON:
{
  "title": "string",
  "style": "string — the locked style bible in one line (actor, wardrobe, location, lighting, palette)",
  "totalDuration": "${dur}s",
  "frames": [
    {
      "frameNumber": 1,
      "duration": "0s-3s",
      "scene": "string — one concise sentence of the action in this 3s",
      "visualDirection": "string — composition, depth of field, color, mood",
      "voiceover": "string — exact VO for this window or empty string",
      "textOverlay": "string — on-screen text for this window or empty string",
      "cameraNotes": "string — camera movement + 'Transition: [type] — [why]'",
      "imagePrompt": "string — 80–150 words, restates style bible + camera + lighting"
    }
    // ... EXACTLY ${frameCount} frames, in order
  ]
}`;

  const user = `Create the ${frameCount}-frame, 3-second-grid ${platform} storyboard for "${input.brandName}"${input.productName ? ` — product: ${input.productName}` : ""}:

Script Title: ${input.scriptTitle}
Hook (0–3s): ${input.hook}
Body: ${input.scriptBody}
CTA: ${input.cta}
Total Duration: ${dur}s → ${frameCount} frames at 3s each
Visual Style: ${input.style || "Cinematic, warm, authentic — NOT polished studio aesthetic"}

PER-FRAME SCRIPT PLAN (ground each frame's imagePrompt in its plan):
${windowPlan}

RULES:
- Output EXACTLY ${frameCount} frames, frameNumber 1..${frameCount}, durations exactly as listed above.
- Every imagePrompt restates the consistent actor / wardrobe / location / lighting / product so all ${frameCount} images look like one coherent shoot.
- Specify camera (lens + aperture + movement) and named lighting (e.g. "5600K window light, camera-left") in every imagePrompt.
- The product "${input.productName || input.brandName}" must be clearly visible in at least ${Math.max(3, Math.ceil(frameCount / 2))} frames.
- Never render on-screen text inside the image; put copy in textOverlay instead.
- End every cameraNotes with "Transition: [type] — [reason]".`;

  return { system, user };
}
