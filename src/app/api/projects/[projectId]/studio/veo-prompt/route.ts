import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";

export const maxDuration = 60;

function buildVeoPrompt(shot: Record<string, unknown>, charDesc: string, flat: Record<string, unknown>): string {
  const parts = [
    `Shot on ${shot.shot_type || "medium shot"} with ${shot.camera_angle || "eye-level"} angle using a ${shot.camera_movement || "steady"} camera movement.`,
    shot.scene_description,
    `The character — ${charDesc} — ${shot.character_action || "stands naturally"}.`,
    shot.product_action ? `The product ${shot.product_action}.` : "",
    `Lighting: ${shot.lighting || flat.lighting_source + " " + flat.lighting_direction}, creating a ${flat.lighting_mood || "natural"} mood.`,
    `Environment: ${flat.location}, ${flat.time_of_day}, ${flat.weather}. Props include ${(flat.props as string[])?.join(", ") || "minimal set dressing"}.`,
    shot.motion_effect ? `Motion details: ${shot.motion_effect}.` : "",
    `Color palette: warm natural tones with ${flat.lighting_quality || "soft"} quality.`,
    `Depth of field: shallow f/2.0, subject sharp with smooth background bokeh.`,
    `No text, no typography, no logos, no signs, no distorted anatomy, no extra fingers, no warped products, no inconsistent lighting.`,
  ].filter(Boolean);
  return parts.join(" ");
}

