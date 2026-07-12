/**
 * CINEMATIC PROMPT BUILDER
 * Generates 1000-4000 word broadcast-quality video prompts from brand + product context.
 * Based on analysis of SharkNinja commercial production (Universal McCann / p3 Maine),
 * baby skincare category benchmarks (Mustela, Johnson's, Tubby Todd),
 * and cycling sports production (GoPro, Red Bull, cycling helmet category).
 *
 * The "10 Iron Laws" are embedded throughout:
 * 1. Name the camera body (triggers color science)
 * 2. Specify light source size (determines shadow quality)
 * 3. Trigger SSS with backlight (organic skin/fur)
 * 4. Name the imperfection (photorealism trigger)
 * 5. Give material its physics (fur lag, fabric weight, carpet nap)
 * 6. Write the negative block (suppress plastic/AI defaults)
 * 7. Anchor color temperature (Kelvin values)
 * 8. One specular per surface type (correct per-material)
 * 9. Describe motion hierarchy (subject > camera > secondary)
 * 10. Use the right focal length (perspective relationship)
 */

export interface CinematicPromptInput {
  brandName: string;
  productName: string;
  productDescription?: string;
  category?: string;
  campaignGoal?: string;
  platform: string;
  totalDurationSec: number;
  selectedActorRole?: string;
  selectedActorDesc?: string;
  selectedEnvironment?: string;
  environmentNotes?: string;
  sellingPoints?: string[];
  scenes?: Array<{
    startSec?: number;
    endSec?: number;
    segmentLabel?: string;
    shotType?: string;
    location?: string;
    lighting?: string;
    actorAction?: string;
    productAction?: string;
    voiceover?: string;
  }>;
}

// ─── Brand-specific prompt templates ─────────────────────────────────────────

