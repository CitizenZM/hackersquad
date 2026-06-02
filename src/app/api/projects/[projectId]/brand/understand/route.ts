import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import * as cheerio from "cheerio";

export const maxDuration = 60;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProductImageRecord {
  url: string;
  caption: string;
  type: "website" | "ai-full" | "ai-detail" | "ai-environment";
  source: "brand-website" | "web-search" | "ai-generated";
  environmentName?: string;
  verified?: boolean;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve relative src to absolute, filter out icons/logos/tracking pixels */
function resolveAndFilterImage(src: string, baseUrl: string): string | null {
  if (!src) return null;
  try {
    const abs = new URL(src, baseUrl).toString();
    // Skip tiny images, SVGs, data URIs, tracking pixels, icons
    if (
      abs.startsWith("data:") ||
      abs.endsWith(".svg") ||
      abs.includes("icon") ||
      abs.includes("logo") ||
      abs.includes("favicon") ||
      abs.includes("tracking") ||
      abs.includes("pixel") ||
      abs.includes("spinner")
    ) return null;
    return abs;
  } catch {
    return null;
  }
}

/** Scrape product images from brand website — tries homepage + /products page */
async function scrapeWebsiteImages(
  brandUrl: string,
  productDescription: string
): Promise<ProductImageRecord[]> {
  const results: ProductImageRecord[] = [];
  const seen = new Set<string>();

  const urlsToTry = [
    brandUrl,
    `${brandUrl.replace(/\/$/, "")}/products`,
    `${brandUrl.replace(/\/$/, "")}/vacuums`,
    `${brandUrl.replace(/\/$/, "")}/collections`,
  ];

  for (const pageUrl of urlsToTry) {
    if (results.length >= 6) break;
    try {
      const res = await fetch(pageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) continue;

      const html = await res.text();
      const $ = cheerio.load(html);

      // Priority: product images with meaningful alt text, large srcset images
      const candidates: { url: string; alt: string; score: number }[] = [];

      $("img").each((_, el) => {
        const alt = $(el).attr("alt")?.trim() || "";
        const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
        const srcset = $(el).attr("srcset") || "";

        // Pick largest srcset URL if available
        let bestSrc = src;
        if (srcset) {
          const parts = srcset.split(",").map(s => s.trim().split(/\s+/));
          const sorted = parts.sort((a, b) => {
            const wa = parseInt(a[1]) || 0;
            const wb = parseInt(b[1]) || 0;
            return wb - wa;
          });
          if (sorted[0]?.[0]) bestSrc = sorted[0][0];
        }

        const resolved = resolveAndFilterImage(bestSrc, pageUrl);
        if (!resolved || seen.has(resolved)) return;

        // Score based on relevance signals
        let score = 0;
        const altLower = alt.toLowerCase();
        const srcLower = resolved.toLowerCase();
        if (altLower.includes("vacuum") || altLower.includes("shark") || altLower.includes("cleaner")) score += 10;
        if (altLower.includes("ninja") || altLower.includes("product")) score += 5;
        if (srcLower.includes("product") || srcLower.includes("pdp")) score += 8;
        if (srcLower.includes("cdn") || srcLower.includes("media")) score += 3;
        if (srcLower.includes("lifestyle") || srcLower.includes("use")) score += 6;
        if (alt && alt.length > 5) score += 2;
        // Prefer larger images (jpg/webp/png, not gif)
        if (/\.(jpg|jpeg|webp|png)(\?|$)/i.test(resolved)) score += 4;
        if (score < 3) return; // skip irrelevant

        candidates.push({ url: resolved, alt, score });
        seen.add(resolved);
      });

      // Sort by score, take top images
      candidates.sort((a, b) => b.score - a.score);
      for (const c of candidates.slice(0, 4)) {
        if (results.length >= 6) break;
        results.push({
          url: c.url,
          caption: c.alt || "Product image from brand website",
          type: "website",
          source: "brand-website",
          verified: false,
        });
      }
    } catch {
      // continue to next URL
    }
  }

  return results;
}

/** Generate AI product image via Pollinations.ai and return data URI */
async function generateAIImage(prompt: string, width = 1024, height = 1024, seed?: number): Promise<string | null> {
  const s = seed ?? Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&nologo=true&model=flux&enhance=true`;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const b64 = Buffer.from(buffer).toString("base64");
    const mime = res.headers.get("content-type") || "image/jpeg";
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const brand = await prisma.brand.findUnique({ where: { projectId } });
  if (!brand) return NextResponse.json({ error: "Brand not found" }, { status: 404 });

  return NextResponse.json({
    productCategory: brand.productCategory,
    productDescription: brand.productDescription,
    productVerified: brand.productVerified,
    productImages: brand.productImages,
    useEnvironments: brand.useEnvironments,
    actorSettings: brand.actorSettings,
    displayGuidelines: brand.displayGuidelines,
  });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;

  const [brand, project] = await Promise.all([
    prisma.brand.findUnique({ where: { projectId } }),
    prisma.project.findUnique({ where: { id: projectId } }),
  ]);

  if (!brand || !project) {
    return NextResponse.json({ error: "Brand not found" }, { status: 404 });
  }

  const productDesc = brand.productDescription || `${brand.name} home appliance product`;
  const productCategory = brand.productCategory || "home appliance";
  const brandUrl = brand.url || project.brandUrl || "";
  const brandName = project.brandName;

  const environments = (brand.useEnvironments as Array<{
    name: string; imagePrompt: string; description: string; typicalUser: string;
  }>) || [];

  const allImages: ProductImageRecord[] = [];

  // ── Step 1: Scrape real images from brand website ──
  let websiteImages: ProductImageRecord[] = [];
  if (brandUrl) {
    websiteImages = await scrapeWebsiteImages(brandUrl, productDesc);
  }
  // Take up to 4 website images
  allImages.push(...websiteImages.slice(0, 4));

  // ── Step 2: AI-generated product images ──
  // 2a. Full product shot (white background, studio, all sides visible)
  const fullShotPrompt = `${productDesc.slice(0, 300)}, professional product photography, pure white background, studio lighting from three-point setup, product floating centered in frame, all sides visible, commercial advertising quality, 8K detail, no humans, no text, no logos except product branding, photorealistic`;

  // 2b. Detail/close-up shot (brush head, canister, handle, key features)
  const detailShotPrompt = `Extreme close-up macro photography of ${brandName} ${productCategory} key features — brush roll mechanism, suction inlet, dust canister with transparent window showing interior, power button, brand markings. Studio macro lighting, sharp focus on mechanical details, photorealistic product detail shot, white background, no humans`;

  // 2c. Full product at 3/4 angle (most natural view)
  const quarterAnglePrompt = `${productDesc.slice(0, 250)}, 3/4 angle view, professional product photography on light grey seamless background, dramatic side lighting creating depth shadows, commercial advertising quality, photorealistic, no humans, brand product shot`;

  // 2d. Product in use angle — product only, no person
  const inUseAnglePrompt = `${brandName} ${productCategory} positioned on hardwood floor near carpet edge, ready-to-use position, realistic home environment perspective, natural morning window light, no humans, photorealistic product placement shot for advertising`;

  const aiPrompts = [
    { prompt: fullShotPrompt, caption: "Full Product — Studio White", type: "ai-full" as const, w: 1024, h: 1024 },
    { prompt: detailShotPrompt, caption: "Close-up Detail — Key Features", type: "ai-detail" as const, w: 1024, h: 1024 },
    { prompt: quarterAnglePrompt, caption: "3/4 Angle — Product Form", type: "ai-full" as const, w: 1024, h: 768 },
    { prompt: inUseAnglePrompt, caption: "Product Position — Home Setting", type: "ai-detail" as const, w: 768, h: 1024 },
  ];

  for (let i = 0; i < aiPrompts.length; i++) {
    const { prompt, caption, type, w, h } = aiPrompts[i];
    const dataUri = await generateAIImage(prompt, w, h, 100 + i * 37);
    if (dataUri) {
      allImages.push({ url: dataUri, caption, type, source: "ai-generated", verified: false });
    }
  }

  // ── Step 3: Environment scenes (aligned with Insights useEnvironments) ──
  for (const env of environments.slice(0, 3)) {
    if (!env.imagePrompt) continue;

    // Enhance the imagePrompt to ensure no humans and correct product
    const envPrompt = `${env.imagePrompt}. Realistic home environment photography, cinematic composition, natural lighting, photorealistic, no human figures, product clearly visible in scene, shot on ARRI ALEXA, commercial photography quality`;

    const dataUri = await generateAIImage(envPrompt, 1024, 768, Math.floor(Math.random() * 999));
    if (dataUri) {
      allImages.push({
        url: dataUri,
        caption: `Environment: ${env.name}`,
        type: "ai-environment",
        source: "ai-generated",
        environmentName: env.name,
        verified: false,
      });
    }
  }

  // If we have fewer than 4 environment images and we have environments, add generic ones
  const envImageCount = allImages.filter(i => i.type === "ai-environment").length;
  if (envImageCount < 2 && environments.length === 0) {
    // Generate generic environment scenes for common vacuum use cases
    const genericEnvs = [
      {
        prompt: `${brandName} ${productCategory} in a modern living room, plush carpet, natural afternoon light through large windows, golden retriever fur visible on carpet, product positioned ready for use, photorealistic, no humans`,
        caption: "Environment: Living Room with Pet Fur",
      },
      {
        prompt: `${brandName} ${productCategory} in an open-plan kitchen with hardwood floor, morning light, debris visible on floor, product leaning against kitchen island, photorealistic, no humans`,
        caption: "Environment: Kitchen & Hardwood",
      },
    ];
    for (const { prompt, caption } of genericEnvs) {
      const dataUri = await generateAIImage(prompt, 1024, 768);
      if (dataUri) {
        allImages.push({ url: dataUri, caption, type: "ai-environment", source: "ai-generated", verified: false });
      }
    }
  }

  await prisma.brand.update({
    where: { projectId },
    data: { productImages: allImages as never },
  });

  const summary = {
    total: allImages.length,
    website: allImages.filter(i => i.source === "brand-website").length,
    aiProduct: allImages.filter(i => i.source === "ai-generated" && i.type !== "ai-environment").length,
    environment: allImages.filter(i => i.type === "ai-environment").length,
  };

  return NextResponse.json({ productImages: allImages, summary });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));

  const updateData: Record<string, unknown> = {};
  if ("productVerified" in body) updateData.productVerified = body.productVerified;
  if ("productDescription" in body) updateData.productDescription = body.productDescription;
  if ("productCategory" in body) updateData.productCategory = body.productCategory;
  if ("displayGuidelines" in body) updateData.displayGuidelines = body.displayGuidelines;
  if ("productImages" in body) updateData.productImages = body.productImages;

  const brand = await prisma.brand.update({
    where: { projectId },
    data: updateData,
  });

  return NextResponse.json(brand);
}
