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

  // Build page list — try category-specific pages first based on product description
  const base = brandUrl.replace(/\/$/, "");
  const descLower = productDescription.toLowerCase();
  const categoryPages: string[] = [];
  if (descLower.includes("vacuum") || descLower.includes("cleaner")) {
    categoryPages.push(`${base}/vacuums`, `${base}/robot-vacuums`, `${base}/cordless-vacuums`);
  }
  if (descLower.includes("kitchen") || descLower.includes("air fryer") || descLower.includes("ninja")) {
    categoryPages.push(`${base}/ninja`, `${base}/air-fryers`, `${base}/kitchen`);
  }

  const urlsToTry = [
    ...categoryPages,      // category pages first (most relevant)
    brandUrl,              // homepage fallback
    `${base}/products`,
    `${base}/collections`,
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
        const descLower = productDescription.toLowerCase();

        // Extract key product words from description to boost matching
        const productKeywords = descLower.match(/\b(vacuum|cleaner|mop|robot|upright|cordless|suction|carpet|floor|dust|canister|air fryer|blender|coffee|kitchen|appliance)\b/g) || [];

        // Boost if image alt matches product keywords
        for (const kw of productKeywords) {
          if (altLower.includes(kw)) score += 12;
        }
        if (altLower.includes("vacuum") || altLower.includes("cleaner") || altLower.includes("mop")) score += 15;
        if (altLower.includes("cordless") || altLower.includes("robot") || altLower.includes("upright")) score += 10;
        if (altLower.includes("product") || altLower.includes("hero")) score += 5;
        if (srcLower.includes("product") || srcLower.includes("pdp")) score += 8;
        if (srcLower.includes("cdn") || srcLower.includes("media")) score += 3;
        if (alt && alt.length > 5) score += 2;
        // Prefer larger images
        if (/\.(jpg|jpeg|webp|png)(\?|$)/i.test(resolved)) score += 4;
        // Penalize clearly off-category products
        if (altLower.includes("mask") || altLower.includes("hair") || altLower.includes("beauty") || altLower.includes("flexstyle") || altLower.includes("cryo")) score -= 20;
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

/**
 * Generate AI image via Pollinations.ai.
 * Returns a Pollinations URL (not data URI) so it loads lazily in the browser.
 * Verifies the URL responds with a HEAD request within timeout.
 */
async function generateAIImage(prompt: string, width = 1024, height = 1024, seed?: number): Promise<string | null> {
  const s = seed ?? Math.floor(Math.random() * 999999);
  const encoded = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&seed=${s}&nologo=true&model=flux&enhance=true&nofeed=true`;
  // Return URL directly — browser will fetch/render it lazily, avoiding server timeout
  return url;
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

  // Primary source: real images scraped from user-specified product page URL
  // These are the ground truth — use them directly instead of generating AI images
  // that may not match the actual product appearance.
  const productPageImages = (project.productPageImages as Array<{ url: string; alt: string }> | null) || [];
  const userProductImages = (project.userProductImages as Array<{ url: string; caption: string }> | null) || [];

  const environments = (brand.useEnvironments as Array<{
    name: string; imagePrompt: string; description: string; typicalUser: string;
  }>) || [];

  const allImages: ProductImageRecord[] = [];

  // ── Step 1a: Product page images (PRIMARY — user-specified, exact product) ──
  if (productPageImages.length > 0) {
    for (const img of productPageImages.slice(0, 4)) {
      allImages.push({
        url: img.url,
        caption: img.alt || "Product image from product page",
        type: "website",
        source: "brand-website",
        verified: false,
      });
    }
  }

  // ── Step 1b: User-uploaded images (also primary truth) ──
  if (userProductImages.length > 0) {
    for (const img of userProductImages.slice(0, 4)) {
      allImages.push({
        url: img.url,
        caption: img.caption || "User uploaded product image",
        type: "website",
        source: "brand-website",
        verified: false,
      });
    }
  }

  // ── Step 1c: Fallback — scrape brand website if no product URL images ──
  if (allImages.length < 2 && brandUrl) {
    const websiteImages = await scrapeWebsiteImages(brandUrl, productDesc);
    allImages.push(...websiteImages.slice(0, 4 - allImages.length));
  }

  // ── Step 2: AI-generated product verification images ──
  // Use product page title if available for accurate product naming
  const productRef = project.productPageTitle || project.productName || `${brandName} ${productCategory}`;
  const productDescRef = project.productPageText?.slice(0, 300) || productDesc.slice(0, 300);

  // 2a. Full product shot (white background, studio, all sides visible)
  const fullShotPrompt = `${productRef}, ${productDescRef}, professional product photography, pure white background, studio three-point lighting, all product angles visible, commercial advertising quality, photorealistic, no humans, no text`;

  // 2b. Detail/close-up shot — key mechanical/functional features
  const detailShotPrompt = `Extreme close-up macro photography showing the key features and mechanical details of ${productRef}. Studio macro lighting from above, tack-sharp focus on functional parts, white background, photorealistic product detail, no humans`;

  // 2c. Full product at 3/4 angle
  const quarterAnglePrompt = `${productRef}, 3/4 front angle, light grey seamless background, dramatic side rim lighting, shadows showing product depth and form, commercial advertising quality, photorealistic, no humans`;

  // 2d. Product in realistic home/use setting — product only
  const inUseAnglePrompt = `${productRef} positioned in a realistic home environment showing its typical use context, natural morning light, no humans in frame, photorealistic, commercial photography style`;

  const aiPrompts = [
    { prompt: fullShotPrompt, caption: "Full Product — Studio White", type: "ai-full" as const, w: 1024, h: 1024 },
    { prompt: detailShotPrompt, caption: "Close-up Detail — Key Features", type: "ai-detail" as const, w: 1024, h: 1024 },
    { prompt: quarterAnglePrompt, caption: "3/4 Angle — Product Form", type: "ai-full" as const, w: 1024, h: 768 },
    { prompt: inUseAnglePrompt, caption: "Product Position — Home Setting", type: "ai-detail" as const, w: 768, h: 1024 },
  ];

  // Generate all AI product images in parallel
  const aiResults = await Promise.all(
    aiPrompts.map(async ({ prompt, caption, type, w, h }, i) => {
      const url = await generateAIImage(prompt, w, h, 100 + i * 37);
      if (!url) return null;
      return { url, caption, type, source: "ai-generated" as const, verified: false };
    })
  );
  allImages.push(...(aiResults.filter(r => r !== null) as ProductImageRecord[]));

  // ── Step 3: Environment scenes (aligned with Insights useEnvironments) ──
  const envList = environments.length > 0 ? environments.slice(0, 3) : [
    {
      name: "Living Room with Pet Fur",
      imagePrompt: `${brandName} ${productCategory} positioned on plush carpet in a modern living room, golden retriever fur visible on carpet, natural afternoon light through large windows, product ready for use, photorealistic, no humans`,
    },
    {
      name: "Kitchen Hardwood Floor",
      imagePrompt: `${brandName} ${productCategory} in an open-plan kitchen with light oak hardwood floor, morning light, debris visible, product leaning against kitchen island, photorealistic, no humans`,
    },
    {
      name: "Bedroom Carpet",
      imagePrompt: `${brandName} ${productCategory} in a bright bedroom with plush grey carpet, large windows with sheer curtains, product in use position, cinematic natural light, photorealistic, no humans`,
    },
  ];

  const envResults = await Promise.all(
    envList.map(async (env) => {
      const envPrompt = `${env.imagePrompt || env.name}. Realistic home environment photography, cinematic composition, natural lighting, photorealistic, no human figures, product clearly visible and correctly depicted, commercial photography quality`;
      const url = await generateAIImage(envPrompt, 1024, 768, Math.floor(Math.random() * 999));
      if (!url) return null;
      return {
        url,
        caption: `Environment: ${env.name}`,
        type: "ai-environment" as const,
        source: "ai-generated" as const,
        environmentName: env.name,
        verified: false,
      };
    })
  );
  allImages.push(...(envResults.filter(r => r !== null) as ProductImageRecord[]));

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