function buildSharkNinjaVacuumPrompt(input: CinematicPromptInput): string {
  const dur = input.totalDurationSec;
  const hook = Math.round(dur * 0.3);
  const demo = Math.round(dur * 0.7);

  return `[PRODUCTION PACKAGE]
Camera body: Arri Alexa Mini LF, rated at 4.5K ARRIRAW, color science calibrated to produce organic skin tones with extended dynamic range of 14+ stops. Lenses: Cooke S7/i anamorphic set for primary shots — 35mm T2.0 for establishing and environment (slight characteristic barrel distortion grounds the space), 85mm T1.4 for talent close-ups (gentle facial compression, lash-to-hair separation), 100mm T2.8 macro for product inserts (flat perspective renders surface texture with maximum fidelity). Frame rate: 24fps master timeline. Insert shots overcranked to 120fps played at 24fps — five-times slow motion preserving full physics of fur, lotion, and vacuum brush interaction. Format: 9:16 vertical, 720p minimum, sub-16:9 safe area respected. Grain structure: Kodak Vision3 500T emulation, fine luminance noise at shadow rolloff — removes clinical digital cleanliness. No post-sharpening applied.

[LIGHTING RIG — PRIMARY ROOM SETUP]
This is a high-key lifestyle interior matching SharkNinja's established commercial palette (Universal McCann / p3 Maine production standard):
KEY LIGHT: Full-length 200cm × 120cm Chimera Lightbank positioned camera-left at 45-degree horizontal offset, 45-degree vertical elevation. Mimics large north-facing window. Color temperature: 5600K daylight neutral. Light output: 600 Ws. Shadow edge: feathered penumbra spanning 5–7cm on carpet surface. Specular roll-off across subject's cheekbone reads satin — not glossy, not matte.
FILL LIGHT: 80cm × 120cm softbox camera-right at 2:1 ratio under key (3:1 lighting ratio overall). Color temperature: 4800K — slightly warmer than key to simulate warm wall bounce. Fills shadow side of face to keep it open and relatable (commercial, not dramatic). No fill spill below shoulder.
HAIR/RIM LIGHT: Hard Fresnel spot at 170-degree offset directly above-behind talent. Color temperature: 3200K warm tungsten. Creates anisotropic specular halo through brunette or dark hair — the dual-lobe specular streak aligned to hair direction (elongated highlight, not perpendicular disk). This separates talent from background and subliminally references the anti-hair-wrap product benefit.
FLOOR RAKING LIGHT: Dedicated LED panel placed at floor level, 45 degrees to carpet surface, color temperature 3200K warm. Illuminates carpet pile texture from below nap angle — creates micro-shadows in carpet valleys, highlights fur tips amber-gold. This is the signature Shark "dirty carpet reveal" lighting — fur reads as golden filaments against the greige carpet field. This light is critical: without it, the carpet reads flat and the fur disappears.
PRODUCT LIGHT: Dedicated strip LED gobo-flagged to hit only the vacuum housing. Creates anisotropic streak on brushed aluminum chassis — horizontal elongated specular aligned to brush direction of the surface finish. Secondary rim from behind illuminates the transparent polycarbonate dustbin window, creating caustic internal glow that makes extracted fur visible as a proof point. Product label receives its own specular bounce from a small reflector card — gloss label coating catches a controlled white rectangle.
PRACTICALS: Floor lamp in background (warm 2700K, contributes ambient amber fill), table lamp on side surface (2700K). These make the room feel lived-in and add depth separation from the background.

[ENVIRONMENT — LIVING ROOM SET]
Suburban American family living room. 9-foot standard ceiling height — not a loft, not a mansion. This is the aspirational everyday, not luxury editorial. Details:
Floor: Wall-to-wall Saxony cut pile carpet, 10mm pile height, warm greige — approximately #CEC5B5. Pile direction establishes directional nap sheen: lighter when lit along the nap, darker counter-nap. Self-shadowing at pile apex under raking light. Compression marks at prior furniture contact zones — slightly darker depression visible against surrounding pile. Prior shed fur distributed across surface: individual golden retriever strands interlocked with carpet fiber, one end caught in loop pile, other end catching floor raking light as an amber filament. Clump accumulation at sofa perimeter — denser near dog resting zone.
Sofa: Mid-market sectional, warm grey linen upholstery, 100% cotton weave structure visible under macro — approximately 120 thread count per inch. One cream throw blanket draped at corner, weighted natural fall, single compression fold from prior use. No clutter on seat cushions. Subtle ambient occlusion at sofa leg-to-carpet junction — darkest shadow line in frame.
Background: Warm cream wall, a low-profile media console in white oak finish (grain direction horizontal), a small potted trailing plant (green providing color accent). Nothing distracting. The eye should travel: carpet fur → vacuum action → clean carpet → product logo.

[GOLDEN RETRIEVER — COMPLETE SPECIFICATION]
Adult male golden retriever, approximately 3–4 years old (fully developed adult coat, not puppy fuzz, not senior grey). Weight 28–32kg — proper athletic build. Positioned lying on carpet in a half-curl, front legs extended, muzzle resting on foreleg.
COAT STRUCTURE: Guard coat average 65mm length at dorsal ridge, swept toward tail, semi-gloss surface reflecting raking light. Ear feathering — ultra-fine guard hair at 40mm with high wave frequency, translucent amber at strong backlight exposure. Chest and belly: long decorative feathering, cream-white tones. Undercoat: dense cream-white visible at sternum parting when guard hair separates. Root-to-tip color graduation: cream at base transitioning to amber-gold at tip, sun-bleached lighter tone at dorsal saddle ridge.
COAT IN LIGHT: Floor raking light (3200K warm) strikes guard coat from below-lateral angle. Individual strand tips read as amber-gold filaments against the mid-tone carpet. Rim halo at crown from hair light (170-degree offset) creates an aureole of translucent amber-gold at the dog's silhouette edge. Backlight transmission through ear feathering shows bone structure lightly — confirms biological authenticity.
DOG BEHAVIOR DURING SHOT: Relaxed rest state. Flank breathing visible — ribcage expansion and contraction at 16–18 cycles per minute, subtle undulation of dorsal coat secondary to breath. Occasional nose flare — nostril dilation (2Hz pattern) during ambient scent sampling. One soft full blink during shot — lower lid engagement, full ocular seal, reopening at measured pace. Ear micro-pivot 15 degrees at off-camera sound cue. Dog is NOT performing. Dog is NOT looking at camera (unless in specific cutaway where direct gaze is used for empathy moment).
SHED FUR ON CARPET: Visible distributed across 60cm radius from dog resting position. Individual strands 40–70mm length, amber-gold, lying along pile direction. Some strands interlocked with carpet loop structure at both ends — held against liberation. Micro-clumps of 8–12 strands at sofa leg perimeter. Under floor raking light, each shed strand catches as an individual golden filament — the visual proof-of-problem that motivates the purchase.

[TALENT — FEMALE LEAD]
Female, 32–36 years old. Brunette hair, warm brown, approximately shoulder length, worn down with natural lived-in wave — thermal-set S-curve from blow-dry, slight flyaway at crown. NOT salon-fresh. Hair light creates anisotropic specular streak aligned to hair direction and dual-lobe secondary highlight at tip strands. Root-to-tip graduation: slightly darker at root, warm amber at tip in backlight.
SKIN: Natural dewy finish. Visible skin pores at T-zone under directional key light. Fine vellus hair along jaw perimeter catching lateral fill at 90 degrees — golden micro-halo. Subsurface scattering pinkish-amber luminance at nasal bridge and cheekbone. Hemoglobin undertone visible at lip vermillion border. Slight natural sebum sheen at nasal bridge — not glossy, not matte. Single specular highlight on cheekbone apex from octabox. Crow's feet engage lightly at the expression beat. This is NOT airbrushed. NOT poreless. NOT symmetrical lighting on both cheeks.
MAKEUP: Satin-finish medium coverage foundation with pore bleed-through visible at macro. Diffused blush apple-to-temple in gradient fade. Warm highlight at Cupid's bow. Defined brow with micro-stroke texture resembling natural hair. Natural mascara — individual lash separation, no clumping. Satin nude lip, vermillion border defined, lip rhytid lines present at rest. Natural moisture accumulation at lip corners.
WARDROBE: Fitted cream ribbed merino wool crewneck top, approximately 12-gauge knit. Soft fuzzy nap catching key light as a directional sheen. Fabric falls from shoulders with natural gravity — slight weight pull visible at the hem when she reaches forward. Dark well-fitted straight-leg jeans. Neutral sneakers partially visible. NO patterns. NO logos. Nails: clean, short, no color or sheer nude at most — nails appear in every hand shot.
EXPRESSION ARC: She is NOT distressed or frustrated in a performative way. She is a competent adult who maintains a clean home. Slight raised-eyebrow composure during problem acknowledgment → focused purposeful expression during vacuuming → quiet satisfaction nod at the end. This is the SharkNinja tonal signature: aspirational competence, not dramatic rescue.

[SHOT CHOREOGRAPHY — ${dur}-SECOND TIKTOK STRUCTURE]
The SharkNinja commercial formula compressed to ${dur}s:

0s–${hook}s [HOOK — PROBLEM REVEAL]:
Camera: Macro lens at carpet-surface level (3–5cm off floor), shooting along carpet plane at 15-degree elevation angle. Perspective: you see carpet pile stretching into shallow depth-of-field. Golden retriever shed fur in foreground: individual amber strands catching floor raking light — this is the "dirty carpet reveal" signature Shark shot. Dog's body visible in soft focus background — flank breathing perceptible. DOG IS CALM. Not agitated. This fur is normal life.
Camera motion: LOCKED. Absolutely static. The stillness makes the fur-laden carpet read as a fact, not a problem being shown to you. Cut is on the next breath cycle.
Sound: Room ambient. Dog exhale. Carpet ambient occlusion.

${hook}s–${demo}s [PRODUCT DEMONSTRATION]:
Camera: Steadicam operator tracking alongside vacuum at waist height of the machine. Lens: 35mm T2.0. The vacuum enters from frame-right in a low tracking move. Floor-level raking light continues — the approach zone shows fur-laden carpet, the vacuum wake shows clean carpet. This contrast in a single frame is the primary visual proof point.
INSERT — BRUSHROLL DETAIL: 100mm macro, 120fps overcranked. Transparent polycarbonate dustbin window fills frame. Shed fur being ingested: individual strand liberation from carpet pile in progressive sequence, fur accelerating through intake aperture, anti-hair-wrap mechanism — NO accumulation on the brushroll. This is the physical proof of the key selling point. Light through the transparent window — caustic internal glow. Duration: 2.5 seconds real-time (12 seconds overcranked footage compressed to 2.5s).
INSERT — DUSTBIN: Medium close, 85mm. The transparent collection chamber shows extracted fur compacting as a tan-gold mass. LED indicator on product (if applicable) illuminates in response to dirt load. This is the "satisfying gross" shot — the viewer's brain processes PROOF.

${demo}s–${dur}s [RESOLUTION — CLEAN CARPET REVEAL]:
Camera: Returns to carpet-level angle matching the hook — visual callback. The carpet pile shows NO fur. The same greige nap under the same floor raking light now reads clean. The compression of this cut against the opening shot IS the product benefit made visual.
TALENT: Steps back from vacuum. Expression: quiet composed satisfaction — NOT exaggerated relief, NOT celebration. Slight Cupid's bow lift, zygomatic muscle engagement, orbicularis oculi pre-engagement (the eye smiles before the mouth). She looks at the clean carpet, not at camera.
DOG CALLBACK: Dog repositions — head lifts, sniffs the freshly cleaned carpet, lies back down contentedly on the clean pile. This is the emotional resolution: even the dog approves.

[PRODUCT HERO — FINAL BEAT]:
Lens: 85mm. Camera: 3/4 angle to vacuum on light grey seamless. Product lighting: anisotropic streak on aluminum, label specular, dustbin caustic glow. Shadow under product grounding it physically. Product fills 60% of frame. Logo lockup in white sans-serif, SharkNinja teal accent.

[COLOR GRADE]
Warm naturalistic grade matching SharkNinja brand palette: lifted blacks to 8 IRE (no crushed shadows — commercial grade), amber-gold midtone warmth (+150K color temperature shift), highlights rolled off to soft rolloff (not blown). Skin tones: golden warm. Carpet: warm greige with slight amber push from floor raking light. Dog fur: amber-gold elevated in hue saturation. Product housing: cooled to modern grey-teal. Grain overlay: Kodak Vision3 emulation, 12% opacity, luminance-only channel.

[NEGATIVE TECHNICAL SPECIFICATION — CRITICAL SUPPRESSORS]
ABSOLUTELY NO: plastic skin sheen, poreless AI smoothed complexion, uniform face lighting (both cheeks identical), waxy complexion, ceramic skin surface, oversimplified hair texture, helmet hair polygon structure, flat carpet without self-shadowing pile, uniform dog fur without guard/undercoat differentiation, temporal flickering or frame geometry shift, hand morphing or extra digits, object morphing between frames, text overlays except specified logo lockup, lens distortion except specified anamorphic character, artificial vignetting except gentle 8% radial rolloff, any wildlife or animals except specified golden retriever, NEVER a shark animal or fish or ocean creature — ${input.productName} is a HOME VACUUM APPLIANCE made by SharkNinja brand, NOT related to sharks in any way.`;
}

