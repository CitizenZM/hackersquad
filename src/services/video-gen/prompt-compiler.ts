/**
 * MODEL-AWARE VIDEO PROMPT COMPILER
 *
 * Single source of truth replacing the split-brain between:
 *   - studio/veo-prompt/route.ts (LLM-driven 14-element prompt generation)
 *   - services/ai/prompts/cinematic-prompt-builder.ts (hardcoded dense templates)
 *
 * Input is a structured ShotSpec (one per shot — no inline [0-3s][3-6s] timeline
 * markers baked into a single prompt string). Output is compiled per-model,
 * per-shot, honoring each model's maxPromptChars / supportsNegativePrompt /
 * supportsAudio / supportedParams from the models.ts registry.
 */
import { VIDEO_MODELS, getVideoModel, fitPromptForModel, type VideoModelDef } from "./models";

// ─── ShotSpec / BrandContext ────────────────────────────────────────────────

export interface ShotSpec {
  /** 0-based shot index within the overall video. */
  index: number;
  durationSec: number;
  subject: string;
  action: string;
  setting: string;
  cameraMovement: string;
  lensAndFraming: string;
  lighting: string;
  colorGrade: string;
  /** Material/texture/physics detail (fur, fabric, skin SSS, specular, etc.) */
  materials: string;
  /** Only surfaced in the compiled payload when the target model supportsAudio. */
  audioDirection?: string;
  dialogue?: string;
  /** Things that must NEVER appear. Never silently dropped — see compileForModel. */
  negative: string;
  /** Shared style-bible string restated per shot (brand visual identity, tone). */
  styleBible: string;
}

export interface BrandContext {
  brandName: string;
  productName: string;
  productCategory: string;
  keySellingPoints: string[];
  mustNotAppear: string[];
}

// ─── Category routing ───────────────────────────────────────────────────────

export type CategoryTemplate =
  | "vacuum_appliance"
  | "baby_care"
  | "cycling_outdoor"
  | "beauty"
  | "electronics"
  | "generic";

/**
 * Resolves a free-text productCategory (as produced by brand-analysis.ts's
 * `productCategory` field, e.g. "Home Appliances - Vacuum Cleaners") into an
 * explicit category enum. Replaces the old brandLower.includes()/productLower
 * .includes() guessing scattered across cinematic-prompt-builder.ts.
 *
 * Matching is keyword-based against the category string ONLY (never against
 * brand name) — brand name is treated purely as branding for the anti-confusion
 * clause, not as a category signal. `generic` is the safe default when nothing
 * matches.
 */
export function resolveCategoryTemplate(productCategory: string): CategoryTemplate {
  const c = (productCategory || "").toLowerCase();

  if (/vacuum|home appliance|appliance|cleaner/.test(c)) return "vacuum_appliance";
  if (/baby|infant|nursery|kids|child/.test(c)) return "baby_care";
  if (/cycling|bike|bicycle|helmet|outdoor|sports|fitness/.test(c)) return "cycling_outdoor";
  if (/beauty|skincare|cosmetic|makeup|lotion|serum|fragrance/.test(c)) return "beauty";
  if (/electronic|gadget|tech|device|smart home|audio|headphone/.test(c)) return "electronics";
  return "generic";
}

// ─── Category style presets ──────────────────────────────────────────────────
// Dense physics/specular/lighting language ported from cinematic-prompt-builder.ts,
// condensed into reusable per-section fragments keyed by category. These are
// APPENDED to the shot's own fields, not substitutes for them — the ShotSpec's
// caller-provided content always leads each section.

interface CategoryStylePreset {
  lightingHint: string;
  materialsHint: string;
  colorGradeHint: string;
  negativeExtra: string;
}

