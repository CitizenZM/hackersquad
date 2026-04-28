import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeWithClaude } from "@/services/ai/claude-client";

export const maxDuration = 60;

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
    veo_prompt: z.string(),
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

    const system = `You are an elite VEO3 video prompt engineer specializing in TikTok/Reels scroll-stopping ads.

CRITICAL RULES:
1. Every "veo_prompt" is a SINGLE flowing paragraph — no headers, no labels, no markdown.
2. SCENE CONTINUITY: The SAME character (exact same appearance, wardrobe, hair) must appear in ALL shots. Repeat the character description verbatim in every veo_prompt. Use the same lighting warmth and color palette across all shots.
3. TRANSITIONS: Each shot must end with a visual cue that connects to the next shot (e.g., "the character turns toward the camera" → next shot starts with "facing the camera"). Describe how the energy flows between shots.
4. NO TEXT in any veo_prompt — no words, no typography, no captions, no logos. Leave space in frame for post-production text overlay.

HOOK SHOT (Shot 1) — Use ONE of these proven scroll-stopping techniques:
- EXTREME MACRO REVEAL: Start with extreme close-up macro of product texture/surface filling entire frame, slowly pulling back to reveal the full product with shallow depth of field
- WHIP PAN PROBLEM→SOLUTION: Fast horizontal whip pan with motion blur from problem state to solution state, speed ramp from 4x to slow-motion 0.5x as camera lands
- UNEXPECTED OBJECT DROP: Top-down angle, product drops into frame from above in 120fps slow motion, particles scatter on impact
- POV HAND REACH: First-person POV, hand reaching toward product, subtle natural head-movement shake
- SPEED RAMP ACTION: Person approaching camera at normal speed, sudden 3x acceleration, then snap to 0.25x slow motion as they present product with low-angle hero framing
- SATISFYING TEXTURE ASMR: Tight shot of hands performing satisfying action (squeezing, peeling, pouring) in 60fps slight slow motion with specular lighting highlights
- SPLIT-SCREEN CONTRAST: Left side desaturated (problem), right side vibrant (solution), camera pushing forward into both simultaneously

CTA ENDING SHOT (Final Shot) — Use ONE of these proven techniques:
- PRODUCT HERO PEDESTAL: Slow-motion orbiting shot around product on clean surface, volumetric light rays creating halo, camera pushes in, leave upper third empty for text
- SNAP-TO-BLACK URGENCY: Person makes decisive gesture (snap/close/drop), instant cut to black, no fade — creates open loop that drives clicks
- WALK-TOWARD-CAMERA: Person walks toward camera holding product, background blurs progressively, extends product toward lens as if handing to viewer, direct eye contact
- SOCIAL PROOF STACK: Quick cuts between 3 different people using product (1s → 0.7s → 0.5s accelerating rhythm), final person nods at camera, hold 2s for text space
- BEFORE/AFTER FREEZE: 0.5s flash of before, 0.5s flash of after, freeze on the after result with boosted saturation

Output flat JSON with fields: creative_type, tone, location, time_of_day, weather, lighting_source, lighting_direction, lighting_quality, lighting_mood, props[], character_role, character_age, character_gender, character_appearance, character_wardrobe, character_personality, character_emotion_start, character_emotion_end, character_speech_style, hook_style, story_hook, story_problem, story_discovery, story_product_use, story_benefit, story_cta, hook_technique (which hook from the list above), cta_technique (which CTA ending from the list above), shots[] (shot_id, duration_seconds, purpose, scene_description, character_action, product_action, camera_angle, camera_movement, shot_type, lighting, motion_effect, dialogue_or_vo, text_overlay, cta, negative_prompt, veo_prompt, transition_to_next)`;

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
      maxTokens: 4096,
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
      shot_list: flat.shots,
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