function buildBabySkincarePrompt(input: CinematicPromptInput): string {
  const dur = input.totalDurationSec;
  const hook = Math.round(dur * 0.25);
  const mid = Math.round(dur * 0.6);

  return `[PRODUCTION PACKAGE]
Camera body: Sony Venice 2, full-frame sensor, native dual ISO at 500/2500. Color science produces warm naturalistic skin tones — the Sony Venice organic matrix renders newborn and infant skin pigmentation with exceptional fidelity in the peach-pink-warm spectrum. Lenses: Zeiss Supreme Prime set — 50mm T1.5 for environmental mother-baby compositions, 85mm T1.5 for talent close-ups with characteristic micro-contrast and lens signature warmth, 100mm macro T2.8 for product application detail shots (individual droplet resolution, finger-skin contact texture at micro-scale). Frame rate: 24fps master. Insert shots (lotion application, baby expressions) at 48fps played at 24fps — 2x slow motion adds weight to gentle moments without artificially stretching time. Format: 9:16 vertical. Film grain: Fujifilm Eterna 500T emulation, extremely fine grain structure — present but never distracting. Halation on warm highlights: slight bloom at lamp practicals and window edges — filmic quality confirming organic origin.

[LIGHTING RIG — NURSERY SETUP]
This is the defining aesthetic of premium baby skincare TVC production (Mustela, Bettrkind, Tubby Todd benchmark):
KEY LIGHT: Filtered natural window light simulation. Full-length 180cm Westcott Scrim Jim with 1.5-stop diffusion. Camera-left. Color temperature: 5500K at center tapering to 5800K at sky edge. This temperature gradient — warmer at center, cooler at periphery — is the hallmark of real window light that AI typically renders as uniform. Light falls off across the changing surface in visible inverse-square gradient: bright at the near edge, falling 1.5 stops at the far edge. Penumbra edge on any vertical surface: feathered 8–10cm transition. NOT a hard edge.
FILL: Large reflector card, warm white, camera-right at 3:1 ratio under key. Adds slightly warm 4800K quality — this color differential between key and fill (5500K vs 4800K) creates the "golden hour through a north window" quality unique to this category. No fill below knee height — the floor in shadow maintains depth.
PRACTICAL LIGHTING: 1× floor lamp at background-left, 2700K warm glow bulb. Soft cone of amber light. The lamp fills 15% of the background compositionally and contributes 1/2 stop of ambient warm fill. This prevents the "void background" AI default and confirms domestic habitation. 1× small nursery nightlight at far background — tiny warm point source creates depth layer.
HAIR LIGHT ON MOTHER: Small Rosco LitePad at 170-degree offset, 3000K tungsten-warm. Creates warm rim at mother's crown without spilling onto face. Through loose-strung brunette hair: rim halo effect, transmitted amber light at temple strands. This is a significant photorealism anchor — the hair rim separates mother from the warm background and creates three-dimensionality that AI without this instruction renders as flat.
BABY SKIN LIGHT: The infant's face and body must be lit with maximum gentleness. A dedicated large 90cm silver reflector card is placed between the key light and the infant — it reflects the window key with slight diffusion. This ensures zero hard shadow on infant skin (any hard shadow on a newborn or infant reads as harsh/uncaring and kills the emotional register). The infant's skin should glow from within — subsurface scattering pinkish-amber at cheekbones, warm rose at knuckle folds, translucent cream at earlobes in backlight.

[ENVIRONMENT — NURSERY SET DESIGN]
This nursery references 2024–2026 nursery design benchmarks (Pantone Peach Fuzz 13-1023 era):
FLOOR: Natural white oak wide-plank flooring, wire-brushed texture — open grain channels running plank-direction. Grain visible under raking practical light. Micro-scratch accumulation at traffic zone — confirms lived-in authenticity. Ambient occlusion depth at board joint — shadow line between planks at 2px width visible under window light. One large woven cotton play mat in cream with a subtle sage stripe border — laid at 45 degrees to the wall, covers 60% of floor area. Mat weave structure visible: plain 1:1 over-under at approximately 8mm scale.
CHANGING SURFACE: White birch-ply changing unit. Clean matte surface. One folded GOTS-certified muslin cloth at corner — ivory with a narrow sage stripe. Fold is deliberate, corners aligned. One ceramic vase with 2× dried pampas grass stems — soft cream fronds. The ${input.productName} bottle placed at frame edge in partial view — present but not foregrounded. Never centered, never floating in isolation.
WALLS: Warm white (NCS S 0505-Y20R equivalent) — not cold bright white, not beige-yellow. This precise tone reads as clean without clinical. One low shelf at background holding 3 board books (neutral/natural cover designs, no commercial characters visible).
COLOR PALETTE: Warm white #FFFDF9 base, sage accent #B2C5AE, warm peach highlight #F5D5B8, product color (ivory lotion #F2EAD8), warm gold-white light. ALL blues desaturated — blue reads clinical and cold in this category.

[INFANT — COMPLETE SPECIFICATION]
Age: 8–12 weeks (past lanugo shedding, full milk-plump development, but before crawling mobility which requires constraint).
SKIN TEXTURE: The most important element. Translucent peach-pink dermis — not uniform, not airbrushed. Blush differential between palm surface (cooler, slightly pinker) and dorsal forearm (warmer, amber-peach). Knuckle fold joints: slightly redder — capillary density higher at flexion zones. Cheekbone and forehead: warm honey-peach with subsurface scatter pinkish luminance from key light transmission. Earlobe in backlight: semi-translucent amber-cream — confirms organic tissue quality. NO visible pores (developmentally normal for this age). Very fine vellus hair on upper forehead glowing in hair light — confirms biological authenticity. Milia possibility at nasal bridge: 2–3 tiny white micro-dots — present in approximately 40% of this age group, include to confirm authenticity.
INFANT BEHAVIOR: Lying supine on changing surface, head turned 30 degrees right (natural resting position). Arms in loose "fencer posture" — one arm extended, one flexed at elbow, reflexive. Legs in slight frog-leg flexion (normal neonatal resting position). Micro-expressions cycling naturally: lip quiver (lower lip tremor, 2Hz, 0.5-second duration), brow scrunch (procerus and corrugator engage, hold 1.5 seconds, release), open-mouth yawn sequence (mandible drops to maximum, tongue curls, eye compression, recovery over 3 seconds) — the yawn is the gold-standard authenticity and empathy trigger for all baby brand advertising. Occasional hand fan — fingers spread wide unpredictably, then curl back. Toe curl on fabric contact. These micro-behaviors are what separate authentic infant footage from any synthetic alternative.
CLOTHING: White cotton onesie with small subtle sage geometric pattern — 100% GOTS organic cotton, plain weave structure visible under macro. Soft weight, approximately 180gsm. Natural wrinkling at inner elbow and hip where fabric is gathered. Snap closure at bottom — nickel-free snap visible but not foregrounded.

[MOTHER TALENT — COMPLETE SPECIFICATION]
Age: 28–34 years old. Cast to match target demographic while conveying natural maternal ease — not performance, not anxiety.
ETHNICITY OPTIONS: South Asian (warm olive skin, dark hair, high-contrast imagery), East Asian (cool undertone skin, dark straight hair), Caucasian (fair skin, warm blonde or brunette), Black/Mixed (deep warm skin, natural textured or straightened hair). All produce excellent results with this lighting rig — the SSS response varies per skin tone but the approach is identical.
HAIR: Dark brunette or warm auburn. Worn in a deliberate imperfect low bun — some strands loose at temple and neck. Second-day texture: slight natural wave from overnight, NOT freshly blown out. Hair lip creates rim halo in hair light with warm amber transmission at temple strands. A single strand across the cheek — intentionally left, not corrected. This is a critical authenticity marker: perfect hair reads as performance, not motherhood.
SKIN: Natural dewy finish, 28–34 year old skin with honest texture. Visible under-eye area: slight blue-grey shadow (natural lymphatic transparency at orbital rim) — confirms the viewer's lived experience of an occasionally sleep-deprived but happy parent. Pore shadow at nasolabial fold in key light. Subsurface scattering pinkish-amber at zygomatic and nasal bridge. Vellus hair at jaw perimeter glowing in lateral fill. Natural sebum sheen at nose bridge — authentic oil production. Slight pigmentation variation at hairline — minor solar variation, not uniform.
MAKEUP: The "no-makeup makeup" standard critical to this category. Buildable medium coverage foundation — pore bleed-through VISIBLE at macro (test: if pores disappear, redo). Creamy undereye concealer at inner orbital — the outer orbital shows natural blue-grey tone for authenticity. Very light diffused blush from apple to temple. Clean shaped brow with micro-stroke texture. Natural mascara — lash separation only, no volume. Neutral nude satin lip. ZERO: contour, shimmer, editorial lashes, lip liner visible, anything that reads "performance."
WARDROBE: Oat-colored linen nursing top — 100% pre-washed linen, visible slub texture in weave, approximately 200gsm. Slightly relaxed fit, V-neck low enough for nursing access (category credibility). Sleeves rolled to mid-forearm — deliberate, functional. The linen drapes with natural gravity from shoulder, slight hem lift when she leans forward. Left breast pocket shows slight asymmetric weight from mobile phone — confirms real human habitation of the garment. Dark slim straight jeans or warm taupe linen jogger pants. Bare feet on the play mat — confirms domestic comfort. NAILS: clean, cut short, nude or sheer pink. This appears in EVERY hand shot and any color or length other than this breaks category authenticity immediately.
EXPRESSION ARC: She begins with soft wonder — eyes on baby with slight parted-lip stillness. Transitions to focused gentleness during application — eyes track her own hands. Ends with private satisfaction — not performed for camera, not theatrical. The micro-smile: Cupid's bow lifts 2mm, zygomatic engagement minimal, eye softening without full crow's feet engagement. This is the emotional resolution of safety established.

[LOTION APPLICATION SEQUENCE — HIGH-FIDELITY SPECIFICATION]
This is the hero shot of any baby skincare TVC. It requires complete technical precision.
STEP 1 — DISPENSE (0s–${hook}s):
Camera: 85mm, f/2.0. Hand fills right half of frame. Pump action: one full depression. Lotion bead lands on palm pad — 3ml volume, ivory-cream color (#F2EAD8), slight translucent glossy surface. The bead is NOT pure opaque white (reads cheap) and NOT colored (reads adult skincare). The specular highlight on the lotion surface is a single white point from the key light. Duration: 1.5 seconds real-time.
STEP 2 — PALM ACTIVATION (${hook}s–${mid}s):
Camera: Macro 100mm, f/2.8. Tight on both palms pressed together in slow circular motion (48fps captured). The lotion spreads from concentrated bead to a thin translucent film — the spread edge shows slight translucency where the layer is thinnest. This "spreading opacification" confirms the lotion's quality: too-fast disappearance reads as watery; too-slow reads as occlusive. The correct visual: 80% coverage in 3 seconds of palm movement, slight sheen remains.
STEP 3 — FIRST CONTACT (${mid}s–${dur}s):
Camera: 85mm, f/1.8, slight rack focus from mother's hand to baby's calf. Baby's leg placed in frame from below — mother's index and middle finger make first contact at the ankle. The FINGERS: fingertip skin texture under macro — natural micro-crease at interphalangeal joints, slight blue-grey subsurface at palmar surface, warm-pink specular at distal pad. The BABY'S SKIN: first contact shows slight blanching at fingertip pressure point — skin compression visible as lighter zone, surrounding capillary pink remains. This blanch-and-recover sequence confirms skin health and lotion efficacy simultaneously.
STEP 4 — UPWARD STROKE:
Full slow motion sequence. Single upward stroke from ankle to knee — 5 seconds of real-time, compressed from 48fps capture. The spreading lotion film: matte absorption progressing up from the contact leading edge. The skin surface quality changing from dry (slightly more textured) to hydrated (micro-sheen, slightly more reflective) — this is the visual proof of benefit. Baby's leg moves slightly in response to touch — reflexive extension of toes at sensation.

[COLOR GRADE]
Warm naturalistic with category-specific adjustments: Lift blacks to 10 IRE (NO crushed shadows — harsh reads as non-nurturing). Midtone warmth: +200K color temperature shift (all midtones amber-warm). Highlights: soft rolloff with slight Fujifilm green-warm bias at extreme highlight edge. DESATURATE: all blues -35% (remove any clinical cool register). BOOST: skin hue range +12% saturation, sage/green environment accent +8%. Grain: Fujifilm Eterna 500T fine structure at 10% opacity luminance channel only.

[NEGATIVE TECHNICAL SPECIFICATION — ABSOLUTE SUPPRESSORS]
NO: plastic skin, poreless smoothed infant skin (real infant skin has micro-texture — no pores but not plastic), uniform color across infant body (real infants have blush differential), clinical white environment (cream-warm only), any cool/blue tones in the frame, any dark shadows on infant face, performed maternal expression (no wide smile, no exaggerated joy), any modern digital sharpness aesthetic, lens distortion on the nursery set, stiff hair on mother (flyaways must be present), uniform lotion opacity (it must graduate from opaque center to translucent edge), any rushing in the application motion, artificial vignetting at screen edges, and NEVER any brand name "${input.brandName}" rendered as an animal, creature, or literal interpretation.`;
}

