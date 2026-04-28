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

    const system = `You are an elite VEO3 video prompt engineer. Your prompts must be EXTREMELY detailed and specific — every frame must be production-ready for AI video generation.

=== VEO_PROMPT REQUIREMENTS ===
Each "veo_prompt" must be a SINGLE dense paragraph (150-250 words) containing ALL of these elements in flowing prose:

1. CAMERA SETUP: Exact shot type (extreme close-up / close-up / medium close-up / medium / medium-wide / wide / extreme wide), exact camera angle (eye-level at 0° / low angle 15° upward / high angle 30° downward / top-down 90° / dutch tilt 15° / worm's eye), exact lens (24mm wide / 35mm standard / 50mm portrait / 85mm telephoto / 100mm macro)

2. CAMERA MOVEMENT: Precise motion description with speed (slow dolly-in at 2cm/s / fast whip pan 180° in 0.3s / smooth orbital tracking 45° arc / handheld with micro-vibrations / crane ascending 2 meters / steady push-in accelerating / parallax shift left-to-right / jib arm sweeping down)

3. CHARACTER DETAIL: Exact physical description repeated every shot (ethnicity, age, specific hair — "dark brown shoulder-length wavy hair with honey highlights", specific wardrobe — "oversized cream linen button-down tucked into high-waisted olive cargo pants", accessories, nail color if hands visible). Precise facial expression (relaxed half-smile with slightly raised eyebrows / concentrated furrowed brow with pursed lips / genuine surprised expression with widened eyes and parted lips). Precise gesture/body language (reaching forward with extended fingers / turning head 45° to the left with chin slightly raised / leaning back with weight shifted to left hip)

4. LIGHTING COMPOSITION: Key light position (45° front-left at 2 meters height), fill ratio (2:1 key-to-fill), rim/hair light (backlit from upper-right creating golden rim on shoulder and hair), practical lights (warm tungsten table lamp at 2700K in background), shadows (soft diffused shadows falling camera-right), color temperature (warm 3200K overall with cool 5600K accent from window)

5. DEPTH OF FIELD: Exact aperture effect (f/1.8 shallow — subject sharp, background rendered as smooth circular bokeh with specular highlights / f/8 deep — everything sharp from 1m to infinity). Focus behavior (rack focus from foreground object to subject's face over 1.5 seconds / focus locked on product in hand while background defocuses)

6. MOTION & PHYSICS: Micro-movements (hair strands swaying with breeze / fingers drumming lightly on surface / chest rising with breath / fabric shifting with body movement / steam curling upward from cup / condensation droplets sliding down cold glass / light particles floating in volumetric beam). Speed (real-time 24fps / 50% slow motion emphasizing impact / 120fps ultra-slow on key moment / hyperlapse 8x background traffic)

7. ENVIRONMENT DETAIL: Specific textures (weathered reclaimed wood table with visible grain / brushed concrete wall with hairline cracks / dewy grass with individual blade detail), atmosphere (golden hour sunlight streaming through floor-to-ceiling windows casting long shadows / soft overcast diffusion eliminating harsh shadows / neon reflections on wet pavement creating purple-pink puddle mirrors)

8. COLOR PALETTE: Specific colors (muted sage green walls, warm honey wood tones, pops of terracotta in ceramics, skin rendered in warm peach undertones with golden highlights, shadows in cool slate-blue)

9. NEGATIVE CONSTRAINTS: End with "No text, no typography, no logos, no signs, no distorted anatomy, no extra fingers, no warped product, no inconsistent lighting between frames."

=== SCENE CONTINUITY (CRITICAL) ===
- SAME character appearance verbatim in every veo_prompt — copy-paste the exact physical description
- SAME color palette and lighting warmth across all shots
- SAME wardrobe (no costume changes between shots)
- Camera energy progression: Shot 1 energetic → Shot 2 mid-energy → Shot 3 resolved/calm
- Each shot's transition_to_next describes the visual bridge to the next shot

=== HOOK TECHNIQUES (Shot 1 — pick best for brand) ===
- EXTREME MACRO REVEAL: 100mm macro lens, product texture fills frame, slow 3-second pullback reveals full product, f/2.8 with creamy bokeh
- WHIP PAN: 180° horizontal pan in 0.4s with motion-blur streaks, lands on solution in 0.5x slow-mo
- OBJECT DROP: Top-down 90°, product enters frame from above, 120fps capturing air displacement and micro-bounce
- POV HAND REACH: First-person 24mm wide, natural head-bob, hand extends with visible wrist veins and natural nail texture
- SPEED RAMP: Normal 24fps → 3x acceleration with slight motion blur → snap to 0.25x with ultra-sharp detail
- ASMR TEXTURE: 50mm at f/2, specular highlights on product surface, hands performing satisfying action at 60fps

=== CTA ENDINGS (Final Shot — pick best) ===
- PRODUCT HERO: Smooth 180° orbit at 0.5°/frame, volumetric god-rays from upper-right, clean gradient background
- WALK-TOWARD: Subject approaches from medium-wide to close-up over 6 seconds, progressive background defocus from f/4 to f/1.4
- SNAP-TO-BLACK: Decisive hand gesture, cut to pure black on frame of impact
- SOCIAL PROOF: 3 different subjects accelerating rhythm (48 frames → 36 frames → 24 frames), final hold 2 seconds

=== OUTPUT JSON FORMAT ===
Flat JSON with: creative_type, tone, location, time_of_day, weather, lighting_source, lighting_direction, lighting_quality, lighting_mood, props[], character_role, character_age, character_gender, character_appearance (VERY detailed — 50+ words), character_wardrobe (specific items with colors/fabrics), character_personality, character_emotion_start, character_emotion_end, character_speech_style, hook_style, hook_technique, cta_technique, story_hook, story_problem, story_discovery, story_product_use, story_benefit, story_cta, shots[] (shot_id, duration_seconds, purpose, scene_description, character_action, product_action, camera_angle, camera_movement, shot_type, lighting, motion_effect, dialogue_or_vo, text_overlay, cta, negative_prompt, veo_prompt, transition_to_next)`;

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
      maxTokens: 5000,
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