const CATEGORY_STYLE_PRESETS: Record<CategoryTemplate, CategoryStylePreset> = {
  vacuum_appliance: {
    lightingHint:
      "Floor-level raking LED at 3200K warm, 45 degrees to carpet surface — illuminates pile nap and any shed fur as individual amber filaments; feathered key at 5600K camera-left, 3:1 fill ratio.",
    materialsHint:
      "Carpet pile with directional nap self-shadowing at fiber apex; anisotropic specular streak on brushed aluminum/polycarbonate housing aligned to brush direction; transparent dustbin caustic glow from internal light.",
    colorGradeHint:
      "Warm naturalistic grade, lifted blacks ~8 IRE, amber-gold midtone push, product housing cooled to grey-teal contrast.",
    negativeExtra:
      "flat overhead lighting, uniform carpet without pile self-shadowing, CGI fur with no guard/undercoat differentiation, plastic sheen on housing",
  },
  baby_care: {
    lightingHint:
      "Large diffused window-simulation key at 5500K camera-left with 1.5-stop diffusion, warm 4800K fill at 3:1 ratio under key, zero hard shadows on skin, warm 2700K practicals in background.",
    materialsHint:
      "Translucent skin quality with subsurface scattering pinkish-amber at cheekbone/knuckle, natural cotton/linen weave visible at macro, lotion opacity graduating from opaque bead to translucent spread film.",
    colorGradeHint:
      "Warm lifted grade, blacks ~10 IRE, +200K midtone warmth, all blues desaturated, soft highlight rolloff.",
    negativeExtra:
      "harsh shadows on skin, clinical white environment, any cool/blue cast, performed or theatrical expression",
  },
  cycling_outdoor: {
    lightingHint:
      "Golden hour hard source at 8-12 degree sun elevation, 2800-3200K warm amber-orange, long horizontal shadows 4-6 body-lengths, helmet ventilation slots casting striped shadow bars on skin.",
    materialsHint:
      "Exertion-flushed skin with micro-bead sweat formation (0.3-0.8mm) acting as convex micro-lenses, semi-matte jersey with sweat-darkening at collar, matte polycarbonate helmet shell with near-zero specular except oblique catch.",
    colorGradeHint:
      "Teal-orange complementary grade, shadows pulled teal, midtones pushed amber, blacks ~5 IRE, elevated contrast.",
    negativeExtra:
      "dry unwet skin at athletic exertion, static camera over 2s duration, over-saturated grade destroying skin tone",
  },
  beauty: {
    lightingHint:
      "Soft beauty-dish key at 5600K with catchlight control, warm 4800K fill, rim light for product glass/bottle specular separation.",
    materialsHint:
      "Product glass/bottle with caustic refraction at base, skin with natural pore visibility and subsurface warmth, no plastic sheen on packaging.",
    colorGradeHint:
      "Clean warm-neutral grade, controlled highlight rolloff, skin tones prioritized over background saturation.",
    negativeExtra:
      "waxy or poreless skin, blown-out product highlights, plastic packaging sheen",
  },
  electronics: {
    lightingHint:
      "Studio three-point setup, hard key for edge definition on device chassis, gobo-flagged rim to reveal port/button detail, cool-neutral 5600K throughout.",
    materialsHint:
      "Anodized aluminum/glass chassis with precise anisotropic reflection, screen glow with correct black-level, no fingerprint smudge unless narratively relevant.",
    colorGradeHint:
      "Clean neutral-cool grade, minimal warmth push, deep true blacks, crisp highlight retention.",
    negativeExtra:
      "warped or melting device geometry, screen content artifacts, exaggerated lens flare",
  },
  generic: {
    lightingHint:
      "Three-point commercial setup: 5600K key at 45/45, warm 4800K fill at 3:1 ratio, 3200K rim for subject separation.",
    materialsHint:
      "Natural skin texture with subsurface scattering, correctly weighted fabric drape, material-appropriate specular per surface.",
    colorGradeHint:
      "Warm naturalistic grade, lifted blacks, gentle highlight rolloff.",
    negativeExtra:
      "plastic skin, AI-smoothed complexion, temporal flicker, hand morphing",
  },
};

// ─── Adapter: Script scenes JSON -> ShotSpec[] ──────────────────────────────

/** Mirrors Script.scenes JSON shape (see prisma/schema.prisma Script model comment
 * and storyboard-grid.ts SceneLike) and CampaignSelection fields consumed by
 * generate-from-script/route.ts. */
export interface ScriptSceneLike {
  sceneNumber?: number;
  startSec?: number;
  endSec?: number;
  segmentLabel?: string;
  shotType?: string;
  focalLength?: string;
  cameraMovement?: string;
  aperture?: string;
  location?: string;
  lighting?: string;
  actorAction?: string;
  productAction?: string;
  voiceover?: string;
  textOverlay?: string;
  transition?: string;
}

export interface ScriptLike {
  title: string;
  body: string;
  totalDurationSec?: number | null;
}

/**
 * Adapts one script scene (as read from Script.scenes JSON) plus brand context
 * into a ShotSpec. Reuses the same field names generate-from-script/route.ts
 * and storyboard-grid.ts already read from scenes (actorAction, productAction,
 * cameraMovement, focalLength, aperture, location, lighting, voiceover).
 */