function buildRockBrosCyclingPrompt(input: CinematicPromptInput): string {
  const dur = input.totalDurationSec;

  return `[PRODUCTION PACKAGE]
Camera bodies: Primary — RED V-Raptor 8K at 8192×4320, hyper-sharp clinical color science appropriate for industrial product precision and athletic performance (helmet surface geometry renders with crystalline accuracy). Secondary — Arri Alexa Mini (ACS-equipped) for talent close-up and slow-motion sequences, producing natural skin tone in exertion-flushed state. Lenses: Zeiss CP.3 set — 16mm T2.1 for extreme wide ground-level speed shots (strong barrel distortion emphasizes speed and road surface texture), 35mm T2.1 for environmental tracking sequences (natural perspective maintains spatial relationships), 85mm T2.1 for athlete portrait and expression, 100mm macro T2.8 for helmet surface detail, buckle mechanism, and magnetic lens system close-up. Frame rate: 24fps master timeline. CRITICAL INSERTS at 120fps: buckle engagement, magnetic lens click, wheel spoke revolution, chain ring rotation, sweat bead formation — these all require 5× slow motion to register the mechanical and physical precision that confirms product quality. 9:16 vertical format. Color science: RED IPP2 with wide gamut capture, graded in DaVinci Resolve ACES pipeline to teal-orange complementary grade (this is the genre-defining grade for action sports — Red Bull, GoPro, cycling category benchmark). Grain: 35mm Kodak Vision3 200T pushed +1, yielding fine structure with slight shadow lift — athletic documentary authenticity.

[LIGHTING — GOLDEN HOUR EXTERIOR (PRIMARY)]
Location: Urban cycle path, 6:30am golden hour in early summer. Sun elevation: 8–12 degrees above eastern horizon. This precise elevation produces the defining lighting quality for cycling advertising:
QUALITY: Hard source at extreme oblique angle — long horizontal shadows from athlete and bicycle extending 4–6 body-lengths to the west. Sun disc size relative to subject is small enough to produce hard shadows but atmospheric scattering softens extreme contrast to 4:1 ratio (from potential 8:1 at noon). Color temperature: 2800–3200K at golden hour — dramatically warm orange-amber quality. This is the exact opposite of the baby category (5500K cool-neutral) — athletic TVC always runs warm toward orange.
HELMET SURFACE IN THIS LIGHT: The polycarbonate shell of the RockBros helmet responds to golden hour at 8–12 degree sun elevation as follows: ventilation slots cast deep striped shadows across the wearer's face and upper forehead — each slot producing a defined shadow bar approximately 12–15mm wide. The leading edge of each bar is a hard line (small source), feathering at the distal edge. This shadow pattern is a visual signature of cycling helmets under low-angle light and MUST be present in the hero close-up. The shell surface itself: semi-gloss polycarbonate at this angle shows a single large specular highlight at the crown — warm white with slight amber from atmospheric color temperature. If the helmet has a matte finish variant, substitute the specular for a broad soft diffuse catch.
ATHLETE SKIN IN EXERTION STATE: After 20–30 minutes of cycling, the athlete's skin transitions to exertion-flushed state. This is a critical authenticity marker — any athlete shot in product advertising who does NOT show appropriate exertion reads as staged (which is fine for posed product shots but wrong for performance-proof contexts). Exertion skin: concentrated gloss at forehead center (3cm zone), temple (each side), nasal bridge (dorsal to tip). Cheekbones: warm flushed pink-red from increased capillary perfusion — this is NOT makeup blush, it's the red-zone warmth of vasodilation. The forehead sweat is in micro-bead formation stage, not streaming — 0.3–0.8mm diameter spheres sitting on the skin surface, each acting as a convex micro-lens reflecting the environment in miniature. Under golden hour backlight: each sweat bead catches the sun as a warm white specular point — the forehead reads as "sparkling" when there are 40–60 beads present. This is a high-engagement visual in social media contexts.

[ENVIRONMENT — URBAN COMMUTER PATH]
Pre-dawn to golden-hour urban cycle path in a mixed-use city district:
ASPHALT SURFACE: Smooth urban asphalt, grey-black #1A1A1A base with aggregate inclusion visible at macro (stone chips approximately 8–12mm diameter, various grey tones). Micro-scratch accumulation from wheel traffic over time. Line marking: bright white painted cycle lane boundary lines (2-coat enamel, slight texture relief from surface) acting as compositional leading lines. At golden hour, asphalt shows micro-reflections from overnight moisture evaporation — slight sheen in the fresh-dried zone behind the rider, confirming morning temporal placement.
URBAN ARCHITECTURE: Glass office building facades in soft background focus — reflecting the golden horizon as warm amber rectangles, creating a warm-tone bokeh environment behind the rider. Metal street lamp poles: vertical compositional elements that the rider passes between, creating rhythmic frame cuts as they enter and leave foreground. Bridge railing visible in one transition shot — steel tubular, micro-rust patina, warm highlight from low sun.
TREE CANOPY SECTION: A 15-second sub-section of the path under mature London plane trees (appropriate for urban cycling context). Dappled light penetrating the canopy at golden hour: moving highlight patterns on the path surface, on the helmet shell, on the athlete's jersey and arms. These moving light patches create inherent motion even in slightly slower-paced shots — a key technique for maintaining energy without requiring constant editing cuts.

[ATHLETE — COMPLETE SPECIFICATION]
Demographics: Male, 26–32 years old, lean athletic cycling build (cyclist physique — not swimmer bulk, not bodybuilder mass). Weight approximately 68–74kg. Height 178–184cm. Visible shoulder and trapezius definition under cycling jersey tension. Forearm vascularity: at exertion state, median cubital vein and cephalic vein visible as slight surface elevation under the forearm skin — these confirm genuine physical effort. Skin tone: warm Fitzpatrick scale III–IV — golden-tan base elevated by exertion flush.
JERSEY DETAILS: Fitted short-sleeve cycling jersey, RockBros brand or compatible cycling aesthetic. 4-way stretch polyester-lycra blend (210gsm), semi-matte surface with micro-mesh texture visible under macro. Sweat darkening pattern progression: collar and back-of-neck darken first (darker charcoal-grey zone in neck area against the lighter dry jersey body — this confirms motion and effort). Under-arm zones secondary darkening. The tension of aerodynamic fit creates slight wrinkle lines at shoulder blade area during forward-lean riding position — these wrinkles are physics-accurate and confirm the jersey is under realistic load.
CYCLING KIT: Black bib shorts (high-denier lycra, semi-gloss surface), cycling gloves (half-finger, touchscreen-compatible palm, RockBros brand visible at wrist cuff), cycling shoes clipped into Shimano SPD pedals (the mechanical click of unclip/clip action is a signature sound).
HELMET — ROCKBROS SPECIFIC VISUAL:
The RockBros helmet (reference models: ZK-013 PRO, LK-1 aero) in matte black or charcoal colorway:
Shell: In-mold polycarbonate over EPS inner liner. Matte finish on exterior — absorptive surface with near-zero specular except at very oblique angles. Under golden hour light at 8-degree elevation: a single broad soft catch at the crown (the atmosphere-scattered light component, not the direct sun). VENTILATION SLOTS: Deep-cast shadow bars in direct low-angle sun — 5–7 slots visible, each casting its individual shadow bar on the forehead skin below the helmet front edge. This slot-shadow pattern on skin IS the hero image of this helmet.
MAGNETIC LENS SYSTEM: The key product feature close-up. The lens-to-frame interface shows: two chrome magnet studs at the frame corner (4mm diameter, polished chrome surface showing a minute convex reflection of the environment). When the lens engages, a short motion-blur whisp as the magnetic attraction pulls the lens the final 3mm, followed by a tactile-auditory "click" that registers both visually (slight subject micro-motion) and aurally (high-frequency mechanical impact sound). This 0.8-second sequence at 120fps slow motion is the SIGNATURE PRODUCT MOMENT. It communicates: engineered precision, secure fit, one-handed operation. It must appear in every RockBros helmet commercial.
BUCKLE STRAP: At throat, the micro-dial or D-ring closure under-chin at two-finger gap — safety credibility signal. Hand enters frame (off-helmet side), engages the buckle mechanism: the three-beat sequence of grip → engage → nod of confirmation. The strap at proper tension shows slight skin compression on both sides of chin (0.5mm depression visible) — confirms proper fit, confirms the product works.
LED REAR LIGHT (ZK-013): Only present in dusk or dawn content (lighting condition confirms relevance). Red LED in triple-flash mode, 100 lumen output. When the rider recedes from camera, the LED pulse creates a visible light trail in post. Color: 630nm peak red — deep saturated red (#E00000). Pulse rhythm: 1Hz flash with 20% duty cycle. This is a safety metaphor that every cyclist parent understands: "be seen, be safe."

[SHOT CHOREOGRAPHY — ${dur}-SECOND TIKTOK STRUCTURE]
For ${dur}s, this is a single crystallized moment:

0s–${Math.round(dur * 0.35)}s [COLD OPEN — PRODUCT CONTACT MOMENT]:
Complete BLACK. No fade, no ambient. 0.5 seconds of pure black silence broken only by: the sound of tire on dry asphalt (high-frequency rolling surface contact), the chain ring meshing with cassette (metallic rhythmic click at approximately 80 RPM cadence). Then: single hand enters frame, grips RockBros helmet from below. The GRIP: thumb at chin bar interior, four fingers over the crown ventilation slots. Camera: 100mm macro, extreme close-up, f/2.8, golden hour low-angle backlight. The polycarbonate shell surface fills 70% of frame — matte texture, ventilation slot depth, brand emboss catching rim light as a hot white line. The hand: warm skin, slight sweat sheen at fingertip pads, clean short nails (this is a sports-capable male hand — not manicured, not damaged). This shot communicates the physical reality of the product before any context is established.

${Math.round(dur * 0.35)}s–${Math.round(dur * 0.75)}s [HELMET ON — SPEED SEQUENCE]:
Camera: Tracking shot, camera car at 4m behind rider. 35mm T2.1 at f/4.0 (more in-focus background to show speed environment). Rider in frame: helmet occupying upper 30% of frame, jersey and bike occupying lower 70%. Rider in forward-aero position. Asphalt surface showing motion blur at bottom of frame. Urban tree canopy creating dappled golden-amber light on helmet and jersey surface — moving highlight patches at 60Hz visual frequency. The wheel spokes: at 25km/h, blur into radial silver-cream lines, the tire contact patch on asphalt visible as a dark-to-light transition zone. Rider does NOT look at camera. Rider is in the race zone — focused forward, chin slightly lowered inside helmet, cheekbones catching golden light from rider's left as sun rises.
HELMET IN MOTION: Under cycling conditions, the ventilation slots channel air — slight visible air-density shimmer through the deepest slots at the right angle (similar to heat shimmer above a road surface but cooler and faster). The chin strap two-finger gap visible under chin.

${Math.round(dur * 0.75)}s–${dur}s [PRODUCT HERO — ENGINEERING MOMENT]:
Rider stops. Medium shot, 85mm T1.4, f/1.8. Rider facing 3/4 angle to camera, NOT full-face-on. Reaches up with one hand — deliberately, not dramatically — touches the helmet crown. The touch: fingertips resting on polycarbonate shell. Product fills frame left, rider fills frame right. The helmet in this light: ventilation slot shadows bar across the left side of the rider's face from the low-angle golden sun. Product logo visible — not foregrounded, not centered, confirmed present.

[COLOR GRADE]
Teal-orange complementary grade (genre standard for action sports category — Red Bull, GoPro, RockBros category benchmark): Shadows: pull toward teal (#1A3A3A direction). Midtones: push toward warm amber (#C8640A direction). Highlights: retain warm gold-white from golden hour capture, +0.5 stop lift. Asphalt: teal-grey. Skin: warm orange-gold. Jersey: retain brand colors at +20% saturation. Helmet: product color at +20% saturation, shadow zone teal. Contrast elevated: blacks at 5 IRE (lower than baby/skincare category — athletic requires more punch). Film grain: 35mm Vision3 200T pushed +1, medium structure at 15% opacity luminance channel.

[SOUND DESIGN — ESSENTIAL AUTHENTICITY LAYER]
Without these specific sounds layered in post, the video reads as AI-generated regardless of visual quality:
- Pre-dawn ambient: faint distant traffic at -50dB, single bird at -40dB, cooling infrastructure hum at -55dB
- Tire on asphalt: high-frequency rolling surface contact, approximately 1.2kHz peak, amplitude modulating with speed (faster rotation = higher frequency, slightly higher amplitude)
- Chain and drivetrain: rhythmic metallic click at cadence rhythm, approximately 80–90 RPM, 0.2-second period. The chain links engaging the cassette cog teeth: a micro-ping at each tooth engagement.
- Magnetic lens click: 0.8-second event. Build phase: slight whoosh (magnetic attraction at 3mm closure distance), impact: sharp metallic click at 4kHz peak with 0.05-second decay. Confirm: at 120fps slow motion, this sound event stretched to 4 seconds — create the stretched version for the slow-motion insert.
- Buckle engage: similar character to lens click — metallic impact, 3.5kHz, confirming mechanical precision
- Rider breath: at exertion state, regular respiratory rhythm 20 breaths per minute. Inhalation audible at -35dB. Used to confirm human presence in cutaways.
- Background music: Electronic cinematic hybrid. 120 BPM for intro, accelerating to 140 BPM at product detail sequence. Sub-bass presence (confirmed on mobile speaker). A single percussive "hit" (kick drum + metallic snare transient) synchronized to the magnetic lens click moment — this sync is the editorial crescendo.

[NEGATIVE TECHNICAL SPECIFICATION — CRITICAL SUPPRESSORS]
NO: dry skin (exertion sheen MUST be present at forehead and temple), clean unnaturally pressed jersey (sweat darkening at collar must appear), helmet without ventilation slot shadow bars on skin (this is the helmet's primary visual feature), straight-line path only (compositional interest requires slight curve or bend in the route), static camera on any shot over 2 seconds (minimum: 0.5px camera drift or atmospheric shimmer), any actor looking directly at camera except in confirmed hero product beat, artificial vignetting except standard 8% radial rolloff, over-saturated colors at the expense of skin tone rendering (teal-orange is a grade direction, NOT a filter that destroys skin), any suggestion of danger or unsafe cycling behavior, product logo distortion or text warping between frames, and NEVER the name "RockBros" rendered as a geological feature, a wrestling move, or any literal interpretation unrelated to the cycling accessories brand.`;
}

