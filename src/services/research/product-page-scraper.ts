/**
 * Product page scraper — extracts real product images and description
 * from a specific product URL (Amazon PDP, brand DTC page, etc.)
 *
 * This is the PRIMARY source of product truth. User-supplied product URLs
 * override any AI inferences about what the product looks like.
 */
import * as cheerio from "cheerio";
import { fetchWithRetry } from "./http";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioEl = any;

export interface ProductPageData {
  title: string;
  images: { url: string; alt: string; width?: number; height?: number }[];
  description: string;
  features: string[];
  price?: string;
  brand?: string;
}

/** Resolve an img src/srcset to the largest absolute URL */
function bestImageUrl(el: CheerioEl, $: cheerio.CheerioAPI, baseUrl: string): string | null {
  const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || "";
  const srcset = $(el).attr("srcset") || $(el).attr("data-srcset") || "";

  // Pick largest from srcset
  let best = src;
  if (srcset) {
    const parts = srcset.split(",").map(s => s.trim().split(/\s+/));
    const sorted = parts
      .map(p => ({ url: p[0] || "", w: parseInt(p[1]) || 0 }))
      .sort((a, b) => b.w - a.w);
    if (sorted[0]?.url) best = sorted[0].url;
  }

  if (!best) return null;
  // Filter out data URIs, SVGs, tiny placeholders
  if (best.startsWith("data:")) return null;
  if (best.endsWith(".svg")) return null;
  if (best.includes("placeholder") || best.includes("blank") || best.includes("spacer")) return null;

  try {
    return new URL(best, baseUrl).toString();
  } catch {
    return null;
  }
}

/** Score how product-relevant an image is */
function scoreImage(url: string, alt: string, context: { title: string }): number {
  let score = 0;
  const urlL = url.toLowerCase();
  const altL = alt.toLowerCase();
  const titleL = context.title.toLowerCase();

  // Product-specific URL patterns
  if (urlL.includes("product") || urlL.includes("pdp") || urlL.includes("item")) score += 8;
  if (urlL.includes("main") || urlL.includes("hero") || urlL.includes("primary")) score += 6;
  if (urlL.includes("01") || urlL.includes("_1") || urlL.includes("-1.")) score += 4; // first image
  if (urlL.includes("media") || urlL.includes("cdn") || urlL.includes("assets")) score += 3;

  // Amazon-specific patterns
  if (urlL.includes("ssl-images-amazon") || urlL.includes("m.media-amazon")) score += 10;
  if (urlL.match(/\._[A-Z]+_\./)) score += 8; // Amazon image sizing suffix

  // Shopify / DTC patterns
  if (urlL.includes("cdn.shopify") || urlL.includes("shopifycdn")) score += 8;

  // Alt text matches product title words
  const titleWords = titleL.split(/\s+/).filter(w => w.length > 3);
  for (const w of titleWords) {
    if (altL.includes(w)) score += 3;
  }

  // Prefer JPG/WEBP/PNG
  if (/\.(jpg|jpeg|webp|png)/i.test(url)) score += 2;

  // Penalize clearly non-product images
  if (urlL.includes("logo") || urlL.includes("icon") || urlL.includes("banner")) score -= 10;
  if (urlL.includes("avatar") || urlL.includes("profile")) score -= 10;
  if (urlL.includes("badge") || urlL.includes("cert") || urlL.includes("award")) score -= 5;

  return score;
}