export function toShotSpec(
  scene: ScriptSceneLike,
  script: ScriptLike,
  brand: BrandContext,
  index: number
): ShotSpec {
  const durationSec =
    typeof scene.startSec === "number" && typeof scene.endSec === "number"
      ? Math.max(1, scene.endSec - scene.startSec)
      : script.totalDurationSec || 5;

  const lensAndFraming = [scene.shotType, scene.focalLength, scene.aperture]
    .filter(Boolean)
    .join(", ") || "medium shot, 50mm, f/2.0";

  const subject = [
    brand.productName,
    scene.actorAction ? "with talent" : "",
  ]
    .filter(Boolean)
    .join(" — ");

  const action = [scene.actorAction, scene.productAction].filter(Boolean).join(". ") ||
    "Natural product interaction.";

  const mustNotAppearClause = brand.mustNotAppear.length
    ? `Must never appear: ${brand.mustNotAppear.join(", ")}.`
    : "";

  return {
    index,
    durationSec,
    subject: subject || brand.productName,
    action,
    setting: scene.location || "modern interior appropriate to brand",
    cameraMovement: scene.cameraMovement || "slow deliberate movement",
    lensAndFraming,
    lighting: scene.lighting || "natural warm key light, soft fill",
    colorGrade: "warm naturalistic grade",
    materials: "",
    audioDirection: scene.voiceover ? `Voiceover: "${scene.voiceover}"` : undefined,
    dialogue: scene.voiceover,
    negative: [
      `${brand.productName} is a real consumer product by ${brand.brandName} — not an animal, creature, or literal interpretation of the brand name.`,
      mustNotAppearClause,
    ]
      .filter(Boolean)
      .join(" "),
    styleBible: [
      `Brand: ${brand.brandName}. Product: ${brand.productName}.`,
      brand.keySellingPoints.length
        ? `Key selling points: ${brand.keySellingPoints.slice(0, 3).join("; ")}.`
        : "",
      script.title ? `Campaign: ${script.title}.` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

// ─── Compilation ─────────────────────────────────────────────────────────────

export interface CompiledShotPayload {
  shotIndex: number;
  prompt: string;
  negativePrompt?: string;
  audioPrompt?: string;
  /** Model params filtered to only the fields the target model's supportedParams lists. */
  params: Record<string, unknown>;
}

/**
 * Assembles the deterministic section order for a single shot:
 *   subject+action -> camera -> lighting -> materials/specular -> grade -> style bible
 * Category style presets are appended (not substituted) to lighting/materials/grade
 * so caller-provided ShotSpec content always leads.
 */
function assembleSections(shot: ShotSpec, preset: CategoryStylePreset): string {
  const sections: string[] = [];

  sections.push(`SUBJECT & ACTION: ${shot.subject}. ${shot.action}`);
  sections.push(`CAMERA: ${shot.lensAndFraming}. Movement: ${shot.cameraMovement}.`);
  sections.push(
    `LIGHTING: ${shot.lighting}${shot.lighting ? " " : ""}${preset.lightingHint}`
  );
  sections.push(
    `MATERIALS & TEXTURE: ${[shot.materials, preset.materialsHint].filter(Boolean).join(" ")}`
  );
  sections.push(`COLOR GRADE: ${[shot.colorGrade, preset.colorGradeHint].filter(Boolean).join(" ")}`);
  sections.push(`STYLE: ${shot.styleBible}`);

  return sections.join("\n\n");
}

function assembleNegative(shot: ShotSpec, preset: CategoryStylePreset): string {
  return [shot.negative, preset.negativeExtra].filter(Boolean).join(", ");
}

/** Params a shot COULD supply — filtered per-model by VideoModelDef.supportedParams. */
function buildCandidateParams(
  shot: ShotSpec,
  aspectRatio: string,
  resolution: string
): Record<string, unknown> {
  return {
    duration: shot.durationSec,
    aspect_ratio: aspectRatio,
    resolution,
  };
}

function filterParams(
  candidate: Record<string, unknown>,
  model: VideoModelDef
): Record<string, unknown> {
  const allowed = model.supportedParams ?? [];
  const out: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in candidate) out[key] = candidate[key];
  }
  return out;
}

export interface CompileOptions {
  aspectRatio?: string;
  resolution?: string;
}

/**
 * Compiles ShotSpec[] into one payload PER SHOT for the given model.
 * Multi-shot honesty: this NEVER emits inline [0-3s][3-6s] timeline markers
 * inside a single combined prompt — each shot gets its own complete payload.
 * The caller (e.g. generate-from-script/route.ts) decides how many of the
 * returned payloads to submit.
 */
export function compileForModel(
  shots: ShotSpec[],
  brand: BrandContext,
  modelKey: string,
  options: CompileOptions = {}
): CompiledShotPayload[] {
  const model = getVideoModel(modelKey);
  if (!model) {
    throw new Error(`Unknown video model: ${modelKey}`);
  }

  const category = resolveCategoryTemplate(brand.productCategory);
  const preset = CATEGORY_STYLE_PRESETS[category];
  const aspectRatio = options.aspectRatio ?? "9:16";
  const resolution = options.resolution ?? "720p";

  return shots.map((shot) => {
    const positive = assembleSections(shot, preset);
    const negative = assembleNegative(shot, preset);

    const { prompt, negativePrompt } = fitPromptForModel(positive, negative, model);

    const payload: CompiledShotPayload = {
      shotIndex: shot.index,
      prompt,
      params: filterParams(buildCandidateParams(shot, aspectRatio, resolution), model),
    };

    if (negativePrompt) payload.negativePrompt = negativePrompt;

    if (model.supportsAudio && (shot.audioDirection || shot.dialogue)) {
      payload.audioPrompt = [shot.audioDirection, shot.dialogue]
        .filter(Boolean)
        .join(" ");
    }

    return payload;
  });
}

// Re-export registry helpers used alongside the compiler.
export { VIDEO_MODELS, getVideoModel };