// ─── Main builder function ─────────────────────────────────────────────────

/**
 * @deprecated Superseded by `compileForModel` in
 * `src/services/video-gen/prompt-compiler.ts`, which routes category style
 * presets via the explicit `resolveCategoryTemplate` enum instead of
 * brandLower/productLower `.includes()` guessing, and emits one payload per
 * shot instead of an inline multi-shot timeline. Kept for any legacy callers;
 * do not add new call sites.
 */
export function buildCinematicVideoPrompt(input: CinematicPromptInput): string {
  const productLower = (input.productName + " " + (input.productDescription || "")).toLowerCase();
  const categoryLower = (input.category || "").toLowerCase();
  const brandLower = input.brandName.toLowerCase();

  // Route to brand-specific template
  if (brandLower.includes("shark") || brandLower.includes("ninja") ||
      productLower.includes("vacuum") || productLower.includes("cleaner") ||
      categoryLower.includes("home") || categoryLower.includes("appliance")) {
    return buildSharkNinjaVacuumPrompt(input);
  }

  if (brandLower.includes("baby") || brandLower.includes("smell") ||
      productLower.includes("baby") || productLower.includes("infant") ||
      productLower.includes("lotion") || productLower.includes("skincare") ||
      categoryLower.includes("baby") || categoryLower.includes("kids")) {
    return buildBabySkincarePrompt(input);
  }

  if (brandLower.includes("rock") || brandLower.includes("bros") ||
      productLower.includes("cycling") || productLower.includes("helmet") ||
      productLower.includes("bike") || categoryLower.includes("fitness") ||
      categoryLower.includes("sports") || categoryLower.includes("cycling")) {
    return buildRockBrosCyclingPrompt(input);
  }

  // Generic high-quality fallback
  return buildGenericCommercialPrompt(input);
}

