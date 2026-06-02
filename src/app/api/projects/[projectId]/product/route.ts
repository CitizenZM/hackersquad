/**
 * Product definition API
 * GET  — returns current product definition (url, name, images, description)
 * POST — scrape a product URL and save results as the canonical product source
 * PATCH — update product fields (name, description) or save user-uploaded images
 */
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scrapeProductPage } from "@/services/research/product-page-scraper";

export const maxDuration = 30;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      productUrl: true,
      productName: true,
      productPageTitle: true,
      productPageImages: true,
      productPageText: true,
      userProductImages: true,
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project);
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));
  const { productUrl } = body as { productUrl?: string };

  if (!productUrl) return NextResponse.json({ error: "productUrl required" }, { status: 400 });

  try {
    const scraped = await scrapeProductPage(productUrl);

    const project = await prisma.project.update({
      where: { id: projectId },
      data: {
        productUrl,
        productPageTitle: scraped.title,
        productPageImages: scraped.images as never,
        productPageText: [scraped.description, ...scraped.features].filter(Boolean).join("\n\n"),
        // Also set productName from scraped title if not already set
        productName: scraped.title || undefined,
      },
    });

    // Also update the brand model with product intelligence
    await prisma.brand.updateMany({
      where: { projectId },
      data: {
        productCategory: scraped.brand
          ? `${scraped.brand} — from product page`
          : undefined,
        productDescription: scraped.description || undefined,
        // Mark as not verified so user reviews the new data
        productVerified: false,
      },
    });

    return NextResponse.json({
      productUrl: project.productUrl,
      productPageTitle: project.productPageTitle,
      productPageImages: project.productPageImages,
      imageCount: scraped.images.length,
      hasDescription: !!scraped.description,
      featureCount: scraped.features.length,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to scrape product page" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params;
  const body = await req.json().catch(() => ({}));

  const allowed = ["productUrl", "productName", "productPageText", "userProductImages", "productPageImages"];
  const data: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) data[key] = body[key];
  }

  const project = await prisma.project.update({
    where: { id: projectId },
    data,
    select: {
      productUrl: true,
      productName: true,
      productPageTitle: true,
      productPageImages: true,
      productPageText: true,
      userProductImages: true,
    },
  });

  return NextResponse.json(project);
}