// Simplified flat schema that gpt-4o-mini can reliably produce
const veoResultSchema = z.object({
  creative_type: z.string(),
  tone: z.string(),
  location: z.string(),
  time_of_day: z.string(),
  weather: z.string(),
  lighting_source: z.string(),
  lighting_direction: z.string(),
  lighting_quality: z.string(),
  lighting_mood: z.string(),
  props: z.array(z.string()),
  character_role: z.string(),
  character_age: z.string(),
  character_gender: z.string(),
  character_appearance: z.string(),
  character_wardrobe: z.string(),
  character_personality: z.string(),
  character_emotion_start: z.string(),
  character_emotion_end: z.string(),
  character_speech_style: z.string(),
  hook_style: z.string(),
  hook_technique: z.string(),
  cta_technique: z.string(),
  story_hook: z.string(),
  story_problem: z.string(),
  story_discovery: z.string(),
  story_product_use: z.string(),
  story_benefit: z.string(),
  story_cta: z.string(),
  shots: z.array(z.object({
    shot_id: z.string(),
    duration_seconds: z.coerce.number(),
    purpose: z.string(),
    scene_description: z.string(),
    character_action: z.string(),
    product_action: z.string(),
    camera_angle: z.string(),
    camera_movement: z.string(),
    shot_type: z.string(),
    lighting: z.string(),
    motion_effect: z.string(),
    dialogue_or_vo: z.string(),
    text_overlay: z.string(),
    cta: z.string(),
    negative_prompt: z.string(),
    veo_prompt: z.string().optional().default(""),
    test_prompt: z.string().optional().default(""),
    transition_to_next: z.string(),
  })),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await request.json();
  const { scriptId } = body;

  if (!scriptId) {
    return NextResponse.json({ error: "scriptId required" }, { status: 400 });
  }

  try {
    const [project, script, storyboard, audience, deepAnalysis] = await Promise.all([
      prisma.project.findUnique({ where: { id: projectId }, include: { brand: true } }),
      prisma.script.findUnique({ where: { id: scriptId } }),
      prisma.storyboard.findFirst({ where: { projectId, scriptId } }),
      prisma.audienceProfile.findUnique({ where: { projectId } }),
      prisma.deepAnalysis.findUnique({ where: { projectId } }),
    ]);

    if (!project || !script) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const brand = project.brand;
    const hooks = script.hookVariants as string[];
    const ctas = script.ctaVariants as string[];
    const segments = (audience?.segments as { name: string; ageRange: string; description: string }[]) || [];
    const vibeData = deepAnalysis?.vibeAnalysis as { dominantTones?: { tone: string }[]; pacingProfile?: string; visualStyleNotes?: string } | null;
    const ctaData = deepAnalysis?.ctaAnalysis as { commonCTAs?: { cta: string }[]; placement?: string } | null;

    const system = `You are a VEO3 cinematic prompt engineer specializing in high-converting short-form video ads (TikTok/Reels/Shorts). Generate exactly 3 shots, 8 seconds each, vertical 9:16.

## CORE OUTPUT RULES
- veo_prompt: 150–250 words per shot, one dense paragraph. Include ALL 12 elements below in order.
- test_prompt: ≤100 words, distilled 3-second version of the same shot for quick clip testing.
- Character description MUST be identical across all 3 shots (copy-paste the same string).
- ZERO text, typography, logos, or UI in any visual frame.
- Shot 1 = scroll-stopping hook (macro reveal / whip pan / object drop / POV reach / speed ramp).
- Shot 3 = product hero CTA (orbit shot / walk-toward-camera / snap-to-black freeze).

## VEO_PROMPT ELEMENT ORDER (follow exactly):
1. CAMERA: lens type (macro 100mm, 35mm wide, 85mm portrait, 24mm ultra-wide) + aperture (f/1.4, f/1.8, f/2.8) + movement (static, slow push-in 10% zoom, whip pan right, dolly track left, handheld UGC shake, drone descend, rack focus pull).
2. SUBJECT: age, gender, ethnicity, exact facial features, hair (length/color/style), skin tone + texture, emotional state, eye direction.
3. WARDROBE: brand aesthetic, specific garments, color, fit (oversized linen shirt, white ribbed tank, charcoal slim-fit trousers).
4. ACTION: micro-action + main action at millimeter resolution (e.g., "fingers curl around product base, thumb depresses power button with audible click, slow clockwise wrist rotation reveals label toward camera").
5. PRODUCT: frame position (left third / center / right third), angle (front-on / 3/4 / top-down), specular highlight placement (key light at 45° hits logo, rim light traces bottle edge).
6. ENVIRONMENT: hyper-specific set (not "kitchen" → "modern open-plan kitchen, honed Calacatta marble island, matte black Gaggenau induction cooktop partially visible at frame edge, morning golden hour streaming through east-facing floor-to-ceiling windows, thin steam rising from mug in far background").
7. LIGHTING: source type (natural window, LED 3-panel softbox, ring light, practical floor lamp) + direction (45° key from camera-left, fill from right, hair light above) + color temperature (2700K warm amber, 4000K neutral, 5600K daylight) + shadow quality (hard-edged, feathered soft, shadowless high-key).
8. COLOR PALETTE: 3–4 specific hex-adjacent descriptors (warm ivory #F5F0E8, dusty sage #8FA888, muted terracotta #C4714F, deep espresso #2C1A0E).
9. DEPTH OF FIELD: foreground / subject / background sharpness ("foreground counter edge at 5% blur, subject tack sharp, background completely bokeh at f/1.8, product label readable").
10. MOTION & TIMING: per-second action timeline ("0–1s: camera static, subject lifts product; 1–3s: slow push-in begins, product fills 40% of frame; 3–6s: rack focus shifts to face; 6–8s: freeze frame, product centered").
11. AUDIO CUES: ambient environment sound, product sound effect, VO timing cue if applicable (e.g., "ambient coffee shop hum under, product click at 1.2s, VO begins at 2s").
12. NEGATIVE PROMPT: "No text overlays, no watermarks, no subtitles, no distorted faces, no extra fingers, no lens flare, no shaky handheld blur unless specified, no pixelation, no artificial plastic-looking skin, no inconsistent lighting between cuts, no visible logos except product."
END each veo_prompt with: STYLE: [3–5 style tags, e.g. "UGC authentic, golden hour warmth, Apple product shot aesthetic, TikTok native format, editorial cleanliness"].

## JSON SCHEMA
Output flat JSON with these exact keys: creative_type, tone, location, time_of_day, weather, lighting_source, lighting_direction, lighting_quality, lighting_mood, props[], character_role, character_age, character_gender, character_appearance, character_wardrobe, character_personality, character_emotion_start, character_emotion_end, character_speech_style, hook_style, hook_technique, cta_technique, story_hook, story_problem, story_discovery, story_product_use, story_benefit, story_cta, shots[{shot_id, duration_seconds, purpose, scene_description, character_action, product_action, camera_angle, camera_movement, shot_type, lighting, motion_effect, dialogue_or_vo, text_overlay, cta, negative_prompt, veo_prompt, test_prompt, transition_to_next}]`;

    const user = `Generate VEO3 campaign prompts for:

BRAND: ${project.brandName}
Product: ${brand?.valueProposition || project.brandName}
Brand promise: ${brand?.brandPromise || "N/A"}
Tone: ${brand?.toneOfVoice || "professional"}
Category: ${project.category || "N/A"}
Campaign goal: ${project.campaignGoal || "conversion"}
Platform: TikTok / Instagram Reels / YouTube Shorts

AUDIENCE:
${segments.map(s => `- ${s.name} (${s.ageRange}): ${s.description}`).join("\n") || "General US consumers"}

VIBE (from content analysis):
- Tones: ${vibeData?.dominantTones?.map(t => t.tone).join(", ") || "professional, dynamic"}
- Pacing: ${vibeData?.pacingProfile || "fast-paced"}
- Visual: ${vibeData?.visualStyleNotes || "clean, modern"}
- CTA style: ${ctaData?.commonCTAs?.map(c => c.cta).join(", ") || "Shop now"}

SCRIPT:
Title: ${script.title}
Format: ${script.format} · ${script.duration}
Emotion: ${script.targetEmotion}

Hook options:
${hooks.map((h, i) => `${i + 1}. ${h}`).join("\n")}

Body:
${script.body}

CTA options:
${ctas.map((c, i) => `${i + 1}. ${c}`).join("\n")}

${storyboard ? `STORYBOARD REFERENCE:
${(storyboard.frames as { frameNumber: number; scene: string; voiceover: string; cameraNotes: string }[]).map(f => `Frame ${f.frameNumber}: ${f.scene} | Camera: ${f.cameraNotes} | VO: ${f.voiceover}`).join("\n")}` : ""}

Generate 3 VEO3 shots (8s each). Each shot must have a complete veo_prompt paragraph. Format: vertical 9:16, 1080p, 24fps.`;

    const flat = await analyzeWithClaude({
      systemPrompt: system,
      userPrompt: user,
      responseSchema: veoResultSchema,
      maxTokens: 3000,
    });

    // Restructure into nested format for the UI
    const result = {
      project_meta: {
        project_name: `${project.brandName}_VEO3_Campaign`,
        brand: project.brandName,
        product_name: brand?.valueProposition || project.brandName,
        campaign_goal: project.campaignGoal || "conversion",
        platform: "TikTok / Instagram Reels / YouTube Shorts",
        video_format: { aspect_ratio: "9:16", resolution: "1080p", fps: 24, total_duration_seconds: 24, clip_duration_seconds: 8 },
      },
      character_system: {
        main_character: {
          role: flat.character_role,
          age: flat.character_age,
          gender: flat.character_gender,
          appearance: flat.character_appearance,
          wardrobe: flat.character_wardrobe,
          personality: flat.character_personality,
          emotional_state_start: flat.character_emotion_start,
          emotional_state_end: flat.character_emotion_end,
          speech_style: flat.character_speech_style,
        },
      },
      environment_system: {
        location: flat.location,
        time_of_day: flat.time_of_day,
        weather: flat.weather,
        lighting: { source: flat.lighting_source, direction: flat.lighting_direction, quality: flat.lighting_quality, mood: flat.lighting_mood },
        props: flat.props,
      },
      creative_strategy: {
        creative_type: flat.creative_type,
        tone: flat.tone,
        hook_style: flat.hook_style,
        hook_technique: flat.hook_technique,
        cta_technique: flat.cta_technique,
        story_arc: {
          hook: flat.story_hook,
          problem: flat.story_problem,
          discovery: flat.story_discovery,
          product_use: flat.story_product_use,
          benefit_reveal: flat.story_benefit,
          cta: flat.story_cta,
        },
      },
      shot_list: flat.shots.map((shot) => {
        // Construct detailed veo_prompt server-side from shot fields + character if AI left it empty
        const charDesc = `${flat.character_gender}, ${flat.character_age}, ${flat.character_appearance}, wearing ${flat.character_wardrobe}`;
        const builtPrompt = shot.veo_prompt || buildVeoPrompt(shot, charDesc, flat);
        return { ...shot, veo_prompt: builtPrompt, test_prompt: shot.test_prompt || "" };
      }),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("VEO prompt generation failed:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to generate VEO prompts" },
      { status: 500 }
    );
  }
}