function buildGenericCommercialPrompt(input: CinematicPromptInput): string {
  const dur = input.totalDurationSec;
  const productRef = input.productName;
  const antiConfusion = `BRAND IDENTITY: "${productRef}" is a consumer product brand. NOT an animal, NOT a creature, NOT a literal interpretation of the brand name. Generate footage showing the actual consumer product only.`;

  return `[PRODUCTION PACKAGE]
Camera: Arri Alexa Mini LF, Cooke S7/i 85mm T1.4 primary lens, 100mm macro T2.8 for product inserts. 24fps master, 120fps for product detail inserts played at 24fps (5× slow motion). 9:16 vertical. Kodak Vision3 500T grain emulation.

[LIGHTING]
Three-point commercial studio setup: Key — 150cm Chimera octabox at 45°/45°, 5600K, 3:1 lighting ratio. Fill — 90cm softbox camera-right at 4800K warm fill (color differential creates depth). Rim — Hard Fresnel at 170° offset, 3200K tungsten, anisotropic hair halo. Product dedicated strip LED: anisotropic specular streak on product surface aligned to material finish direction.

[SUBJECT — ${input.selectedActorDesc || "Talent as appropriate to brand"}]
${input.selectedActorRole ? `Role: ${input.selectedActorRole}. ` : ""}Natural skin texture — visible pores at T-zone, subsurface scattering pinkish-amber luminance at nasal bridge and cheekbone, vellus hair catching lateral fill at jaw perimeter, fine sebum sheen at nose bridge. Hair: anisotropic specular streak from hair light, dual-lobe highlight. Expression arc: problem awareness → product engagement → quiet satisfaction. NOT looking at camera during primary action.

[ENVIRONMENT — ${input.selectedEnvironment || "Appropriate domestic setting"}]
${input.environmentNotes || "Modern clean interior, warm 2700K practicals, natural window light from camera-left."} Carpet/floor texture with proper self-shadowing under raking light. Ambient occlusion at all surface junctions.

[${dur}-SECOND TIKTOK STRUCTURE]
0–${Math.round(dur * 0.3)}s: Hook — problem reveal or product approach shot. Camera locked or slow tracking.
${Math.round(dur * 0.3)}–${Math.round(dur * 0.75)}s: Product demonstration. 120fps insert for key product action. Clear visual proof of benefit.
${Math.round(dur * 0.75)}–${dur}s: Resolution. Product hero. Satisfaction moment.

${antiConfusion}

KEY SELLING POINTS:
${(input.sellingPoints || []).slice(0, 3).map((sp, i) => `${i + 1}. ${sp} — show visually with specific shot`).join("\n")}

[NEGATIVE SPECIFICATION]
No plastic skin, no AI smoothed complexion, no uniform carpet without pile self-shadowing, no helmet hair polygon structure, no dog fur without guard/undercoat differentiation, no temporal flickering, no hand morphing, no text overlays except brand lockup, no watermarks, no animals or wildlife except as specified.`;
}

// ─── Dense 3800-char optimized prompts for fal.ai 4096 char limit ────────────

/**
 * @deprecated Superseded by `compileForModel` in
 * `src/services/video-gen/prompt-compiler.ts`. This function bakes an inline
 * multi-beat timeline (e.g. "[0-3s]...[3-6s]...") into a single prompt string,
 * which the compiler intentionally avoids ("multi-shot honesty" — one payload
 * per shot). Kept for any legacy callers; do not add new call sites.
 */