export async function scrapeProductPage(url: string): Promise<ProductPageData> {
  const res = await fetchWithRetry(
    url,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
    },
    { timeoutMs: 15000 }
  );

  if (!res.ok) throw new Error(`Failed to fetch product page: ${res.status}`);

  const html = await res.text();
  const $ = cheerio.load(html);

  // Remove noise
  $("script, style, noscript, iframe, nav, footer, header").remove();

  // ── Title ──
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $('meta[name="twitter:title"]').attr("content") ||
    $('[data-automation="product-name"]').first().text() ||
    $("h1").first().text() ||
    $("title").text() ||
    "";

  // ── Images ──
  const seen = new Set<string>();
  const candidates: { url: string; alt: string; score: number }[] = [];

  // Amazon-specific: main image + gallery thumbnails
  const amazonSelectors = [
    "#imgTagWrapperId img",
    "#main-image-container img",
    "#altImages img",
    ".imgTagWrapper img",
    '[data-a-image-name] img',
  ];
  for (const sel of amazonSelectors) {
    $(sel).each((_, el) => {
      const imgUrl = bestImageUrl(el as CheerioEl, $, url);
      if (!imgUrl || seen.has(imgUrl)) return;

      // For Amazon, use the dynamic-images URL pattern to get full size
      const hiRes = imgUrl
        .replace(/\._[A-Z]+_\./g, ".")
        .replace(/_SY[\d]+_|_SX[\d]+_|_SS[\d]+_|_SR[\d]+,[\d]+_/g, "");

      const finalUrl = hiRes !== imgUrl ? hiRes : imgUrl;
      if (seen.has(finalUrl)) return;

      seen.add(finalUrl);
      seen.add(imgUrl);
      const alt = $(el).attr("alt") || "";
      candidates.push({ url: finalUrl, alt, score: scoreImage(finalUrl, alt, { title }) + 15 });
    });
  }

  // DTC / Shopify product image selectors
  const productSelectors = [
    ".product__media img",
    ".product-media img",
    "[data-product-image] img",
    ".product-image img",
    ".pdp-image img",
    ".product-gallery img",
    ".product-photo img",
    '[class*="product-image"] img',
    '[class*="ProductImage"] img',
    '[class*="product_image"] img',
    ".swiper-slide img",
    ".slick-slide img",
  ];

  for (const sel of productSelectors) {
    $(sel).each((_, el) => {
      const imgUrl = bestImageUrl(el as CheerioEl, $, url);
      if (!imgUrl || seen.has(imgUrl)) return;
      seen.add(imgUrl);
      const alt = $(el).attr("alt") || "";
      candidates.push({ url: imgUrl, alt, score: scoreImage(imgUrl, alt, { title }) + 10 });
    });
  }

  // Fallback: OpenGraph image
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage && !seen.has(ogImage)) {
    try {
      const absOg = new URL(ogImage, url).toString();
      if (!seen.has(absOg)) {
        seen.add(absOg);
        candidates.push({ url: absOg, alt: title, score: 12 });
      }
    } catch { /* skip */ }
  }

  // Last fallback: all imgs on page
  if (candidates.length < 3) {
    $("img").each((_, el) => {
      const imgUrl = bestImageUrl(el as CheerioEl, $, url);
      if (!imgUrl || seen.has(imgUrl)) return;
      seen.add(imgUrl);
      const alt = $(el).attr("alt") || "";
      const s = scoreImage(imgUrl, alt, { title });
      if (s > 0) candidates.push({ url: imgUrl, alt, score: s });
    });
  }

  // Sort by score, deduplicate by similarity, take top 6
  candidates.sort((a, b) => b.score - a.score);
  const images = candidates.slice(0, 6).map(c => ({ url: c.url, alt: c.alt }));

  // ── Description ──
  const descriptionSources = [
    $('meta[name="description"]').attr("content"),
    $('meta[property="og:description"]').attr("content"),
    $('[data-automation="product-description"]').text(),
    $(".product-description").text(),
    $(".product__description").text(),
    $("#feature-bullets").text(),
    $("#productDescription").text(),
    $('[class*="description"]').first().text(),
  ].filter(Boolean) as string[];

  const description = descriptionSources[0]?.trim().slice(0, 1000) || "";

  // ── Features / bullet points ──
  const features: string[] = [];
  const featureSels = [
    "#feature-bullets li",
    ".product-features li",
    ".product__features li",
    '[class*="feature"] li',
    '[class*="benefit"] li',
  ];
  for (const sel of featureSels) {
    $(sel).each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10 && text.length < 300) features.push(text);
    });
    if (features.length > 0) break;
  }

  // ── Price ──
  const price =
    $('meta[property="product:price:amount"]').attr("content") ||
    $(".price").first().text().trim().slice(0, 20) ||
    undefined;

  // ── Brand ──
  const brand =
    $('meta[property="product:brand"]').attr("content") ||
    $('[data-automation="brand-name"]').text().trim() ||
    undefined;

  return {
    title: title.trim(),
    images,
    description,
    features: features.slice(0, 10),
    price,
    brand,
  };
}