export function buildDenseCinematicPrompt(input: CinematicPromptInput): string {
  const dur = input.totalDurationSec;
  const productRef = input.productName;
  const brandLower = input.brandName.toLowerCase();
  const productLower = (productRef + " " + (input.productDescription || "")).toLowerCase();
  const catLower = (input.category || "").toLowerCase();

  const isVacuum = brandLower.includes("shark") || brandLower.includes("ninja") ||
    productLower.includes("vacuum") || catLower.includes("home") || catLower.includes("appliance");
  const isBaby = brandLower.includes("baby") || productLower.includes("baby") ||
    productLower.includes("lotion") || catLower.includes("baby") || catLower.includes("kids");
  const isCycling = brandLower.includes("rock") || brandLower.includes("bros") ||
    productLower.includes("helmet") || productLower.includes("cycling") || catLower.includes("sports");

  const hook = Math.round(dur * 0.3);
  const demo = Math.round(dur * 0.75);

  if (isVacuum) {
    // Kling 3.0 shot-architecture format: 5-question structure outperforms prose
    return `CAMERA: Floor-level slow tracking shot, 85mm, f/1.8, 24fps, 9:16 vertical. Camera begins 3cm above carpet surface shooting along pile at 15-degree elevation angle. Slow Steadicam dolly tracks alongside the vacuum from frame-left to frame-right over ${dur} seconds. Final second: wide pull-back reveals full living room.

SUBJECT: ${productRef} — a cordless upright vacuum cleaner with transparent dustbin and spinning brushroll. Consumer home appliance by SharkNinja brand — NOT a shark animal, NOT any creature. Also: adult female (32-36, brunette hair, cream merino knit top, dark jeans) operating the vacuum from behind. Golden retriever dog lying on carpet in mid-ground soft focus, chest breathing visible. Woman does NOT look at camera — focused downward on the vacuuming task. Expression: composed competence, not distress.

ENVIRONMENT: Suburban living room, warm and lived-in. Wall-to-wall Saxony cut-pile carpet, 10mm pile height, warm greige — individual pile fibers visible, directional nap catching side-light differently from opposing direction. Linen sofa warm grey with one cream throw blanket at corner. Floor lamp in background at 2700K warm glow. Morning light from window camera-left.

LIGHTING: Six-source commercial setup: (1) Key — large diffused 5600K from camera-left, feathered shadow edge. (2) Fill — 4800K warm from camera-right, 3:1 ratio. (3) Rim — 3200K tungsten above-behind talent, anisotropic streak through brunette hair. (4) CRITICAL — Floor raking LED at carpet level, 3200K warm at 45 degrees to carpet surface, illuminates each shed golden retriever fur strand as an individual amber filament, creates micro-shadows in carpet pile valleys. (5) Product strip LED on vacuum chassis, anisotropic streak on brushed aluminum. (6) Practical floor lamp 2700K ambient.

TEXTURE: Golden retriever fur on carpet — individual 40-70mm amber-gold strands interlocked with carpet pile fiber, each strand catching floor raking light as a translucent golden filament. Before vacuum: fur covers carpet, amber highlights. After vacuum wake: clean carpet, pile springs back. Brushroll window close-up insert: fur strands liberated from carpet in progressive sequence — anti-hair-wrap demonstration. Skin: warm dewy texture, natural pore visibility, subsurface warmth at cheekbone. No plastic sheen.

COLOR: Warm naturalistic grade. Blacks 8 IRE. Amber-gold midtones. Fur color elevated. Product housing grey-teal cool contrast. Kodak Vision3 grain 12% luminance.

NEGATIVE: flat overhead lighting, uniform carpet without individual fiber shadows, CGI dog fur matted uniform texture, plastic glossy skin, temporal flickering, shark animal or fish or ocean, animated style, cartoonish look, any wild animal other than domestic golden retriever.`;
  }

  if (isBaby) {
    // IMPORTANT: No clinical anatomy terms — content policy safe language only.
    // Describe commercially: product bottle, nursery setting, gentle touch, warm light.
    return `Sony Venice 2, Zeiss Supreme Prime 85mm T1.5, 24fps, 9:16 vertical, Fujifilm Eterna 500T grain. ${dur}s TikTok Prime Day commercial for ${productRef} — an organic lotion and gentle cleanser brand for young children. Safe, warm, nurturing product ad. NOT clinical. NOT medical.

LIGHTING: Large diffused soft light camera-left at 5500K — mimics beautiful window light on a bright morning. Gentle warm fill from right at 4800K. Both sources produce zero harsh shadows — only soft, feathered, beautiful natural light. A warm 2700K floor lamp in background adds depth. Small warm practicals complete the scene. The overall quality: like sunrise through a linen curtain over a sleeping child's room. Exceptionally gentle, exceptionally warm.

NURSERY ROOM: White oak wood floor, wire-brushed natural grain texture with soft sheen. One large cream woven cotton rug with a sage stripe border. A simple white wooden changing dresser, a folded pale ivory cloth at the corner, a ceramic vase holding dried pampas grass. The ${productRef} glass bottle is placed at the edge of frame — visible but not centered. Walls are warm cream-white. Color palette is sage green, oat, soft peach, warm ivory — the colors of a safe, gentle home. Every element reads: organic, natural, calm.

YOUNG CHILD: A small child with soft round cheeks, warm peach complexion, lying relaxed on the rug in comfortable loose cotton clothing. Peaceful, content expression. Tiny hands open and closed. Feet tucked up in natural resting position. Eyes open — bright and calm, gazing softly upward. The child is peaceful, happy, at ease. Warm golden light touches the round cheek. Every visual communicates: safe, cherished, cared-for.

ADULT CAREGIVER (woman, late 20s to early 30s): Wearing a loose oat linen top, hair loosely gathered, natural warm complexion, no heavy makeup — the look of a person at home, comfortable, present. She is NOT performing. She is genuinely focused on caring. Her expression is tender and absorbed — the private look of a parent doing something they love. She does NOT look at the camera.

APPLICATION SEQUENCE — ${dur}s: 0-${hook}s: A gentle hand dispenses a small amount of the ivory-cream lotion onto a palm — slow, deliberate. The lotion is soft and smooth. Warm light catches a soft sheen on the product. ${hook}s-${demo}s: Both palms warm the lotion together in a slow gentle motion. Then: fingertips make contact with the child's leg — soft, careful, loving. A slow gentle upward stroke, applying the lotion. The child responds with contentment — tiny toe curl, peaceful face. ${demo}s-${dur}s: The caregiver pauses, glances at the child's peaceful face — a private moment of quiet satisfaction. The product bottle sits nearby on the warm wood surface. Everything is calm, warm, beautiful.

COLOR GRADE: Warm, lifted, bright. Blacks at 10 IRE — no shadows feel harsh. Midtones +200K warm amber. Highlights roll off softly — no clipping. Blue channel desaturated throughout. The entire frame feels like a warm summer morning. Fujifilm Eterna grain at 10% adds a gentle organic quality.

STYLE REFERENCES: Mustela commercial tenderness. Johnson's "gentle as a mother's touch" visual register. The visual language of trust, safety, and love.

NO: harsh shadows on the child, any clinical or cold light quality, any blue or cool tones, rushed movements, theatrical expressions, any element that reads commercial rather than genuinely intimate, text overlays, brand name as creature or literal object.`;
  }

  if (isCycling) {
    return `RED V-Raptor 8K primary, Arri Alexa Mini for athlete skin, Zeiss CP.3 16mm T2.1 (ground speed), 85mm T2.1 (portrait), 100mm macro T2.8 (product detail), 24fps master, 120fps inserts for buckle/lens/spokes, 9:16 vertical. ${dur}s TikTok Prime Day ad for ${productRef} — cycling accessories brand, NOT a geological feature, NOT a wrestling move.

LIGHTING — GOLDEN HOUR EXTERIOR: Sun at 8-12° elevation. Color temperature 2800-3200K warm amber-orange. Long horizontal shadows from athlete 4-6 body-lengths west. HELMET SURFACE: ventilation slot shadow bars on forehead skin — each slot casts defined 12-15mm shadow bar on forehead below rim, hard leading edge feathering at distal. Single crown specular at 3200K warm white. ATHLETE SKIN AT EXERTION: micro-bead sweat formation 0.3-0.8mm diameter at forehead center, temple, nasal bridge — each bead as convex micro-lens catching golden backlight as warm white specular point. Forehead reads sparkling with 40-60 sweat beads. Cheekbone capillary flush pink-red from vasodilation. Forearm cephalic vein slight surface elevation confirming genuine effort.

ENVIRONMENT: Urban cycle path pre-dawn/golden-hour. Smooth asphalt #1A1A1A with aggregate inclusion visible, micro-reflections from overnight dew. White cycle lane markings as compositional leading lines. Glass office building bokeh background showing warm amber golden hour rectangles. Tree canopy section: dappled golden-amber light patches moving on helmet and jersey at 60Hz visual frequency.

ATHLETE: Male 26-32, lean cycling build 68-74kg. Fitted short-sleeve cycling jersey polyester-lycra semi-matte, sweat darkening at collar/neck confirming motion. Bib shorts black high-denier lycra. Cycling gloves. Helmet: RockBros matte polycarbonate, deep ventilation slots casting striped shadow bars across forehead in low sun, semi-matte absorptive surface, magnetic lens system with chrome studs visible.

SHOT STRUCTURE — ${dur}s: 0s-${Math.round(dur*0.35)}s: COLD OPEN black silence 0.5s — tire-on-asphalt sound, chain-ring click. Hand enters frame grips helmet 100mm macro — polycarbonate texture, ventilation slot depth, brand emboss in rim light. ${Math.round(dur*0.35)}s-${Math.round(dur*0.75)}s: Tracking shot 35mm, camera car 4m behind rider, helmet upper 30% frame. Asphalt motion blur bottom frame. Dappled canopy light on helmet surface. Wheel spokes blur to radial silver lines. Rider NOT looking at camera — aero forward lean. ${Math.round(dur*0.75)}s-${dur}s: 120fps MAGNETIC LENS CLICK — chrome studs at 0.5mm gap, slight blur as magnetic attraction pulls lens final 3mm, sharp metallic click impact. OR buckle engagement: three-beat grip→engage→nod at 120fps. Product hero 85mm, ventilation slot shadows bar across face.

COLOR: Teal-orange complementary grade. Shadows →teal #1A3A3A. Midtones →amber #C8640A. High contrast, blacks at 5 IRE. Product color +20% saturation. 35mm Vision3 200T pushed +1 grain 15% luminance.

NO: dry unwet skin at athletic context, static camera on any shot over 2s, actor looking at camera except specified product beat, over-saturated grade destroying skin tones, helmet without slot shadow bars, any soft or gentle aesthetic (this is performance sport), brand name as literal "rock" or geological feature.`;
  }

  // Generic
  return `Arri Alexa Mini LF, 85mm T1.4, 24fps, 9:16 vertical, ${dur}s TikTok ad. PRODUCT: ${productRef} — consumer product by ${input.brandName}, NOT an animal, NOT a creature, NOT a literal brand name interpretation. Lighting: 200cm octabox key 5600K 3:1, warm 4800K fill, 3200K rim, product dedicated strip LED. Skin: subsurface scattering pinkish-amber luminance at nasal bridge, pore shadow at T-zone, vellus hair at jaw in lateral fill, natural sebum sheen. Environment: ${input.selectedEnvironment || "modern domestic interior"}, carpet/floor with pile self-shadowing. Shot: 0-${hook}s hook/problem, ${hook}s-${demo}s product demonstration at 120fps insert, ${demo}s-${dur}s resolution. Actor NOT looking at camera. NO: plastic skin, AI smoothed complexion, temporal flickering, hand morphing, text overlays, watermarks, wildlife.`;
}

// ─── Wan 2.6 optimized prompt (requires global style + shot separation) ────────
// Research: Wan 2.6 processes global directives + shot execution in two layers.
// Mixing camera mechanics with emotional direction causes "average" output.
// Format: [GLOBAL STYLE LINE] \n [SHOT EXECUTION BLOCK]

/**
 * @deprecated Superseded by `compileForModel(shots, brand, "wan-2.6")` in
 * `src/services/video-gen/prompt-compiler.ts`, which applies wan-2.6's
 * maxPromptChars via `fitPromptForModel` and emits one payload per shot
 * instead of inline "[0-Ns]" timeline brackets. Kept for any legacy callers;
 * do not add new call sites.
 */
export function buildWan26Prompt(input: CinematicPromptInput): string {
  const dur = input.totalDurationSec;
  const productRef = input.productName;
  const brandLower = input.brandName.toLowerCase();
  const productLower = (productRef + " " + (input.productDescription || "")).toLowerCase();
  const catLower = (input.category || "").toLowerCase();

  const isVacuum = brandLower.includes("shark") || brandLower.includes("ninja") ||
    productLower.includes("vacuum") || catLower.includes("home") || catLower.includes("appliance");
  const isBaby = brandLower.includes("baby") || productLower.includes("baby") ||
    productLower.includes("lotion") || catLower.includes("baby") || catLower.includes("kids");
  const isCycling = brandLower.includes("rock") || brandLower.includes("bros") ||
    productLower.includes("helmet") || productLower.includes("cycling") || catLower.includes("sports");

  if (isVacuum) {
    // Wan 2.6: max 800 chars. Global style line + timed [shot] brackets.
    return `Photorealistic commercial, warm domestic interior, SharkNinja vacuum cleaner home appliance (NOT a shark animal), golden retriever dog on greige carpet, 9:16 vertical, ${dur}s, Kodak Vision3 warmth.
[0-${Math.round(dur*0.35)}s] Floor-level camera 3cm above carpet, slow track left. Individual golden retriever fur strands on carpet catching warm 3200K side-raking light as amber filaments. Highly detailed carpet pile texture, individual fiber self-shadows. Fur clumps at sofa perimeter, soft dog breathing in background.
[${Math.round(dur*0.35)}s-${Math.round(dur*0.8)}s] Steadicam tracks vacuum across carpet. Clean carpet wake visible behind vacuum head. Brushroll macro: physically accurate fur liberation from pile. Transparent dustbin filling. Woman operating vacuum, brunette hair, cream knit top, NOT looking at camera.
[${Math.round(dur*0.8)}s-${dur}s] Wide satisfied reveal. Clean carpet. Woman's quiet nod of competence. Warm 2700K ambient.
negative: flat overhead light, uniform carpet, CGI fur, shark animal, fish, ocean, animated style, temporal flicker`;
  }

  if (isBaby) {
    return `Soft warm commercial, organic baby skincare, nursery interior, gentle morning window light, nurturing register, 9:16 vertical, ${dur}s, Fujifilm Eterna warmth.
[0-${Math.round(dur*0.4)}s] Close-up: ${productRef} glass lotion bottle on white oak surface, woven cotton mat. Highly detailed glass surface texture, caustic refraction at bottle base. 5500K window key from left, 4800K warm fill right.
[${Math.round(dur*0.4)}s-${Math.round(dur*0.8)}s] Woman's hands: oat linen sleeve, clean nails. Pump dispenses ivory cream bead onto palm. Palms together slow circular motion — lotion spreads from opaque to translucent film edge. Slub linen weave texture visible.
[${Math.round(dur*0.8)}s-${dur}s] Nursery soft focus background: sage walls, rattan basket, warm 2700K practical lamp. Private tender expression. No performance.
negative: harsh shadows, clinical white, rushed motion, theatrical expressions, cool blue tones, brand name as creature`;
  }

  if (isCycling) {
    return `Cinematic action sports commercial, ${productRef} cycling brand, urban golden hour, teal-orange grade, 9:16 vertical, ${dur}s.
[0-${Math.round(dur*0.4)}s] Ground-level camera. Cyclist at 35km/h. Wheel spokes blur to radial lines. Helmet ventilation slots cast defined shadow bars on forehead skin under 2800K golden hour sun. Jersey polyester-lycra texture under aerodynamic tension. Sweat bead formation at forehead.
[${Math.round(dur*0.4)}s-${Math.round(dur*0.8)}s] 100mm macro: helmet buckle magnetic engagement. Chrome studs at 0.5mm gap. Satisfying click. Three-beat grip-engage-nod sequence.
[${Math.round(dur*0.8)}s-${dur}s] Wide tracking shot. Urban path, white line markings, glass building bokeh background amber rectangles.
negative: dry skin, static camera, actor looking at camera, brand name as rock or geological feature, CGI look`;
  }

  // Generic Wan 2.6 format
  return `Cinematic lifestyle commercial, ${productRef} consumer product by ${input.brandName} brand (NOT an animal, NOT a creature), ${dur}s TikTok 9:16 vertical format.
[product hero shot: ${productRef} on clean surface; professional product photography lighting; warm key 5600K from camera-left; specular highlight reveals product material quality]
[talent interaction with product: adult actor NOT looking at camera; absorbed in natural use context; warm domestic environment]
[warm naturalistic color grade; Kodak Vision3 grain character; lifted blacks]
[negative: plastic surfaces, AI smoothed skin, temporal flickering, hand morphing, text overlays, watermarks, wildlife]`;
}
